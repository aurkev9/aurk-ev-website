import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const $=id=>document.getElementById(id);
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const frame=$("studioPreviewFrame"),status=$("studioStatus");
let draft={elements:[],sectionOrder:[],decorations:[]},selectedSelector="",selectedVersion=null,versions=[],selectedBaseline={},selectedDecorationId="";
const emptyDraft=()=>({elements:[],sectionOrder:[],decorations:[]});
function setStatus(message,error=false){if(status){status.textContent=message;status.classList.toggle("is-error",error);}}
function normalize(value){if(Array.isArray(value))return {elements:value,sectionOrder:[],theme:{}};return {elements:Array.isArray(value?.elements)?value.elements:[],sectionOrder:Array.isArray(value?.sectionOrder)?value.sectionOrder:[],theme:value?.theme&&typeof value.theme==="object"?value.theme:{},decorations:Array.isArray(value?.decorations)?value.decorations:[]};}
function selectorFor(node){
 if(node.id)return "#"+CSS.escape(node.id);
 const parts=[];let el=node;
 while(el&&el!==node.ownerDocument.body&&el.nodeType===1){
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
 if(item.href!==undefined&&node.tagName==="A"){if(item.href.trim())node.setAttribute("href",item.href);else node.removeAttribute("href");}
 if(item.src!==undefined&&node.tagName==="IMG")node.setAttribute("src",item.src);
 if(item.alt!==undefined&&node.tagName==="IMG")node.setAttribute("alt",item.alt);
 if(item.color!==undefined)node.style.color=item.color;
 if(item.background!==undefined)node.style.backgroundColor=item.background;
 if(item.fontSize!==undefined)node.style.fontSize=item.fontSize+"px";
 if(item.fontFamily!==undefined)node.style.fontFamily='"'+String(item.fontFamily).replace(/["\\]/g,"")+'", sans-serif';
 if(item.fontWeight!==undefined)node.style.fontWeight=item.fontWeight;
 if(item.fontStyle!==undefined)node.style.fontStyle=item.fontStyle;
 if(item.textDecoration!==undefined)node.style.textDecoration=item.textDecoration;
 if(item.textAlign!==undefined)node.style.textAlign=item.textAlign;
 if(item.letterSpacing!==undefined)node.style.letterSpacing=item.letterSpacing+"px";
 if(item.lineHeight!==undefined)node.style.lineHeight=String(item.lineHeight);
 if(item.borderColor!==undefined)node.style.borderColor=item.borderColor;
 if(item.borderWidth!==undefined)node.style.borderWidth=item.borderWidth+"px";
 if(item.width!==undefined)node.style.width=item.width+"px";
 if(item.height!==undefined)node.style.height=item.height+"px";
 if(item.maxWidth!==undefined)node.style.maxWidth=item.maxWidth+"px";
 if(item.padding!==undefined)node.style.padding=item.padding+"px";
 if(item.radius!==undefined)node.style.borderRadius=item.radius+"px";
 if(item.opacity!==undefined)node.style.opacity=String(item.opacity);
 if(item.backgroundImage!==undefined)node.style.backgroundImage=item.backgroundImage?"url("+JSON.stringify(item.backgroundImage)+")":"none";
 if(item.backgroundSize!==undefined)node.style.backgroundSize=item.backgroundSize;
 if(item.backgroundPosition!==undefined)node.style.backgroundPosition=item.backgroundPosition;
 if(item.objectFit!==undefined&&node.tagName==="IMG")node.style.objectFit=item.objectFit;
 if(item.fontUrl)ensureCustomFont(doc,item.fontFamily,item.fontUrl);else if(item.fontFamily)ensureGoogleFont(doc,item.fontFamily);
 if(item.translateX!==undefined||item.translateY!==undefined)node.style.translate=(Number(item.translateX)||0)+"px "+(Number(item.translateY)||0)+"px";
 if(item.hidden!==undefined)node.hidden=!!item.hidden;
}
function ensureGoogleFont(doc,family){if(!doc||!family||/^(Arial|Georgia|Verdana|Tahoma|Trebuchet MS|Times New Roman|Courier New)$/i.test(family))return;const id="studio-google-font-"+String(family).toLowerCase().replace(/[^a-z0-9]+/g,"-");if(doc.getElementById(id))return;const link=doc.createElement("link");link.id=id;link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(family).replace(/%20/g,"+")+"&display=swap";doc.head.append(link);}
function ensureCustomFont(doc,family,url){if(!doc||!family||!url)return;const id="studio-font-"+String(family).toLowerCase().replace(/[^a-z0-9]+/g,"-");if(doc.getElementById(id))return;const style=doc.createElement("style");style.id=id;style.textContent='@font-face{font-family:"'+String(family).replace(/["\\]/g,"")+'";src:url("'+String(url).replace(/["\\]/g,"")+'");font-display:swap}';doc.head.append(style);}
function themePatternImage(theme){const gold=theme.gold||"#c9a45c",strength=Math.max(4,Math.min(32,Number(theme.patternOpacity??14))),soft="color-mix(in srgb, "+gold+" "+strength+"%, transparent)";switch(theme.pattern||"none"){case "dots":return "radial-gradient(circle, "+soft+" 1.25px, transparent 1.6px)";case "grid":return "linear-gradient("+soft+" 1px, transparent 1px),linear-gradient(90deg, "+soft+" 1px, transparent 1px)";case "diagonal":return "repeating-linear-gradient(135deg, transparent 0 17px, "+soft+" 18px 19px, transparent 20px 37px)";case "circles":return "radial-gradient(circle at 12% 18%, "+soft+" 0 75px, transparent 77px),radial-gradient(circle at 88% 72%, "+soft+" 0 105px, transparent 107px)";case "diamonds":return "repeating-linear-gradient(45deg, transparent 0 17px, "+soft+" 18px 19px, transparent 20px 36px),repeating-linear-gradient(-45deg, transparent 0 17px, "+soft+" 18px 19px, transparent 20px 36px)";case "waves":return "radial-gradient(ellipse at 50% 0%, transparent 0 28px, "+soft+" 29px 30px, transparent 31px 48px, "+soft+" 49px 50px, transparent 51px 70px)";default:return "none";}}
function applyThemeToPreview(){const doc=frame.contentDocument;if(!doc)return;const theme=draft.theme||{};if(theme.gold)doc.documentElement.style.setProperty("--gold",theme.gold);if(theme.paper)doc.documentElement.style.setProperty("--paper",theme.paper);if(theme.ink)doc.documentElement.style.setProperty("--ink",theme.ink);doc.body.style.backgroundImage=themePatternImage(theme);doc.body.style.backgroundSize=theme.pattern==="dots"?"24px 24px":theme.pattern==="grid"?"36px 36px":theme.pattern==="waves"?"180px 120px":"auto";doc.body.style.backgroundAttachment="fixed";}
function applyDraftToPreview(){
 try{const doc=frame.contentDocument;if(!doc?.body)return;draft.elements.forEach(item=>applyItem(doc,item));applyOrder(doc);applyThemeToPreview();renderStudioDecorations(doc);if(selectedSelector)highlightSelected();}catch(e){setStatus("Preview could not be accessed. Refresh and try again.",true);}
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

function decorationStyle(item){
 const style={position:"absolute",left:(Number(item.x)||0)+"px",top:(Number(item.y)||0)+"px",width:Math.max(1,Number(item.width)||120)+"px",height:Math.max(1,Number(item.height)||60)+"px",background:item.type==="line"?"transparent":(item.fill||"#c9a45c"),border:item.type==="line"?"0":((Number(item.borderWidth)||0)+"px solid "+(item.borderColor||"#111111")),borderRadius:item.type==="circle"?"50%":(item.type==="pill"?"999px":(Number(item.radius)||0)+"px"),opacity:String(Math.max(0,Math.min(1,Number(item.opacity??1)))),zIndex:String(item.zIndex||2),pointerEvents:"auto"};
 if(item.type==="line"){style.height="0px";style.borderTop=(Number(item.borderWidth)||3)+"px solid "+(item.borderColor||item.fill||"#c9a45c");}
 if(item.type==="triangle")style.clipPath="polygon(50% 0, 0 100%, 100% 100%)";
 if(item.type==="diamond")style.clipPath="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)";
 return style;
}
function renderStudioDecorations(doc){
 if(!doc?.body)return;
 doc.querySelectorAll("[data-studio-decoration-id]").forEach(el=>el.remove());
 (draft.decorations||[]).forEach(item=>{
  let anchor;try{anchor=doc.querySelector(item.anchor);}catch{return;}if(!anchor)return;
  if(doc.defaultView.getComputedStyle(anchor).position==="static")anchor.style.position="relative";
  const shape=doc.createElement("div");shape.dataset.studioDecorationId=item.id;
  Object.assign(shape.style,decorationStyle(item),{boxSizing:"border-box",cursor:"move",touchAction:"none"});
  if(selectedDecorationId===item.id){
   shape.style.outline="2px dashed #171717";
   const handle=doc.createElement("span");handle.dataset.studioResizeHandle="true";
   Object.assign(handle.style,{position:"absolute",right:"-7px",bottom:"-7px",width:"14px",height:"14px",background:"#fff",border:"2px solid #171717",borderRadius:"3px",cursor:"nwse-resize",zIndex:"99999",touchAction:"none"});
   shape.append(handle);
  }
  anchor.append(shape);
 });
}
function highlightDecoration(){renderStudioDecorations(frame.contentDocument);}
function populateDecorationControls(item){
 if(!item)return;
 $("studioSelectorLabel").value="Custom "+item.type+" — "+item.anchor;
 $("studioTextWrap").hidden=true;$("studioLinkWrap").hidden=true;$("studioImageWrap").hidden=true;
 $("studioDecorationType").value=item.type;$("studioDecorationX").value=item.x??20;$("studioDecorationY").value=item.y??20;
 $("studioDecorationWidth").value=item.width??120;$("studioDecorationHeight").value=item.height??60;
 $("studioDecorationFill").value=item.fill||"#c9a45c";$("studioDecorationBorder").value=item.borderColor||"#111111";
 $("studioDecorationBorderWidth").value=item.borderWidth??0;$("studioDecorationRadius").value=item.radius??0;
 $("studioDecorationOpacity").value=item.opacity??1;$("studioDecorationOpacityValue").textContent=Math.round((item.opacity??1)*100)+"%";
 $("studioDecorationControls").hidden=false;$("studioElementControls").hidden=true;
}
async function addStudioDecoration(type){
 if(!selectedSelector){setStatus("First click the image or section in the preview, then choose a shape.",true);return;}
 const doc=frame.contentDocument,selected=doc?.querySelector(selectedSelector);
 if(!selected){setStatus("Select the image or section again.",true);return;}
 const anchor=selected.tagName==="IMG"?(selected.parentElement||selected):(selected.matches("section,header,footer,main,nav,article,div")?selected:(selected.closest("section,header,footer,main,nav,article")||selected.parentElement));
 if(!anchor){setStatus("Select an image or visible section first.",true);return;}
 const item={id:"shape-"+crypto.randomUUID(),type,anchor:selectorFor(anchor),x:24,y:24,width:type==="line"?180:120,height:type==="line"?0:70,fill:"#c9a45c",borderColor:"#171717",borderWidth:type==="line"?3:0,radius:10,opacity:1,zIndex:20};
 draft.decorations.push(item);selectedDecorationId=item.id;selectedSelector="";
 renderStudioDecorations(doc);populateDecorationControls(item);setStatus("Shape added over the selected image/section. Saving…");await saveDraft(false);
}
function updateStudioDecoration(){
 const item=draft.decorations.find(x=>x.id===selectedDecorationId);if(!item)return;
 item.type=$("studioDecorationType").value;item.x=Number($("studioDecorationX").value)||0;item.y=Number($("studioDecorationY").value)||0;
 item.width=Math.max(1,Number($("studioDecorationWidth").value)||120);item.height=item.type==="line"?0:Math.max(1,Number($("studioDecorationHeight").value)||60);
 item.fill=$("studioDecorationFill").value;item.borderColor=$("studioDecorationBorder").value;item.borderWidth=Math.max(0,Number($("studioDecorationBorderWidth").value)||0);
 item.radius=Math.max(0,Number($("studioDecorationRadius").value)||0);item.opacity=Number($("studioDecorationOpacity").value);
 renderStudioDecorations(frame.contentDocument);highlightDecoration();
}
function deleteStudioDecoration(){if(!selectedDecorationId)return;draft.decorations=draft.decorations.filter(x=>x.id!==selectedDecorationId);selectedDecorationId="";$("studioDecorationControls").hidden=true;$("studioElementControls").hidden=false;renderStudioDecorations(frame.contentDocument);setStatus("Shape removed from preview. Save draft to keep this change.");}

function installStudioClickShield(){
 const wrap=$("studioFrameWrap");if(!wrap||wrap.querySelector("#studioClickShield"))return;
 const shield=document.createElement("div");shield.id="studioClickShield";shield.setAttribute("aria-label","Visual editing canvas");
 Object.assign(shield.style,{position:"absolute",zIndex:"50",background:"transparent",cursor:"crosshair",touchAction:"none",userSelect:"none"});
 wrap.style.position="relative";wrap.append(shield);
 const outline=document.createElement("div");outline.id="studioSelectionOutline";
 Object.assign(outline.style,{position:"absolute",display:"none",border:"2px solid #c9a45c",boxShadow:"0 0 0 1px #17171755",pointerEvents:"none",boxSizing:"border-box",zIndex:"2"});
 shield.append(outline);
 const handles={};
 ["nw","n","ne","e","se","s","sw","w"].forEach(name=>{
  const h=document.createElement("div");h.dataset.studioHandle=name;
  Object.assign(h.style,{position:"absolute",width:"10px",height:"10px",background:"#fff",border:"2px solid #b58d45",borderRadius:"2px",boxSizing:"border-box",display:"none",zIndex:"3",pointerEvents:"auto",touchAction:"none"});
  const pos={nw:{left:"-6px",top:"-6px",cursor:"nwse-resize"},n:{left:"calc(50% - 5px)",top:"-6px",cursor:"ns-resize"},ne:{right:"-6px",top:"-6px",cursor:"nesw-resize"},e:{right:"-6px",top:"calc(50% - 5px)",cursor:"ew-resize"},se:{right:"-6px",bottom:"-6px",cursor:"nwse-resize"},s:{left:"calc(50% - 5px)",bottom:"-6px",cursor:"ns-resize"},sw:{left:"-6px",bottom:"-6px",cursor:"nesw-resize"},w:{left:"-6px",top:"calc(50% - 5px)",cursor:"ew-resize"}}[name];
  Object.assign(h.style,pos);outline.append(h);handles[name]=h;
 });
 let active=null;
 const getSelectedNode=()=>{
  const doc=frame.contentDocument;if(!doc)return null;
  if(selectedDecorationId)return doc.querySelector('[data-studio-decoration-id="'+CSS.escape(selectedDecorationId)+'"]');
  try{return selectedSelector?doc.querySelector(selectedSelector):null;}catch{return null;}
 };
 const sync=()=>{
  const rect=frame.getBoundingClientRect(),parent=wrap.getBoundingClientRect();
  shield.style.width=rect.width+"px";shield.style.height=rect.height+"px";
  shield.style.left=(rect.left-parent.left+wrap.scrollLeft)+"px";shield.style.top=(rect.top-parent.top+wrap.scrollTop)+"px";
  shield.style.transform="none";drawSelection();
 };
 const drawSelection=()=>{
  const node=getSelectedNode();if(!node||!frame.contentDocument?.body.contains(node)){outline.style.display="none";Object.values(handles).forEach(h=>h.style.display="none");return;}
  const nr=node.getBoundingClientRect(),fr=frame.getBoundingClientRect(),sx=frame.clientWidth/(fr.width||1),sy=frame.clientHeight/(fr.height||1);
  const left=(nr.left-fr.left)*sx,top=(nr.top-fr.top)*sy,width=nr.width*sx,height=nr.height*sy;
  Object.assign(outline.style,{display:"block",left:left+"px",top:top+"px",width:Math.max(12,width)+"px",height:Math.max(12,height)+"px"});
  Object.values(handles).forEach(h=>h.style.display="block");
 };
 const elementAt=(event)=>{
  const doc=frame.contentDocument;if(!doc?.body)return null;
  const rect=frame.getBoundingClientRect(),sx=frame.clientWidth/(rect.width||1),sy=frame.clientHeight/(rect.height||1);
  return doc.elementFromPoint((event.clientX-rect.left)*sx,(event.clientY-rect.top)*sy);
 };
 const beginManipulation=(event,mode,handle,node,item)=>{
  const rect=frame.getBoundingClientRect(),sx=frame.clientWidth/(rect.width||1),sy=frame.clientHeight/(rect.height||1);
  const targetNode=node||getSelectedNode();if(!targetNode)return;
  const box=targetNode.getBoundingClientRect();
  const shape=!!selectedDecorationId;
  const base={x:shape?Number(item.x)||0:Number(item?.translateX)||0,y:shape?Number(item.y)||0:Number(item?.translateY)||0,width:shape?Number(item.width)||box.width:box.width,height:shape?Number(item.height)||box.height:box.height};
  active={mode,handle,startX:event.clientX,startY:event.clientY,scaleX:sx,scaleY:sy,node:targetNode,item,shape,base,moved:false};
  shield.setPointerCapture?.(event.pointerId);
 };
 const updateItem=(a)=>{
  if(!a)return;
  const dx=(a.lastX-a.startX)*a.scaleX,dy=(a.lastY-a.startY)*a.scaleY;
  let {x,y,width,height}=a.base;
  if(a.mode==="move"){x+=dx;y+=dy;}
  else{
   if(a.handle.includes("e"))width=Math.max(20,width+dx);
   if(a.handle.includes("s"))height=Math.max(16,height+dy);
   if(a.handle.includes("w")){const next=Math.max(20,width-dx);x+=width-next;width=next;}
   if(a.handle.includes("n")){const next=Math.max(16,height-dy);y+=height-next;height=next;}
  }
  if(a.shape){
   a.item.x=x;a.item.y=y;
   if(a.mode==="resize"){a.item.width=width;a.item.height=height;}
   Object.assign(a.node.style,{left:x+"px",top:y+"px"});
   if(a.mode==="resize")Object.assign(a.node.style,{width:width+"px",height:height+"px"});
  }else{
   a.item.translateX=x;a.item.translateY=y;
   a.node.style.translate=x+"px "+y+"px";
   if(a.mode==="resize"){a.item.width=width;a.item.height=height;a.node.style.width=width+"px";a.node.style.height=height+"px";}
  }
  drawSelection();
 };
 shield.addEventListener("pointerdown",event=>{
  event.preventDefault();event.stopPropagation();
  const handle=event.target.closest?.("[data-studio-handle]")?.dataset.studioHandle;
  let node=getSelectedNode(),item=selectedDecorationId?draft.decorations.find(x=>x.id===selectedDecorationId):(findItem(selectedSelector)||{selector:selectedSelector});
  if(handle&&node){beginManipulation(event,"resize",handle,node,item);return;}
  const target=elementAt(event);if(!target)return;
  const shape=target.closest?.("[data-studio-decoration-id]");
  if(shape){
   const found=draft.decorations.find(x=>x.id===shape.dataset.studioDecorationId);if(!found)return;
   selectedDecorationId=found.id;selectedSelector="";$("studioDecorationControls").hidden=false;$("studioElementControls").hidden=true;
   populateDecorationControls(found);highlightDecoration();drawSelection();
   const liveShape=frame.contentDocument.querySelector('[data-studio-decoration-id="'+CSS.escape(found.id)+'"]');
   beginManipulation(event,"move","",liveShape,found);return;
  }
  if(target.closest?.("#orderModal,.cart-overlay,.product-detail-page"))return;
  const selectable="header,footer,nav,.announcement,.marquee-band,.hero,.why-v2,.contact-v2,h1,h2,h3,h4,p,a,button,img,small,span,b,strong,em,section,article,main,div:not(body)";
  const picked=target.closest?.(selectable);if(!picked||!frame.contentDocument.body.contains(picked))return;
  selectedDecorationId="";selectedSelector=selectorFor(picked);
  $("studioDecorationControls").hidden=true;$("studioElementControls").hidden=false;
  populateControls(picked);highlightSelected();drawSelection();
  const saved=findItem(selectedSelector)||{selector:selectedSelector};
  beginManipulation(event,"move","",picked,saved);
 });
 shield.addEventListener("pointermove",event=>{
  if(!active)return;
  active.lastX=event.clientX;active.lastY=event.clientY;
  if(Math.abs(active.lastX-active.startX)>2||Math.abs(active.lastY-active.startY)>2)active.moved=true;
  if(active.moved)updateItem(active);
 });
 const finish=()=>{
  if(!active)return;
  const a=active;active=null;
  if(a.moved){
   if(a.shape){setStatus("Shape position updated. Click Save draft to keep your changes.");}
   else{
    const idx=draft.elements.findIndex(x=>x.selector===selectedSelector);
    if(idx>=0)draft.elements[idx]=a.item;else draft.elements.push(a.item);
    setStatus("Element moved/resized. Click Save draft to keep your changes.");
   }
  }
  drawSelection();
 };
 shield.addEventListener("pointerup",finish);shield.addEventListener("pointercancel",finish);
 shield.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();});
 const observer=new ResizeObserver(sync);observer.observe(wrap);observer.observe(frame);
 wrap.addEventListener("scroll",sync);window.addEventListener("resize",sync);frame.addEventListener("load",sync);
 requestAnimationFrame(sync);
}
function attachPreviewEditor(){
 const doc=frame.contentDocument;if(!doc?.body)return;
 installStudioClickShield();
 doc.querySelectorAll("style[data-studio-editor-style]").forEach(n=>n.remove());
 const style=doc.createElement("style");style.dataset.studioEditorStyle="true";style.textContent='[data-studio-selected="true"]{outline:3px solid #c9a45c!important;outline-offset:3px!important;cursor:crosshair!important} body{cursor:crosshair}';doc.head.append(style);
 doc.addEventListener("pointerdown",event=>{
  const shape=event.target.closest("[data-studio-decoration-id]");if(!shape)return;
  const item=draft.decorations.find(x=>x.id===shape.dataset.studioDecorationId);if(!item)return;
  event.preventDefault();event.stopPropagation();selectedDecorationId=item.id;selectedSelector="";populateDecorationControls(item);
  const resizing=!!event.target.closest("[data-studio-resize-handle]");
  const sx=event.clientX,sy=event.clientY,ox=Number(item.x)||0,oy=Number(item.y)||0,ow=Number(item.width)||120,oh=Number(item.height)||60;
  const active=shape;
  const move=e=>{
   const dx=e.clientX-sx,dy=e.clientY-sy;
   if(resizing){item.width=Math.max(12,ow+dx);if(item.type!=="line")item.height=Math.max(12,oh+dy);}
   else{item.x=ox+dx;item.y=oy+dy;}
   active.style.left=item.x+"px";active.style.top=item.y+"px";active.style.width=item.width+"px";
   if(item.type!=="line")active.style.height=item.height+"px";
   $("studioDecorationX").value=Math.round(item.x);$("studioDecorationY").value=Math.round(item.y);
   $("studioDecorationWidth").value=Math.round(item.width);$("studioDecorationHeight").value=Math.round(item.height);
  };
  const up=async()=>{doc.removeEventListener("pointermove",move);await saveDraft(false);renderStudioDecorations(doc);};
  doc.addEventListener("pointermove",move);doc.addEventListener("pointerup",up,{once:true});
 },true);
  if(doc.documentElement.dataset.aurkStudioSelectionAttached!=="true"){
  doc.documentElement.dataset.aurkStudioSelectionAttached="true";
  const selectable="header,footer,nav,.announcement,.marquee-band,.hero,.why-v2,.contact-v2,h1,h2,h3,h4,p,a,button,img,small,span,b,strong,em,section,article,main";
  const selectAtPoint=event=>{
   const path=typeof event.composedPath==="function"?event.composedPath():[event.target];
   const target=path.find(node=>node&&node.nodeType===1);if(!target)return;
   if(target.closest("[data-studio-decoration-id]"))return;
   if(target.closest("#orderModal,.cart-overlay,.product-detail-page"))return;
   const node=target.closest(selectable);if(!node||!doc.body.contains(node))return;
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
   if(event.type==="click")return;
   selectedDecorationId="";selectedSelector=selectorFor(node);
   $("studioDecorationControls").hidden=true;$("studioElementControls").hidden=false;populateControls(node);highlightSelected();
  };
  doc.defaultView.addEventListener("pointerdown",selectAtPoint,true);
  doc.defaultView.addEventListener("click",selectAtPoint,true);
 }
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
 $("studioDecorationControls").hidden=true;$("studioElementControls").hidden=false;
 $("studioSelectorLabel").value=selectedSelector;
 const tag=node.tagName,saved=findItem(selectedSelector)||{},computed=getComputedStyle(node);
 $("studioTextWrap").hidden=!["H1","H2","H3","H4","P","A","BUTTON","SMALL","SPAN","B","STRONG","EM","LI"].includes(tag);
 $("studioLinkWrap").hidden=tag!=="A";$("studioImageWrap").hidden=tag!=="IMG";
 $("studioText").value=$("studioTextWrap").hidden?"":node.textContent.trim();
 $("studioHref").value=tag==="A"?(node.getAttribute("href")||""):"";
 $("studioImage").value=tag==="IMG"?(node.getAttribute("src")||""):"";
 $("studioImageAlt").value=tag==="IMG"?(saved.alt??node.alt??""):"";
 $("studioObjectFit").value=saved.objectFit||"";
 selectedBaseline={
  color:toHex(computed.color),background:toHex(computed.backgroundColor),
  fontSize:parseFloat(computed.fontSize)||"",fontFamily:computed.fontFamily.split(",")[0].replace(/['"]/g,""),
  fontWeight:computed.fontWeight,textAlign:computed.textAlign,borderColor:toHex(computed.borderColor),
  opacity:Number(computed.opacity)||1,fontStyle:computed.fontStyle,textDecoration:computed.textDecorationLine||computed.textDecoration,
  letterSpacing:parseFloat(computed.letterSpacing)||0,lineHeight:computed.lineHeight==="normal"?"":parseFloat(computed.lineHeight)||"",
  width:parseFloat(computed.width)||"",height:parseFloat(computed.height)||"",maxWidth:parseFloat(computed.maxWidth)||"",
  padding:parseFloat(computed.paddingTop)||0,radius:parseFloat(computed.borderTopLeftRadius)||0,borderWidth:parseFloat(computed.borderTopWidth)||0
 };
 $("studioColor").value=saved.color||selectedBaseline.color||"#171717";
 $("studioBackground").value=saved.background||selectedBaseline.background||"#ffffff";
 $("studioFontSize").value=saved.fontSize??selectedBaseline.fontSize??"";
 $("studioFontFamily").value=saved.fontFamily||selectedBaseline.fontFamily||"";
 $("studioFontWeight").value=saved.fontWeight||"";
 $("studioTextAlign").value=saved.textAlign||"";
 $("studioBorderColor").value=saved.borderColor||selectedBaseline.borderColor||"#c9a45c";
 $("studioWidth").value=saved.width??"";$("studioHeight").value=saved.height??"";$("studioMaxWidth").value=saved.maxWidth??"";
 $("studioPadding").value=saved.padding??"";$("studioRadius").value=saved.radius??"";$("studioBorderWidth").value=saved.borderWidth??"";
 $("studioOpacity").value=saved.opacity??selectedBaseline.opacity;$("studioOpacityValue").textContent=Math.round(Number($("studioOpacity").value)*100)+"%";
 $("studioLetterSpacing").value=saved.letterSpacing??"";$("studioLineHeight").value=saved.lineHeight??"";
 $("studioFontStyle").value=saved.fontStyle||"";$("studioTextDecoration").value=saved.textDecoration||"";
 $("studioBackgroundImage").value=saved.backgroundImage||"";$("studioBackgroundSize").value=saved.backgroundSize||"";$("studioBackgroundPosition").value=saved.backgroundPosition||"";
 $("studioHidden").checked=!!saved.hidden||node.hidden;
 $("studioMoveUp").disabled=!node.matches("main > section[id]")||!node.previousElementSibling;
 $("studioMoveDown").disabled=!node.matches("main > section[id]")||!node.nextElementSibling;
}
function toHex(value){const match=String(value).match(/rgba?\(([^)]+)\)/);if(!match)return null;const parts=match[1].split(",").map(x=>x.trim());if(parts.length>3&&Number(parts[3])===0)return null;const nums=parts.slice(0,3).map(Number);return nums.length===3?"#"+nums.map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,"0")).join(""):null;}
function currentPatch(){
 const node=frame.contentDocument?.querySelector(selectedSelector);if(!node)return null;
 const tag=node.tagName,item={...(findItem(selectedSelector)||{}),selector:selectedSelector};
 if(!$("studioTextWrap").hidden)item.text=$("studioText").value;
 if(tag==="A")item.href=$("studioHref").value.trim();
 if(tag==="IMG"){item.src=$("studioImage").value.trim();item.alt=$("studioImageAlt").value.trim();const fit=$("studioObjectFit").value;if(fit)item.objectFit=fit;else delete item.objectFit;}
 const setNumber=(id,key,min,max)=>{const raw=$(id).value.trim();if(!raw){delete item[key];return;}const n=Number(raw);if(Number.isFinite(n)&&n>=min&&n<=max)item[key]=n;};
 const color=$("studioColor").value,bg=$("studioBackground").value;
 if(color===selectedBaseline.color)delete item.color;else item.color=color;
 if(bg===selectedBaseline.background)delete item.background;else item.background=bg;
 const size=$("studioFontSize").value.trim();if(size&&Number(size)>=8&&Number(size)<=400)item.fontSize=Number(size);else delete item.fontSize;
 const family=$("studioFontFamily").value.trim();if(family&&family!==selectedBaseline.fontFamily)item.fontFamily=family;else if(!family||family===selectedBaseline.fontFamily)delete item.fontFamily;
 const weight=$("studioFontWeight").value;if(weight)item.fontWeight=weight;else delete item.fontWeight;
 const align=$("studioTextAlign").value;if(align)item.textAlign=align;else delete item.textAlign;
 const border=$("studioBorderColor").value;if(border===selectedBaseline.borderColor)delete item.borderColor;else item.borderColor=border;
 setNumber("studioWidth","width",1,4000);setNumber("studioHeight","height",1,4000);setNumber("studioMaxWidth","maxWidth",1,4000);
 setNumber("studioPadding","padding",0,300);setNumber("studioRadius","radius",0,300);setNumber("studioBorderWidth","borderWidth",0,40);
 setNumber("studioLetterSpacing","letterSpacing",-10,40);setNumber("studioLineHeight","lineHeight",.7,4);
 item.opacity=Math.max(0,Math.min(1,Number($("studioOpacity").value)));
 const fontStyle=$("studioFontStyle").value;if(fontStyle)item.fontStyle=fontStyle;else delete item.fontStyle;
 const decoration=$("studioTextDecoration").value;if(decoration)item.textDecoration=decoration;else delete item.textDecoration;
 const bgImage=$("studioBackgroundImage").value.trim();if(bgImage&&/^https:\/\//i.test(bgImage))item.backgroundImage=bgImage;else delete item.backgroundImage;
 const bgSize=$("studioBackgroundSize").value;if(bgSize)item.backgroundSize=bgSize;else delete item.backgroundSize;
 const bgPosition=$("studioBackgroundPosition").value;if(bgPosition)item.backgroundPosition=bgPosition;else delete item.backgroundPosition;
 if(studioUploadedFontUrl&&family===studioUploadedFontFamily)item.fontUrl=studioUploadedFontUrl;
 item.hidden=$("studioHidden").checked;return item;
}
async function applyCurrent(){
 if(!selectedSelector){setStatus("Select an element in the preview first.",true);return;}
 const item=currentPatch();if(!item){setStatus("Could not apply this change. Select the element again.",true);return;}
 const index=draft.elements.findIndex(x=>x.selector===selectedSelector);
 if(index>=0)draft.elements[index]=item;else draft.elements.push(item);
 applyItem(frame.contentDocument,item);highlightSelected();
 await saveDraft(false);
}
async function resetCurrent(){
 if(!selectedSelector)return;
 draft.elements=draft.elements.filter(x=>x.selector!==selectedSelector);
 selectedSelector="";await saveDraft(false);
 const home=studioPages.find(p=>p.slug==="home");
 frame.src="index.html?page=home&pageId="+encodeURIComponent(home?.id||"")+"&studioPreview=1&refresh="+Date.now();
 $("studioSelectorLabel").value="";setStatus("Element reset and saved to the homepage draft.");
}
async function loadStudio(){
 const withTimeout=(promise,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+" timed out. Please refresh the page; if it continues, check the admin connection.")),15000))]);
 try{
  setStatus("Connecting to your secure admin session…");
  const sessionResult=await withTimeout(supabase.auth.getSession(),"Admin session check");
  const session=sessionResult?.data?.session;
  if(!session){setStatus("Please sign in to the admin panel first.",true);return;}
  setStatus("Checking Website Studio permissions…");
  const roleResult=await withTimeout(supabase.rpc("current_staff_role"),"Permission check");
  const {data:role,error:roleError}=roleResult;
  if(roleError||role!=="owner"){setStatus("Website Studio is available to the Owner account only.",true);document.querySelector('[data-view="website-studio"]')?.remove();return;}
  setStatus("Loading your saved website design…");
  const settingsResult=await withTimeout(supabase.from("site_studio_settings").select("*").eq("id","homepage").maybeSingle(),"Website design data");
  const {data,error}=settingsResult;
  if(error)throw new Error("Studio database setup issue: "+error.message);
  draft=normalize(data?.draft_content||emptyDraft());homepageVisualDraft=normalize(draft);
  $("studioThemeGold").value=draft.theme.gold||"#c9a45c";$("studioThemePaper").value=draft.theme.paper||"#f7f5f0";$("studioThemeInk").value=draft.theme.ink||"#11110f";$("studioThemePattern").value=draft.theme.pattern||"none";$("studioThemePatternOpacity").value=draft.theme.patternOpacity??14;$("studioThemePatternValue").textContent=$("studioThemePatternOpacity").value+"%";updateThemePatternPreview();
  $("studioLastPublished").textContent="Published version: "+(data?.published_at?new Date(data.published_at).toLocaleString():"Not published yet");
  const visualEditor=$("studioVisualEditor"),quickNav=document.querySelector(".studio-quick-nav");if(visualEditor&&quickNav&&visualEditor.previousElementSibling!==quickNav)quickNav.after(visualEditor);
  if(frame.contentDocument?.readyState==="complete")attachPreviewEditor();
  setStatus(data?.updated_at?"Website Studio ready. Select an element in the preview to begin.":"Website Studio ready. Your first draft has not been saved yet.");
  // Heavy secondary panels are loaded only when opened, keeping the editor startup fast.
  let versionsLoaded=false;
  // Reuse the quickNav reference declared earlier in loadStudio().
  quickNav?.addEventListener("click",event=>{
   const link=event.target.closest("a");if(!link)return;
   const target=link.dataset.studioPage||link.getAttribute("href")||"";
   if((target==="studioPagesPanel"||target==="#studioPagesPanel")&&!pageBuilderInitialized){
    pageMessage("Loading page builder…");
    initPageBuilder().catch(error=>{pageBuilderInitialized=false;pageMessage("Page builder could not load: "+(error?.message||"Please retry."),true);});
   }
   if((target==="studioVersionHistory"||target==="#studioVersionHistory")&&!versionsLoaded){
    versionsLoaded=true;
    $("studioVersions").textContent="Loading version history…";
    loadVersions().catch(error=>{versionsLoaded=false;const host=$("studioVersions");if(host)host.textContent="Version history unavailable: "+(error?.message||"Please retry.");});
   }
  });
 }catch(error){
  console.error("Website Studio initialization failed:",error);
  setStatus("Website Studio could not finish loading: "+(error?.message||"Unknown error"),true);
 }
}
async function saveDraft(publish=false){
 const button=publish?$("studioPublish"):$("studioSaveDraft");if(button)button.disabled=true;setStatus(publish?"Publishing page design…":"Saving page design…");
 const user=(await supabase.auth.getUser()).data.user;
 const isCustomPage=activeStudioPage&&(activeStudioPage.draft_slug||activeStudioPage.slug)!=="home";
 if(isCustomPage){
  const visualContent={...pageDraft,visual:draft},now=new Date().toISOString();
  const {data:updated,error}=await supabase.from("site_studio_page_drafts").update({draft_content:visualContent,updated_by:user?.id,updated_at:now}).eq("id",activeStudioPage.id).select("*").single();
  if(error){if(button)button.disabled=false;setStatus("Could not save this page design: "+error.message,true);return;}
  activeStudioPage={...activeStudioPage,...updated};studioPages=studioPages.map(p=>p.id===activeStudioPage.id?activeStudioPage:p);
  if(publish){
   const published={id:activeStudioPage.id,slug:activeStudioPage.draft_slug||activeStudioPage.slug,title:activeStudioPage.draft_title||activeStudioPage.title,published_content:visualContent,status:"published",show_in_nav:activeStudioPage.draft_show_in_nav??activeStudioPage.show_in_nav,nav_order:activeStudioPage.draft_nav_order??activeStudioPage.nav_order,meta_description:activeStudioPage.draft_meta_description,meta_title:activeStudioPage.draft_meta_title,meta_keywords:activeStudioPage.draft_meta_keywords,og_image_url:activeStudioPage.draft_og_image_url,published_at:now};
   const {error:publishError}=await supabase.from("site_studio_pages").upsert(published,{onConflict:"id"});
   if(publishError){if(button)button.disabled=false;setStatus("Draft saved, but publishing failed: "+publishError.message,true);return;}
   activeStudioPage={...activeStudioPage,...published};studioPages=studioPages.map(p=>p.id===activeStudioPage.id?activeStudioPage:p);
   setStatus("Page design published successfully. Your changes are live.");
  }else setStatus("Page design saved as a private draft. Publish when you are ready.");
 }else{
  const payload={id:"homepage",draft_content:draft,updated_at:new Date().toISOString(),updated_by:user?.id};
  if(publish)payload.published_at=new Date().toISOString();
  const {error:saveError}=await supabase.from("site_studio_settings").upsert(payload,{onConflict:"id"});
  if(saveError){if(button)button.disabled=false;setStatus("Could not save draft: "+saveError.message,true);return;}
  homepageVisualDraft=normalize(draft);
  if(publish){
   const {error:publishError}=await supabase.from("site_studio_published").upsert({id:"homepage",content:draft,published_at:payload.published_at,published_by:user?.id},{onConflict:"id"});
   if(publishError){if(button)button.disabled=false;setStatus("Draft saved, but publishing failed: "+publishError.message,true);return;}
  }
  await supabase.from("site_studio_versions").insert({version_label:(publish?"Published":"Draft saved")+" — "+new Date().toLocaleString(),content:draft,created_by:user?.id});
  if(publish){$("studioLastPublished").textContent="Published version: "+new Date(payload.published_at).toLocaleString();setStatus("Published successfully. Your changes are now live.");}
  else setStatus("Draft saved. Visitors will not see it until you publish.");
  await loadVersions();
 }
 if(button)button.disabled=false;
}
async function loadVersions(){
 const host=$("studioVersions");if(!host)return;
 const {data,error}=await supabase.from("site_studio_versions").select("id,version_label,created_at,content").order("created_at",{ascending:false}).limit(12);
 if(error){host.textContent="Version history unavailable: "+error.message;return;}
 versions=data||[];host.innerHTML="";
 if(!versions.length){host.textContent="No saved versions yet.";return;}
 versions.forEach(v=>{const label=document.createElement("label");label.className="studio-version-option";const radio=document.createElement("input");radio.type="radio";radio.name="studioVersion";radio.value=v.id;radio.addEventListener("change",()=>{selectedVersion=v; $("studioRestoreVersion").disabled=false;});const text=document.createElement("span");text.textContent=v.version_label;label.append(radio,text);host.append(label);});
}

let studioUploadedFontUrl="",studioUploadedFontFamily="";
function setAssetMessage(message,error=false){const el=$("studioAssetMessage");if(el){el.textContent=message;el.classList.toggle("is-error",error);}}
async function uploadStudioAsset(file,kind){if(!file){setAssetMessage("Choose a file first.",true);return;}const isFont=kind==="font";const allowed=isFont?/\.(woff2?|ttf|otf)$/i.test(file.name):/^image\/(png|jpeg|webp)$/.test(file.type);if(!allowed){setAssetMessage(isFont?"Use WOFF, WOFF2, TTF or OTF font files.":"Use PNG, JPG or WebP images.",true);return;}if(file.size>(isFont?8:15)*1024*1024){setAssetMessage("File is too large. Maximum size: "+(isFont?8:15)+" MB.",true);return;}const button=$(isFont?"studioUploadFontBtn":"studioUploadImageBtn");button.disabled=true;setAssetMessage("Uploading "+file.name+"…");try{const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-90);const path="studio-uploads/"+crypto.randomUUID()+"-"+safe;const ext=file.name.split(".").pop().toLowerCase();const mime=file.type||(isFont?({woff2:"font/woff2",woff:"font/woff",ttf:"font/ttf",otf:"font/otf"}[ext]||"application/font-woff"):({png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp"}[ext]||"application/octet-stream"));const {data,error}=await supabase.storage.from("website-images").upload(path,file,{cacheControl:"31536000",upsert:false,contentType:mime});if(error)throw error;const publicData=supabase.storage.from("website-images").getPublicUrl(data.path).data;$("studioAssetUrl").value=publicData.publicUrl;if(isFont){studioUploadedFontUrl=publicData.publicUrl;$("studioUseFont").disabled=false;$("studioUseImage").disabled=true;}else{$("studioUseImage").disabled=false;$("studioUseFont").disabled=true;} $("studioCopyAsset").disabled=false;setAssetMessage("Uploaded successfully. Apply this file to your selected element.");}catch(error){setAssetMessage("Upload failed: "+(error.message||"Please try again."),true);}finally{button.disabled=false;}}
$("studioUploadImageBtn")?.addEventListener("click",()=>uploadStudioAsset($("studioImageUpload").files[0],"image"));
$("studioSelectedImageUploadBtn")?.addEventListener("click",()=>$("studioSelectedImageFile").click());
$("studioSelectedImageFile")?.addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 if(!selectedSelector||frame.contentDocument?.querySelector(selectedSelector)?.tagName!=="IMG"){
  $("studioSelectedImageUploadStatus").textContent="Select an image in the preview first.";event.target.value="";return;
 }
 const button=$("studioSelectedImageUploadBtn");button.disabled=true;
 $("studioSelectedImageUploadStatus").textContent="Uploading…";
 await uploadStudioAsset(file,"image");
 const uploadedUrl=$("studioAssetUrl").value;
 if(uploadedUrl&&uploadedUrl.startsWith("https://")){
  $("studioImage").value=uploadedUrl;applyCurrent();
  $("studioSelectedImageUploadStatus").textContent="Uploaded and applied. Save draft to keep it.";
 }else{$("studioSelectedImageUploadStatus").textContent="Upload failed. Please try again.";}
 button.disabled=false;event.target.value="";
});
$("studioUploadFontBtn")?.addEventListener("click",()=>uploadStudioAsset($("studioFontUpload").files[0],"font"));
$("studioUseImage")?.addEventListener("click",()=>{if(!selectedSelector){setAssetMessage("Select an image element in the preview first.",true);return;}const node=frame.contentDocument?.querySelector(selectedSelector);if(!node||node.tagName!=="IMG"){$("studioImage").value=$("studioAssetUrl").value;setAssetMessage("URL placed in the image field. Select an image element to apply it.");return;}$("studioImage").value=$("studioAssetUrl").value;applyCurrent();});
$("studioUseFont")?.addEventListener("click",()=>{if(!selectedSelector){setAssetMessage("Select a text element in the preview first.",true);return;}const family=prompt("Enter a name for this custom font:","AURK Custom Font");if(!family?.trim())return;$("studioFontFamily").value=family.trim();studioUploadedFontUrl=$("studioAssetUrl").value;studioUploadedFontFamily=family.trim();applyCurrent();setAssetMessage("Custom font applied. Save your draft to keep it.");});
$("studioCopyAsset")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("studioAssetUrl").value);setAssetMessage("Asset URL copied.");}catch{setAssetMessage("Select and copy the URL from the field above.");}});
function updateThemePatternPreview(){const preview=$("studioThemePatternPreview");if(!preview)return;const theme={gold:$("studioThemeGold").value,pattern:$("studioThemePattern").value,patternOpacity:Number($("studioThemePatternOpacity").value)};preview.style.backgroundColor=$("studioThemePaper").value;preview.style.backgroundImage=themePatternImage(theme);preview.style.backgroundSize=theme.pattern==="dots"?"18px 18px":theme.pattern==="grid"?"24px 24px":"auto";preview.style.color=$("studioThemeInk").value;}
["studioThemeGold","studioThemePaper","studioThemeInk","studioThemePattern","studioThemePatternOpacity"].forEach(id=>$(id)?.addEventListener("input",()=>{$("studioThemePatternValue").textContent=$("studioThemePatternOpacity").value+"%";updateThemePatternPreview();}));
$("studioApplyTheme")?.addEventListener("click",()=>{draft.theme={gold:$("studioThemeGold").value,paper:$("studioThemePaper").value,ink:$("studioThemeInk").value,pattern:$("studioThemePattern").value,patternOpacity:Number($("studioThemePatternOpacity").value)};applyThemeToPreview();setStatus("Brand colours and shape pattern applied to preview. Save draft to keep them.");});

document.querySelectorAll("[data-studio-shape]").forEach(button=>button.addEventListener("click",()=>addStudioDecoration(button.dataset.studioShape)));
$("studioUpdateDecoration")?.addEventListener("click",async()=>{updateStudioDecoration();await saveDraft(false);});
$("studioDeleteDecoration")?.addEventListener("click",deleteStudioDecoration);
$("studioDecorationType")?.addEventListener("change",updateStudioDecoration);
["studioDecorationX","studioDecorationY","studioDecorationWidth","studioDecorationHeight","studioDecorationFill","studioDecorationBorder","studioDecorationBorderWidth","studioDecorationRadius","studioDecorationOpacity"].forEach(id=>$(id)?.addEventListener("input",()=>{if(id==="studioDecorationOpacity")$("studioDecorationOpacityValue").textContent=Math.round(Number($(id).value)*100)+"%";updateStudioDecoration();}));
$("studioApply")?.addEventListener("click",applyCurrent);
$("studioResetElement")?.addEventListener("click",resetCurrent);
$("studioSaveDraft")?.addEventListener("click",()=>saveDraft(false));
$("studioPublish")?.addEventListener("click",()=>{if(confirm("Publish the current Website Studio draft to the live AUR-K EV website?"))saveDraft(true);});
$("studioRefreshPreview")?.addEventListener("click",()=>{if(typeof previewStudioPage==="function"&&activeStudioPage)previewStudioPage();else frame.src="index.html?page=home&studioPreview=1&refresh="+Date.now();});
$("studioRestoreVersion")?.addEventListener("click",()=>{if(!selectedVersion)return;draft=normalize(selectedVersion.content);selectedSelector="";frame.src="index.html?page=home&pageId="+encodeURIComponent(studioPages.find(p=>p.slug==="home")?.id||"")+"&studioPreview=1&refresh="+Date.now();setStatus("Version restored into the editor. Save draft to keep it.");});
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

/* Advanced pages and reusable section builder */
let studioPages=[],activeStudioPage=null,pageDraft={sections:[]},selectedBlockId=null,pageBuilderInitialized=false,homepageVisualDraft=null;
const blockDefaults={
 hero:{type:"hero",eyebrow:"WELCOME TO AUR-K EV",heading:"A better way to ride.",body:"Discover a more refined way to move with AUR-K EV.",image_url:"",button_text:"Explore scooters",button_url:"/#collection"},
 text:{type:"text",heading:"A story worth sharing",body:"Write your page content here. Share your story, services or important information."},
 image:{type:"image",heading:"Designed for your journey",body:"Add supporting details alongside a product or lifestyle image.",image_url:"",image_alt:""},
 video:{type:"video",heading:"See it in action",body:"Show customers a product video or brand film.",video_url:""},
 cta:{type:"cta",heading:"Ready for your next ride?",body:"Speak with our showroom team for friendly guidance.",button_text:"Contact AUR-K EV",button_url:"https://wa.me/923239661747"},
 promo:{type:"promo",eyebrow:"LIMITED-TIME OFFER",heading:"A smarter way to move",body:"Add your promotional message and details here.",image_url:"",button_text:"Explore offers",button_url:"/#collection",background_color:"#171717"},
 products:{type:"products",heading:"Explore our scooters",body:"Discover selected models from the AUR-K EV collection.",product_limit:4}
};
const blockNames={hero:"Hero banner",text:"Text section",image:"Image & text",video:"Video section",cta:"Call to action",promo:"Promotion banner",products:"Product showcase"};
function pageMessage(message,error=false){const el=$("studioPageMessage");if(el){el.textContent=message;el.classList.toggle("is-error",error);}}
function slugify(value){return String(value||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70);}
function makeBlock(type){return {id:crypto.randomUUID(),...(blockDefaults[type]||blockDefaults.text)};}
function normalizePageContent(value){return {sections:Array.isArray(value?.sections)?value.sections:[]};}
async function initPageBuilder(){
 if(pageBuilderInitialized)return;
 pageBuilderInitialized=true;
 const [draftResult,publishedResult]=await Promise.all([
  supabase.from("site_studio_page_drafts").select("*").order("created_at",{ascending:true}),
  supabase.from("site_studio_pages").select("id,slug,title,published_content,status,show_in_nav,nav_order,meta_description,meta_title,meta_keywords,og_image_url,published_at").order("created_at",{ascending:true})
 ]);
 if(draftResult.error||publishedResult.error){pageBuilderInitialized=false;const message="Page builder could not load: "+(draftResult.error||publishedResult.error).message;pageMessage(message,true);const host=$("studioBlockList");if(host)host.textContent=message;return;}
 const publishedById=new Map((publishedResult.data||[]).map(p=>[p.id,p]));
 studioPages=(draftResult.data||[]).map(d=>({...d,...(publishedById.get(d.id)||{}),draft_slug:d.draft_slug,draft_title:d.draft_title,draft_content:d.draft_content,draft_meta_description:d.draft_meta_description,draft_meta_title:d.draft_meta_title,draft_meta_keywords:d.draft_meta_keywords,draft_og_image_url:d.draft_og_image_url,draft_show_in_nav:d.draft_show_in_nav}));
 if(!studioPages.some(p=>p.slug==="home")){
  pageBuilderInitialized=false;pageMessage("Homepage page record is missing. Refresh and try again.",true);const host=$("studioBlockList");if(host)host.textContent="Homepage page record is missing. Refresh and try again.";return;
 }
 const select=$("studioPageSelect");select.innerHTML="";
 studioPages.forEach(p=>{const opt=document.createElement("option");opt.value=p.id;opt.textContent=p.slug==="home"?"Homepage":p.draft_title||p.title;select.append(opt);});
 select.addEventListener("change",()=>{const p=studioPages.find(x=>x.id===select.value);if(p)selectStudioPage(p);});
 const visualSelect=$("studioVisualPageSelect");
 if(visualSelect){visualSelect.innerHTML="";studioPages.forEach(p=>{const opt=document.createElement("option");opt.value=p.id;opt.textContent=p.slug==="home"?"Homepage":p.draft_title||p.title;visualSelect.append(opt);});visualSelect.addEventListener("change",()=>{const p=studioPages.find(x=>x.id===visualSelect.value);if(p)selectStudioPage(p);});}
 $("studioNewPage").addEventListener("click",createStudioPage);
 $("studioDeletePage").addEventListener("click",deleteStudioPage);
 $("studioPageTitle").addEventListener("input",()=>{if(activeStudioPage?.slug==="home")return;if(!$("studioPageSlug").dataset.edited)$("studioPageSlug").value=slugify($("studioPageTitle").value);});
 $("studioPageSlug").addEventListener("input",()=>{$("studioPageSlug").dataset.edited="true";$("studioPageSlug").value=slugify($("studioPageSlug").value);});
 document.querySelectorAll("[data-add-block]").forEach(button=>button.addEventListener("click",()=>addStudioBlock(button.dataset.addBlock)));
 $("studioPageSave").addEventListener("click",()=>saveStudioPage(false));
 $("studioPagePublish").addEventListener("click",()=>{if(confirm("Publish this page and make it visible on your website?"))saveStudioPage(true);});
 $("studioPagePreview").addEventListener("click",previewStudioPage);
 $("studioPageNav").addEventListener("change",()=>{if(activeStudioPage?.slug==="home")$("studioPageNav").checked=false;});
 selectStudioPage(studioPages.find(p=>p.slug==="home")||studioPages[0]);
}
function selectStudioPage(page){
 activeStudioPage=page;pageDraft=normalizePageContent(page.draft_content||page.page_content);
 selectedBlockId=null;
 $("studioPageSelect").value=page.id;
 $("studioPageTitle").value=page.draft_title||page.title;
 $("studioPageSlug").value=page.draft_slug||page.slug;
 $("studioPageSlug").dataset.edited="";
 $("studioPageSlug").readOnly=page.slug==="home";
 $("studioPageTitle").readOnly=page.slug==="home";
 $("studioPageMeta").value=page.draft_meta_description??page.meta_description??"";
 $("studioPageSeoTitle").value=page.draft_meta_title??page.meta_title??page.draft_title??page.title??"";
 $("studioPageKeywords").value=page.draft_meta_keywords??page.meta_keywords??"";
 $("studioPageOgImage").value=page.draft_og_image_url??page.og_image_url??"";
 $("studioPageNav").checked=page.slug==="home"?false:(page.draft_show_in_nav??page.show_in_nav);
 $("studioPageNavOrder").value=page.draft_nav_order??page.nav_order??studioPages.indexOf(page);
 $("studioDeletePage").disabled=page.slug==="home";
 $("studioPageState").textContent=page.status==="published"?"Published page — draft edits stay private":"Unpublished draft";
 renderBlockList();renderBlockFields();
 pageMessage(page.slug==="home"?"Add custom sections to your existing homepage without replacing its current content.":"Edit this page, preview it, then publish when ready.");
 loadStudioPagePreview();
}
function renderBlockList(){
 const host=$("studioBlockList");host.innerHTML="";
 if(!pageDraft.sections.length){const empty=document.createElement("p");empty.className="studio-block-empty";empty.textContent="No sections yet. Choose a block from the library to start building.";host.append(empty);return;}
 pageDraft.sections.forEach((block,index)=>{
  const row=document.createElement("div");row.className="studio-block-row"+(block.id===selectedBlockId?" active":"");row.draggable=true;row.addEventListener("dragstart",event=>{event.dataTransfer.setData("text/aurk-block-index",String(index));event.dataTransfer.effectAllowed="move";});row.addEventListener("dragover",event=>event.preventDefault());row.addEventListener("drop",event=>{event.preventDefault();const from=Number(event.dataTransfer.getData("text/aurk-block-index"));if(!Number.isInteger(from)||from===index||from<0||from>=pageDraft.sections.length)return;const [moved]=pageDraft.sections.splice(from,1);pageDraft.sections.splice(index,0,moved);renderBlockList();pageMessage("Sections reordered. Save the page draft to keep this order.");});
  const choose=document.createElement("button");choose.type="button";choose.className="studio-block-select";choose.textContent=(index+1)+". "+(block.heading||blockNames[block.type]||"Section");choose.addEventListener("click",()=>{selectedBlockId=block.id;renderBlockList();renderBlockFields();});
  const up=document.createElement("button");up.type="button";up.textContent="↑";up.title="Move up";up.disabled=index===0;up.addEventListener("click",()=>moveStudioBlock(index,-1));
  const down=document.createElement("button");down.type="button";down.textContent="↓";down.title="Move down";down.disabled=index===pageDraft.sections.length-1;down.addEventListener("click",()=>moveStudioBlock(index,1));
  const copy=document.createElement("button");copy.type="button";copy.textContent="⧉";copy.title="Duplicate section";copy.addEventListener("click",()=>duplicateStudioBlock(index));
  const del=document.createElement("button");del.type="button";del.textContent="×";del.title="Delete section";del.addEventListener("click",()=>deleteStudioBlock(index));
  row.append(choose,up,down,copy,del);host.append(row);
 });
}
function renderBlockFields(){
 const host=$("studioBlockFields");host.innerHTML="";
 const block=pageDraft.sections.find(x=>x.id===selectedBlockId);
 if(!block){const empty=document.createElement("div");empty.className="studio-block-empty";empty.textContent="Select a section to edit its content and layout.";host.append(empty);return;}
 const heading=document.createElement("h4");heading.textContent=(blockNames[block.type]||"Section")+" settings";host.append(heading);
 const fields={
  hero:[["eyebrow","Small label"],["heading","Main heading"],["body","Description"],["image_url","Background / product image URL"],["button_text","Button label"],["button_url","Button link"]],
  text:[["heading","Heading"],["body","Text content"]],
  image:[["heading","Heading"],["body","Text content"],["image_url","Image URL"],["image_alt","Image description"]],
  video:[["heading","Heading"],["body","Description"],["video_url","YouTube or video URL"]],
  cta:[["heading","Heading"],["body","Description"],["button_text","Button label"],["button_url","Button link"]],
  promo:[["eyebrow","Small label"],["heading","Promotion heading"],["body","Promotion details"],["image_url","Image URL"],["button_text","Button label"],["button_url","Button link"],["background_color","Banner background colour"]],
  products:[["heading","Heading"],["body","Description"],["product_limit","Number of products (1–8)"]]
 }[block.type]||[["heading","Heading"],["body","Text content"]];
  if(!fields.some(([key])=>key==="background_color"))fields.push(["background_color","Section background colour"]);
  fields.push(["text_color","Section text colour"],["accent_color","Button / accent colour"],["font_family","Section font family"],["font_url","Custom font file URL (optional)"]);
 fields.forEach(([key,labelText])=>{
  const label=document.createElement("label");label.textContent=labelText;
  let input;
  if(key==="body"){input=document.createElement("textarea");input.rows=4;}
  else if(["background_color","text_color","accent_color"].includes(key)){input=document.createElement("input");input.type="color";}
  else {input=document.createElement("input");input.type=key==="product_limit"?"number":"text";if(key==="product_limit"){input.min="1";input.max="8";}}
  input.value=block[key]??(key==="background_color"?"#171717":"");
  input.dataset.field=key;
  input.addEventListener("input",()=>{block[key]=key==="product_limit"?Math.max(1,Math.min(8,Number(input.value)||4)):input.value;const row=$("studioBlockList").querySelector(".active .studio-block-select");if(row)row.textContent=(pageDraft.sections.indexOf(block)+1)+". "+(block.heading||blockNames[block.type]);});
  label.append(input);host.append(label);
 });
 const hint=document.createElement("p");hint.className="studio-field-hint";hint.textContent="Changes appear in the preview when you select Preview page. Remember to save your draft.";host.append(hint);
}
function addStudioBlock(type){const block=makeBlock(type);pageDraft.sections.push(block);selectedBlockId=block.id;renderBlockList();renderBlockFields();pageMessage((blockNames[type]||"Section")+" added. Edit its fields, then preview and save.");}
function moveStudioBlock(index,direction){const target=index+direction;if(target<0||target>=pageDraft.sections.length)return;[pageDraft.sections[index],pageDraft.sections[target]]=[pageDraft.sections[target],pageDraft.sections[index]];renderBlockList();pageMessage("Section order changed. Save the page draft to keep it.");}
function duplicateStudioBlock(index){const clone={...pageDraft.sections[index],id:crypto.randomUUID()};pageDraft.sections.splice(index+1,0,clone);selectedBlockId=clone.id;renderBlockList();renderBlockFields();pageMessage("Section duplicated.");}
function deleteStudioBlock(index){const block=pageDraft.sections[index];if(!confirm("Delete this "+(blockNames[block.type]||"section")+"?"))return;pageDraft.sections.splice(index,1);if(selectedBlockId===block.id)selectedBlockId=null;renderBlockList();renderBlockFields();pageMessage("Section removed from the draft.");}
async function createStudioPage(){
 const title=prompt("Enter the new page title (for example: About Us):");if(!title?.trim())return;
 const slug=slugify(title);if(!slug||slug==="home"){pageMessage("Please choose a valid page title.",true);return;}
 if(studioPages.some(p=>(p.draft_slug||p.slug)===slug)){pageMessage("That page URL already exists. Choose a different title.",true);return;}
 const user=(await supabase.auth.getUser()).data.user;
 const {data,error}=await supabase.from("site_studio_page_drafts").insert({id:crypto.randomUUID(),draft_slug:slug,draft_title:title.trim(),draft_meta_description:"",draft_show_in_nav:true,draft_nav_order:studioPages.length,draft_content:{sections:[]},created_by:user?.id,updated_by:user?.id}).select("*").single();
 if(error){pageMessage("Could not create page: "+error.message,true);return;}
 studioPages.push(data);const option=document.createElement("option");option.value=data.id;option.textContent=data.draft_title;$("studioPageSelect").append(option);selectStudioPage(data);pageMessage("New page created as a private draft. Add sections to build it.");
}
async function deleteStudioPage(){
 if(!activeStudioPage||activeStudioPage.slug==="home")return;
 if(!confirm("Permanently delete this page and remove it from your website menu?"))return;
 if(activeStudioPage.status==="published"){const {error:publicError}=await supabase.from("site_studio_pages").delete().eq("id",activeStudioPage.id);if(publicError){pageMessage("Could not remove published page: "+publicError.message,true);return;}}
 const {error}=await supabase.from("site_studio_page_drafts").delete().eq("id",activeStudioPage.id);
 if(error){pageMessage("Could not delete page draft: "+error.message,true);return;}
 studioPages=studioPages.filter(p=>p.id!==activeStudioPage.id);$("studioPageSelect").querySelector('option[value="'+activeStudioPage.id+'"]')?.remove();
 selectStudioPage(studioPages.find(p=>p.slug==="home"));pageMessage("Page deleted.");
}
async function saveStudioPage(publish=false){
 if(!activeStudioPage)return;
 const button=publish?$("studioPagePublish"):$("studioPageSave");button.disabled=true;
 const title=$("studioPageTitle").value.trim(),slug=slugify($("studioPageSlug").value);
 if(!title||!slug){button.disabled=false;pageMessage("Page title and URL slug are required.",true);return;}
 if(activeStudioPage.slug==="home"&&slug!=="home"){button.disabled=false;pageMessage("The homepage URL cannot be changed here.",true);return;}
 if(studioPages.some(p=>p.id!==activeStudioPage.id&&(p.slug===slug||p.draft_slug===slug))){button.disabled=false;pageMessage("This URL is already used by another page.",true);return;}
 const user=(await supabase.auth.getUser()).data.user,now=new Date().toISOString();
 const draftPayload={draft_title:title,draft_slug:slug,draft_meta_description:$("studioPageMeta").value.trim(),draft_meta_title:$("studioPageSeoTitle").value.trim(),draft_meta_keywords:$("studioPageKeywords").value.trim(),draft_og_image_url:$("studioPageOgImage").value.trim(),draft_show_in_nav:activeStudioPage.slug==="home"?false:$("studioPageNav").checked,draft_nav_order:Math.max(0,Math.min(99,Number($("studioPageNavOrder").value)||0)),draft_content:{...pageDraft,visual:draft},updated_by:user?.id,updated_at:now};
 const {data:draftData,error}=await supabase.from("site_studio_page_drafts").update(draftPayload).eq("id",activeStudioPage.id).select("*").single();
 if(error){button.disabled=false;pageMessage("Could not save page draft: "+error.message,true);return;}
 if(publish){
  const publicPayload={id:activeStudioPage.id,slug,title,published_content:{...pageDraft,visual:draft},status:"published",show_in_nav:draftPayload.draft_show_in_nav,nav_order:draftPayload.draft_nav_order,meta_description:draftPayload.draft_meta_description,meta_title:draftPayload.draft_meta_title,meta_keywords:draftPayload.draft_meta_keywords,og_image_url:draftPayload.draft_og_image_url,published_at:now};
  const {error:publishError}=await supabase.from("site_studio_pages").upsert(publicPayload,{onConflict:"id"});
  if(publishError){button.disabled=false;pageMessage("Draft saved, but publishing failed: "+publishError.message,true);return;}
 }
 button.disabled=false;
 const publishedData=publish?{slug,title,status:"published",show_in_nav:draftPayload.draft_show_in_nav,nav_order:draftPayload.draft_nav_order,meta_description:draftPayload.draft_meta_description,meta_title:draftPayload.draft_meta_title,meta_keywords:draftPayload.draft_meta_keywords,og_image_url:draftPayload.draft_og_image_url,published_content:pageDraft,published_at:now}:{};
 activeStudioPage={...activeStudioPage,...draftData,...publishedData};
 studioPages=studioPages.map(p=>p.id===activeStudioPage.id?activeStudioPage:p);
 const option=$("studioPageSelect").querySelector('option[value="'+activeStudioPage.id+'"]');if(option)option.textContent=activeStudioPage.draft_title;
 $("studioPageState").textContent=activeStudioPage.status==="published"?(publish?"Published just now":"Published page — draft edits stay private"):"Unpublished draft";
 pageMessage(publish?"Page published successfully. It is now available on your website.":"Page draft saved. Visitors will continue seeing the last published version.");
 if(publish)loadStudioPagePreview();
}
function loadStudioPagePreview(){
 if(!activeStudioPage)return;
 const isHome=(activeStudioPage.draft_slug||activeStudioPage.slug)==="home";
 const controls=document.querySelector(".studio-controls"),workbench=$("studioVisualEditor"),notice=$("studioVisualEditorNotice");
 if(controls)controls.hidden=!isHome;
 if(workbench)workbench.dataset.editorMode=isHome?"visual":"page-builder";
 if(notice)notice.hidden=isHome;
 frame.src="index.html?page="+encodeURIComponent(activeStudioPage.draft_slug||activeStudioPage.slug)+"&pageId="+encodeURIComponent(activeStudioPage.id)+"&studioPreview=1&refresh="+Date.now();
 $("studioSelectorLabel").value="";selectedSelector="";
}
async function previewStudioPage(){
 if(!activeStudioPage)return;
 await saveStudioPage(false);
 loadStudioPagePreview();
}

frame.addEventListener("load",()=>{
 try{
  attachPreviewEditor();
  const doc=frame.contentDocument;
  if(!doc||!doc.documentElement){setStatus("Live preview failed to load. Use Refresh preview to try again.",true);return;}
  setStatus("Live preview loaded. Select an element to edit.");
 }catch(error){setStatus("Preview editor could not attach: "+(error?.message||"unknown error"),true);}
});
frame.addEventListener("error",()=>setStatus("Live preview could not load. Check the website connection and refresh.",true));
document.addEventListener("aurk:studio-workspace-open",event=>{if(event.detail?.id!=="studioPagesPanel")return;const host=$("studioBlockList");if(!pageBuilderInitialized){if(host)host.textContent="Loading page sections…";pageMessage("Loading page builder…");initPageBuilder().catch(error=>{pageBuilderInitialized=false;const message="Page builder could not load: "+(error?.message||"Please retry.");pageMessage(message,true);if(host)host.textContent=message;});}});
setStatus("Starting Website Studio…");
loadStudio().catch(error=>{console.error("Website Studio startup error:",error);setStatus("Website Studio could not start: "+(error?.message||"Unknown error"),true);});
