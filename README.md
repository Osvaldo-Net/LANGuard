## LANGuard

![Logo LANGuard](https://github.com/user-attachments/assets/ccfb8364-edbd-457c-891c-6c8926a436a5)

Aplicación web autohospedada para escaneo y monitoreo avanzado de tu red LAN.

Esta herramienta permite detectar accesos no autorizados en tiempo real, marcando cada dispositivo como confiable o no confiable según la configuración que definas.
Si se detecta un dispositivo no confiable, la aplicación envía notificaciones automáticas por Telegram para alertarte de forma inmediata.

Integra el poder de Nmap y ARP para una detección más precisa, sin necesidad de seleccionar manualmente la interfaz de red, ya que identifica automáticamente el segmento de red del servidor donde se ejecuta el servicio.
Además, mantiene un historial de detecciones, permite asignar nombres personalizados a dispositivos, y ofrece una interfaz moderna y adaptable para que puedas administrar y supervisar tu red de forma sencilla y visualmente atractiva.

---

## 🔐 Credenciales por defecto

- **Usuario:** `admin@example.com`
- **Contraseña:** `admin`

⚠️ Por seguridad, cambie la `SECRET_KEY` generando una nueva con:

```bash
openssl rand -hex 32
```

---

## 🌐 Acceso a la Interfaz Web

Visite la interfaz web de LANGuard ingresando la IP del servidor en el puerto **5555**.

![Acceso a la interfaz](https://github.com/user-attachments/assets/887db6a3-177d-44c0-8db7-ce110dac4148)

![Cambio de credenciales](https://github.com/user-attachments/assets/09ab7175-e221-406c-bebe-19f4f0694cd1)

---

## 🧭 Panel Principal

![Panel principal 1](https://github.com/user-attachments/assets/be8f83f9-ffd9-40d3-afb7-6a5700a422a7)


![Panel principal 2](https://github.com/user-attachments/assets/032a21d1-6e39-44cf-99de-7222398a67db)


---

## 🌙 Modo Oscuro

LANGuard cuenta con una opción para cambiar al modo oscuro.

![Modo oscuro](https://github.com/user-attachments/assets/5c3ab79f-b25e-4f2a-937f-d195000c0a3b)


---

## 🧪 Escaneo de Puertos

Visualice el estado de los puertos de los dispositivos conectados a la red LAN.

![Escaneo de puertos](https://github.com/user-attachments/assets/02c27dc7-8421-4b56-9c72-e2932a245cbd)


---

## 🔍 Filtrado de dispositivos

Ahora puedes filtrar fácilmente los dispositivos detectados en la red LAN utilizando:

- **Nombre** del dispositivo (editable)
- **MAC Address** (dirección física)
- **Nivel de confianza**: confiable o no confiable

Esto te permite ubicar rápidamente un dispositivo específico entre todos los conectados.

![Filtrado de dispositivos](https://github.com/user-attachments/assets/a1cb2f61-4c28-4e9b-a1a0-af27de16ab44)

---

## 📝 Registro de accesos

Registro de accesos exitosos y fallidos en el archivo:

```
/ruta/del/contenedor/app/accesos.log
```
![Registro de accesos](https://github.com/user-attachments/assets/6d205630-18b0-4663-b87a-b38f1ec66472)

---

## 🤖 Nota del desarrollador
Esta aplicación fue desarrollada con un gran apoyo de herramientas de inteligencia artificial, como parte de un proyecto personal.
Aunque mi formación está enfocada en redes y ciberseguridad, me apasiona todo lo relacionado con la tecnología y el desarrollo de soluciones útiles e innovadoras para mis laboratorios en casa!.



