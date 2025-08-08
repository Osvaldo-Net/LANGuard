
```md
# 🛡️ LANGuard

![Logo LANGuard](https://github.com/user-attachments/assets/ccfb8364-ebbd-457c-891c-6c8926a436a5)

Aplicación web auto hospedada con funciones de escaneo avanzado para tu red **LAN**.

Con esta herramienta puedes:
- Detectar accesos no autorizados.
- Determinar el nivel de confianza de cada dispositivo conectado.
- Recibir alertas vía Telegram.
- Visualizar estado de puertos, latencia y propagación DNS.

---

## 🔐 Credenciales por defecto

| Campo        | Valor     |
|--------------|-----------|
| **Usuario**  | `admin`   |
| **Contraseña** | `admin` |

> ⚠️ **Importante:** Cambia la variable `SECRET_KEY` para mayor seguridad.  
> Puedes generar una nueva ejecutando:

```bash
openssl rand -hex 32

---

## 🌐 Acceso a la Interfaz Web

Visite la interfaz web de LANGuard ingresando la IP del servidor en el puerto **5555**.

![Acceso a la interfaz](https://github.com/user-attachments/assets/17d4ce4f-d07a-41b0-8b0f-9adf2c59d386)

---

## 📊 Panel Principal

![Panel principal 1](https://github.com/user-attachments/assets/37011d9e-0694-4be7-8976-4a4b4afaa9ec)  
![Panel principal 2](https://github.com/user-attachments/assets/90e6752a-b06b-446e-b309-7aaf19d641c7)

---

## 🌙 Modo Oscuro

LANGuard cuenta con una opción para cambiar al modo oscuro.

![Modo oscuro](https://github.com/user-attachments/assets/79418dbc-6399-454c-97d9-6dba70174948)

---

## 🛡️ Escaneo de Puertos

Visualice el estado de los puertos de los dispositivos conectados a la red LAN.

![Escaneo de puertos](https://github.com/user-attachments/assets/e2ee4164-951c-49a9-bf7a-04fc5d86f7b0)

---

## 🔍 Filtrado de Dispositivos

Ahora puedes filtrar fácilmente los dispositivos detectados en la red LAN utilizando:

- **Nombre** del dispositivo (editable)
- **MAC Address** (dirección física)
- **Nivel de confianza**: confiable o no confiable

Esto te permite ubicar rápidamente un dispositivo específico entre todos los conectados.

![Vista del filtrado](https://github.com/user-attachments/assets/e2ee4164-951c-49a9-bf7a-04fc5d86f7b0)

---

## 📁 Registro de Accesos

Registro de accesos exitosos y fallidos en el archivo:

```
/ruta/del/contenedor/app/accesos.log
```

![Registro de accesos](https://github.com/user-attachments/assets/d523fd1b-608f-450e-811e-865baf139c01)
```

---


