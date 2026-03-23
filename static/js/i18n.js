const translations = {
  es: {
    // Navegación
    scan:        "Escanear",
    logout:      "Cerrar sesión",
    changeTheme: "Cambiar tema",
    history:     "Historial",
    settings:    "Configuración",

    // Etiquetas de sección sidebar
    sectionTools: "Herramientas",
    sectionPrefs: "Preferencias",

    // Perfil
    profileTitle:       "Perfil",
    profileAdmin:       "Administrador",
    profileDisplayName: "Nombre para mostrar",
    profileNameSaved:   "Nombre actualizado",

    // Header
    header: "Escaneo avanzado de red LAN: <span class='text-accent'>detecta accesos no autorizados</span> y evalúa la <span class='text-highlight'>confianza</span> de cada dispositivo conectado.",

    // Tabla dispositivos
    devicesTitle: "Dispositivos en red",
    devicesDesc:  "Dispositivos detectados en el último escaneo. Marca como confiables los que reconoces.",
    ip:           "IP",
    mac:          "MAC",
    name:         "Nombre",
    manufacturer: "Fabricante",
    trust:        "Confianza",
    action:       "Acción",
    ports:        "Puertos",
    trusted:      "Confiable",
    untrusted:    "No confiable",
    trust_btn:    "Confiar",
    untrust_btn:  "Quitar",
    view_ports:   "Puertos",

    // Filtros
    filterName:      "Filtrar por nombre",
    filterMac:       "Filtrar por MAC",
    filterAll:       "Todos",
    filterTrusted:   "Confiables",
    filterUntrusted: "No confiables",

    // Panel confiables
    addTrusted:     "Agregar MAC confiable",
    trustedDevices: "Dispositivos Confiables",
    trustedSubtitle:"MACs marcadas como de confianza",
    delete:         "Eliminar",
    add:            "Agregar",
    noName:         "Sin nombre",

    // Nombres de dispositivos
    guardar:              "Guardar",
    nombre_guardado:      "Nombre guardado",
    error_guardar_nombre: "Error al guardar nombre",

    // Notificaciones
    adding:          "Agregando MAC...",
    success:         "MAC agregada con éxito",
    error:           "Error al agregar la MAC",
    eliminando:      "Eliminando MAC...",
    eliminado:       "MAC eliminada con éxito",
    connectionError: "Error de conexión",

    // Escaneo
    scanning:  "Escaneando red...",
    scanDone:  "Escaneo completo",
    scanError: "Error al escanear",

    // Puertos
    openPorts:      "Puertos Abiertos",
    scanning_ports: "Escaneando puertos en {{ip}}...",
    no_ports:       "No se encontraron puertos abiertos en {{ip}}",
    error_ports:    "Error al consultar puertos de {{ip}}",

    // Historial
    historyTitle:        "Historial de red",
    historySubtitle:     "Solo registra conexiones y desconexiones",
    historySearch:       "Buscar",
    historyMac:          "Filtrar por MAC",
    historyAll:          "Todos",
    historyConn:         "Conectado",
    historyDisc:         "Desconectado",
    historyEmpty:        "Presiona Buscar para cargar el historial",
    historyNoData:       "Sin registros",
    historyLoading:      "Cargando...",
    historyError:        "Error al cargar historial",
    historyCount:        "registros encontrados",
    historyDate:         "Fecha",
    historyTrusted:      "Confiable",
    historyUntrusted:    "No confiable",
    historyClear:        "Limpiar historial",
    historyConnected:    "Conectado",
    historyDisconnected: "Desconectado",
    historyAutoRefresh:  "Auto-actualizar",

    // Configuración modal
    cfgTitle:         "Configuración del sistema",
    cfgTelegram:      "Notificaciones Telegram",
    cfgToken:         "Bot Token",
    cfgChatId:        "Chat ID",
    cfgTestBtn:       "Probar conexión",
    cfgMonitoring:    "Monitoreo de red",
    cfgInterval:      "Intervalo de escaneo",
    cfgIntervalUnit:  "seg",
    cfgIntervalMin:   "(mín. 30s)",
    cfgSession:       "Tiempo de sesión",
    cfgSessionUnit:   "horas",
    cfgSessionMin:    "(mín. 5 min)",
    cfgSessionDesc:   "La sesión se cierra automáticamente tras el tiempo configurado de inactividad.",
    cfgCredentials:   "Cambiar credenciales",
    cfgCurrentPass:   "Contraseña actual",
    cfgNewEmail:      "Nuevo correo (opcional)",
    cfgNewPass:       "Nueva contraseña (opcional)",
    cfgConfirmPass:   "Confirmar contraseña",
    cfgSave:          "Guardar cambios",
    cfgCancel:        "Cancelar",
    cfgSaved:         "Configuración guardada",
    cfgError:         "Error al guardar",
    cfgCredSaved:     "Credenciales actualizadas",
    cfgCredError:     "Error al actualizar credenciales",

    // Sesión
    sessionLabel:    "Sesión:",
    sessionWarning:  "⚠ Tu sesión expirará pronto.",
    sessionKeepAlive:"Mantener activa",
    currentTime:     "Hora actual:",
    detectedDevices: "Dispositivos:",
    host_label:      "Host",

    // Login
    login_title:    "Bienvenido a <span class='gradient-text'>LANGuard</span>",
    login_subtitle: "Inicia sesión para continuar",
    username:       "Usuario",
    password:       "Contraseña",
    login_button:   "Ingresar",
    login_footer:   "Seguridad avanzada y monitoreo de tu red.",
    footer_github:  "Ver en GitHub",
  },

  en: {
    // Navigation
    scan:        "Scan",
    logout:      "Log out",
    changeTheme: "Change theme",
    history:     "History",
    settings:    "Settings",

    // Sidebar section labels
    sectionTools: "Tools",
    sectionPrefs: "Preferences",

    // Profile
    profileTitle:       "Profile",
    profileAdmin:       "Administrator",
    profileDisplayName: "Display name",
    profileNameSaved:   "Name updated",

    header: "Advanced LAN scan: <span class='text-accent'>detect unauthorized access</span> and assess the <span class='text-highlight'>trust level</span> of each connected device.",

    // Device table
    devicesTitle: "Devices on network",
    devicesDesc:  "Devices detected in the last scan. Mark as trusted the ones you recognize.",
    ip:           "IP",
    mac:          "MAC",
    name:         "Name",
    manufacturer: "Manufacturer",
    trust:        "Trust",
    action:       "Action",
    ports:        "Ports",
    trusted:      "Trusted",
    untrusted:    "Untrusted",
    trust_btn:    "Trust",
    untrust_btn:  "Remove",
    view_ports:   "Ports",

    // Filters
    filterName:      "Filter by name",
    filterMac:       "Filter by MAC",
    filterAll:       "All",
    filterTrusted:   "Trusted",
    filterUntrusted: "Untrusted",

    // Trusted panel
    addTrusted:     "Add trusted MAC",
    trustedDevices: "Trusted Devices",
    trustedSubtitle:"MACs marked as trusted",
    delete:         "Delete",
    add:            "Add",
    noName:         "No name",

    // Device names
    guardar:              "Save",
    nombre_guardado:      "Name saved",
    error_guardar_nombre: "Error saving name",

    // Notifications
    adding:          "Adding MAC...",
    success:         "MAC successfully added",
    error:           "Failed to add MAC",
    eliminando:      "Removing MAC...",
    eliminado:       "MAC successfully removed",
    connectionError: "Connection error",

    // Scan
    scanning:  "Scanning network...",
    scanDone:  "Scan complete",
    scanError: "Error while scanning",

    // Ports
    openPorts:      "Open Ports",
    scanning_ports: "Scanning ports on {{ip}}...",
    no_ports:       "No open ports found on {{ip}}",
    error_ports:    "Error fetching ports for {{ip}}",

    // History
    historyTitle:        "Network history",
    historySubtitle:     "Records connections and disconnections only",
    historySearch:       "Search",
    historyMac:          "Filter by MAC",
    historyAll:          "All",
    historyConn:         "Connected",
    historyDisc:         "Disconnected",
    historyEmpty:        "Press Search to load history",
    historyNoData:       "No records found",
    historyLoading:      "Loading...",
    historyError:        "Error loading history",
    historyCount:        "records found",
    historyDate:         "Date",
    historyTrusted:      "Trusted",
    historyUntrusted:    "Untrusted",
    historyClear:        "Clear history",
    historyConnected:    "Connected",
    historyDisconnected: "Disconnected",
    historyAutoRefresh:  "Auto-refresh",

    // Settings modal
    cfgTitle:         "System settings",
    cfgTelegram:      "Telegram notifications",
    cfgToken:         "Bot Token",
    cfgChatId:        "Chat ID",
    cfgTestBtn:       "Test connection",
    cfgMonitoring:    "Network monitoring",
    cfgInterval:      "Scan interval",
    cfgIntervalUnit:  "sec",
    cfgIntervalMin:   "(min. 30s)",
    cfgSession:       "Session timeout",
    cfgSessionUnit:   "hours",
    cfgSessionMin:    "(min. 5 min)",
    cfgSessionDesc:   "Session closes automatically after the configured period of inactivity.",
    cfgCredentials:   "Change credentials",
    cfgCurrentPass:   "Current password",
    cfgNewEmail:      "New email (optional)",
    cfgNewPass:       "New password (optional)",
    cfgConfirmPass:   "Confirm password",
    cfgSave:          "Save changes",
    cfgCancel:        "Cancel",
    cfgSaved:         "Settings saved",
    cfgError:         "Error saving settings",
    cfgCredSaved:     "Credentials updated",
    cfgCredError:     "Error updating credentials",

    // Session
    sessionLabel:    "Session:",
    sessionWarning:  "⚠ Your session will expire soon.",
    sessionKeepAlive:"Keep active",
    currentTime:     "Current time:",
    detectedDevices: "Devices:",
    host_label:      "Host",

    // Login
    login_title:    "Welcome to <span class='gradient-text'>LANGuard</span>",
    login_subtitle: "Log in to continue",
    username:       "Username",
    password:       "Password",
    login_button:   "Log in",
    login_footer:   "Advanced security and network monitoring.",
    footer_github:  "View on GitHub",
  }
};

function t(key) {
  const lang = localStorage.getItem("lang") || "es";
  return translations[lang]?.[key] ?? translations["es"]?.[key] ?? key;
}

let _langActual = localStorage.getItem("lang") || "es";

function setLanguage(lang) {
  if (!translations[lang]) return;
  _langActual = lang;
  localStorage.setItem("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key   = el.getAttribute("data-i18n");
    const value = translations[lang]?.[key];
    if (value == null) return;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", value);
    } else if (el.tagName === "OPTION") {
      el.textContent = value;
    } else {
      el[value.includes("<") ? "innerHTML" : "textContent"] = value;
    }
  });

  if (typeof actualizarLabelFiltro    === "function") actualizarLabelFiltro();
  if (typeof actualizarLabelHistorial === "function") actualizarLabelHistorial();
}

window.addEventListener("DOMContentLoaded", () => {
  setLanguage(localStorage.getItem("lang") || "es");
});
