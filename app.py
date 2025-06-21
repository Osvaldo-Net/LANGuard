
from flask import Flask, render_template, request, redirect, url_for
import subprocess
import re
import json
import os

app = Flask(__name__)

LISTA_CONF_FILE = "lista_confiables.json"

# Cargar lista blanca de archivo de forma segura
if os.path.exists(LISTA_CONF_FILE):
    with open(LISTA_CONF_FILE, "r") as f:
        try:
            LISTA_CONFIABLES = json.load(f)
        except json.JSONDecodeError:
            LISTA_CONFIABLES = []
else:
    LISTA_CONFIABLES = []


def guardar_lista():
    with open(LISTA_CONF_FILE, "w") as f:
        json.dump(LISTA_CONFIABLES, f)


def escanear_red():
    salida = subprocess.check_output(["nmap", "-sn", "192.168.1.0/24"]).decode()
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


@app.route('/')
def index():
    dispositivos = escanear_red()
    return render_template("index.html", dispositivos=dispositivos, lista_confiables=LISTA_CONFIABLES)


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
    app.run(host='0.0.0.0', port=5000)
