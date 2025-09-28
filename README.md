## LANGuard

![Logo LANGuard](https://github.com/user-attachments/assets/ccfb8364-edbd-457c-891c-6c8926a436a5)

Aplicación web autohospedada para escaneo y monitoreo avanzado de tu red LAN

Esta herramienta te permite detectar accesos no autorizados en tiempo real, clasificando cada dispositivo como confiable o no confiable según la configuración que definas.
Si se detecta un dispositivo no confiable, la aplicación enviará notificaciones automáticas por Telegram, alertándote de inmediato.

Integra el poder de Nmap y ARP para lograr una detección más precisa, sin necesidad de elegir manualmente la interfaz de red, ya que identifica de forma automática el segmento de red del servidor donde se ejecuta el servicio.

Entre sus principales características se incluyen:

Historial de detecciones para un mejor seguimiento.

Posibilidad de asignar nombres personalizados a los dispositivos.

Interfaz moderna, responsiva y fácil de usar, diseñada para una administración intuitiva de la red.

La aplicación fue diseñada para usuarios de habla hispana, sin embargo ya soporta idioma inglés, lo que amplía su alcance a usuarios de habla inglesa. Se planea añadir más idiomas en el futuro, al tiempo que se perfeccionan las traducciones existentes.

---

## Docker Compose

```bash
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
    user: "1000:1000"
    network_mode: "host"
    cap_add:
      - NET_RAW
      - NET_ADMIN
    restart: unless-stopped
```

Por seguridad, cambie la `SECRET_KEY` generando una nueva con:

```bash
openssl rand -hex 32
```

---

## Credenciales por defecto

- **Usuario:** `admin@example.com`
- **Contraseña:** `admin`

---

## Acceso a la Interfaz Web

Visite la interfaz web de LANGuard ingresando la IP del servidor en el puerto **5555**.

![Acceso a la interfaz](https://github.com/user-attachments/assets/887db6a3-177d-44c0-8db7-ce110dac4148)

![Cambio de credenciales](https://github.com/user-attachments/assets/09ab7175-e221-406c-bebe-19f4f0694cd1)

---

## Panel Principal

![Panel principal 1](https://github.com/user-attachments/assets/6e3820d6-d934-4448-9b1b-6b749f8acce2)


---

## Modo Oscuro

LANGuard cuenta con una opción para cambiar al modo oscuro.

![Modo oscuro](https://github.com/user-attachments/assets/17287226-3c79-4369-a9e3-a12df56983cc)


---

## Escaneo de Puertos

Visualice el estado de los puertos de los dispositivos conectados a la red LAN.

![Escaneo de puertos](https://github.com/user-attachments/assets/0ac480f1-e7b5-49ec-8f01-e6a7fce6f04b)


---

## Filtrado de dispositivos

Ahora puedes filtrar fácilmente los dispositivos detectados en la red LAN utilizando:

- **Nombre** del dispositivo (editable)
- **MAC Address** (dirección física)
- **Nivel de confianza**: confiable o no confiable

Esto te permite ubicar rápidamente un dispositivo específico entre todos los conectados.

![Filtrado de dispositivos](https://github.com/user-attachments/assets/cbca129f-c2aa-493b-946f-9bf703703874)

---

## Registro de accesos

Registro de accesos exitosos y fallidos en el archivo:

```
/ruta/del/contenedor/app/accesos.log
```

![Registro de accesos](https://github.com/user-attachments/assets/ed1c04e6-7ef7-40ca-85c6-63bb90fddb5b)


---

## Nota del desarrollador
Esta aplicación fue desarrollada con un gran apoyo de herramientas de inteligencia artificial, como parte de un proyecto personal.
Aunque mi formación está enfocada en redes y ciberseguridad, me apasiona todo lo relacionado con la tecnología y el desarrollo de soluciones útiles e innovadoras para mis laboratorios en casa!.



