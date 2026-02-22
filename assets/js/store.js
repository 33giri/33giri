// assets/js/store.js
(function () {
  const KEY = window.APP_CONFIG.storageKey;

  function nowISO() {
    return new Date().toISOString();
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        return {
          products: [],
          sales: []
        };
      }
      const parsed = JSON.parse(raw);
      return {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        sales: Array.isArray(parsed.sales) ? parsed.sales : []
      };
    } catch {
      return { products: [], sales: [] };
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid() {
    return "p_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function upsertProduct(product) {
    const state = load();
    const idx = state.products.findIndex(p => p.id === product.id);
    if (idx >= 0) state.products[idx] = { ...state.products[idx], ...product };
    else state.products.unshift(product);
    save(state);
    return product;
  }

  function createProduct(payload) {
    const p = {
      id: uid(),
      title: payload.title || "",
      artist: payload.artist || "",
      genre: payload.genre || "",
      year: Number(payload.year) || "",
      model: payload.model || "",
      collection: payload.collection || "",
      image1: payload.image1 || "",
      image2: payload.image2 || "",
      status: "available", // available | sold
      createdAt: nowISO(),
      soldAt: null
    };
    return upsertProduct(p);
  }

  function deleteProduct(id) {
    const state = load();
    state.products = state.products.filter(p => p.id !== id);
    // pulisci anche vendite collegate (opzionale)
    state.sales = state.sales.filter(s => s.productId !== id);
    save(state);
  }

  function markSold(id) {
    const state = load();
    const p = state.products.find(x => x.id === id);
    if (!p) return null;
    if (p.status === "sold") return p;

    p.status = "sold";
    p.soldAt = nowISO();

    state.sales.unshift({
      id: "s_" + uid(),
      productId: p.id,
      title: p.title,
      artist: p.artist,
      model: p.model,
      collection: p.collection,
      genre: p.genre,
      year: p.year,
      image1: p.image1,
      soldAt: p.soldAt
    });

    save(state);
    return p;
  }

  function undoSold(id) {
    const state = load();
    const p = state.products.find(x => x.id === id);
    if (!p) return null;

    p.status = "available";
    p.soldAt = null;
    state.sales = state.sales.filter(s => s.productId !== id);

    save(state);
    return p;
  }

  function getProducts() {
    return load().products;
  }

  function getSales() {
    return load().sales;
  }

  function isAdmin() {
    return sessionStorage.getItem("isAdmin") === "1";
  }

  function setAdmin(flag) {
    sessionStorage.setItem("isAdmin", flag ? "1" : "0");
  }

  function requireAdminOrRedirect() {
    if (!isAdmin()) {
      window.location.href = "../index.html";
    }
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    // formato tipo screenshot: "10 febbraio 2026, 12:20"
    const date = d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
    const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    return `${date}, ${time}`;
  }

  window.Store = {
    load, save, uid,
    createProduct, upsertProduct, deleteProduct,
    markSold, undoSold,
    getProducts, getSales,
    isAdmin, setAdmin, requireAdminOrRedirect,
    fmtDate
  };
})();
