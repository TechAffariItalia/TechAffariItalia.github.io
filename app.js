const tg = window.Telegram?.WebApp;
const API_BASE = "https://tech-affari-italia-api.marconeri70.workers.dev";

if (tg) { tg.ready(); tg.expand(); }

const fallbackProducts = [
  {
    id:"watch-default",
    title:"GUHUAVMI 2026 Smartwatch Sport",
    category:"Wearable",
    image:"assets/temu_smartwatch_guhuavmi.jpg",
    description:"Smartwatch da uomo per sport e attività all’aperto. Prezzo, disponibilità e condizioni sono aggiornati direttamente su Temu.",
    affiliateUrl:"https://share.temu.com/aNZyP0gZu8B",
    active:true
  },
  {
    id:"camera-default",
    title:"Videocamera digitale 66MP orientabile",
    category:"Fotocamere",
    image:"assets/temu_videocamera_66mp.jpg",
    description:"Videocamera compatta mostrata nella scheda Temu con indicazione 66MP e testa orientabile. Dettagli, prezzo e disponibilità vanno verificati direttamente su Temu.",
    affiliateUrl:"https://share.temu.com/yei2WWdVubB",
    active:true
  }
];

let products = [];
let activeCat = "Tutti";
let query = "";

const $ = s => document.querySelector(s);
const grid = $("#productGrid");

function openAffiliate(url){
  try { if(tg?.openLink){ tg.openLink(url); return; } } catch(e){}
  window.open(url,"_blank","noopener,noreferrer");
}

function renderCategories(){
  const cats = ["Tutti", ...new Set(products.filter(p=>p.active!==false).map(p=>p.category || "Altro"))];
  $("#categoryChips").innerHTML = cats.map((cat,i)=>`<button class="chip ${i===0?"active":""}" data-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join("");
  document.querySelectorAll(".chip").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    renderProducts();
  }));
}

function renderProducts(){
  const list = products.filter(p => p.active!==false)
    .filter(p => activeCat==="Tutti" || (p.category||"Altro")===activeCat)
    .filter(p => (p.title||"").toLowerCase().includes(query.toLowerCase()));

  $("#productCount").textContent = `${list.length} ${list.length===1?"prodotto":"prodotti"}`;

  grid.innerHTML = list.length ? list.map(p=>`
    <article class="product-card">
      <div class="product-media">
        <img src="${escapeAttr(p.image || "assets/logo.png")}" alt="${escapeAttr(p.title || "Prodotto")}" style="object-fit:${p.imageFit === "cover" ? "cover" : "contain"}" onerror="this.onerror=null;this.src='assets/logo.png';this.style.objectFit='contain'">
        <span class="badge">TEMU AFFILIATE</span><span class="product-image-note">immagine prodotto</span>
      </div>
      <div class="product-body">
        <small>${escapeHtml(p.category || "Altro")}</small>
        <h3>${escapeHtml(p.title || "Prodotto Temu")}</h3>
        <p class="product-desc">${escapeHtml(p.description || "Prezzo, disponibilità e condizioni sono aggiornati direttamente su Temu.")}</p>
        <div class="price-note">Prezzo aggiornato su Temu</div>
        <div class="card-actions">
          <button class="buy-btn" data-buy="${escapeAttr(p.id)}">🛒 Acquista su Temu</button>
          <button class="info-btn" data-info="${escapeAttr(p.id)}">ⓘ</button>
        </div>
      </div>
    </article>`).join("") : `<div class="empty">Nessun prodotto trovato.</div>`;
}

async function loadProducts(){
  grid.innerHTML = `<div class="loading">Caricamento catalogo…</div>`;
  try{
    const r = await fetch(`${API_BASE}/products`, {cache:"no-store"});
    if(!r.ok) throw new Error("API non disponibile");
    const data = await r.json();
    products = Array.isArray(data.products) && data.products.length ? data.products : fallbackProducts;
  }catch(e){
    console.warn(e);
    products = fallbackProducts;
  }
  renderCategories();
  renderProducts();
}

document.addEventListener("click",e=>{
  const buy=e.target.closest("[data-buy]");
  if(buy){
    const p=products.find(x=>String(x.id)===String(buy.dataset.buy));
    if(p?.affiliateUrl){
      tg?.HapticFeedback?.impactOccurred("light");
      openAffiliate(p.affiliateUrl);
    }
  }
  const info=e.target.closest("[data-info]");
  if(info){
    const p=products.find(x=>String(x.id)===String(info.dataset.info));
    if(p) alert(`${p.title}\n\n${p.description || ""}`);
  }
  const scroll=e.target.closest("[data-scroll]");
  if(scroll) document.querySelector(scroll.dataset.scroll)?.scrollIntoView({behavior:"smooth"});
});

$("#searchInput").addEventListener("input",e=>{query=e.target.value.trim();renderProducts();});

function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
function escapeAttr(v){return escapeHtml(v).replaceAll('"',"&quot;")}

loadProducts();
