document.addEventListener("DOMContentLoaded", () => {
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

    const iconoLunaMobile = document.getElementById("icono-luna-mobile");
    const iconoSolMobile = document.getElementById("icono-sol-mobile");

    if (iconoLunaMobile && iconoSolMobile) {
      iconoLunaMobile.classList.toggle("hidden", esOscuro);
      iconoSolMobile.classList.toggle("hidden", !esOscuro);
    }
  }

  window.toggleDarkMode = function () {
    root.classList.toggle("dark");
    localStorage.setItem("modoOscuro", root.classList.contains("dark"));
    actualizarIconoTema();
  };

  aplicarTemaDesdeStorage();
  lucide.createIcons();

  function mostrarNotificacion(mensaje, tipo = "info") {
    const noti = document.getElementById("notificacion");
    const colores = {
      info: "bg-orange-100 text-orange-800",
      success: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
    };

    noti.innerHTML = mensaje;
    noti.className = `fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-sm w-full ${colores[tipo] || colores.info}`;
    noti.classList.remove("hidden");

    lucide.createIcons();
    setTimeout(() => noti.classList.add("hidden"), 10000);
  }

  window.cerrarModal = function () {
    document.getElementById("modal-puertos").classList.add("hidden");
  };

  document
    .getElementById("form-agregar")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const mac = document.getElementById("input-mac").value.trim();
      if (!mac) return;

      mostrarNotificacion(
        `
    <span class="inline-flex items-center gap-2">
      <i data-lucide="loader" class="w-4 h-4 animate-spin text-orange-800"></i>
      ${t("adding")}
    </span>
  `,
        "info",
      );

      try {
        const res = await fetch("/api/agregar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mac }),
        });
        const data = await res.json();

        if (data.success) {
          mostrarNotificacion(
            `
        <span class="inline-flex items-center gap-2">
          <i data-lucide='check' class='w-4 h-4'></i>
          ${t("success")}
        </span>
      `,
            "success",
          );
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarNotificacion(
            `
        <span class="inline-flex items-center gap-2">
          <i data-lucide='x-circle' class='w-4 h-4'></i>
          ${t("error")}
        </span>
      `,
            "error",
          );
        }
      } catch (error) {
        mostrarNotificacion(
          `
      <span class="inline-flex items-center gap-2">
        <i data-lucide='x-circle' class='w-4 h-4'></i>
        ${t("connectionError")}
      </span>
    `,
          "error",
        );
      }
    });

  window.eliminarMAC = function (mac) {
    mostrarNotificacion(
      `
    <span class="inline-flex items-center gap-2">
      <i data-lucide="loader" class="w-4 h-4 animate-spin text-orange-800"></i>
      ${t("eliminando")}
    </span>
  `,
      "info",
    );

    fetch("/api/eliminar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          mostrarNotificacion(
            `
          <span class="inline-flex items-center gap-2">
            <i data-lucide='check' class='w-4 h-4'></i>
            ${data.message}
          </span>
        `,
            "success",
          );
          setTimeout(() => location.reload(), 1000);
        } else {
          mostrarNotificacion(
            `
          <span class="inline-flex items-center gap-2">
            <i data-lucide='x-circle' class='w-4 h-4'></i>
            ${data.message}
          </span>
        `,
            "error",
          );
        }
      })
      .catch(() =>
        mostrarNotificacion(
          `
      <span class="inline-flex items-center gap-2">
        <i data-lucide='x-circle' class='w-4 h-4'></i>
        ${t("connectionError")}
      </span>
    `,
          "error",
        ),
      );
  };

  window.editarNombre = function (mac) {
    const fila = document.querySelector(
      `tr[data-mac="${mac.toLowerCase()}"] td:nth-child(3)`,
    );
    const nombreActual = fila.innerText.trim();

    fila.innerHTML = `
    <div class="flex items-center gap-2">
      <input type="text" value="${nombreActual}"
        class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               text-sm w-40 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
      <button data-i18n="guardar"
        class="bg-accent hover:bg-highlight text-white px-3 py-1 rounded-lg text-sm">
        ${t("guardar")}
      </button>
    </div>
  `;

    const lang = localStorage.getItem("lang") || "es";
    setLanguage(lang);

    const input = fila.querySelector("input");
    const boton = fila.querySelector("button");

    boton.addEventListener("click", () => {
      const nuevoNombre = input.value.trim();
      if (!nuevoNombre) return;

      fetch("/api/nombrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac: mac, nombre: nuevoNombre }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            mostrarNotificacion(
              `
            <span class="flex items-center gap-2">
              <i data-lucide="check" class="w-5 h-5 flex-shrink-0"></i>
              <span>${t("nombre_guardado")}</span>
            </span>
            `,
              "success",
            );

            setTimeout(() => location.reload(), 1000);
          } else {
            mostrarNotificacion(
              `<i data-lucide='x-circle' class='w-4 h-4'></i> ${data.message}`,
              "error",
            );
          }
        })
        .catch(() => {
          mostrarNotificacion(
            `<i data-lucide='x-circle' class='w-4 h-4'></i> ${t("error_guardar_nombre")}`,
            "error",
          );
        });
    });
  };

  function actualizarHoraActual() {
    const ahora = new Date();
    const formateada = ahora.toLocaleString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    document.getElementById("horaActual").textContent = formateada;
  }

  setInterval(actualizarHoraActual, 1000);
  actualizarHoraActual();

  window.escanearAhora = async () => {
    mostrarNotificacion(
      `
    <div class="flex items-center gap-2">
      <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
      <span>${t("scanning")}</span>
    </div>
    `,
      "info",
      2000,
    );

    try {
      const [res] = await Promise.all([
        fetch("/api/scan"),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      const dispositivos = await res.json();

      if (Array.isArray(dispositivos)) {
        mostrarNotificacion(
          `
        <div class="flex items-center gap-2">
          <i data-lucide="check-circle-2" class="w-5 h-5 text-green-500"></i>
          <span>${t("scanDone")}</span>
        </div>
        `,
          "success",
          2000,
        );
        actualizarTabla(dispositivos);
      } else {
        mostrarNotificacion(
          `
        <div class="flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-5 h-5 text-yellow-500"></i>
          <span>${t("scanError")}</span>
        </div>
        `,
          "error",
          2000,
        );
      }
    } catch (e) {
      mostrarNotificacion(
        `
      <div class="flex items-center gap-2">
        <i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>
        <span>${t("scanError")}</span>
      </div>
      `,
        "error",
        2000,
      );
      console.error(e);
    }
  };

  function actualizarTabla(dispositivos) {
    const tbody = document.getElementById("tabla-dispositivos");
    tbody.innerHTML = "";

    dispositivos.forEach((d, index) => {
      const rowClass =
        (index + 1) % 2 === 0
          ? "bg-white/70 dark:bg-white/5"
          : "bg-[#fef6ef]/70 dark:bg-gray-800/50";

      const row = document.createElement("tr");
      row.className = `dispositivo-row transition-all duration-300 ease-in-out ${rowClass} hover:bg-white/90 dark:hover:bg-gray-700/80 hover:scale-[1.01]`;
      row.dataset.nombre = d.nombre ? d.nombre.toLowerCase() : "n/a";
      row.dataset.mac = d.mac.toLowerCase();
      row.dataset.confianza = d.confiable ? "confiable" : "no-confiable";

      row.innerHTML = `
      <td class="px-4 py-3">${d.ip}</td>
      <td class="px-4 py-3">${d.mac}</td>
      <td class="px-4 py-3 flex items-center gap-2">
        <span class="text-gray-800 dark:text-gray-200">${d.nombre || "N/A"}</span>
        <button onclick="editarNombre('${d.mac}')" 
          class="text-blue-700 dark:text-blue-300 hover:underline transition-all duration-200">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
      </td>
      <td class="px-4 py-3">${d.fabricante || "—"}</td>
      <td class="px-4 py-3">
        ${
          d.confiable
            ? `<span class="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-green-200/20 dark:text-green-300">
                 <i data-lucide="check-circle" class="w-4 h-4"></i> 
                 <span data-i18n="trusted">Confiable</span>
               </span>`
            : `<span class="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-red-200/20 dark:text-red-300">
                 <i data-lucide="x-circle" class="w-4 h-4"></i> 
                 <span data-i18n="untrusted">No confiable</span>
               </span>`
        }
      </td>
      <td id="puertos-${d.ip.replace(/\./g, "-")}" class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
        <button onclick="verPuertos('${d.ip}')" 
          class="inline-flex items-center gap-2 text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition duration-200">
          <i data-lucide="search" class="w-4 h-4 text-blue-600"></i>
          <span data-i18n="view_ports">Ver puertos</span>
        </button>
      </td>
    `;

      tbody.appendChild(row);
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  window.verPuertos = function (ip) {
    const modal = document.getElementById("modal-puertos");
    const contenido = document.getElementById("contenido-puertos");

    contenido.innerHTML = `
    <div class="flex flex-col items-center gap-4 py-4 text-orange-800 dark:text-orange-400 transition-all duration-300">
      <i data-lucide="scan" class="animate-pulse w-8 h-8"></i>
      <span class="text-sm font-semibold tracking-wide">
        ${t("scanning_ports").replace("{{ip}}", ip)}
      </span>
      <div class="w-full max-w-sm h-2 bg-orange-200 dark:bg-orange-800 rounded-full overflow-hidden shadow-inner">
        <div class="animate-[progress_2s_ease-in-out_infinite] bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 h-full w-1/2"></div>
      </div>
    </div>

    <style>
      @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    </style>
  `;
    modal.classList.remove("hidden");
    lucide.createIcons();

    fetch("/api/puertos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.puertos.length === 0) {
            contenido.innerHTML = `
            <div class="flex items-center gap-2 p-4 rounded-lg bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 shadow-sm">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <span class="text-sm">${t("no_ports").replace("{{ip}}", ip)}</span>
            </div>
          `;
          } else {
            const lista = data.puertos
              .map(
                (p) => `
              <div class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <div class="flex items-center gap-2">
                  <i data-lucide="server" class="w-4 h-4 text-orange-500"></i>
                  <span class="font-mono text-sm font-semibold">${p.puerto}</span>
                </div>
                <span class="text-xs text-gray-600 dark:text-gray-300">${p.servicio}</span>
              </div>`,
              )
              .join("");

            contenido.innerHTML = `
            <div class="mb-4">
              <p class="text-sm font-medium mb-2">
                ${t("host_label")}:
              </p>
              <span class="px-3 py-1.5 inline-block rounded-md bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-mono text-sm">
                ${ip}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${lista}
            </div>
          `;
          }
        } else {
          contenido.innerHTML = `
          <div class="flex items-center gap-2 p-4 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 shadow-sm">
            <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            <span class="text-sm">${data.message}</span>
          </div>
        `;
        }
        lucide.createIcons();
      })
      .catch(() => {
        contenido.innerHTML = `
        <div class="flex items-center gap-2 p-4 rounded-lg bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 shadow-sm">
          <i data-lucide="x-circle" class="w-5 h-5"></i>
          <span class="text-sm">${t("error_ports").replace("{{ip}}", ip)}</span>
        </div>
      `;
        lucide.createIcons();
      });
  };
  const inputNombre = document.getElementById("filtro-nombre");
  const inputMac = document.getElementById("filtro-mac");
  const selectConfianza = document.getElementById("filtro-confianza");

  function aplicarFiltros() {
    const filas = document.querySelectorAll(".dispositivo-row");
    const filtroNombre = inputNombre.value.toLowerCase();
    const filtroMac = inputMac.value.toLowerCase();
    const filtroConfianza = selectConfianza.value;

    filas.forEach((fila) => {
      const nombre = fila.dataset.nombre;
      const mac = fila.dataset.mac;
      const confianza = fila.dataset.confianza;

      const coincideNombre = nombre.includes(filtroNombre);
      const coincideMac = mac.includes(filtroMac);
      const coincideConfianza =
        filtroConfianza === "" || confianza === filtroConfianza;

      fila.style.display =
        coincideNombre && coincideMac && coincideConfianza ? "" : "none";
    });
  }

  inputNombre.addEventListener("input", aplicarFiltros);
  inputMac.addEventListener("input", aplicarFiltros);
  selectConfianza.addEventListener("change", aplicarFiltros);

  const toggleMenu = document.getElementById("toggleMenu");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  toggleMenu.addEventListener("click", () => {
    sidebar.classList.toggle("-translate-x-full");
    overlay.classList.toggle("hidden");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  });

  setInterval(() => window.escanearAhora(), 60000);
});
