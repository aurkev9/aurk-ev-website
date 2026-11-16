const PRODUCTS = [
 {id:1,name:"ROADKING R99 PRO",type:"premium",tag:"FEATURED MODEL",price: "Ask for price",amount:0,desc:"A bold electric ride for confident everyday journeys.",image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80"},
 {id:2,name:"ROADKING RAPTOR",type:"premium",tag:"PERFORMANCE STYLE",price:"Ask for price",amount:0,desc:"Stand out with a striking design and electric convenience.",image:"https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80"},
 {id:3,name:"AUR-K CITY SERIES",type:"commuter",tag:"CITY COMMUTE",price:"Ask for price",amount:0,desc:"A practical choice for your everyday city routine.",image:"https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80"}
];
const WHATSAPP_NUMBER = "923239661747"; // AUR-K EV showroom WhatsApp
let cart = [];
const grid=document.getElementById("productGrid");
function renderProducts(filter="all"){grid.innerHTML=PRODUCTS.filter(p=>filter==="all"||p.type===filter).map(p=>`<article class="product-card"><div class="product-photo"><img src="${p.image}" alt="${p.name} electric scooter"><span class="product-tag">${p.tag}</span></div><div class="product-info"><small>AUR-K EV COLLECTION</small><h3>${p.name}</h3><p>${p.desc}</p><div class="product-bottom"><span class="price">${p.price}</span><button class="add-btn" onclick="addToCart(${p.id})">Add to bag +</button></div></div></article>`).join("");}
function addToCart(id){const p=PRODUCTS.find(x=>x.id===id);const item=cart.find(x=>x.id===id);if(item)item.qty++;else cart.push({...p,qty:1});renderCart();document.getElementById("cartOverlay").classList.add("open");}
function renderCart(){document.getElementById("cartCount").textContent=cart.reduce((n,p)=>n+p.qty,0);document.getElementById("cartItems").innerHTML=cart.length?cart.map(p=>`<div class="cart-line"><span><b>${p.name}</b><br>Quantity: ${p.qty}</span><button onclick="removeFromCart(${p.id})">Remove</button></div>`).join(""):'<p class="empty">Your bag is waiting for its first ride.</p>';document.getElementById("cartTotal").textContent="Price on enquiry";}
function removeFromCart(id){cart=cart.filter(p=>p.id!==id);renderCart();}
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)}));
document.getElementById("cartOpen").onclick=()=>document.getElementById("cartOverlay").classList.add("open");
document.getElementById("cartClose").onclick=()=>document.getElementById("cartOverlay").classList.remove("open");
document.getElementById("cartOverlay").addEventListener("click",e=>{if(e.target.id==="cartOverlay")e.currentTarget.classList.remove("open")});
function whatsapp(message){if(!WHATSAPP_NUMBER){alert("Please add your WhatsApp number in app.js first.");return;}window.open("https://wa.me/"+WHATSAPP_NUMBER+"?text="+encodeURIComponent(message),"_blank");}
document.getElementById("checkout").onclick=()=>{if(!cart.length){alert("Your bag is empty.");return;}whatsapp("Hello AUR-K EV! I would like to place a CASH ON DELIVERY order for:\n"+cart.map(p=>p.name+" x "+p.qty).join("\n")+"\nPlease confirm availability, final price and delivery charges.\n\nMy name:\nDelivery address:\nContact number:");};
document.getElementById("contactWhatsApp").onclick=e=>{e.preventDefault();whatsapp("Hello AUR-K EV, I would like to know more about your electric scooters.");};
document.getElementById("menuToggle").onclick=()=>document.getElementById("nav").classList.toggle("show");
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("nav").classList.remove("show")));
document.getElementById("year").textContent=new Date().getFullYear();
renderProducts();renderCart();
