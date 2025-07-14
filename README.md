<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LANGuard - Aplicación de Seguridad LAN</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      color: #333;
      padding: 20px;
      margin: 0;
      line-height: 1.6;
    }

    h1, h2 {
      color: #1a73e8;
      margin-top: 30px;
    }

    .intro {
      text-align: center;
      margin-bottom: 30px;
    }

    .intro img {
      max-width: 220px;
      margin: 0 auto 20px;
      display: block;
      border-radius: 10px;
    }

    .section {
      background-color: #ffffff;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .section img {
      display: block;
      width: 70%;
      max-width: 100%;
      margin: 20px auto;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    code {
      background-color: #eee;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 0.95em;
    }

    ul {
      padding-left: 20px;
    }

    @media (prefers-color-scheme: dark) {
      body {
        background-color: #121212;
        color: #ddd;
      }
      .section {
        background-color: #1e1e1e;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
      }
      h1, h2 {
        color: #66aaff;
      }
      code {
        background-color: #333;
        color: #fff;
      }
    }
  </style>
</head>
<body>

  <div class="intro">
    <img src="https://github.com/user-attachments/assets/ccfb8364-edbd-457c-891c-6c8926a436a5" alt="Logo LANGuard" />
    <h1>LANGuard</h1>
    <p>Aplicación web autohospedada con funciones de escaneo avanzado de tu red LAN.</p>
    <p>Con esta aplicación puedes detectar accesos no autorizados y determinar el nivel de confianza de cada dispositivo conectado.</p>
  </div>

  <div class="section">
    <h2>Credenciales por defecto</h2>
    <ul>
      <li><strong>Usuario:</strong> <code>admin</code></li>
      <li><strong>Contraseña:</strong> <code>admin</code></li>
    </ul>
    <p>⚠️ Por seguridad, cambie la <code>SECRET_KEY</code> generando una nueva con:</p>
    <code>openssl rand -hex 32</code>
  </div>

  <div class="section">
    <h2>Acceso a la Interfaz Web</h2>
    <p>Visite la interfaz web de LANGuard ingresando la IP del servidor en el puerto <strong>5555</strong>.</p>
    <img src="https://github.com/user-attachments/assets/47efcf02-9636-4ebc-890c-286420fec6ab" alt="Acceso a la interfaz" />
  </div>

  <div class="section">
    <h2>Panel Principal</h2>
    <img src="https://github.com/user-attachments/assets/7ff3718b-ded5-44b7-8a9f-e1f44f93e5ee" alt="Panel principal 1" />
    <img src="https://github.com/user-attachments/assets/cbeba303-77e4-4162-b9b8-15384dabda17" alt="Panel principal 2" />
  </div>

  <div class="section">
    <h2>Modo Oscuro</h2>
    <p>LANGuard se adapta automáticamente al modo oscuro del sistema operativo.</p>
    <img src="https://github.com/user-attachments/assets/e9494277-d249-4287-9fd0-bae11aa110c0" alt="Modo oscuro" />
  </div>

  <div class="section">
    <h2>Escaneo de Puertos</h2>
    <p>Visualice el estado de los puertos de los dispositivos conectados a la red LAN.</p>
    <img src="https://github.com/user-attachments/assets/3e3185b3-1ef3-47eb-8e40-5f145c23f18b" alt="Escaneo de puertos" />
  </div>

</body>
</html>





