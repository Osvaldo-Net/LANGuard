import sqlite3
import bcrypt
import re
from db import get_db

USUARIO_DEFECTO = "admin@example.com"
CONTRASENA_DEFECTO = "admin"


def iniciar_archivo_usuarios():
    db = get_db()
    db.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT UNIQUE NOT NULL,
        contrasena TEXT NOT NULL,
        rol TEXT NOT NULL
    )
    """)

    # Crear usuario por defecto si no existe
    cur = db.execute("SELECT id FROM usuarios WHERE usuario = ?", (USUARIO_DEFECTO,))
    if not cur.fetchone():
        hash_pwd = bcrypt.hashpw(CONTRASENA_DEFECTO.encode(), bcrypt.gensalt(12)).decode()
        db.execute(
            "INSERT INTO usuarios (usuario, contrasena, rol) VALUES (?, ?, ?)",
            (USUARIO_DEFECTO, hash_pwd, "admin")
        )

    db.commit()
    db.close()



def verificar_login(usuario, contrasena):
    db = get_db()
    cur = db.execute("SELECT contrasena FROM usuarios WHERE usuario = ?", (usuario,))
    row = cur.fetchone()
    db.close()

    if not row:
        return False
    return bcrypt.checkpw(contrasena.encode(), row["contrasena"].encode())


def es_contrasena_segura(contra):
    especiales = "!@#$%^&*(),.?\":{}|<>_-+=/\\[]~"
    reglas = [
        len(contra) >= 8,
        re.search(r"[A-Z]", contra),
        re.search(r"[a-z]", contra),
        re.search(r"[0-9]", contra),
        re.search(rf"[{re.escape(especiales)}]", contra)
    ]
    return all(reglas)


def cambiar_usuario(usuario_actual, nuevo_usuario):
    db = get_db()
    db.execute("UPDATE usuarios SET usuario = ? WHERE usuario = ?",
               (nuevo_usuario, usuario_actual))
    db.commit()
    db.close()


def cambiar_contrasena_usuario(usuario, nueva):
    hash_pwd = bcrypt.hashpw(nueva.encode(), bcrypt.gensalt(12)).decode()
    db = get_db()
    db.execute("UPDATE usuarios SET contrasena = ? WHERE usuario = ?",
               (hash_pwd, usuario))
    db.commit()
    db.close()


def es_contrasena_por_defecto(usuario):
    db = get_db()
    cur = db.execute("SELECT contrasena FROM usuarios WHERE usuario = ?", (usuario,))
    row = cur.fetchone()
    db.close()

    if not row:
        return False
    return bcrypt.checkpw(CONTRASENA_DEFECTO.encode(), row["contrasena"].encode())


def es_usuario_por_defecto(usuario):
    return usuario == USUARIO_DEFECTO
