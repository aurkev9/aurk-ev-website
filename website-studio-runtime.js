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
  content.sectionOrder.forEach(selector=>{let node;try{node=document.querySelector(selector);}catch{return;}if(node&&node.parentElement===main)main.append(node);});
 }
}
(async()=>{
 try{
  const {data,error}=await supabase.from("site_studio_published").select("content").eq("id","homepage").maybeSingle();
  if(!error&&data?.content)applyStudioContent(data.content);
 }catch(error){console.warn("AUR-K website settings could not be loaded.",error);}
})();