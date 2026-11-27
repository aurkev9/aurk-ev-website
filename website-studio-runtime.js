import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
function normalize(value){if(Array.isArray(value))return {elements:value,sectionOrder:[]};return {elements:Array.isArray(value?.elements)?value.elements:[],sectionOrder:Array.isArray(value?.sectionOrder)?value.sectionOrder:[]};}
function applyStudioContent(raw){
 const content=normalize(raw);
 content.elements.forEach(item=>{
  let node;try{node=document.querySelector(item.selector);}catch{return;}
  if(!node)return;
  if(item.text!==undefined)node.textContent=item.text;
  if(item.href!==undefined&&node.tagName==="A")node.setAttribute("href",item.href);
  if(item.src!==undefined&&node.tagName==="IMG")node.setAttribute("src",item.src);
  if(item.color)node.style.color=item.color;
  if(item.background)node.style.backgroundColor=item.background;
  if(item.fontSize)node.style.fontSize=Number(item.fontSize)+"px";
  if(item.hidden)node.style.display="none";
 });
 const main=document.querySelector("main");
 if(main&&content.sectionOrder.length){
  const sections=[...main.children].filter(node=>node.tagName==="SECTION");\n  const ordered=content.sectionOrder.map(selector=>{try{return document.querySelector(selector);}catch{return null;}}).filter(node=>node&&node.parentElement===main);\n  sections.forEach(node=>{if(!ordered.includes(node))ordered.push(node);});\n  const slots=sections.map(node=>{const marker=document.createComment("studio-section-slot");main.insertBefore(marker,node);return marker;});\n  ordered.slice(0,slots.length).forEach((node,index)=>main.insertBefore(node,slots[index]));slots.forEach(marker=>marker.remove());
 }
}
(async()=>{
 try{
  const {data,error}=await supabase.from("site_studio_published").select("content").eq("id","homepage").maybeSingle();
  if(!error&&data?.content)applyStudioContent(data.content);
 }catch(error){console.warn("AUR-K website settings could not be loaded.",error);}
})();