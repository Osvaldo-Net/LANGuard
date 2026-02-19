<div align="center">


<img src="https://github.com/user-attachments/assets/c3af8ab3-c0ed-4078-ab75-7afe2e7455dd" width="120" alt="LANGuard logo" />

# LANGuard

**Monitoreo y seguridad de tu red LAN, desde tu propio servidor.**

[![Docker](https://img.shields.io/badge/docker-netosvaltools%2Flanguard-0ea5e9?style=flat-square&logo=docker&logoColor=white&labelColor=0f172a)](https://hub.docker.com/r/netosvaltools/languard)
[![Docker Pulls](https://img.shields.io/docker/pulls/netosvaltools/languard?style=flat-square&color=0ea5e9&labelColor=0f172a)](https://hub.docker.com/r/netosvaltools/languard)
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

### 1. Configura la variables de entorno

Crea un archivo `.env` en el mismo directorio:

```env
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

<img src="https://github.com/user-attachments/assets/1531c07c-71a7-4c7f-9c33-26ebbe628d6c" alt="Modo día - Acceso a la interfaz" />

### Cambio de credenciales

<img width="1365" height="598" alt="image" src="https://github.com/user-attachments/assets/1531c07c-71a7-4c7f-9c33-26ebbe628d6c" alt="Modo día - Cambio de credenciales" />


### Panel principal



<img width="1365" height="598" alt="image" src="https://github.com/user-attachments/assets/1531c07c-71a7-4c7f-9c33-26ebbe628d6c" alt="Modo día - Panel principal" />

<img width="1365" height="600" alt="image" src="https://github.com/user-attachments/assets/c37e2962-e7cb-483f-94f5-0a429a132b20" alt="Modo día - Panel principal 2" />



### Modo oscuro


### Escaneo de puertos


### Registro de accesos


El log de accesos se almacena en:

```
/app/accesos.log
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
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

