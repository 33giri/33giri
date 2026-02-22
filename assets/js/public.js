// assets/js/public.js
(function(){
  const cfg = window.APP_CONFIG;

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
  el("heroTitle").textContent = cfg.heroTitle;
  el("heroSubtitle").textContent = cfg.heroSubtitle;

  // Admin modal
  const adminModal = el("adminModal");
  el("openAdmin").addEventListener("click", () => adminModal.classList.add("open"));
  el("closeAdmin").addEventListener("click", () => adminModal.classList.remove("open"));
  el("adminEnter").addEventListener("click", () => {
    const code = el("adminCode").value.trim();
    if(code === cfg.adminCode){
      Store.setAdmin(true);
      window.location.href = "admin/products.html";
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

    const fill = (select, items, firstLabel) => {
      select.innerHTML = `<option value="">${firstLabel}</option>` + items.map(x => `<option value="${String(x).replaceAll('"','&quot;')}">${x}</option>`).join("");
    };

    fill(fModel, models, "Modello");
    fill(fCollection, cols, "Collezione");
    fill(fGenre, genres, "Genere");
    fill(fYear, years, "Anno");
  }

  function matches(p){
    // Public shows only available
    if(p.status === "sold") return false;

    const qs = q.value.trim().toLowerCase();
    if(qs){
      const hay = `${p.title} ${p.artist}`.toLowerCase();
      if(!hay.includes(qs)) return false;
    }
    if(fModel.value && p.model !== fModel.value) return false;
    if(fCollection.value && p.collection !== fCollection.value) return false;
    if(fGenre.value && p.genre !== fGenre.value) return false;
    if(fYear.value && String(p.year) !== String(fYear.value)) return false;

    return true;
  }

  function render(){
    const products = Store.getProducts();
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
            <span class="chip blue">${escapeHtml(p.collection || "")}</span>
          </div>
          <div class="card-meta">
            <span>${escapeHtml(p.genre || "")}</span>
            <span>${escapeHtml(String(p.year || ""))}</span>
          </div>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", () => openProduct(card.dataset.id));
    });
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  // Product modal
  const productModal = el("productModal");
  const closeProduct = el("closeProduct");
  closeProduct.addEventListener("click", () => productModal.classList.remove("open"));
  productModal.addEventListener("click", (e) => {
    if(e.target === productModal) productModal.classList.remove("open");
  });

  let current = null;
  let showingAlt = false;

  function openProduct(id){
    const p = Store.getProducts().find(x => x.id === id);
    if(!p) return;
    current = p;
    showingAlt = false;

    el("mTitle").textContent = p.title || "";
    el("mArtist").textContent = p.artist || "";
    el("mGenre").textContent = p.genre || "";
    el("mYear").textContent = p.year || "";
    el("mImg").src = p.image1 || "";
    el("mExtra").textContent = `${p.model || ""}${p.collection ? " · " + p.collection : ""}`;

    const sold = p.status === "sold";
    el("mDot").classList.toggle("sold", sold);
    el("mStatusText").textContent = sold ? "Venduto" : "Disponibile - Pezzo Unico";

    el("whBtn").onclick = () => {
      const msg = `Ciao! Sono interessato a: ${p.title} — ${p.artist}. Modello: ${p.model || "-"}, Collezione: ${p.collection || "-"}, Anno: ${p.year || "-"}.\nLink: ${location.href}`;
      const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    };

    el("img2Btn").style.display = (p.image2 && p.image2.trim()) ? "grid" : "none";
    el("img2Btn").onclick = () => {
      if(!current) return;
      showingAlt = !showingAlt;
      el("mImg").src = showingAlt ? (current.image2 || current.image1) : (current.image1 || current.image2);
    };

    productModal.classList.add("open");
  }

  // listeners
  [q, fModel, fCollection, fGenre, fYear].forEach(x => x.addEventListener("input", render));
  [fModel, fCollection, fGenre, fYear].forEach(x => x.addEventListener("change", render));

  render();
})();
