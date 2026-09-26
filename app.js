const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const products = [{
  id: 1,
  name: "GUHUAVMI 2026 Smartwatch Sport",
  cat: "Wearable",
  img: "assets/smartwatch.svg",
  badge: "TEMU AFFILIATE",
  desc: "Smartwatch da uomo per sport e attività all’aperto. Prezzo, disponibilità e condizioni sono aggiornati direttamente su Temu.",
  affiliateUrl: "https://share.temu.com/aNZyP0gZu8B"
}];

let activeCat = "Tutti";
let query = "";
const $ = s => document.querySelector(s);
const grid = $("#productGrid");

function openAffiliate(url) {
  try {
    if (tg?.openLink) return tg.openLink(url);
  } catch(e) {}
  window.open(url, "_blank", "noopener,noreferrer");
}

function prepareAffiliateUI() {
  $("#cartBtn")?.classList.add("hidden");
  $("#cartDrawer")?.classList.add("hidden");
  $("#checkoutModal")?.classList.add("hidden");
  $("#overlay")?.classList.add("hidden");

  const brandSub = document.querySelector(".brand span");
  if (brandSub) brandSub.textContent = "Offerte tech selezionate";

  const heroTitle = document.querySelector(".hero h1");
  if (heroTitle) heroTitle.textContent = "Scopri. Confronta. Acquista su Temu.";

  const heroText = document.querySelector(".hero p");
  if (heroText) heroText.textContent =
    "Selezioniamo prodotti tecnologici interessanti e ti portiamo direttamente alla pagina ufficiale dell’offerta.";

  const catalog = $("#catalog");
  if (catalog && !document.querySelector(".affiliate-disclosure")) {
    const note = document.createElement("div");
    note.className = "affiliate-disclosure";
    note.style.cssText =
      "margin:0 0 14px;background:#fff8ef;border:1px solid #ffe0bd;border-radius:16px;padding:13px 14px;color:#6b4d2f;font-size:12px;line-height:1.45";
    note.innerHTML =
      "<strong style='display:block;color:#9b4d00;margin-bottom:4px'>ℹ️ Trasparenza</strong>" +
      "Alcuni link sono affiliati: se acquisti tramite questi collegamenti, Tech Affari Italia può ricevere una commissione senza costi aggiuntivi per te.";
    catalog.prepend(note);
  }

  const benefits = document.querySelector(".benefits");
  if (benefits) {
    benefits.innerHTML = `
      <article><b>🛒</b><strong>Acquisto su Temu</strong><span>Il checkout avviene direttamente sulla piattaforma Temu.</span></article>
      <article><b>📦</b><strong>Spedizione e resi</strong><span>Tempi, costi e condizioni sono quelli indicati da Temu.</span></article>
      <article><b>🔎</b><strong>Prezzi aggiornati</strong><span>Prezzo e disponibilità vanno verificati sulla pagina Temu.</span></article>`;
  }

  const footerText = document.querySelector("footer p span");
  if (footerText) footerText.textContent = "Vetrina affiliata di offerte tecnologiche.";

  const footerSmall = document.querySelector("footer small");
  if (footerSmall) footerSmall.textContent =
    "Tech Affari Italia non gestisce direttamente pagamento, spedizione o resi dei prodotti acquistati tramite Temu.";
}

function renderProducts() {
  const list = products.filter(p =>
    (activeCat === "Tutti" || p.cat === activeCat) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  $("#productCount").textContent =
    `${list.length} ${list.length === 1 ? "prodotto" : "prodotti"}`;

  grid.innerHTML = list.length ? list.map(p => `
    <article class="product-card">
      <div class="product-media">
        <img src="${p.img}" alt="${p.name}">
        <span class="badge">${p.badge}</span>
      </div>
      <div class="product-body">
        <small>${p.cat}</small>
        <h3>${p.name}</h3>
        <p style="font-size:12px;line-height:1.4;color:#667085">${p.desc}</p>
        <div style="font-size:13px;font-weight:800;margin-top:8px">Prezzo aggiornato su Temu</div>
        <div class="card-actions">
          <button class="add-btn" data-buy="${p.id}" style="background:#ff6a00">🛒 Acquista su Temu</button>
          <button class="info-btn" data-info="${p.id}">ⓘ</button>
        </div>
      </div>
    </article>`).join("") :
    `<div class="empty"><h3>Nessun prodotto trovato</h3></div>`;
}

document.addEventListener("click", e => {
  const buy = e.target.closest("[data-buy]");
  if (buy) {
    const p = products.find(x => x.id === +buy.dataset.buy);
    if (p) {
      tg?.HapticFeedback?.impactOccurred("light");
      openAffiliate(p.affiliateUrl);
    }
  }

  const info = e.target.closest("[data-info]");
  if (info) {
    const p = products.find(x => x.id === +info.dataset.info);
    if (p) alert(
      `${p.name}\n\n${p.desc}\n\nLink affiliato: Tech Affari Italia può ricevere una commissione se acquisti tramite questo collegamento, senza costi aggiuntivi per te.`
    );
  }

  const scroll = e.target.closest("[data-scroll]");
  if (scroll) document.querySelector(scroll.dataset.scroll)?.scrollIntoView({behavior:"smooth"});
});

$("#searchInput")?.addEventListener("input", e => {
  query = e.target.value.trim();
  renderProducts();
});

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    renderProducts();
  });
});

prepareAffiliateUI();
renderProducts();
