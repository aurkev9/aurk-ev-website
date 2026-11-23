import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const FALLBACK=[{id:1,name:"ROADKING R99 PRO",category:"premium",tag:"FEATURED MODEL",price_text:"Ask for price",description:"A bold electric ride for confident everyday journeys.",image_url:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80"},{id:2,name:"ROADKING RAPTOR",category:"premium",tag:"PERFORMANCE STYLE",price_text:"Ask for price",description:"Stand out with a striking design and electric convenience.",image_url:"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80"},{id:3,name:"AUR-K CITY SERIES",category:"commuter",tag:"CITY COMMUTE",price_text:"Ask for price",description:"A practical choice for your everyday city routine.",image_url:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80"}];
const WHATSAPP_NUMBER="923239661747";let PRODUCTS=FALLBACK,cart=[];let PRODUCT_IMAGES=[];let supabase=null;const grid=document.getElementById('productGrid');
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function productSpecs(value){
 if(!value)return [];
 let parts=[];
 try{
  const parsed=JSON.parse(value);
  if(Array.isArray(parsed))parts=parsed;
  else if(parsed&&typeof parsed==='object')parts=Object.entries(parsed).map(([k,v])=>`${k}: ${v}`);
  else parts=[String(value)];
 }catch{parts=String(value).split(/\r?\n|[;,•]/);}
 return parts.map(x=>String(x).trim()).filter(Boolean).slice(0,30);
}
function productEnquiry(p){
 const message=`Assalam-o-Alaikum AUR-K EV,\nI would like to know more about ${p.name}.\nPlease share its latest price, specifications and availability.`;
 return 'https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(message);
}
let activeProductFilter='all', activeProductQuery='', activeProductSort='featured';
function numericProductValue(p,kind){
 const spec=productSpecs(p.specifications).join(' ').toLowerCase();
 if(kind==='price'){const m=String(p.price_text||'').replace(/,/g,'').match(/(?:rs\.?\s*)?(\d+(?:\.\d+)?)/i);return m?Number(m[1]):Infinity;}
 const patterns={motor:/(\d+)\s*w(?:att)?/i,speed:/(\d+(?:\s*[-–]\s*\d+)?)\s*km(?:\s*h)?/i,range:/(\d+(?:\s*[-–]\s*\d+)?)\s*km/i};
 const m=spec.match(patterns[kind]);if(!m)return 0;
 const nums=m[1].match(/\d+/g)||[];return nums.length?Math.max(...nums.map(Number)):0;
}
function renderProducts(filter=activeProductFilter,query=activeProductQuery,sort=activeProductSort){
 activeProductFilter=filter;activeProductQuery=query;activeProductSort=sort;
 let visible=PRODUCTS.filter(p=>(filter==='all'||p.category===filter)&&(!query||[p.name,p.description,p.tag,p.price_text,p.specifications].filter(Boolean).join(' ').toLowerCase().includes(query)));
 const sorters={name:(a,b)=>String(a.name).localeCompare(String(b.name)), 'price-low':(a,b)=>numericProductValue(a,'price')-numericProductValue(b,'price'),'price-high':(a,b)=>numericProductValue(b,'price')-numericProductValue(a,'price'),motor:(a,b)=>numericProductValue(b,'motor')-numericProductValue(a,'motor'),speed:(a,b)=>numericProductValue(b,'speed')-numericProductValue(a,'speed'),range:(a,b)=>numericProductValue(b,'range')-numericProductValue(a,'range')};
 if(sorters[sort])visible=[...visible].sort(sorters[sort]);
 grid.innerHTML=visible.map(p=>{
  const specs=productSpecs(p.specifications);
  const featured=p.featured===true||p.featured==='true';
  return `<article class="product-card product-card-luxury">
   <div class="product-photo product-photo-luxury">
    <img loading="lazy" src="${esc(p.image_url||'')}" alt="${esc(p.name)} electric scooter">
    <span class="product-tag">${esc(featured?'FEATURED MODEL':(p.tag||'AUR-K EV'))}</span>
    <span class="product-photo-mark">AUR-K EV</span>
   </div>
   <div class="product-info product-info-luxury">
    <div class="product-kicker"><span>THE AUR-K COLLECTION</span><span class="product-index">EV / ${String(PRODUCTS.indexOf(p)+1).padStart(2,'0')}</span></div>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.description||'Contact us for details and availability.')}</p>
    ${specs.length?`<ul class="product-specs">${specs.map((s,i)=>detailSpecMarkup(s,i)).join('')}</ul>`:''}
    <div class="product-price-row"><span class="product-price-label">SHOWROOM PRICE</span><strong class="price">${esc(p.price_text||'Ask for price')}</strong></div>
    <div class="product-actions">
     <a class="product-details-btn" href="?product=${encodeURIComponent(p.id)}">View details <span>↗</span></a>
     <button class="add-btn product-order-btn" type="button" onclick="addToCart('${String(p.id).replace(/'/g,'')}')">Add to bag <span>＋</span></button>
    </div>
    <button type="button" class="compare-toggle" data-compare-id="${esc(p.id)}">＋ Compare</button>
   </div>
  </article>`;
 }).join('');
 if(!visible.length)grid.innerHTML='<p class="product-empty">No scooters are listed in this category yet. Please contact our showroom for assistance.</p>';
 const planSelect=document.getElementById('planProduct');
 if(planSelect){const selected=planSelect.value;planSelect.innerHTML='<option value="">Select a scooter</option>'+PRODUCTS.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('');if(PRODUCTS.some(p=>String(p.id)===selected))planSelect.value=selected;}
}

function detailPrice(value){
 const raw=String(value??'').trim();
 const match=raw.match(/^\\s*(?:Rs\\.?|PKR)?\\s*([\\d,]+(?:\\.\\d{1,2})?)\\s*$/i);
 return match?'PKR '+Number(match[1].replace(/,/g,'')).toLocaleString('en-PK',{maximumFractionDigits:2}):(raw||'Contact us for price');
}
function relatedProductImages(product){
 const tokens=[product.name,product.tag].filter(Boolean).join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>2&&!['road','king','electric','scooter','bike','series','model','aurk'].includes(t));
 return PRODUCT_IMAGES.filter(img=>{
  if(img.slot!=='product'||!img.public_url)return false;
  const label=[img.product_name,img.title].filter(Boolean).join(' ').toLowerCase();
  return tokens.some(token=>label.includes(token));
 }).map(img=>img.public_url);
}
function detailSpecMarkup(spec,index){
 const text=String(spec).trim();
 const split=text.match(/^([^:]{2,45}):\\s*(.+)$/);
 if(split)return `<li class="detail-spec-card"><span class="detail-spec-label">${esc(split[1])}</span><strong>${esc(split[2])}</strong></li>`;
 return `<li class="detail-spec-card detail-spec-card-plain"><span class="detail-spec-label">HIGHLIGHT ${String(index+1).padStart(2,'0')}</span><strong>${esc(text)}</strong></li>`;
}
function renderProductDetail(product){
 const page=document.getElementById('productDetailPage');
 const content=document.getElementById('productDetailContent');
 const main=document.getElementById('storefrontMain');
 const footer=document.querySelector('.footer-v2');
 if(!page||!content)return;
 if(main)main.hidden=true;
 page.hidden=false;
 if(!product){
  content.innerHTML='<a class="detail-back-link" href="/">← Back to all scooters</a><div class="detail-not-found"><p class="eyebrow">AUR-K EV COLLECTION</p><h1>We could not find this scooter.</h1><p>The product may have been removed or its link may have changed.</p><a class="detail-primary-btn" href="/">Browse all scooters</a></div>';
  return;
 }
 const gallery=[...new Set([product.image_url,...relatedProductImages(product)].filter(Boolean))];
 const image=gallery[0]||'';
 const specs=productSpecs(product.specifications);
 const description=product.description||'Contact our showroom team for model details, features and availability.';
 const shareUrl=window.location.href;
 content.innerHTML=`
  <a class="detail-back-link" href="/">← Back to all scooters</a>
  <div class="product-detail-grid">
   <div class="detail-gallery">
    <button type="button" class="detail-main-image detail-image-zoom" id="detailImageZoom" aria-label="Open larger product image"><img id="detailMainImage" src="${esc(image)}" alt="${esc(product.name)} electric scooter"><span class="detail-zoom-hint">＋ VIEW FULL IMAGE</span></button>
    ${gallery.length>1?`<div class="detail-thumbnails">${gallery.map((src,i)=>`<button type="button" class="detail-thumb ${i===0?'active':''}" data-image-src="${esc(src)}" aria-label="View product image ${i+1}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>`:''}
   </div>
   <div class="detail-information">
    <p class="eyebrow">AUR-K EV • ${esc(product.tag||'ELECTRIC SCOOTER')}</p>
    <h1>${esc(product.name)}</h1>
    <p class="detail-description">${esc(description)}</p>
    <div class="detail-price"><small>SHOWROOM PRICE</small><strong>${esc(detailPrice(product.price_text))}</strong><span>Final price and availability are confirmed by our showroom team.</span></div>
    ${specs.length?`<div class="detail-specifications"><h2>Specifications & highlights</h2><ul>${specs.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`:'<div class="detail-specifications"><h2>Need specifications?</h2><p>Message our team and we will share the latest details for this model.</p></div>'}
    <div class="detail-assurance"><span>✓ Cash on Delivery</span><span>✓ Showroom assistance</span><span>✓ Faisalabad, Pakistan</span></div>
    <div class="detail-actions"><button type="button" class="detail-primary-btn" id="detailOrderNow">Order Now — COD</button><a class="detail-secondary-btn" id="detailWhatsApp" target="_blank" rel="noopener" href="${esc(productEnquiry(product))}">Ask on WhatsApp ↗</a></div>
    <button type="button" class="detail-share-btn" id="detailShare">Share this scooter ↗</button>
   </div>
  </div>
  <div class="detail-contact-note"><b>Need help choosing?</b><span>Talk to AUR-K EV Bike Experts before placing your order.</span><a href="https://wa.me/923239661747" target="_blank" rel="noopener">Contact showroom ↗</a></div>`;
 const zoomButton=content.querySelector('#detailImageZoom');
 zoomButton?.addEventListener('click',()=>{
  const src=content.querySelector('#detailMainImage')?.src;
  if(!src)return;
  let viewer=document.getElementById('productImageViewer');
  if(!viewer){
   viewer=document.createElement('div');viewer.id='productImageViewer';viewer.className='product-image-viewer';viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Product image preview');
   viewer.innerHTML='<button type="button" class="product-image-viewer-close" aria-label="Close image preview">✕</button><img alt="Expanded scooter image">';
   document.body.append(viewer);
   viewer.addEventListener('click',e=>{if(e.target===viewer||e.target.closest('.product-image-viewer-close'))viewer.classList.remove('open');});
  }
  const preview=viewer.querySelector('img');preview.src=src;preview.alt=product.name+' electric scooter';
  viewer.classList.add('open');
 });
 const thumbButtons=content.querySelectorAll('.detail-thumb');
 thumbButtons.forEach(button=>button.addEventListener('click',()=>{
  const mainImage=content.querySelector('#detailMainImage');
  if(mainImage)mainImage.src=button.dataset.imageSrc;
  thumbButtons.forEach(b=>b.classList.toggle('active',b===button));
 }));
 const orderButton=content.querySelector('#detailOrderNow');
 orderButton?.addEventListener('click',()=>{
  cart=[{...product,qty:1}];
  renderCart();
  const overlay=document.getElementById('cartOverlay');
  if(overlay)overlay.classList.remove('open');
  orderModal.classList.add('open');
  orderModal.setAttribute('aria-hidden','false');
 });
 content.querySelector('#detailShare')?.addEventListener('click',async()=>{
  const shareData={title:product.name+' | AUR-K EV',text:'Explore '+product.name+' at AUR-K EV.',url:shareUrl};
  try{
   if(navigator.share)await navigator.share(shareData);
   else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(shareUrl);alert('Product link copied.');}
   else prompt('Copy this product link:',shareUrl);
  }catch(error){if(error?.name!=='AbortError')console.warn('Share was not completed.',error);}
 });
 if(footer)footer.hidden=false;
}
function openRequestedProduct(){
 const productId=new URLSearchParams(window.location.search).get('product');
 if(productId!==null)renderProductDetail(PRODUCTS.find(p=>String(p.id)===productId));
}

window.addToCart=id=>{const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty++;else cart.push({...p,qty:1});renderCart();document.getElementById('cartOverlay').classList.add('open');};
window.removeFromCart=id=>{cart=cart.filter(p=>String(p.id)!==String(id));renderCart();};
function renderCart(){document.getElementById('cartCount').textContent=cart.reduce((n,p)=>n+p.qty,0);document.getElementById('cartItems').innerHTML=cart.length?cart.map(p=>`<div class="cart-line"><span><b>${esc(p.name)}</b><br>Quantity: ${p.qty}</span><button onclick="removeFromCart('${p.id}')">Remove</button></div>`).join(''):'<p class="empty">Your bag is waiting for its first ride.</p>';document.getElementById('cartTotal').textContent='Price on enquiry';}
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderProducts(b.dataset.filter);}));
document.getElementById('productSearch')?.addEventListener('input',e=>renderProducts(activeProductFilter,e.target.value.trim().toLowerCase(),activeProductSort));
document.getElementById('productSort')?.addEventListener('change',e=>renderProducts(activeProductFilter,activeProductQuery,e.target.value));
document.getElementById('cartOpen').onclick=()=>document.getElementById('cartOverlay').classList.add('open');document.getElementById('cartClose').onclick=()=>document.getElementById('cartOverlay').classList.remove('open');document.getElementById('cartOverlay').addEventListener('click',e=>{if(e.target.id==='cartOverlay')e.currentTarget.classList.remove('open');});
function whatsapp(m){window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(m),'_blank','noopener');}
const orderModal=document.getElementById('orderModal');
function closeOrder(){orderModal.classList.remove('open');orderModal.setAttribute('aria-hidden','true');}
document.getElementById('checkout').onclick=()=>{if(!cart.length){alert('Your bag is empty.');return;}document.getElementById('cartOverlay').classList.remove('open');orderModal.classList.add('open');orderModal.setAttribute('aria-hidden','false');};
document.getElementById('orderClose').onclick=closeOrder;
orderModal.addEventListener('click',e=>{if(e.target===orderModal)closeOrder();});
function cartPriceTotal(){const a=cart.map(p=>{const m=String(p.price_text||'').match(/^\\s*(?:Rs\\.?|PKR)?\\s*([\\d,]+(?:\\.\\d{1,2})?)\\s*$/i);return m?Number(m[1].replace(/,/g,''))*p.qty:null;});return a.every(x=>x!==null)?a.reduce((x,y)=>x+y,0):null;}
function updatePaymentOptions(){const method=document.querySelector('input[name="paymentChoice"]:checked')?.value||'Cash';document.getElementById('creditOptions').hidden=method==='Cash';document.getElementById('orderDownPaymentWrap').hidden=method!=='Both';const total=cartPriceTotal(),out=document.getElementById('orderCreditEstimate');if(method==='Cash'){out.textContent='Full payment in cash.';return;}if(total===null){out.textContent='Price not listed. The showroom will confirm the monthly amount.';return;}const months=Number(document.getElementById('orderCreditMonths').value),down=method==='Both'?Number(document.getElementById('orderDownPayment').value||0):0;if(down<0||down>=total){out.textContent='Down payment must be lower than the order total.';return;}out.textContent='Indicative balance PKR '+Math.round(total-down).toLocaleString('en-PK')+' • Approx. PKR '+Math.round((total-down)/months).toLocaleString('en-PK')+' / month.';}
document.querySelectorAll('input[name="paymentChoice"]').forEach(x=>x.addEventListener('change',updatePaymentOptions));document.getElementById('orderCreditMonths').addEventListener('change',updatePaymentOptions);document.getElementById('orderDownPayment').addEventListener('input',updatePaymentOptions);
document.getElementById('customerOrderForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!cart.length){alert('Your bag is empty. Please add a scooter again.');closeOrder();return;}
 const msg=document.getElementById('orderMessage'),btn=document.getElementById('placeOrderBtn');btn.disabled=true;msg.textContent='Submitting your order…';
 const customer={name:document.getElementById('customerName').value.trim(),phone:document.getElementById('customerPhone').value.trim(),address:document.getElementById('customerAddress').value.trim(),city:document.getElementById('customerCity').value.trim(),note:document.getElementById('customerNote').value.trim()};
 const method=document.querySelector('input[name="paymentChoice"]:checked')?.value||'Cash',months=method==='Cash'?null:Number(document.getElementById('orderCreditMonths').value),total=cartPriceTotal(),down=method==='Both'?Number(document.getElementById('orderDownPayment').value||0):0;
 if(method!=='Cash'&&total!==null&&(down<0||down>=total)){msg.textContent='Enter a down payment lower than the order total.';btn.disabled=false;return;}
 const balance=total===null?null:total-down,monthly=balance!==null&&months?Math.round(balance/months):null,items=cart.map(p=>({product_id:String(p.id),name:p.name,quantity:p.qty,price_text:p.price_text||'Price on enquiry'})),orderId=crypto.randomUUID();
 const payNote=method==='Cash'?'Payment preference: Cash.':('Payment preference: '+method+'; duration: '+months+' months; cash down payment: '+(method==='Both'?'PKR '+down.toLocaleString('en-PK'):'PKR 0')+'; estimated financed balance: '+(balance===null?'To be confirmed':'PKR '+Math.round(balance).toLocaleString('en-PK'))+'; indicative monthly amount: '+(monthly===null?'To be confirmed':'PKR '+monthly.toLocaleString('en-PK'))+'. Subject to showroom confirmation.');
 const order={id:orderId,customer_name:customer.name,customer_phone:customer.phone,delivery_address:customer.address,city:customer.city,customer_note:[customer.note,payNote].filter(Boolean).join('\\n'),items,subtotal_amount:total,delivery_charge:null,final_amount:null,payment_method:method,status:'New'};
 if(!supabase){msg.textContent='Order saving is not configured. Please contact us on WhatsApp.';btn.disabled=false;return;}
 const {error}=await supabase.from('site_orders').insert(order);if(error){msg.textContent='Could not save order: '+error.message+' Please try again or contact us on WhatsApp.';btn.disabled=false;return;}
 const money=n=>'PKR '+Math.round(n).toLocaleString('en-PK'),detail=method==='Cash'?'Cash payment':method==='Credit'?'Credit plan for '+months+' months':'Both: cash down payment '+money(down)+' and balance on credit for '+months+' months';
 const message='*NEW AUR-K EV ORDER*\\nOrder reference: '+orderId+'\\nItems: '+items.map(x=>x.name+' x '+x.quantity+' ('+x.price_text+')').join('; ')+'\\nCustomer: '+customer.name+'\\nPhone: '+customer.phone+'\\nAddress: '+customer.address+', '+customer.city+'\\nPayment preference: '+detail+'\\nEstimated monthly amount: '+(monthly===null?'To be confirmed':money(monthly)+' (indicative)')+'\\nPlease confirm final price, eligibility and actual terms.';
 msg.textContent='Order saved successfully. Opening WhatsApp…';whatsapp(message);cart=[];renderCart();e.target.reset();updatePaymentOptions();closeOrder();btn.disabled=false;
});
document.getElementById('contactWhatsApp').onclick=e=>{e.preventDefault();whatsapp('Hello AUR-K EV, I would like to know more about your electric scooters.');};document.getElementById('menuToggle').onclick=()=>document.getElementById('nav').classList.toggle('show');document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>document.getElementById('nav').classList.remove('show')));document.getElementById('year').textContent=new Date().getFullYear();
renderProducts();renderCart();
if(!SUPABASE_URL.startsWith('PASTE_')&&!SUPABASE_ANON_KEY.startsWith('PASTE_')){try{supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);const [{data:products,error:productError},{data:images}]=await Promise.all([supabase.from('site_products').select('id,name,category,tag,price_text,description,image_url,specifications,featured,created_at').order('created_at',{ascending:false}),supabase.from('site_images').select('*').order('created_at',{ascending:false})]);PRODUCT_IMAGES=images||[];const activeHero=PRODUCT_IMAGES.find(x=>x.slot==="hero"&&x.public_url);const heroElement=document.getElementById("heroImage");if(activeHero&&heroElement)heroElement.src=activeHero.public_url;if(!productError&&products?.length){PRODUCTS=products;renderProducts();}else if(!productError&&(!products||!products.length)&&images?.length){const imageProducts=images.filter(x=>x.slot==='product').map((x,i)=>({id:x.id||('image-'+i),name:x.product_name||x.title||'AUR-K EV Scooter',category:'premium',tag:'AUR-K EV',price_text:'Ask for price',description:'Contact us for details and availability.',image_url:x.public_url}));if(imageProducts.length){PRODUCTS=imageProducts;renderProducts();}}}catch(e){console.warn('Could not load live AUR-K EV content.',e);}}
openRequestedProduct();
if(supabase){loadPublicReviews();const reviewProduct=document.getElementById('reviewProduct');if(reviewProduct)PRODUCTS.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=p.name;reviewProduct.append(o);});}


/* AUR-K EV side-by-side scooter comparison */
const aurkCompareSelection=new Set();
(function setupAurkCompare(){
 const styleDock=`<aside id="aurkCompareDock" class="compare-dock" hidden><div><b id="aurkCompareCount">0 scooters selected</b><span>Select 2 or 3 models to compare.</span></div><div class="compare-dock-actions"><button type="button" id="aurkCompareClear">Clear</button><button type="button" id="aurkCompareOpen" disabled>Compare now</button></div></aside><div id="aurkCompareModal" class="compare-modal" hidden><div class="compare-panel" role="dialog" aria-modal="true" aria-labelledby="aurkCompareTitle"><div class="compare-head"><div><p class="eyebrow">AUR-K EV • SIDE BY SIDE</p><h2 id="aurkCompareTitle">Compare scooters</h2></div><button type="button" id="aurkCompareClose" aria-label="Close comparison">✕</button></div><div id="aurkCompareTable" class="compare-table-wrap"></div><p class="compare-footnote">Prices and specifications are shown as listed. Confirm current availability and final price with our showroom.</p></div></div>`;
 document.body.insertAdjacentHTML('beforeend',styleDock);
 const sync=()=>{document.getElementById('aurkCompareDock').hidden=!aurkCompareSelection.size;document.getElementById('aurkCompareCount').textContent=aurkCompareSelection.size+' scooter'+(aurkCompareSelection.size===1?'':'s')+' selected';document.getElementById('aurkCompareOpen').disabled=aurkCompareSelection.size<2;document.querySelectorAll('.compare-toggle').forEach(b=>{const on=aurkCompareSelection.has(String(b.dataset.compareId));b.classList.toggle('selected',on);b.textContent=on?'✓ Added to compare':'＋ Compare';});};
 document.getElementById('productGrid').addEventListener('click',e=>{const b=e.target.closest('.compare-toggle');if(!b)return;const id=String(b.dataset.compareId);if(aurkCompareSelection.has(id))aurkCompareSelection.delete(id);else if(aurkCompareSelection.size<3)aurkCompareSelection.add(id);else{alert('You can compare up to 3 scooters at a time.');return;}sync();});
 document.getElementById('aurkCompareClear').onclick=()=>{aurkCompareSelection.clear();sync();};
 document.getElementById('aurkCompareClose').onclick=()=>document.getElementById('aurkCompareModal').hidden=true;
 document.getElementById('aurkCompareModal').addEventListener('click',e=>{if(e.target.id==='aurkCompareModal')e.currentTarget.hidden=true;});
 document.getElementById('aurkCompareOpen').onclick=()=>{
  const selected=PRODUCTS.filter(p=>aurkCompareSelection.has(String(p.id)));if(selected.length<2)return;
  const parsed=selected.map(p=>{const m={};productSpecs(p.specifications).forEach(line=>{const n=line.indexOf(':');if(n>0)m[line.slice(0,n).trim()]=line.slice(n+1).trim();});return m;});
  const keys=[...new Set(['Price',...parsed.flatMap(Object.keys)])];
  const head='<thead><tr><th>Specification</th>'+selected.map(p=>'<th><div class="compare-product-head">'+(p.image_url?'<img src="'+esc(p.image_url)+'" alt="">':'')+'<b>'+esc(p.name)+'</b><a href="?product='+encodeURIComponent(p.id)+'">View details ↗</a></div></th>').join('')+'</tr></thead>';
  const body='<tbody>'+keys.map(k=>'<tr><th>'+esc(k)+'</th>'+selected.map((p,i)=>'<td>'+esc(k==='Price'?(p.price_text||'Ask for price'):(parsed[i][k]||'Not listed'))+'</td>').join('')+'</tr>').join('')+'</tbody>';
  document.getElementById('aurkCompareTable').innerHTML='<table class="compare-table">'+head+body+'</table>';
  document.getElementById('aurkCompareModal').hidden=false;
 };
 const observer=new MutationObserver(sync);observer.observe(document.getElementById('productGrid'),{childList:true});sync();
})();

/* AURK customer reviews */
async function loadPublicReviews(){
 const host=document.getElementById('publicReviews');if(!host||!supabase)return;
 const {data,error}=await supabase.from('site_reviews').select('id,customer_name,rating,review_text,product_id,created_at').eq('status','approved').order('created_at',{ascending:false}).limit(12);
 if(error){host.innerHTML='<p>Customer reviews will appear here soon.</p>';console.warn('Reviews unavailable',error);return;}
 if(!data?.length){host.innerHTML='<p class="review-empty">Be among the first customers to share a verified experience.</p>';return;}
 host.innerHTML=data.map(r=>'<article class="public-review-card"><div class="review-stars" aria-label="'+r.rating+' out of 5 stars">'+('★'.repeat(r.rating))+('☆'.repeat(5-r.rating))+'</div><p>'+esc(r.review_text)+'</p><div class="review-by"><b>'+esc(r.customer_name)+'</b><small>'+(PRODUCTS.find(p=>String(p.id)===String(r.product_id))?.name||'AUR-K EV customer')+'</small></div></article>').join('');
}
const reviewForm=document.getElementById('reviewForm');
if(reviewForm){
 reviewForm.addEventListener('submit',async e=>{
  e.preventDefault();const msg=document.getElementById('reviewMessage');if(!supabase){msg.textContent='Please try again in a moment.';return;}
  const btn=reviewForm.querySelector('button[type="submit"]');btn.disabled=true;msg.textContent='Submitting your review…';
  const productId=document.getElementById('reviewProduct').value||null;
  const {error}=await supabase.from('site_reviews').insert({customer_name:document.getElementById('reviewName').value.trim(),rating:Number(document.getElementById('reviewRating').value),review_text:document.getElementById('reviewText').value.trim(),product_id:productId,status:'pending'});
  btn.disabled=false;
  if(error){msg.textContent='Could not submit review: '+error.message;return;}
  reviewForm.reset();msg.textContent='Thank you! Your review has been submitted and will appear after our team approves it.';
 });
}


