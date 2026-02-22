// assets/js/config.js
window.APP_CONFIG = {
  appName: "33Giri Catalogo",
  heroTitle: "Arte in Vinile",
  heroSubtitle: "Vinili trasformati in pezzi unici. Ogni pezzo racconta una storia musicale.",

  whatsappNumber: "+393471692948",

  // se poi elimini la vecchia admin locale, puoi anche rimuoverlo
  adminCode: "Ciaocia0!",
  storageKey: "33giri_catalog_v1",

  // ✅ Supabase
  supabaseUrl: "https://oovqibecarfdoybzbqwt.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnFpYmVjYXJmZG95YnpicXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjU1MDQsImV4cCI6MjA4NzM0MTUwNH0.yym_Y9i6Pl-dxicCxPXnWVg6E69RLYpyKBw7AWzq4wI",
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
