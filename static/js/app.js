// ══════════════════════════════════════════
// FILTRO CONFIANZA  
// ══════════════════════════════════════════
let filtroConfianza    = "";
let filtroConfianzaKey = "filterAll";

const TRUST_DOTS = {
  all:       "bg-gray-400",
  trusted:   "bg-emerald-500",
  untrusted: "bg-red-500"
};

function actualizarLabelFiltro() {
  const label = document.getElementById("trustLabel");
  const dot   = document.getElementById("trust-dot");
  if (!label) return;
  label.textContent = t(filtroConfianzaKey);
  label.setAttribute("data-i18n", filtroConfianzaKey);
}

// ══════════════════════════════════════════
// NOTIFICACIONES (global)
// ══════════════════════════════════════════
const COLORES_NOTI = {
  info:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  error:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
};
let _notiTimer = null;

function mostrarNotificacion(html, tipo = "info") {
  const noti = document.getElementById("notificacion");
  if (!noti) return;
  noti.innerHTML = html;
  noti.className = `fixed bottom-4 right-4 px-4 py-2.5 rounded-lg shadow-lg z-50
    text-xs font-medium max-w-xs w-full transition-all duration-300 ${COLORES_NOTI[tipo]}`;
  noti.classList.remove("hidden");
  if (typeof lucide !== "undefined") lucide.createIcons();
  clearTimeout(_notiTimer);
  _notiTimer = setTimeout(() => noti.classList.add("hidden"), 4000);
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);
  const root = document.documentElement;

  // ── Modo oscuro ──
  const aplicarTema = () => {
    const dark = localStorage.getItem("modoOscuro") === "true";
    root.classList.toggle("dark", dark);
    actualizarIcono();
  };
  const actualizarIcono = () => {
    const dark = root.classList.contains("dark");
    [$("icono-luna")].forEach(el => el?.classList.toggle("hidden", dark));
    [$("icono-sol") ].forEach(el => el?.classList.toggle("hidden", !dark));
  };
  window.toggleDarkMode = () => {
    localStorage.setItem("modoOscuro", root.classList.toggle("dark"));
    actualizarIcono();
  };
  aplicarTema();

  // ── Modal puertos ──
  window.cerrarModal = () => $("modal-puertos")?.classList.add("hidden");

  // ── Agregar MAC ──
  $("form-agregar")?.addEventListener("submit", async e => {
    e.preventDefault();
    const mac = $("input-mac").value.trim();
    if (!mac) return;
    mostrarNotificacion(`<span class="flex items-center gap-1.5"><i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> ${t("adding")}</span>`);
    try {
      const data = await fetch("/api/agregar", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac })
      }).then(r => r.json());
      mostrarNotificacion(data.success ? `✓ ${t("success")}` : `✗ ${t("error")}`, data.success ? "success" : "error");
      if (data.success) setTimeout(() => location.reload(), 800);
    } catch {
      mostrarNotificacion(`✗ ${t("connectionError")}`, "error");
    }
  });

  // ── Eliminar MAC ──
  window.eliminarMAC = async mac => {
    mostrarNotificacion(`<span class="flex items-center gap-1.5"><i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> ${t("eliminando")}</span>`);
    try {
      const data = await fetch("/api/eliminar", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac })
      }).then(r => r.json());
      mostrarNotificacion(data.success ? `✓ ${t("eliminado")}` : `✗ ${t("connectionError")}`, data.success ? "success" : "error");
      if (data.success) setTimeout(() => location.reload(), 800);
    } catch {
      mostrarNotificacion(`✗ ${t("connectionError")}`, "error");
    }
  };

  // ── Editar nombre ──
  window.editarNombre = mac => {
    const fila  = document.querySelector(`tr[data-mac="${mac.toLowerCase()}"]`);
    const celda = fila?.querySelector("td:nth-child(3)");
    if (!celda) return;
    const actual = celda.querySelector("span")?.innerText.trim() || "";
    const sid    = mac.replace(/:/g, "");
    celda.innerHTML = `<div class="flex items-center gap-1.5">
      <input id="inp-${sid}" class="p-1.5 border rounded-lg text-xs w-28 bg-white dark:bg-dark3 dark:text-white focus:ring-1 focus:ring-accent focus:outline-none" value="${actual}">
      <button id="btn-${sid}" class="bg-accent text-white px-2 py-1 rounded-lg text-xs">${t("guardar")}</button>
    </div>`;
    const inp = $(`inp-${sid}`);
    inp.focus();
    const guardar = async () => {
      const nombre = inp.value.trim();
      if (!nombre) return;
      try {
        const d = await fetch("/api/nombrar", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mac, nombre })
        }).then(r => r.json());
        mostrarNotificacion(d.success ? `✓ ${t("nombre_guardado")}` : `✗ ${t("error_guardar_nombre")}`, d.success ? "success" : "error");
        if (!d.success) return;
        if (fila) { fila.dataset.nombre = nombre.toLowerCase(); }
        celda.innerHTML = `<div class="flex items-center gap-1.5">
          <span class="text-gray-700 dark:text-gray-200">${nombre}</span>
          <button onclick="editarNombre('${mac}')" class="text-gray-300 hover:text-accent transition"><i data-lucide="pencil" class="w-3 h-3"></i></button>
        </div>`;
        const li = document.querySelector(`#lista-macs li[data-mac="${mac.toLowerCase()}"]`);
        const sp = li?.querySelector(".nombre-confiable");
        if (sp) sp.textContent = nombre;
        if (typeof lucide !== "undefined") lucide.createIcons();
      } catch {
        mostrarNotificacion(`✗ ${t("error_guardar_nombre")}`, "error");
      }
    };
    $(`btn-${sid}`).onclick = guardar;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") guardar(); });
  };

  // ── Hora actual ──
  const actualizarHora = () => {
    const now  = new Date();
    const timeEl = document.getElementById("horaActual-time");
    const dateEl = document.getElementById("horaActual-date");
    if (timeEl) timeEl.textContent = now.toLocaleTimeString("es-CO", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
    });
    if (dateEl) dateEl.textContent = now.toLocaleDateString("es-CO", {
      weekday: "short", day: "2-digit", month: "short"
    });
    // legacy fallback
    const old = document.getElementById("horaActual");
    if (old) old.textContent = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
  };
  setInterval(actualizarHora, 1000);
  actualizarHora();

  // ── Escaneo manual ──
  window.escanearAhora = async () => {
    mostrarNotificacion(`<span class="flex items-center gap-1.5"><i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> ${t("scanning")}</span>`);
    const t0 = Date.now();
    try {
      const data = await fetch("/api/scan").then(r => r.json());
      const espera = 1200 - (Date.now() - t0);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));
      if (!Array.isArray(data)) throw new Error();
      mostrarNotificacion(`✓ ${t("scanDone")}`, "success");
      actualizarTabla(data);
    } catch {
      const espera = 1200 - (Date.now() - t0);
      if (espera > 0) await new Promise(r => setTimeout(r, espera));
      mostrarNotificacion(`✗ ${t("scanError")}`, "error");
    }
  };

  // ── Tabla ──
  function crearFila(d) {
    const tr = document.createElement("tr");
    tr.className = "dev-row hover:bg-gray-50 dark:hover:bg-dark3/50 dispositivo-row transition";
    tr.dataset.nombre   = (d.nombre || "").toLowerCase();
    tr.dataset.mac      = d.mac.toLowerCase();
    tr.dataset.confianza = d.confiable ? "confiable" : "no-confiable";

    const badgeConf = d.confiable
      ? `<span class="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium"><span class="relative flex w-1.5 h-1.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500"></span></span>${t("trusted")}</span>`
      : `<span class="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>${t("untrusted")}</span>`;

    const btnAccion = d.confiable
      ? `<button onclick="marcarConfiable('${d.mac}', false, this)" class="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 transition"><i data-lucide="shield-off" class="w-3 h-3"></i> ${t("untrust_btn")}</button>`
      : `<button onclick="marcarConfiable('${d.mac}', true, this)"  class="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 transition"><i data-lucide="shield-check" class="w-3 h-3"></i> ${t("trust_btn")}</button>`;

    tr.innerHTML = `
      <td class="px-3 font-mono text-gray-500 dark:text-gray-400">${d.ip}</td>
      <td class="px-3 font-mono text-gray-400 dark:text-gray-500">${d.mac}</td>
      <td class="px-3">
        <div class="flex items-center gap-1.5">
          <span class="text-gray-700 dark:text-gray-200">${d.nombre || "—"}</span>
          <button onclick="editarNombre('${d.mac}')" class="text-gray-300 hover:text-accent transition"><i data-lucide="pencil" class="w-3 h-3"></i></button>
        </div>
      </td>
      <td class="px-3 text-gray-500 dark:text-gray-400">${d.fabricante || "—"}</td>
      <td class="px-3">${badgeConf}</td>
      <td class="px-3">${btnAccion}</td>
      <td class="px-3">
        <button onclick="verPuertos('${d.ip}')" class="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 transition">
          <i data-lucide="search" class="w-3 h-3"></i> ${t("view_ports")}
        </button>
      </td>`;
    return tr;
  }

  function actualizarTabla(devs) {
    const tbody = $("tabla-dispositivos");
    const frag  = document.createDocumentFragment();
    devs.forEach(d => frag.appendChild(crearFila(d)));
    tbody.replaceChildren(frag);
    if (typeof lucide !== "undefined") lucide.createIcons();
    aplicarFiltros();
  }

  // ── Puertos ──
  window.verPuertos = ip => {
    const modal = $("modal-puertos");
    const cont  = $("contenido-puertos");
    cont.innerHTML = `<div class="flex flex-col items-center gap-2 py-4 text-xs text-gray-400">
      <i data-lucide="scan" class="animate-pulse w-6 h-6 text-accent"></i>
      ${t("scanning_ports").replace("{{ip}}", ip)}
    </div>`;
    modal.classList.remove("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();

    fetch("/api/puertos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip }) })
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.message);
        cont.innerHTML = data.puertos.length === 0
          ? `<div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><i data-lucide="check-circle"></i> ${t("no_ports").replace("{{ip}}", ip)}</div>`
          : `<div class="mb-2 font-mono text-xs text-gray-500 dark:text-gray-400">${ip}</div>
             <div class="space-y-1">
               ${data.puertos.map(p => `<div class="p-2 border border-gray-100 dark:border-gray-700 rounded-lg flex justify-between bg-white dark:bg-dark3 text-xs"><span class="font-mono">${p.puerto}</span><span class="text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 rounded">${p.servicio}</span></div>`).join("")}
             </div>`;
        if (typeof lucide !== "undefined") lucide.createIcons();
      })
      .catch(() => {
        cont.innerHTML = `<div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-500 flex items-center gap-2"><i data-lucide="x-circle"></i> ${t("error_ports").replace("{{ip}}", ip)}</div>`;
        if (typeof lucide !== "undefined") lucide.createIcons();
      });
  };

  // ── Idioma ──
  $("langBtn")?.addEventListener("click", () => $("langMenu")?.classList.toggle("hidden"));
  window.setLang = (lang, country, label) => {
    $("langFlag").className = `fi fi-${country} w-4 h-3 rounded-sm`;
    $("langLabel").textContent = label;
    $("langMenu")?.classList.add("hidden");
    setLanguage(lang);
  };

  // ── Filtro confianza ──
  $("trustBtn")?.addEventListener("click", () => $("trustMenu")?.classList.toggle("hidden"));

  window.setTrustFilter = valor => {
    const map = {
      all:       { valor: "",             key: "filterAll",       dot: "bg-gray-400" },
      trusted:   { valor: "confiable",    key: "filterTrusted",   dot: "bg-emerald-500" },
      untrusted: { valor: "no-confiable", key: "filterUntrusted", dot: "bg-red-500" }
    };
    const conf = map[valor];
    if (!conf) return;
    filtroConfianza    = conf.valor;
    filtroConfianzaKey = conf.key;
    const dot = $("trust-dot");
    if (dot) dot.className = `inline-block w-2 h-2 rounded-full ${conf.dot}`;
    aplicarFiltros();
    actualizarLabelFiltro();
    $("trustMenu")?.classList.add("hidden");
  };

  // ── Filtros texto ──
  const aplicarFiltros = () => {
    const nombre = $("filtro-nombre")?.value.toLowerCase() || "";
    const mac    = $("filtro-mac")?.value.toLowerCase()    || "";
    document.querySelectorAll(".dispositivo-row").forEach(fila => {
      const ok = fila.dataset.nombre.includes(nombre)
        && fila.dataset.mac.includes(mac)
        && (!filtroConfianza || fila.dataset.confianza === filtroConfianza);
      fila.style.display = ok ? "" : "none";
    });
  };
  $("filtro-nombre")?.addEventListener("input", aplicarFiltros);
  $("filtro-mac")?.addEventListener("input",    aplicarFiltros);

  // ── Cerrar menús con click exterior ──
  document.addEventListener("click", e => {
    ["langMenu","trustMenu","histEventoMenu"].forEach(id => {
      const menu = $(id);
      if (!menu) return;
      const btn  = $({ langMenu: "langBtn", trustMenu: "trustBtn", histEventoMenu: "histEventoBtn" }[id]);
      if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add("hidden");
      }
    });
  });

  // ── Menú responsive ──
  const sidebar = $("sidebar");
  const overlay = $("overlay");
  $("toggleMenu")?.addEventListener("click", () => {
    sidebar?.classList.toggle("-translate-x-full");
    overlay?.classList.toggle("hidden");
  });
  overlay?.addEventListener("click", () => {
    sidebar?.classList.add("-translate-x-full");
    overlay?.classList.add("hidden");
  });

  // ── Escaneo automático (usa intervalo del backend) ──
  (async () => {
    let intervalo = 120000;
    try {
      const cfg  = await fetch("/api/configuracion").then(r => r.json());
      intervalo  = (parseInt(cfg.intervalo_monitoreo) || 120) * 1000;
    } catch {}
    setInterval(() => window.escanearAhora(), intervalo);
  })();

  if (typeof lucide !== "undefined") lucide.createIcons();
});
