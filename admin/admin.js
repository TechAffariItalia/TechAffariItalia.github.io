const API_BASE = "https://tech-affari-italia-api.marconeri70.workers.dev";
const $ = s => document.querySelector(s);

const keyInput = $("#adminKey");
keyInput.value = sessionStorage.getItem("tai_admin_key") || "";
keyInput.addEventListener("input",()=>sessionStorage.setItem("tai_admin_key",keyInput.value));

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
      <img src="${escapeAttr(p.image || "../assets/logo.png")}" alt="">
      <div>
        <div class="fields">
          <label>Titolo<input data-field="title" value="${escapeAttr(p.title||"")}"></label>
          <label>Categoria<input data-field="category" value="${escapeAttr(p.category||"Altro")}"></label>
          <label class="full">Descrizione<textarea data-field="description">${escapeHtml(p.description||"")}</textarea></label>
          <label class="full">Immagine URL<input data-field="image" value="${escapeAttr(p.image||"")}"></label>
          <label class="full">Link affiliato<input data-field="affiliateUrl" value="${escapeAttr(p.affiliateUrl||"")}"></label>
        </div>
        <div class="actions">
          <label class="active-row"><input type="checkbox" data-field="active" ${p.active!==false?"checked":""}> Visibile</label>
          <button class="secondary save">Salva</button>
          <button class="danger delete">Elimina</button>
          <a class="secondary" href="${escapeAttr(p.affiliateUrl||"#")}" target="_blank" rel="noopener" style="text-decoration:none">Apri Temu</a>
        </div>
      </div>
    </article>`).join("") : '<div class="loading">Catalogo vuoto.</div>';

  document.querySelectorAll(".save").forEach(b=>b.addEventListener("click",()=>saveItem(b.closest(".item"))));
  document.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",()=>deleteItem(b.closest(".item"))));
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
    status.textContent=data.warning?`Importato. ${data.warning}`:"Prodotto importato e pubblicato.";
    $("#temuLink").value="";
    loadCatalog();
  }catch(e){
    status.className="status err";status.textContent=e.message;
  }finally{$("#importBtn").disabled=false}
});

$("#refreshBtn").addEventListener("click",loadCatalog);

function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
function escapeAttr(v){return escapeHtml(v).replaceAll('"',"&quot;")}

loadCatalog();
