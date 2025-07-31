import os
import json
import bcrypt
import re


RUTA_JSON = "data/usuarios.json"

def iniciar_archivo_usuarios():
    if not os.path.exists(RUTA_JSON):
        print("Creando archivo de usuarios por defecto...")
        hashed = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode()
        data = {
            "usuarios": [
                {
                    "usuario": "admin",
                    "contrasena": hashed,
                    "rol": "admin"
                }
            ]
        }
        os.makedirs(os.path.dirname(RUTA_JSON), exist_ok=True)
        with open(RUTA_JSON, "w") as f:
            json.dump(data, f, indent=4)

def verificar_login(usuario, contrasena):
    with open(RUTA_JSON) as f:
        data = json.load(f)
    for u in data["usuarios"]:
        if u["usuario"] == usuario and bcrypt.checkpw(contrasena.encode(), u["contrasena"].encode()):
            return True
    return False
    
def es_contrasena_segura(contra):
    if len(contra) < 8:
        return False
    if not re.search(r"[A-Z]", contra):
        return False
    if not re.search(r"[a-z]", contra):
        return False
    if not re.search(r"[0-9]", contra):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=/\\[\]~`]", contra):
        return False
    return True
    
def cambiar_contrasena_usuario(usuario, nueva):
    if es_contrasena_por_defecto(usuario) and not es_contrasena_segura(nueva):
        raise ValueError("La nueva contraseña no cumple con los requisitos mínimos de seguridad.")

    with open(RUTA_JSON) as f:
        data = json.load(f)
    for u in data["usuarios"]:
        if u["usuario"] == usuario:
            u["contrasena"] = bcrypt.hashpw(nueva.encode(), bcrypt.gensalt()).decode()
            break
    with open(RUTA_JSON, "w") as f:
        json.dump(data, f, indent=4)


def es_contrasena_por_defecto(usuario):
    with open(RUTA_JSON) as f:
        data = json.load(f)
    for u in data["usuarios"]:
        if u["usuario"] == usuario:
            return bcrypt.checkpw("admin".encode(), u["contrasena"].encode())
    return False
