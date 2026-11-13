/* ==========================================================================
   app.js — shared UI: header, mega menu, mobile menu, cart, drawer, toast,
   search, quick view, cursor, magnetic, tilt, reveals, page transitions.
   ========================================================================== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmt = n => BRAND.currency + ' ' + Math.round(n).toLocaleString('en-PK');
const U = (id, w = 800, h = 1000, q = 70) => /^(data:|blob:|https?:)/.test(id) ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&q=${q}&w=${w}&h=${h}`;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
const byId = id => PRODUCTS.find(p => p.id === +id);
const catLabel = k => (CATEGORIES.find(c => c.key === k) || {}).label || k;
const brandHTML = () => BRAND.name.split('/').join('<span class="sl">/</span>');

const IC = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><path d="M5 8h14l-1.2 12H6.2L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6 8-6s7 1.5 8 6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M3 12h17M14 6l6 6-6 6"/></svg>',
  chev: '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m2 4 4 4 4-4"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="m5 5 14 14M19 5 5 19"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M12 5v14M5 12h14"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/></svg>',
  tt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2 4.2 5 4.4"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.7 1.8-1.7H18V2.7A22 22 0 0 0 15.4 2.5C12.8 2.5 10.5 4 10.5 7v2.5h-3V13h3v8"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.4L3 21Z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2L9 8.500Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.5l-5.9 3.3 1.3-6.7L2.500 9.500l6.600-.8L12 2.500Z"/></svg>'
};
const stars = (r, n = 5) => '<span class="stars" aria-label="' + r + ' out of 5">' + Array.from({ length: n }, (_, i) => `<i class="${i < Math.round(r) ? 'on' : ''}">${IC.star}</i>`).join('') + '</span>';

/* ---------------------------------------------------------------- store */
const Store = {
  key: BRAND.slug + '-cart',
  wkey: BRAND.slug + '-wish',
  get items() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch (e) { return []; } },
  set items(v) { try { localStorage.setItem(this.key, JSON.stringify(v)); } catch (e) {} document.dispatchEvent(new CustomEvent('cart:change')); },
  count() { return this.items.reduce((a, i) => a + i.qty, 0); },
  subtotal() { return this.items.reduce((a, i) => a + i.qty * i.price, 0); },
  shipping() { const s = this.subtotal(); return s === 0 || s >= BRAND.freeShipOver ? 0 : BRAND.shipFee; },
  add(pid, color, size, qty = 1, imgOverride) {
    const p = byId(pid); const col = p.colors.find(c => c.key === color) || p.colors[0];
    const key = [pid, col.key, size].join('|'); const items = this.items; const ex = items.find(i => i.key === key);
    if (ex) ex.qty += qty; else items.push({ key, id: pid, name: p.name, price: p.price, color: col.name, colorKey: col.key, size, qty, img: imgOverride || col.img });
    this.items = items; return col;
  },
  setQty(key, q) { let items = this.items; const it = items.find(i => i.key === key); if (!it) return; it.qty = q; if (q <= 0) items = items.filter(i => i.key !== key); this.items = items; },
  remove(key) { this.items = this.items.filter(i => i.key !== key); },
  clear() { this.items = []; },
  wish() { try { return JSON.parse(localStorage.getItem(this.wkey)) || []; } catch (e) { return []; } },
  toggleWish(id) { let w = this.wish(); const on = !w.includes(id); w = on ? [...w, id] : w.filter(x => x !== id); try { localStorage.setItem(this.wkey, JSON.stringify(w)); } catch (e) {} return on; }
};

/* ---------------------------------------------------------------- toast */
function toast(msg, action) {
  let box = $('.toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<i>${IC.check}</i><span>${msg}</span>` + (action ? `<button class="toast-act" style="color:var(--accent);font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;margin-left:6px">${action.label}</button>` : '');
  if (action) t.querySelector('.toast-act').onclick = () => { action.fn(); t.remove(); };
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 500); }, 3200);
}

/* ---------------------------------------------------------------- layout injection */
const NAV = [
  { label: 'New In', href: 'shop.html?sort=new', hot: true },
  { label: 'Men', key: 'men' }, { label: 'Women', key: 'women' }, { label: 'Kids', key: 'kids' },
  { label: 'Custom', href: 'customize.html' }, { label: 'About', href: 'about.html' }
];
const MEGA_COLS = [
  { title: 'Tops', items: [['tees', 'Tees'], ['oversized', 'Oversized Tees'], ['graphic', 'Graphic Tees'], ['shirts', 'Shirts'], ['polos', 'Polos'], ['tanks', 'Tank Tops']] },
  { title: 'Layers', items: [['hoodies', 'Hoodies'], ['sweatshirts', 'Sweatshirts'], ['jackets', 'Jackets']] },
];
const MEGA_FEAT = {
  men: { img: () => byId(1).colors[0].img, kick: 'Season 08', t: 'Men' },
  women: { img: () => PRODUCTS.find(p => p.name === 'Cloud Boxy Hoodie').colors[0].img, kick: 'Season 08', t: 'Women' },
  kids: { img: () => byId(5).colors[0].img, kick: 'Mini range', t: 'Kids' }
};
function megaHTML(g) {
  const base = `shop.html?gender=${g}`;
  const cnt = c => PRODUCTS.filter(p => p.gender.includes(g) && p.cat === c).length;
  let i = 0;
  const cols = MEGA_COLS.map(col => `<div class="mega-col"><h4>${col.title}</h4>${col.items.filter(([k]) => cnt(k)).map(([k, l]) => `<a href="${base}&cat=${k}" style="--i:${i++}">${l}<em>${cnt(k)}</em></a>`).join('')}</div>`).join('');
  const f = MEGA_FEAT[g]; let j = 0;
  const more = [['joggers', 'Joggers'], ['', 'All ' + g], ['&sort=new', 'New Arrivals'], ['&sort=best', 'Bestsellers']].concat(g === 'kids' ? [['&size=2-3Y,3-4Y', 'Ages 2–4'], ['&size=5-6Y,7-8Y', 'Ages 5–8'], ['&size=9-10Y,11-12Y,13-14Y', 'Ages 9–14']] : []).concat([['@customize.html?garment=hoodie' + (g === 'kids' ? '&kids=1' : ''), 'Design your own']]);
  const col3 = `<div class="mega-col"><h4>Bottoms &amp; More</h4>${more.filter(([k]) => k !== 'joggers' || cnt('joggers')).map(([k, l]) => `<a href="${k[0] === '@' ? k.slice(1) : k && k !== 'joggers' ? base + k : (k ? base + '&cat=joggers' : base)}" style="--i:${j++ + 4}">${l}</a>`).join('')}</div>`;
  const feat = `<a class="mega-feat" href="${base}&sort=new"><img src="${U(f.img(), 700, 480)}" alt="" loading="lazy"><div><span><small>${f.kick}</small><b>Shop ${f.t}</b></span><span class="go">${IC.arrow}</span></div></a>`;
  return `<div class="mega"><div class="mega-in">${cols}${col3}${feat}</div></div>`;
}
function buildHeader() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const nav = NAV.map(n => {
    if (n.key) return `<div class="nav-item"><a class="nav-link" href="shop.html?gender=${n.key}" aria-haspopup="true">${n.label}<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m2 4 4 4 4-4"/></svg></a>${megaHTML(n.key)}</div>`;
    const act = (n.href.split('#')[0] === page && !n.href.includes('#') && !n.href.includes('?')) ? ' active' : '';
    return `<div class="nav-item"><a class="nav-link${n.hot ? ' hot' : ''}${act}" href="${n.href}">${n.label}</a></div>`;
  }).join('');
  const hdr = document.createElement('header'); hdr.className = 'hdr';
  hdr.innerHTML = `<div class="announce"><span>Free delivery over <b>${fmt(BRAND.freeShipOver)}</b> <em class="ann-x">&nbsp;·&nbsp; Cash on delivery across Pakistan</em></span></div>
  <div class="hdr-in"><a href="index.html" class="logo" aria-label="${BRAND.name} home">${brandHTML()}</a>
  <nav class="nav" aria-label="Primary">${nav}</nav>
  <div class="hdr-tools"><button class="icon-btn" id="searchBtn" aria-label="Search">${IC.search}</button><a class="icon-btn hide-m" href="contact.html" aria-label="Account / support">${IC.user}</a>
  <button class="icon-btn" id="cartBtn" aria-label="Open cart">${IC.cart}<span class="cart-badge" id="cartBadge">0</span></button>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button></div></div>`;
  document.body.prepend(hdr);
  /* mobile menu */
  const mm = document.createElement('div'); mm.className = 'mm'; mm.id = 'mm';
  const mmItems = [
    ...['men', 'women', 'kids'].map(g => ({ label: g, sub: [['All ' + g, `shop.html?gender=${g}`], ...CATEGORIES.filter(c => PRODUCTS.some(p => p.gender.includes(g) && p.cat === c.key)).map(c => [c.label, `shop.html?gender=${g}&cat=${c.key}`])] })),
    { label: 'New In', href: 'shop.html?sort=new' }, { label: 'Custom', href: 'customize.html' }, { label: 'About', href: 'about.html' }, { label: 'Contact', href: 'contact.html' }];
  mm.innerHTML = `<div class="mm-list">${mmItems.map((m, i) => m.sub ? `<div class="mm-item"><button class="mm-row" style="--i:${i}" aria-expanded="false">${m.label}<span class="plus"></span></button><div class="mm-sub"><div class="mm-sub-in">${m.sub.map(s => `<a href="${s[1]}">${s[0]}</a>`).join('')}</div></div></div>` : `<div class="mm-item"><a class="mm-row" style="--i:${i}" href="${m.href}">${m.label}<small>→</small></a></div>`).join('')}</div>
  <div class="mm-foot"><span>${BRAND.email}</span><span>${BRAND.phone}</span></div>`;
  document.body.insertBefore(mm, hdr.nextSibling);
  const burger = $('#burger');
  const setMenu = on => { mm.classList.toggle('open', on); burger.classList.toggle('open', on); burger.setAttribute('aria-expanded', on); document.body.classList.toggle('lock', on); };
  burger.onclick = () => setMenu(!mm.classList.contains('open'));
  $$('.mm-row[aria-expanded]', mm).forEach(b => b.onclick = () => {
    const it = b.parentElement, sub = $('.mm-sub', it), open = !it.classList.contains('sub-open');
    $$('.mm-item.sub-open', mm).forEach(o => { o.classList.remove('sub-open'); $('.mm-sub', o).style.maxHeight = 0; });
    if (open) { it.classList.add('sub-open'); sub.style.maxHeight = sub.scrollHeight + 'px'; }
  });
  $$('a', mm).forEach(a => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width:1101px)').addEventListener('change', e => e.matches && setMenu(false));
  /* scroll behaviour */
  let last = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY; hdr.classList.toggle('solid', y > 40);
    hdr.classList.toggle('hide', y > 400 && y > last + 4 && !mm.classList.contains('open'));
    if (y < last - 4 || y < 400) hdr.classList.remove('hide');
    last = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
  /* mega: open with small intent delay */
  $$('.nav-item').forEach(it => {
    if (!$('.mega', it)) return; let t;
    it.addEventListener('mouseenter', () => { clearTimeout(t); $$('.nav-item.open').forEach(o => o !== it && o.classList.remove('open')); });
    it.addEventListener('mouseleave', () => { t = setTimeout(() => it.classList.remove('open'), 80); });
  });
}
function buildFooter() {
  const cats = CATEGORIES.slice(0, 7).map(c => `<li><a href="shop.html?cat=${c.key}">${c.label}</a></li>`).join('');
  const f = document.createElement('footer'); f.className = 'ft';
  f.innerHTML = `<div class="wrap"><div class="ft-top">
  <div class="ft-brand"><a href="index.html" class="logo" style="font-size:34px">${brandHTML()}</a><p>${BRAND.tagline}. Heavyweight fabrics, loud graphics and cuts built for the street — for men, women and kids.</p><div class="socials"><a href="${BRAND.instagram}" aria-label="Instagram" target="_blank" rel="noopener">${IC.ig}</a><a href="#" aria-label="TikTok">${IC.tt}</a><a href="#" aria-label="Facebook">${IC.fb}</a><a href="https://wa.me/${BRAND.whatsapp}" aria-label="WhatsApp" target="_blank" rel="noopener">${IC.wa}</a></div></div>
  <div><h5>Shop</h5><ul>${cats}</ul></div>
  <div><h5>Company</h5><ul><li><a href="about.html">Our story</a></li><li><a href="customize.html">Design studio</a></li><li><a href="contact.html">Contact</a></li><li><a href="contact.html#faq">FAQ</a></li><li><a href="shop.html?sort=new">New arrivals</a></li></ul></div>
  <div><h5>Support</h5><ul><li><a href="contact.html#faq">Shipping &amp; delivery</a></li><li><a href="contact.html#faq">7-day returns</a></li><li><a href="#" data-size-guide>Size guide</a></li><li><a href="cart.html">Track / checkout</a></li><li><a href="mailto:${BRAND.email}">${BRAND.email}</a></li></ul></div></div></div>
  <div class="ft-giant" aria-hidden="true"><span class="outline-dim">${BRAND.name.split('/').map(s => s).join('<span class="outline-dim sl">/</span>')}</span></div>
  <div class="ft-bot"><div class="wrap" style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;width:100%"><span>© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</span><div class="pay"><span>COD</span><span>VISA</span><span>MASTERCARD</span><span>JAZZCASH</span><span>EASYPAISA</span></div></div></div>`;
  document.body.appendChild(f);
}
function buildDrawer() {
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="overlay"></div>
  <aside class="drawer" id="drawer" aria-label="Shopping cart" aria-hidden="true"><div class="dr-head"><h3>Your cart <span id="drCount">(0)</span></h3><button class="icon-btn" id="drClose" aria-label="Close cart">${IC.x}</button></div>
  <div class="ship-meter" id="shipMeter"></div><div class="dr-body" id="drBody"></div><div class="dr-foot" id="drFoot"></div></aside>`);
  $('#cartBtn').onclick = openDrawer; $('#drClose').onclick = closeDrawer; $('#overlay').onclick = closeAll;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  document.addEventListener('cart:change', renderCart); renderCart();
}
function openDrawer() { renderCart(); $('#drawer').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#overlay').classList.add('on'); document.body.classList.add('lock'); }
function closeDrawer() { $('#drawer').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); if (!$('.modal.on') && !$('#searchOv.on')) $('#overlay').classList.remove('on'); if (!$('.modal.on') && !$('#mm.open')) document.body.classList.remove('lock'); }
function closeAll() { closeDrawer(); $$('.modal.on').forEach(m => m.classList.remove('on')); $('#searchOv')?.classList.remove('on'); $('#overlay').classList.remove('on'); if (!$('#mm.open')) document.body.classList.remove('lock'); }
let lastCount = null;
function renderCart() {
  const items = Store.items, n = Store.count(), sub = Store.subtotal();
  const b = $('#cartBadge'); if (b) { b.textContent = n; b.classList.toggle('on', n > 0); if (lastCount !== null && n > lastCount) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }
  lastCount = n;
  const dc = $('#drCount'); if (!dc) return; dc.textContent = `(${n})`;
  const left = BRAND.freeShipOver - sub;
  $('#shipMeter').innerHTML = left > 0 && n ? `Add <b>${fmt(left)}</b> more for <b>free delivery</b><div class="ship-bar"><i style="transform:scaleX(${Math.min(1, sub / BRAND.freeShipOver)})"></i></div>` : n ? `<b>You've unlocked free delivery</b> ✓<div class="ship-bar"><i style="transform:scaleX(1)"></i></div>` : `Free delivery over <b>${fmt(BRAND.freeShipOver)}</b><div class="ship-bar"><i style="transform:scaleX(0)"></i></div>`;
  $('#drBody').innerHTML = items.length ? items.map((it, i) => `<div class="ci" style="--i:${i}"><a href="${it.custom ? 'customize.html' : 'product.html?id=' + it.id}"><img src="${U(it.img, 200, 250)}" alt="${it.name}"></a><div><h5>${it.name}</h5><p>${it.color} · ${it.size}</p>${it.note ? `<p>${it.note}</p>` : ''}<div class="qty"><button data-q="${it.key}" data-d="-1" aria-label="Decrease">−</button><span>${it.qty}</span><button data-q="${it.key}" data-d="1" aria-label="Increase">+</button></div></div><div><div class="pr">${fmt(it.price * it.qty)}</div><button class="rm" data-rm="${it.key}">Remove</button></div></div>`).join('')
    : `<div class="dr-empty"><div class="display">Empty.</div><p>Nothing here yet. Go grab something loud.</p><a class="btn btn-solid" href="shop.html">Shop all</a></div>`;
  $('#drFoot').innerHTML = items.length ? `<div class="dr-tot"><span>Subtotal</span><b>${fmt(sub)}</b></div><p class="dr-note">Delivery calculated at checkout. Cash on delivery available.</p><a class="btn btn-solid btn-block" href="cart.html#checkout" data-magnetic>Checkout</a><a class="btn btn-line btn-block" href="cart.html">View cart</a>` : '';
  $('#drBody').onclick = e => {
    const q = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
    if (q) { const it = Store.items.find(i => i.key === q.dataset.q); Store.setQty(it.key, it.qty + +q.dataset.d); }
    if (r) Store.remove(r.dataset.rm);
  };
}

/* ---------------------------------------------------------------- search overlay */
function buildSearch() {
  document.body.insertAdjacentHTML('beforeend', `<div class="modal" id="searchOv" role="dialog" aria-label="Search"><div class="modal-bg" data-close></div><div class="modal-box" style="width:min(900px,100%);padding:clamp(24px,4vw,48px)"><button class="modal-x" data-close aria-label="Close">${IC.x}</button>
  <p class="eyebrow">Search the store</p><input id="sq" class="display" style="width:100%;background:none;border:0;border-bottom:2px solid var(--line-2);outline:0;font-size:clamp(34px,6vw,64px);padding:14px 0;margin:12px 0 22px" placeholder="HOODIES, TEES…" autocomplete="off"><div id="sres" class="sres"></div></div></div>
  <style>.sres{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.sres a{display:block}.sres img{aspect-ratio:4/5;object-fit:cover;width:100%;background:var(--bg-3);transition:transform .5s var(--ease)}.sres a:hover img{transform:scale(1.04)}.sres .im{overflow:hidden;margin-bottom:8px}.sres b{font-size:12px;letter-spacing:.08em;text-transform:uppercase;display:block;font-weight:600}.sres span{font-size:13px;color:var(--muted)}.sres .none{grid-column:1/-1;color:var(--muted)}</style>`);
  const ov = $('#searchOv'), inp = $('#sq');
  const run = () => {
    const q = inp.value.trim().toLowerCase();
    const list = (q ? PRODUCTS.filter(p => (p.name + ' ' + catLabel(p.cat) + ' ' + p.gender.join(' ') + ' ' + p.colors.map(c => c.name).join(' ')).toLowerCase().includes(q)) : PRODUCTS.filter(p => p.best)).slice(0, 8);
    $('#sres').innerHTML = list.length ? (q ? '' : '') + list.map(p => `<a href="product.html?id=${p.id}"><div class="im"><img src="${U(p.colors[0].img, 300, 375)}" alt="${p.name}" loading="lazy"></div><b>${p.name}</b><span>${fmt(p.price)}</span></a>`).join('') : '<p class="none">No matches. Try “hoodie”, “tee” or “black”.</p>';
  };
  inp.addEventListener('input', run);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim()) location.href = 'shop.html?q=' + encodeURIComponent(inp.value.trim()); });
  $('#searchBtn').onclick = () => { ov.classList.add('on'); $('#overlay').classList.add('on'); run(); setTimeout(() => inp.focus(), 300); };
  $$('[data-close]', ov).forEach(b => b.onclick = closeAll);
}

/* ---------------------------------------------------------------- product card */
function cardHTML(p, i = 0) {
  const c = p.colors[0], c2 = p.colors[1];
  const g = p.gender.length > 1 ? 'Unisex' : p.gender[0];
  const wished = Store.wish().includes(p.id);
  return `<article class="pc" data-id="${p.id}" data-reveal style="--i:${i % 4}">
  <div class="pc-media" data-tilt data-cursor="view"><a href="product.html?id=${p.id}" class="pc-link" aria-label="${p.name}">
  <img class="im1" src="${U(c.img, 640, 800)}" alt="${p.name} in ${c.name}" loading="lazy" width="640" height="800">
  ${c2 ? `<img class="im2" src="${U(c2.img, 640, 800)}" alt="" loading="lazy" width="640" height="800">` : ''}</a>
  ${p.badge ? `<span class="pc-badge">${p.badge}</span>` : (p.was ? `<span class="pc-badge sale">−${Math.round((1 - p.price / p.was) * 100)}%</span>` : '')}
  <button class="pc-wish${wished ? ' on' : ''}" data-wish="${p.id}" aria-label="Wishlist">${IC.heart}</button>
  <div class="pc-act"><button data-qv="${p.id}">${IC.eye} Quick view</button><button data-quick="${p.id}" aria-label="Quick add">${IC.plus}</button></div></div>
  <div class="pc-info"><div class="pc-top"><h3><a href="product.html?id=${p.id}">${p.name}</a></h3><div class="pc-price">${fmt(p.price)}${p.was ? `<s>${fmt(p.was)}</s>` : ''}</div></div>
  <div class="pc-sub"><span>${catLabel(p.cat)} · ${g}</span><div class="pc-dots">${p.colors.map((cc, k) => `<i class="dot${k ? '' : ' on'}" data-img="${cc.img}" style="--c:${cc.hex}" title="${cc.name}"></i>`).join('')}</div></div></div></article>`;
}
function bindCards(root = document) {
  root.addEventListener('mouseover', e => {
    const d = e.target.closest('.dot'); if (!d) return; const pc = d.closest('.pc'); const im = $('.im1', pc);
    $$('.dot', pc).forEach(x => x.classList.remove('on')); d.classList.add('on'); const u = U(d.dataset.img, 640, 800);
    if (im.src !== u) { im.style.opacity = .3; im.onload = () => im.style.opacity = 1; im.src = u; }
  });
  root.addEventListener('click', e => {
    const w = e.target.closest('[data-wish]'); if (w) { e.preventDefault(); const on = Store.toggleWish(+w.dataset.wish); w.classList.toggle('on', on); toast(on ? 'Saved to wishlist' : 'Removed from wishlist'); return; }
    const qv = e.target.closest('[data-qv]'); if (qv) { e.preventDefault(); openQuickView(+qv.dataset.qv); return; }
    const qa = e.target.closest('[data-quick]'); if (qa) { e.preventDefault(); const p = byId(qa.dataset.quick); const dot = $('.dot.on', qa.closest('.pc')); Store.add(p.id, (p.colors.find(c => c.img === dot?.dataset.img) || p.colors[0]).key, p.sizes[Math.min(2, p.sizes.length - 1)]); toast(`${p.name} added · size ${p.sizes[Math.min(2, p.sizes.length - 1)]}`, { label: 'View cart', fn: openDrawer }); }
  });
}

/* ---------------------------------------------------------------- quick view + size guide */
const SIZE_TABLE = {
  men: [['XS', '34', '27', '17'], ['S', '36', '27.5', '17.5'], ['M', '38–40', '28', '18'], ['L', '42', '29', '19'], ['XL', '44–46', '30', '20'], ['XXL', '48', '31', '21'], ['XXXL', '50–52', '32', '22']],
  women: [['XS', '30', '24', '15'], ['S', '32', '25', '15.5'], ['M', '34–36', '26', '16'], ['L', '38', '27', '16.5'], ['XL', '40', '28', '17'], ['XXL', '42', '29', '17.5'], ['XXXL', '44', '30', '18']],
  kids: [['2-3Y', '92–98 cm', '17', '10.5'], ['3-4Y', '98–104 cm', '18', '11'], ['5-6Y', '110–116 cm', '20', '12'], ['7-8Y', '122–128 cm', '22', '13'], ['9-10Y', '134–140 cm', '24', '14'], ['11-12Y', '146–152 cm', '26', '15'], ['13-14Y', '158–164 cm', '28', '16']]
};
function sizeGuideHTML() {
  const tbl = k => `<table class="sg-t"><thead><tr><th>Size</th><th>${k === 'kids' ? 'Height' : 'Chest (in)'}</th><th>Length (in)</th><th>Shoulder (in)</th></tr></thead><tbody>${SIZE_TABLE[k].map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `<div class="modal" id="sgModal" role="dialog" aria-label="Size guide"><div class="modal-bg" data-close></div><div class="modal-box" style="width:min(720px,100%);padding:clamp(24px,4vw,44px)"><button class="modal-x" data-close aria-label="Close">${IC.x}</button><p class="eyebrow">Fit help</p><h3 class="display h-md" style="margin:12px 0 20px">Size guide</h3>
  <div class="sg-tabs"><button class="on" data-t="men">Men</button><button data-t="women">Women</button><button data-t="kids">Kids</button></div>
  ${['men', 'women', 'kids'].map((k, i) => `<div class="sg-pane" data-p="${k}" ${i ? 'hidden' : ''}>${tbl(k)}</div>`).join('')}
  <p class="muted" style="font-size:13px;margin-top:18px">Measurements are garment dimensions. Oversized pieces are cut roomy — choose your normal size for the relaxed fit, or size down for a closer fit. Between sizes? Go up.</p></div></div>`;
}
function openSizeGuide() { const m = $('#sgModal'); m.classList.add('on'); $('#overlay').classList.add('on'); document.body.classList.add('lock'); }
function buildModals() {
  document.body.insertAdjacentHTML('beforeend', sizeGuideHTML() + `<div class="modal" id="qvModal" role="dialog" aria-label="Quick view"><div class="modal-bg" data-close></div><div class="modal-box qv"><button class="modal-x" data-close aria-label="Close">${IC.x}</button><div id="qvBody"></div></div></div>`);
  $$('.modal [data-close]').forEach(b => b.addEventListener('click', closeAll));
  $$('.sg-tabs button').forEach(b => b.onclick = () => { $$('.sg-tabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.sg-pane').forEach(p => p.hidden = p.dataset.p !== b.dataset.t); });
  document.addEventListener('click', e => { if (e.target.closest('[data-size-guide]')) { e.preventDefault(); openSizeGuide(); } });
}
function openQuickView(id) {
  const p = byId(id); let col = p.colors[0], size = null;
  const body = $('#qvBody');
  const draw = () => {
    body.innerHTML = `<div class="qv-img"><img src="${U(col.img, 800, 1000)}" alt="${p.name}"></div><div class="qv-info"><p class="eyebrow">${catLabel(p.cat)}</p><h3 class="display h-md" style="margin:12px 0 10px">${p.name}</h3>
    <div class="qv-price">${fmt(p.price)}${p.was ? `<s>${fmt(p.was)}</s>` : ''}</div><p class="muted" style="margin:14px 0 22px;font-size:15px">${p.desc}</p>
    <div class="opt-l">Colour — <b>${col.name}</b></div><div class="swatches">${p.colors.map(c => `<button class="sw${c.key === col.key ? ' on' : ''}" data-c="${c.key}" style="--c:${c.hex}" aria-label="${c.name}"></button>`).join('')}</div>
    <div class="opt-l">Size ${size ? '— <b>' + size + '</b>' : ''}</div><div class="sizes">${p.sizes.map(s => `<button class="sz${s === size ? ' on' : ''}" data-s="${s}">${s}</button>`).join('')}</div>
    <div class="qv-btns"><button class="btn btn-solid" id="qvAdd" data-magnetic>Add to cart</button><a class="btn btn-line" href="product.html?id=${p.id}">Full details</a></div></div>`;
    $$('.sw', body).forEach(b => b.onclick = () => { col = p.colors.find(c => c.key === b.dataset.c); draw(); });
    $$('.sz', body).forEach(b => b.onclick = () => { size = b.dataset.s; draw(); });
    $('#qvAdd', body).onclick = () => { if (!size) { $('.sizes', body).classList.add('shake'); toast('Pick a size first'); setTimeout(() => $('.sizes', body)?.classList.remove('shake'), 600); return; } Store.add(p.id, col.key, size); closeAll(); toast(`${p.name} added to cart`, { label: 'View cart', fn: openDrawer }); };
    initMagnetic(body);
  };
  draw(); $('#qvModal').classList.add('on'); $('#overlay').classList.add('on'); document.body.classList.add('lock');
}

/* ---------------------------------------------------------------- effects */
function splitText(el) {
  if (el.classList.contains('split')) return; el.dataset.split = 1;
  const txt = el.textContent.trim().replace(/\s+/g, ' '); let ci = 0; el.setAttribute('aria-label', txt);
  const walk = node => {
    let out = '';
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; out += /^\s+$/.test(w) ? ' ' : `<span class="w" aria-hidden="true">${[...w].map(ch => `<span class="c" style="--ci:${ci++}">${ch}</span>`).join('')}</span>`; });
      else if (n.nodeName === 'BR') out += '<br>';
      else if (n.nodeType === 1) { const t = n.cloneNode(false); t.innerHTML = walk(n); out += t.outerHTML; }
    });
    return out;
  };
  el.innerHTML = walk(el); el.classList.add('split');
}
function initReveal(root = document) {
  $$('[data-stagger]', root).forEach(g => [...g.children].forEach((c, i) => { if (c.hasAttribute('data-reveal') && !c.style.getPropertyValue('--i')) c.style.setProperty('--i', i); }));
  $$('[data-split]:not(.split)', root).forEach(splitText);
  const els = $$('[data-reveal]:not(.in),.split:not(.in):not([data-manual])', root);
  if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
}
function initMagnetic(root = document) {
  if (!finePointer || reduceMotion) return;
  $$('[data-magnetic]:not([data-mg])', root).forEach(el => {
    el.dataset.mg = 1;
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) * .28, y = (e.clientY - r.top - r.height / 2) * .38; el.style.transform = `translate(${x}px,${y}px)`; });
    el.addEventListener('mouseleave', () => { el.style.transition = 'transform .6s var(--ease)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 600); });
  });
}
function initTilt() {
  if (!finePointer || reduceMotion) return;
  document.addEventListener('mousemove', e => {
    const m = e.target.closest && e.target.closest('[data-tilt]'); 
    $$('[data-tilt].tilting').forEach(t => { if (t !== m) { t.classList.remove('tilting'); t.style.transform = ''; } });
    if (!m) return; const r = m.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    m.classList.add('tilting'); m.style.transform = `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateZ(0)`;
  }, { passive: true });
}
function initCursor() {
  if (!finePointer || reduceMotion) return;
  const dot = document.createElement('div'), ring = document.createElement('div'); dot.className = 'cur-dot'; ring.className = 'cur-ring';
  document.body.append(ring, dot); let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, on = false;
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; if (!on) { on = true; rx = x; ry = y; document.documentElement.classList.add('has-cursor'); } dot.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => document.documentElement.classList.remove('has-cursor'));
  document.documentElement.addEventListener('mouseenter', () => on && document.documentElement.classList.add('has-cursor'));
  (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
  const root = document.documentElement;
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,input,select,textarea,label,[data-cursor],.dot,.sw,.sz');
    const v = e.target.closest('[data-cursor="view"]');
    root.classList.toggle('cur-view', !!v && !e.target.closest('button,.dot,a.mega-feat')); root.classList.toggle('cur-hover', !!t && !v);
    ring.textContent = (v && !e.target.closest('button,.dot')) ? (v.dataset.label || 'VIEW') : '';
  });
  addEventListener('mousedown', () => root.classList.add('cur-down')); addEventListener('mouseup', () => root.classList.remove('cur-down'));
}
function initParallax() {
  if (reduceMotion) return; const els = $$('[data-parallax]'); if (!els.length) return; let tick = false;
  const run = () => { els.forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return; const k = parseFloat(el.dataset.parallax) || .1; const d = (r.top + r.height / 2 - innerHeight / 2); el.style.setProperty('--py', (-d * k).toFixed(1) + 'px'); }); tick = false; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true }); addEventListener('resize', run); run();
}
function initPageTransitions() {
  const c = document.createElement('div'); c.className = 'curtain'; document.body.appendChild(c);
  requestAnimationFrame(() => requestAnimationFrame(() => { document.body.classList.add('entered'); setTimeout(() => document.body.classList.remove('entering', 'entered'), 900); }));
  addEventListener('pageshow', e => { if (e.persisted) { c.classList.remove('in'); document.body.classList.remove('lock'); } });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href); if (u.origin !== location.origin && u.protocol !== 'file:') return; if (/^(mailto|tel|https?:\/\/wa\.me)/.test(a.getAttribute('href'))) return;
    if (u.pathname === location.pathname && u.search === location.search) return; // same page / hash
    if (reduceMotion) return;
    e.preventDefault(); c.classList.add('in'); setTimeout(() => { location.href = a.href; }, 480);
  });
}
function countUp(el) {
  const to = +el.dataset.count, dur = 1600, suf = el.dataset.suf || '', t0 = performance.now();
  (function f(t) { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * e).toLocaleString() + suf; if (k < 1) requestAnimationFrame(f); })(t0);
}
function initCountups() {
  const els = $$('[data-count]'); if (!els.length) return;
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { countUp(en.target); io.unobserve(en.target); } }), { threshold: .5 });
  els.forEach(e => io.observe(e));
}
function releasePreloader() {
  const p = document.getElementById('preloader');
  const go = () => { document.documentElement.classList.add('ready'); document.body.classList.remove('lock'); };
  if (!p) { go(); return; }
  const cnt = $('#preCount'); const t0 = performance.now();
  (function f(t) { const k = Math.min(1, (t - t0) / 1500); if (cnt) cnt.textContent = String(Math.round(k * 100)).padStart(3, '0'); if (k < 1) requestAnimationFrame(f); })(t0);
  const fin = () => { p.classList.add('done'); try { sessionStorage.setItem('pre-seen', 1); } catch (e) {} setTimeout(go, 650); setTimeout(() => p.remove(), 1400); };
  const min = new Promise(r => setTimeout(r, 1800)), loaded = new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r));
  Promise.race([Promise.all([min, loaded]), new Promise(r => setTimeout(r, 4200))]).then(fin);
}

/* ---------------------------------------------------------------- init */
function initApp(title) {
  document.title = (title ? title + ' — ' : '') + BRAND.name;
  $$('[data-brand]').forEach(e => e.innerHTML = brandHTML());
  $$('[data-brand-plain]').forEach(e => e.textContent = BRAND.name);
  $$('[data-cfg]').forEach(e => e.textContent = BRAND[e.dataset.cfg]);
  buildHeader(); buildDrawer(); buildSearch(); buildModals(); buildFooter();
  bindCards(document); initReveal(); initMagnetic(); initTilt(); initCursor(); initParallax(); initPageTransitions(); initCountups();
  releasePreloader();
}

/* ---------------------------------------------------------------- shared helpers for inner pages */
function initAcc(root = document) {
  $$('.acc', root).forEach(a => {
    const b = $('button', a), body = $('.acc-b', a); if (!b || b.dataset.acc) return; b.dataset.acc = 1; b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', () => { const o = !a.classList.contains('open'); a.classList.toggle('open', o); b.setAttribute('aria-expanded', o); body.style.maxHeight = o ? body.scrollHeight + 'px' : 0; });
  });
}
function pageHead(word, crumbs, title, sub) {
  return `<section class="ph"><div class="ph-word" aria-hidden="true">${word}</div><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(c => c[1] ? `<a href="${c[1]}">${c[0]}</a><i>/</i>` : `<span style="color:var(--text)">${c[0]}</span>`).join('')}</nav><h1 class="display h-xl" data-split>${title}</h1>${sub ? `<p class="sub" data-reveal>${sub}</p>` : ''}</div></section>`;
}
