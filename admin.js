import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const loginPanel=document.getElementById("loginPanel"), dashboard=document.getElementById("dashboard");
const loginMessage=document.getElementById("loginMessage"), uploadMessage=document.getElementById("uploadMessage");
if(SUPABASE_URL.startsWith("PASTE_")||SUPABASE_ANON_KEY.startsWith("PASTE_")){
 loginMessage.textContent="Setup required: add your Supabase URL and anon key in config.js, then follow SETUP.md.";
 throw new Error("Supabase config missing");
}
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentRole=null;
const roleViews={owner:['overview','website-studio','products','competitors','orders','customers','reports','finance','staff','reviews'],manager:['overview','orders','customers','reports','finance'],sales_staff:['overview','orders','customers'],product_staff:['overview','products']};
const canView=view=>(roleViews[currentRole]||[]).includes(view);
function applyRolePermissions(){
 document.querySelectorAll('[data-view]').forEach(b=>{b.hidden=!canView(b.dataset.view);});
 document.querySelectorAll('[data-section]').forEach(s=>{if(!canView(s.dataset.section))s.hidden=true;});
 document.querySelectorAll('[data-quick-view]').forEach(b=>{if(!canView(b.dataset.quickView))b.hidden=true;});
 const costLabel=document.getElementById('pCost')?.closest('label');if(costLabel)costLabel.hidden=currentRole!=='owner';
 const expenseFormEl=document.getElementById('expenseForm');if(expenseFormEl)expenseFormEl.hidden=currentRole!=='owner';
 window.AURK_CURRENT_ROLE=currentRole;window.AURK_ROLE_VIEWS=roleViews;
}
async function refreshSession(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){currentRole=null;window.AURK_CURRENT_ROLE=null;productCostMap=new Map();loginPanel.hidden=false;dashboard.hidden=true;return;}
 const {data:role,error}=await supabase.rpc('current_staff_role');
 if(error||!role||!roleViews[role]){await supabase.auth.signOut();currentRole=null;window.AURK_CURRENT_ROLE=null;loginPanel.hidden=false;dashboard.hidden=true;loginMessage.textContent='This account has no AUR-K EV staff role. Ask the Owner to assign access.';return;}
 currentRole=role;window.AURK_CURRENT_ROLE=currentRole;if(!['owner','manager'].includes(currentRole))productCostMap=new Map();loginPanel.hidden=true;dashboard.hidden=false;
 const profile=document.getElementById('adminEmail');if(profile)profile.textContent=(session.user?.email||'Signed in')+' • '+role.replaceAll('_',' ');
 applyRolePermissions();
 if(['owner','product_staff'].includes(currentRole)){loadImages();loadModelMediaOptions();}
 if(['owner','manager'].includes(currentRole))await loadProductCostMap();
 if(canView('staff'))loadStaff();
 if(currentRole==='owner')loadCompetitorAdmin();
 if(currentRole==='owner')loadReviews();
}
supabase.auth.onAuthStateChange(()=>refreshSession());
document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault();loginMessage.textContent="Signing in…";const {error}=await supabase.auth.signInWithPassword({email:document.getElementById("email").value,password:document.getElementById("password").value});loginMessage.textContent=error?error.message:"";await refreshSession();});
document.getElementById("logout").addEventListener("click",async()=>{await supabase.auth.signOut();await refreshSession();});
document.getElementById("uploadForm").addEventListener("submit",async e=>{e.preventDefault();uploadMessage.textContent="Uploading…";const file=document.getElementById("imageFile").files[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)){uploadMessage.textContent="Please choose JPG, PNG or WebP.";return;}if(file.size>8*1024*1024){uploadMessage.textContent="Image must be smaller than 8 MB.";return;}const ext=file.name.split(".").pop().toLowerCase(),path=`${crypto.randomUUID()}.${ext}`;const {error:upErr}=await supabase.storage.from("website-images").upload(path,file,{upsert:false,contentType:file.type});if(upErr){uploadMessage.textContent=upErr.message;return;}const {data:{publicUrl}}=supabase.storage.from("website-images").getPublicUrl(path);const slot=document.getElementById("imageSlot").value;const {error:dbErr}=await supabase.from("site_images").insert({title:document.getElementById("imageTitle").value,slot,product_name:document.getElementById("productName").value,storage_path:path,public_url:publicUrl});if(dbErr){await supabase.storage.from("website-images").remove([path]);uploadMessage.textContent=dbErr.message;return;}uploadMessage.textContent="Image uploaded successfully. Refresh your website to see it.";e.target.reset();await loadImages();});
async function loadImages(){const list=document.getElementById("imageList");list.textContent="Loading…";const {data,error}=await supabase.from("site_images").select("*").order("created_at",{ascending:false});if(error){list.textContent=error.message;return;}list.innerHTML="";if(!data?.length){list.textContent="No uploaded images yet.";return;}for(const item of data){const card=document.createElement("article");card.className="image-item";const img=document.createElement("img");img.src=item.public_url;img.alt=item.title;const body=document.createElement("div");const title=document.createElement("strong");title.textContent=item.title;const meta=document.createElement("small");meta.textContent=`${item.slot}${item.product_name?" • "+item.product_name:""}`;const del=document.createElement("button");del.className="delete-btn";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm(`Delete ${item.title}?`))return;const {error:dbError}=await supabase.from("site_images").delete().eq("id",item.id);if(dbError){alert(dbError.message);return;}await supabase.storage.from("website-images").remove([item.storage_path]);await loadImages();});body.append(title,meta,del);card.append(img,body);list.append(card);}await refreshHomepageImageOptions();}
async function refreshHomepageImageOptions(){
 const select=document.getElementById("homepageImageSelect");if(!select)return;
 const {data,error}=await supabase.from("site_images").select("id,title,slot,product_name,storage_path,public_url").order("created_at",{ascending:false});
 if(error){select.innerHTML='<option value="">Could not load images</option>';return;}
 const images=data||[];select.innerHTML='';
 if(!images.length){select.innerHTML='<option value="">Upload an image first</option>';return;}
 images.forEach(item=>{const option=document.createElement("option");option.value=item.id;option.textContent=item.title+" — "+item.slot+(item.product_name?" • "+item.product_name:"");option.dataset.url=item.public_url;select.append(option);});
 const current=images.find(x=>x.slot==="hero");if(current)select.value=current.id;updateHomepageImagePreview();
}
function updateHomepageImagePreview(){
 const select=document.getElementById("homepageImageSelect"),preview=document.getElementById("homepageImagePreview");if(!select||!preview)return;
 const url=select.selectedOptions[0]?.dataset.url;preview.innerHTML="";
 if(!url){preview.textContent="Select an image to preview it.";return;}
 const img=document.createElement("img");img.src=url;img.alt="Homepage image preview";preview.append(img);
}
document.getElementById("homepageHeroUploadForm")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const message=document.getElementById("homepageHeroUploadMessage"),file=document.getElementById("homepageHeroFile").files[0],title=document.getElementById("homepageHeroTitle").value.trim();
 if(!file)return;
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)){message.textContent="Please choose JPG, PNG or WebP.";return;}
 if(file.size>8*1024*1024){message.textContent="Image must be smaller than 8 MB.";return;}
 message.textContent="Uploading image…";
 const ext=file.name.split(".").pop().toLowerCase(),path="homepage-"+crypto.randomUUID()+"."+ext;
 const {error:upErr}=await supabase.storage.from("website-images").upload(path,file,{upsert:false,contentType:file.type});
 if(upErr){message.textContent=upErr.message;return;}
 const {data:{publicUrl}}=supabase.storage.from("website-images").getPublicUrl(path);
 const {error:dbErr}=await supabase.from("site_images").insert({title,slot:"hero",product_name:null,storage_path:path,public_url:publicUrl});
 if(dbErr){await supabase.storage.from("website-images").remove([path]);message.textContent=dbErr.message;return;}
 message.textContent="Uploaded and set as homepage image successfully.";
 e.target.reset();await loadImages();await refreshHomepageImageOptions();
});
document.getElementById("homepageImageSelect")?.addEventListener("change",updateHomepageImagePreview);
document.getElementById("setHomepageImage")?.addEventListener("click",async()=>{
 const select=document.getElementById("homepageImageSelect"),message=document.getElementById("homepageImageMessage"),id=select?.value;
 if(!id){message.textContent="Please choose an uploaded image.";return;}
 const {data:chosen,error:readError}=await supabase.from("site_images").select("title,product_name,storage_path,public_url").eq("id",id).single();
 if(readError||!chosen){message.textContent=readError?.message||"Image not found.";return;}
 message.textContent="Applying homepage image…";
 const {error}=await supabase.from("site_images").insert({title:chosen.title,slot:"hero",product_name:chosen.product_name,storage_path:chosen.storage_path,public_url:chosen.public_url});
 if(error){message.textContent="Could not set homepage image: "+error.message;return;}
 message.textContent="Homepage image updated. Refresh the live website to see it.";await loadImages();
});
refreshSession();
// Product catalogue manager (requires the included product-table migration).
let editingProductId=null;
const productForm=document.getElementById('productForm');
async function loadProducts(){const list=document.getElementById('productList');if(!list)return;list.textContent='Loading…';const {data,error}=await supabase.from('site_products').select('id,name,category,tag,price_text,description,image_url,specifications,featured,created_at').order('created_at',{ascending:false});if(error){list.textContent='Product table setup required: '+error.message;return;}if(currentRole==='owner'){const {data:costRows}=await supabase.from('site_product_costs').select('product_id,purchase_cost');productCostMap=new Map((costRows||[]).map(c=>[String(c.product_id),c.purchase_cost===null?null:Number(c.purchase_cost)]));}const products=(data||[]).map(p=>({...p,purchase_cost:productCostMap.get(String(p.id))??null}));list.innerHTML='';if(!products.length){list.textContent='No products added yet.';return;}for(const p of products){const card=document.createElement('article');card.className='image-item';if(p.image_url){const img=document.createElement('img');img.src=p.image_url;img.alt=p.name;card.append(img);}const body=document.createElement('div');const title=document.createElement('strong');title.textContent=p.name;const meta=document.createElement('small');meta.textContent=(p.category||'')+' • '+(p.price_text||'Price on enquiry')+(p.purchase_cost!==null&&p.purchase_cost!==undefined?' • Cost: '+money(p.purchase_cost):' • Cost not set')+(p.featured?' • Featured':'');const edit=document.createElement('button');edit.className='outline-btn';edit.textContent='Edit';edit.onclick=()=>{editingProductId=p.id;document.getElementById('pName').value=p.name||'';document.getElementById('pCategory').value=p.category||'premium';document.getElementById('pTag').value=p.tag||'';document.getElementById('pPrice').value=p.price_text||'';document.getElementById('pCost').value=p.purchase_cost??'';document.getElementById('pDescription').value=p.description||'';document.getElementById('pImage').value=p.image_url||'';document.getElementById('pSpecs').value=p.specifications||'';document.getElementById('pFeatured').checked=!!p.featured;document.getElementById('pCancel').hidden=false;window.scrollTo({top:productForm.offsetTop,behavior:'smooth'});};const del=document.createElement('button');del.className='delete-btn';del.textContent='Delete';del.onclick=async()=>{if(!confirm('Delete '+p.name+'?'))return;const {error}=await supabase.from('site_products').delete().eq('id',p.id);if(error){alert(error.message);return;}loadProducts();};body.append(title,meta,edit,del);card.append(body);list.append(card);}}
if(productForm){productForm.addEventListener('submit',async e=>{e.preventDefault();const row={name:document.getElementById('pName').value.trim(),category:document.getElementById('pCategory').value,tag:document.getElementById('pTag').value.trim(),price_text:document.getElementById('pPrice').value.trim()||'Ask for price',description:document.getElementById('pDescription').value.trim(),image_url:document.getElementById('pImage').value.trim(),specifications:document.getElementById('pSpecs').value.trim(),featured:document.getElementById('pFeatured').checked};const msg=document.getElementById('productMessage');msg.textContent='Saving…';const result=editingProductId?await supabase.from('site_products').update(row).eq('id',editingProductId).select('id').single():await supabase.from('site_products').insert(row).select('id').single();if(result.error){msg.textContent=result.error.message;return;}const savedId=result.data?.id||editingProductId;if(currentRole==='owner'&&savedId){const rawCost=document.getElementById('pCost').value.trim();const costRow={product_id:savedId,purchase_cost:rawCost===''?null:Number(rawCost)};const {error:costError}=await supabase.from('site_product_costs').upsert(costRow,{onConflict:'product_id'});if(costError){msg.textContent='Product saved, but purchase cost could not be saved: '+costError.message;return;}productCostMap.set(String(savedId),costRow.purchase_cost);}msg.textContent='Product saved.';productForm.reset();editingProductId=null;document.getElementById('pCancel').hidden=true;loadProducts();});document.getElementById('pCancel').onclick=()=>{productForm.reset();editingProductId=null;document.getElementById('pCancel').hidden=true;};}
const originalRefresh=refreshSession;
// load product list whenever authenticated dashboard is shown
const productObserver=new MutationObserver(()=>{if(!dashboard.hidden&&canView('products'))loadProducts();});productObserver.observe(dashboard,{attributes:true,attributeFilter:['hidden']});

// Customer order management: delivery progress + printable invoices.
const ordersList=document.getElementById('ordersList');
const ordersMessage=document.getElementById('ordersMessage');
const ORDER_STATUSES=['New','Confirmed','Processing','Dispatched','Delivered','Cancelled'];
const escHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const priceNumber=value=>{const m=String(value??'').match(/^\s*(?:Rs\.?|PKR)?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i);return m?Number(m[1].replace(/,/g,'')):null;};
const money=value=>'PKR '+Number(value).toLocaleString('en-PK',{maximumFractionDigits:2});
function progressMarkup(status){
 if(status==='Cancelled')return '<div class="order-progress cancelled"><strong>Order cancelled</strong></div>';
 const current=Math.max(0,ORDER_STATUSES.slice(0,5).indexOf(status));
 return `<div class="order-progress" aria-label="Delivery progress">${ORDER_STATUSES.slice(0,5).map((step,i)=>`<div class="progress-step ${i<=current?'done':''}"><span>${i+1}</span><small>${step}</small></div>`).join('')}</div>`;
}
function paymentBreakdownMarkup(order,totals=orderTotals(order)){
 const raw=order.payment_method||'Cash on Delivery';
 const method=raw==='Cash on Delivery'?'Cash':raw;
 const total=order.subtotal_amount??totals.subtotal;
 const value=(n)=>n===null||n===undefined||n===''?'—':money(n);
 const rows=[
  ['Payment method',method],
  ['Selected credit duration',order.credit_duration_months?order.credit_duration_months+' months':'—'],
  ['Cash down payment',method==='Both'?value(order.cash_down_payment_amount):'—'],
  ['Remaining credit balance',method==='Credit'||method==='Both'?value(order.credit_balance_amount):'—'],
  ['Monthly installment',method==='Credit'||method==='Both'?(order.monthly_installment_amount===null||order.monthly_installment_amount===undefined?'To be confirmed':money(order.monthly_installment_amount)+' / month'):'—'],
  ['Order total',value(total)]
 ];
 return '<div class="order-payment-breakdown"><strong class="order-payment-title">Payment breakdown</strong>'+rows.map(([label,val])=>'<div class="order-payment-row"><span>'+escHtml(label)+'</span><b>'+escHtml(val)+'</b></div>').join('')+'</div>';
}
function orderTotals(order){
 const rows=(Array.isArray(order.items)?order.items:[]).map(item=>{const qty=Number(item.quantity)||1;const unit=priceNumber(item.price_text);return {name:item.name||'Product',qty,price:item.price_text||'To be confirmed',line:unit===null?null:unit*qty};});
 const subtotal=rows.every(r=>r.line!==null)?rows.reduce((sum,r)=>sum+r.line,0):null;
 const delivery=order.delivery_charge===null||order.delivery_charge===undefined?null:Number(order.delivery_charge);
 const final=subtotal!==null&&delivery!==null?subtotal+delivery:null;
 return {rows,subtotal,delivery,final};
}
function printInvoice(order){
 const {rows,subtotal,delivery,final}=orderTotals(order);
 const w=window.open('','_blank','width=850,height=900');
 if(!w){alert('Please allow pop-ups to print the invoice.');return;}
 const paymentMethod=order.payment_method==='Cash on Delivery'?'Cash':(order.payment_method||'Cash');const paymentDetails=[['Payment method',paymentMethod],['Selected credit duration',order.credit_duration_months?order.credit_duration_months+' months':'—'],['Cash down payment',paymentMethod==='Both'&&order.cash_down_payment_amount!==null?money(order.cash_down_payment_amount):'—'],['Remaining credit balance',['Credit','Both'].includes(paymentMethod)&&order.credit_balance_amount!==null?money(order.credit_balance_amount):'—'],['Monthly installment',['Credit','Both'].includes(paymentMethod)&&order.monthly_installment_amount!==null?money(order.monthly_installment_amount)+' / month':'—'],['Order total',subtotal===null?'Price unavailable':money(subtotal)]];const paymentTable='<h2>Payment breakdown</h2><table><tbody>'+paymentDetails.map(([label,value])=>'<tr><th>'+escHtml(label)+'</th><td>'+escHtml(value)+'</td></tr>').join('')+'</tbody></table>';
 const invoice=`<!doctype html><html><head><meta charset="utf-8"><title>AUR-K EV Invoice</title><style>body{font:14px Arial,sans-serif;color:#222;margin:36px}header{display:flex;justify-content:space-between;border-bottom:3px solid #c9a45c;padding-bottom:18px}h1{margin:0;color:#171717}h2{font-size:16px;margin:28px 0 10px}.muted{color:#666;line-height:1.6}.ref{font-weight:bold;color:#9b7738}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:12px;border-bottom:1px solid #ddd;text-align:left}th{background:#f5f1e8}.right{text-align:right}.total{font-size:16px;font-weight:bold;margin-top:18px;text-align:right}.footer{margin-top:45px;border-top:1px solid #ddd;padding-top:14px;color:#777;font-size:12px}@media print{body{margin:18mm}}</style></head><body><header><div><h1>AUR-K EV</h1><div class="muted">EV BIKE EXPERTS<br>Mansoorabad, Near Total Petrol Pump,<br>Jhumra Road, Faisalabad, Pakistan<br>WhatsApp / Call: 0323-9661747</div></div><div class="right"><h1>ORDER INVOICE</h1><p class="ref">${escHtml(order.id)}</p><div class="muted">Date: ${escHtml(new Date(order.created_at||Date.now()).toLocaleString())}<br>Status: ${escHtml(order.status||'New')}<br>Payment: ${escHtml(paymentMethod)}</div></div></header><h2>Customer details</h2><p>${escHtml(order.customer_name)}<br>${escHtml(order.customer_phone)}<br>${escHtml(order.delivery_address)}${order.city?', '+escHtml(order.city):''}<br>Note: ${escHtml(order.customer_note||'None')}</p><h2>Order items</h2><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th class="right">Line total</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escHtml(r.name)}</td><td>${r.qty}</td><td>${escHtml(r.price)}</td><td class="right">${r.line===null?'Price unavailable':money(r.line)}</td></tr>`).join('')}</tbody></table>${paymentTable}<p class="total">Subtotal: ${subtotal===null?'Price unavailable':money(subtotal)}<br>Delivery charges: ${delivery===null?'Not set':money(delivery)}<br>Final amount payable: ${final===null?'Not ready — set a numeric product price and delivery charge':money(final)}</p><div class="footer">Thank you for choosing AUR-K EV.</div><script>window.onload=()=>window.print();</script></body></html>`;
 w.document.open();w.document.write(invoice);w.document.close();
}
function renderAnalytics(data){
 const el=document.getElementById('salesAnalytics');if(!el)return;
 const total=data.length,delivered=data.filter(o=>o.status==='Delivered'),pending=data.filter(o=>!['Delivered','Cancelled'].includes(o.status||'New'));
 const revenue=delivered.reduce((sum,o)=>sum+(Number(o.final_amount)||0),0);
 const tiles=[['Total orders',total],['Delivered revenue',money(revenue)],['Awaiting delivery',pending.length],['Delivered',delivered.length]];
 el.innerHTML=tiles.map(([label,value])=>`<div class="analytics-tile"><small>${label}</small><strong>${value}</strong></div>`).join('');
 updateDashboardWidgets(data);
}

let cachedOrders=[];
function updateDashboardWidgets(data){
 const rows=Array.isArray(data)?data:[];
 const pending=rows.filter(o=>!['Delivered','Cancelled'].includes(o.status||'New'));
 const fresh=rows.filter(o=>(o.status||'New')==='New');
 const count=document.getElementById('notificationCount');if(count)count.textContent=String(pending.length);
 const note=document.getElementById('notificationText');if(note)note.textContent=pending.length?`${pending.length} order(s) are awaiting completion; ${fresh.length} new order(s) need review.`:'No pending orders. Your order queue is clear.';
 const title=document.getElementById('overviewAlertTitle'),message=document.getElementById('overviewAlertText'),alertBox=document.getElementById('overviewAlert');
 if(title)title.textContent=fresh.length?`${fresh.length} new order(s) need attention`:pending.length?`${pending.length} order(s) in progress`:'You are all caught up';
 if(message)message.textContent=pending.length?`There are ${pending.length} orders not yet delivered or cancelled. Review their status in Order Management.`:'There are no pending orders at the moment.';
 if(alertBox)alertBox.classList.toggle('has-alert',pending.length>0);
}
function csvCell(value){const s=String(value??'');return '"'+s.replace(/"/g,'""')+'"';}
function downloadCsv(filename,rows){
 const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function reportOrders(data){
 const mode=document.getElementById('reportPeriod')?.value||'all';
 const day=document.getElementById('reportDay')?.value||'';
 const month=document.getElementById('reportMonth')?.value||'';
 const year=document.getElementById('reportYear')?.value||'';
 return data.filter(o=>{
  const d=new Date(o.created_at||0);if(Number.isNaN(d.getTime()))return false;
  const yyyy=String(d.getFullYear()),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
  if(mode==='day')return !day||`${yyyy}-${mm}-${dd}`===day;
  if(mode==='month')return !month||`${yyyy}-${mm}`===month;
  if(mode==='year')return !year||yyyy===String(year);
  return true;
 });
}
function renderCustomerAndReports(data){
 cachedOrders=Array.isArray(data)?data:[];
 const groups=new Map();
 for(const o of cachedOrders){
  const phone=String(o.customer_phone||'').trim();const key=phone.replace(/\D/g,'')||String(o.customer_name||'').trim().toLowerCase()||String(o.id);
  if(!groups.has(key))groups.set(key,{name:o.customer_name||'Customer',phone,orders:[],last:o.created_at||''});
  const g=groups.get(key);g.orders.push(o);if(new Date(o.created_at||0)>new Date(g.last||0))g.last=o.created_at||g.last;
 }
 const customers=[...groups.values()].sort((a,b)=>b.orders.length-a.orders.length||new Date(b.last)-new Date(a.last));
 const repeat=customers.filter(c=>c.orders.length>1).length;
 const summary=document.getElementById('customerSummary');
 if(summary)summary.innerHTML=[['Unique customers',customers.length],['Repeat customers',repeat],['Orders per customer',customers.length?(cachedOrders.length/customers.length).toFixed(1):'0']].map(([l,v])=>`<div class="analytics-tile"><small>${l}</small><strong>${v}</strong></div>`).join('');
 const list=document.getElementById('customerList');
 if(list){
  if(!customers.length)list.innerHTML='<p class="muted">No customer orders yet.</p>';
  else list.innerHTML=`<table class="customer-table"><thead><tr><th>Customer</th><th>Mobile</th><th>Total orders</th><th>Delivered revenue</th><th>Last order</th></tr></thead><tbody>${customers.map(c=>{const revenue=c.orders.filter(o=>o.status==='Delivered').reduce((s,o)=>s+(Number(o.final_amount)||0),0);return `<tr><td>${escHtml(c.name)}</td><td>${escHtml(c.phone)}</td><td>${c.orders.length}</td><td>${money(revenue)}</td><td>${c.last?new Date(c.last).toLocaleDateString():'—'}</td></tr>`;}).join('')}</tbody></table>`;
 }
 const filtered=reportOrders(cachedOrders);
 const delivered=filtered.filter(o=>o.status==='Delivered');
 const revenue=delivered.reduce((s,o)=>s+(Number(o.final_amount)||0),0);
 const outstanding=filtered.filter(o=>!['Delivered','Cancelled'].includes(o.status||'New')).length;
 const report=document.getElementById('reportSummary');
 if(report)report.innerHTML=[['Orders in period',filtered.length],['Delivered revenue',money(revenue)],['Delivered orders',delivered.length],['Awaiting delivery',outstanding]].map(([l,v])=>`<div class="analytics-tile"><small>${l}</small><strong>${v}</strong></div>`).join('');
 const products=new Map();
 for(const o of filtered){for(const item of (Array.isArray(o.items)?o.items:[])){const name=String(item.name||'Product');products.set(name,(products.get(name)||0)+(Number(item.quantity)||1));}}
 const top=[...products.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5);const topEl=document.getElementById('topProducts');
 if(topEl)topEl.innerHTML=top.length?top.map(([name,qty],i)=>`<div class="top-product"><strong>${i+1}. ${escHtml(name)}</strong><small>${qty} unit(s) ordered</small></div>`).join(''):'<p class="muted">No product sales data for this period.</p>';
}
function exportCustomers(){
 const groups=new Map();for(const o of cachedOrders){const phone=String(o.customer_phone||'').trim();const key=phone.replace(/\D/g,'')||String(o.customer_name||'').trim().toLowerCase()||String(o.id);if(!groups.has(key))groups.set(key,{name:o.customer_name||'',phone,orders:[],last:o.created_at||''});const g=groups.get(key);g.orders.push(o);if(new Date(o.created_at||0)>new Date(g.last||0))g.last=o.created_at||g.last;}
 const rows=[['Customer name','Mobile','Total orders','Delivered revenue (PKR)','Last order']];for(const c of groups.values()){const rev=c.orders.filter(o=>o.status==='Delivered').reduce((s,o)=>s+(Number(o.final_amount)||0),0);rows.push([c.name,c.phone,c.orders.length,rev,c.last]);}downloadCsv('AURK-EV-Customers.csv',rows);
}
function exportSales(){
 const data=reportOrders(cachedOrders);const rows=[['Order reference','Order date','Customer','Mobile','Products','Status','Subtotal (PKR)','Delivery charges (PKR)','Final amount (PKR)']];
 for(const o of data){const items=(o.items||[]).map(i=>`${i.name||'Product'} x ${i.quantity||1}`).join('; ');rows.push([o.id,o.created_at,o.customer_name,o.customer_phone,items,o.status||'New',o.subtotal_amount??'',o.delivery_charge??'',o.final_amount??'']);}
 downloadCsv('AURK-EV-Sales-Report.csv',rows);
}
const periodSelect=document.getElementById('reportPeriod');
function updateReportInputs(){const mode=periodSelect?.value||'all';const day=document.getElementById('reportDayWrap'),month=document.getElementById('reportMonthWrap'),year=document.getElementById('reportYearWrap');if(day)day.hidden=mode!=='day';if(month)month.hidden=mode!=='month';if(year)year.hidden=mode!=='year';renderCustomerAndReports(cachedOrders);}
if(periodSelect){const now=new Date();document.getElementById('reportDay').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;document.getElementById('reportMonth').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;document.getElementById('reportYear').value=now.getFullYear();periodSelect.addEventListener('change',updateReportInputs);['reportDay','reportMonth','reportYear'].forEach(id=>document.getElementById(id).addEventListener('change',()=>renderCustomerAndReports(cachedOrders)));}
document.getElementById('exportCustomersCsv')?.addEventListener('click',exportCustomers);
document.getElementById('exportSalesCsv')?.addEventListener('click',exportSales);

// Purchase-cost and business-expense tracking. Costs are private admin data.
let productCostMap=new Map();
let cachedExpenses=[];
async function loadProductCostMap(){
 if(!['owner','manager'].includes(currentRole)){productCostMap=new Map();return null;}
 const {data,error}=await supabase.from('site_product_costs').select('product_id,purchase_cost');
 if(error){productCostMap=new Map();return error;}
 productCostMap=new Map((data||[]).map(p=>[String(p.product_id),p.purchase_cost===null||p.purchase_cost===undefined||p.purchase_cost===''?null:Number(p.purchase_cost)]));
 return null;
}
function calculateOrderCost(order){
 const items=Array.isArray(order.items)?order.items:[];if(!items.length)return null;let total=0;
 for(const item of items){const id=String(item.product_id??'');const cost=productCostMap.get(id);const qty=Number(item.quantity)||1;if(!id||cost===null||cost===undefined||!Number.isFinite(cost)||cost<0)return null;total+=cost*qty;}
 return total;
}
function renderProfitOverview(){
 const el=document.getElementById('profitSummary');if(!el)return;
 const delivered=cachedOrders.filter(o=>o.status==='Delivered'&&o.final_amount!==null&&o.final_amount!==undefined);
 const revenue=delivered.reduce((sum,o)=>sum+Number(o.final_amount||0),0);
 let knownCost=0,knownGross=0,known=0,missing=0;
 for(const o of delivered){const cost=o.cost_of_goods_amount!==null&&o.cost_of_goods_amount!==undefined?Number(o.cost_of_goods_amount):calculateOrderCost(o);if(cost===null||!Number.isFinite(cost)){missing++;continue;}knownCost+=cost;knownGross+=Number(o.final_amount)-cost;known++;}
 const expenses=cachedExpenses.reduce((sum,e)=>sum+Number(e.amount||0),0);
 const net=knownGross-expenses;
 const tiles=[['Delivered revenue',money(revenue)],['Cost of scooters sold',money(knownCost)],['Gross profit (known costs)',money(knownGross)],['Business expenses',money(expenses)],['Net profit (known costs)',money(net)]];
 el.innerHTML=tiles.map(([label,value])=>`<div class="analytics-tile"><small>${label}</small><strong>${value}</strong></div>`).join('');
 const note=document.getElementById('profitNote');if(note){note.textContent=missing?`${missing} delivered order(s) have no saved or calculable purchase cost. Set purchase costs for all products, then use “Save profit” on those orders. Net profit is partial until these costs are recorded.`:`Profit calculated from ${known} delivered order(s). Net profit = gross profit − all recorded expenses.`;}
}
function renderExpenseList(){
 const list=document.getElementById('expenseList');if(!list)return;
 if(!cachedExpenses.length){list.innerHTML='<p class="muted">No expenses recorded yet.</p>';return;}
 list.innerHTML=`<table class="customer-table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th>${currentRole==='owner'?'<th>Action</th>':''}</tr></thead><tbody>${cachedExpenses.map(e=>`<tr><td>${escHtml(e.expense_date||'')}</td><td>${escHtml(e.category||'')}</td><td>${escHtml(e.description||'')}</td><td>${money(e.amount)}</td>${currentRole==='owner'?`<td><button class="delete-btn" type="button" data-expense-id="${escHtml(e.id)}">Delete</button></td>`:''}</tr>`).join('')}</tbody></table>`;
 list.querySelectorAll('[data-expense-id]').forEach(btn=>btn.addEventListener('click',async()=>{if(!confirm('Delete this expense record?'))return;btn.disabled=true;const {error}=await supabase.from('site_expenses').delete().eq('id',btn.dataset.expenseId);btn.disabled=false;if(error){document.getElementById('expenseMessage').textContent='Could not delete expense: '+error.message;return;}await loadExpenses();renderProfitOverview();}));
}
async function loadExpenses(){
 const {data,error}=await supabase.from('site_expenses').select('*').order('expense_date',{ascending:false}).order('created_at',{ascending:false});
 const msg=document.getElementById('expenseMessage');
 if(error){cachedExpenses=[];if(msg)msg.textContent='Expense table setup required: '+error.message;renderExpenseList();return error;}
 cachedExpenses=data||[];if(msg&&msg.textContent.startsWith('Expense table setup'))msg.textContent='';renderExpenseList();return null;
}
const expenseForm=document.getElementById('expenseForm');
if(expenseForm){const dateInput=document.getElementById('expenseDate');if(dateInput)dateInput.value=new Date().toISOString().slice(0,10);expenseForm.addEventListener('submit',async e=>{e.preventDefault();const msg=document.getElementById('expenseMessage');const amount=Number(document.getElementById('expenseAmount').value);if(!Number.isFinite(amount)||amount<=0){msg.textContent='Enter an expense amount greater than zero.';return;}const row={expense_date:dateInput.value,category:document.getElementById('expenseCategory').value,description:document.getElementById('expenseDescription').value.trim(),amount};const btn=expenseForm.querySelector('button[type="submit"]');btn.disabled=true;msg.textContent='Saving expense…';const {error}=await supabase.from('site_expenses').insert(row);btn.disabled=false;if(error){msg.textContent='Could not save expense: '+error.message;return;}msg.textContent='Expense saved.';document.getElementById('expenseDescription').value='';document.getElementById('expenseAmount').value='';await loadExpenses();renderProfitOverview();});}
async function saveOrderProfit(order,button){
 const cost=calculateOrderCost(order);if(cost===null){document.getElementById('ordersMessage').textContent='Purchase cost is missing for one or more products in this order. Set product costs first.';return;}
 const revenue=Number(order.final_amount);if(!Number.isFinite(revenue)){document.getElementById('ordersMessage').textContent='Save the order final amount before saving profit.';return;}
 if(button)button.disabled=true;
 const {error}=await supabase.from('site_orders').update({cost_of_goods_amount:cost,gross_profit_amount:revenue-cost,updated_at:new Date().toISOString()}).eq('id',order.id);
 if(button)button.disabled=false;
 if(error){document.getElementById('ordersMessage').textContent='Could not save profit: '+error.message;return;}
 order.cost_of_goods_amount=cost;order.gross_profit_amount=revenue-cost;if(button){button.disabled=true;button.textContent='Profit saved';}document.getElementById('ordersMessage').textContent='Purchase cost and gross profit saved for this order.';renderProfitOverview();
}

async function loadOrders(){
 if(!ordersList)return;
 ordersList.textContent='Loading orders…';
 const {data,error}=await supabase.from('site_orders').select('*').order('created_at',{ascending:false});
 if(error){ordersList.textContent='Could not load orders: '+error.message;return;}
 cachedOrders=data||[];await loadProductCostMap();if(['owner','manager'].includes(currentRole))await loadExpenses();else{cachedExpenses=[];renderExpenseList();}renderAnalytics(data||[]);renderCustomerAndReports(data||[]);renderProfitOverview();
 if(!data?.length){ordersList.textContent='No customer orders yet.';return;}
 ordersList.innerHTML='';
 for(const order of data){
  const card=document.createElement('article');card.className='order-admin-card';
  const head=document.createElement('div');head.className='order-admin-head';
  const title=document.createElement('strong');title.textContent='Order '+order.id.slice(0,8).toUpperCase();
  const date=document.createElement('small');date.textContent=new Date(order.created_at).toLocaleString();head.append(title,date);
  const details=document.createElement('div');details.className='order-admin-details';
  const items=document.createElement('p');items.textContent=(order.items||[]).map(x=>`${x.name} × ${x.quantity} — ${x.price_text||'Price to be confirmed'}`).join(' | ');
  const customer=document.createElement('p');customer.textContent=`${order.customer_name} • ${order.customer_phone}`;
  const address=document.createElement('p');address.textContent=`${order.delivery_address}${order.city?', '+order.city:''}`;
  const note=document.createElement('p');note.textContent=order.customer_note?`Note: ${order.customer_note}`:'';
  const payment=document.createElement('div');payment.innerHTML=paymentBreakdownMarkup(order);
  details.append(items,customer,address);if(order.customer_note)details.append(note);details.append(payment);
  const progress=document.createElement('div');progress.innerHTML=progressMarkup(order.status||'New');
  const totals=orderTotals(order);
  const priceSummary=document.createElement('p');priceSummary.className='order-price-summary';priceSummary.textContent=`Subtotal: ${totals.subtotal===null?'Price unavailable':money(totals.subtotal)} • Delivery: ${totals.delivery===null?'Not set':money(totals.delivery)} • Final: ${totals.final===null?'Not set':money(totals.final)}`;details.append(priceSummary);
  const controls=document.createElement('div');controls.className='order-admin-controls';
  const deliveryWrap=document.createElement('label');deliveryWrap.className='delivery-charge-field';deliveryWrap.textContent='Delivery charges (Rs.) ';
  const deliveryInput=document.createElement('input');deliveryInput.type='number';deliveryInput.min='0';deliveryInput.step='1';deliveryInput.placeholder='Enter delivery';deliveryInput.value=order.delivery_charge??'';deliveryInput.setAttribute('aria-label','Delivery charges in rupees');deliveryWrap.append(deliveryInput);
  const saveAmount=document.createElement('button');saveAmount.type='button';saveAmount.className='gold-btn';saveAmount.textContent='Save amount';
  saveAmount.addEventListener('click',async()=>{const subtotalNow=orderTotals(order).subtotal;const charge=deliveryInput.value.trim()===''?null:Number(deliveryInput.value);if(subtotalNow===null){ordersMessage.textContent='Cannot calculate total: enter numeric product prices in Product management first.';return;}if(charge===null||!Number.isFinite(charge)||charge<0){ordersMessage.textContent='Enter delivery charges as zero or a positive amount.';return;}saveAmount.disabled=true;const final=subtotalNow+charge;const patch={subtotal_amount:subtotalNow,delivery_charge:charge,final_amount:final,updated_at:new Date().toISOString()};const knownCost=calculateOrderCost(order);if(order.status==='Delivered'&&knownCost!==null){patch.cost_of_goods_amount=knownCost;patch.gross_profit_amount=final-knownCost;}const {error}=await supabase.from('site_orders').update(patch).eq('id',order.id);saveAmount.disabled=false;if(error){ordersMessage.textContent='Could not save amount: '+error.message;return;}order.subtotal_amount=subtotalNow;order.delivery_charge=charge;order.final_amount=final;if(patch.cost_of_goods_amount!==undefined){order.cost_of_goods_amount=patch.cost_of_goods_amount;order.gross_profit_amount=patch.gross_profit_amount;}priceSummary.textContent=`Subtotal: ${money(subtotalNow)} • Delivery: ${money(charge)} • Final: ${money(final)}`;ordersMessage.textContent='Delivery charges and final payable amount saved.';const refreshedOrders=await supabase.from('site_orders').select('*');cachedOrders=refreshedOrders.data||[];renderAnalytics(cachedOrders);renderCustomerAndReports(cachedOrders);renderProfitOverview();});
  const status=document.createElement('select');status.setAttribute('aria-label','Order status');
  ORDER_STATUSES.forEach(v=>{const option=document.createElement('option');option.value=v;option.textContent=v;status.append(option);});status.value=ORDER_STATUSES.includes(order.status)?order.status:'New';
  status.addEventListener('change',async()=>{const previous=order.status||'New';status.disabled=true;const next=status.value;const statusPatch={status:next,updated_at:new Date().toISOString()};const orderCost=calculateOrderCost(order);if(next==='Delivered'&&orderCost!==null&&order.final_amount!==null&&order.final_amount!==undefined){statusPatch.cost_of_goods_amount=orderCost;statusPatch.gross_profit_amount=Number(order.final_amount)-orderCost;}const {error}=await supabase.from('site_orders').update(statusPatch).eq('id',order.id);status.disabled=false;if(error){ordersMessage.textContent='Could not update status: '+error.message;status.value=previous;}else{order.status=next;if(statusPatch.cost_of_goods_amount!==undefined){order.cost_of_goods_amount=statusPatch.cost_of_goods_amount;order.gross_profit_amount=statusPatch.gross_profit_amount;}progress.innerHTML=progressMarkup(next);wa.href=makeWaLink(order);ordersMessage.textContent='Order status updated successfully.';const refreshed=await supabase.from('site_orders').select('*');cachedOrders=refreshed.data||[];renderAnalytics(cachedOrders);renderCustomerAndReports(cachedOrders);renderProfitOverview();}});
  const makeWaLink=o=>'https://wa.me/'+String(o.customer_phone||'').replace(/\D/g,'')+'?text='+encodeURIComponent(`Assalam-o-Alaikum ${o.customer_name}, this is AUR-K EV regarding your order ${o.id}. Your current order status is: ${o.status||'New'}.`);
  const wa=document.createElement('a');wa.className='outline-btn';wa.target='_blank';wa.rel='noopener';wa.href=makeWaLink(order);wa.textContent='WhatsApp customer';
  const invoice=document.createElement('button');invoice.type='button';invoice.className='gold-btn';invoice.textContent='Print invoice';invoice.addEventListener('click',()=>printInvoice(order));
  const profitBtn=document.createElement('button');profitBtn.type='button';profitBtn.className='outline-btn';profitBtn.textContent='Save profit';profitBtn.disabled=order.status!=='Delivered'||(order.cost_of_goods_amount!==null&&order.cost_of_goods_amount!==undefined);profitBtn.addEventListener('click',()=>saveOrderProfit(order,profitBtn));if(currentRole==='owner')controls.append(deliveryWrap,saveAmount,invoice,profitBtn);else if(currentRole==='manager')controls.append(deliveryWrap,saveAmount);controls.append(status,wa);card.append(head,details,progress,controls);ordersList.append(card);
 }
}

// Owner-only staff role management. Auth users are created separately in Supabase.
async function loadStaff(){
 const host=document.getElementById('staffList');if(!host||currentRole!=='owner')return;
 host.textContent='Loading staff accounts…';
 const {data,error}=await supabase.from('staff_roles').select('email,role,created_at').order('email');
 if(error){host.textContent='Could not load staff: '+error.message;return;}
 if(!data?.length){host.textContent='No staff accounts assigned yet.';return;}
 host.innerHTML=`<table class="customer-table"><thead><tr><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>${data.map(x=>`<tr><td>${escHtml(x.email)}</td><td>${escHtml(x.role)}</td><td>${x.role==='owner'?'Protected owner':`<button class="delete-btn" type="button" data-staff-email="${escHtml(x.email)}">Remove access</button>`}</td></tr>`).join('')}</tbody></table>`;
 host.querySelectorAll('[data-staff-email]').forEach(btn=>btn.addEventListener('click',async()=>{if(!confirm('Remove admin access for '+btn.dataset.staffEmail+'?'))return;btn.disabled=true;const {error}=await supabase.from('staff_roles').delete().eq('email',btn.dataset.staffEmail);if(error){alert(error.message);btn.disabled=false;return;}await loadStaff();}));
}
const staffForm=document.getElementById('staffForm');
if(staffForm)staffForm.addEventListener('submit',async e=>{e.preventDefault();if(currentRole!=='owner')return;const msg=document.getElementById('staffMessage');const email=document.getElementById('staffEmail').value.trim().toLowerCase();const role=document.getElementById('staffRole').value;msg.textContent='Saving access…';const {error}=await supabase.from('staff_roles').upsert({email,role},{onConflict:'email'});if(error){msg.textContent='Could not save staff role: '+error.message;return;}msg.textContent='Staff access saved. The user can sign in with their own Supabase Auth account.';staffForm.reset();await loadStaff();});

document.getElementById('refreshOrders')?.addEventListener('click',loadOrders);
const orderObserver=new MutationObserver(()=>{if(!dashboard.hidden&&canView('orders'))loadOrders();});
orderObserver.observe(dashboard,{attributes:true,attributeFilter:['hidden']});

/* Owner-only customer review moderation */
async function loadReviews(){
 if(currentRole!=='owner')return;
 for(const id of ['pendingReviews','approvedReviews','rejectedReviews']){const el=document.getElementById(id);if(el)el.textContent='Loading…';}
 const {data,error}=await supabase.from('site_reviews').select('id,customer_name,rating,review_text,product_id,status,created_at').order('created_at',{ascending:false});
 if(error){['pendingReviews','approvedReviews','rejectedReviews'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=error.message;});return;}
 const labels={pending:'pendingReviews',approved:'approvedReviews',rejected:'rejectedReviews'};
 for(const [status,id] of Object.entries(labels)){
  const host=document.getElementById(id);if(!host)continue;
  const rows=(data||[]).filter(r=>r.status===status);
  if(!rows.length){host.innerHTML='<p class="muted">No '+status+' reviews.</p>';continue;}
  host.innerHTML='<table class="customer-table"><thead><tr><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th>Actions</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+escHtml(r.customer_name)+'</td><td>'+('★'.repeat(r.rating))+'</td><td>'+escHtml(r.review_text)+'</td><td>'+new Date(r.created_at).toLocaleDateString()+'</td><td>'+(status==='pending'?'<button class="gold-btn" data-review-approve="'+r.id+'">Approve</button> ':'')+(status!=='rejected'?'<button class="outline-btn" data-review-reject="'+r.id+'">Reject</button> ':'')+'<button class="delete-btn" data-review-delete="'+r.id+'">Delete</button></td></tr>').join('')+'</tbody></table>';
 }
 document.querySelectorAll('[data-review-approve]').forEach(b=>b.onclick=()=>updateReview(b.dataset.reviewApprove,'approved'));
 document.querySelectorAll('[data-review-reject]').forEach(b=>b.onclick=()=>updateReview(b.dataset.reviewReject,'rejected'));
 document.querySelectorAll('[data-review-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Permanently delete this review?'))return;const {error}=await supabase.from('site_reviews').delete().eq('id',b.dataset.reviewDelete);if(error){alert(error.message);return;}await loadReviews();});
}
async function updateReview(id,status){const {error}=await supabase.from('site_reviews').update({status}).eq('id',id);if(error){alert('Could not update review: '+error.message);return;}await loadReviews();}
document.getElementById('refreshReviews')?.addEventListener('click',loadReviews);


/* Owner-only competitor scooter management */
let editingCompetitorId=null;
const competitorForm=document.getElementById('competitorForm');
function resetCompetitorForm(){
 editingCompetitorId=null;competitorForm?.reset();
 const active=document.getElementById('competitorActive');if(active)active.checked=true;
 const title=document.getElementById('competitorFormTitle');if(title)title.textContent='Add competitor scooter';
 const save=document.getElementById('competitorSaveButton');if(save)save.textContent='Save competitor scooter';
 const cancel=document.getElementById('competitorCancel');if(cancel)cancel.hidden=true;
}
async function loadCompetitorAdmin(){
 if(currentRole!=='owner')return;
 const host=document.getElementById('competitorList');if(!host)return;
 host.textContent='Loading competitor models…';
 const {data,error}=await supabase.from('site_competitor_scooters').select('*').order('company_name').order('model_name');
 if(error){host.textContent='Could not load competitor models: '+error.message;return;}
 if(!data?.length){host.innerHTML='<p class="muted">No competitor models added yet. Use the form above to add the first one.</p>';return;}
 host.innerHTML='<table class="customer-table"><thead><tr><th>Company / model</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+data.map(p=>'<tr><td><b>'+escHtml(p.company_name)+'</b><br>'+escHtml(p.model_name)+'</td><td>'+escHtml(p.price_text||'Not provided')+'</td><td>'+(p.is_active?'Visible':'Hidden')+'</td><td><button class="outline-btn" type="button" data-competitor-edit="'+p.id+'">Edit</button> <button class="delete-btn" type="button" data-competitor-delete="'+p.id+'">Delete</button></td></tr>').join('')+'</tbody></table>';
 host.querySelectorAll('[data-competitor-edit]').forEach(btn=>btn.onclick=()=>{const p=data.find(x=>x.id===btn.dataset.competitorEdit);if(!p)return;editingCompetitorId=p.id;for(const [id,key] of Object.entries({competitorCompany:'company_name',competitorModel:'model_name',competitorPrice:'price_text',competitorBattery:'battery',competitorMotor:'motor_w',competitorRange:'range_km',competitorSpeed:'top_speed_kmh',competitorWarranty:'warranty_text',competitorImage:'image_url',competitorNotes:'notes'})){document.getElementById(id).value=p[key]??'';}document.getElementById('competitorActive').checked=!!p.is_active;document.getElementById('competitorFormTitle').textContent='Edit competitor scooter';document.getElementById('competitorSaveButton').textContent='Update competitor scooter';document.getElementById('competitorCancel').hidden=false;document.getElementById('competitorForm').scrollIntoView({behavior:'smooth',block:'center'});});
 host.querySelectorAll('[data-competitor-delete]').forEach(btn=>btn.onclick=async()=>{if(!confirm('Delete this competitor scooter?'))return;const {error}=await supabase.from('site_competitor_scooters').delete().eq('id',btn.dataset.competitorDelete);if(error){alert(error.message);return;}await loadCompetitorAdmin();});
}
competitorForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(currentRole!=='owner')return;
 const val=id=>document.getElementById(id).value.trim();
 const num=id=>val(id)===''?null:Number(val(id));
 const row={company_name:val('competitorCompany'),model_name:val('competitorModel'),price_text:val('competitorPrice')||null,battery:val('competitorBattery')||null,motor_w:num('competitorMotor'),range_km:num('competitorRange'),top_speed_kmh:num('competitorSpeed'),warranty_text:val('competitorWarranty')||null,image_url:val('competitorImage')||null,notes:val('competitorNotes')||null,is_active:document.getElementById('competitorActive').checked,updated_at:new Date().toISOString()};
 const msg=document.getElementById('competitorMessage');msg.textContent='Saving…';
 const result=editingCompetitorId?await supabase.from('site_competitor_scooters').update(row).eq('id',editingCompetitorId):await supabase.from('site_competitor_scooters').insert(row);
 if(result.error){msg.textContent='Could not save competitor scooter: '+result.error.message;return;}
 msg.textContent='Competitor scooter saved.';resetCompetitorForm();await loadCompetitorAdmin();
});
document.getElementById('competitorCancel')?.addEventListener('click',resetCompetitorForm);


/* Model photo and video gallery manager */
let modelMediaChoices=[];
async function loadModelMediaOptions(){
 const select=document.getElementById('mediaModelSelect');if(!select)return;
 const [{data:products,error:pErr},{data:competitors,error:cErr}]=await Promise.all([
  supabase.from('site_products').select('id,name').order('name'),
  supabase.from('site_competitor_scooters').select('id,company_name,model_name').eq('is_active',true).order('company_name').order('model_name')
 ]);
 if(pErr||cErr){select.innerHTML='<option value="">Could not load models</option>';return;}
 modelMediaChoices=[...(products||[]).map(p=>({value:'aurk:'+p.id,label:'AUR-K / ROADKING — '+p.name})),...(competitors||[]).map(p=>({value:'competitor:'+p.id,label:p.company_name+' — '+p.model_name}))];
 select.innerHTML='<option value="">Choose a scooter model</option>'+modelMediaChoices.map(x=>'<option value="'+escHtml(x.value)+'">'+escHtml(x.label)+'</option>').join('');
}
async function loadModelMediaList(){
 const host=document.getElementById('modelMediaList'),select=document.getElementById('mediaModelSelect');if(!host||!select)return;
 if(!select.value){host.textContent='Choose a scooter model to view its photos and videos.';return;}
 const [model_type,model_id]=select.value.split(':');host.textContent='Loading gallery…';
 const {data,error}=await supabase.from('site_model_media').select('*').eq('model_type',model_type).eq('model_id',model_id).order('sort_order').order('created_at',{ascending:false});
 if(error){host.textContent='Gallery setup issue: '+error.message;return;}
 if(!data?.length){host.textContent='No photos or videos uploaded for this model yet.';return;}
 host.innerHTML='';
 data.forEach(item=>{
  const card=document.createElement('article');card.className='image-item';
  let media;
  if(item.media_type==='video'&&/youtube-nocookie\.com\/embed\//.test(item.public_url)){
   media=document.createElement('iframe');media.src=item.public_url;media.title=item.title;media.loading='lazy';media.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';media.allowFullscreen=true;media.referrerPolicy='strict-origin-when-cross-origin';
  }else{media=item.media_type==='video'?document.createElement('video'):document.createElement('img');media.src=item.public_url;media.alt=item.title;media.controls=item.media_type==='video';media.muted=true;media.playsInline=true;}
  const body=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('small'),del=document.createElement('button');
  title.textContent=item.title;meta.textContent=item.media_type.toUpperCase();del.className='delete-btn';del.textContent='Delete';
  del.onclick=async()=>{if(!confirm('Delete this gallery media?'))return;const {error:de}=await supabase.from('site_model_media').delete().eq('id',item.id);if(de){alert(de.message);return;}if(item.storage_path?.startsWith('model-media/'))await supabase.storage.from('website-images').remove([item.storage_path]);await loadModelMediaList();};
  body.append(title,meta,del);card.append(media,body);host.append(card);
 });
}
document.getElementById('mediaModelSelect')?.addEventListener('change',loadModelMediaList);
document.getElementById('modelMediaForm')?.addEventListener('submit',async e=>{
 e.preventDefault();const msg=document.getElementById('modelMediaMessage'),file=document.getElementById('mediaFile').files[0],choice=document.getElementById('mediaModelSelect').value,youtube=document.getElementById('mediaYoutubeUrl').value.trim(),title=document.getElementById('mediaTitle').value.trim();
 if(!choice||!title)return;
 if(!file&&!youtube){msg.textContent='Choose a photo/video file or paste a YouTube link.';return;}
 if(file&&youtube){msg.textContent='Please use either a file upload or a YouTube link, not both.';return;}
 const [model_type,model_id]=choice.split(':'),model=modelMediaChoices.find(x=>x.value===choice);let publicUrl='',storagePath=null,mediaType='video';
 if(youtube){let videoId='';try{const u=new URL(youtube);if(u.hostname==='youtu.be')videoId=u.pathname.split('/').filter(Boolean)[0]||'';else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname)){videoId=u.searchParams.get('v')||(['embed','shorts','live'].includes(u.pathname.split('/').filter(Boolean)[0])?u.pathname.split('/').filter(Boolean)[1]:'')||'';}}catch{}
  if(!/^[A-Za-z0-9_-]{11}$/.test(videoId)){msg.textContent='Please paste a valid YouTube video link.';return;}publicUrl='https://www.youtube-nocookie.com/embed/'+videoId;
 }else{const isImage=file.type.startsWith('image/'),isVideo=file.type.startsWith('video/');
  if(!isImage&&!isVideo){msg.textContent='Choose a JPG, PNG, WebP, MP4, WebM or MOV file.';return;}
  if(isImage&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)){msg.textContent='Photos must be JPG, PNG or WebP and smaller than 8 MB.';return;}
  if(isVideo&&(!['video/mp4','video/webm','video/quicktime'].includes(file.type)||file.size>100*1024*1024)){msg.textContent='Videos must be MP4, WebM or MOV and smaller than 100 MB.';return;}
  mediaType=isImage?'image':'video';msg.textContent='Uploading '+(isVideo?'video':'photo')+'…';const ext=file.name.split('.').pop().toLowerCase();storagePath='model-media/'+crypto.randomUUID()+'.'+ext;
  const {error:upErr}=await supabase.storage.from('website-images').upload(storagePath,file,{upsert:false,contentType:file.type});if(upErr){msg.textContent=upErr.message;return;}
  const {data:{publicUrl:uploadedUrl}}=supabase.storage.from('website-images').getPublicUrl(storagePath);publicUrl=uploadedUrl;
 }
 const {error:dbErr}=await supabase.from('site_model_media').insert({model_type,model_id,model_label:model?.label||'Scooter',title,media_type:mediaType,public_url:publicUrl,storage_path:storagePath});
 if(dbErr){if(storagePath)await supabase.storage.from('website-images').remove([storagePath]);msg.textContent='Could not save gallery media: '+dbErr.message;return;}
 msg.textContent=youtube?'YouTube video added to this model gallery.':'Uploaded successfully. It is now available in this model gallery.';document.getElementById('mediaTitle').value='';document.getElementById('mediaFile').value='';document.getElementById('mediaYoutubeUrl').value='';await loadModelMediaList();
});
