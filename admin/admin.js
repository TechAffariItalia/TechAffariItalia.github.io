
// ---- PWA installazione Admin ----
let deferredInstallPrompt = null;
const installBtn = document.querySelector("#installAppBtn");
const installHelp = document.querySelector("#installHelp");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(err => {
      console.warn("Service Worker non registrato:", err);
    });
  });
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn?.classList.remove("hidden");
});

installBtn?.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    alert("Se il pulsante di installazione non è disponibile, apri il menu ⋮ del browser e scegli “Installa app” oppure “Aggiungi a schermata Home”.");
    return;
  }

  deferredInstallPrompt.prompt();
  try {
    await deferredInstallPrompt.userChoice;
  } finally {
    deferredInstallPrompt = null;
    installBtn.classList.add("hidden");
  }
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn?.classList.add("hidden");
  if (installHelp) {
    installHelp.innerHTML = "<strong>✅ App installata</strong><span>Tech Affari Italia Admin è ora disponibile dalla schermata Home.</span>";
  }
});

const standalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (standalone && installHelp) {
  installHelp.innerHTML =
    "<strong>📱 Tech Affari Italia Admin</strong><span>Stai usando la versione installata dell’app.</span>";
}

const API_BASE = "https://tech-affari-italia-api.marconeri70.workers.dev";
let categories = [];

async function loadCategories(){
  try{
    const data = await api("/categories",{cache:"no-store"});
    categories = Array.isArray(data.categories) ? data.categories : [];
    renderCategoryList();
  }catch(e){ console.warn(e); }
}

function renderCategoryList(){
  const box=$("#categoryList");
  if(!box) return;
  box.innerHTML = categories.length
    ? categories.map(c=>`<span class="category-pill">${escapeHtml(c)}<button type="button" data-delete-category="${escapeAttr(c)}">×</button></span>`).join("")
    : '<span class="muted">Nessuna categoria.</span>';

  document.querySelectorAll("[data-delete-category]").forEach(btn=>{
    btn.addEventListener("click",()=>deleteCategory(btn.dataset.deleteCategory));
  });
}

async function addCategory(){
  const input=$("#newCategoryName");
  const name=(input?.value||"").trim();
  if(!name) return;
  if(!keyInput.value.trim()) return alert("Inserisci la chiave amministratore.");
  try{
    const data=await api("/admin/categories",{method:"POST",headers:authHeaders(),body:JSON.stringify({name})});
    categories=data.categories||[];
    input.value="";
    renderCategoryList();
    loadCatalog();
  }catch(e){ alert(e.message); }
}

async function deleteCategory(name){
  if(!keyInput.value.trim()) return alert("Inserisci la chiave amministratore.");
  if(!confirm(`Eliminare la categoria "${name}"?`)) return;
  try{
    const data=await api(`/admin/categories/${encodeURIComponent(name)}`,{method:"DELETE",headers:authHeaders(false)});
    categories=data.categories||[];
    renderCategoryList();
    loadCatalog();
  }catch(e){ alert(e.message); }
}

function categoryOptions(selected){
  const list=[...new Set(["Altro",...categories,selected].filter(Boolean))];
  return list.map(c=>`<option value="${escapeAttr(c)}" ${c===selected?"selected":""}>${escapeHtml(c)}</option>`).join("");
}

const $ = s => document.querySelector(s);

const keyInput = $("#adminKey");
const rememberKey = $("#rememberAdminKey");
const forgetKeyBtn = $("#forgetAdminKey");
const keyStorageInfo = $("#keyStorageInfo");

const PERSISTENT_KEY = "tai_admin_key_persistent";
const REMEMBER_PREF = "tai_admin_key_remember";

// Default: remember on this installed/private device unless the user disabled it before.
const rememberedPref = localStorage.getItem(REMEMBER_PREF);
rememberKey.checked = rememberedPref !== "0";

// Load a persistent key first, then fall back to the current-session copy.
const persistentKey = localStorage.getItem(PERSISTENT_KEY) || "";
const sessionKey = sessionStorage.getItem("tai_admin_key") || "";
keyInput.value = persistentKey || sessionKey;

function saveAdminKeyPreference(){
  const value = keyInput.value.trim();

  // Always keep it for the current open session.
  if (value) sessionStorage.setItem("tai_admin_key", value);
  else sessionStorage.removeItem("tai_admin_key");

  if (rememberKey.checked && value) {
    localStorage.setItem(PERSISTENT_KEY, value);
    localStorage.setItem(REMEMBER_PREF, "1");
    if (keyStorageInfo) {
      keyStorageInfo.textContent = "Chiave memorizzata su questo dispositivo. Resterà disponibile anche dopo aver chiuso l’app.";
    }
  } else {
    localStorage.removeItem(PERSISTENT_KEY);
    localStorage.setItem(REMEMBER_PREF, "0");
    if (keyStorageInfo) {
      keyStorageInfo.textContent = "La chiave resterà disponibile solo finché questa sessione dell’app rimane attiva.";
    }
  }
}

keyInput.addEventListener("input", saveAdminKeyPreference);
keyInput.addEventListener("change", saveAdminKeyPreference);

rememberKey.addEventListener("change", saveAdminKeyPreference);

forgetKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(PERSISTENT_KEY);
  sessionStorage.removeItem("tai_admin_key");
  localStorage.setItem(REMEMBER_PREF, "0");
  keyInput.value = "";
  rememberKey.checked = false;
  if (keyStorageInfo) {
    keyStorageInfo.textContent = "Chiave dimenticata da questo dispositivo.";
  }
});

// Keep the explanatory text consistent on first load.
if (persistentKey) {
  if (keyStorageInfo) {
    keyStorageInfo.textContent = "Chiave già memorizzata su questo dispositivo. Non dovrai reinserirla a ogni apertura.";
  }
} else {
  saveAdminKeyPreference();
}

function authHeaders(json=true){
  const h = {"Authorization":`Bearer ${keyInput.value.trim()}`};
  if(json) h["Content-Type"]="application/json";
  return h;
}

async function api(path, options={}){
  const r = await fetch(`${API_BASE}${path}`,options);
  let data={};
  try{data=await r.json()}catch(_){}
  if(!r.ok) throw new Error(data.error || `Errore ${r.status}`);
  return data;
}

async function loadCatalog(){
  $("#catalog").innerHTML='<div class="loading">Caricamento…</div>';
  try{
    const data=await api("/products",{cache:"no-store"});
    renderCatalog(data.products||[]);
  }catch(e){
    $("#catalog").innerHTML=`<div class="loading">${escapeHtml(e.message)}</div>`;
  }
}

function renderCatalog(products){
  $("#catalog").innerHTML = products.length ? products.map(p=>`
    <article class="item" data-id="${escapeAttr(p.id)}">
      <div class="image-preview">
        <img class="preview-img"
             src="${escapeAttr(p.image || "../assets/logo.png")}"
             alt=""
             style="object-fit:${p.imageFit==="cover"?"cover":"contain"}"
             onerror="this.onerror=null;this.src='../assets/logo.png';this.style.objectFit='contain'">
      </div>
      <div>
        <div class="fields">
          <label>Titolo<input data-field="title" value="${escapeAttr(p.title||"")}"></label>
          <label>Categoria<select data-field="category">${categoryOptions(p.category||"Altro")}</select></label>

          <label class="full">Descrizione
            <textarea data-field="description">${escapeHtml(p.description||"")}</textarea>
          </label>

          <div class="full image-tools">
            <div></div>
            <div class="image-controls">
              <label>URL immagine visualizzata
                <input data-field="image" class="image-url" value="${escapeAttr(p.image||"")}" placeholder="https://...">
              </label>

              <label>Visualizzazione immagine
                <select data-field="imageFit" class="image-fit">
                  <option value="contain" ${p.imageFit!=="cover"?"selected":""}>Mostra intera (consigliato)</option>
                  <option value="cover" ${p.imageFit==="cover"?"selected":""}>Riempi il riquadro</option>
                </select>
              </label>

              <div class="mini-actions">
                <button type="button" class="secondary preview-image">Anteprima</button>
                <button type="button" class="secondary reset-image" ${p.autoImage?"":"disabled"}>Ripristina immagine automatica</button>
              </div>

              <div class="hint">
                Se l'immagine recuperata da Temu contiene scritte o viene male, incolla qui l'URL di una foto prodotto più pulita.
                Il negozio usa di default “Mostra intera”, quindi l'immagine non viene tagliata.
              </div>

              <input type="hidden" data-field="autoImage" value="${escapeAttr(p.autoImage||p.image||"")}">
            </div>
          </div>

          <label class="full">Link affiliato
            <input data-field="affiliateUrl" value="${escapeAttr(p.affiliateUrl||"")}">
          </label>
        </div>

        <div class="actions">
          <label class="active-row">
            <input type="checkbox" data-field="active" ${p.active!==false?"checked":""}> Visibile
          </label>
          <button class="secondary save">Salva</button>
          <button class="danger delete">Elimina</button>
          <a class="secondary" href="${escapeAttr(p.affiliateUrl||"#")}" target="_blank" rel="noopener" style="text-decoration:none">Apri Temu</a>
        </div>
      </div>
    </article>`).join("") : '<div class="loading">Catalogo vuoto.</div>';

  document.querySelectorAll(".save").forEach(b=>b.addEventListener("click",()=>saveItem(b.closest(".item"))));
  document.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",()=>deleteItem(b.closest(".item"))));

  document.querySelectorAll(".preview-image").forEach(b=>b.addEventListener("click",()=>{
    const item=b.closest(".item");
    updateImagePreview(item);
  }));

  document.querySelectorAll(".reset-image").forEach(b=>b.addEventListener("click",()=>{
    const item=b.closest(".item");
    const auto=item.querySelector('[data-field="autoImage"]')?.value || "";
    if(!auto) return;
    item.querySelector('[data-field="image"]').value=auto;
    updateImagePreview(item);
  }));

  document.querySelectorAll(".image-fit").forEach(sel=>sel.addEventListener("change",()=>{
    updateImagePreview(sel.closest(".item"));
  }));
}

function updateImagePreview(item){
  const img=item.querySelector(".preview-img");
  const url=item.querySelector('[data-field="image"]')?.value.trim() || "../assets/logo.png";
  const fit=item.querySelector('[data-field="imageFit"]')?.value || "contain";
  img.onerror=()=>{
    img.onerror=null;
    img.src="../assets/logo.png";
    img.style.objectFit="contain";
  };
  img.style.objectFit=fit;
  img.src=url;
}

async function saveItem(el){
  if(!keyInput.value.trim()) return alert("Inserisci la chiave amministratore.");
  const id=el.dataset.id;
  const payload={};
  el.querySelectorAll("[data-field]").forEach(x=>{
    payload[x.dataset.field]=x.type==="checkbox"?x.checked:x.value.trim();
  });
  try{
    await api(`/admin/products/${encodeURIComponent(id)}`,{
      method:"PUT",headers:authHeaders(),body:JSON.stringify(payload)
    });
    alert("Prodotto aggiornato.");
    loadCatalog();
  }catch(e){alert(e.message)}
}

async function deleteItem(el){
  if(!keyInput.value.trim()) return alert("Inserisci la chiave amministratore.");
  if(!confirm("Eliminare questo prodotto?")) return;
  try{
    await api(`/admin/products/${encodeURIComponent(el.dataset.id)}`,{
      method:"DELETE",headers:authHeaders(false)
    });
    loadCatalog();
  }catch(e){alert(e.message)}
}

$("#importBtn").addEventListener("click",async()=>{
  const status=$("#importStatus");
  const link=$("#temuLink").value.trim();
  if(!keyInput.value.trim()){status.className="status err";status.textContent="Inserisci la chiave amministratore.";return}
  if(!link){status.className="status err";status.textContent="Inserisci il link Temu.";return}
  status.className="status";status.textContent="Importazione in corso…";
  $("#importBtn").disabled=true;
  try{
    const data=await api("/admin/import",{
      method:"POST",headers:authHeaders(),body:JSON.stringify({link})
    });
    status.className="status ok";
    status.textContent=data.warning?`Importato. ${data.warning}`:"Prodotto importato e pubblicato. Puoi controllare o sostituire l’immagine qui sotto.";
    $("#temuLink").value="";
    loadCatalog();
  }catch(e){
    status.className="status err";status.textContent=e.message;
  }finally{$("#importBtn").disabled=false}
});

$("#refreshBtn").addEventListener("click",loadCatalog);

function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
function escapeAttr(v){return escapeHtml(v).replaceAll('"',"&quot;")}

$("#addCategoryBtn")?.addEventListener("click",addCategory);
$("#newCategoryName")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addCategory();}});
Promise.all([loadCategories(),loadCatalog()]);
