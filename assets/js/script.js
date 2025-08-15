// Nailbyzsa interactivity
const slider = document.getElementById('slider');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
let currentIndex = 0;

function updateSlider(index){
  slider.style.transform = `translateX(-${index * 100}%)`;
}

// Buttons
nextBtn.addEventListener('click', ()=>{
  currentIndex = (currentIndex + 1) % slider.children.length;
  updateSlider(currentIndex);
});
prevBtn.addEventListener('click', ()=>{
  currentIndex = (currentIndex - 1 + slider.children.length) % slider.children.length;
  updateSlider(currentIndex);
});

// Touch support
let startX = 0;
slider.addEventListener('touchstart', (e)=>{ startX = e.touches[0].clientX; }, {passive:true});
slider.addEventListener('touchend', (e)=>{
  const endX = e.changedTouches[0].clientX;
  if(endX - startX > 60) prevBtn.click();
  if(startX - endX > 60) nextBtn.click();
});

// Cart (localStorage)
const cartKey = 'nbz_cart_v1';
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const openCart = document.getElementById('openCart');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const proceedCheckout = document.getElementById('proceedCheckout');
const checkoutBtn = document.getElementById('checkoutBtn');

function getCart(){ return JSON.parse(localStorage.getItem(cartKey) || '[]'); }
function saveCart(items){ localStorage.setItem(cartKey, JSON.stringify(items)); refreshCartUI(); }

function addToCart(item){
  const items = getCart();
  const found = items.find(i => i.id === item.id);
  if(found){ found.qty += 1; } else { items.push({...item, qty:1}); }
  saveCart(items);
}

function removeFromCart(id){
  let items = getCart().filter(i => i.id !== id);
  saveCart(items);
}

function changeQty(id, delta){
  const items = getCart();
  const it = items.find(i => i.id === id);
  if(!it) return;
  it.qty = Math.max(1, it.qty + delta);
  saveCart(items);
}

function formatIDR(n){ return 'Rp ' + n.toLocaleString('id-ID'); }

function refreshCartUI(){
  const items = getCart();
  cartCount.textContent = items.reduce((a,b)=>a+b.qty,0);
  cartItems.innerHTML = items.length ? '' : '<p>Keranjang masih kosong.</p>';
  let total = 0;
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div><strong>${it.name}</strong><div class="muted">${formatIDR(it.price)}</div></div>
      <div class="qty">
        <button aria-label="Kurangi" data-action="minus" data-id="${it.id}">-</button>
        <span>${it.qty}</span>
        <button aria-label="Tambah" data-action="plus" data-id="${it.id}">+</button>
      </div>
      <div class="line-total">${formatIDR(it.price * it.qty)}</div>
      <button aria-label="Hapus" data-action="remove" data-id="${it.id}">×</button>
    `;
    cartItems.appendChild(row);
    total += it.price * it.qty;
  });
  cartTotal.textContent = formatIDR(total);
}
refreshCartUI();

// Delegation for cart controls
cartItems.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');
  if(action === 'minus') changeQty(id, -1);
  if(action === 'plus') changeQty(id, +1);
  if(action === 'remove') removeFromCart(id);
});

// Add to cart buttons
document.querySelectorAll('.add-to-cart').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addToCart({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price)
    });
  });
});

// Cart modal controls
openCart.addEventListener('click', ()=>{ cartModal.classList.add('show'); cartModal.setAttribute('aria-hidden','false'); });
document.getElementById('closeCart').addEventListener('click', ()=>{ cartModal.classList.remove('show'); cartModal.setAttribute('aria-hidden','true'); });
cartModal.addEventListener('click', (e)=>{ if(e.target === cartModal){ cartModal.classList.remove('show'); cartModal.setAttribute('aria-hidden','true'); } });

// Checkout buttons
function doCheckout(){
  const items = getCart();
  if(!items.length){ alert('Keranjang kosong. Tambahkan produk dulu ya!'); return; }
  const total = items.reduce((a,b)=>a + b.price*b.qty, 0);
  const message = `Halo Nailbyzsa! Saya ingin checkout:%0A` + 
    items.map(i=>`• ${i.name} x${i.qty} (${formatIDR(i.price)})`).join('%0A') + 
    `%0ATotal: ${formatIDR(total)}%0AAlamat toko: Jln. Sukses No.1`;
  // WhatsApp deep-link (user bisa edit nomor nanti)
  window.location.href = `https://wa.me/?text=${message}`;
}
proceedCheckout.addEventListener('click', doCheckout);
checkoutBtn.addEventListener('click', ()=>{ document.getElementById('openCart').click(); });

// Like buttons (fun interaction)
document.querySelectorAll('.like').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.classList.toggle('active');
    btn.innerHTML = (btn.classList.contains('active') ? '❤ ' : '') + 'Suka';
  });
});

// Testimoni — load from JSON + allow input (stored in localStorage)
const testiKey = 'nbz_testi_v1';
async function loadTestimonials(){
  let base = [];
  try{
    const res = await fetch('data/testimonials.json');
    base = await res.json();
  }catch(e){ /* ignore */ }
  const extra = JSON.parse(localStorage.getItem(testiKey) || '[]');
  return [...base, ...extra];
}

function renderTestimonials(list){
  const wrap = document.getElementById('testimoniList');
  wrap.innerHTML = '';
  list.forEach(t=>{
    const el = document.createElement('div');
    el.className = 'testi-card';
    el.innerHTML = `
      <div class="testi-head">
        <img src="assets/icons/star.svg" alt="" aria-hidden="true" style="width:18px;height:18px">
        <div><div class="testi-name">${t.nama}</div><div class="muted">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div></div>
      </div>
      <p>${t.pesan}</p>
    `;
    wrap.appendChild(el);
  });
}

loadTestimonials().then(renderTestimonials);

// Rating picker
let selectedRating = 5;
document.querySelectorAll('.rating img').forEach(img=>{
  img.addEventListener('click', ()=>{
    selectedRating = Number(img.dataset.val);
    document.querySelectorAll('.rating img').forEach(i=>i.classList.toggle('active', Number(i.dataset.val) <= selectedRating));
  });
});
document.querySelectorAll('.rating img').forEach(i=>{ if(Number(i.dataset.val) <= selectedRating) i.classList.add('active'); });

// Submit testimonial
document.getElementById('testimoniForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const nama = document.getElementById('nama').value.trim() || 'Anonim';
  const pesan = document.getElementById('pesan').value.trim();
  if(!pesan){ return; }
  const newItem = { nama, pesan, rating: selectedRating };
  const arr = JSON.parse(localStorage.getItem(testiKey) || '[]');
  arr.unshift(newItem);
  localStorage.setItem(testiKey, JSON.stringify(arr));
  loadTestimonials().then(renderTestimonials);
  e.target.reset();
  selectedRating = 5;
  document.querySelectorAll('.rating img').forEach(i=>i.classList.toggle('active', Number(i.dataset.val) <= selectedRating));
});

// Year
document.getElementById('year').textContent = new Date().getFullYear();
