const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const products = [
  {
    id: 1,
    name: "GUHUAVMI 2026 Smartwatch Sport",
    cat: "Wearable",
    img: "assets/temu_smartwatch_guhuavmi.jpg",
    badge: "TEMU AFFILIATE",
    desc: "Smartwatch da uomo per sport e attività all’aperto. Prezzo, disponibilità e condizioni sono aggiornati direttamente su Temu.",
    affiliateUrl: "https://share.temu.com/aNZyP0gZu8B"
  },
  {
    id: 2,
    name: "Videocamera digitale 66MP orientabile",
    cat: "Fotocamere",
    img: "assets/temu_videocamera_66mp.jpg",
    badge: "TEMU AFFILIATE",
    desc: "Videocamera compatta mostrata nella scheda Temu con indicazione 66MP e testa orientabile. Dettagli, prezzo e disponibilità vanno verificati direttamente su Temu.",
    affiliateUrl: "https://share.temu.com/yei2WWdVubB"
  }
];

let activeCat = "Tutti";
let query = "";
const $ = s => document.querySelector(s);
const grid = $("#productGrid");

function injectAffiliateStyles() {
  if (document.getElementById("affiliate-v2-styles")) return;
  const style = document.createElement("style");
  style.id = "affiliate-v2-styles";
  style.textContent = `
    .affiliate-disclosure{
      margin:0 0 14px;background:#fff8ef;border:1px solid #ffe0bd;
      border-radius:16px;padding:13px 14px;color:#6b4d2f;font-size:12px;line-height:1.45
    }
    .affiliate-disclosure strong{display:block;color:#9b4d00;margin-bottom:4px}
    .product-body .affiliate-desc{font-size:13px;line-height:1.45;color:#667085;margin:8px 0 0}
    .product-body .affiliate-price{font-size:13px;font-weight:900;color:#344054;margin-top:10px}
    .product-media{aspect-ratio:1/1;background:#fff}
    .product-media img{object-fit:cover}
    .add-btn[data-buy]{background:#ff6a00}
    @media (max-width:560px){
      .product-grid{grid-template-columns:1fr!important}
      .product-card{width:100%}
      .product-body{padding:16px}
      .product-body h3{font-size:20px;min-height:auto}
      .add-btn[data-buy]{font-size:15px;padding:14px 12px}
      .info-btn{padding:13px 15px}
    }
    @media (min-width:561px) and (max-width:900px){
      .product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
  `;
  document.head.appendChild(style);
}

function openAffiliate(url) {
  try {
    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }
  } catch(e) {
    console.warn(e);
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function prepareAffiliateUI() {
  injectAffiliateStyles();

  $("#cartBtn")?.classList.add("hidden");
  $("#cartDrawer")?.classList.add("hidden");
  $("#checkoutModal")?.classList.add("hidden");
  $("#overlay")?.classList.add("hidden");

  const heroTitle = document.querySelector(".hero h1");
  if (heroTitle) heroTitle.textContent = "Scopri. Confronta. Acquista su Temu.";

  const heroText = document.querySelector(".hero p");
  if (heroText) heroText.textContent =
    "Selezioniamo prodotti tecnologici interessanti e ti portiamo direttamente alla pagina ufficiale dell’offerta.";

  // Keep only the categories actually used by the affiliate catalog.
  const chips = document.querySelector(".chips");
  if (chips) {
    chips.innerHTML = `
      <button class="chip active" data-cat="Tutti">Tutti</button>
      <button class="chip" data-cat="Wearable">Wearable</button>
      <button class="chip" data-cat="Fotocamere">Fotocamere</button>
    `;
    bindChips();
  }

  const catalog = $("#catalog");
  if (catalog && !document.querySelector(".affiliate-disclosure")) {
    const note = document.createElement("div");
    note.className = "affiliate-disclosure";
    note.innerHTML =
      "<strong>ℹ️ Trasparenza</strong>" +
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
        <p class="affiliate-desc">${p.desc}</p>
        <div class="affiliate-price">Prezzo aggiornato su Temu</div>
        <div class="card-actions">
          <button class="add-btn" data-buy="${p.id}">🛒 Acquista su Temu</button>
          <button class="info-btn" data-info="${p.id}">ⓘ</button>
        </div>
      </div>
    </article>`).join("") :
    `<div class="empty"><h3>Nessun prodotto trovato</h3></div>`;
}

function bindChips() {
  document.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      activeCat = btn.dataset.cat;
      renderProducts();
    });
  });
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
    if (p) {
      alert(
        `${p.name}\n\n${p.desc}\n\nLink affiliato: Tech Affari Italia può ricevere una commissione se acquisti tramite questo collegamento, senza costi aggiuntivi per te.`
      );
    }
  }

  const scroll = e.target.closest("[data-scroll]");
  if (scroll) {
    document.querySelector(scroll.dataset.scroll)?.scrollIntoView({behavior:"smooth"});
  }
});

$("#searchInput")?.addEventListener("input", e => {
  query = e.target.value.trim();
  renderProducts();
});

prepareAffiliateUI();
renderProducts();
