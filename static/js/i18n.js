const translations = {
  es: {
    scan: "Escanear",
    logout: "Cerrar sesión",
    header: "Escaneo avanzado de red LAN: <span class='text-accent'>detecta accesos no autorizados</span> y evalúa la <span class='text-highlight'>confianza</span> de cada dispositivo conectado.",
    trusted: "Confiable",
    untrusted: "No confiable",
    addTrusted: "Agregar MAC confiable",
    trustedDevices: "Dispositivos Confiables",
    delete: "Eliminar",
    openPorts: "Puertos Abiertos",
    filterName: "Filtrar por nombre",
    filterMac: "Filtrar por MAC",
    filterAll: "Todos",
    filterTrusted: "Confiables",
    filterUntrusted: "No confiables",
    detectedDevices: "Dispositivos detectados:",
    currentTime: "Hora actual:",
    changeTheme: "Cambiar tema",
    scanning: "Escaneando red...",
    scanDone: "Escaneo completo",
    scanError: "Error al escanear",
    scanningPorts: (ip) => `Escaneando puertos en <strong>${ip}</strong>...`,
    noPorts: (ip) => `No se encontraron puertos abiertos en <strong>${ip}</strong>.`,
    viewPorts: "Ver puertos",
    nameSaved: "Nombre guardado",
    addMac: "Agregando MAC...",
    removeMac: "Eliminando MAC...",
    connectionError: "Error de conexión",
    ip: "IP",
    mac: "MAC",
    name: "Nombre",
    manufacturer: "Fabricante",
    trust: "Confianza",
    guardar: "Guardar",
    nombre_guardado: "Nombre guardado",
    error_guardar_nombre: "Error al guardar nombre",
    scanning_ports: "Escaneando puertos en <strong>{{ip}}</strong>...",
    no_ports: "No se encontraron puertos abiertos en <strong>{{ip}}</strong>.",
    host_label: "Host",
    error_ports: "Error al consultar puertos para <strong>{{ip}}</strong>",
    adding: "Agregando MAC...",
    success: "MAC agregada con éxito",
    error: "Error al agregar la MAC",
    eliminando: "Eliminando MAC...",
  },
  en: {
    scan: "Scan",
    logout: "Logout",
    header: "Advanced LAN scan: <span class='text-accent'>detect unauthorized access</span> and assess the <span class='text-highlight'>trust level</span> of each connected device.",
    trusted: "Trusted",
    untrusted: "Untrusted",
    addTrusted: "Add trusted MAC",
    trustedDevices: "Trusted Devices",
    delete: "Delete",
    openPorts: "Open Ports",
    filterName: "Filter by name",
    filterMac: "Filter by MAC",
    filterAll: "All",
    filterTrusted: "Trusted",
    filterUntrusted: "Untrusted",
    detectedDevices: "Detected devices:",
    currentTime: "Current time:",
    changeTheme: "Change theme",
    scanning: "Scanning network...",
    scanDone: "Scan complete",
    scanError: "Error while scanning",
    scanningPorts: (ip) => `Scanning ports on <strong>${ip}</strong>...`,
    noPorts: (ip) => `No open ports found on <strong>${ip}</strong>.`,
    viewPorts: "View ports",
    nameSaved: "Name saved",
    addMac: "Adding MAC...",
    removeMac: "Removing MAC...",
    connectionError: "Connection error",
    ip: "IP",
    mac: "MAC",
    name: "Name",
    manufacturer: "Manufacturer",
    trust: "Trust",
    guardar: "Save",
    nombre_guardado: "Name saved",
    error_guardar_nombre: "Error saving name",
    scanning_ports: "Scanning ports on <strong>{{ip}}</strong>...",
    no_ports: "No open ports found on <strong>{{ip}}</strong>.",
    host_label: "Host",
    error_ports: "Error fetching ports for <strong>{{ip}}</strong>",
    adding: "Adding MAC...",
    success: "MAC successfully added",
    error: "Failed to add MAC",
    eliminando: "Deleting MAC...",
  },
};

function t(key, ...args) {
  const lang = localStorage.getItem("lang") || "es";
  const value = translations[lang][key];
  return typeof value === "function" ? value(...args) : value;
}

function setLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = translations[lang]?.[key];
    if (!value) return;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", value);
    } else if (el.tagName === "BUTTON" || (el.tagName === "INPUT" && el.type === "submit")) {
      el.value = value;
      el.textContent = value;
    } else if (el.tagName === "OPTION") {
      el.textContent = value;
    } else {
      if (value.includes("<")) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    }
  });
  localStorage.setItem("lang", lang);
}

window.t = t;
window.setLanguage = setLanguage;

window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("lang") || "es";
  setLanguage(savedLang);

  const selector = document.getElementById("language-select");
  if (selector) {
    selector.value = savedLang;
    selector.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });
  }
});
