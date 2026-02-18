// =======================
// ESTADO GLOBAL FILTROS
// =======================
let filtroConfianza    = "";
let filtroConfianzaKey = "filterAll";

function actualizarLabelFiltro() {
  const label = document.getElementById("trustLabel");
  if (!label) return;
  label.textContent = t(filtroConfianzaKey);
  label.setAttribute("data-i18n", filtroConfianzaKey);
}

// =======================
// NOTIFICACIONES (global)
// =======================
const COLORES_NOTI = {
  info:    "bg-orange-100 text-orange-800",
  success: "bg-emerald-100 text-emerald-800",
  error:   "bg-red-100 text-red-800",
  warning: "bg-yellow-100 text-yellow-800"
};
let _notiTimer = null;

function mostrarNotificacion(html, tipo = "info") {
  const noti = document.getElementById("notificacion");
  if (!noti) return;
  noti.innerHTML = html;
  noti.className = `fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg z-50
    transition-all duration-300 max-w-xs w-full text-sm font-medium ${COLORES_NOTI[tipo]}`;
  noti.classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
  clearTimeout(_notiTimer);
  _notiTimer = setTimeout(() => noti.classList.add("hidden"), 4000);
}

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  // ── DARK MODE ──
  const aplicarTema = () => {
    const dark = localStorage.getItem("modoOscuro") === "true";
    root.classList.toggle("dark", dark);
    actualizarIcono();
  };
  const actualizarIcono = () => {
    const dark = root.classList.contains("dark");
    [$("icono-luna"), $("icono-luna-mobile")].forEach(el => el?.classList.toggle("hidden", dark));
    [$("icono-sol"),  $("icono-sol-mobile") ].forEach(el => el?.classList.toggle("hidden", !dark));
  };
  window.toggleDarkMode = () => {
    localStorage.setItem("modoOscuro", root.classList.toggle("dark"));
    actualizarIcono();
  };
  aplicarTema();

  // ── MODAL PUERTOS ──
  window.cerrarModal = () => $("modal-puertos")?.classList.add("hidden");

  // ── AGREGAR MAC ──
  $("form-agregar")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mac = $("input-mac").value.trim();
    if (!mac) return;
    mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${t("adding")}</span>`);
    try {
      const res  = await fetch("/api/agregar", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mac})});
      const data = await res.json();
      mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="${data.success?"check":"x-circle"}" class="w-4 h-4"></i> ${data.success ? t("success") : t("error")}</span>`, data.success ? "success" : "error");
      if (data.success) setTimeout(() => location.reload(), 900);
    } catch {
      mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> ${t("connectionError")}</span>`, "error");
    }
    lucide.createIcons();
  });

  // ── ELIMINAR MAC ──
  window.eliminarMAC = async (mac) => {
    mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> ${t("eliminando")}</span>`);
    try {
      const res  = await fetch("/api/eliminar", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mac})});
      const data = await res.json();
      mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="${data.success?"check":"x-circle"}" class="w-4 h-4"></i> ${data.success ? t("eliminado") : t("connectionError")}</span>`, data.success ? "success" : "error");
      if (data.success) setTimeout(() => location.reload(), 900);
    } catch {
      mostrarNotificacion(`<i data-lucide="x-circle" class="w-4 h-4"></i> ${t("connectionError")}`, "error");
    }
    lucide.createIcons();
  };

  // ── EDITAR NOMBRE ──
  window.editarNombre = (mac) => {
    const fila  = document.querySelector(`tr[data-mac="${mac.toLowerCase()}"]`);
    const celda = fila?.querySelector("td:nth-child(3)");
    if (!celda) return;
    const actual = celda.querySelector("span")?.innerText.trim() || "";
    const safeId = mac.replace(/:/g, "");
    celda.innerHTML = `
      <div class="flex items-center gap-2">
        <input id="input-nombre-${safeId}" class="px-2 py-1 border rounded-lg text-sm w-36 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-accent focus:outline-none" value="${actual}">
        <button id="btn-guardar-${safeId}" class="bg-accent hover:bg-highlight text-white px-2.5 py-1 rounded-lg text-xs">${t("guardar")}</button>
      </div>`;
    const input = $(`input-nombre-${safeId}`);
    input.focus();
    const guardar = async () => {
      const nombre = input.value.trim();
      if (!nombre) return;
      try {
        const res = await fetch("/api/nombrar", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mac, nombre})});
        const d   = await res.json();
        mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="${d.success?"check":"x-circle"}" class="w-4 h-4"></i> ${d.success ? t("nombre_guardado") : t("error_guardar_nombre")}</span>`, d.success ? "success" : "error");
        if (!d.success) return;
        if (fila) {
          fila.dataset.nombre = nombre.toLowerCase();
          celda.innerHTML = `<div class="flex items-center gap-2"><span class="text-gray-800 dark:text-gray-200">${nombre}</span><button onclick="editarNombre('${mac}')" class="text-accent hover:text-highlight opacity-60 hover:opacity-100"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button></div>`;
        }
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

  // ── HORA ──
  const actualizarHora = () => {
    const el = $("horaActual");
    if (el) el.textContent = new Date().toLocaleString("es-CO", {
      year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true
    });
  };
  setInterval(actualizarHora, 1000);
  actualizarHora();

  // ── ESCANEO MANUAL ──
  window.escanearAhora = async () => {
    mostrarNotificacion(`<div class="flex items-center gap-2"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>${t("scanning")}</span></div>`);
    lucide.createIcons();
    const t0 = Date.now();
    try {
      const res  = await fetch("/api/scan");
      const data = await res.json();
      const espera = 1500 - (Date.now() - t0);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));
      if (!Array.isArray(data)) throw new Error("bad response");
      mostrarNotificacion(`<span class="flex items-center gap-2"><i data-lucide="check-circle-2" class="w-4 h-4"></i>${t("scanDone")}</span>`, "success");
      actualizarTabla(data);
    } catch {
      const espera = 1500 - (Date.now() - t0);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));
      mostrarNotificacion(`<i data-lucide="alert-circle" class="w-4 h-4"></i> ${t("scanError")}`, "error");
    }
    lucide.createIcons();
  };

  // ── TABLA ──
  function crearFilaDispositivo(d) {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 dark:hover:bg-dark3/60 dispositivo-row border-b dark:border-gray-700 transition";
    tr.dataset.nombre   = (d.nombre || "").toLowerCase();
    tr.dataset.mac      = d.mac.toLowerCase();
    tr.dataset.confianza = d.confiable ? "confiable" : "no-confiable";

    const badgeConfiable = d.confiable
      ? `<span class="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-medium">
           <span class="relative flex w-2 h-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full w-2 h-2 bg-emerald-500"></span></span>
           ${t("trusted")}
         </span>`
      : `<span class="inline-flex items-center gap-1.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-medium">
           <span class="w-2 h-2 rounded-full bg-red-500"></span>
           ${t("untrusted")}
         </span>`;

    const accionBtn = d.confiable
      ? `<button onclick="eliminarMAC('${d.mac}')" class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 transition"><i data-lucide="shield-off" class="w-3.5 h-3.5"></i> Quitar</button>`
      : `<button onclick="marcarConfiable('${d.mac}')" class="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 transition"><i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Confiar</button>`;

    tr.innerHTML = `
      <td class="px-4 py-3 font-mono text-xs">${d.ip}</td>
      <td class="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">${d.mac}</td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-gray-800 dark:text-gray-200">${d.nombre || "—"}</span>
          <button onclick="editarNombre('${d.mac}')" class="text-accent hover:text-highlight opacity-60 hover:opacity-100"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
        </div>
      </td>
      <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">${d.fabricante || "—"}</td>
      <td class="px-4 py-3">${badgeConfiable}</td>
      <td class="px-4 py-3">${accionBtn}</td>
      <td class="px-4 py-3">
        <button onclick="verPuertos('${d.ip}')" class="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 transition">
          <i data-lucide="search" class="w-3.5 h-3.5"></i> Puertos
        </button>
      </td>`;
    return tr;
  }

  function actualizarTabla(devs) {
    const tbody = $("tabla-dispositivos");
    const frag  = document.createDocumentFragment();
    devs.forEach(d => frag.appendChild(crearFilaDispositivo(d)));
    tbody.replaceChildren(frag);
    lucide.createIcons();
    aplicarFiltros();
  }

  // ── PUERTOS ──
  window.verPuertos = (ip) => {
    const modal = $("modal-puertos");
    const cont  = $("contenido-puertos");
    cont.innerHTML = `<div class="flex flex-col items-center gap-3 py-6 text-gray-400">
      <i data-lucide="scan" class="animate-pulse w-7 h-7"></i>
      <span class="text-sm">${t("scanning_ports").replace("{{ip}}", ip)}</span>
    </div>`;
    modal.classList.remove("hidden");
    lucide.createIcons();
    fetch("/api/puertos", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ip})})
    .then(r => r.json())
    .then(data => {
      if (!data.success) throw new Error(data.message);
      cont.innerHTML = data.puertos.length === 0
        ? `<div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm"><i data-lucide="check-circle" class="w-4 h-4"></i> ${t("no_ports").replace("{{ip}}", ip)}</div>`
        : `<div class="mb-3"><span class="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-mono">${ip}</span></div>
           <div class="space-y-2">
             ${data.puertos.map(p => `<div class="p-2.5 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between items-center bg-white dark:bg-dark3">
               <span class="font-mono text-sm text-gray-800 dark:text-gray-200">${p.puerto}</span>
               <span class="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">${p.servicio}</span>
             </div>`).join("")}
           </div>`;
      lucide.createIcons();
    })
    .catch(() => {
      cont.innerHTML = `<div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"><i data-lucide="x-circle" class="w-4 h-4"></i> ${t("error_ports").replace("{{ip}}", ip)}</div>`;
      lucide.createIcons();
    });
  };

  // ── IDIOMA ──
  $("langBtn")?.addEventListener("click", () => $("langMenu").classList.toggle("hidden"));
  window.setLang = (lang, country, label) => {
    const flag = $("langFlag");
    flag.className = `fi fi-${country} w-5 h-4 rounded-sm`;
    $("langLabel").textContent = label;
    $("langMenu").classList.add("hidden");
    setLanguage(lang);
  };

  // ── FILTRO CONFIANZA ──
  $("trustBtn")?.addEventListener("click", () => $("trustMenu").classList.toggle("hidden"));
  window.setTrustFilter = (valor) => {
    const map = {all:{valor:"",key:"filterAll"},trusted:{valor:"confiable",key:"filterTrusted"},untrusted:{valor:"no-confiable",key:"filterUntrusted"}};
    const conf = map[valor];
    if (!conf) return;
    filtroConfianza    = conf.valor;
    filtroConfianzaKey = conf.key;
    aplicarFiltros();
    actualizarLabelFiltro();
    $("trustMenu").classList.add("hidden");
  };

  // ── FILTROS TEXTO ──
  const filtros = {nombre: $("filtro-nombre"), mac: $("filtro-mac")};
  const aplicarFiltros = () => {
    const nombre = filtros.nombre?.value.toLowerCase() || "";
    const mac    = filtros.mac?.value.toLowerCase()    || "";
    document.querySelectorAll(".dispositivo-row").forEach(fila => {
      const ok = fila.dataset.nombre.includes(nombre) &&
                 fila.dataset.mac.includes(mac) &&
                 (!filtroConfianza || fila.dataset.confianza === filtroConfianza);
      fila.style.display = ok ? "" : "none";
    });
  };
  filtros.nombre?.addEventListener("input", aplicarFiltros);
  filtros.mac?.addEventListener("input",    aplicarFiltros);

  // ── MENÚ RESPONSIVE ──
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

  // ── AUTO-SCAN ──
  setInterval(() => window.escanearAhora(), 120_000);

  lucide.createIcons();
});
