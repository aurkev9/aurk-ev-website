import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const loginPanel=document.getElementById("loginPanel"), dashboard=document.getElementById("dashboard");
const loginMessage=document.getElementById("loginMessage"), uploadMessage=document.getElementById("uploadMessage");
if(SUPABASE_URL.startsWith("PASTE_")||SUPABASE_ANON_KEY.startsWith("PASTE_")){
 loginMessage.textContent="Setup required: add your Supabase URL and anon key in config.js, then follow SETUP.md.";
 throw new Error("Supabase config missing");
}
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
async function refreshSession(){const {data:{session}}=await supabase.auth.getSession();loginPanel.hidden=!!session;dashboard.hidden=!session;if(session)loadImages();}
supabase.auth.onAuthStateChange(()=>refreshSession());
document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault();loginMessage.textContent="Signing in…";const {error}=await supabase.auth.signInWithPassword({email:document.getElementById("email").value,password:document.getElementById("password").value});loginMessage.textContent=error?error.message:"";await refreshSession();});
document.getElementById("logout").addEventListener("click",async()=>{await supabase.auth.signOut();await refreshSession();});
document.getElementById("uploadForm").addEventListener("submit",async e=>{e.preventDefault();uploadMessage.textContent="Uploading…";const file=document.getElementById("imageFile").files[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)){uploadMessage.textContent="Please choose JPG, PNG or WebP.";return;}if(file.size>8*1024*1024){uploadMessage.textContent="Image must be smaller than 8 MB.";return;}const ext=file.name.split(".").pop().toLowerCase(),path=`${crypto.randomUUID()}.${ext}`;const {error:upErr}=await supabase.storage.from("website-images").upload(path,file,{upsert:false,contentType:file.type});if(upErr){uploadMessage.textContent=upErr.message;return;}const {data:{publicUrl}}=supabase.storage.from("website-images").getPublicUrl(path);const slot=document.getElementById("imageSlot").value;const {error:dbErr}=await supabase.from("site_images").insert({title:document.getElementById("imageTitle").value,slot,product_name:document.getElementById("productName").value,storage_path:path,public_url:publicUrl});if(dbErr){await supabase.storage.from("website-images").remove([path]);uploadMessage.textContent=dbErr.message;return;}uploadMessage.textContent="Image uploaded successfully. Refresh your website to see it.";e.target.reset();await loadImages();});
async function loadImages(){const list=document.getElementById("imageList");list.textContent="Loading…";const {data,error}=await supabase.from("site_images").select("*").order("created_at",{ascending:false});if(error){list.textContent=error.message;return;}list.innerHTML="";if(!data?.length){list.textContent="No uploaded images yet.";return;}for(const item of data){const card=document.createElement("article");card.className="image-item";const img=document.createElement("img");img.src=item.public_url;img.alt=item.title;const body=document.createElement("div");const title=document.createElement("strong");title.textContent=item.title;const meta=document.createElement("small");meta.textContent=`${item.slot}${item.product_name?" • "+item.product_name:""}`;const del=document.createElement("button");del.className="delete-btn";del.textContent="Delete";del.addEventListener("click",async()=>{if(!confirm(`Delete ${item.title}?`))return;const {error:dbError}=await supabase.from("site_images").delete().eq("id",item.id);if(dbError){alert(dbError.message);return;}await supabase.storage.from("website-images").remove([item.storage_path]);await loadImages();});body.append(title,meta,del);card.append(img,body);list.append(card);}}
refreshSession();
// Product catalogue manager (requires the included product-table migration).
let editingProductId=null;
const productForm=document.getElementById('productForm');
async function loadProducts(){const list=document.getElementById('productList');if(!list)return;list.textContent='Loading…';const {data,error}=await supabase.from('site_products').select('*').order('created_at',{ascending:false});if(error){list.textContent='Product table setup required: '+error.message;return;}list.innerHTML='';if(!data?.length){list.textContent='No products added yet.';return;}for(const p of data){const card=document.createElement('article');card.className='image-item';if(p.image_url){const img=document.createElement('img');img.src=p.image_url;img.alt=p.name;card.append(img);}const body=document.createElement('div');const title=document.createElement('strong');title.textContent=p.name;const meta=document.createElement('small');meta.textContent=(p.category||'')+' • '+(p.price_text||'Price on enquiry')+(p.featured?' • Featured':'');const edit=document.createElement('button');edit.className='outline-btn';edit.textContent='Edit';edit.onclick=()=>{editingProductId=p.id;document.getElementById('pName').value=p.name||'';document.getElementById('pCategory').value=p.category||'premium';document.getElementById('pTag').value=p.tag||'';document.getElementById('pPrice').value=p.price_text||'';document.getElementById('pDescription').value=p.description||'';document.getElementById('pImage').value=p.image_url||'';document.getElementById('pSpecs').value=p.specifications||'';document.getElementById('pFeatured').checked=!!p.featured;document.getElementById('pCancel').hidden=false;window.scrollTo({top:productForm.offsetTop,behavior:'smooth'});};const del=document.createElement('button');del.className='delete-btn';del.textContent='Delete';del.onclick=async()=>{if(!confirm('Delete '+p.name+'?'))return;const {error}=await supabase.from('site_products').delete().eq('id',p.id);if(error){alert(error.message);return;}loadProducts();};body.append(title,meta,edit,del);card.append(body);list.append(card);}}
if(productForm){productForm.addEventListener('submit',async e=>{e.preventDefault();const row={name:document.getElementById('pName').value.trim(),category:document.getElementById('pCategory').value,tag:document.getElementById('pTag').value.trim(),price_text:document.getElementById('pPrice').value.trim()||'Ask for price',description:document.getElementById('pDescription').value.trim(),image_url:document.getElementById('pImage').value.trim(),specifications:document.getElementById('pSpecs').value.trim(),featured:document.getElementById('pFeatured').checked};const msg=document.getElementById('productMessage');msg.textContent='Saving…';const result=editingProductId?await supabase.from('site_products').update(row).eq('id',editingProductId):await supabase.from('site_products').insert(row);if(result.error){msg.textContent=result.error.message;return;}msg.textContent='Product saved.';productForm.reset();editingProductId=null;document.getElementById('pCancel').hidden=true;loadProducts();});document.getElementById('pCancel').onclick=()=>{productForm.reset();editingProductId=null;document.getElementById('pCancel').hidden=true;};}
const originalRefresh=refreshSession;
// load product list whenever authenticated dashboard is shown
const productObserver=new MutationObserver(()=>{if(!dashboard.hidden)loadProducts();});productObserver.observe(dashboard,{attributes:true,attributeFilter:['hidden']});

// Customer order management (requires site-orders-migration.sql).
const ordersList=document.getElementById('ordersList');
const ordersMessage=document.getElementById('ordersMessage');
const ORDER_STATUSES=['New','Confirmed','Processing','Dispatched','Delivered','Cancelled'];
async function loadOrders(){
 if(!ordersList)return;
 ordersList.textContent='Loading orders…';
 const {data,error}=await supabase.from('site_orders').select('*').order('created_at',{ascending:false});
 if(error){ordersList.textContent='Orders setup required: '+error.message;return;}
 if(!data?.length){ordersList.textContent='No customer orders yet.';return;}
 ordersList.innerHTML='';
 for(const order of data){
  const card=document.createElement('article');card.className='order-admin-card';
  const head=document.createElement('div');head.className='order-admin-head';
  const title=document.createElement('strong');title.textContent='Order '+order.id.slice(0,8).toUpperCase();
  const date=document.createElement('small');date.textContent=new Date(order.created_at).toLocaleString();
  head.append(title,date);
  const details=document.createElement('div');details.className='order-admin-details';
  const items=document.createElement('p');items.textContent=(order.items||[]).map(x=>`${x.name} × ${x.quantity}`).join(', ');
  const customer=document.createElement('p');customer.textContent=`${order.customer_name} • ${order.customer_phone}`;
  const address=document.createElement('p');address.textContent=`${order.delivery_address}, ${order.city}`;
  const note=document.createElement('p');note.textContent=order.customer_note?`Note: ${order.customer_note}`:'';
  const payment=document.createElement('small');payment.textContent='Payment: Cash on Delivery';
  details.append(items,customer,address);if(order.customer_note)details.append(note);details.append(payment);
  const controls=document.createElement('div');controls.className='order-admin-controls';
  const status=document.createElement('select');status.setAttribute('aria-label','Order status');
  ORDER_STATUSES.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;status.append(o);});status.value=ORDER_STATUSES.includes(order.status)?order.status:'New';
  status.addEventListener('change',async()=>{status.disabled=true;const {error}=await supabase.from('site_orders').update({status:status.value,updated_at:new Date().toISOString()}).eq('id',order.id);status.disabled=false;if(error){ordersMessage.textContent='Could not update status: '+error.message;status.value=order.status;}else{order.status=status.value;ordersMessage.textContent='Order status updated.';}});
  const wa=document.createElement('a');wa.className='outline-btn';wa.target='_blank';wa.rel='noopener';wa.href='https://wa.me/'+String(order.customer_phone).replace(/\D/g,'')+'?text='+encodeURIComponent(`Hello ${order.customer_name}, this is AUR-K EV regarding your order ${order.id.slice(0,8).toUpperCase()}. Your current order status is: ${order.status}.`);wa.textContent='WhatsApp customer';
  controls.append(status,wa);card.append(head,details,controls);ordersList.append(card);
 }
}
document.getElementById('refreshOrders')?.addEventListener('click',loadOrders);
const orderObserver=new MutationObserver(()=>{if(!dashboard.hidden)loadOrders();});
orderObserver.observe(dashboard,{attributes:true,attributeFilter:['hidden']});
