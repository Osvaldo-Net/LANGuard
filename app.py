from auth import iniciar_archivo_usuarios, verificar_login, cambiar_contrasena_usuario, es_contrasena_por_defecto
from flask import Flask, render_template, request, redirect, session, url_for, jsonify

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
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'clave_por_defecto')


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        usuario = request.form['usuario']
        contrasena = request.form['contrasena']
        if verificar_login(usuario, contrasena):
            session['usuario'] = usuario
            if es_contrasena_por_defecto(usuario):
                return redirect(url_for('cambiar_contrasena'))
            return redirect(url_for('index'))
        else:
            error = "Credenciales incorrectas 🛑"
    return render_template('login.html', error=error)


@app.route('/cambiar-contrasena', methods=['GET', 'POST'])
def cambiar_contrasena():
    if 'usuario' not in session:
        return redirect(url_for('login'))

    error = None
    if request.method == 'POST':
        nueva = request.form['nueva']
        confirmar = request.form['confirmar']
        if nueva != confirmar:
            error = "❌ Las contraseñas no coinciden"
        else:
            cambiar_contrasena_usuario(session['usuario'], nueva)
            return redirect(url_for('index'))

    return render_template('cambiar_contrasena.html', error=error)


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')


DATA_PATH = "data"
LISTA_CONF_FILE = os.path.join(DATA_PATH, "lista_confiables.json")
VENDOR_CACHE_FILE = os.path.join(DATA_PATH, "cache_vendors.json")
DETECCIONES_FILE = os.path.join(DATA_PATH, "detecciones_mac.json")

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

def obtener_fabricante(mac, ip):
    oui = mac.lower().replace(":", "")[:6]
    if oui in VENDOR_CACHE:
        return VENDOR_CACHE[oui]

    try:
        resultado = subprocess.check_output(["nmap", "-sn", ip], stderr=subprocess.DEVNULL).decode("utf-8")
        patron = rf"MAC Address: {mac.upper()} \((.*?)\)"
        match = re.search(patron, resultado)
        if match:
            fabricante = match.group(1)
        else:
            fabricante = "Desconocido"
    except Exception as e:
        print(f"Error al obtener fabricante con Nmap: {e}")
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
        salida = subprocess.check_output(["nmap", "-T4", "-n", "-sn", red], timeout=30).decode()
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
                        fabricante = obtener_fabricante(mac, ip)
                        confiable = mac in macs_confiables
                        dispositivos.append({
                            "ip": ip,
                            "mac": mac,
                            "fabricante": fabricante,
                            "confiable": confiable
                        })

                        if not confiable:
                            DETECCIONES_MAC.setdefault(mac, {"count": 0, "notificado": False, "ultima_vista": ahora})

                            if ahora - DETECCIONES_MAC[mac]["ultima_vista"] > 86400:
                                DETECCIONES_MAC[mac] = {"count": 1, "notificado": False, "ultima_vista": ahora}
                            else:
                                DETECCIONES_MAC[mac]["count"] += 1
                                DETECCIONES_MAC[mac]["ultima_vista"] = ahora

                            if DETECCIONES_MAC[mac]["count"] >= 10 and not DETECCIONES_MAC[mac]["notificado"]:
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
    actualizar_cache()
    return jsonify(CACHE_RESULTADO)

@app.route('/')
def index():
    if 'usuario' not in session:
        return redirect(url_for('login'))
    return render_template("index.html", dispositivos=CACHE_RESULTADO, lista_confiables=LISTA_CONFIABLES)


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
    mensaje = f"""🚨 *Dispositivo NO CONFIABLE detectado 10 veces*\n
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
