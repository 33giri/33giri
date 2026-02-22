// assets/js/admin.js
(function(){
  Store.requireAdminOrRedirect();

  const path = location.pathname;

  const $ = (id) => document.getElementById(id);

  // logout
  const logoutBtn = $("logout");
  if (logoutBtn){
    logoutBtn.addEventListener("click", () => {
      Store.setAdmin(false);
      location.href = "../index.html";
    });
  }

  // Helpers
  function esc(str){
    return String(str || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function uniq(list){
    return Array.from(new Set(list.filter(Boolean))).sort((a,b)=> String(a).localeCompare(String(b), "it"));
  }

  function fileToDataURL(file){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // =========================
  // PRODUCTS PAGE
  // =========================
  if (path.endsWith("/admin/products.html")){
    const tbody = $("tbody");
    const search = $("search");
    const total = $("total");

    const editModal = $("editModal");
    const closeEdit = $("closeEdit");

    let editingId = null;

    function openEdit(p){
      editingId = p.id;
      $("eTitle").value = p.title || "";
      $("eArtist").value = p.artist || "";
      $("eGenre").value = p.genre || "";
      $("eYear").value = p.year || "";
      $("eModel").value = p.model || "";
      $("eCollection").value = p.collection || "";
      $("eImg1").value = p.image1 || "";
      $("eImg2").value = p.image2 || "";
      $("editNote").textContent = "";
      editModal.classList.add("open");
    }

    function closeEditFn(){
      editModal.classList.remove("open");
      editingId = null;
    }

    closeEdit?.addEventListener("click", closeEditFn);
    editModal?.addEventListener("click", (e) => { if(e.target === editModal) closeEditFn(); });

    $("saveEdit").addEventListener("click", () => {
      if(!editingId) return;
      const p = Store.getProducts().find(x => x.id === editingId);
      if(!p) return;

      Store.upsertProduct({
        ...p,
        title: $("eTitle").value.trim(),
        artist: $("eArtist").value.trim(),
        genre: $("eGenre").value.trim(),
        year: Number($("eYear").value) || "",
        model: $("eModel").value.trim(),
        collection: $("eCollection").value.trim(),
        image1: $("eImg1").value.trim(),
        image2: $("eImg2").value.trim(),
      });

      $("editNote").textContent = "Salvato.";
      render();
      setTimeout(closeEditFn, 450);
    });

    function matches(p){
      const qs = (search.value || "").trim().toLowerCase();
      if(!qs) return true;
      const hay = `${p.title} ${p.artist} ${p.genre} ${p.model} ${p.collection} ${p.year}`.toLowerCase();
      return hay.includes(qs);
    }

    function render(){
      const products = Store.getProducts();
      total.textContent = String(products.length);

      const rows = products.filter(matches).map(p => {
        const disabledSell = p.status === "sold";
        return `
          <tr>
            <td>
              <div class="row-product">
                <div class="thumb"><img src="${esc(p.image1)}" alt=""></div>
                <div>
                  <div style="font-weight:950;">${esc(p.title)}</div>
                  <div class="small-muted">${esc(p.genre)}</div>
                </div>
              </div>
            </td>
            <td>${esc(p.artist)}</td>
            <td><span class="badge model">${esc(p.model)}</span></td>
            <td><span class="badge collection">${esc(p.collection)}</span></td>
            <td>${esc(p.year)}</td>
            <td>
              <div class="actions">
                <span class="action-link" data-act="edit" data-id="${p.id}">✎ Modifica</span>
                <span class="action-link green ${disabledSell ? "disabled":""}" data-act="sell" data-id="${p.id}">🛒 Vendi</span>
                <span class="action-link red" data-act="del" data-id="${p.id}">🗑</span>
              </div>
            </td>
          </tr>
        `;
      }).join("");

      tbody.innerHTML = rows || `<tr><td colspan="6" style="padding:18px;color:rgba(255,255,255,.55);font-weight:800;">Nessun prodotto.</td></tr>`;

      tbody.querySelectorAll("[data-act]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const act = btn.dataset.act;
          const p = Store.getProducts().find(x => x.id === id);
          if(!p) return;

          if(act === "edit") openEdit(p);

          if(act === "sell"){
            if(p.status === "sold") return;
            Store.markSold(id);
            render();
          }

          if(act === "del"){
            const ok = confirm("Eliminare questo prodotto?");
            if(!ok) return;
            Store.deleteProduct(id);
            render();
          }
        });
      });
    }

    search.addEventListener("input", render);
    render();
  }

  // =========================
  // ADD PAGE
  // =========================
  if (path.endsWith("/admin/add.html")){
    const img1 = $("img1");
    const img2 = $("img2");

    let img1Data = "";
    let img2Data = "";

    function refreshSelects(modelsExtra = [], colsExtra = []){
      const products = Store.getProducts();
      const models = uniq(products.map(p => p.model).concat(modelsExtra));
      const cols = uniq(products.map(p => p.collection).concat(colsExtra));

      const ms = $("modelSelect");
      const cs = $("collectionSelect");

      ms.innerHTML = `<option value="">Seleziona modello</option>` + models.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("");
      cs.innerHTML = `<option value="">Seleziona collezione (opzionale)</option>` + cols.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
    }

    refreshSelects();

    $("addModel").addEventListener("click", () => {
      const v = $("modelNew").value.trim();
      if(!v) return;
      refreshSelects([v], []);
      $("modelSelect").value = v;
      $("modelNew").value = "";
    });

    $("addCollection").addEventListener("click", () => {
      const v = $("collectionNew").value.trim();
      if(!v) return;
      refreshSelects([], [v]);
      $("collectionSelect").value = v;
      $("collectionNew").value = "";
    });

    img1.addEventListener("change", async () => {
      const f = img1.files?.[0];
      if(!f) return;
      img1Data = await fileToDataURL(f);
      $("drop1").textContent = "Immagine caricata ✓";
    });

    img2.addEventListener("change", async () => {
      const f = img2.files?.[0];
      if(!f) return;
      img2Data = await fileToDataURL(f);
      $("drop2").textContent = "Immagine caricata ✓";
    });

    $("save").addEventListener("click", () => {
      const title = $("title").value.trim();
      const artist = $("artist").value.trim();
      const genre = $("genre").value.trim();
      const year = $("year").value.trim();
      const model = $("modelSelect").value.trim();
      const collection = $("collectionSelect").value.trim();

      if(!title || !artist || !genre || !year || !model){
        $("note").textContent = "Compila tutti i campi obbligatori (*) e seleziona un modello.";
        return;
      }
      if(!img1Data){
        $("note").textContent = "Carica almeno Immagine 1 (principale).";
        return;
      }

      Store.createProduct({
        title, artist, genre,
        year: Number(year),
        model,
        collection,
        image1: img1Data,
        image2: img2Data
      });

      $("note").textContent = "Prodotto salvato ✓";
      setTimeout(() => location.href = "products.html", 450);
    });
  }

  // =========================
  // SOLD PAGE
  // =========================
  if (path.endsWith("/admin/sold.html")){
    const totalSold = $("totalSold");
    const searchSold = $("searchSold");
    const soldList = $("soldList");

    function matches(s){
      const qs = (searchSold.value || "").trim().toLowerCase();
      if(!qs) return true;
      const hay = `${s.title} ${s.artist} ${s.genre} ${s.model} ${s.collection} ${s.year}`.toLowerCase();
      return hay.includes(qs);
    }

    function render(){
      const sales = Store.getSales();
      totalSold.textContent = String(sales.length);

      const html = sales.filter(matches).map(s => `
        <div class="panel" style="padding:16px 16px; margin-top:14px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:14px;">
            <div class="row-product" style="gap:14px;">
              <div class="thumb" style="width:56px;height:56px;border-radius:12px;">
                <img src="${esc(s.image1)}" alt="">
              </div>
              <div>
                <div style="font-weight:950; font-size:18px;">${esc(s.title)}</div>
                <div class="small-muted" style="font-size:13px;">${esc(s.artist)}</div>
                <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
                  <span class="badge model">${esc(s.model)}</span>
                  <span class="badge collection">${esc(s.collection)}</span>
                  <span class="small-muted">${esc(s.genre)} · ${esc(s.year)}</span>
                </div>
              </div>
            </div>

            <div class="small-muted" style="white-space:nowrap;">
              🗓 ${Store.fmtDate(s.soldAt)}
            </div>
          </div>

          <div style="margin-top:12px; display:flex; justify-content:flex-end;">
            <span class="action-link" data-act="undo" data-id="${s.productId}">↩ Annulla vendita</span>
          </div>
        </div>
      `).join("");

      soldList.innerHTML = html || `<div class="panel" style="padding:18px;color:rgba(255,255,255,.55);font-weight:800;margin-top:14px;">Nessuna vendita.</div>`;

      soldList.querySelectorAll("[data-act='undo']").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          Store.undoSold(id);
          render();
        });
      });
    }

    searchSold.addEventListener("input", render);
    render();
  }

})();
