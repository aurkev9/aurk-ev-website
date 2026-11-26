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
    ${specs.length?`<ul class="product-specs">${specs.slice(0,3).map((s,i)=>detailSpecMarkup(s,i)).join('')}</ul>`:''}
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

window.addToCart=id=>{const p=PRODUCTS.find(x=>String(x.id)===String(id));if(!p)return;const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty++;else cart.push({...p,qty:1,selectedVariant:null});renderCart();document.getElementById('cartOverlay').classList.add('open');};
window.removeFromCart=id=>{cart=cart.filter(p=>String(p.id)!==String(id));renderCart();updatePaymentOptions();};
function getProductVariants(p){const text=String(p.price_text||'');const matches=[...text.matchAll(/(?:Rs\.?|PKR)\s*([0-9][0-9,]*)\s*\(([^)]+)\)/gi)];if(matches.length<2)return [];return matches.map(m=>({label:m[2].trim(),price:Number(m[1].replace(/,/g,''))}));}
function renderCart(){document.getElementById('cartCount').textContent=cart.reduce((n,p)=>n+p.qty,0);document.getElementById('cartItems').innerHTML=cart.length?cart.map(p=>{const variants=getProductVariants(p);return '<div class="cart-line"><span><b>'+esc(p.name)+'</b><br>Quantity: '+p.qty+(variants.length?'<label class="cart-variant-label">Battery version<select class="cart-variant-select" data-product-id="'+esc(p.id)+'"><option value="">Choose version</option>'+variants.map((v,i)=>'<option value="'+i+'" '+(p.selectedVariant===i?'selected':'')+'>'+esc(v.label)+' — PKR '+v.price.toLocaleString('en-PK')+'</option>').join('')+'</select></label>':('<br>'+esc(p.price_text||'Price on enquiry')) )+'</span><button onclick="removeFromCart(\''+esc(p.id)+'\')">Remove</button></div>';}).join(''):'<p class="empty">Your bag is waiting for its first ride.</p>';document.getElementById('cartTotal').textContent=cartPriceTotal()===null?'Select versions to see price':'PKR '+Math.round(cartPriceTotal()).toLocaleString('en-PK');}
document.getElementById('cartItems').addEventListener('change',e=>{if(!e.target.matches('.cart-variant-select'))return;const p=cart.find(x=>String(x.id)===e.target.dataset.productId);if(p)p.selectedVariant=e.target.value===''?null:Number(e.target.value);renderCart();updatePaymentOptions();});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderProducts(b.dataset.filter);}));
document.getElementById('productSearch')?.addEventListener('input',e=>renderProducts(activeProductFilter,e.target.value.trim().toLowerCase(),activeProductSort));
document.getElementById('productSort')?.addEventListener('change',e=>renderProducts(activeProductFilter,activeProductQuery,e.target.value));
document.getElementById('cartOpen').onclick=()=>document.getElementById('cartOverlay').classList.add('open');document.getElementById('cartClose').onclick=()=>document.getElementById('cartOverlay').classList.remove('open');document.getElementById('cartOverlay').addEventListener('click',e=>{if(e.target.id==='cartOverlay')e.currentTarget.classList.remove('open');});
function whatsapp(m){window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(m),'_blank','noopener');}
const orderModal=document.getElementById('orderModal');
function closeOrder(){orderModal.classList.remove('open');orderModal.setAttribute('aria-hidden','true');}
document.getElementById('checkout').onclick=()=>{if(!cart.length){alert('Your bag is empty.');return;}document.getElementById('cartOverlay').classList.remove('open');document.getElementById('orderVariantChoices').innerHTML=cart.map(p=>{const vs=getProductVariants(p);return vs.length?'<label class="order-variant-row"><b>'+esc(p.name)+'</b><span>Choose battery version</span><select data-order-variant="'+esc(p.id)+'"><option value="">Select Lithium or Graphene</option>'+vs.map((v,i)=>'<option value="'+i+'" '+(p.selectedVariant===i?'selected':'')+'>'+esc(v.label)+' — PKR '+v.price.toLocaleString('en-PK')+'</option>').join('')+'</select></label>':'';}).join('');;orderModal.classList.add('open');orderModal.setAttribute('aria-hidden','false');};
document.getElementById('orderClose').onclick=closeOrder;
orderModal.addEventListener('click',e=>{if(e.target===orderModal)closeOrder();});
function parsePriceAmount(value){const text=String(value??'').trim();if(!text||text.includes('/'))return null;const match=text.match(/(?:PKR|Rs\.?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i)||text.match(/^\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)(?=\s|$)/);if(!match)return null;const amount=Number(match[1].replace(/,/g,''));return Number.isFinite(amount)&&amount>0?amount:null;}
function selectedUnitPrice(p){const variants=getProductVariants(p);if(variants.length)return p.selectedVariant===null||p.selectedVariant===undefined?null:variants[p.selectedVariant]?.price??null;return parsePriceAmount(p.price_text);}
function cartPriceTotal(){const amounts=cart.map(p=>{const unit=selectedUnitPrice(p);return unit===null?null:unit*p.qty;});return amounts.every(x=>x!==null)?amounts.reduce((x,y)=>x+y,0):null;}
function creditMarkupPercent(months){return ({3:10,6:25,9:30,12:40,24:50})[Number(months)]||0;}
function updatePaymentOptions(){const method=document.querySelector('input[name="paymentChoice"]:checked')?.value||'Cash';document.getElementById('creditOptions').hidden=method==='Cash';document.getElementById('orderDownPaymentWrap').hidden=method!=='Both';const total=cartPriceTotal(),out=document.getElementById('orderCreditEstimate'),grid=document.getElementById('orderPlanBreakdown');if(method==='Cash'){out.textContent='Full payment in cash.';grid.innerHTML='';return;}if(total===null){out.textContent='Price not listed. The showroom will confirm the monthly amounts.';grid.innerHTML='<p class="plan-empty">Plan prices will appear once the scooter price is confirmed.</p>';return;}const down=method==='Both'?Number(document.getElementById('orderDownPayment').value||0):0;if((method==='Both'&&down<=0)||down<0||down>=total){out.textContent='Enter a cash down payment above zero and lower than the order total.';grid.innerHTML='';return;}const balance=total-down,selected=Number(document.getElementById('orderCreditMonths').value),money=n=>'PKR '+Math.round(n).toLocaleString('en-PK');out.textContent=(method==='Both'?'Cash down payment: '+money(down)+' • ':'')+'Credit balance: '+money(balance)+'. Markup is added according to the selected plan.';grid.innerHTML='<div class="plan-breakdown-title">Monthly plan estimates</div>'+[3,6,9,12,24].map(m=>{const rate=creditMarkupPercent(m),payable=balance*(1+rate/100),monthly=payable/m;return '<button type="button" class="plan-price-card '+(m===selected?'selected':'')+'" data-months="'+m+'"><span>'+m+' months · '+rate+'% markup</span><b>'+money(monthly)+'</b><small>per month · total '+money(payable)+'</small></button>';}).join('');grid.querySelectorAll('[data-months]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('orderCreditMonths').value=b.dataset.months;updatePaymentOptions();}));}
document.querySelectorAll('input[name="paymentChoice"]').forEach(x=>x.addEventListener('change',updatePaymentOptions));document.getElementById('orderCreditMonths').addEventListener('change',updatePaymentOptions);document.getElementById('orderDownPayment').addEventListener('input',updatePaymentOptions);
document.getElementById('orderVariantChoices').addEventListener('change',e=>{if(!e.target.matches('[data-order-variant]'))return;const p=cart.find(x=>String(x.id)===e.target.dataset.orderVariant);if(p)p.selectedVariant=e.target.value===''?null:Number(e.target.value);updatePaymentOptions();});

async function generateAurkInvoicePDF({invoiceNo,billDate,customer,items,total,method,months,markup,down,balance,creditTotal,monthly}){
 let JsPDF=window.jspdf?.jsPDF;
 if(!JsPDF){
  const sources=['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js'];
  for(const src of sources){try{await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error('Could not load '+src));document.head.appendChild(script);});JsPDF=window.jspdf?.jsPDF;if(JsPDF)break;}catch(loadError){console.warn('AUR-K invoice library source failed',loadError);}}
 }
 if(!JsPDF)throw new Error('PDF library could not load. Check your internet connection and try again.');
 const doc=new JsPDF({unit:'mm',format:'a4'});
 const W=210, left=16, right=194;
 const gold=[197,157,83], ink=[24,24,24], muted=[105,105,105], pale=[247,244,237];
 const money=n=>n===null||n===undefined?'To be confirmed':'PKR '+Math.round(n).toLocaleString('en-PK');
 const line=(y)=>{doc.setDrawColor(220,215,205);doc.setLineWidth(.25);doc.line(left,y,right,y);};
 doc.setFillColor(...ink);doc.rect(0,0,W,43,'F');
 doc.setFillColor(...gold);doc.rect(0,43,W,2,'F');
 doc.setTextColor(...gold);doc.setFont('helvetica','bold');doc.setFontSize(22);doc.text('AUR-K',left,17);
 doc.setTextColor(255,255,255);doc.setFontSize(9);doc.text('EV BIKE EXPERTS',left,24);
 doc.setTextColor(238,232,220);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('FAISALABAD, PAKISTAN',left,31);
 doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('CUSTOMER ORDER INVOICE',right,18,{align:'right'});
 doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('ORDER CONFIRMATION  •  PAYMENT PENDING',right,25,{align:'right'});
 let y=55;
 doc.setTextColor(...muted);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('INVOICE NUMBER',left,y);
 doc.text('ORDER DATE',right-48,y);
 y+=6;doc.setTextColor(...ink);doc.setFontSize(10);doc.text(invoiceNo,left,y);doc.text(billDate,right-48,y);
 y+=9;line(y);y+=8;
 doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...ink);doc.text('BILL TO',left,y);
 doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(String(customer.name||'').slice(0,70),left,y+7);
 doc.setTextColor(...muted);doc.setFontSize(8);doc.text(String(customer.phone||''),left,y+13);
 const address=(String(customer.address||'')+', '+String(customer.city||'')).slice(0,100);
 const addrLines=doc.splitTextToSize(address,105);doc.text(addrLines,left,y+19);
 y+=27+Math.max(0,addrLines.length-1)*4;line(y);y+=9;
 doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('ORDER DETAILS',left,y);y+=7;
 doc.setFillColor(...pale);doc.roundedRect(left,y,right-left,9,1.5,1.5,'F');
 doc.setFontSize(7);doc.setTextColor(...muted);doc.text('PRODUCT',left+3,y+6);doc.text('QTY',140,y+6,{align:'center'});doc.text('UNIT PRICE',160,y+6,{align:'right'});doc.text('AMOUNT',right-3,y+6,{align:'right'});
 y+=14;
 for(let i=0;i<items.length;i++){
  const item=items[i], unit=parsePriceAmount(item.price_text), amount=unit===null?null:unit*item.quantity;
  const nameLines=doc.splitTextToSize(String(item.name||'Electric scooter'),95);
  if(y+Math.max(12,nameLines.length*4)+12>265){doc.addPage();y=22;}
  doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text(nameLines,left+3,y);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(String(item.quantity),140,y,{align:'center'});doc.text(money(unit),160,y,{align:'right'});doc.text(money(amount),right-3,y,{align:'right'});
  y+=Math.max(9,nameLines.length*4+3);line(y);y+=6;
 }
 if(y>245){doc.addPage();y=22;}
 const totalBoxY=y;
 doc.setTextColor(...muted);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text('Subtotal',right-62,y+5);doc.setTextColor(...ink);doc.text(money(total),right-3,y+5,{align:'right'});
 doc.setTextColor(...muted);doc.text('Delivery charges',right-62,y+12);doc.setTextColor(...ink);doc.text('To be confirmed',right-3,y+12,{align:'right'});
 doc.setFillColor(...ink);doc.roundedRect(left,y+18,right-left,13,1.5,1.5,'F');
 doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('ORDER TOTAL',left+4,y+26);doc.setTextColor(...gold);doc.setFontSize(11);doc.text(money(total),right-4,y+26,{align:'right'});
 y+=42;
 if(y>245){doc.addPage();y=22;}
 doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('PAYMENT SUMMARY',left,y);y+=7;
 const rows=method==='Cash'?[['Payment method','Cash'],['Payment status','Pending confirmation']]:[
  ['Payment method',method],['Credit duration',months+' months'],['Markup rate',markup+'%'],
  ['Cash down payment',money(method==='Both'?down:0)],['Credit balance before markup',money(balance)],
  ['Total credit repayment',money(creditTotal)],['Monthly installment',money(monthly)+' approx.']
 ];
 const rowH=8, boxH=rows.length*rowH+6;
 doc.setFillColor(...pale);doc.roundedRect(left,y,right-left,boxH,2,2,'F');
 rows.forEach((r,i)=>{const yy=y+6+i*rowH;doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);doc.text(r[0],left+4,yy);doc.setFont('helvetica','bold');doc.setTextColor(...ink);doc.text(String(r[1]),right-4,yy,{align:'right'});});
 y+=boxH+10;
 if(y>263){doc.addPage();y=22;}
 doc.setDrawColor(...gold);doc.setLineWidth(.6);doc.line(left,y,right,y);y+=8;
 doc.setTextColor(...ink);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('THANK YOU FOR CHOOSING AUR-K EV.',W/2,y,{align:'center'});
 doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(...muted);
 doc.text('Mansoorabad, Jhumra Road, Faisalabad  •  WhatsApp: 0323-9661747',W/2,y+6,{align:'center'});
 doc.setFontSize(7);doc.text('This is an order confirmation request, not proof of payment.',W/2,y+12,{align:'center'});
 const pages=doc.getNumberOfPages();
 for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...muted);doc.text('AUR-K EV BIKE EXPERTS',left,287);doc.text('Page '+p+' of '+pages,right,287,{align:'right'});}
 const filename='AURK-ORDER-'+invoiceNo.replace(/[^A-Z0-9-]/g,'')+'.pdf';
 doc.save(filename);
 return filename;
}

document.getElementById('customerOrderForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!cart.length){alert('Your bag is empty. Please add a scooter again.');closeOrder();return;}
 const msg=document.getElementById('orderMessage'),btn=document.getElementById('placeOrderBtn');btn.disabled=true;msg.textContent='Submitting your order…';
 const customer={name:document.getElementById('customerName').value.trim(),phone:document.getElementById('customerPhone').value.trim(),address:document.getElementById('customerAddress').value.trim(),city:document.getElementById('customerCity').value.trim(),note:document.getElementById('customerNote').value.trim()};
 const unselected=cart.filter(p=>getProductVariants(p).length&&selectedUnitPrice(p)===null);if(unselected.length){msg.textContent='Please select Lithium or Graphene version for: '+unselected.map(p=>p.name).join(', ');btn.disabled=false;return;}const method=document.querySelector('input[name="paymentChoice"]:checked')?.value||'Cash',months=method==='Cash'?null:Number(document.getElementById('orderCreditMonths').value),total=cartPriceTotal(),down=method==='Both'?Number(document.getElementById('orderDownPayment').value||0):0;
 if(method!=='Cash'&&total!==null&&((method==='Both'&&down<=0)||down<0||down>=total)){msg.textContent='Enter a cash down payment above zero and lower than the order total.';btn.disabled=false;return;}
 const balance=total===null?null:total-down,markup=method==='Cash'?0:creditMarkupPercent(months),creditTotal=balance===null?null:Math.round(balance*(1+markup/100)),monthly=creditTotal!==null&&months?Math.round(creditTotal/months):null,items=cart.map(p=>{const variants=getProductVariants(p),variant=variants.length?variants[p.selectedVariant]:null;return {product_id:String(p.id),name:p.name,quantity:p.qty,price_text:variant?'PKR '+variant.price.toLocaleString('en-PK'):(p.price_text||'Price on enquiry'),selected_version:variant?.label||null,unit_price:selectedUnitPrice(p)};}),orderId=crypto.randomUUID();
 const payNote=method==='Cash'?'Payment preference: Cash.':('Payment preference: '+method+'; duration: '+months+' months; markup: '+markup+'%; cash down payment: '+(method==='Both'?'PKR '+down.toLocaleString('en-PK'):'PKR 0')+'; credit balance before markup: '+(balance===null?'To be confirmed':'PKR '+Math.round(balance).toLocaleString('en-PK'))+'; total credit repayment including markup: '+(creditTotal===null?'To be confirmed':'PKR '+creditTotal.toLocaleString('en-PK'))+'; monthly installment: '+(monthly===null?'To be confirmed':'PKR '+monthly.toLocaleString('en-PK'))+'. Subject to showroom confirmation.');
 const order={id:orderId,customer_name:customer.name,customer_phone:customer.phone,delivery_address:customer.address,city:customer.city,customer_note:[customer.note,payNote].filter(Boolean).join('\\n'),items,subtotal_amount:total,delivery_charge:null,final_amount:null,payment_method:method,credit_duration_months:method==='Cash'?null:months,cash_down_payment_amount:method==='Both'?down:(method==='Credit'?0:null),credit_balance_amount:method==='Cash'?null:balance,monthly_installment_amount:method==='Cash'?null:monthly,status:'New'};
 if(!supabase){msg.textContent='Order saving is not configured. Please contact us on WhatsApp.';btn.disabled=false;return;}
 const {error}=await supabase.from('site_orders').insert(order);if(error){msg.textContent='Could not save order: '+error.message+' Please try again or contact us on WhatsApp.';btn.disabled=false;return;}
 const money=n=>'PKR '+Math.round(n).toLocaleString('en-PK');
 const billDate=new Date().toLocaleString('en-PK',{timeZone:'Asia/Karachi',dateStyle:'medium',timeStyle:'short'});
 const invoiceNo='AURK-'+new Date().getFullYear()+'-'+orderId.slice(0,8).toUpperCase();
 let invoiceFile;
 try{
  invoiceFile=await generateAurkInvoicePDF({invoiceNo,billDate,customer,items,total,method,months,markup,down,balance,creditTotal,monthly});
 }catch(pdfError){
  console.error('Invoice PDF could not be generated',pdfError);
  msg.textContent='Your order is saved, but the PDF could not be generated ('+(pdfError?.message||'unknown PDF error')+'). Please contact our showroom with order '+invoiceNo+'.';
  btn.disabled=false;return;
 }
 const orderHeading=method==='Cash'?'NEW CASH ON DELIVERY ORDER':(method==='Credit'?'NEW CREDIT ORDER':'NEW CASH + CREDIT ORDER');
 const itemLines=items.map(item=>{
  const unit=Number(item.unit_price)||parsePriceAmount(item.price_text),lineTotal=unit===null?null:unit*item.quantity;
  const listed=String(item.price_text||'Price on enquiry').replace(/\s*\/\s*/g,' / ');
  return '• *'+item.name+'*\n  Qty: '+item.quantity+'\n  Listed price: '+listed+'\n  Line total: '+(lineTotal===null?'To be confirmed by showroom':money(lineTotal));
 }).join('\n\n');
 const paymentDetails=method==='Cash'?'Cash on Delivery (COD)':(method==='Credit'?'Credit Plan: '+months+' months\nMarkup: '+markup+'%\nCredit balance: '+(balance===null?'To be confirmed':money(balance))+'\nTotal repayment: '+(creditTotal===null?'To be confirmed':money(creditTotal))+'\nMonthly installment: '+(monthly===null?'To be confirmed':money(monthly)):'Cash down payment: '+money(down)+'\nCredit plan: '+months+' months ('+markup+'% markup)\nRemaining credit balance: '+(balance===null?'To be confirmed':money(balance))+'\nTotal credit repayment: '+(creditTotal===null?'To be confirmed':money(creditTotal))+'\nMonthly installment: '+(monthly===null?'To be confirmed':money(monthly)));
 const amountLabel=total===null?'To be confirmed after product configuration is selected':money(total);
 const message='*AUR-K EV  |  ORDER REQUEST*\n'+'*'+orderHeading+'*\n\n'+'Assalam-o-Alaikum AUR-K EV Team,\n'+'I have submitted an order request through your website. Kindly review the details below.\n\n'+'*01  ORDER REFERENCE*\n'+'Order ID: '+orderId+'\n'+'Invoice: '+invoiceNo+'\n\n'+'*02  ORDER SUMMARY*\n'+itemLines+'\n\n'+'*03  PRICE & DELIVERY*\n'+'Subtotal: '+amountLabel+'\n'+'Delivery: To be confirmed\n'+'*Total payable: To be confirmed by AUR-K EV*\n\n'+'*04  CUSTOMER DETAILS*\n'+'Name: '+customer.name+'\n'+'Mobile: '+customer.phone+'\n'+'Address: '+customer.address+'\n'+'City: '+customer.city+'\n'+'Instructions: '+(customer.note||'None')+'\n\n'+'*05  PAYMENT METHOD*\n'+paymentDetails+'\n\n'+'*SHOWROOM CONFIRMATION*\n'+'Please confirm the selected configuration, availability, final price, delivery charges and estimated delivery date.\n\n'+'Thank you for your assistance.\n'+'*AUR-K EV BIKE EXPERTS*\n'+'_Premium Electric Mobility_\n\n'+'Please attach the downloaded invoice PDF before sending this message.'; msg.textContent='Order saved. Invoice PDF downloaded. Opening WhatsApp…';whatsapp(message);cart=[];renderCart();e.target.reset();updatePaymentOptions();closeOrder();btn.disabled=false;
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


