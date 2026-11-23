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
function renderProducts(filter='all'){
 const visible=PRODUCTS.filter(p=>filter==='all'||p.category===filter);
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
    ${specs.length?`<ul class="product-specs">${specs.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}
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
    <div class="detail-main-image"><img id="detailMainImage" src="${esc(image)}" alt="${esc(product.name)} electric scooter"></div>
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
document.getElementById('cartOpen').onclick=()=>document.getElementById('cartOverlay').classList.add('open');document.getElementById('cartClose').onclick=()=>document.getElementById('cartOverlay').classList.remove('open');document.getElementById('cartOverlay').addEventListener('click',e=>{if(e.target.id==='cartOverlay')e.currentTarget.classList.remove('open');});
function whatsapp(m){window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(m),'_blank','noopener');}
const orderModal=document.getElementById('orderModal');
function closeOrder(){orderModal.classList.remove('open');orderModal.setAttribute('aria-hidden','true');}
document.getElementById('checkout').onclick=()=>{if(!cart.length){alert('Your bag is empty.');return;}document.getElementById('cartOverlay').classList.remove('open');orderModal.classList.add('open');orderModal.setAttribute('aria-hidden','false');};
document.getElementById('orderClose').onclick=closeOrder;
orderModal.addEventListener('click',e=>{if(e.target===orderModal)closeOrder();});
document.getElementById('customerOrderForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!cart.length){alert('Your bag is empty. Please add a scooter again.');closeOrder();return;}
 const msg=document.getElementById('orderMessage'),btn=document.getElementById('placeOrderBtn');btn.disabled=true;msg.textContent='Submitting your order…';
 const customer={name:document.getElementById('customerName').value.trim(),phone:document.getElementById('customerPhone').value.trim(),address:document.getElementById('customerAddress').value.trim(),city:document.getElementById('customerCity').value.trim(),note:document.getElementById('customerNote').value.trim()};
 const items=cart.map(p=>({product_id:String(p.id),name:p.name,quantity:p.qty,price_text:p.price_text||'Price on enquiry'}));
 const orderId=crypto.randomUUID();
 const parsePrice=value=>{const m=String(value??'').match(/^\s*(?:Rs\.?|PKR)?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i);return m?Number(m[1].replace(/,/g,'')):null;};
 const subtotalValues=items.map(x=>{const n=parsePrice(x.price_text);return n===null?null:n*x.quantity;});
 const subtotal=subtotalValues.every(x=>x!==null)?subtotalValues.reduce((a,b)=>a+b,0):null;
 const order={id:orderId,customer_name:customer.name,customer_phone:customer.phone,delivery_address:customer.address,city:customer.city,customer_note:customer.note||null,items,subtotal_amount:subtotal,delivery_charge:null,final_amount:null,payment_method:'Cash on Delivery',status:'New'};
 if(!supabase){msg.textContent='Order saving is not configured. Please contact us on WhatsApp.';btn.disabled=false;return;}
 const {error}=await supabase.from('site_orders').insert(order);
 if(error){msg.textContent='Could not save order: '+error.message+' Please try again or contact us on WhatsApp.';btn.disabled=false;return;}
 const pricedItems=items.map(x=>{const match=String(x.price_text||'').match(/^\s*(?:Rs\.?|PKR)?\s*([\d,]+(?:\.\d{1,2})?)\s*$/i);const unitPrice=match?Number(match[1].replace(/,/g,'')):null;return {...x,unitPrice,lineTotal:unitPrice===null?null:unitPrice*x.quantity};});
 const allPricesKnown=pricedItems.every(x=>x.lineTotal!==null);
 const money=n=>'PKR '+n.toLocaleString('en-PK',{maximumFractionDigits:2});
 const itemLines=pricedItems.map(x=>`• ${x.name}\n  Quantity: ${x.quantity}\n  Website Price: ${x.price_text}\n  Line Total: ${x.lineTotal===null?'To be confirmed':money(x.lineTotal)}`).join('\n');
 const message=`*NEW CASH ON DELIVERY ORDER*\n\nAssalam-o-Alaikum AUR-K EV Team,\nI have placed an order through your website. Please review the complete order details below.\n\n*ORDER DETAILS*\nOrder Reference: ${orderId}\n\n${itemLines}\n\n*PRICE SUMMARY*\nSubtotal: ${subtotal===null?'To be confirmed':money(subtotal)}\nDelivery Charges: To be confirmed\n*Final Amount Payable: To be confirmed by AUR-K EV Team*\n\n*CUSTOMER DETAILS*\nName: ${customer.name}\nMobile: ${customer.phone}\nDelivery Address: ${customer.address}, ${customer.city}\nSpecial Instructions: ${customer.note||'None'}\n\n*PAYMENT METHOD*\nCash on Delivery (COD)\n\nPlease confirm product availability, the final total price, delivery charges, and estimated delivery time.\n\nThank you!`;
 msg.textContent='Order saved successfully. Opening WhatsApp…';
 whatsapp(message);cart=[];renderCart();e.target.reset();closeOrder();btn.disabled=false;
});
document.getElementById('contactWhatsApp').onclick=e=>{e.preventDefault();whatsapp('Hello AUR-K EV, I would like to know more about your electric scooters.');};document.getElementById('menuToggle').onclick=()=>document.getElementById('nav').classList.toggle('show');document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>document.getElementById('nav').classList.remove('show')));document.getElementById('year').textContent=new Date().getFullYear();
renderProducts();renderCart();
if(!SUPABASE_URL.startsWith('PASTE_')&&!SUPABASE_ANON_KEY.startsWith('PASTE_')){try{supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);const [{data:products,error:productError},{data:images}]=await Promise.all([supabase.from('site_products').select('id,name,category,tag,price_text,description,image_url,specifications,featured,created_at').order('created_at',{ascending:false}),supabase.from('site_images').select('*').order('created_at',{ascending:false})]);PRODUCT_IMAGES=images||[];if(!productError&&products?.length){PRODUCTS=products;renderProducts();}else if(!productError&&(!products||!products.length)&&images?.length){const imageProducts=images.filter(x=>x.slot==='product').map((x,i)=>({id:x.id||('image-'+i),name:x.product_name||x.title||'AUR-K EV Scooter',category:'premium',tag:'AUR-K EV',price_text:'Ask for price',description:'Contact us for details and availability.',image_url:x.public_url}));if(imageProducts.length){PRODUCTS=imageProducts;renderProducts();}}const hero=images?.find(x=>x.slot==='hero');const featuredProduct=products?.find(p=>p.featured&&p.image_url)||products?.find(p=>p.image_url);const heroImageUrl=hero?.public_url||featuredProduct?.image_url;if(heroImageUrl){const heroImage=document.getElementById('heroImage');if(heroImage)heroImage.src=heroImageUrl;}}catch(e){console.warn('Could not load live AUR-K EV content.',e);}}
openRequestedProduct();


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
