<div align="center">

<img src="https://github.com/user-attachments/assets/ccfb8364-edbd-457c-891c-6c8926a436a5" width="120" alt="LANGuard logo" />

# LANGuard

**Monitoreo y seguridad de tu red LAN, desde tu propio servidor.**  
Detecta intrusos, escanea puertos y recibe alertas en Telegram — todo autohospedado, todo tuyo.

[![Docker](https://img.shields.io/badge/docker-netosvaltools%2Flanguard-0ea5e9?style=flat-square&logo=docker&logoColor=white&labelColor=0f172a)](https://hub.docker.com/r/netosvaltools/languard)
[![License](https://img.shields.io/badge/license-MIT-a855f7?style=flat-square&labelColor=0f172a)](LICENSE)
[![Idiomas](https://img.shields.io/badge/idiomas-ES%20%7C%20EN-10b981?style=flat-square&labelColor=0f172a)](#)

</div>

---

## ¿Qué es LANGuard?

LANGuard es una aplicación web autohospedada para el **escaneo y monitoreo avanzado de tu red local**. Combina el poder de **Nmap** y **ARP** para identificar cada dispositivo conectado, clasificarlos como confiables o no confiables, y alertarte al instante vía **Telegram** si detecta algo sospechoso.

Sin configuración manual de interfaces de red: LANGuard **detecta automáticamente** el segmento de red donde se ejecuta. Toda la información se almacena localmente con **SQLite**, sin servidores externos ni dependencias en la nube.

---

## Características

- **Detección automática de red** — Sin elegir interfaces manualmente
- **Alertas en tiempo real vía Telegram** — Notificaciones ante dispositivos no confiables
- **Historial de detecciones** — Seguimiento completo de eventos en tu red
- **Nombres personalizados por dispositivo** — Identifica equipos fácilmente
- **Filtrado avanzado** — Busca por nombre, MAC o nivel de confianza
- **Escaneo de puertos** — Visualiza el estado de puertos por dispositivo
- **Registro de accesos** — Log de intentos exitosos y fallidos
- **Modo oscuro** — Interfaz adaptable a cualquier entorno
- **Multiidioma** — Español e inglés (más idiomas próximamente)
- **Persistencia ligera con SQLite** — Sin bases de datos externas

---

## Instalación

### 1. Configura las variables de entorno

Crea un archivo `.env` en el mismo directorio:

```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui
SECRET_KEY=genera_una_clave_segura
```

Genera una `SECRET_KEY` segura con:

```bash
openssl rand -hex 32
```

### 2. Despliega con Docker Compose

```yaml
services:
  languard:
    container_name: LANGuard
    image: netosvaltools/languard:latest
    environment:
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}
      SECRET_KEY: ${SECRET_KEY}
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ./data:/app/data
    network_mode: "host"
    cap_add:
      - NET_RAW
      - NET_ADMIN
    restart: unless-stopped
```

```bash
docker compose up -d
```

> ⚠️ **Nota de seguridad:** `network_mode: host` es necesario para que LANGuard pueda escanear tu red local. Cámbia la `SECRET_KEY` antes de poner el servicio en producción.

---

## Acceso inicial

Una vez en marcha, accede a la interfaz web desde tu navegador usando la IP del servidor en el puerto **5555**:

```
http://<IP-del-servidor>:5555
```

**Credenciales por defecto:**

| Campo | Valor |
|---|---|
| Usuario | `admin@example.com` |
| Contraseña | `admin` |

> ⚠️ Cambia la contraseña inmediatamente tras el primer inicio de sesión.

---

## Capturas de pantalla

### Acceso a la interfaz

<img src="https://github.com/user-attachments/assets/887db6a3-177d-44c0-8db7-ce110dac4148" alt="Acceso a la interfaz web" />
<img src="https://github.com/user-attachments/assets/09ab7175-e221-406c-bebe-19f4f0694cd1" alt="Cambio de credenciales" />

### Panel principal

<img src="https://github.com/user-attachments/assets/82411dd4-cff8-4439-8433-5a65eb53c55e" alt="Panel principal" />

### Modo oscuro

<img src="https://github.com/user-attachments/assets/0eea343e-332d-4ddf-b34f-eb13ee427c1f" alt="Modo oscuro" />

### Escaneo de puertos

<img src="https://github.com/user-attachments/assets/f05a1ba1-79ad-430f-b368-5495af5e48a5" alt="Escaneo de puertos" />

### Filtrado de dispositivos

<img src="https://github.com/user-attachments/assets/52ebbcf2-cefd-4e25-a125-7cc095eba62f" alt="Filtrado de dispositivos" />

### Registro de accesos

<img src="https://github.com/user-attachments/assets/ed1c04e6-7ef7-40ca-85c6-63bb90fddb5b" alt="Registro de accesos" />

El log de accesos se almacena en:

```
/app/accesos.log
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram para notificaciones | ✅ Sí |
| `TELEGRAM_CHAT_ID` | ID del chat donde se enviarán las alertas | ✅ Sí |
| `SECRET_KEY` | Clave secreta para cifrado de sesiones | ✅ Sí |

---

## Actualizar

```bash
docker compose pull
docker compose up -d
```

---


## Nota del desarrollador

Este proyecto nació de la pasión por las redes, la ciberseguridad y el homelab. Fue construido con apoyo de herramientas de inteligencia artificial como parte de un proyecto personal, con el objetivo de crear soluciones útiles, reales y autohospedadas para quienes, como yo, disfrutan administrar su propia infraestructura en casa.

---

