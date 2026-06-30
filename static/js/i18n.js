// ══════════════════════════════════════════
// i18n.js — Sistema de traducciones
// Carga desde /static/i18n/{lang}.json
// Agrega un idioma: crea el JSON y añade
// una entrada en SUPPORTED_LANGS.
// ══════════════════════════════════════════

const SUPPORTED_LANGS = {
  es: { flag: "fi-es", label: "Español",  country: "es" },
  en: { flag: "fi-us", label: "English",  country: "us" }
};

// Cache en memoria para no repetir fetch
const _cache = {};

// Devuelve la traducción de una clave (sincrónico, desde cache)
function t(key) {
  const lang = localStorage.getItem("lang") || "es";
  return _cache[lang]?.[key] ?? _cache["es"]?.[key] ?? key;
}

// Carga el JSON del idioma (con fallback a es)
async function _loadLang(lang) {
  if (_cache[lang]) return;
  try {
    const res  = await fetch(`/static/i18n/${lang}.json`);
    _cache[lang] = await res.json();
  } catch {
    console.warn(`[i18n] No se pudo cargar: ${lang}.json`);
    _cache[lang] = {};
  }
}

// Aplica el idioma al DOM (todos los [data-i18n])
function _applyToDom(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key   = el.getAttribute("data-i18n");
    const value = _cache[lang]?.[key] ?? _cache["es"]?.[key];
    if (value == null) return;

    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", value);
    } else if (el.tagName === "OPTION") {
      el.textContent = value;
    } else {
      // Solo usar innerHTML si el valor contiene HTML
      el[value.includes("<") ? "innerHTML" : "textContent"] = value;
    }
  });

  // Notificar a módulos que escuchen cambios de idioma
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

// Cambia el idioma activo
async function setLanguage(lang) {
  if (!SUPPORTED_LANGS[lang]) return;
  // Asegurar que el fallback (es) también esté cargado
  await Promise.all([_loadLang("es"), _loadLang(lang)]);
  localStorage.setItem("lang", lang);
  _applyToDom(lang);
}

// Inicializa al cargar la página
window.addEventListener("DOMContentLoaded", async () => {
  const lang = localStorage.getItem("lang") || "es";
  await setLanguage(lang);
});

// Exponer para uso en otros módulos
window.t           = t;
window.setLanguage = setLanguage;
window.SUPPORTED_LANGS = SUPPORTED_LANGS;
