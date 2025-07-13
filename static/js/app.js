
document.addEventListener("DOMContentLoaded", () => {
  // === Modo oscuro persistente ===
  const root = document.documentElement;
  const iconoTema = document.getElementById("icono-tema");

  function aplicarTemaDesdeStorage() {
    const modoOscuro = localStorage.getItem("modoOscuro") === "true";
    root.classList.toggle("dark", modoOscuro);
    actualizarIconoTema();
  }

function actualizarIconoTema() {
  const esOscuro = root.classList.contains("dark");
  document.getElementById("icono-luna").classList.toggle("hidden", esOscuro);
  document.getElementById("icono-sol").classList.toggle("hidden", !esOscuro);
}

  window.toggleDarkMode = function () {
    root.classList.toggle("dark");
    localStorage.setItem("modoOscuro", root.classList.contains("dark"));
    actualizarIconoTema();
  };

  aplicarTemaDesdeStorage();
  lucide.createIcons();


  // === Notificaciones ===
  function mostrarNotificacion(mensaje, tipo = "info") {
    const noti = document.getElementById("notificacion");
    const colores = {
      info: "bg-orange-100 text-orange-800",
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800"
    };
    noti.innerHTML = mensaje;
    noti.className = `fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm w-full ${colores[tipo] || colores.info}`;
    noti.classList.remove("hidden");
    lucide.createIcons();
    setTimeout(() => noti.classList.add("hidden"), 10000);
  }

  // === Modal ===
  window.cerrarModal = function () {
    document.getElementById("modal-puertos").classList.add("hidden");
  };

  // === Agregar MAC ===
  document.getElementById("form-agregar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mac = document.getElementById("input-mac").value.trim();
    if (!mac) return;

    mostrarNotificacion(`
      <span class="inline-flex items-center gap-2">
        <i data-lucide="loader" class="w-4 h-4 animate-spin text-orange-800"></i>
        Agregando MAC...
      </span>
    `, "info");

    try {
      const res = await fetch("/api/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac })
      });
      const data = await res.json();
      if (data.success) {
        mostrarNotificacion(`<i data-lucide='check' class='w-4 h-4'></i> ${data.message}`, "success");
        setTimeout(() => location.reload(), 1000);
      } else {
        mostrarNotificacion(`<i data-lucide='x-circle' class='w-4 h-4'></i> ${data.message}`, "error");
      }
    } catch (error) {
      mostrarNotificacion("<i data-lucide='x-circle' class='w-4 h-4'></i> Error de conexión", "error");
    }
  });

  // === Eliminar MAC ===
  window.eliminarMAC = function (mac) {
    mostrarNotificacion(`
      <span class="inline-flex items-center gap-2">
        <i data-lucide="loader" class="w-4 h-4 animate-spin text-orange-800"></i>
        Eliminando MAC...
      </span>
    `, "info");

    fetch("/api/eliminar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          mostrarNotificacion(`<i data-lucide='check' class='w-4 h-4'></i> ${data.message}`, "success");
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarNotificacion(`<i data-lucide='x-circle' class='w-4 h-4'></i> ${data.message}`, "error");
        }
      })
      .catch(() => mostrarNotificacion("<i data-lucide='x-circle' class='w-4 h-4'></i> Error de conexión", "error"));
  };

  // === Editar nombre ===
  window.editarNombre = function(mac) {
    const nuevoNombre = prompt("Ingresa un nombre para el dispositivo:", mac);
    if (!nuevoNombre || nuevoNombre.trim() === "") return;

    fetch("/api/nombrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac: mac, nombre: nuevoNombre })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        mostrarNotificacion("<i data-lucide='check' class='w-4 h-4'></i> Nombre guardado", "success");
        location.reload();
      } else {
        mostrarNotificacion(`<i data-lucide='x-circle' class='w-4 h-4'></i> ${data.message}`, "error");
      }
    })
    .catch(() => mostrarNotificacion("<i data-lucide='x-circle' class='w-4 h-4'></i> Error al guardar nombre", "error"));
  };

  // === Hora actual ===
  function actualizarHoraActual() {
    const ahora = new Date();
    const formateada = ahora.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    document.getElementById("horaActual").textContent = formateada;
  }

  setInterval(actualizarHoraActual, 1000);
  actualizarHoraActual();

  // === Escanear red ===
  window.escanearAhora = function () {
    mostrarNotificacion(`
      <span class="inline-flex items-center gap-2">
        <i data-lucide="loader" class="w-4 h-4 animate-spin text-orange-800"></i>
        Escaneando red...
      </span>
    `, "info");

    fetch("/api/scan")
      .then(res => res.json())
      .then(data => {
        mostrarNotificacion(`
          <span class="inline-flex items-center gap-2">
            <i data-lucide="check" class="w-4 h-4 text-green-700"></i>
            Escaneo completo
          </span>
        `, "success");
        actualizarTabla(data);
      })
      .catch(() => {
        mostrarNotificacion(`
          <span class="inline-flex items-center gap-2">
            <i data-lucide="x-circle" class="w-4 h-4 text-red-700"></i>
            Error al escanear
          </span>
        `, "error");
      });
  };

  // === Ver puertos ===
  window.verPuertos = function (ip) {
    const modal = document.getElementById("modal-puertos");
    const contenido = document.getElementById("contenido-puertos");

    contenido.innerHTML = `
      <div class="flex items-center gap-2 text-orange-800 dark:text-orange-400">
        <i data-lucide="loader" class="animate-spin w-4 h-4"></i>
        Escaneando puertos en <strong>${ip}</strong>...
      </div>
    `;
    modal.classList.remove("hidden");
    lucide.createIcons();

    fetch("/api/puertos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.puertos.length === 0) {
            contenido.innerHTML = `
              <p class="text-gray-600 dark:text-gray-300 text-center">No se encontraron puertos abiertos en <strong>${ip}</strong>.</p>
            `;
          } else {
            const lista = data.puertos.map(p => `<li>${p.puerto} (${p.servicio})</li>`).join('');
            contenido.innerHTML = `
              <p class="mb-2">Host: <strong>${ip}</strong></p>
              <ul class="list-disc list-inside space-y-1">${lista}</ul>
            `;
          }
        } else {
          contenido.innerHTML = `<p class="text-red-600 dark:text-red-400">${data.message}</p>`;
        }
        lucide.createIcons();
      })
      .catch(() => {
        contenido.innerHTML = `<p class="text-red-600 dark:text-red-400">Error al consultar puertos para ${ip}</p>`;
        lucide.createIcons();
      });
  };

  // === Actualizar tabla ===
  function actualizarTabla(dispositivos) {
    const tabla = document.getElementById("tabla-dispositivos");
    tabla.innerHTML = "";

    dispositivos.forEach(d => {
      const row = document.createElement("tr");
      row.className = "transition-colors duration-200 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700/60";
      row.innerHTML = `
        <td class="px-4 py-3">${d.ip}</td>
        <td class="px-4 py-3">${d.mac}</td>
        <td class="px-4 py-3">
          <span onclick="editarNombre('${d.mac}')" class="cursor-pointer text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1">
            ${d.nombre ? d.nombre : "N/A"} <i data-lucide="pencil" class="w-4 h-4"></i>
          </span>
        </td>
        <td class="px-4 py-3">${d.fabricante}</td>
        <td class="px-4 py-3">
          ${d.confiable
            ? `<span class='inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium'>
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                Confiable
              </span>`
            : `<span class='inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium'>
                <i data-lucide="x-circle" class="w-4 h-4"></i>
                No confiable
              </span>`}
          <br/>
          <button onclick="verPuertos('${d.ip}')" class="inline-flex items-center gap-2 mt-2 text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition duration-200">
            <i data-lucide="search" class="w-4 h-4 text-blue-600"></i>
            Ver puertos
          </button>
        </td>
      `;
      tabla.appendChild(row);
    });
    document.getElementById("contador-dispositivos").textContent = dispositivos.length;
    lucide.createIcons();
  }

  // Autoescanear cada minuto
  setInterval(() => window.escanearAhora(), 60000);
});

