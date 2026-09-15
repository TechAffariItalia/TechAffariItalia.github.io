const tg = window.Telegram?.WebApp;
const API_URL = "https://tech-affari-italia-api.marconeri70.workers.dev/order";

if (tg) {
  tg.ready();
  tg.expand();
  try {
    if (tg.themeParams?.bg_color) {
      document.documentElement.style.setProperty('--bg', tg.themeParams.bg_color);
    }
  } catch(e) {}
}

const products = [
  {id:1,name:"Smartwatch Active Pro",cat:"Wearable",price:39.90,old:59.90,img:"assets/smartwatch.svg",badge:"-33%",desc:"Display touch, notifiche, attività e autonomia estesa."},
  {id:2,name:"Auricolari Wireless AirPods Style",cat:"Audio",price:24.90,old:34.90,img:"assets/earbuds.svg",badge:"OFFERTA",desc:"Custodia di ricarica, microfono e controlli touch."},
  {id:3,name:"Caricatore Rapido USB-C 65W",cat:"Accessori",price:19.90,old:29.90,img:"assets/charger.svg",badge:"-10€",desc:"Ricarica rapida per smartphone, tablet e notebook compatibili."},
  {id:4,name:"Mini Camera Wi‑Fi Smart",cat:"Smart Home",price:29.90,old:44.90,img:"assets/camera.svg",badge:"TOP",desc:"Controllo da smartphone, visione notturna e rilevamento movimento."},
  {id:5,name:"Speaker Bluetooth Mini Bass",cat:"Audio",price:18.90,old:25.90,img:"assets/speaker.svg",badge:"-27%",desc:"Compatto, portatile, con suono pieno e connessione Bluetooth."},
  {id:6,name:"Smart Tracker Bluetooth",cat:"Accessori",price:12.90,old:19.90,img:"assets/tracker.svg",badge:"NOVITÀ",desc:"Per chiavi, borse e oggetti da ritrovare rapidamente."}
];

let activeCat = "Tutti";
let query = "";
let cart = JSON.parse(localStorage.getItem("tai_cart") || "{}");

const $ = s => document.querySelector(s);
const grid = $("#productGrid");
const fmt = n => new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n);

function renderProducts(){
  const list = products.filter(p =>
    (activeCat === "Tutti" || p.cat === activeCat) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  $("#productCount").textContent = `${list.length} prodotti`;
  grid.innerHTML = list.map(p => `
    <article class="product-card">
      <div class="product-media"><img src="${p.img}" alt="${p.name}"><span class="badge">${p.badge}</span></div>
      <div class="product-body">
        <small>${p.cat}</small><h3>${p.name}</h3>
        <div class="price-row"><span class="price">${fmt(p.price)}</span><span class="old">${fmt(p.old)}</span></div>
        <div class="card-actions"><button class="add-btn" data-add="${p.id}">Aggiungi</button><button class="info-btn" data-info="${p.id}">ⓘ</button></div>
      </div>
    </article>`).join("");
}

function saveCart(){
  localStorage.setItem("tai_cart", JSON.stringify(cart));
  renderCart();
}

function cartEntries(){
  return Object.entries(cart)
    .map(([id,qty]) => ({p:products.find(x => x.id === +id),qty}))
    .filter(x => x.p);
}

function renderCart(){
  const items = cartEntries();
  $("#cartCount").textContent = items.reduce((s,x) => s + x.qty,0);
  const subtotal = items.reduce((s,x) => s + x.p.price * x.qty,0);
  $("#subtotal").textContent = fmt(subtotal);
  $("#total").textContent = fmt(subtotal);
  $("#checkoutBtn").disabled = !items.length;
  $("#checkoutBtn").style.opacity = items.length ? "1" : ".45";

  $("#cartItems").innerHTML = items.length ? items.map(({p,qty}) => `
    <div class="cart-item">
      <img src="${p.img}" alt="">
      <div>
        <h4>${p.name}</h4>
        <div class="cart-line"><strong>${fmt(p.price)}</strong><button class="remove" data-remove="${p.id}">Rimuovi</button></div>
        <div class="cart-line"><div class="qty"><button data-dec="${p.id}">−</button><b>${qty}</b><button data-inc="${p.id}">+</button></div><strong>${fmt(p.price*qty)}</strong></div>
      </div>
    </div>`).join("") : `<div class="empty"><div style="font-size:42px">🛒</div><h3>Il carrello è vuoto</h3><p>Aggiungi qualche prodotto dal catalogo.</p></div>`;
}

function openCart(){
  $("#overlay").classList.remove("hidden");
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden","false");
}

function closeCart(){
  $("#overlay").classList.add("hidden");
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden","true");
}

function showInfo(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  alert(`${p.name}\n\n${p.desc}\n\nPrezzo: ${fmt(p.price)}\n\nProdotto dimostrativo: caratteristiche e disponibilità andranno sostituite con quelle reali del fornitore.`);
}

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if(add){
    const id = +add.dataset.add;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    tg?.HapticFeedback?.impactOccurred("light");
  }

  const inc = e.target.closest("[data-inc]");
  if(inc){
    const id = +inc.dataset.inc;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
  }

  const dec = e.target.closest("[data-dec]");
  if(dec){
    const id = +dec.dataset.dec;
    cart[id] = Math.max(0,(cart[id] || 0) - 1);
    if(!cart[id]) delete cart[id];
    saveCart();
  }

  const rem = e.target.closest("[data-remove]");
  if(rem){
    delete cart[+rem.dataset.remove];
    saveCart();
  }

  const info = e.target.closest("[data-info]");
  if(info) showInfo(+info.dataset.info);

  const scroll = e.target.closest("[data-scroll]");
  if(scroll) document.querySelector(scroll.dataset.scroll)?.scrollIntoView({behavior:"smooth"});
});

$("#cartBtn").addEventListener("click",openCart);
$("#closeCart").addEventListener("click",closeCart);
$("#overlay").addEventListener("click",closeCart);

$("#searchInput").addEventListener("input", e => {
  query = e.target.value;
  renderProducts();
});

document.querySelectorAll(".chip").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  activeCat = btn.dataset.cat;
  renderProducts();
}));

$("#checkoutBtn").addEventListener("click", () => {
  if(!cartEntries().length) return;
  closeCart();
  $("#checkoutModal").classList.remove("hidden");
  $("#checkoutForm").classList.remove("hidden");
  $("#orderSuccess").classList.add("hidden");
});

$("#closeCheckout").addEventListener("click", () => $("#checkoutModal").classList.add("hidden"));
$("#doneBtn").addEventListener("click", () => $("#checkoutModal").classList.add("hidden"));

$("#checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  if (!tg?.initData) {
    alert("Per inviare l’ordine apri il negozio dal bot Telegram Tech Affari Italia.");
    return;
  }

  const fd = Object.fromEntries(new FormData(form).entries());
  const items = cartEntries();

  if (!items.length) {
    alert("Il carrello è vuoto.");
    return;
  }

  const order = {
    initData: tg.initData,
    customer: fd,
    items: items.map(({p,qty}) => ({
      id: p.id,
      qty
    }))
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Invio ordine...";
  submitBtn.style.opacity = ".7";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });

    let result = {};
    try {
      result = await response.json();
    } catch (_) {}

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Impossibile inviare l’ordine");
    }

    $("#checkoutForm").classList.add("hidden");
    $("#orderSuccess").classList.remove("hidden");
    $("#successText").textContent =
      `Ordine ${result.orderId} inviato correttamente. Ti contatteremo per conferma e spedizione.`;

    cart = {};
    saveCart();
    form.reset();

    tg?.HapticFeedback?.notificationOccurred("success");

  } catch (err) {
    console.error(err);
    tg?.HapticFeedback?.notificationOccurred("error");
    alert(`Ordine non inviato: ${err.message}. Riprova tra poco.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    submitBtn.style.opacity = "1";
  }
});

renderProducts();
renderCart();
