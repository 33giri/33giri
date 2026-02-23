// assets/js/public.js
(function () {
  const cfg = window.APP_CONFIG || {};
  const el = (id) => document.getElementById(id);

  const grid = el("grid");
  const count = el("count");
  const q = el("q");
  const advanced = el("advanced");
  const toggleFilters = el("toggleFilters");

  const fModel = el("fModel");
  const fCollection = el("fCollection");
  const fGenre = el("fGenre");
  const fYear = el("fYear");

  // hero texts
  const heroTitle = el("heroTitle");
  const heroSubtitle = el("heroSubtitle");
  if (heroTitle) heroTitle.textContent = cfg.heroTitle || "Arte in Vinile";
  if (heroSubtitle) {
    heroSubtitle.textContent =
      cfg.heroSubtitle || "Vinili trasformati in pezzi unici. Ogni pezzo racconta una storia musicale.";
  }

  toggleFilters?.addEventListener("click", () => {
    advanced?.classList.toggle("open");
  });

  function uniq(list) {
    return Array.from(new Set(list.filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b), "it")
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // --- CACHE prodotti ---
  let PRODUCTS = [];
  let FILTERS_READY = false;

  function fillSelectPreserve(select, items, firstLabel) {
    if (!select) return;

    const prev = select.value;
    const esc = (s) => String(s).replaceAll('"', "&quot;");

    select.innerHTML =
      `<option value="">${firstLabel}</option>` +
      items.map((x) => `<option value="${esc(x)}">${x}</option>`).join("");

    const stillExists = Array.from(select.options).some((o) => o.value === prev);
    select.value = stillExists ? prev : "";
  }

  function populateFilters(products) {
    const models = uniq(products.map((p) => p.model));
    const cols = uniq(products.map((p) => p.collection));
    const genres = uniq(products.map((p) => p.genre));
    const years = uniq(products.map((p) => p.year)).sort((a, b) => Number(a) - Number(b));

    fillSelectPreserve(fModel, models, "Modello");
    fillSelectPreserve(fCollection, cols, "Collezione");
    fillSelectPreserve(fGenre, genres, "Genere");
    fillSelectPreserve(fYear, years, "Anno");
  }

  function matches(p) {
    // pubblico: solo disponibili
    if (p.soldAt) return false;

    const qs = (q?.value || "").trim().toLowerCase();
    if (qs) {
      const hay = `${p.title || ""} ${p.artist || ""}`.toLowerCase();
      if (!hay.includes(qs)) return false;
    }

    if (fModel?.value && p.model !== fModel.value) return false;
    if (fCollection?.value && p.collection !== fCollection.value) return false;
    if (fGenre?.value && p.genre !== fGenre.value) return false;
    if (fYear?.value && String(p.year) !== String(fYear.value)) return false;

    return true;
  }

  function renderFromCache() {
    if (!grid || !count) return;
    if (!Array.isArray(PRODUCTS)) PRODUCTS = [];

    const filtered = PRODUCTS.filter(matches);
    count.textContent = String(filtered.length);

    grid.innerHTML = filtered
      .map(
        (p) => `
        <div class="card" data-id="${p.id}">
          <div class="card-img">
            <img src="${p.image1 || ""}" alt="">
          </div>

          <div class="card-body">
            <h3 class="card-title">${escapeHtml(p.title || "")}</h3>
            <div class="card-sub">${escapeHtml(p.artist || "")}</div>

            <div class="chips">
              <span class="chip">${escapeHtml(p.model || "")}</span>
              ${p.collection ? `<span class="chip blue">${escapeHtml(p.collection || "")}</span>` : ""}
            </div>

            <div class="card-meta">
              <span>${escapeHtml(p.genre || "")}</span>
              <span>${escapeHtml(String(p.year || ""))}</span>
            </div>
          </div>
        </div>
      `
      )
      .join("");
  }

  async function init() {
    if (!window.Store?.getProducts) {
      setTimeout(init, 120);
      return;
    }

    PRODUCTS = await window.Store.getProducts();

    if (!FILTERS_READY) {
      populateFilters(PRODUCTS);
      FILTERS_READY = true;
    } else {
      populateFilters(PRODUCTS);
    }

    renderFromCache();
  }

  // listeners: NON rifanno fetch
  [q, fModel, fCollection, fGenre, fYear].forEach((x) => {
    if (!x) return;
    x.addEventListener("input", renderFromCache);
    x.addEventListener("change", renderFromCache);
  });

  init();
})();
