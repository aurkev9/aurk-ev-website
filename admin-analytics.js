import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id);
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let initialized=false,events=[];
function localDate(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return y+"-"+m+"-"+day;}
function dateBounds(){const start=$("analyticsStart")?.value,end=$("analyticsEnd")?.value;return {start:start?new Date(start+"T00:00:00").toISOString():new Date(Date.now()-29*86400000).toISOString(),end:end?new Date(new Date(end+"T23:59:59.999").getTime()).toISOString():new Date().toISOString()};}
function count(type){return events.filter(e=>e.event_type===type).length;}
function renderKpis(){
 const sessions=new Set(events.map(e=>e.session_id)).size;
 const tiles=[["Page views",count("page_view")],["Visitor sessions",sessions],["Product views",count("product_view")],["WhatsApp clicks",count("whatsapp_click")],["Call clicks",count("call_click")],["Order requests",count("order_request")]];
 $("analyticsKpis").innerHTML=tiles.map(([label,value])=>'<article class="analytics-tile"><small>'+label+'</small><strong>'+Number(value).toLocaleString()+'</strong></article>').join("");
}
function renderBars(hostId,items,empty){
 const host=$(hostId);if(!items.length){host.innerHTML='<p class="analytics-empty">'+empty+'</p>';return;}
 const max=Math.max(1,...items.map(x=>x.value));
 host.innerHTML=items.map(x=>'<div class="analytics-bar-row"><div class="analytics-bar-label"><span>'+esc(x.label)+'</span><b>'+x.value+'</b></div><div class="analytics-bar-track"><i style="width:'+Math.max(2,Math.round(x.value/max*100))+'%"></i></div></div>').join("");
}
function render(){
 renderKpis();
 const productMap=new Map(),pageMap=new Map(),sourceMap=new Map(),dayMap=new Map(),deviceMap=new Map();
 events.forEach(e=>{
  if(e.event_type==="product_view"){const key=e.product_id||e.product_name||"Unknown";const item=productMap.get(key)||{label:e.product_name||"Product "+key,value:0};item.value++;productMap.set(key,item);}
  if(e.event_type==="page_view"){const key=e.page_path||"/";pageMap.set(key,(pageMap.get(key)||0)+1);const day=String(e.created_at).slice(0,10);dayMap.set(day,(dayMap.get(day)||0)+1);}
  if(e.event_type==="page_view"){const src=e.referrer_host||"Direct / unknown";sourceMap.set(src,(sourceMap.get(src)||0)+1);const device=e.device_type||"unknown";deviceMap.set(device,(deviceMap.get(device)||0)+1);}
 });
 renderBars("analyticsProducts",[...productMap.values()].sort((a,b)=>b.value-a.value).slice(0,8),"Product views will appear as customers explore scooter details.");
 renderBars("analyticsPages",[...pageMap].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,8),"Page views will appear here.");
 renderBars("analyticsSources",[...sourceMap].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,8),"Traffic sources will appear here.");
 renderBars("analyticsDevices",[...deviceMap].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value),"Device activity will appear here.");
 const days=[];const bounds=dateBounds();const start=new Date(bounds.start);const end=new Date(bounds.end);
 for(let d=new Date(start);d<=end&&days.length<31;d.setDate(d.getDate()+1)){const key=localDate(d);days.push({label:key.slice(5),value:dayMap.get(key)||0});}
 renderBars("analyticsDaily",days,"Daily traffic will appear here.");
 $("analyticsDataNote").textContent=events.length>=10000?"Showing the latest 10,000 events in this date range. Narrow the dates for a more complete report.":"Showing "+events.length.toLocaleString()+" recorded events. Tracking starts from the analytics installation date.";
}
async function loadAnalytics(){
 const status=$("analyticsStatus");status.textContent="Loading analytics…";
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){status.textContent="Sign in as the Owner to view analytics.";return;}
 const {data:role,error:roleError}=await supabase.rpc("current_staff_role");
 if(roleError||role!=="owner"){status.textContent="Analytics is available to the Owner only.";return;}
 const {start,end}=dateBounds();
 const {data,error}=await supabase.from("site_analytics_events").select("event_type,page_path,product_id,product_name,session_id,device_type,referrer_host,created_at").gte("created_at",start).lte("created_at",end).order("created_at",{ascending:false}).limit(10000);
 if(error){status.textContent="Could not load analytics: "+error.message;return;}
 events=data||[];render();status.textContent="Updated "+new Date().toLocaleTimeString();
}
function exportCsv(){
 if(!events.length){$("analyticsStatus").textContent="No analytics events to export for this date range.";return;}
 const cols=["created_at","event_type","page_path","product_name","product_id","device_type","referrer_host"];
 const quote=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
 const csv=[cols.join(","),...events.map(row=>cols.map(k=>quote(row[k])).join(","))].join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="aurk-ev-website-analytics-"+localDate(new Date())+".csv";a.click();URL.revokeObjectURL(url);
}
function init(){
 if(initialized)return;initialized=true;
 const today=new Date(),from=new Date();from.setDate(from.getDate()-29);
 $("analyticsStart").value=localDate(from);$("analyticsEnd").value=localDate(today);
 $("analyticsApply").addEventListener("click",loadAnalytics);
 $("analyticsRefresh").addEventListener("click",loadAnalytics);
 $("analyticsExport").addEventListener("click",exportCsv);
 document.querySelector('[data-view="analytics"]')?.addEventListener("click",loadAnalytics);
 loadAnalytics();
}
supabase.auth.onAuthStateChange((event,session)=>{queueMicrotask(()=>{if(session){if(!initialized)init();else loadAnalytics();}});});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
