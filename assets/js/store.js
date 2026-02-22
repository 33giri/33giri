// assets/js/store.js
// Unico punto di verità per localStorage (stesse chiavi di admin.js)

(function () {
  const LS_PRODUCTS = "33giri_products_v1";
  const LS_MODELS = "33giri_models_v1";
  const LS_COLLECTIONS = "33giri_collections_v1";
  const LS_ADMIN_SESSION = "33giri_admin_ok_v1";

  // vecchie chiavi (se in passato ne avevi altre)
  const LEGACY_KEYS = [
    "33giri_products",
    "33giri_products_v0",
    "products",
    "catalog_products",
  ];

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("JSON parse error", key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeProduct(p) {
    const out = { ...p };

    // compat: se prima usavi status="sold"
    if (out.status === "sold" && !out.soldAt) out.soldAt = new Date().toISOString();
    if (out.soldAt) out.status = "sold";
    else delete out.status;

    // garantisci campi minimi
    out.id = out.id || (Math.random().toString(16).slice(2) + Date.now().toString(16));
    out.title = out.title || "";
    out.artist = out.artist || "";
    out.genre = out.genre || "";
    out.year = out.year || "";
    out.model = out.model || "";
    out.collection = out.collection || "";
    out.image1 = out.image1 || "";
    out.image2 = out.image2 || "";

    return out;
  }

  function migrateIfNeeded() {
    const current = readJSON(LS_PRODUCTS, null);
    if (Array.isArray(current)) return; // già ok

    // prova a trovare dati in vecchie chiavi
    for (const k of LEGACY_KEYS) {
      const legacy = readJSON(k, null);
      if (Array.isArray(legacy) && legacy.length) {
        const fixed = legacy.map(normalizeProduct);
        writeJSON(LS_PRODUCTS, fixed);
        console.warn("Migrated products from", k, "->", LS_PRODUCTS);
        return;
      }
    }

    // se non c'è niente, inizializza vuoto
    writeJSON(LS_PRODUCTS, []);
  }

  migrateIfNeeded();

  const Store = {
    // --- admin session ---
    setAdmin(ok) {
      if (ok) {
        sessionStorage.setItem(LS_ADMIN_SESSION, "1");
        localStorage.setItem(LS_ADMIN_SESSION, "1");
      } else {
        sessionStorage.removeItem(LS_ADMIN_SESSION);
        localStorage.removeItem(LS_ADMIN_SESSION);
      }
    },
    isAdmin() {
      return (
        sessionStorage.getItem(LS_ADMIN_SESSION) === "1" ||
        localStorage.getItem(LS_ADMIN_SESSION) === "1"
      );
    },

    // --- products ---
    getProducts() {
      const list = readJSON(LS_PRODUCTS, []);
      return Array.isArray(list) ? list.map(normalizeProduct) : [];
    },
    setProducts(list) {
      const fixed = (Array.isArray(list) ? list : []).map(normalizeProduct);
      writeJSON(LS_PRODUCTS, fixed);
      return fixed;
    },

    // --- models / collections (opzionali) ---
    getModels() {
      const list = readJSON(LS_MODELS, ["Svuotatasche", "Posacenere"]);
      return Array.isArray(list) ? list : ["Svuotatasche", "Posacenere"];
    },
    setModels(list) {
      writeJSON(LS_MODELS, Array.from(new Set(list || [])).filter(Boolean));
    },
    getCollections() {
      const list = readJSON(LS_COLLECTIONS, ["Standard", "Spiral", "Splash"]);
      return Array.isArray(list) ? list : ["Standard", "Spiral", "Splash"];
    },
    setCollections(list) {
      writeJSON(LS_COLLECTIONS, Array.from(new Set(list || [])).filter(Boolean));
    },
  };

  window.Store = Store;
})();
