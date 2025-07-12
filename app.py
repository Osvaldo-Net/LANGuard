from auth import iniciar_archivo_usuarios, verificar_login, cambiar_contrasena_usuario, es_contrasena_por_defecto
from flask import Flask, render_template, request, redirect, session, url_for, jsonify
from collections import defaultdict

iniciar_archivo_usuarios()

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
from datetime import datetime

LOG_PATH = "data/accesos.log"
logger = logging.getLogger("accesos")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.FileHandler(LOG_PATH)
    formatter = logging.Formatter('[%(asctime)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
def registrar_log(mensaje):
    logger.info(mensaje)


# Variables globales para seguridad
INTENTOS_FALLIDOS = defaultdict(int)
BLOQUEOS = {}
TIEMPO_BLOQUEO = 300  # 5 minutos en segundos


app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'clave_por_defecto')


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    tiempo_restante = None
    ip_origen = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0].strip()


    # Verificar si la IP está bloqueada
    if ip_origen in BLOQUEOS:
        tiempo_restante = int(BLOQUEOS[ip_origen] - time.time())
        if tiempo_restante > 0:
            minutos = tiempo_restante // 60
            segundos = tiempo_restante % 60
            error = f"Demasiados intentos fallidos. Intenta en {minutos}m {segundos}s."
            registrar_log(f"IP BLOQUEADA - {ip_origen} intentó acceder estando bloqueada.")
            return render_template('login.html', error=error, tiempo_restante=tiempo_restante)
        else:
            # Desbloquear IP y reiniciar intentos
            BLOQUEOS.pop(ip_origen)
            INTENTOS_FALLIDOS[ip_origen] = 0
            return redirect(url_for('login'))


    if request.method == 'POST':
        usuario = request.form['usuario']
        contrasena = request.form['contrasena']

        if verificar_login(usuario, contrasena):
            session['usuario'] = usuario
            INTENTOS_FALLIDOS[ip_origen] = 0
            registrar_log(f"LOGIN EXITOSO - IP: {ip_origen} - Usuario: {usuario}")
            if es_contrasena_por_defecto(usuario):
                return redirect(url_for('cambiar_contrasena'))
            return redirect(url_for('index'))
        else:
            INTENTOS_FALLIDOS[ip_origen] += 1
            if INTENTOS_FALLIDOS[ip_origen] >= 3:
                BLOQUEOS[ip_origen] = time.time() + TIEMPO_BLOQUEO
                tiempo_restante = TIEMPO_BLOQUEO
                registrar_log(f"IP BLOQUEADA - {ip_origen} por {TIEMPO_BLOQUEO // 60} minutos")
                error = f"Demasiados intentos fallidos. Tu IP ha sido bloqueada por {TIEMPO_BLOQUEO // 60} minutos."
            else:
                restantes = 3 - INTENTOS_FALLIDOS[ip_origen]
                registrar_log(f"LOGIN FALLIDO - IP: {ip_origen} - Usuario: {usuario}")
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
            cambiar_contrasena_usuario(session['usuario'], nueva)
            return redirect(url_for('index'))

    return render_template('cambiar_contrasena.html', error=error)

@app.route('/api/nombrar', methods=['POST'])
def api_nombrar():
    data = request.get_json()
    mac = data.get("mac", "").strip().lower()
    nombre = data.get("nombre", "").strip()

    if len(mac.split(":")) == 6 and nombre:
        NOMBRES_DISPOSITIVOS[mac] = nombre
        guardar_nombres()
        return jsonify({"success": True, "message": "Nombre guardado."})

    return jsonify({"success": False, "message": "Datos inválidos"})


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')


DATA_PATH = "data"
LISTA_CONF_FILE = os.path.join(DATA_PATH, "lista_confiables.json")
VENDOR_CACHE_FILE = os.path.join(DATA_PATH, "cache_vendors.json")
DETECCIONES_FILE = os.path.join(DATA_PATH, "detecciones_mac.json")

#Nombres de dispositivos
NOMBRES_FILE = os.path.join(DATA_PATH, "nombres_dispositivos.json")
if os.path.exists(NOMBRES_FILE):
    with open(NOMBRES_FILE, "r") as f:
        try:
            NOMBRES_DISPOSITIVOS = json.load(f)
        except json.JSONDecodeError:
            NOMBRES_DISPOSITIVOS = {}
else:
    NOMBRES_DISPOSITIVOS = {}

def guardar_nombres():
    with open(NOMBRES_FILE, "w") as f:
        json.dump(NOMBRES_DISPOSITIVOS, f)


# Cargar lista confiables
if os.path.exists(LISTA_CONF_FILE):
    with open(LISTA_CONF_FILE, "r") as f:
        try:
            LISTA_CONFIABLES = json.load(f)
        except json.JSONDecodeError:
            LISTA_CONFIABLES = []
else:
    LISTA_CONFIABLES = []

# Cargar caché de fabricantes
if os.path.exists(VENDOR_CACHE_FILE):
    with open(VENDOR_CACHE_FILE, "r") as f:
        try:
            VENDOR_CACHE = json.load(f)
        except json.JSONDecodeError:
            VENDOR_CACHE = {}
else:
    VENDOR_CACHE = {}

# Cargar detecciones
if os.path.exists(DETECCIONES_FILE):
    with open(DETECCIONES_FILE, "r") as f:
        try:
            DETECCIONES_MAC = json.load(f)
        except json.JSONDecodeError:
            DETECCIONES_MAC = {}
else:
    DETECCIONES_MAC = {}

CACHE_RESULTADO = []
CACHE_TIMESTAMP = 0
CACHE_INTERVALO = 60  # segundos

def guardar_lista():
    with open(LISTA_CONF_FILE, "w") as f:
        json.dump(LISTA_CONFIABLES, f)

def guardar_cache_vendors():
    with open(VENDOR_CACHE_FILE, "w") as f:
        json.dump(VENDOR_CACHE, f)

def guardar_detecciones():
    with open(DETECCIONES_FILE, "w") as f:
        json.dump(DETECCIONES_MAC, f)

def obtener_fabricante(mac):
    oui = mac.lower().replace(":", "")[:6]
    if oui in VENDOR_CACHE:
        return VENDOR_CACHE[oui]

    try:
        response = requests.get(f"https://api.maclookup.app/v2/macs/{mac}")
        if response.status_code == 200:
            data = response.json()
            fabricante = data.get("company", "Desconocido")
        else:
            fabricante = "Desconocido"
    except:
        fabricante = "Desconocido"

    VENDOR_CACHE[oui] = fabricante
    guardar_cache_vendors()
    return fabricante

def obtener_red_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip_local = s.getsockname()[0]
    finally:
        s.close()
    red = ipaddress.IPv4Interface(f"{ip_local}/24").network
    return str(red)

def escanear_red():
    try:
        red = obtener_red_local()
        salida = subprocess.check_output(["nmap", "-T4", "-n", "-sn", "-PR", "--max-retries", "3", red], timeout=30).decode()
        dispositivos = []
        ip = mac = None
        ahora = time.time()
        macs_confiables = [p.strip().lower().replace('-', ':') for p in LISTA_CONFIABLES]

        for linea in salida.splitlines():
            if "Nmap scan report for" in linea:
                ip = linea.split()[-1]
            elif "MAC Address:" in linea:
                mac_match = re.search(r"MAC Address: ([\w:]+)", linea)
                if mac_match:
                    mac = mac_match.group(1).strip().lower().replace('-', ':')
                    if len(mac.split(':')) == 6:
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
                            DETECCIONES_MAC.setdefault(mac, {"count": 0, "notificado": False, "ultima_vista": ahora})

                            if ahora - DETECCIONES_MAC[mac]["ultima_vista"] > 86400:
                                DETECCIONES_MAC[mac] = {"count": 1, "notificado": False, "ultima_vista": ahora}
                            else:
                                DETECCIONES_MAC[mac]["count"] += 1
                                DETECCIONES_MAC[mac]["ultima_vista"] = ahora

                            if DETECCIONES_MAC[mac]["count"] >= 3 and not DETECCIONES_MAC[mac]["notificado"]:
                                enviar_telegram(mac, ip, fabricante)
                                DETECCIONES_MAC[mac]["notificado"] = True

        guardar_detecciones()
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

    actualizar_cache()
    for d in CACHE_RESULTADO:
        mac = d.get("mac", "").lower()
        d["nombre"] = NOMBRES_DISPOSITIVOS.get(mac)
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
        puertos = []
        for linea in salida.splitlines():
            if "/tcp" in linea and "open" in linea:
                partes = linea.split()
                puertos.append({"puerto": partes[0], "servicio": partes[-1]})
        return jsonify({"success": True, "puertos": puertos})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/agregar', methods=['POST'])
def api_agregar():
    data = request.get_json()
    mac = data.get("mac", "").strip().lower().replace('-', ':')

    if len(mac.split(':')) == 6 and mac not in LISTA_CONFIABLES:
        LISTA_CONFIABLES.append(mac)
        guardar_lista()
        if mac in DETECCIONES_MAC:
            del DETECCIONES_MAC[mac]
            guardar_detecciones()
        actualizar_cache()
        return jsonify({"success": True, "message": "MAC agregada correctamente."})

    return jsonify({"success": False, "message": "MAC inválida o ya existe."})

@app.route('/api/eliminar', methods=['POST'])
def api_eliminar():
    data = request.get_json()
    mac = data.get("mac", "").strip().lower().replace('-', ':')

    if mac in LISTA_CONFIABLES:
        LISTA_CONFIABLES.remove(mac)
        guardar_lista()
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
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": mensaje,
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(url, data=data)
        if response.status_code != 200:
            print("[!] Error al enviar mensaje Telegram:", response.text)
    except Exception as e:
        print("[!] Error Telegram:", e)

if __name__ == '__main__':
    threading.Thread(target=escaneo_background, daemon=True).start()
    app.run(host='0.0.0.0', port=5555)
