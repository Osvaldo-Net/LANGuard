const translations = {
  es: {
    // Navegación
    scan:         "Escanear",
    logout:       "Cerrar sesión",
    changeTheme:  "Cambiar tema",
    history:      "Historial",

    // Header
    header: "Escaneo avanzado de red LAN: <span class='text-accent'>detecta accesos no autorizados</span> y evalúa la <span class='text-highlight'>confianza</span> de cada dispositivo conectado.",

    // Tabla principal
    ip:           "IP",
    mac:          "MAC",
    name:         "Nombre",
    manufacturer: "Fabricante",
    trust:        "Confianza",
    ports:        "Puertos",
    trusted:      "Confiable",
    untrusted:    "No confiable",
    view_ports:   "Ver puertos",

    // Filtros
    filterName:      "Filtrar por nombre",
    filterMac:       "Filtrar por MAC",
    filterAll:       "Todos",
    filterTrusted:   "Confiables",
    filterUntrusted: "No confiables",

    // Panel confiables
    addTrusted:     "Agregar MAC confiable",
    trustedDevices: "Dispositivos Confiables",
    delete:         "Eliminar",
    add:            "Agregar",

    // Nombres
    guardar:              "Guardar",
    nombre_guardado:      "Nombre guardado",
    error_guardar_nombre: "Error al guardar nombre",

    // Notificaciones MAC
    adding:     "Agregando MAC...",
    success:    "MAC agregada con éxito",
    error:      "Error al agregar la MAC",
    eliminando: "Eliminando MAC...",
    eliminado:  "MAC eliminada con éxito",

    // Escaneo
    scanning:  "Escaneando red...",
    scanDone:  "Escaneo completo",
    scanError: "Error al escanear",

    // Puertos
    openPorts:      "Puertos Abiertos",
    scanning_ports: "Escaneando puertos en <strong>{{ip}}</strong>...",
    no_ports:       "No se encontraron puertos abiertos en <strong>{{ip}}</strong>.",
    error_ports:    "Error al consultar puertos para <strong>{{ip}}</strong>",

    // General
    connectionError: "Error de conexión",
    currentTime:     "Hora actual:",
    detectedDevices: "Dispositivos detectados:",
    host_label:      "Host",

    // Historial
    historyTitle:        "Historial de dispositivos",
    historySubtitle:     "Solo registra conexiones y desconexiones",
    historySearch:       "Buscar",
    historyMacPlaceholder: "MAC (opcional)",
    historyEmpty:        "Presiona Buscar para cargar el historial",
    historyNoResults:    "Sin registros",
    historyLoading:      "Cargando...",
    historyError:        "Error al cargar historial",
    historyCount:        "registros encontrados",
    historyDate:         "Fecha",
    historyTrusted:      "✓ Confiable",
    historyUntrusted:    "✗ No confiable",
    historyClear:        "Limpiar historial",

    // Login
    login_title:   "Bienvenido a <span class='gradient-text'>LANGuard</span>",
    login_subtitle:"Inicia sesión para continuar",
    username:      "Usuario",
    password:      "Contraseña",
    login_button:  "Ingresar",
    login_footer:  "Seguridad avanzada y monitoreo de tu red.",
    footer_github: "Ver en GitHub",
  },

  en: {
    // Navegación
    scan:         "Scan",
    logout:       "Logout",
    changeTheme:  "Change theme",
    history:      "History",

    // Header
    header: "Advanced LAN scan: <span class='text-accent'>detect unauthorized access</span> and assess the <span class='text-highlight'>trust level</span> of each connected device.",

    // Tabla principal
    ip:           "IP",
    mac:          "MAC",
    name:         "Name",
    manufacturer: "Manufacturer",
    trust:        "Trust",
    ports:        "Ports",
    trusted:      "Trusted",
    untrusted:    "Untrusted",
    view_ports:   "View ports",

    // Filtros
    filterName:      "Filter by name",
    filterMac:       "Filter by MAC",
    filterAll:       "All",
    filterTrusted:   "Trusted",
    filterUntrusted: "Untrusted",

    // Panel confiables
    addTrusted:     "Add trusted MAC",
    trustedDevices: "Trusted Devices",
    delete:         "Delete",
    add:            "Add",

    // Nombres
    guardar:              "Save",
    nombre_guardado:      "Name saved",
    error_guardar_nombre: "Error saving name",

    // Notificaciones MAC
    adding:     "Adding MAC...",
    success:    "MAC successfully added",
    error:      "Failed to add MAC",
    eliminando: "Deleting MAC...",
    eliminado:  "MAC successfully deleted",

    // Escaneo
    scanning:  "Scanning network...",
    scanDone:  "Scan complete",
    scanError: "Error while scanning",

    // Puertos
    openPorts:      "Open Ports",
    scanning_ports: "Scanning ports on <strong>{{ip}}</strong>...",
    no_ports:       "No open ports found on <strong>{{ip}}</strong>.",
    error_ports:    "Error fetching ports for <strong>{{ip}}</strong>",

    // General
    connectionError: "Connection error",
    currentTime:     "Current time:",
    detectedDevices: "Detected devices:",
    host_label:      "Host",

    // Historial
    historyTitle:          "Device history",
    historySubtitle:       "Only records connections and disconnections",
    historySearch:         "Search",
    historyMacPlaceholder: "MAC (optional)",
    historyEmpty:          "Press Search to load history",
    historyNoResults:      "No records found",
    historyLoading:        "Loading...",
    historyError:          "Error loading history",
    historyCount:          "records found",
    historyDate:           "Date",
    historyTrusted:        "✓ Trusted",
    historyUntrusted:      "✗ Untrusted",
    historyClear:          "Clear history",

    // Login
    login_title:   "Welcome to <span class='gradient-text'>LANGuard</span>",
    login_subtitle:"Log in to continue",
    username:      "Username",
    password:      "Password",
    login_button:  "Log in",
    login_footer:  "Advanced security and network monitoring.",
    footer_github: "View on GitHub",
  }
};

// =======================
// FUNCIÓN t()
// =======================
function t(key) {
  const lang  = localStorage.getItem("lang") || "es";
  const value = translations[lang]?.[key] ?? translations["es"]?.[key] ?? key;
  return value;
}

// =======================
// APLICAR TRADUCCIONES AL DOM
// =======================
let langActual = localStorage.getItem("lang") || "es";

function setLanguage(lang) {
  if (!translations[lang]) return;
  langActual = lang;
  localStorage.setItem("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key   = el.getAttribute("data-i18n");
    const value = translations[lang]?.[key];
    if (!value) return;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", value);
    } else if (el.tagName === "BUTTON" || (el.tagName === "INPUT" && el.type === "submit")) {
      const icon = el.querySelector("i, svg");
      if (icon) {
        el.textContent = value;
        el.prepend(icon);
      } else {
        el.textContent = value;
      }
    } else if (el.tagName === "OPTION") {
      el.textContent = value;
    } else {
      el[value.includes("<") ? "innerHTML" : "textContent"] = value;
    }
  });

  if (typeof actualizarLabelFiltro === "function") actualizarLabelFiltro();
}

// =======================
// INIT
// =======================
window.addEventListener("DOMContentLoaded", () => {
  setLanguage(localStorage.getItem("lang") || "es");
});
