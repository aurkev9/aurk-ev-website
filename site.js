import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
document.getElementById("year").textContent = new Date().getFullYear();
if (!SUPABASE_URL.startsWith("PASTE_") && !SUPABASE_ANON_KEY.startsWith("PASTE_")) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data } = await supabase.from("site_images").select("*").order("created_at",{ascending:false});
  if (data?.length) {
    const hero = data.find(x=>x.slot==="hero");
    if (hero) document.getElementById("heroImage").src = hero.public_url;
    const products = data.filter(x=>x.slot==="product");
    if (products.length) document.getElementById("productGrid").innerHTML = products.map(x=>`<article class="product-card"><div class="product-image"><img src="${escapeAttr(x.public_url)}" alt="${escapeAttr(x.title)}"></div><div class="product-info"><h3>${escapeHtml(x.product_name || x.title)}</h3><p>Contact us for details and availability.</p></div></article>`).join("");
  }
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(s=""){return escapeHtml(s);}