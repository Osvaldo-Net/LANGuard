from auth import *
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from collections import defaultdict
from datetime import datetime
import subprocess, re, os, socket, threading, time, requests, logging
from db import get_db

# ──────────────────────────────────────────────
#  CONFIGURACIÓN
# ──────────────────────────────────────────────
TIEMPO_BLOQUEO    = 300
CACHE_INTERVALO   = 120
INTENTOS_MAXIMOS  = 3
HISTORIAL_DIAS    = 30

CACHE_RESULTADO   = []
_cache_lock       = threading.Lock()
_estado_anterior  = {}   # mac → dict del dispositivo (para detectar cambios)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "lan_guard_secret")

iniciar_archivo_usuarios()

# ──────────────────────────────────────────────
#  LOG
# ──────────────────────────────────────────────
logger  = logging.getLogger("accesos")
logger.setLevel(logging.INFO)
handler = logging.FileHandler("data/accesos.log")
logger.addHandler(handler)

def registrar_log(m): logger.info(m)

# ──────────────────────────────────────────────
#  LOGIN / LOGOUT
# ──────────────────────────────────────────────
@app.route("/logout")
def logout():
    usuario = session.get("usuario")
    session.clear()
    registrar_log(f"Usuario {usuario} cerró sesión")
    return redirect("/login")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario   = request.form["usuario"]
        contrasena = request.form["contrasena"]
        if verificar_login(usuario, contrasena):
            session["usuario"] = usuario
            if es_usuario_por_defecto(usuario) and es_contrasena_por_defecto(usuario):
                return redirect("/cambiar-credenciales")
            return redirect("/")
        return render_template("login.html", error="Usuario o contraseña incorrectos")
    return render_template("login.html")


@app.route("/cambiar-credenciales", methods=["GET", "POST"])
def cambiar_credenciales():
    if "usuario" not in session:
        return redirect("/login")
    if request.method == "POST":
        nuevo_usuario = request.form["nuevo_usuario"].strip().lower()
        nueva         = request.form["nueva_contrasena"]
        confirmar     = request.form["confirmar_contrasena"]

        if not re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", nuevo_usuario):
            return render_template("cambiar_credenciales.html", error="El usuario debe ser un correo válido")
        if nueva != confirmar:
            return render_template("cambiar_credenciales.html", error="Las contraseñas no coinciden")
        if not es_contrasena_segura(nueva):
            return render_template("cambiar_credenciales.html", error="La contraseña no cumple los requisitos de seguridad")

        cambiar_usuario(session["usuario"], nuevo_usuario)
        cambiar_contrasena_usuario(nuevo_usuario, nueva)
        session["usuario"] = nuevo_usuario
        return redirect("/")
    return render_template("cambiar_credenciales.html")


# ──────────────────────────────────────────────
#  HELPERS DB
# ──────────────────────────────────────────────
def obtener_confiables():
    db   = get_db()
    rows = db.execute("SELECT mac FROM mac_confiables").fetchall()
    db.close()
    return {r["mac"].lower() for r in rows}


def obtener_nombre(mac):
    db  = get_db()
    row = db.execute("SELECT nombre FROM nombres_dispositivos WHERE mac = ?", (mac,)).fetchone()
    db.close()
    return row["nombre"] if row else None


def guardar_nombre(mac, nombre):
    db = get_db()
    db.execute("""
        INSERT INTO nombres_dispositivos (mac, nombre)
        VALUES (?, ?)
        ON CONFLICT(mac) DO UPDATE SET nombre = excluded.nombre
    """, (mac, nombre))
    db.commit()
    db.close()


def obtener_vendor_cache(oui):
    db  = get_db()
    row = db.execute("SELECT fabricante FROM vendor_cache WHERE oui = ?", (oui,)).fetchone()
    db.close()
    return row["fabricante"] if row else None


def guardar_vendor_cache(oui, fabricante):
    db = get_db()
    db.execute("""
        INSERT INTO vendor_cache (oui, fabricante)
        VALUES (?, ?)
        ON CONFLICT(oui) DO UPDATE SET fabricante = excluded.fabricante
    """, (oui, fabricante))
    db.commit()
    db.close()


def obtener_deteccion(mac):
    db  = get_db()
    row = db.execute("SELECT * FROM detecciones_mac WHERE mac = ?", (mac,)).fetchone()
    db.close()
    return row


def guardar_deteccion(mac, count, notificado, ultima):
    db = get_db()
    db.execute("""
        INSERT INTO detecciones_mac (mac, count, notificado, ultima_vista)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(mac) DO UPDATE SET
            count        = excluded.count,
            notificado   = excluded.notificado,
            ultima_vista = excluded.ultima_vista
    """, (mac, count, int(notificado), ultima))
    db.commit()
    db.close()


def obtener_confiables_con_nombre():
    db   = get_db()
    rows = db.execute("""
        SELECT c.mac, n.nombre
        FROM mac_confiables c
        LEFT JOIN nombres_dispositivos n ON c.mac = n.mac
        ORDER BY c.mac
    """).fetchall()
    db.close()
    return rows


# ──────────────────────────────────────────────
#  HISTORIAL — solo registra cambios (conectado / desconectado)
# ──────────────────────────────────────────────
def guardar_historial(dispositivos: list, ahora: float):
    """Registra SOLO cuando un dispositivo aparece o desaparece."""
    global _estado_anterior

    macs_actuales   = {d["mac"] for d in dispositivos}
    macs_anteriores = set(_estado_anterior.keys())

    nuevos        = macs_actuales - macs_anteriores
    desconectados = macs_anteriores - macs_actuales

    registros = []

    for d in dispositivos:
        if d["mac"] in nuevos:
            registros.append({**d, "evento": "conectado", "ahora": ahora})

    for mac in desconectados:
        d = _estado_anterior[mac]
        registros.append({**d, "evento": "desconectado", "ahora": ahora})

    # Actualizar estado anterior SIEMPRE
    _estado_anterior = {d["mac"]: d for d in dispositivos}

    if not registros:
        return

    db = get_db()
    db.executemany("""
        INSERT INTO historial_dispositivos
            (mac, ip, fabricante, confiable, nombre, visto_en, evento)
        VALUES (:mac, :ip, :fabricante, :confiable, :nombre, :ahora, :evento)
    """, registros)

    # Limpieza automática
    limite = ahora - HISTORIAL_DIAS * 86400
    db.execute("DELETE FROM historial_dispositivos WHERE visto_en < ?", (limite,))
    db.commit()
    db.close()


# ──────────────────────────────────────────────
#  FABRICANTE
# ──────────────────────────────────────────────
def obtener_fabricante(mac):
    oui = mac.replace(":", "")[:6].upper()
    fab = obtener_vendor_cache(oui)
    if fab:
        return fab
    try:
        resp = requests.get(f"https://api.maclookup.app/v2/macs/{mac}", timeout=5)
        fab  = resp.json().get("company") or "Desconocido"
    except Exception:
        fab  = "Desconocido"
    if fab != "Desconocido":
        guardar_vendor_cache(oui, fab)
    return fab


# ──────────────────────────────────────────────
#  RED
# ──────────────────────────────────────────────
def obtener_red_local():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    return f"{ip}/24"


# ──────────────────────────────────────────────
#  ESCANEO
# ──────────────────────────────────────────────
def escanear_red():
    red        = obtener_red_local()
    ahora      = time.time()
    confiables = obtener_confiables()

    salida = subprocess.check_output(
        ["nmap", "-sn", "-PR", "-T3", "-n", red],
        timeout=60
    ).decode()

    ips_vivas = [
        linea.split()[-1]
        for linea in salida.splitlines()
        if "Nmap scan report for" in linea
    ]

    arp_table = {}
    try:
        salida_arp = subprocess.check_output(["ip", "neigh", "show"]).decode()
        for linea in salida_arp.splitlines():
            if not any(s in linea.upper() for s in ["REACHABLE", "STALE"]):
                continue
            m = re.match(
                r"(\d+\.\d+\.\d+\.\d+)\s+dev\s+\S+\s+lladdr\s+([\da-f:]{17})",
                linea, re.I
            )
            if m:
                ip_arp, mac_arp = m.groups()
                arp_table[ip_arp] = mac_arp.lower()
    except Exception as e:
        print(f"[!] Error leyendo ARP: {e}")

    dispositivos = []

    for ip in ips_vivas:
        mac = arp_table.get(ip)
        if not mac:
            continue

        fab       = obtener_fabricante(mac)
        confiable = mac in confiables
        nombre    = obtener_nombre(mac)

        dispositivos.append({
            "ip":        ip,
            "mac":       mac,
            "fabricante": fab,
            "confiable": confiable,
            "nombre":    nombre
        })

        if not confiable:
            reg = obtener_deteccion(mac)
            if not reg:
                guardar_deteccion(mac, 1, False, ahora)
            else:
                count      = reg["count"] + 1
                notificado = reg["notificado"]
                guardar_deteccion(mac, count, notificado, ahora)
                if count >= 3 and not notificado:
                    enviar_telegram(mac, ip, fab)
                    guardar_deteccion(mac, count, True, ahora)

    threading.Thread(
        target=guardar_historial,
        args=(dispositivos, ahora),
        daemon=True
    ).start()

    return dispositivos


# ──────────────────────────────────────────────
#  PUERTOS
# ──────────────────────────────────────────────
@app.route('/api/puertos', methods=['POST'])
def api_puertos():
    data = request.get_json()
    ip   = data.get("ip", "").strip()
    if not ip:
        return jsonify({"success": False, "message": "IP no proporcionada"})
    try:
        salida  = subprocess.check_output(
            ["nmap", "-T4", "-sT", "--top-ports", "100", "--open", "-n", ip],
            timeout=20
        ).decode()
        puertos = [
            {"puerto": p.split()[0], "servicio": p.split()[-1]}
            for p in salida.splitlines()
            if "/tcp" in p and "open" in p
        ]
        return jsonify({"success": True, "puertos": puertos})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


# ──────────────────────────────────────────────
#  HISTORIAL — ruta API
# ──────────────────────────────────────────────
@app.route('/api/historial/limpiar', methods=['POST'])
def api_historial_limpiar():
    if 'usuario' not in session:
        return jsonify({"error": "No autorizado"}), 401
    db = get_db()
    db.execute("DELETE FROM historial_dispositivos")
    db.commit()
    db.close()
    return jsonify({"success": True})


@app.route('/api/historial')
def api_historial():
    if 'usuario' not in session:
        return jsonify({"error": "No autorizado"}), 401

    mac    = request.args.get("mac", "").lower()
    evento = request.args.get("evento", "").lower()
    limit  = min(int(request.args.get("limit", 100)), 500)

    db     = get_db()
    where  = []
    params = []

    if mac:
        where.append("mac = ?")
        params.append(mac)
    if evento in ("conectado", "desconectado"):
        where.append("evento = ?")
        params.append(evento)

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""
    params.append(limit)

    rows = db.execute(f"""
        SELECT mac, ip, fabricante, confiable, nombre, evento,
               datetime(visto_en, 'unixepoch', 'localtime') AS fecha
        FROM historial_dispositivos
        {where_sql}
        ORDER BY visto_en DESC
        LIMIT ?
    """, params).fetchall()
    db.close()

    return jsonify([dict(r) for r in rows])


# ──────────────────────────────────────────────
#  CACHE Y BACKGROUND
# ──────────────────────────────────────────────
def actualizar_cache():
    global CACHE_RESULTADO
    resultado = escanear_red()
    with _cache_lock:
        CACHE_RESULTADO = resultado


def escaneo_background():
    while True:
        try:
            actualizar_cache()
        except Exception as e:
            print(f"[!] Error en escaneo background: {e}")
        time.sleep(CACHE_INTERVALO)


# ──────────────────────────────────────────────
#  RUTAS PRINCIPALES
# ──────────────────────────────────────────────
@app.route('/')
def index():
    if 'usuario' not in session:
        return redirect('/login')
    with _cache_lock:
        devs = list(CACHE_RESULTADO)
    return render_template(
        "index.html",
        dispositivos=devs,
        lista_confiables=obtener_confiables_con_nombre()
    )


@app.route('/api/scan')
def api_scan():
    if 'usuario' not in session:
        return jsonify({"error": "No autorizado"}), 401
    with _cache_lock:
        return jsonify(list(CACHE_RESULTADO))


@app.route('/api/agregar', methods=['POST'])
def api_agregar():
    mac = request.json["mac"].lower()
    db  = get_db()
    db.execute("INSERT OR IGNORE INTO mac_confiables (mac) VALUES (?)", (mac,))
    db.commit()
    db.close()
    actualizar_cache()
    return jsonify({"success": True})


@app.route('/api/eliminar', methods=['POST'])
def api_eliminar():
    mac = request.json["mac"].lower()
    db  = get_db()
    db.execute("DELETE FROM mac_confiables WHERE mac = ?", (mac,))
    db.commit()
    db.close()
    actualizar_cache()
    return jsonify({"success": True})


@app.route('/api/nombrar', methods=['POST'])
def api_nombrar():
    mac    = request.json["mac"].lower()
    nombre = request.json["nombre"]
    guardar_nombre(mac, nombre)

    global CACHE_RESULTADO
    with _cache_lock:
        for d in CACHE_RESULTADO:
            if d["mac"] == mac:
                d["nombre"] = nombre

    return jsonify({"success": True, "mac": mac, "nombre": nombre})


# ──────────────────────────────────────────────
#  TELEGRAM
# ──────────────────────────────────────────────
def enviar_telegram(mac, ip, fab):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat  = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return
    msg = f"🚨 NUEVO DISPOSITIVO\nIP: {ip}\nMAC: {mac}\nFAB: {fab}"
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data={"chat_id": chat, "text": msg},
            timeout=5
        )
    except Exception:
        pass


# ──────────────────────────────────────────────
#  MAIN
# ──────────────────────────────────────────────
if __name__ == '__main__':
    threading.Thread(target=escaneo_background, daemon=True).start()
    app.run(host='0.0.0.0', port=5555)
