from flask import Flask, render_template, request, redirect, url_for
import subprocess
import re
import json
import os
import socket
import ipaddress
import threading
import time

app = Flask(__name__)

LISTA_CONF_FILE = "lista_confiables.json"

# Cargar lista confiables desde archivo JSON
if os.path.exists(LISTA_CONF_FILE):
    with open(LISTA_CONF_FILE, "r") as f:
        try:
            LISTA_CONFIABLES = json.load(f)
        except json.JSONDecodeError:
            LISTA_CONFIABLES = []
else:
    LISTA_CONFIABLES = []

# Variables de caché
CACHE_RESULTADO = []
CACHE_TIMESTAMP = 0
CACHE_INTERVALO = 60  # segundos


def guardar_lista():
    with open(LISTA_CONF_FILE, "w") as f:
        json.dump(LISTA_CONFIABLES, f)


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
        for linea in salida.splitlines():
            if "Nmap scan report for" in linea:
                ip = linea.split()[-1]
            elif "MAC Address:" in linea:
                mac_match = re.search(r"MAC Address: ([\w:]+)", linea)
                if mac_match:
                    mac = mac_match.group(1).lower()
                    fabricante = mac[:8].replace(":", "")
                    confiable = any(mac.endswith(p.lower()) for p in LISTA_CONFIABLES)
                    dispositivos.append({
                        "ip": ip,
                        "mac": mac,
                        "fabricante": fabricante,
                        "confiable": confiable
                    })
        return dispositivos
    except Exception as e:
        print(f"[!] Error escaneando red: {e}")
        return []


def escaneo_background():
    global CACHE_RESULTADO, CACHE_TIMESTAMP
    while True:
        CACHE_RESULTADO = escanear_red()
        CACHE_TIMESTAMP = time.time()
        time.sleep(CACHE_INTERVALO)


@app.route('/')
def index():
    return render_template("index.html", dispositivos=CACHE_RESULTADO, lista_confiables=LISTA_CONFIABLES)


@app.route('/agregar', methods=['POST'])
def agregar():
    prefijo = request.form.get("prefijo", "").strip().lower()
    if prefijo and prefijo not in LISTA_CONFIABLES:
        LISTA_CONFIABLES.append(prefijo)
        guardar_lista()
    return redirect(url_for('index'))


@app.route('/eliminar/<prefijo>')
def eliminar(prefijo):
    if prefijo in LISTA_CONFIABLES:
        LISTA_CONFIABLES.remove(prefijo)
        guardar_lista()
    return redirect(url_for('index'))


if __name__ == '__main__':
    thread = threading.Thread(target=escaneo_background, daemon=True)
    thread.start()
    app.run(host='0.0.0.0', port=5555)
