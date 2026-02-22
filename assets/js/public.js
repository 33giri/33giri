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
  el("heroTitle").textContent = cfg.heroTitle || "Arte in Vinile";
  el("heroSubtitle").textContent =
    cfg.heroSubtitle || "Vinili trasformati in pezzi unici. Ogni pezzo racconta una storia musicale.";

  // ---------------- Admin modal ----------------
  const adminModal = el("adminModal");
  el("openAdmin").addEventListener("click", () => adminModal.classList.add("open"));
  el("closeAdmin").addEventListener("click", () => adminModal.classList.remove("open"));

  el("adminEnter").addEventListener("click", () => {
    const code = el("adminCode").value.trim();
    if (code === (cfg.adminCode || "")) {
      Store.setAdmin(true);
      window.location.href = "/33giri/admin/products.html";
    } else {
      el("adminErr").textContent = "Codice non valido.";
    }
  });

  // Filters toggle
  toggleFilters.addEventListener("click", () => {
    advanced.classList.toggle("open");
  });

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function uniq(list) {
    return Array.from(new Set(list.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), "it"));
  }

  // Popola filtri UNA volta (senza resettare selezioni ogni render)
  let filtersPopulated = false;
  function populateFiltersOnce(products) {
    if (filtersPopulated) return;
    filtersPopulated = true;

    const models = uniq(products.map((p) => p.model));
    const cols = uniq(products.map((p) => p.collection));
    const genres = uniq(products.map((p) => p.genre));
    const years = uniq(products.map((p) => p.year)).sort((a, b) => Number(a) - Number(b));

    const fill = (select, items, firstLabel) => {
      select.innerHTML =
        `<option value="">${firstLabel}</option>` +
        items.map((x) => `<option value="${String(x).replaceAll('"', "&quot;")}">${escapeHtml(x)}</option>`).join("");
    };

    fill(fModel, models, "Modello");
    fill(fCollection, cols, "Collezione");
    fill(fGenre, genres, "Genere");
    fill(fYear, years, "Anno");
  }

  function isSold(p) {
    // compatibile col tuo admin.js: venduto se soldAt esiste
    return !!p.soldAt;
  }

  function matches(p) {
    // pubblica mostra SOLO disponibili
    if (isSold(p)) return false;

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

  function waLinkForProduct(p) {
    const msg =
      `Ciao! Sono interessato a: ${p.title || "-"} — ${p.artist || "-"}.\n` +
      `Modello: ${p.model || "-"} | Collezione: ${p.collection || "-"} | Anno: ${p.year || "-"}.\n` +
      `Link: ${location.href}`;
    return `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  }

  // ---------------- Product modal (with arrows) ----------------
  const productModal = el("productModal");
  const closeProduct = el("closeProduct");
  closeProduct.addEventListener("click", () => productModal.classList.remove("open"));
  productModal.addEventListener("click", (e) => {
    if (e.target === productModal) productModal.classList.remove("open");
  });

  const imgPrev = el("imgPrev");
  const imgNext = el("imgNext");

  let current = null;
  let images = [];
  let imgIndex = 0;

  function setModalImage(i) {
    if (!images.length) return;
    imgIndex = (i + images.length) % images.length;
    el("mImg").src = images[imgIndex];
    // mostra frecce solo se c'è più di 1 immagine
    const showNav = images.length > 1;
    imgPrev.style.display = showNav ? "grid" : "none";
    imgNext.style.display = showNav ? "grid" : "none";
  }

  imgPrev.addEventListener("click", () => setModalImage(imgIndex - 1));
  imgNext.addEventListener("click", () => setModalImage(imgIndex + 1));

  document.addEventListener("keydown", (e) => {
    if (!productModal.classList.contains("open")) return;
    if (e.key === "ArrowLeft") setModalImage(imgIndex - 1);
    if (e.key === "ArrowRight") setModalImage(imgIndex + 1);
    if (e.key === "Escape") productModal.classList.remove("open");
  });

  function openProduct(id) {
    const p = Store.getProducts().find((x) => x.id === id);
    if (!p) return;

    current = p;
    images = [];
    if (p.image1) images.push(p.image1);
    if (p.image2 && String(p.image2).trim()) images.push(p.image2);

    el("mTitle").textContent = p.title || "";
    el("mArtist").textContent = p.artist || "";
    el("mGenre").textContent = p.genre || "";
    el("mYear").textContent = p.year || "";
    el("mExtra").textContent = `${p.model || ""}${p.collection ? " · " + p.collection : ""}`;

    const sold = isSold(p);
    el("mDot").classList.toggle("sold", sold);
    el("mStatusText").textContent = sold ? "Venduto" : "Disponibile - Pezzo Unico";

    el("whBtn").onclick = () => window.open(waLinkForProduct(p), "_blank");

    setModalImage(0);
    productModal.classList.add("open");
  }

  // ---------------- Render cards ----------------
  const INFO_TOOLTIP_TEXT = "MODELLO STANDARD MA PERSONALIZZABILE SU RICHIESTA";

  function render() {
    const products = Store.getProducts() || [];
    populateFiltersOnce(products);

    const filtered = products.filter(matches);
    count.textContent = String(filtered.length);

    grid.innerHTML = filtered
      .map((p) => {
        const stock = (p.stock != null ? p.stock : 1);
        return `
        <div class="card" data-id="${p.id}">
          <div class="card-img">
            <img src="${p.image1 || ""}" alt="">
            <div class="card-top-chips">
              <span class="pill pill-green">${escapeHtml(p.model || "")}</span>
              <span class="pill pill-blue">${escapeHtml(p.collection || "")}</span>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title">${escapeHtml(p.title || "")}</h3>
            <div class="card-sub">${escapeHtml(p.artist || "")}</div>

            <div class="card-meta-row">
              <div class="card-genre">${escapeHtml(p.genre || "")}</div>
              <div class="card-year">${escapeHtml(String(p.year || ""))}</div>
            </div>

            <div class="card-actions">
              <div class="stock">
                <span class="dot"></span>
                <span class="stock-text">In Stock: ${escapeHtml(String(stock))}</span>

                <button class="mini-info" type="button" data-act="info" aria-label="Info">
                  i
                  <span class="tip">${INFO_TOOLTIP_TEXT}</span>
                </button>
              </div>

              <button class="mini-wa" type="button" data-act="wa" aria-label="Contattaci su WhatsApp">
                <span class="wa-ico" aria-hidden="true"></span>
                Contattaci
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    // click handlers
    grid.querySelectorAll(".card").forEach((card) => {
      const id = card.dataset.id;

      // clic sulla card -> modal
      card.addEventListener("click", () => openProduct(id));

      // whatsapp: blocca apertura modal e apri wa
      const waBtn = card.querySelector('[data-act="wa"]');
      if (waBtn) {
        waBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const p = (Store.getProducts() || []).find((x) => x.id === id);
          if (!p) return;
          window.open(waLinkForProduct(p), "_blank");
        });
      }

      // info: su click apri anche modal (ma non obbligatorio)
      const infoBtn = card.querySelector('[data-act="info"]');
      if (infoBtn) {
        infoBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openProduct(id);
        });
      }
    });
  }

  // listeners
  [q, fModel, fCollection, fGenre, fYear].forEach((x) => x.addEventListener("input", render));
  [fModel, fCollection, fGenre, fYear].forEach((x) => x.addEventListener("change", render));

  render();
})();
