/* assets/js/admin.js
   Admin logic (no backend) — localStorage only
   Features: add, edit, delete, mark sold, sold list
*/

const LS_PRODUCTS = "33giri_products_v1";
const LS_MODELS = "33giri_models_v1";
const LS_COLLECTIONS = "33giri_collections_v1";
const LS_ADMIN_SESSION = "33giri_admin_ok_v1";

// ---------- helpers ----------
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
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function requireAdmin() {
  const ok = sessionStorage.getItem(LS_ADMIN_SESSION) === "1";
  if (!ok) {
    // torna a index
    window.location.href = "../index.html";
  }
}

// convert image file -> dataURL
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// ---------- data ----------
function getProducts() {
  return readJSON(LS_PRODUCTS, []);
}
function setProducts(list) {
  writeJSON(LS_PRODUCTS, list);
}
function getModels() {
  return readJSON(LS_MODELS, ["Svuotatasche", "Posacenere"]);
}
function setModels(list) {
  writeJSON(LS_MODELS, list);
}
function getCollections() {
  return readJSON(LS_COLLECTIONS, ["Standard", "Spiral", "Splash"]);
}
function setCollections(list) {
  writeJSON(LS_COLLECTIONS, list);
}

// ---------- common UI ----------
function wireSidebarActive() {
  const path = location.pathname.toLowerCase();
  qsa(".nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href && path.endsWith(href.replace("./","").replace("../",""))) {
      a.classList.add("active");
    }
  });
  const out = qs("#logoutBtn");
  if (out) {
    out.addEventListener("click", () => {
      sessionStorage.removeItem(LS_ADMIN_SESSION);
      window.location.href = "../index.html";
    });
  }
}

function fillSelectOptions(selectEl, values, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  selectEl.appendChild(opt0);
  values.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    selectEl.appendChild(o);
  });
}

// ---------- products table (products.html) ----------
function renderProductsTable() {
  const tbody = qs("#productsBody");
  const search = qs("#searchProducts");
  if (!tbody) return;

  function paint() {
    const q = (search?.value || "").trim().toLowerCase();
    const list = getProducts()
      .filter(p => !p.soldAt)
      .filter(p => {
        if (!q) return true;
        return (
          (p.title||"").toLowerCase().includes(q) ||
          (p.artist||"").toLowerCase().includes(q) ||
          (p.genre||"").toLowerCase().includes(q) ||
          (p.model||"").toLowerCase().includes(q) ||
          (p.collection||"").toLowerCase().includes(q) ||
          String(p.year||"").includes(q)
        );
      });

    tbody.innerHTML = "";
    list.forEach(p => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div class="row-product">
            <div class="thumb">${p.image1 ? `<img src="${p.image1}" alt="">` : ""}</div>
            <div>
              <div style="font-weight:950">${escapeHTML(p.title || "")}</div>
              <div class="small-muted">${escapeHTML(p.genre || "")}</div>
            </div>
          </div>
        </td>
        <td>${escapeHTML(p.artist || "")}</td>
        <td><span class="badge model">${escapeHTML(p.model || "")}</span></td>
        <td>${p.collection ? `<span class="badge collection">${escapeHTML(p.collection)}</span>` : ""}</td>
        <td>${escapeHTML(String(p.year || ""))}</td>
        <td>
          <div class="actions">
            <span class="action-link" data-act="edit" data-id="${p.id}">Modifica</span>
            <span class="action-link green" data-act="sell" data-id="${p.id}">Vendi</span>
            <span class="action-link red" data-act="del" data-id="${p.id}">🗑</span>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.getAttribute("data-act");
    const id = el.getAttribute("data-id");
    if (!id) return;

    if (act === "edit") {
      window.location.href = `./add.html?edit=${encodeURIComponent(id)}`;
    }
    if (act === "sell") {
      const list = getProducts();
      const idx = list.findIndex(x => x.id === id);
      if (idx >= 0) {
        list[idx].soldAt = new Date().toISOString();
        setProducts(list);
        paint();
      }
    }
    if (act === "del") {
      if (!confirm("Eliminare questo prodotto?")) return;
      const list = getProducts().filter(x => x.id !== id);
      setProducts(list);
      paint();
    }
  });

  search?.addEventListener("input", paint);
  paint();
}

// ---------- sold list (sold.html) ----------
function renderSoldList() {
  const wrap = qs("#soldWrap");
  const search = qs("#searchSold");
  const count = qs("#soldCount");
  if (!wrap) return;

  function paint() {
    const q = (search?.value || "").trim().toLowerCase();
    const sold = getProducts()
      .filter(p => !!p.soldAt)
      .sort((a,b) => (b.soldAt||"").localeCompare(a.soldAt||""))
      .filter(p => {
        if (!q) return true;
        return (
          (p.title||"").toLowerCase().includes(q) ||
          (p.artist||"").toLowerCase().includes(q)
        );
      });

    if (count) count.textContent = `${sold.length} vendite totali`;
    wrap.innerHTML = "";

    sold.forEach(p => {
      const card = document.createElement("div");
      card.className = "panel";
      card.style.padding = "14px";
      card.style.marginTop = "12px";

      const soldDate = p.soldAt ? new Date(p.soldAt) : null;
      const soldLabel = soldDate ? soldDate.toLocaleString("it-IT") : "";

      card.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
          <div style="display:flex;gap:12px;align-items:center">
            <div class="thumb" style="width:54px;height:54px">${p.image1 ? `<img src="${p.image1}" alt="">` : ""}</div>
            <div>
              <div style="font-weight:950;font-size:18px">${escapeHTML(p.title || "")}</div>
              <div class="small-muted">${escapeHTML(p.artist || "")}</div>
              <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
                ${p.model ? `<span class="badge model">${escapeHTML(p.model)}</span>` : ""}
                ${p.collection ? `<span class="badge collection">${escapeHTML(p.collection)}</span>` : ""}
                ${p.genre ? `<span class="small-muted">${escapeHTML(p.genre)}</span>` : ""}
                ${p.year ? `<span class="small-muted">${escapeHTML(String(p.year))}</span>` : ""}
              </div>
            </div>
          </div>
          <div class="small-muted" style="display:flex;align-items:center;gap:8px">
            <span>🗓</span> <span>${escapeHTML(soldLabel)}</span>
          </div>
        </div>
      `;

      wrap.appendChild(card);
    });
  }

  search?.addEventListener("input", paint);
  paint();
}

// ---------- add/edit (add.html) ----------
async function wireAddEditForm() {
  const form = qs("#productForm");
  if (!form) return;

  const img1 = qs("#image1");
  const img2 = qs("#image2");
  const prev1 = qs("#preview1");
  const prev2 = qs("#preview2");

  const title = qs("#title");
  const artist = qs("#artist");
  const genre = qs("#genre");
  const year = qs("#year");
  const modelSel = qs("#model");
  const colSel = qs("#collection");

  const newModel = qs("#newModel");
  const addModelBtn = qs("#addModelBtn");
  const newCol = qs("#newCollection");
  const addColBtn = qs("#addCollectionBtn");

  const submitBtn = qs("#saveBtn");

  // fill selects
  fillSelectOptions(modelSel, getModels(), "Seleziona modello");
  fillSelectOptions(colSel, getCollections(), "Seleziona collezione (opzionale)");

  // add new model/collection
  addModelBtn?.addEventListener("click", () => {
    const v = (newModel?.value || "").trim();
    if (!v) return;
    const list = Array.from(new Set([...getModels(), v]));
    setModels(list);
    fillSelectOptions(modelSel, list, "Seleziona modello");
    modelSel.value = v;
    newModel.value = "";
  });

  addColBtn?.addEventListener("click", () => {
    const v = (newCol?.value || "").trim();
    if (!v) return;
    const list = Array.from(new Set([...getCollections(), v]));
    setCollections(list);
    fillSelectOptions(colSel, list, "Seleziona collezione (opzionale)");
    colSel.value = v;
    newCol.value = "";
  });

  // previews
  img1?.addEventListener("change", async () => {
    const f = img1.files?.[0];
    if (!f) return;
    prev1 && (prev1.src = await fileToDataURL(f));
  });
  img2?.addEventListener("change", async () => {
    const f = img2.files?.[0];
    if (!f) return;
    prev2 && (prev2.src = await fileToDataURL(f));
  });

  // edit mode?
  const params = new URLSearchParams(location.search);
  const editId = params.get("edit");
  let editing = null;

  if (editId) {
    const list = getProducts();
    editing = list.find(p => p.id === editId) || null;
    if (editing) {
      title.value = editing.title || "";
      artist.value = editing.artist || "";
      genre.value = editing.genre || "";
      year.value = editing.year || "";
      modelSel.value = editing.model || "";
      colSel.value = editing.collection || "";

      if (prev1 && editing.image1) prev1.src = editing.image1;
      if (prev2 && editing.image2) prev2.src = editing.image2;

      if (submitBtn) submitBtn.textContent = "Salva modifiche";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const t = title.value.trim();
    const a = artist.value.trim();
    const g = genre.value.trim();
    const y = year.value.trim();
    const m = modelSel.value.trim();

    if (!t || !a || !g || !y || !m) {
      alert("Compila tutti i campi obbligatori (titolo, artista, genere, anno, modello).");
      return;
    }

    // images: if new chosen -> dataURL; else keep existing in edit
    let image1 = editing?.image1 || "";
    let image2 = editing?.image2 || "";

    if (img1?.files?.[0]) image1 = await fileToDataURL(img1.files[0]);
    if (img2?.files?.[0]) image2 = await fileToDataURL(img2.files[0]);

    if (!image1) {
      alert("Carica almeno l'immagine 1 (principale).");
      return;
    }

    const product = {
      id: editing?.id || uid(),
      title: t,
      artist: a,
      genre: g,
      year: y,
      model: m,
      collection: colSel.value || "",
      image1,
      image2,
      soldAt: editing?.soldAt || null,
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = getProducts();
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) list[idx] = product;
    else list.unshift(product);

    setProducts(list);

    alert(editing ? "Modifiche salvate ✅" : "Prodotto aggiunto ✅");
    window.location.href = "./products.html";
  });
}

// basic HTML escape for safe injection
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", () => {
  // Se è una pagina admin (non index) richiedo sessione
  if (document.body.classList.contains("admin")) requireAdmin();

  wireSidebarActive();
  renderProductsTable();
  renderSoldList();
  wireAddEditForm();
});
