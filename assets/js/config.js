// assets/js/config.js
window.APP_CONFIG = {
  appName: "33Giri Catalogo",
  heroTitle: "Arte in Vinile",
  heroSubtitle: "Vinili trasformati in pezzi unici. Ogni pezzo racconta una storia musicale.",

  whatsappNumber: "+393471692948",

  
  // ✅ Supabase
  supabaseUrl: "https://oovqibecarfdoybzbqwt.supabase.co",
  supabaseAnonKey: "sb_publishable_pOzkEqcT6oMW4pLKv_sWZw_WyCkFC6a",
  supabaseProductsTable: "products"
};

// --- lock APP_CONFIG (stop override) ---
window.APP_CONFIG.__build = "lock-2026-02-22-2";
console.log("CONFIG LOADED", window.APP_CONFIG.__build, window.APP_CONFIG.supabaseUrl);

try {
  Object.defineProperty(window, "APP_CONFIG", {
    value: window.APP_CONFIG,
    writable: false,
    configurable: false
  });
  Object.freeze(window.APP_CONFIG);
} catch (e) {}
