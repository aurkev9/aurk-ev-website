import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const params=new URLSearchParams(location.search);
const requestedSlug=params.get("page")||"home";
const previewPageId=params.get("pageId");
const studioPreview=params.get("studioPreview")==="1";
const main=document.getElementById("storefrontMain");
const footer=document.querySelector(".footer-v2");
function safeUrl(value){
 const raw=String(value||"").trim();if(!raw)return "";
 if(/^https?:\/\//i.test(raw)||/^mailto:/i.test(raw)||/^tel:/i.test(raw)||raw.startsWith("/")||raw.startsWith("#"))return raw;
 return "";
}
function applyPageSeo(page,isOwner=false){
 const title=(isOwner?page?.draft_meta_title:page?.meta_title)||((isOwner?page?.draft_title:page?.title)||"AUR-K EV | Electric Scooters in Faisalabad");
 const description=(isOwner?page?.draft_meta_description:page?.meta_description)||"Discover electric scooters at AUR-K EV Bike Experts in Faisalabad, Pakistan.";
 const keywords=(isOwner?page?.draft_meta_keywords:page?.meta_keywords)||"electric scooters Faisalabad, electric bikes Pakistan, AUR-K EV";
 const image=(isOwner?page?.draft_og_image_url:page?.og_image_url)||"https://tkfdsxmwrkucuhkjfouo.supabase.co/storage/v1/object/public/website-images/b86a4231-50a4-47ae-9273-598aab36d65d.jpeg";
 document.title=title;
 const setMeta=(key,value,isProperty=false)=>{let el=[...document.head.querySelectorAll("meta")].find(x=>x.getAttribute(isProperty?"property":"name")===key);if(!el){el=document.createElement("meta");el.setAttribute(isProperty?"property":"name",key);document.head.append(el);}el.content=value;};
 setMeta("description",description);setMeta("keywords",keywords);setMeta("og:title",title,true);setMeta("og:description",description,true);setMeta("og:image",image,true);setMeta("twitter:title",title);setMeta("twitter:description",description);setMeta("twitter:image",image);
 let canonical=document.querySelector("link[rel=canonical]");if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.append(canonical);}canonical.href=location.origin+(requestedSlug==="home"?"/":"/?page="+encodeURIComponent(requestedSlug));
}
function node(tag,className,text){
 const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=String(text);return el;
}
function youtubeId(value){
 const match=String(value||"").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);return match?match[1]:null;
}
function makeButton(label,url){
 const href=safeUrl(url);if(!label||!href)return null;
 const a=node("a","studio-section-button",label);a.href=href;return a;
}
async function productShowcase(section){
 const wrap=node("section","studio-custom-section studio-products");
 const inner=node("div","studio-section-inner");
 inner.append(node("p","studio-section-eyebrow","AUR-K EV COLLECTION"),node("h2","studio-section-heading",section.heading||"Explore our scooters"));
 if(section.body)inner.append(node("p","studio-section-body",section.body));
 const {data}=await supabase.from("site_products").select("id,name,price_text,description,image_url,featured").order("featured",{ascending:false}).limit(Math.max(1,Math.min(8,Number(section.product_limit)||4)));
 const grid=node("div","studio-product-grid");
 (data||[]).forEach(product=>{
  const card=node("a","studio-product-card");card.href="/?product="+encodeURIComponent(product.id);
  if(product.image_url){const img=node("img","");img.src=product.image_url;img.alt=product.name||"AUR-K EV scooter";img.loading="lazy";card.append(img);}
  const details=node("div","studio-product-card-copy");details.append(node("h3","",product.name||"Electric scooter"));
  if(product.price_text)details.append(node("p","",product.price_text));
  details.append(node("span","studio-product-link","Explore model ↗"));card.append(details);grid.append(card);
 });
 if(!data?.length)grid.append(node("p","studio-section-body","Our scooter collection is being updated. Please contact our showroom for current models."));
 inner.append(grid);wrap.append(inner);return wrap;
}
async function renderSection(section){
 if(section.type==="products")return productShowcase(section);
 const wrap=node("section","studio-custom-section studio-block-"+(section.type||"text"));
 if(section.type==="hero"||section.type==="promo"){
  const bg=section.background_color||"#171717";wrap.style.setProperty("--studio-section-bg",bg);
  const heroImage=safeUrl(section.image_url);if(/^https?:\/\//i.test(heroImage)){wrap.style.setProperty("--studio-section-image",'url("'+heroImage+'")');}
 }
 const inner=node("div","studio-section-inner");
 if(section.eyebrow)inner.append(node("p","studio-section-eyebrow",section.eyebrow));
 if(section.heading)inner.append(node("h2","studio-section-heading",section.heading));
 if(section.body)inner.append(node("p","studio-section-body",section.body));
 if(section.type==="image"&&/^https?:\/\//i.test(safeUrl(section.image_url))){
  const img=node("img","studio-section-image");img.src=safeUrl(section.image_url);img.alt=section.image_alt||section.heading||"AUR-K EV";img.loading="lazy";inner.append(img);
 }
 if(section.type==="video"&&section.video_url){
  const id=youtubeId(section.video_url);
  if(id){const box=node("div","studio-video-frame");const iframe=node("iframe");iframe.src="https://www.youtube-nocookie.com/embed/"+id;iframe.title=section.heading||"AUR-K EV video";iframe.loading="lazy";iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";iframe.allowFullscreen=true;box.append(iframe);inner.append(box);}
  else if(/^https?:\/\//i.test(section.video_url)){const video=node("video","studio-video-frame");video.controls=true;video.src=section.video_url;inner.append(video);}
 }
 if((section.type==="hero"||section.type==="promo")&&/^https?:\/\//i.test(safeUrl(section.image_url))&&!section.background_color){
  const img=node("img","studio-section-hero-image");img.src=safeUrl(section.image_url);img.alt=section.heading||"AUR-K EV";img.loading="lazy";inner.append(img);
 }
 const button=makeButton(section.button_text,section.button_url);if(button)inner.append(button);
 wrap.append(inner);return wrap;
}
async function renderSections(container,sections){
 if(!container)return;
 for(const section of sections||[]){const rendered=await renderSection(section);container.append(rendered);}
}
async function addNavigationPages(){
 const nav=document.getElementById("nav");if(!nav)return;
 const {data}=await supabase.from("site_studio_pages").select("slug,title,show_in_nav,nav_order").eq("status","published").eq("show_in_nav",true).neq("slug","home").order("nav_order",{ascending:true});
 (data||[]).forEach(page=>{
  const link=node("a","",page.title);link.href="/?page="+encodeURIComponent(page.slug);link.dataset.studioPageLink=page.slug;nav.append(link);
 });
 if(requestedSlug!=="home"){
  nav.querySelectorAll('a[href^="#"]').forEach(link=>{link.href="/"+link.getAttribute("href");});
 }
}
function applyVisualContent(raw){
 const content=raw&&typeof raw==="object"?raw:{};
 (Array.isArray(content.elements)?content.elements:[]).forEach(item=>{
  let target;try{target=document.querySelector(item.selector);}catch{return;}
  if(!target)return;
  if(item.text!==undefined)target.textContent=item.text;
  if(item.href!==undefined&&target.tagName==="A"){const url=safeUrl(item.href);if(url)target.setAttribute("href",url);}
  if(item.src!==undefined&&target.tagName==="IMG"&&/^https?:\/\//i.test(item.src))target.setAttribute("src",item.src);
  if(item.color)target.style.color=item.color;
  if(item.background)target.style.backgroundColor=item.background;
  if(item.fontSize)target.style.fontSize=Number(item.fontSize)+"px";
  if(item.hidden!==undefined)target.hidden=!!item.hidden;
 });
 const root=document.querySelector("#storefrontMain");
 if(root&&Array.isArray(content.sectionOrder)&&content.sectionOrder.length){
  const sections=[...root.children].filter(el=>el.tagName==="SECTION");
  const ordered=content.sectionOrder.map(selector=>{try{return document.querySelector(selector);}catch{return null;}}).filter(el=>el&&el.parentElement===root);
  sections.forEach(el=>{if(!ordered.includes(el))ordered.push(el);});
  const slots=sections.map(el=>{const marker=document.createComment("studio-section-slot");root.insertBefore(marker,el);return marker;});
  ordered.slice(0,slots.length).forEach((el,index)=>root.insertBefore(el,slots[index]));slots.forEach(marker=>marker.remove());
 }
}
async function main(){
 try{
  const {data:{session}}=await supabase.auth.getSession();
  let isOwner=false;
  if(studioPreview&&session){const {data:role}=await supabase.rpc("current_staff_role");isOwner=role==="owner";}
  const pageQuery=studioPreview&&isOwner&&previewPageId
   ?supabase.from("site_studio_page_drafts").select("*").eq("id",previewPageId)
   :supabase.from("site_studio_pages").select("id,slug,title,published_content,status,show_in_nav,nav_order,meta_description,meta_title,meta_keywords,og_image_url,published_at").eq("slug",requestedSlug);
  const {data:page,error}=await pageQuery.maybeSingle();
  if(error)console.warn("Website page lookup failed:",error.message);
  if(requestedSlug!=="home"){
   if(!page||(!isOwner&&page.status!=="published")){
    if(main)main.innerHTML="<section class='studio-page-not-found'><h1>Page not available</h1><p>This page may be unpublished or the address may be incorrect.</p><a href='/'>Return to AUR-K EV homepage</a></section>";
   }else{
    if(main)main.hidden=true;
    document.getElementById("productDetailPage")?.setAttribute("hidden","");
    const root=node("main","studio-custom-page");root.id="studioCustomPageRoot";
    applyPageSeo(page,isOwner);
    await renderSections(root,(isOwner?page.draft_content:page.published_content)?.sections||[]);
    if(footer)footer.before(root);else document.body.append(root);
   }
  }else{
   const content=isOwner?page?.draft_content:page?.published_content;
   if(page)applyPageSeo(page,isOwner);
   await renderSections(main,content?.sections||[]);
   if(isOwner){const {data:visual}=await supabase.from("site_studio_settings").select("draft_content").eq("id","homepage").maybeSingle();if(visual?.draft_content)applyVisualContent(visual.draft_content);}
   else {const {data:visual}=await supabase.from("site_studio_published").select("content").eq("id","homepage").maybeSingle();if(visual?.content)applyVisualContent(visual.content);}
  }
  await addNavigationPages();
 }catch(error){console.warn("AUR-K Website Studio content could not be loaded.",error);}
}
main();
