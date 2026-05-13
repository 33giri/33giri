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
  const fPlace = el("fPlace"); // ✅ filtro città
  const fGenre = el("fGenre");
  const fYear = el("fYear");

  // Modal elems (già presenti in index.html)
  const productModal = el("productModal");
  const closeProduct = el("closeProduct");
  const mImg = el("mImg");
  const imgPrev = el("imgPrev");
  const imgNext = el("imgNext");

  const mTitle = el("mTitle");
  const mArtist = el("mArtist");
  const mGenre = el("mGenre");
  const mYear = el("mYear");
  const mExtra = el("mExtra");
  const mDot = el("mDot");
  const mStatusText = el("mStatusText");
  const whBtn = el("whBtn");

  // hero texts
  const heroTitle = el("heroTitle");
  const heroSubtitle = el("heroSubtitle");
  if (heroTitle) heroTitle.textContent = cfg.heroTitle || "Arte in Vinile";
  if (heroSubtitle)
    heroSubtitle.textContent =
      cfg.heroSubtitle || "Vinili trasformati in pezzi unici. Ogni pezzo racconta una storia musicale.";

  toggleFilters?.addEventListener("click", () => {
    advanced?.classList.toggle("open");
  });

  // ✅ Correzione typo nei modelli (gestisce anche cache con vecchi valori sbagliati)
  const MODEL_TYPOS = {
    "posacenre": "posacenere",
    "spalsh":    "splash",
  };

  function fixModel(v) {
    const key = String(v ?? "").trim().toLowerCase();
    return MODEL_TYPOS[key] ?? v;
  }

  // ✅ Deduplicazione case-insensitive.
  // Se lowerCase=true il valore canonico è tutto minuscolo (usato per i modelli).
  // Altrimenti prima lettera maiuscola (usato per gli altri filtri).
  function uniq(list, lowerCase = false) {
    const map = new Map();
    list.filter(Boolean).forEach((v) => {
      const key = String(v).trim().toLowerCase();
      if (!map.has(key)) {
        const canonical = lowerCase
          ? key
          : key.charAt(0).toUpperCase() + key.slice(1);
        map.set(key, canonical);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a).localeCompare(String(b), "it")
    );
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normPlace(x) {
    return String(x ?? "").trim().toLowerCase();
  }

  function prettyPlace(place) {
    const s = String(place || "").trim();
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  // --- CACHE prodotti ---
  let PRODUCTS = [];
  let FILTERS_READY = false;

  // --- Modal state ---
  let CURRENT = null;
  let IMGS = [];
  let IDX = 0;

  function lockBody(lock) {
    if (lock) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
  }

  function setModalImage(i) {
    if (!IMGS.length) return;
    IDX = (i + IMGS.length) % IMGS.length;
    if (mImg) mImg.src = IMGS[IDX];
    if (imgPrev) imgPrev.style.display = IMGS.length > 1 ? "" : "none";
    if (imgNext) imgNext.style.display = IMGS.length > 1 ? "" : "none";
  }

  function waLinkFor(p) {
    const num = String(cfg.whatsappNumber || "").replaceAll(" ", "");
    const msg =
      `Ciao! Sono interessato a: ${p.title || "-"} — ${p.artist || "-"}.\n` +
      `Genere: ${p.genre || "-"} | Anno: ${p.year || "-"}\n` +
      `Modello: ${p.model || "-"} | Collezione: ${p.collection || "-"}\n` +
      `Città: ${prettyPlace(p.place) || "-"}\n`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  function openProductById(id) {
    const p = PRODUCTS.find((x) => String(x.id) === String(id));
    if (!p || !productModal) return;

    CURRENT = p;

    IMGS = [p.image1, p.image2].filter((x) => !!x);
    if (!IMGS.length) IMGS = [""];
    setModalImage(0);

    if (mTitle) mTitle.textContent = p.title || "";
    if (mArtist) mArtist.textContent = p.artist || "";
    if (mGenre) mGenre.textContent = p.genre || "";
    if (mYear) mYear.textContent = p.year ? String(p.year) : "";
    if (mExtra) mExtra.textContent = p.extra || p.note || p.description || "";

    const sold = !!p.soldAt;
    if (mDot) mDot.classList.toggle("sold", sold);
    if (mStatusText)
      mStatusText.textContent = sold ? "Venduto" : "Disponibile - Pezzo Unico";

    if (whBtn) whBtn.onclick = () => window.open(waLinkFor(p), "_blank", "noopener");

    productModal.classList.add("open");
    lockBody(true);
  }

  function closeProductModal() {
    if (!productModal) return;
    productModal.classList.remove("open");
    lockBody(false);
  }

  closeProduct?.addEventListener("click", closeProductModal);

  productModal?.addEventListener("click", (e) => {
    if (e.target === productModal) closeProductModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && productModal?.classList.contains("open")) {
      closeProductModal();
    }
  });

  imgPrev?.addEventListener("click", (e) => {
    e.stopPropagation();
    setModalImage(IDX - 1);
  });
  imgNext?.addEventListener("click", (e) => {
    e.stopPropagation();
    setModalImage(IDX + 1);
  });

  // ---- Filtri ----
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
    // ✅ modelli: corregge typo, tutto minuscolo, deduplicati case-insensitive
    const models = uniq(products.map((p) => fixModel(p.model)), true);
    const cols   = uniq(products.map((p) => p.collection));
    const places = uniq(products.map((p) => p.place));
    const genres = uniq(products.map((p) => p.genre));
    const years  = uniq(products.map((p) => p.year)).sort((a, b) => Number(a) - Number(b));

    fillSelectPreserve(fModel,      models, "Modello");
    fillSelectPreserve(fCollection, cols,   "Collezione");
    fillSelectPreserve(fPlace,      places, "Città");
    fillSelectPreserve(fGenre,      genres, "Genere");
    fillSelectPreserve(fYear,       years,  "Anno");
  }

  function applyUrlParamsOnce() {
    const sp = new URLSearchParams(location.search);

    const qParam          = sp.get("q");
    const genreParam      = sp.get("genre");
    const modelParam      = sp.get("model");
    const collectionParam = sp.get("collection");
    const placeParam      = sp.get("place");
    const yearParam       = sp.get("year");

    const hasAny = qParam || genreParam || modelParam || collectionParam || placeParam || yearParam;
    if (hasAny) advanced?.classList.add("open");

    if (qParam && q)                    q.value           = qParam;
    if (genreParam && fGenre)           fGenre.value      = genreParam;
    if (modelParam && fModel)           fModel.value      = modelParam;
    if (collectionParam && fCollection) fCollection.value = collectionParam;
    if (placeParam && fPlace)           fPlace.value      = placeParam;
    if (yearParam && fYear)             fYear.value       = yearParam;
  }

  // ✅ Confronto case-insensitive per model, collection e genre + correzione typo
  function matches(p) {
    if (p.soldAt) return false;

    const qs = (q?.value || "").trim().toLowerCase();
    if (qs) {
      const hay = `${p.title || ""} ${p.artist || ""}`.toLowerCase();
      if (!hay.includes(qs)) return false;
    }

    const ci = (s) => String(s ?? "").trim().toLowerCase();

    if (fModel?.value      && ci(fixModel(p.model)) !== ci(fModel.value)) return false;
    if (fCollection?.value && ci(p.collection)      !== ci(fCollection.value)) return false;
    if (fPlace?.value      && normPlace(p.place)    !== normPlace(fPlace.value)) return false;
    if (fGenre?.value      && ci(p.genre)           !== ci(fGenre.value)) return false;
    if (fYear?.value       && String(p.year)        !== String(fYear.value)) return false;

    return true;
  }

  function renderFromCache() {
    const filtered = (PRODUCTS || []).filter(matches);
    if (count) count.textContent = String(filtered.length);

    if (!grid) return;

    grid.innerHTML = filtered
      .map((p) => {
        const placeNice = prettyPlace(p.place);

        return `
        <div class="card" data-id="${escapeHtml(p.id)}" role="button" tabindex="0">
          <div class="card-img">
            <img src="${escapeHtml(p.image1 || "")}" alt="">
            <span class="hint-badge">scopri dettagli</span>
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

            ${
              placeNice
                ? `<div class="card-place">Disponibile a <span>${escapeHtml(placeNice)}</span></div>`
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Event delegation
  grid?.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const id = card.getAttribute("data-id");
    if (id) openProductById(id);
  });

  grid?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const card = e.target.closest(".card");
    if (!card) return;
    const id = card.getAttribute("data-id");
    if (id) openProductById(id);
  });

  // listeners filtri
  [q, fModel, fCollection, fPlace, fGenre, fYear].forEach((x) => {
    if (!x) return;
    x.addEventListener("input", renderFromCache);
    x.addEventListener("change", renderFromCache);
  });

  async function init() {
    if (!window.Store?.getProducts) {
      setTimeout(init, 120);
      return;
    }

    PRODUCTS = await Store.getProducts();

    // ✅ Default: Trento prima (poi Bologna, poi il resto)
    const placeRank = (p) => {
      const v = normPlace(p.place);
      if (v === "trento") return 0;
      if (v === "bologna") return 1;
      return 2;
    };

    PRODUCTS.sort((a, b) => {
      const ra = placeRank(a);
      const rb = placeRank(b);
      if (ra !== rb) return ra - rb;

      // a parità: più recenti prima se created_at esiste
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });

    populateFilters(PRODUCTS);

    if (!FILTERS_READY) {
      applyUrlParamsOnce();
      FILTERS_READY = true;
    }

    renderFromCache();
  }

  init();
})();
