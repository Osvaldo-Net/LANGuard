import sqlite3
import os
import bcrypt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "lan_guard.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Usuarios
cur.execute("""
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol TEXT NOT NULL
)
""")

# MAC confiables
cur.execute("""
CREATE TABLE IF NOT EXISTS mac_confiables (
    mac TEXT PRIMARY KEY
)
""")

# Nombres dispositivos
cur.execute("""
CREATE TABLE IF NOT EXISTS nombres_dispositivos (
    mac TEXT PRIMARY KEY,
    nombre TEXT NOT NULL
)
""")

# Cache fabricantes
cur.execute("""
CREATE TABLE IF NOT EXISTS vendor_cache (
    oui TEXT PRIMARY KEY,
    fabricante TEXT NOT NULL
)
""")

# Detecciones
cur.execute("""
CREATE TABLE IF NOT EXISTS detecciones_mac (
    mac TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    notificado INTEGER NOT NULL,
    ultima_vista REAL NOT NULL
)
""")

# Usuario por defecto
USUARIO_DEFECTO = "admin@example.com"
CONTRASENA_DEFECTO = "admin"

cur.execute("SELECT COUNT(*) FROM usuarios")
if cur.fetchone()[0] == 0:
    hash_pwd = bcrypt.hashpw(CONTRASENA_DEFECTO.encode(), bcrypt.gensalt(12)).decode()
    cur.execute("""
    INSERT INTO usuarios (usuario, contrasena, rol)
    VALUES (?, ?, ?)
    """, (USUARIO_DEFECTO, hash_pwd, "admin"))

conn.commit()
conn.close()

print("Base de datos LAN Guard inicializada correctamente.")
