import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const $=id=>document.getElementById(id);
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const frame=$("studioPreviewFrame"),status=$("studioStatus");
let draft={elements:[],sectionOrder:[]},selectedSelector="",selectedVersion=null,versions=[],selectedBaseline={};
const emptyDraft=()=>({elements:[],sectionOrder:[]});
function setStatus(message,error=false){if(status){status.textContent=message;status.classList.toggle("is-error",error);}}
function normalize(value){if(Array.isArray(value))return {elements:value,sectionOrder:[]};return {elements:Array.isArray(value?.elements)?value.elements:[],sectionOrder:Array.isArray(value?.sectionOrder)?value.sectionOrder:[]};}
function selectorFor(node){
 if(node.id)return "#"+CSS.escape(node.id);
 const parts=[];let el=node;
 while(el&&el!==document.body&&el.nodeType===1){
  if(el.id){parts.unshift("#"+CSS.escape(el.id));break;}
  const tag=el.tagName.toLowerCase(),siblings=[...el.parentElement.children].filter(x=>x.tagName===el.tagName),index=siblings.indexOf(el)+1;
  parts.unshift(tag+":nth-of-type("+index+")");el=el.parentElement;
 }
 if(!parts.length||!parts[0].startsWith("#"))parts.unshift("body");
 return parts.join(" > ");
}
function findItem(selector){return draft.elements.find(x=>x.selector===selector);}
function applyItem(doc,item){
 const node=doc.querySelector(item.selector);if(!node)return;
 if(item.text!==undefined)node.textContent=item.text;
 if(item.href!==undefined&&node.tagName==="A")node.setAttribute("href",item.href);
 if(item.src!==undefined&&node.tagName==="IMG")node.setAttribute("src",item.src);
 if(item.color)node.style.color=item.color;
 if(item.background)node.style.backgroundColor=item.background;
 if(item.fontSize)node.style.fontSize=item.fontSize+"px";
 if(item.hidden!==undefined)node.hidden=!!item.hidden;
}
function applyDraftToPreview(){
 try{const doc=frame.contentDocument;if(!doc?.body)return;draft.elements.forEach(item=>applyItem(doc,item));applyOrder(doc);if(selectedSelector)highlightSelected();}catch(e){setStatus("Preview could not be accessed. Refresh and try again.",true);}
}
function applyOrder(doc){
 const main=doc.querySelector("main");if(!main||!draft.sectionOrder.length)return;
 const sections=[...main.children].filter(node=>node.tagName==="SECTION");
 const ordered=draft.sectionOrder.map(selector=>doc.querySelector(selector)).filter(node=>node&&node.parentElement===main);
 sections.forEach(node=>{if(!ordered.includes(node))ordered.push(node);});
 const slots=sections.map(node=>{const marker=doc.createComment("studio-section-slot");main.insertBefore(marker,node);return marker;});
 ordered.slice(0,slots.length).forEach((node,index)=>main.insertBefore(node,slots[index]));slots.forEach(marker=>marker.remove());
}
function highlightSelected(){
 const doc=frame.contentDocument;if(!doc)return;
 doc.querySelectorAll("[data-studio-selected]").forEach(n=>n.removeAttribute("data-studio-selected"));
 const node=doc.querySelector(selectedSelector);if(node)node.setAttribute("data-studio-selected","true");
}
function attachPreviewEditor(){
 const doc=frame.contentDocument;if(!doc?.body)return;
 doc.querySelectorAll("style[data-studio-editor-style]").forEach(n=>n.remove());
 const style=doc.createElement("style");style.dataset.studioEditorStyle="true";style.textContent='[data-studio-selected="true"]{outline:3px solid #c9a45c!important;outline-offset:3px!important;cursor:crosshair!important} body{cursor:crosshair}';doc.head.append(style);
 doc.addEventListener("click",event=>{
  const node=event.target.closest("header,footer,nav,.announcement,.marquee-band,.hero,.why-v2,.contact-v2,h1,h2,h3,h4,p,a,button,img,small,span,b,strong,em,section,article");
  if(!node||!doc.body.contains(node)||node.closest("#orderModal,.cart-overlay,.product-detail-page"))return;
  event.preventDefault();event.stopPropagation();
  selectedSelector=selectorFor(node);populateControls(node);highlightSelected();
 },true);
 doc.addEventListener("dragstart",event=>{
  const section=event.target.closest("main > section[id]");if(!section)return;
  event.dataTransfer.setData("text/aurk-section",section.id);event.dataTransfer.effectAllowed="move";
 },true);
 doc.querySelectorAll("main > section[id]").forEach(section=>{
  section.draggable=true;section.addEventListener("dragover",e=>e.preventDefault());
  section.addEventListener("drop",e=>{
   e.preventDefault();const id=e.dataTransfer.getData("text/aurk-section"),moving=id&&doc.getElementById(id);
   if(!moving||moving===section)return;
   const rect=section.getBoundingClientRect();section.parentElement.insertBefore(moving,e.clientY<rect.top+rect.height/2?section:section.nextElementSibling);
   draft.sectionOrder=[...doc.querySelectorAll("main > section[id]")].map(n=>"#"+CSS.escape(n.id));
   setStatus("Section order changed in preview — save draft to keep it.");
  });
 });
 applyDraftToPreview();
}
function populateControls(node){
 $("studioSelectorLabel").value=selectedSelector;
 const tag=node.tagName;
 $("studioTextWrap").hidden=!["H1","H2","H3","H4","P","A","BUTTON","SMALL","SPAN","B","STRONG","EM"].includes(tag);
 $("studioLinkWrap").hidden=tag!=="A";$("studioImageWrap").hidden=tag!=="IMG";
 $("studioText").value=$("studioTextWrap").hidden?"":node.textContent.trim();
 $("studioHref").value=tag==="A"?(node.getAttribute("href")||""):"";
 $("studioImage").value=tag==="IMG"?(node.getAttribute("src")||""):"";
 selectedBaseline={color:toHex(getComputedStyle(node).color),background:toHex(getComputedStyle(node).backgroundColor),fontSize:parseFloat(getComputedStyle(node).fontSize)||""};
 $("studioColor").value=selectedBaseline.color||"#171717";
 $("studioBackground").value=selectedBaseline.background||"#ffffff";
 $("studioFontSize").value=selectedBaseline.fontSize||"";
 $("studioHidden").checked=getComputedStyle(node).display==="none";
 $("studioMoveUp").disabled=!node.matches("main > section[id]")||!node.previousElementSibling;
 $("studioMoveDown").disabled=!node.matches("main > section[id]")||!node.nextElementSibling;
}
function toHex(value){const match=String(value).match(/rgba?\(([^)]+)\)/);if(!match)return null;const parts=match[1].split(",").map(x=>x.trim());if(parts.length>3&&Number(parts[3])===0)return null;const nums=parts.slice(0,3).map(Number);return nums.length===3?"#"+nums.map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,"0")).join(""):null;}
function currentPatch(){
 const node=frame.contentDocument?.querySelector(selectedSelector);if(!node)return null;
 const tag=node.tagName,item={...(findItem(selectedSelector)||{}),selector:selectedSelector};
 if(!$("studioTextWrap").hidden)item.text=$("studioText").value;
 if(tag==="A")item.href=$("studioHref").value.trim();
 if(tag==="IMG")item.src=$("studioImage").value.trim();
 const color=$("studioColor").value,bg=$("studioBackground").value,size=$("studioFontSize").value;
 if(color!==selectedBaseline.color)item.color=color;if(bg!==selectedBaseline.background&&!(selectedBaseline.background===null&&bg==="#ffffff"))item.background=bg;if(size&&Number(size)>=8&&Number(size)<=120&&Number(size)!==Number(selectedBaseline.fontSize))item.fontSize=Number(size);
 item.hidden=$("studioHidden").checked;return item;
}
function applyCurrent(){
 if(!selectedSelector){setStatus("Select an element in the preview first.",true);return;}
 const item=currentPatch();if(!item)return;
 const index=draft.elements.findIndex(x=>x.selector===selectedSelector);
 if(index>=0)draft.elements[index]=item;else draft.elements.push(item);
 applyItem(frame.contentDocument,item);highlightSelected();setStatus("Preview updated. Save draft to keep these changes.");
}
function resetCurrent(){
 if(!selectedSelector)return;
 draft.elements=draft.elements.filter(x=>x.selector!==selectedSelector);
 selectedSelector="";frame.src="index.html?studioPreview=1&refresh="+Date.now();setStatus("Element reset in preview. Save draft to keep the reset.");
}
async function loadStudio(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){setStatus("Please sign in to the admin panel first.",true);return;}
 const {data:role,error:roleError}=await supabase.rpc("current_staff_role");
 if(roleError||role!=="owner"){setStatus("Website Studio is available to the Owner account only.",true);document.querySelector('[data-view="website-studio"]')?.remove();return;}
 const {data,error}=await supabase.from("site_studio_settings").select("*").eq("id","homepage").maybeSingle();
 if(error){setStatus("Studio database setup issue: "+error.message,true);return;}
 draft=normalize(data?.draft_content||emptyDraft());
 $("studioLastPublished").textContent="Published version: "+(data?.published_at?new Date(data.published_at).toLocaleString():"Not published yet");
 setStatus(data?.updated_at?"Draft loaded. Select an element in the preview to begin.":"Ready. Your first draft has not been saved yet.");
 await loadVersions();if(frame.contentDocument?.readyState==="complete")attachPreviewEditor();
}
async function saveDraft(publish=false){
 const button=publish?$("studioPublish"):$("studioSaveDraft");button.disabled=true;setStatus(publish?"Publishing website changes…":"Saving draft…");
 const user=(await supabase.auth.getUser()).data.user;
 const payload={id:"homepage",draft_content:draft,updated_at:new Date().toISOString(),updated_by:user?.id};
 if(publish)payload.published_at=new Date().toISOString();
 const {error:saveError}=await supabase.from("site_studio_settings").upsert(payload,{onConflict:"id"});
 if(saveError){button.disabled=false;setStatus("Could not save draft: "+saveError.message,true);return;}
 if(publish){
  const {error:publishError}=await supabase.from("site_studio_published").upsert({id:"homepage",content:draft,published_at:payload.published_at,published_by:user?.id},{onConflict:"id"});
  if(publishError){button.disabled=false;setStatus("Draft saved, but publishing failed: "+publishError.message,true);return;}
 }
 await supabase.from("site_studio_versions").insert({version_label:(publish?"Published":"Draft saved")+" — "+new Date().toLocaleString(),content:draft,created_by:user?.id});
 button.disabled=false;
 if(publish){$("studioLastPublished").textContent="Published version: "+new Date(payload.published_at).toLocaleString();setStatus("Published successfully. Your changes are now live.");}
 else setStatus("Draft saved. Visitors will not see it until you publish.");
 await loadVersions();
}
async function loadVersions(){
 const host=$("studioVersions");if(!host)return;
 const {data,error}=await supabase.from("site_studio_versions").select("id,version_label,created_at,content").order("created_at",{ascending:false}).limit(12);
 if(error){host.textContent="Version history unavailable: "+error.message;return;}
 versions=data||[];host.innerHTML="";
 if(!versions.length){host.textContent="No saved versions yet.";return;}
 versions.forEach(v=>{const label=document.createElement("label");label.className="studio-version-option";const radio=document.createElement("input");radio.type="radio";radio.name="studioVersion";radio.value=v.id;radio.addEventListener("change",()=>{selectedVersion=v; $("studioRestoreVersion").disabled=false;});const text=document.createElement("span");text.textContent=v.version_label;label.append(radio,text);host.append(label);});
}
$("studioApply")?.addEventListener("click",applyCurrent);
$("studioResetElement")?.addEventListener("click",resetCurrent);
$("studioSaveDraft")?.addEventListener("click",()=>saveDraft(false));
$("studioPublish")?.addEventListener("click",()=>{if(confirm("Publish the current Website Studio draft to the live AUR-K EV website?"))saveDraft(true);});
$("studioRefreshPreview")?.addEventListener("click",()=>{frame.src="index.html?studioPreview=1&refresh="+Date.now();});
$("studioRestoreVersion")?.addEventListener("click",()=>{if(!selectedVersion)return;draft=normalize(selectedVersion.content);selectedSelector="";frame.src="index.html?studioPreview=1&refresh="+Date.now();setStatus("Version restored into the editor. Save draft to keep it.");});
$("studioMoveUp")?.addEventListener("click",()=>moveSection(-1));
$("studioMoveDown")?.addEventListener("click",()=>moveSection(1));
function moveSection(direction){
 const doc=frame.contentDocument,node=doc?.querySelector(selectedSelector);if(!node||!node.matches("main > section[id]"))return;
 const sibling=direction<0?node.previousElementSibling:node.nextElementSibling;if(!sibling)return;
 if(direction<0)node.parentElement.insertBefore(node,sibling);else node.parentElement.insertBefore(sibling,node);
 draft.sectionOrder=[...doc.querySelectorAll("main > section[id]")].map(n=>"#"+CSS.escape(n.id));populateControls(node);setStatus("Section order changed. Save draft to keep it.");
}
document.querySelectorAll(".studio-device").forEach(button=>button.addEventListener("click",()=>{
 document.querySelectorAll(".studio-device").forEach(b=>b.classList.toggle("active",b===button));
 $("studioFrameWrap").dataset.device=button.dataset.device;
}));
frame?.addEventListener("load",()=>{attachPreviewEditor();});
document.querySelector('[data-view="website-studio"]')?.addEventListener("click",()=>loadStudio());
loadStudio();
