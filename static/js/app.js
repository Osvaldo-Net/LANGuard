
document.addEventListener("DOMContentLoaded", () => {

    /* =======================
        UTILIDADES BÁSICAS
    ========================== */

    const $ = (id) => document.getElementById(id);
    const root = document.documentElement;

    const iconosTema = {
        luna: $("icono-luna"),
        sol: $("icono-sol"),
        lunaMob: $("icono-luna-mobile"),
        solMob: $("icono-sol-mobile")
    };

    const noti = $("notificacion");

    const toggleHidden = (el, state) => el && el.classList.toggle("hidden", state);


    /* =======================
        MODO OSCURO
    ========================== */

    const aplicarTema = () => {
        const dark = localStorage.getItem("modoOscuro") === "true";
        root.classList.toggle("dark", dark);
        actualizarIcono();
    };

    const actualizarIcono = () => {
        const dark = root.classList.contains("dark");

        toggleHidden(iconosTema.luna, dark);
        toggleHidden(iconosTema.sol, !dark);
        toggleHidden(iconosTema.lunaMob, dark);
        toggleHidden(iconosTema.solMob, !dark);
    };

    window.toggleDarkMode = () => {
        const dark = root.classList.toggle("dark");
        localStorage.setItem("modoOscuro", dark);
        actualizarIcono();
    };

    aplicarTema();


    /* =======================
        NOTIFICACIONES
    ========================== */

    function mostrarNotificacion(html, tipo = "info") {
        const colores = {
            info: "bg-orange-100 text-orange-800",
            success: "bg-green-100 text-green-800",
            error: "bg-red-100 text-red-800",
            warning: "bg-yellow-100 text-yellow-800"
        };

        noti.innerHTML = html;
        noti.className = `
      fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg z-50
      transition-all duration-300 max-w-sm w-full ${colores[tipo]}
    `;
        noti.classList.remove("hidden");

        lucide.createIcons();
        setTimeout(() => noti.classList.add("hidden"), 5000);
    }


    /* =======================
        MODAL
    ========================== */

    window.cerrarModal = () => $("modal-puertos").classList.add("hidden");


    /* =======================
        AGREGAR MAC
    ========================== */

    $("form-agregar")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const mac = $("input-mac").value.trim();
        if (!mac) return;

        mostrarNotificacion(`
      <span class="flex items-center gap-2">
        <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
        ${t("adding")}
      </span>
    `);

        try {
            const res = await fetch("/api/agregar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mac
                }),
            });

            const data = await res.json();

            mostrarNotificacion(
                `
        <span class="flex items-center gap-2">
          <i data-lucide="${data.success ? "check" : "x-circle"}" class="w-4 h-4"></i>
          ${data.success ? t("success") : t("error")}
        </span>
      `,
                data.success ? "success" : "error"
            );

            if (data.success) setTimeout(() => location.reload(), 900);

        } catch {
            mostrarNotificacion(`
        <span class="flex items-center gap-2">
          <i data-lucide="x-circle" class="w-4 h-4"></i> ${t("connectionError")}
        </span>
      `, "error");
        }
    });


    /* =======================
        ELIMINAR MAC
    ========================== */

    window.eliminarMAC = (mac) => {
        mostrarNotificacion(`
      <span class="flex items-center gap-2">
        <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
        ${t("eliminando")}
      </span>
    `);

        fetch("/api/eliminar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mac
                })
            })
            .then(r => r.json())
            .then(data => {
                mostrarNotificacion(`
          <span class="flex items-center gap-2">
            <i data-lucide="${data.success ? "check" : "x-circle"}" class="w-4 h-4"></i>
            ${data.message}
          </span>
        `, data.success ? "success" : "error");

                if (data.success) setTimeout(() => location.reload(), 900);
            })
            .catch(() => mostrarNotificacion(`
          <i data-lucide="x-circle" class="w-4 h-4"></i> ${t("connectionError")}
      `, "error"));
    };


    /* =======================
       EDITAR NOMBRE (PRO)
    ========================== */

    window.editarNombre = (mac) => {
        const celda = document.querySelector(`tr[data-mac="${mac.toLowerCase()}"] td:nth-child(3)`);
        const actual = celda.querySelector("span")?.innerText.trim() || "";

        celda.innerHTML = `
        <div class="flex items-center gap-2">
            <input id="input-nombre-${mac.replace(/:/g, '')}"
                   class="px-2 py-1 border rounded-lg text-sm w-40
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                   value="${actual}">
            <button id="btn-guardar-${mac.replace(/:/g, '')}"
                    class="bg-accent hover:bg-highlight text-white px-3 py-1 rounded-lg text-sm">
                ${t("guardar")}
            </button>
        </div>
    `;

        const input = document.getElementById(`input-nombre-${mac.replace(/:/g, '')}`);
        const btn = document.getElementById(`btn-guardar-${mac.replace(/:/g, '')}`);

        btn.onclick = () => {
            const nombre = input.value.trim();
            if (!nombre) return;

            fetch("/api/nombrar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        mac,
                        nombre
                    })
                })
                .then(r => r.json())
                .then(d => {

                    mostrarNotificacion(`
        <span class="flex items-center gap-2">
          <i data-lucide="${d.success ? "check" : "x-circle"}" class="w-5 h-5"></i>
          ${d.success ? t("nombre_guardado") : d.message}
        </span>
    `, d.success ? "success" : "error");

                    if (!d.success) return;

                    /* =============================
                       1️⃣ TABLA PRINCIPAL
                    ============================== */

                    const fila = document.querySelector(
                        `tr[data-mac="${mac.toLowerCase()}"]`
                    );

                    if (fila) {
                        // dataset para filtros
                        fila.dataset.nombre = nombre.toLowerCase();

                        const celdaNombre = fila.querySelector("td:nth-child(3)");
                        if (celdaNombre) {
                            celdaNombre.innerHTML = `
                <span class="text-gray-800 dark:text-gray-200">
                    ${nombre}
                </span>
                <button onclick="editarNombre('${mac}')"
                        class="ml-2 text-accent hover:text-highlight transition">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>
            `;
                        }
                    }

                    /* =============================
                       2️⃣ LISTA DE CONFIABLES
                    ============================== */

                    const liConfiable = document.querySelector(
                        `#lista-macs li[data-mac="${mac.toLowerCase()}"]`
                    );

                    if (liConfiable) {
                        const spanNombre = liConfiable.querySelector(".nombre-confiable");
                        if (spanNombre) {
                            spanNombre.textContent = nombre || "Sin nombre";
                        }
                    }

                    lucide.createIcons();
                })
                .catch(() => {
                    mostrarNotificacion(
                        `<i data-lucide="x-circle" class="w-4 h-4"></i> ${t("error_guardar_nombre")}`,
                        "error"
                    );
                });

        };
    };

    /* =======================
        HORA ACTUAL
    ========================== */

    const actualizarHora = () =>
        $("horaActual").textContent = new Date().toLocaleString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

    setInterval(actualizarHora, 1000);
    actualizarHora();


    /* =======================
        ESCANEO
    ========================== */

    window.escanearAhora = async () => {
        mostrarNotificacion(`
    <div class="flex items-center gap-2">
      <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
      <span>${t("scanning")}</span>
    </div>
  `);

        const startTime = Date.now();
        let data;

        try {
            const res = await fetch("/api/scan");
            data = await res.json();
        } catch {
            // Asegurar que el mensaje de "escaneando" dure al menos 1.5s
            const delay = 1500 - (Date.now() - startTime);
            if (delay > 0) await new Promise(r => setTimeout(r, delay));

            mostrarNotificacion(`
      <i data-lucide="alert-circle"></i> ${t("scanError")}
    `, "error");
            return;
        }

        const delay = 1500 - (Date.now() - startTime);
        if (delay > 0) await new Promise(r => setTimeout(r, delay));

        if (Array.isArray(data)) {
            mostrarNotificacion(`
      <span class="flex items-center gap-2">
        <i data-lucide="check-circle-2"></i>${t("scanDone")}
      </span>
    `, "success");

            actualizarTabla(data);
        } else {
            mostrarNotificacion(`
      <i data-lucide="alert-circle"></i> ${t("scanError")}
    `, "error");
        }
    };


    /* =======================
        TABLA DISPOSITIVOS
    ========================== */

    function actualizarTabla(devs) {
        const tbody = $("tabla-dispositivos");
        tbody.innerHTML = "";

        devs.forEach(d => {
            const tr = document.createElement("tr");
            tr.className = `
        dispositivo-row hover:bg-gray-50 dark:hover:bg-dark3/60
        border-b dark:border-gray-700 transition
      `;
            tr.dataset.nombre = (d.nombre || "").toLowerCase();
            tr.dataset.mac = d.mac.toLowerCase();
            tr.dataset.confianza = d.confiable ? "confiable" : "no-confiable";

            tr.innerHTML = `
        <td class="px-4 py-3">${d.ip}</td>
        <td class="px-4 py-3">${d.mac}</td>

        <td class="px-4 py-3 flex items-center gap-2">
          <span>${d.nombre || "N/A"}</span>
          <button onclick="editarNombre('${d.mac}')"
            class="text-accent hover:text-highlight">
            <i data-lucide="pencil" class="w-4 h-4"></i>
          </button>
        </td>

        <td class="px-4 py-3">${d.fabricante || "—"}</td>

        <td class="px-4 py-3">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
            ${d.confiable
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"}">
            <i data-lucide="${d.confiable ? "check-circle" : "x-circle"}"
               class="w-4 h-4"></i>
            ${d.confiable ? "Confiable" : "No confiable"}
          </span>
        </td>

        <td class="px-4 py-3">
          <button onclick="verPuertos('${d.ip}')"
            class="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">
            <i data-lucide="search"></i> Ver puertos
          </button>
        </td>
      `;

            tbody.appendChild(tr);
        });

        lucide.createIcons();
    }


    /* =======================
        PUERTOS
    ========================== */

    window.verPuertos = (ip) => {
        const modal = $("modal-puertos");
        const cont = $("contenido-puertos");

        cont.innerHTML = `
      <div class="flex flex-col items-center gap-4 py-4">
        <i data-lucide="scan" class="animate-pulse w-8 h-8"></i>
        <span>${t("scanning_ports").replace("{{ip}}", ip)}</span>
      </div>
    `;

        modal.classList.remove("hidden");
        lucide.createIcons();

        fetch("/api/puertos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ip
                })
            })
            .then(r => r.json())
            .then(data => {
                if (!data.success) throw new Error(data.message);

                if (data.puertos.length === 0) {
                    cont.innerHTML = `
            <div class="p-4 bg-green-100 dark:bg-green-800 rounded-lg flex items-center gap-2">
              <i data-lucide="check-circle"></i>
              <span>${t("no_ports").replace("{{ip}}", ip)}</span>
            </div>
          `;
                } else {
                    cont.innerHTML = `
            <div class="mb-3">
              <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900 rounded-md">${ip}</span>
            </div>
            <div class="grid gap-3">
              ${data.puertos.map(p => `
                <div class="p-3 border rounded-lg flex justify-between bg-white dark:bg-gray-800">
                  <span class="font-mono">${p.puerto}</span>
                  <span class="text-xs">${p.servicio}</span>
                </div>
              `).join("")}
            </div>
          `;
                }

                lucide.createIcons();
            })
            .catch(() => {
                cont.innerHTML = `
          <div class="p-4 bg-red-100 dark:bg-red-800 rounded-lg flex items-center gap-2">
            <i data-lucide="x-circle"></i>
            <span>${t("error_ports").replace("{{ip}}", ip)}</span>
          </div>
        `;
                lucide.createIcons();
            });
    };

    /* =======================
       SELECTS
    ========================== */

    const btn = document.getElementById("langBtn");
    const menu = document.getElementById("langMenu");

    btn.addEventListener("click", () => {
        menu.classList.toggle("hidden");
    });

    window.setLang = function(lang, country, label) {
        const flag = document.getElementById("langFlag");
        flag.className = "";
        flag.classList.add("fi", `fi-${country}`, "w-5", "h-4", "rounded-sm");
        document.getElementById("langLabel").textContent = label;
        document.getElementById("langMenu").classList.add("hidden");
        setLanguage(lang);
    };

    const trustBtn = document.getElementById("trustBtn");
    const trustMenu = document.getElementById("trustMenu");
    const trustLabel = document.getElementById("trustLabel");

    trustBtn.addEventListener("click", () => {
        trustMenu.classList.toggle("hidden");
    });

    window.setTrustFilter = function(valor) {
        filtroConfianza = valor === "all" ? "" : valor;

        const labelMap = {
            all: "filterAll",
            trusted: "filterTrusted",
            untrusted: "filterUntrusted",
        };

        trustLabel.textContent = t(labelMap[valor]);

        trustMenu.classList.add("hidden");
        aplicarFiltros();
    };


    /* =======================
       FILTROS
    ========================== */

    let filtroConfianza = "";
    let filtroConfianzaKey = "filterAll";

    const filtros = {
        nombre: document.getElementById("filtro-nombre"),
        mac: document.getElementById("filtro-mac")
    };

    const aplicarFiltros = () => {
        const filas = document.querySelectorAll(".dispositivo-row");

        filas.forEach(fila => {
            const ok =
                fila.dataset.nombre.includes(filtros.nombre.value.toLowerCase()) &&
                fila.dataset.mac.includes(filtros.mac.value.toLowerCase()) &&
                (!filtroConfianza || fila.dataset.confianza === filtroConfianza);

            fila.style.display = ok ? "" : "none";
        });
    };

    filtros.nombre.addEventListener("input", aplicarFiltros);
    filtros.mac.addEventListener("input", aplicarFiltros);

   function setTrustFilter(valor, i18nKey) {
  filtroConfianza = valor;
  filtroConfianzaKey = i18nKey;

  aplicarFiltros();
  actualizarLabelFiltro();

  document.getElementById("trustMenu").classList.add("hidden");
}


   function actualizarLabelFiltro() {
  const label = document.getElementById("trustLabel");
  if (!label) return;

  const key = filtroConfianzaKey || "filterAll";
  const texto = translations[langActual]?.[key];

  if (!texto) return; 

  label.textContent = texto;
  label.setAttribute("data-i18n", key);
}



    /* =======================
        MENU RESPONSIVE
    ========================== */

    const sidebar = $("sidebar");
    const overlay = $("overlay");

    $("toggleMenu")?.addEventListener("click", () => {
        sidebar.classList.toggle("-translate-x-full");
        overlay.classList.toggle("hidden");
    });

    overlay?.addEventListener("click", () => {
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
    });


    /* =======================
        ESCANEO AUTOMÁTICO
    ========================== */

    setInterval(() => window.escanearAhora(), 60000);

    lucide.createIcons();

});




