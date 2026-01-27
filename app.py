from auth import *
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from collections import defaultdict
from datetime import datetime
import subprocess, re, os, socket, ipaddress, threading, time, requests, logging
from db import get_db

TIEMPO_BLOQUEO = 300
CACHE_INTERVALO = 60
INTENTOS_MAXIMOS = 3

INTENTOS_FALLIDOS = defaultdict(int)
BLOQUEOS = {}

CACHE_RESULTADO = []

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "lan_guard_secret")

iniciar_archivo_usuarios()

# ---------------- LOG ----------------
logger = logging.getLogger("accesos")
logger.setLevel(logging.INFO)
handler = logging.FileHandler("data/accesos.log")
logger.addHandler(handler)

def registrar_log(m): logger.info(m)

# ---------------- LOGIN ----------------

@app.route("/logout")
def logout():
    usuario = session.get("usuario")
    session.clear()
    registrar_log(f"Usuario {usuario} cerró sesión")
    return redirect("/login")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form["usuario"]
        contrasena = request.form["contrasena"]

        if verificar_login(usuario, contrasena):
            session["usuario"] = usuario

            # Forzar cambio de contraseña si es default
            if es_usuario_por_defecto(usuario) and es_contrasena_por_defecto(usuario):
                return redirect("/cambiar-credenciales")

            return redirect("/")
        else:
            return render_template("login.html", error="Usuario o contraseña incorrectos")

    return render_template("login.html")

# ---------------- CAMBIAR CONTRASEÑA ----------------

@app.route("/cambiar-credenciales", methods=["GET", "POST"])
def cambiar_credenciales():
    if "usuario" not in session:
        return redirect("/login")

    if request.method == "POST":
        nuevo_usuario = request.form["nuevo_usuario"].strip().lower()
        nueva = request.form["nueva_contrasena"]
        confirmar = request.form["confirmar_contrasena"]

        # validar correo
        if not re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", nuevo_usuario):
            return render_template("cambiar_credenciales.html",
                                   error="El usuario debe ser un correo válido")

        # validar passwords iguales
        if nueva != confirmar:
            return render_template("cambiar_credenciales.html",
                                   error="Las contraseñas no coinciden")

        # validar seguridad
        if not es_contrasena_segura(nueva):
            return render_template("cambiar_credenciales.html",
                                   error="La contraseña no cumple los requisitos de seguridad")

        # actualizar datos
        cambiar_usuario(session["usuario"], nuevo_usuario)
        cambiar_contrasena_usuario(nuevo_usuario, nueva)

        # actualizar sesión
        session["usuario"] = nuevo_usuario

        return redirect("/")

    return render_template("cambiar_credenciales.html")


# ---------------- HELPERS DB ----------------

def obtener_confiables():
    db = get_db()
    rows = db.execute("SELECT mac FROM mac_confiables").fetchall()
    db.close()
    return {r["mac"].lower() for r in rows}


def obtener_nombre(mac):
    db = get_db()
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
    db = get_db()
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
    db = get_db()
    row = db.execute("SELECT * FROM detecciones_mac WHERE mac = ?", (mac,)).fetchone()
    db.close()
    return row

def guardar_deteccion(mac, count, notificado, ultima):
    db = get_db()
    db.execute("""
    INSERT INTO detecciones_mac (mac, count, notificado, ultima_vista)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(mac) DO UPDATE SET
        count=excluded.count,
        notificado=excluded.notificado,
        ultima_vista=excluded.ultima_vista
    """, (mac, count, int(notificado), ultima))
    db.commit()
    db.close()

def obtener_confiables_con_nombre():
    db = get_db()
    rows = db.execute("""
        SELECT c.mac, n.nombre
        FROM mac_confiables c
        LEFT JOIN nombres_dispositivos n
        ON c.mac = n.mac
        ORDER BY c.mac
    """).fetchall()
    db.close()
    return rows

# ---------------- FABRICANTE ----------------

def obtener_fabricante(mac):
    oui = mac.replace(":", "")[:6]
    fab = obtener_vendor_cache(oui)
    if fab: return fab

    try:
        resp = requests.get(f"https://api.maclookup.app/v2/macs/{mac}", timeout=5)
        fab = resp.json().get("company", "Desconocido")
    except:
        fab = "Desconocido"

    if fab != "Desconocido":
        guardar_vendor_cache(oui, fab)

    return fab

# ---------------- RED ----------------

def obtener_red_local():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    return f"{ip}/24"

# ---------------- ESCANEO ----------------

def escanear_red():
    red = obtener_red_local()
    ahora = time.time()
    confiables = obtener_confiables()

    salida = subprocess.check_output(["nmap", "-sn", "-PR", red]).decode()

    ips_vivas = []
    for linea in salida.splitlines():
        if "Nmap scan report for" in linea:
            ip = linea.split()[-1]
            ips_vivas.append(ip)

    arp_table = {}
    try:
        salida_arp = subprocess.check_output(["ip", "neigh", "show"]).decode()

        for linea in salida_arp.splitlines():
            if not any(state in linea.upper() for state in ["REACHABLE", "STALE"]):
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
            continue  # sin MAC no sirve para control

        fab = obtener_fabricante(mac)
        confiable = mac in confiables
        nombre = obtener_nombre(mac)

        dispositivos.append({
            "ip": ip,
            "mac": mac,
            "fabricante": fab,
            "confiable": confiable,
            "nombre": nombre
        })

        # ---- TU lógica intacta ----
        if not confiable:
            reg = obtener_deteccion(mac)
            if not reg:
                guardar_deteccion(mac, 1, False, ahora)
            else:
                count = reg["count"] + 1
                notificado = reg["notificado"]
                guardar_deteccion(mac, count, notificado, ahora)

                if count >= 3 and not notificado:
                    enviar_telegram(mac, ip, fab)
                    guardar_deteccion(mac, count, True, ahora)

    return dispositivos


# ---------------- PUERTOS ----------------

@app.route('/api/puertos', methods=['POST'])
def api_puertos():
    data = request.get_json()
    ip = data.get("ip", "").strip()
    if not ip:
        return jsonify({"success": False, "message": "IP no proporcionada"})
    try:
        salida = subprocess.check_output(
            ["nmap", "-T4", "-sT", "--top-ports", "100", "--open", ip],
            timeout=20).decode()
        puertos = [{
            "puerto": p.split()[0],
            "servicio": p.split()[-1]
        } for p in salida.splitlines() if "/tcp" in p and "open" in p]
        return jsonify({"success": True, "puertos": puertos})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# ---------------- CACHE ----------------

def actualizar_cache():
    global CACHE_RESULTADO
    CACHE_RESULTADO = escanear_red()

def escaneo_background():
    while True:
        actualizar_cache()
        time.sleep(CACHE_INTERVALO)

# ---------------- RUTAS ----------------

@app.route('/')
def index():
    if 'usuario' not in session:
        return redirect('/login')
    return render_template(
        "index.html",
        dispositivos=CACHE_RESULTADO,
        lista_confiables=obtener_confiables_con_nombre()
    )

@app.route('/api/scan')
def api_scan():
    if 'usuario' not in session:
        return jsonify({"error": "No autorizado"}), 401
    return jsonify(CACHE_RESULTADO)

@app.route('/api/agregar', methods=['POST'])
def api_agregar():
    mac = request.json["mac"].lower()
    db = get_db()
    db.execute("INSERT OR IGNORE INTO mac_confiables (mac) VALUES (?)", (mac,))
    db.commit()
    db.close()
    actualizar_cache()
    return jsonify({"success": True})

@app.route('/api/eliminar', methods=['POST'])
def api_eliminar():
    mac = request.json["mac"].lower()
    db = get_db()
    db.execute("DELETE FROM mac_confiables WHERE mac = ?", (mac,))
    db.commit()
    db.close()
    actualizar_cache()
    return jsonify({"success": True})

@app.route('/api/nombrar', methods=['POST'])
def api_nombrar():
    mac = request.json["mac"].lower()
    nombre = request.json["nombre"]

    guardar_nombre(mac, nombre)

    # actualizar cache escaneo
    global CACHE_RESULTADO
    for d in CACHE_RESULTADO:
        if d["mac"] == mac:
            d["nombre"] = nombre

    return jsonify({
        "success": True,
        "mac": mac,
        "nombre": nombre
    })


# ---------------- TELEGRAM ----------------

def enviar_telegram(mac, ip, fab):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat: return

    msg = f"🚨 NUEVO DISPOSITIVO\nIP: {ip}\nMAC: {mac}\nFAB: {fab}"
    requests.post(f"https://api.telegram.org/bot{token}/sendMessage",
                  data={"chat_id": chat, "text": msg})

# ---------------- MAIN ----------------

if __name__ == '__main__':
    threading.Thread(target=escaneo_background, daemon=True).start()
    app.run(host='0.0.0.0', port=5555)
