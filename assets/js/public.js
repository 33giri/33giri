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

  el("heroTitle").textContent = cfg.heroTitle || "Arte in Vinile";
  el("heroSubtitle").textContent =
    cfg.heroSubtitle || "Vinili trasformati in pezzi unici. Ogni pezzo racconta una storia musicale.";

  toggleFilters.addEventListener("click", () => {
    advanced.classList.toggle("open");
  });

  function uniq(list) {
    return Array.from(new Set(list.filter(Boolean))).sort((a, b) =>
      String(a).localeCompare(String(b), "it")
    );
  }

  function populateFilters(products) {
    const models = uniq(products.map((p) => p.model));
    const cols = uniq(products.map((p) => p.collection));
    const genres = uniq(products.map((p) => p.genre));
    const years = uniq(products.map((p) => p.year)).sort((a, b) => Number(a) - Number(b));

    const esc = (s) => String(s).replaceAll('"', "&quot;");

    const fill = (select, items, firstLabel) => {
      select.innerHTML =
        `<option value="">${firstLabel}</option>` +
        items.map((x) => `<option value="${esc(x)}">${x}</option>`).join("");
    };

    fill(fModel, models, "Modello");
    fill(fCollection, cols, "Collezione");
    fill(fGenre, genres, "Genere");
    fill(fYear, years, "Anno");
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function matches(p) {
    if (p.soldAt) return false;

    const qs = q.value.trim().toLowerCase();
    if (qs) {
      const hay = `${p.title || ""} ${p.artist || ""}`.toLowerCase();
      if (!hay.includes(qs)) return false;
    }

    if (fModel.value && p.model !== fModel.value) return false;
    if (fCollection.value && p.collection !== fCollection.value) return false;
    if (fGenre.value && p.genre !== fGenre.value) return false;
    if (fYear.value && String(p.year) !== String(fYear.value)) return false;

    return true;
  }

  // ✅ render async
  async function render() {
    if (!window.Store?.getProducts) {
      console.error("Store.getProducts missing");
      return;
    }

    const products = await Store.getProducts();
    populateFilters(products);

    const filtered = products.filter(matches);
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

  // listeners filtri
  [q, fModel, fCollection, fGenre, fYear].forEach((x) => x.addEventListener("input", render));
  [fModel, fCollection, fGenre, fYear].forEach((x) => x.addEventListener("change", render));

  render();
})();
