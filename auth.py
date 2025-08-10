import os
import json
import bcrypt
import re
from typing import Dict, Any

RUTA_JSON = os.environ.get("USUARIOS_JSON", "/app/data/usuarios.json")
USUARIO_DEFECTO = "admin@example.com"
CONTRASENA_DEFECTO = "admin"


def cargar_datos() -> Dict[str, Any]:
    if not os.path.exists(RUTA_JSON):
        iniciar_archivo_usuarios()

    try:
        with open(RUTA_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        iniciar_archivo_usuarios()
        with open(RUTA_JSON, "r", encoding="utf-8") as f:
            return json.load(f)


def guardar_datos(data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(RUTA_JSON), exist_ok=True)
    with open(RUTA_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)


def hash_contrasena(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode(),
                         bcrypt.gensalt(rounds=12)).decode()


def iniciar_archivo_usuarios() -> None:
    if os.path.exists(RUTA_JSON):
        print("Archivo de usuarios ya existe, no se sobrescribe.")
        return

    print("Creando archivo de usuarios por defecto...")
    data = {
        "usuarios": [{
            "usuario": USUARIO_DEFECTO,
            "contrasena": hash_contrasena(CONTRASENA_DEFECTO),
            "rol": "admin"
        }]
    }
    guardar_datos(data)


def verificar_login(usuario: str, contrasena: str) -> bool:
    data = cargar_datos()
    return any(
        u["usuario"] == usuario
        and bcrypt.checkpw(contrasena.encode(), u["contrasena"].encode())
        for u in data["usuarios"])


def es_contrasena_segura(contra: str) -> bool:
    especiales = "!@#$%^&*(),.?\":{}|<>_-+=/\\[]~"
    reglas = [
        (len(contra) >= 8, "Debe tener al menos 8 caracteres"),
        (re.search(r"[A-Z]", contra), "Debe contener al menos una mayúscula"),
        (re.search(r"[a-z]", contra), "Debe contener al menos una minúscula"),
        (re.search(r"[0-9]", contra), "Debe contener al menos un número"),
        (re.search(rf"[{re.escape(especiales)}]",
                   contra), "Debe contener un carácter especial"),
    ]
    return all(condicion for condicion, _ in reglas)


def es_correo_valido(correo: str) -> bool:
    return bool(
        re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", correo))


def cambiar_usuario(usuario_actual: str, nuevo_usuario: str) -> None:
    if not es_correo_valido(nuevo_usuario):
        raise ValueError(
            "El nuevo usuario debe ser un correo electrónico válido.")

    data = cargar_datos()
    for u in data["usuarios"]:
        if u["usuario"] == usuario_actual:
            u["usuario"] = nuevo_usuario
            guardar_datos(data)
            return
    raise ValueError("Usuario no encontrado.")


def cambiar_contrasena_usuario(usuario: str, nueva: str) -> None:
    if es_contrasena_por_defecto(usuario) and not es_contrasena_segura(nueva):
        raise ValueError(
            "La nueva contraseña no cumple con los requisitos mínimos de seguridad."
        )

    data = cargar_datos()
    for u in data["usuarios"]:
        if u["usuario"] == usuario:
            u["contrasena"] = hash_contrasena(nueva)
            guardar_datos(data)
            return
    raise ValueError("Usuario no encontrado.")


def es_contrasena_por_defecto(usuario: str) -> bool:
    data = cargar_datos()
    for u in data["usuarios"]:
        if u["usuario"] == usuario:
            return bcrypt.checkpw(CONTRASENA_DEFECTO.encode(),
                                  u["contrasena"].encode())
    return False


def es_usuario_por_defecto(usuario: str) -> bool:
    return usuario == USUARIO_DEFECTO
