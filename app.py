from auth import iniciar_archivo_usuarios, verificar_login, cambiar_contrasena_usuario, es_contrasena_por_defecto
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from collections import defaultdict
from datetime import datetime
import subprocess
import re
import json
import os
import socket
import ipaddress
import threading
import time
import requests
import logging


DATA_PATH = "data"
RUTA_LOG = os.path.join(DATA_PATH, "accesos.log")
RUTA_LISTA_CONFIABLES = os.path.join(DATA_PATH, "lista_confiables.json")
RUTA_CACHE_VENDORS = os.path.join(DATA_PATH, "cache_vendors.json")
RUTA_DETECCIONES = os.path.join(DATA_PATH, "detecciones_mac.json")
RUTA_NOMBRES_DISPOSITIVOS = os.path.join(DATA_PATH, "nombres_dispositivos.json")

TIEMPO_BLOQUEO = 300          # 5 minutos
CACHE_INTERVALO = 60          # segundos
INTENTOS_MAXIMOS = 3


def guardar_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f)

def cargar_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            pass
    return default


logger = logging.getLogger("accesos")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(RUTA_LOG)
    formatter = logging.Formatter('[%(asctime)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

def registrar_log(mensaje):
    logger.info(mensaje)


INTENTOS_FALLIDOS = defaultdict(int)
BLOQUEOS = {}
NOMBRES_DISPOSITIVOS = cargar_json(RUTA_NOMBRES_DISPOSITIVOS, {})
LISTA_CONFIABLES = cargar_json(RUTA_LISTA_CONFIABLES, [])
VENDOR_CACHE = cargar_json(RUTA_CACHE_VENDORS, {})
DETECCIONES_MAC = cargar_json(RUTA_DETECCIONES, {})

CACHE_RESULTADO = []
CACHE_TIMESTAMP = 0


app = Flask(__name__)
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY no configurada. Establece la variable de entorno para mayor seguridad.")
app.secret_key = SECRET_KEY

iniciar_archivo_usuarios()


def esta_bloqueado(ip):
    if ip in BLOQUEOS:
        tiempo_restante = int(BLOQUEOS[ip] - time.time())
        if tiempo_restante > 0:
            return True, tiempo_restante
        BLOQUEOS.pop(ip)
        INTENTOS_FALLIDOS[ip] = 0
    return False, None


@app.route('/login', methods=['GET', 'POST'])
def login():
    error, tiempo_restante = None, None
    ip_origen = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()

    bloqueado, tiempo_restante = esta_bloqueado(ip_origen)
    if bloqueado:
        minutos, segundos = divmod(tiempo_restante, 60)
        error = f"Demasiados intentos fallidos. Intenta en {minutos}m {segundos}s."
        registrar_log(f"IP BLOQUEADA - {ip_origen} intentó acceder estando bloqueada.")
        return render_template('login.html', error=error, tiempo_restante=tiempo_restante)

    if request.method == 'POST':
        usuario = request.form['usuario'].strip()
        contrasena = request.form['contrasena'].strip()

        if verificar_login(usuario, contrasena):
            session['usuario'] = usuario
            INTENTOS_FALLIDOS[ip_origen] = 0
            registrar_log(f"LOGIN EXITOSO - IP: {ip_origen} - Usuario: {usuario}")
            if es_contrasena_por_defecto(usuario):
                return redirect(url_for('cambiar_contrasena'))
            return redirect(url_for('index'))
        else:
            INTENTOS_FALLIDOS[ip_origen] += 1
            restantes = INTENTOS_MAXIMOS - INTENTOS_FALLIDOS[ip_origen]
            registrar_log(f"LOGIN FALLIDO - IP: {ip_origen} - Usuario: {usuario}")
            if restantes <= 0:
                BLOQUEOS[ip_origen] = time.time() + TIEMPO_BLOQUEO
                error = f"Demasiados intentos fallidos. Tu IP ha sido bloqueada por {TIEMPO_BLOQUEO // 60} minutos."
                registrar_log(f"IP BLOQUEADA - {ip_origen} por {TIEMPO_BLOQUEO // 60} minutos")
            else:
                error = f"Credenciales incorrectas. Intentos restantes: {restantes}"

    return render_template('login.html', error=error, tiempo_restante=tiempo_restante)

@app.route('/cambiar-contrasena', methods=['GET', 'POST'])
def cambiar_contrasena():
    if 'usuario' not in session:
        return redirect(url_for('login'))

    error = None
    if request.method == 'POST':
        nueva = request.form['nueva']
        confirmar = request.form['confirmar']
        if nueva != confirmar:
            error = "Las contraseñas no coinciden"
        else:
            try:
                cambiar_contrasena_usuario(session['usuario'], nueva)
                return redirect(url_for('index'))
            except ValueError as e:
                error = str(e)
    return render_template('cambiar_contrasena.html', error=error)

@app.route('/api/nombrar', methods=['POST'])
def api_nombrar():
    data = request.get_json()
    mac = data.get("mac", "").strip().lower()
    nombre = data.get("nombre", "").strip()
    if len(mac.split(":")) == 6 and nombre:
        NOMBRES_DISPOSITIVOS[mac] = nombre
        guardar_json(RUTA_NOMBRES_DISPOSITIVOS, NOMBRES_DISPOSITIVOS)
        return jsonify({"success": True, "message": "Nombre guardado."})
    return jsonify({"success": False, "message": "Datos inválidos"})

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')


def obtener_fabricante(mac):
    oui = mac.lower().replace(":", "")[:6]
    if oui in VENDOR_CACHE:
        return VENDOR_CACHE[oui]
    try:
        resp = requests.get(f"https://api.maclookup.app/v2/macs/{mac}", timeout=5)
        fabricante = resp.json().get("company", "Desconocido") if resp.status_code == 200 else "Desconocido"
    except Exception as e:
        fabricante = "Desconocido"
    VENDOR_CACHE[oui] = fabricante
    guardar_json(RUTA_CACHE_VENDORS, VENDOR_CACHE)
    return fabricante

def obtener_red_local():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        ip_local = s.getsockname()[0]
    return str(ipaddress.IPv4Interface(f"{ip_local}/24").network)

def escanear_red():
    try:
        red = obtener_red_local()
        salida = subprocess.check_output(
            ["nmap", "-T4", "-n", "-sn", "-PR", "--max-retries", "3", red],
            timeout=30
        ).decode()

        dispositivos = []
        ip = None
        ahora = time.time()
        macs_confiables = [m.lower() for m in LISTA_CONFIABLES]

        for linea in salida.splitlines():
            if "Nmap scan report for" in linea:
                ip = linea.split()[-1]
            elif "MAC Address:" in linea:
                mac_match = re.search(r"MAC Address: ([\w:]+)", linea)
                if mac_match:
                    mac = mac_match.group(1).lower().replace('-', ':')
                    fabricante = obtener_fabricante(mac)
                    confiable = mac in macs_confiables
                    dispositivos.append({
                        "ip": ip,
                        "mac": mac,
                        "fabricante": fabricante,
                        "confiable": confiable,
                        "nombre": NOMBRES_DISPOSITIVOS.get(mac)
                    })

                    if not confiable:
                        registro = DETECCIONES_MAC.setdefault(mac, {"count": 0, "notificado": False, "ultima_vista": ahora})
                        if ahora - registro["ultima_vista"] > 86400:
                            registro.update({"count": 1, "notificado": False, "ultima_vista": ahora})
                        else:
                            registro["count"] += 1
                            registro["ultima_vista"] = ahora

                        if registro["count"] >= 3 and not registro["notificado"]:
                            enviar_telegram(mac, ip, fabricante)
                            registro["notificado"] = True

        guardar_json(RUTA_DETECCIONES, DETECCIONES_MAC)
        return dispositivos
    except Exception as e:
        print(f"[!] Error escaneando red: {e}")
        return []

def actualizar_cache():
    global CACHE_RESULTADO, CACHE_TIMESTAMP
    CACHE_RESULTADO = escanear_red()
    CACHE_TIMESTAMP = time.time()

def escaneo_background():
    while True:
        actualizar_cache()
        time.sleep(CACHE_INTERVALO)

@app.route('/api/scan')
def api_scan():
    if 'usuario' not in session:
        return jsonify({"error": "No autorizado"}), 401
    return jsonify(CACHE_RESULTADO)

@app.route('/')
def index():
    if 'usuario' not in session:
        return redirect(url_for('login'))
    return render_template("index.html", dispositivos=CACHE_RESULTADO, lista_confiables=LISTA_CONFIABLES, nombres_dispositivos=NOMBRES_DISPOSITIVOS)


@app.route('/api/puertos', methods=['POST'])
def api_puertos():
    data = request.get_json()
    ip = data.get("ip", "").strip()
    if not ip:
        return jsonify({"success": False, "message": "IP no proporcionada"})
    try:
        salida = subprocess.check_output(["nmap", "-T4", "-sT", "--top-ports", "100", "--open", ip], timeout=20).decode()
        puertos = [{"puerto": p.split()[0], "servicio": p.split()[-1]}
                   for p in salida.splitlines() if "/tcp" in p and "open" in p]
        return jsonify({"success": True, "puertos": puertos})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/agregar', methods=['POST'])
def api_agregar():
    data = request.get_json()
    mac = data.get("mac", "").strip().lower().replace('-', ':')
    if len(mac.split(':')) == 6 and mac not in LISTA_CONFIABLES:
        LISTA_CONFIABLES.append(mac)
        guardar_json(RUTA_LISTA_CONFIABLES, LISTA_CONFIABLES)
        if mac in DETECCIONES_MAC:
            DETECCIONES_MAC.pop(mac)
            guardar_json(RUTA_DETECCIONES, DETECCIONES_MAC)
        actualizar_cache()
        return jsonify({"success": True, "message": "MAC agregada correctamente."})
    return jsonify({"success": False, "message": "MAC inválida o ya existe."})

@app.route('/api/eliminar', methods=['POST'])
def api_eliminar():
    data = request.get_json()
    mac = data.get("mac", "").strip().lower().replace('-', ':')
    if mac in LISTA_CONFIABLES:
        LISTA_CONFIABLES.remove(mac)
        guardar_json(RUTA_LISTA_CONFIABLES, LISTA_CONFIABLES)
        actualizar_cache()
        return jsonify({"success": True, "message": "MAC eliminada correctamente."})
    return jsonify({"success": False, "message": "MAC no encontrada."})


def enviar_telegram(mac, ip, fabricante):
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("[!] Token o ChatID no configurado")
        return
    hora_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mensaje = f"""🚨 *Dispositivo NO CONFIABLE detectado*\n
*Hora:* `{hora_actual}`
*IP:* {ip}
*MAC:* `{mac}`
*Fabricante:* {fabricante}
"""
    try:
        resp = requests.post(f"https://api.telegram.org/bot{token}/sendMessage", data={
            "chat_id": chat_id,
            "text": mensaje,
            "parse_mode": "Markdown"
        }, timeout=5)
        if resp.status_code != 200:
            print("[!] Error al enviar mensaje Telegram:", resp.text)
    except Exception as e:
        print("[!] Error Telegram:", e)


if __name__ == '__main__':
    threading.Thread(target=escaneo_background, daemon=True).start()
    app.run(host='0.0.0.0', port=5555)
