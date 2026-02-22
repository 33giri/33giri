// assets/js/public.js
(function(){
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

  // --- Admin session key (must match admin.js)
  const LS_ADMIN_SESSION = "33giri_admin_ok_v1";

  // Admin modal
  const adminModal = el("adminModal");

  el("openAdmin").addEventListener("click", () => {
    el("adminErr").textContent = "";
    el("adminCode").value = "";
    adminModal.classList.add("open");
  });

  el("closeAdmin").addEventListener("click", () => adminModal.classList.remove("open"));

  function setAdminSession(ok){
    if(ok){
      sessionStorage.setItem(LS_ADMIN_SESSION, "1");
      localStorage.setItem(LS_ADMIN_SESSION, "1");
      if (window.Store?.setAdmin) Store.setAdmin(true);
    } else {
      sessionStorage.removeItem(LS_ADMIN_SESSION);
      localStorage.removeItem(LS_ADMIN_SESSION);
      if (window.Store?.setAdmin) Store.setAdmin(false);
    }
  }

  el("adminEnter").addEventListener("click", () => {
    const code = el("adminCode").value.trim();
    if(code === String(cfg.adminCode || "").trim()){
      setAdminSession(true);
      window.location.href = "./admin/products.html";
    } else {
      el("adminErr").textContent = "Codice non valido.";
    }
  });

  // Filters toggle
  toggleFilters.addEventListener("click", () => {
    advanced.classList.toggle("open");
  });

  function uniq(list){
    return Array.from(new Set(list.filter(Boolean))).sort((a,b)=> String(a).localeCompare(String(b), "it"));
  }

  function populateFilters(products){
    const models = uniq(products.map(p => p.model));
    const cols = uniq(products.map(p => p.collection));
    const genres = uniq(products.map(p => p.genre));
    const years = uniq(products.map(p => p.year)).sort((a,b)=> Number(a)-Number(b));

    const esc = (s)=> String(s).replaceAll('"','&quot;');

    const fill = (select, items, firstLabel) => {
      select.innerHTML =
        `<option value="">${firstLabel}</option>` +
        items.map(x => `<option value="${esc(x)}">${x}</option>`).join("");
    };

    fill(fModel, models, "Modello");
    fill(fCollection, cols, "Collezione");
    fill(fGenre, genres, "Genere");
    fill(fYear, years, "Anno");
  }

  function matches(p){
    // pubblico mostra SOLO disponibili: se soldAt esiste → venduto
    if(p.soldAt) return false;

    const qs = q.value.trim().toLowerCase();
    if(qs){
      const hay = `${p.title||""} ${p.artist||""}`.toLowerCase();
      if(!hay.includes(qs)) return false;
    }
    if(fModel.value && p.model !== fModel.value) return false;
    if(fCollection.value && p.collection !== fCollection.value) return false;
    if(fGenre.value && p.genre !== fGenre.value) return false;
    if(fYear.value && String(p.year) !== String(fYear.value)) return false;

    return true;
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // ---------------- Tooltip "i" (home + modal) ----------------
  const INFO_TEXT = "Modello standard, personalizzabile su richiesta";

  function closeAllInfoTips(){
    document.querySelectorAll(".mini-info.is-open").forEach(btn => btn.classList.remove("is-open"));
  }

  // chiudi tooltip se clicchi fuori (mobile)
  document.addEventListener("click", (e) => {
    const insideInfo = e.target.closest && e.target.closest(".mini-info");
    if (!insideInfo) closeAllInfoTips();
  }, { capture: true });

  // ---------------- Product modal + arrows ----------------
  const productModal = el("productModal");
  const closeBtn = el("closeProduct");
  const imgPrev = el("imgPrev");
  const imgNext = el("imgNext");
  const modalInfo = el("modalInfo");

  function closeModal(){
    productModal.classList.remove("open");
    closeAllInfoTips();
  }

  closeBtn.addEventListener("click", closeModal);

  productModal.addEventListener("click", (e) => {
    if(e.target === productModal) closeModal();
  });

  // tap sulla i nel modal: toggle tooltip (identico home)
  if(modalInfo){
    modalInfo.addEventListener("click", (e) => {
      e.stopPropagation();
      // chiudi gli altri, poi apri/chiudi questo
      document.querySelectorAll(".mini-info.is-open").forEach(btn => {
        if (btn !== modalInfo) btn.classList.remove("is-open");
      });
      modalInfo.classList.toggle("is-open");
    });
  }

  let currentImages = [];
  let imgIndex = 0;

  function setModalImage(nextIndex){
    if(!currentImages.length) return;

    imgIndex = (nextIndex + currentImages.length) % currentImages.length;
    el("mImg").src = currentImages[imgIndex];

    const showNav = currentImages.length > 1;
    if (imgPrev) imgPrev.style.display = showNav ? "grid" : "none";
    if (imgNext) imgNext.style.display = showNav ? "grid" : "none";
  }

  function openProduct(id){
    const p = (Store.getProducts() || []).find(x => x.id === id);
    if(!p) return;

    closeAllInfoTips();

    // immagini disponibili
    currentImages = [];
    if(p.image1) currentImages.push(p.image1);
    if(p.image2 && String(p.image2).trim()) currentImages.push(p.image2);

    // testo
    el("mTitle").textContent = p.title || "";
    el("mArtist").textContent = p.artist || "";
    el("mGenre").textContent = p.genre || "";
    el("mYear").textContent = p.year || "";
    el("mExtra").textContent = `${p.model || ""}${p.collection ? " · " + p.collection : ""}`;

    const sold = !!p.soldAt;
    el("mDot").classList.toggle("sold", sold);
    el("mStatusText").textContent = sold ? "Venduto" : "Disponibile - Pezzo Unico";

    el("whBtn").onclick = () => {
      const msg =
        `Ciao! Sono interessato a: ${p.title} — ${p.artist}. ` +
        `Modello: ${p.model || "-"}, Collezione: ${p.collection || "-"}, Anno: ${p.year || "-"}.\n` +
        `Link: ${location.href}`;
      const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    };

    imgIndex = 0;
    setModalImage(0);
    productModal.classList.add("open");
  }

  // frecce: click (e NON chiudere il modal)
  if(imgPrev){
    imgPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      setModalImage(imgIndex - 1);
    });
  }
  if(imgNext){
    imgNext.addEventListener("click", (e) => {
      e.stopPropagation();
      setModalImage(imgIndex + 1);
    });
  }

  // tastiera (solo se modal aperto)
  document.addEventListener("keydown", (e) => {
    if(!productModal.classList.contains("open")) return;
    if(e.key === "ArrowLeft") setModalImage(imgIndex - 1);
    if(e.key === "ArrowRight") setModalImage(imgIndex + 1);
    if(e.key === "Escape") closeModal();
  });

  // ---------------- Render cards ----------------
  function render(){
    const products = Store.getProducts() || [];
    populateFilters(products);

    const filtered = products.filter(matches);
    count.textContent = String(filtered.length);

    grid.innerHTML = filtered.map(p => `
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

          <div class="card-actions">
            <div class="stock">
              <span class="dot"></span>
              <span class="stock-text">In Stock: 1</span>

              <button class="mini-info" type="button" data-act="info" aria-label="Info">
                i
                <span class="tip" role="tooltip">${INFO_TEXT}</span>
              </button>
            </div>

            <button class="mini-wa" type="button" data-act="wa" aria-label="Contattaci su WhatsApp">
              <span class="wa-ico" aria-hidden="true"></span>
              Contattaci
            </button>
          </div>
        </div>
      </div>
    `).join("");

    // handlers
    grid.querySelectorAll(".card").forEach(card => {
      const id = card.dataset.id;

      // click sulla card -> apre modal
      card.addEventListener("click", () => openProduct(id));

      // whatsapp: NON aprire modal
      const waBtn = card.querySelector('[data-act="wa"]');
      if (waBtn) {
        waBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const p = (Store.getProducts() || []).find(x => x.id === id);
          if(!p) return;

          const msg =
            `Ciao! Sono interessato a: ${p.title} — ${p.artist}. ` +
            `Modello: ${p.model || "-"}, Collezione: ${p.collection || "-"}, Anno: ${p.year || "-"}.\n` +
            `Link: ${location.href}`;
          const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`;
          window.open(url, "_blank");
        });
      }

      // info: hover desktop via CSS + tap mobile toggla .is-open
      const infoBtn = card.querySelector('[data-act="info"]');
      if (infoBtn) {
        infoBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".mini-info.is-open").forEach(btn => {
            if (btn !== infoBtn) btn.classList.remove("is-open");
          });
          infoBtn.classList.toggle("is-open");
        });
      }
    });
  }

  // listeners filtri
  [q, fModel, fCollection, fGenre, fYear].forEach(x => x.addEventListener("input", render));
  [fModel, fCollection, fGenre, fYear].forEach(x => x.addEventListener("change", render));

  render();
})();
