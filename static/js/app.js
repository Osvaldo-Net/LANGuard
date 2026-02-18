// =======================
// ESTADO GLOBAL DE FILTROS
// =======================

let filtroConfianza   = "";
let filtroConfianzaKey = "filterAll";

function actualizarLabelFiltro() {
  const label = document.getElementById("trustLabel");
  if (!label) return;
  label.textContent = t(filtroConfianzaKey);
  label.setAttribute("data-i18n", filtroConfianzaKey);
}

// =======================
// INIT
// =======================

document.addEventListener("DOMContentLoaded", () => {

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const noti = $("notificacion");

  // =======================
  // MODO OSCURO
  // =======================

  const aplicarTema = () => {
    const dark = localStorage.getItem("modoOscuro") === "true";
    root.classList.toggle("dark", dark);
    actualizarIcono();
  };

  const actualizarIcono = () => {
    const dark = root.classList.contains("dark");
    // solo los iconos que existan en el DOM
    [$("icono-luna"), $("icono-luna-mobile")].forEach(el => el?.classList.toggle("hidden", dark));
    [$("icono-sol"),  $("icono-sol-mobile") ].forEach(el => el?.classList.toggle("hidden", !dark));
  };

  window.toggleDarkMode = () => {
    localStorage.setItem("modoOscuro", root.classList.toggle("dark"));
    actualizarIcono();
  };

  aplicarTema();

  // =======================
  // NOTIFICACIONES
  // =======================

  const COLORES_NOTI = {
    info:    "bg-orange-100 text-orange-800",
    success: "bg-green-100 text-green-800",
    error:   "bg-red-100 text-red-800",
    warning: "bg-yellow-100 text-yellow-800"
  };

  let _notiTimer = null;

  function mostrarNotificacion(html, tipo = "info") {
    noti.innerHTML = html;
    noti.className = `fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg z-50
      transition-all duration-300 max-w-sm w-full ${COLORES_NOTI[tipo]}`;
    noti.classList.remove("hidden");
    lucide.createIcons();

    // Cancelar timer anterior si el usuario dispara varias notificaciones rápido
    clearTimeout(_notiTimer);
    _notiTimer = setTimeout(() => noti.classList.add("hidden"), 4000);
  }

  // =======================
  // MODAL PUERTOS
  // =======================

  window.cerrarModal = () => $("modal-puertos").classList.add("hidden");

  // Cerrar modal con Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") window.cerrarModal();
  });

  // =======================
  // AGREGAR MAC
  // =======================

  $("form-agregar")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mac = $("input-mac").value.trim();
    if (!mac) return;

    mostrarNotificacion(`<span class="flex items-center gap-2">
      <i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${t("adding")}
    </span>`);

    try {
      const res  = await fetch("/api/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac })
      });
      const data = await res.json();

      mostrarNotificacion(`<span class="flex items-center gap-2">
        <i data-lucide="${data.success ? "check" : "x-circle"}" class="w-4 h-4"></i>
        ${data.success ? t("success") : t("error")}
      </span>`, data.success ? "success" : "error");

      if (data.success) setTimeout(() => location.reload(), 900);

    } catch {
      mostrarNotificacion(`<span class="flex items-center gap-2">
        <i data-lucide="x-circle" class="w-4 h-4"></i> ${t("connectionError")}
      </span>`, "error");
    }
  });

  // =======================
  // ELIMINAR MAC
  // =======================

  window.eliminarMAC = async (mac) => {
    mostrarNotificacion(`<span class="flex items-center gap-2">
      <i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${t("eliminando")}
    </span>`);

    try {
      const res  = await fetch("/api/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac })
      });
      const data = await res.json();

      mostrarNotificacion(`<span class="flex items-center gap-2">
        <i data-lucide="${data.success ? "check" : "x-circle"}" class="w-4 h-4"></i>
        ${data.success ? t("eliminado") : t("connectionError")}
      </span>`, data.success ? "success" : "error");

      if (data.success) setTimeout(() => location.reload(), 900);

    } catch {
      mostrarNotificacion(`<i data-lucide="x-circle" class="w-4 h-4"></i> ${t("connectionError")}`, "error");
    }
  };

  // =======================
  // EDITAR NOMBRE
  // =======================

  window.editarNombre = (mac) => {
    const fila   = document.querySelector(`tr[data-mac="${mac.toLowerCase()}"]`);
    const celda  = fila?.querySelector("td:nth-child(3)");
    if (!celda) return;

    const actual = celda.querySelector("span")?.innerText.trim() || "";
    const safeId = mac.replace(/:/g, "");

    celda.innerHTML = `
      <div class="flex items-center gap-2">
        <input id="input-nombre-${safeId}"
               class="px-2 py-1 border rounded-lg text-sm w-40
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
               value="${actual}">
        <button id="btn-guardar-${safeId}"
                class="bg-accent hover:bg-highlight text-white px-3 py-1 rounded-lg text-sm">
          ${t("guardar")}
        </button>
      </div>`;

    const input = $(`input-nombre-${safeId}`);
    input.focus();

    // Guardar con botón o con Enter
    const guardar = async () => {
      const nombre = input.value.trim();
      if (!nombre) return;

      try {
        const res = await fetch("/api/nombrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mac, nombre })
        });
        const d = await res.json();

        mostrarNotificacion(`<span class="flex items-center gap-2">
          <i data-lucide="${d.success ? "check" : "x-circle"}" class="w-5 h-5"></i>
          ${d.success ? t("nombre_guardado") : t("error_guardar_nombre")}
        </span>`, d.success ? "success" : "error");

        if (!d.success) return;

        // Actualizar tabla principal
        if (fila) {
          fila.dataset.nombre = nombre.toLowerCase();
          celda.innerHTML = `
            <span class="text-gray-800 dark:text-gray-200">${nombre}</span>
            <button onclick="editarNombre('${mac}')" class="ml-2 text-accent hover:text-highlight transition">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>`;
        }

        // Actualizar lista de confiables
        const li = document.querySelector(`#lista-macs li[data-mac="${mac.toLowerCase()}"]`);
        const spanNombre = li?.querySelector(".nombre-confiable");
        if (spanNombre) spanNombre.textContent = nombre;

        lucide.createIcons();

      } catch {
        mostrarNotificacion(`<i data-lucide="x-circle" class="w-4 h-4"></i> ${t("error_guardar_nombre")}`, "error");
      }
    };

    $(`btn-guardar-${safeId}`).onclick = guardar;
    input.addEventListener("keydown", e => { if (e.key === "Enter") guardar(); });
  };

  // =======================
  // HORA ACTUAL
  // =======================

  const actualizarHora = () => {
    const el = $("horaActual");
    if (el) el.textContent = new Date().toLocaleString("es-CO", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
  };

  setInterval(actualizarHora, 1000);
  actualizarHora();

  // =======================
  // ESCANEO MANUAL
  // =======================

  window.escanearAhora = async () => {
    mostrarNotificacion(`<div class="flex items-center gap-2">
      <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
      <span>${t("scanning")}</span>
    </div>`);

    const t0 = Date.now();
    try {
      const res  = await fetch("/api/scan");
      const data = await res.json();

      // Garantizar al menos 1.5 s de feedback visual
      const espera = 1500 - (Date.now() - t0);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));

      if (!Array.isArray(data)) throw new Error("bad response");

      mostrarNotificacion(`<span class="flex items-center gap-2">
        <i data-lucide="check-circle-2"></i>${t("scanDone")}
      </span>`, "success");

      actualizarTabla(data);

    } catch {
      const espera = 1500 - (Date.now() - t0);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));
      mostrarNotificacion(`<i data-lucide="alert-circle"></i> ${t("scanError")}`, "error");
    }
  };

  // =======================
  // TABLA DISPOSITIVOS
  // =======================

  function crearFilaDispositivo(d) {
    const tr = document.createElement("tr");
    tr.className = "dispositivo-row hover:bg-gray-50 dark:hover:bg-dark3/60 border-b dark:border-gray-700 transition";
    tr.dataset.nombre   = (d.nombre || "").toLowerCase();
    tr.dataset.mac      = d.mac.toLowerCase();
    tr.dataset.confianza = d.confiable ? "confiable" : "no-confiable";

    const badgeClass = d.confiable
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";
    const badgeIcon  = d.confiable ? "check-circle" : "x-circle";
    const badgeText  = d.confiable ? t("trusted") : t("untrusted");

    tr.innerHTML = `
      <td class="px-4 py-3">${d.ip}</td>
      <td class="px-4 py-3">${d.mac}</td>
      <td class="px-4 py-3 flex items-center gap-2">
        <span>${d.nombre || "N/A"}</span>
        <button onclick="editarNombre('${d.mac}')" class="text-accent hover:text-highlight">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
      </td>
      <td class="px-4 py-3">${d.fabricante || "—"}</td>
      <td class="px-4 py-3">
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${badgeClass}">
          <i data-lucide="${badgeIcon}" class="w-4 h-4"></i> ${badgeText}
        </span>
      </td>
      <td class="px-4 py-3">
        <button onclick="verPuertos('${d.ip}')"
          class="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200">
          <i data-lucide="search"></i> ${t("view_ports")}
        </button>
      </td>`;
    return tr;
  }

  function actualizarTabla(devs) {
    const tbody = $("tabla-dispositivos");
    // DocumentFragment para un solo reflow
    const frag = document.createDocumentFragment();
    devs.forEach(d => frag.appendChild(crearFilaDispositivo(d)));
    tbody.replaceChildren(frag);
    lucide.createIcons();
    aplicarFiltros(); // respetar filtros activos tras actualizar
  }

  // =======================
  // PUERTOS
  // =======================

  window.verPuertos = (ip) => {
    const modal = $("modal-puertos");
    const cont  = $("contenido-puertos");

    cont.innerHTML = `<div class="flex flex-col items-center gap-4 py-4">
      <i data-lucide="scan" class="animate-pulse w-8 h-8"></i>
      <span>${t("scanning_ports").replace("{{ip}}", ip)}</span>
    </div>`;

    modal.classList.remove("hidden");
    lucide.createIcons();

    fetch("/api/puertos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip })
    })
    .then(r => r.json())
    .then(data => {
      if (!data.success) throw new Error(data.message);

      cont.innerHTML = data.puertos.length === 0
        ? `<div class="p-4 bg-green-100 dark:bg-green-800 rounded-lg flex items-center gap-2">
             <i data-lucide="check-circle"></i>
             <span>${t("no_ports").replace("{{ip}}", ip)}</span>
           </div>`
        : `<div class="mb-3">
             <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900 rounded-md">${ip}</span>
           </div>
           <div class="grid gap-3">
             ${data.puertos.map(p => `
               <div class="p-3 border rounded-lg flex justify-between bg-white dark:bg-gray-800">
                 <span class="font-mono">${p.puerto}</span>
                 <span class="text-xs">${p.servicio}</span>
               </div>`).join("")}
           </div>`;

      lucide.createIcons();
    })
    .catch(() => {
      cont.innerHTML = `<div class="p-4 bg-red-100 dark:bg-red-800 rounded-lg flex items-center gap-2">
        <i data-lucide="x-circle"></i>
        <span>${t("error_ports").replace("{{ip}}", ip)}</span>
      </div>`;
      lucide.createIcons();
    });
  };

  // =======================
  // SELECTOR DE IDIOMA
  // =======================

  $("langBtn")?.addEventListener("click", () =>
    $("langMenu").classList.toggle("hidden")
  );

  window.setLang = (lang, country, label) => {
    const flag = $("langFlag");
    flag.className = `fi fi-${country} w-5 h-4 rounded-sm`;
    $("langLabel").textContent = label;
    $("langMenu").classList.add("hidden");
    setLanguage(lang);
  };

  // =======================
  // FILTRO CONFIANZA
  // =======================

  $("trustBtn")?.addEventListener("click", () =>
    $("trustMenu").classList.toggle("hidden")
  );

  window.setTrustFilter = (valor) => {
    const map = {
      all:       { valor: "",             key: "filterAll" },
      trusted:   { valor: "confiable",    key: "filterTrusted" },
      untrusted: { valor: "no-confiable", key: "filterUntrusted" }
    };
    const conf = map[valor];
    if (!conf) return;

    filtroConfianza    = conf.valor;
    filtroConfianzaKey = conf.key;

    aplicarFiltros();
    actualizarLabelFiltro();
    $("trustMenu").classList.add("hidden");
  };

  // =======================
  // FILTROS TEXTO
  // =======================

  const filtros = {
    nombre: $("filtro-nombre"),
    mac:    $("filtro-mac")
  };

  const aplicarFiltros = () => {
    const nombre = filtros.nombre?.value.toLowerCase() || "";
    const mac    = filtros.mac?.value.toLowerCase()    || "";

    document.querySelectorAll(".dispositivo-row").forEach(fila => {
      const ok =
        fila.dataset.nombre.includes(nombre) &&
        fila.dataset.mac.includes(mac) &&
        (!filtroConfianza || fila.dataset.confianza === filtroConfianza);
      fila.style.display = ok ? "" : "none";
    });
  };

  filtros.nombre?.addEventListener("input", aplicarFiltros);
  filtros.mac?.addEventListener("input", aplicarFiltros);

  // =======================
  // MENÚ RESPONSIVE
  // =======================

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

  // =======================
  // ESCANEO AUTOMÁTICO  (alineado con CACHE_INTERVALO del backend: 120 s)
  // =======================

  setInterval(() => window.escanearAhora(), 120_000);

  lucide.createIcons();
});
