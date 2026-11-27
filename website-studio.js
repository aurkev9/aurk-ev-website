import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const $=id=>document.getElementById(id);
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const frame=$("studioPreviewFrame"),status=$("studioStatus");
let draft={elements:[],sectionOrder:[]},selectedSelector="",selectedVersion=null,versions=[],selectedBaseline={};
const emptyDraft=()=>({elements:[],sectionOrder:[]});
function setStatus(message,error=false){if(status){status.textContent=message;status.classList.toggle("is-error",error);}}
function normalize(value){if(Array.isArray(value))return {elements:value,sectionOrder:[],theme:{}};return {elements:Array.isArray(value?.elements)?value.elements:[],sectionOrder:Array.isArray(value?.sectionOrder)?value.sectionOrder:[],theme:value?.theme&&typeof value.theme==="object"?value.theme:{}};}
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
 if(item.fontFamily)node.style.fontFamily='"'+String(item.fontFamily).replace(/["\\]/g,"")+'", sans-serif';
 if(item.fontWeight)node.style.fontWeight=item.fontWeight;
 if(item.textAlign)node.style.textAlign=item.textAlign;
 if(item.borderColor)node.style.borderColor=item.borderColor;
 if(item.fontUrl)ensureCustomFont(doc,item.fontFamily,item.fontUrl);else if(item.fontFamily)ensureGoogleFont(doc,item.fontFamily);
 if(item.hidden!==undefined)node.hidden=!!item.hidden;
}
function ensureGoogleFont(doc,family){if(!doc||!family||/^(Arial|Georgia|Verdana|Tahoma|Trebuchet MS|Times New Roman|Courier New)$/i.test(family))return;const id="studio-google-font-"+String(family).toLowerCase().replace(/[^a-z0-9]+/g,"-");if(doc.getElementById(id))return;const link=doc.createElement("link");link.id=id;link.rel="stylesheet";link.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(family).replace(/%20/g,"+")+":wght@300;400;500;600;700;800;900&display=swap";doc.head.append(link);}
function ensureCustomFont(doc,family,url){if(!doc||!family||!url)return;const id="studio-font-"+String(family).toLowerCase().replace(/[^a-z0-9]+/g,"-");if(doc.getElementById(id))return;const style=doc.createElement("style");style.id=id;style.textContent='@font-face{font-family:"'+String(family).replace(/["\\]/g,"")+'";src:url("'+String(url).replace(/["\\]/g,"")+'");font-display:swap}';doc.head.append(style);}
function applyThemeToPreview(){const doc=frame.contentDocument;if(!doc)return;const theme=draft.theme||{};if(theme.gold)doc.documentElement.style.setProperty("--gold",theme.gold);if(theme.paper)doc.documentElement.style.setProperty("--paper",theme.paper);if(theme.ink)doc.documentElement.style.setProperty("--ink",theme.ink);}
function applyDraftToPreview(){
 try{const doc=frame.contentDocument;if(!doc?.body)return;draft.elements.forEach(item=>applyItem(doc,item));applyOrder(doc);applyThemeToPreview();if(selectedSelector)highlightSelected();}catch(e){setStatus("Preview could not be accessed. Refresh and try again.",true);}
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
 if(new URL(frame.src).searchParams.get("page")!=="home")return;
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
 selectedBaseline={color:toHex(getComputedStyle(node).color),background:toHex(getComputedStyle(node).backgroundColor),fontSize:parseFloat(getComputedStyle(node).fontSize)||"",fontFamily:getComputedStyle(node).fontFamily.split(",")[0].replace(/[\'"]/g,""),fontWeight:getComputedStyle(node).fontWeight,textAlign:getComputedStyle(node).textAlign,borderColor:toHex(getComputedStyle(node).borderColor)};
 $("studioColor").value=selectedBaseline.color||"#171717";
 $("studioBackground").value=selectedBaseline.background||"#ffffff";
 $("studioFontSize").value=selectedBaseline.fontSize||"";
 $("studioFontFamily").value=findItem(selectedSelector)?.fontFamily||selectedBaseline.fontFamily||"";
 $("studioFontWeight").value=findItem(selectedSelector)?.fontWeight||"";
 $("studioTextAlign").value=findItem(selectedSelector)?.textAlign||"";
 $("studioBorderColor").value=findItem(selectedSelector)?.borderColor||selectedBaseline.borderColor||"#c9a45c";
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
 const family=$("studioFontFamily").value.trim();if(family&&family!==selectedBaseline.fontFamily)item.fontFamily=family;
 const weight=$("studioFontWeight").value;if(weight&&weight!==selectedBaseline.fontWeight)item.fontWeight=weight;
 const align=$("studioTextAlign").value;if(align&&align!==selectedBaseline.textAlign)item.textAlign=align;
 const border=$("studioBorderColor").value;if(border&&border!==selectedBaseline.borderColor)item.borderColor=border;
 if(studioUploadedFontUrl&&family)item.fontUrl=studioUploadedFontUrl;
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
 selectedSelector="";frame.src="index.html?page=home&pageId="+encodeURIComponent(studioPages.find(p=>p.slug==="home")?.id||"")+"&studioPreview=1&refresh="+Date.now();setStatus("Element reset in preview. Save draft to keep the reset.");
}
async function loadStudio(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){setStatus("Please sign in to the admin panel first.",true);return;}
 const {data:role,error:roleError}=await supabase.rpc("current_staff_role");
 if(roleError||role!=="owner"){setStatus("Website Studio is available to the Owner account only.",true);document.querySelector('[data-view="website-studio"]')?.remove();return;}
 const {data,error}=await supabase.from("site_studio_settings").select("*").eq("id","homepage").maybeSingle();
 if(error){setStatus("Studio database setup issue: "+error.message,true);return;}
 draft=normalize(data?.draft_content||emptyDraft());$("studioThemeGold").value=draft.theme.gold||"#c9a45c";$("studioThemePaper").value=draft.theme.paper||"#f7f5f0";$("studioThemeInk").value=draft.theme.ink||"#11110f";
 $("studioLastPublished").textContent="Published version: "+(data?.published_at?new Date(data.published_at).toLocaleString():"Not published yet");
 setStatus(data?.updated_at?"Draft loaded. Select an element in the preview to begin.":"Ready. Your first draft has not been saved yet.");
 await loadVersions();await initPageBuilder();if(frame.contentDocument?.readyState==="complete")attachPreviewEditor();
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

let studioUploadedFontUrl="";
function setAssetMessage(message,error=false){const el=$("studioAssetMessage");if(el){el.textContent=message;el.classList.toggle("is-error",error);}}
async function uploadStudioAsset(file,kind){if(!file){setAssetMessage("Choose a file first.",true);return;}const isFont=kind==="font";const allowed=isFont?/\\.(woff2?|ttf|otf)$/i.test(file.name):/^image\\/(png|jpeg|webp)$/.test(file.type);if(!allowed){setAssetMessage(isFont?"Use WOFF, WOFF2, TTF or OTF font files.":"Use PNG, JPG or WebP images.",true);return;}if(file.size>(isFont?8:15)*1024*1024){setAssetMessage("File is too large. Maximum size: "+(isFont?8:15)+" MB.",true);return;}const button=$(isFont?"studioUploadFontBtn":"studioUploadImageBtn");button.disabled=true;setAssetMessage("Uploading "+file.name+"…");try{const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-").slice(-90);const path="studio-uploads/"+crypto.randomUUID()+"-"+safe;const {data,error}=await supabase.storage.from("website-images").upload(path,file,{cacheControl:"31536000",upsert:false,contentType:file.type||undefined});if(error)throw error;const publicData=supabase.storage.from("website-images").getPublicUrl(data.path).data;$("studioAssetUrl").value=publicData.publicUrl;if(isFont){studioUploadedFontUrl=publicData.publicUrl;$("studioUseFont").disabled=false;$("studioUseImage").disabled=true;}else{$("studioUseImage").disabled=false;$("studioUseFont").disabled=true;} $("studioCopyAsset").disabled=false;setAssetMessage("Uploaded successfully. Apply this file to your selected element.");}catch(error){setAssetMessage("Upload failed: "+(error.message||"Please try again."),true);}finally{button.disabled=false;}}
$("studioUploadImageBtn")?.addEventListener("click",()=>uploadStudioAsset($("studioImageUpload").files[0],"image"));
$("studioUploadFontBtn")?.addEventListener("click",()=>uploadStudioAsset($("studioFontUpload").files[0],"font"));
$("studioUseImage")?.addEventListener("click",()=>{if(!selectedSelector){setAssetMessage("Select an image element in the preview first.",true);return;}const node=frame.contentDocument?.querySelector(selectedSelector);if(!node||node.tagName!=="IMG"){$("studioImage").value=$("studioAssetUrl").value;setAssetMessage("URL placed in the image field. Select an image element to apply it.");return;}$("studioImage").value=$("studioAssetUrl").value;applyCurrent();});
$("studioUseFont")?.addEventListener("click",()=>{if(!selectedSelector){setAssetMessage("Select a text element in the preview first.",true);return;}const family=prompt("Enter a name for this custom font:","AURK Custom Font");if(!family?.trim())return;$("studioFontFamily").value=family.trim();studioUploadedFontUrl=$("studioAssetUrl").value;applyCurrent();setAssetMessage("Custom font applied. Save your draft to keep it.");});
$("studioCopyAsset")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("studioAssetUrl").value);setAssetMessage("Asset URL copied.");}catch{setAssetMessage("Select and copy the URL from the field above.");}});
$("studioApplyTheme")?.addEventListener("click",()=>{draft.theme={gold:$("studioThemeGold").value,paper:$("studioThemePaper").value,ink:$("studioThemeInk").value};applyThemeToPreview();setStatus("Website-wide colours applied to preview. Save draft to keep them.");});
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
let studioPages=[],activeStudioPage=null,pageDraft={sections:[]},selectedBlockId=null,pageBuilderInitialized=false;
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
 if(draftResult.error||publishedResult.error){pageMessage("Page builder could not load: "+(draftResult.error||publishedResult.error).message,true);return;}
 const publishedById=new Map((publishedResult.data||[]).map(p=>[p.id,p]));
 studioPages=(draftResult.data||[]).map(d=>({...d,...(publishedById.get(d.id)||{}),draft_slug:d.draft_slug,draft_title:d.draft_title,draft_content:d.draft_content,draft_meta_description:d.draft_meta_description,draft_meta_title:d.draft_meta_title,draft_meta_keywords:d.draft_meta_keywords,draft_og_image_url:d.draft_og_image_url,draft_show_in_nav:d.draft_show_in_nav}));
 if(!studioPages.some(p=>p.slug==="home")){
  pageMessage("Homepage page record is missing. Refresh and try again.",true);return;
 }
 const select=$("studioPageSelect");select.innerHTML="";
 studioPages.forEach(p=>{const opt=document.createElement("option");opt.value=p.id;opt.textContent=p.slug==="home"?"Homepage":p.draft_title||p.title;select.append(opt);});
 select.addEventListener("change",()=>{const p=studioPages.find(x=>x.id===select.value);if(p)selectStudioPage(p);});
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
 previewStudioPage();
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
 fields.forEach(([key,labelText])=>{
  const label=document.createElement("label");label.textContent=labelText;
  let input;
  if(key==="body"){input=document.createElement("textarea");input.rows=4;}
  else if(key==="background_color"){input=document.createElement("input");input.type="color";}
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
 const draftPayload={draft_title:title,draft_slug:slug,draft_meta_description:$("studioPageMeta").value.trim(),draft_meta_title:$("studioPageSeoTitle").value.trim(),draft_meta_keywords:$("studioPageKeywords").value.trim(),draft_og_image_url:$("studioPageOgImage").value.trim(),draft_show_in_nav:activeStudioPage.slug==="home"?false:$("studioPageNav").checked,draft_nav_order:Math.max(0,Math.min(99,Number($("studioPageNavOrder").value)||0)),draft_content:pageDraft,updated_by:user?.id,updated_at:now};
 const {data:draftData,error}=await supabase.from("site_studio_page_drafts").update(draftPayload).eq("id",activeStudioPage.id).select("*").single();
 if(error){button.disabled=false;pageMessage("Could not save page draft: "+error.message,true);return;}
 if(publish){
  const publicPayload={id:activeStudioPage.id,slug,title,published_content:pageDraft,status:"published",show_in_nav:draftPayload.draft_show_in_nav,nav_order:draftPayload.draft_nav_order,meta_description:draftPayload.draft_meta_description,meta_title:draftPayload.draft_meta_title,meta_keywords:draftPayload.draft_meta_keywords,og_image_url:draftPayload.draft_og_image_url,published_at:now};
  const {error:publishError}=await supabase.from("site_studio_pages").upsert(publicPayload,{onConflict:"id"});
  if(publishError){button.disabled=false;pageMessage("Draft saved, but publishing failed: "+publishError.message,true);return;}
 }
 button.disabled=false;
 const publishedData=publish?{slug,title,status:"published",show_in_nav:draftPayload.draft_show_in_nav,nav_order:activeStudioPage.nav_order??studioPages.indexOf(activeStudioPage),meta_description:draftPayload.draft_meta_description,meta_title:draftPayload.draft_meta_title,meta_keywords:draftPayload.draft_meta_keywords,og_image_url:draftPayload.draft_og_image_url,published_content:pageDraft,published_at:now}:{};
 activeStudioPage={...activeStudioPage,...draftData,...publishedData};
 studioPages=studioPages.map(p=>p.id===activeStudioPage.id?activeStudioPage:p);
 const option=$("studioPageSelect").querySelector('option[value="'+activeStudioPage.id+'"]');if(option)option.textContent=activeStudioPage.draft_title;
 $("studioPageState").textContent=activeStudioPage.status==="published"?(publish?"Published just now":"Published page — draft edits stay private"):"Unpublished draft";
 pageMessage(publish?"Page published successfully. It is now available on your website.":"Page draft saved. Visitors will continue seeing the last published version.");
 if(publish)previewStudioPage();
}
function previewStudioPage(){
 if(!activeStudioPage)return;
 frame.src="index.html?page="+encodeURIComponent(activeStudioPage.draft_slug||activeStudioPage.slug)+"&pageId="+encodeURIComponent(activeStudioPage.id)+"&studioPreview=1&refresh="+Date.now();
 $("studioSelectorLabel").value="";selectedSelector="";
}

loadStudio();
