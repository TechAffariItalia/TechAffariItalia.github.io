const STORE_KEY = "products";
const ALLOWED_ORIGIN = "https://techaffariitalia.github.io";

const DEFAULT_PRODUCTS = [
  {
    id:"watch-default",
    title:"GUHUAVMI 2026 Smartwatch Sport",
    category:"Wearable",
    image:"assets/temu_smartwatch_guhuavmi.jpg",
    autoImage:"assets/temu_smartwatch_guhuavmi.jpg",
    imageFit:"contain",
    description:"Smartwatch da uomo per sport e attività all’aperto. Prezzo, disponibilità e condizioni sono aggiornati direttamente su Temu.",
    affiliateUrl:"https://share.temu.com/aNZyP0gZu8B",
    active:true,
    createdAt:"2026-09-26T00:00:00.000Z"
  },
  {
    id:"camera-default",
    title:"Videocamera digitale 66MP orientabile",
    category:"Fotocamere",
    image:"assets/temu_videocamera_66mp.jpg",
    autoImage:"assets/temu_videocamera_66mp.jpg",
    imageFit:"contain",
    description:"Videocamera compatta mostrata nella scheda Temu con indicazione 66MP e testa orientabile. Dettagli, prezzo e disponibilità vanno verificati direttamente su Temu.",
    affiliateUrl:"https://share.temu.com/yei2WWdVubB",
    active:true,
    createdAt:"2026-09-26T00:00:00.000Z"
  }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      if (!cors) return new Response(null,{status:403});
      return new Response(null,{status:204,headers:cors});
    }

    if (request.method === "GET" && url.pathname === "/") {
      return json({ok:true,service:"Tech Affari Italia Catalog API"},200,cors || {});
    }

    if (request.method === "GET" && url.pathname === "/products") {
      const products = await loadProducts(env);
      return json({ok:true,products:products.filter(p=>p.active!==false)},200,cors || {});
    }

    if (url.pathname.startsWith("/admin/")) {
      if (!cors) return json({ok:false,error:"Origin non autorizzata"},403,{});
      if (!isAdmin(request,env)) return json({ok:false,error:"Chiave amministratore non valida"},401,cors);

      if (request.method === "POST" && url.pathname === "/admin/import") {
        const body = await safeJson(request);
        const link = String(body?.link || "").trim();
        if (!isTemuUrl(link)) return json({ok:false,error:"Inserisci un link Temu valido"},400,cors);

        const imported = await importTemuProduct(link);
        const products = await loadProducts(env);

        const item = {
          id:`p_${Date.now().toString(36)}_${crypto.randomUUID().slice(0,8)}`,
          title:clean(imported.title || "Prodotto Temu",160),
          category:guessCategory(imported.title || ""),
          image:clean(imported.image || "",1500),
          autoImage:clean(imported.image || "",1500),
          imageFit:"contain",
          description:clean(imported.description || "Prezzo, disponibilità e condizioni sono aggiornati direttamente su Temu.",500),
          affiliateUrl:link,
          sourceUrl:imported.finalUrl || "",
          active:true,
          createdAt:new Date().toISOString()
        };

        products.unshift(item);
        await saveProducts(env,products);

        const warning = (!imported.title || !imported.image)
          ? "Temu non ha fornito tutti i metadati: controlla titolo e immagine nell'area Admin."
          : "";

        return json({ok:true,item,warning},201,cors);
      }

      if (request.method === "PUT" && url.pathname.startsWith("/admin/products/")) {
        const id=decodeURIComponent(url.pathname.split("/").pop());
        const body=await safeJson(request);
        const products=await loadProducts(env);
        const i=products.findIndex(p=>String(p.id)===id);
        if(i<0) return json({ok:false,error:"Prodotto non trovato"},404,cors);

        products[i]={
          ...products[i],
          title:clean(body.title,160) || products[i].title,
          category:clean(body.category,80) || "Altro",
          image:clean(body.image,2000),
          autoImage:clean(body.autoImage || products[i].autoImage || products[i].image,2000),
          imageFit:body.imageFit==="cover" ? "cover" : "contain",
          description:clean(body.description,500),
          affiliateUrl:isTemuUrl(body.affiliateUrl) ? body.affiliateUrl : products[i].affiliateUrl,
          active:body.active !== false,
          updatedAt:new Date().toISOString()
        };

        await saveProducts(env,products);
        return json({ok:true,item:products[i]},200,cors);
      }

      if (request.method === "DELETE" && url.pathname.startsWith("/admin/products/")) {
        const id=decodeURIComponent(url.pathname.split("/").pop());
        const products=await loadProducts(env);
        const next=products.filter(p=>String(p.id)!==id);
        if(next.length===products.length) return json({ok:false,error:"Prodotto non trovato"},404,cors);
        await saveProducts(env,next);
        return json({ok:true},200,cors);
      }
    }

    return json({ok:false,error:"Not found"},404,cors || {});
  }
};

function corsHeaders(request){
  const origin=request.headers.get("Origin");
  if(!origin) return {"Cache-Control":"no-store"};
  if(origin!==ALLOWED_ORIGIN) return null;
  return {
    "Access-Control-Allow-Origin":ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type,Authorization",
    "Vary":"Origin",
    "Cache-Control":"no-store"
  };
}

async function loadProducts(env){
  const saved=await env.CATALOG.get(STORE_KEY,{type:"json"});
  const base=Array.isArray(saved)?saved:[...DEFAULT_PRODUCTS];
  return base.map(p=>({
    ...p,
    autoImage:p.autoImage || p.image || "",
    imageFit:p.imageFit==="cover" ? "cover" : "contain"
  }));
}
async function saveProducts(env,products){
  await env.CATALOG.put(STORE_KEY,JSON.stringify(products));
}
function isAdmin(request,env){
  if(!env.ADMIN_KEY) return false;
  const h=request.headers.get("Authorization")||"";
  if(!h.startsWith("Bearer ")) return false;
  return safeEqual(h.slice(7),String(env.ADMIN_KEY));
}
function safeEqual(a,b){
  if(a.length!==b.length) return false;
  let r=0;for(let i=0;i<a.length;i++)r|=a.charCodeAt(i)^b.charCodeAt(i);return r===0;
}
async function safeJson(request){try{return await request.json()}catch{return null}}
function isTemuUrl(value){
  try{
    const u=new URL(String(value||""));
    return u.protocol==="https:" && (u.hostname==="temu.com" || u.hostname.endsWith(".temu.com"));
  }catch{return false}
}
function clean(v,max=300){return String(v??"").replace(/\u0000/g,"").trim().slice(0,max)}
function json(data,status,headers){return new Response(JSON.stringify(data),{status,headers:{...headers,"Content-Type":"application/json;charset=UTF-8"}})}

async function importTemuProduct(link){
  let response;
  try{
    response=await fetch(link,{
      redirect:"follow",
      headers:{
        "Accept":"text/html,application/xhtml+xml",
        "Accept-Language":"it-IT,it;q=0.9,en;q=0.7",
        "User-Agent":"Mozilla/5.0"
      }
    });
  }catch{
    return {title:"",image:"",description:"",finalUrl:link};
  }

  const finalUrl=response.url || link;
  let html="";
  try{html=await response.text()}catch{}

  let title = meta(html,"og:title") || metaName(html,"title") || htmlTitle(html);
  let image = meta(html,"og:image") || metaName(html,"twitter:image");
  let description = meta(html,"og:description") || metaName(html,"description");

  const ld=findProductJsonLd(html);
  if(ld){
    title = title || ld.name || "";
    description = description || ld.description || "";
    if(!image){
      if(Array.isArray(ld.image)) image=ld.image[0]||"";
      else if(typeof ld.image==="string") image=ld.image;
      else if(ld.image?.url) image=ld.image.url;
    }
  }

  return {
    title:decodeHtml(title),
    image:decodeHtml(image),
    description:decodeHtml(description),
    finalUrl
  };
}

function meta(html,property){
  const esc=property.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const r1=new RegExp(`<meta[^>]+property=["']${esc}["'][^>]+content=["']([^"']+)["'][^>]*>`,"i");
  const r2=new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${esc}["'][^>]*>`,"i");
  return (html.match(r1)||html.match(r2)||[])[1]||"";
}
function metaName(html,name){
  const esc=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const r1=new RegExp(`<meta[^>]+name=["']${esc}["'][^>]+content=["']([^"']+)["'][^>]*>`,"i");
  const r2=new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${esc}["'][^>]*>`,"i");
  return (html.match(r1)||html.match(r2)||[])[1]||"";
}
function htmlTitle(html){return (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||""}
function findProductJsonLd(html){
  const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=re.exec(html))){
    try{
      const data=JSON.parse(m[1]);
      const found=walkProduct(data);
      if(found) return found;
    }catch{}
  }
  return null;
}
function walkProduct(x){
  if(!x) return null;
  if(Array.isArray(x)){for(const v of x){const f=walkProduct(v);if(f)return f}return null}
  if(typeof x==="object"){
    if(x["@type"]==="Product" || (Array.isArray(x["@type"])&&x["@type"].includes("Product"))) return x;
    for(const v of Object.values(x)){const f=walkProduct(v);if(f)return f}
  }
  return null;
}
function decodeHtml(v){
  return String(v||"")
    .replaceAll("&amp;","&").replaceAll("&quot;",'"').replaceAll("&#39;","'")
    .replaceAll("&lt;","<").replaceAll("&gt;",">").trim();
}
function guessCategory(title){
  const t=String(title||"").toLowerCase();
  if(/smartwatch|watch|orologio/.test(t)) return "Wearable";
  if(/camera|videocamera|fotocamera|dash cam|action cam/.test(t)) return "Fotocamere";
  if(/auricol|cuff|speaker|bluetooth audio|microfono/.test(t)) return "Audio";
  if(/caric|usb|cavo|power bank|adattatore|supporto/.test(t)) return "Accessori";
  if(/lamp|smart home|wifi|sensore|presa smart|telecamera casa/.test(t)) return "Smart Home";
  return "Altro";
}
