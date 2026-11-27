import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const sessionKey="aurk_analytics_session";
let sessionId;
try{
 sessionId=sessionStorage.getItem(sessionKey);
 if(!sessionId){sessionId=crypto.randomUUID();sessionStorage.setItem(sessionKey,sessionId);}
}catch{sessionId=crypto.randomUUID();}
const device=/tablet|ipad/i.test(navigator.userAgent)?"tablet":/mobile|android|iphone/i.test(navigator.userAgent)?"mobile":"desktop";
const host=(()=>{try{return document.referrer?new URL(document.referrer).hostname:null;}catch{return null;}})();
const pagePath=()=>{const params=new URLSearchParams(location.search),safe=new URLSearchParams();["page","product"].forEach(k=>{if(params.has(k))safe.set(k,params.get(k).slice(0,100));});return location.pathname+(safe.size?"?"+safe.toString():"")+location.hash.slice(0,80);};
const tracked=new Set();
async function record(eventType,extra={}){
 const key=eventType+"|"+(extra.product_id||"")+"|"+pagePath();
 if(eventType==="page_view"&&tracked.has(key))return;
 tracked.add(key);
 const row={event_type:eventType,page_path:pagePath().slice(0,500),session_id:sessionId,device_type:device,referrer_host:host,...extra};
 try{const {error}=await supabase.from("site_analytics_events").insert(row);if(error)console.debug("AUR-K analytics event skipped",error.message);}catch(error){console.debug("AUR-K analytics event skipped",error);}
}
function productFromUrl(){
 const params=new URLSearchParams(location.search);
 const id=params.get("product");
 if(!id)return null;
 const name=document.querySelector(".detail-title,h1.product-title,[data-product-name]")?.textContent?.trim()||null;
 return {product_id:id.slice(0,100),product_name:name?.slice(0,160)||null};
}
function pageEvent(){
 record("page_view");
 const product=productFromUrl();
 if(product)record("product_view",product);
}
pageEvent();
window.addEventListener("hashchange",()=>record("page_view"));
window.addEventListener("popstate",pageEvent);
document.addEventListener("click",event=>{
 const target=event.target.closest("a,button");
 if(!target)return;
 const href=target.getAttribute("href")||"";
 const label=(target.getAttribute("aria-label")||target.textContent||"").trim().toLowerCase();
 if(href.startsWith("https://wa.me/")||href.includes("api.whatsapp.com"))record("whatsapp_click");
 else if(href.startsWith("tel:"))record("call_click");
 else if(/compare/.test(href)||/compare/.test(label))record("compare_click");
 else if(/order|checkout|enquiry|enquire|whatsapp/.test(label))record("enquiry_click");
});
document.getElementById("customerOrderForm")?.addEventListener("submit",()=>{
 const product=productFromUrl();
 record("order_request",product||{});
});
