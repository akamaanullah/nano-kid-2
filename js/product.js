/* product.js — gallery, colour/size selection, add to cart, related */
(function () {
  const q = new URLSearchParams(location.search);
  const p = byId(q.get('id')) || PRODUCTS.find(x => x.slug === q.get('slug')) || PRODUCTS[0];
    let col = p.colors[0], size = null, qty = 1;
  const g = p.gender.length > 1 ? 'Unisex' : p.gender[0][0].toUpperCase() + p.gender[0].slice(1);
  const word = (p.hero && p.hero.word) || catLabel(p.cat).split(' ')[0];
  const root = $('#pdpRoot');
  const was = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
  root.innerHTML = `<div class="pdp"><div class="pdp-word" data-parallax="-.05" aria-hidden="true">${word}</div>
  <div class="gal"><div class="gal-th" id="galTh"></div><div class="gal-main" id="galMain" data-cursor="view" data-label="ZOOM"><img id="galImg" alt=""><span class="gal-badge" id="galBadge" hidden></span>
    <div class="gal-ar"><button class="prev" id="gPrev" aria-label="Previous colour">${IC.arrow}</button><button class="next" id="gNext" aria-label="Next colour">${IC.arrow}</button></div></div></div>
  <div class="pi"><nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><i>/</i><a href="shop.html">Shop</a><i>/</i><a href="shop.html?cat=${p.cat}">${catLabel(p.cat)}</a></nav>
    <span class="eyebrow">${catLabel(p.cat)} · ${g}</span><h1 class="display h-lg">${p.name}</h1>
    <div class="pi-rate">${stars(p.rating)}<span>${p.rating.toFixed(1)} · ${p.reviews} reviews</span></div>
    <div class="pi-price">${fmt(p.price)}${p.was ? `<s>${fmt(p.was)}</s><em>−${was}%</em>` : ''}</div>
    <p class="muted" style="font-size:12px;letter-spacing:.1em">Inclusive of all taxes</p>
    <p class="pi-desc">${p.desc}</p>
    <div class="opt-l"><span>Colour — <b id="colName"></b></span></div><div class="swatches" id="swatches"></div>
    <div class="opt-l"><span>Size <b id="sizeName"></b></span><button type="button" data-size-guide>Size guide</button></div><div class="sizes" id="sizes">${p.sizes.map(s => `<button class="sz" data-s="${s}" aria-pressed="false">${s}</button>`).join('')}</div>
    <div class="pi-buy" id="piBuy"><div class="qty"><button id="qm" aria-label="Decrease">−</button><span id="qv">1</span><button id="qp" aria-label="Increase">+</button></div>
      <button class="btn btn-solid" id="addBtn" data-magnetic>Add to cart</button><button class="btn btn-red" id="buyBtn" data-magnetic>Buy now</button></div>
    <div class="pi-perks"><div><b>Free</b>Delivery over ${fmt(BRAND.freeShipOver)}</div><div><b>COD</b>All Pakistan</div><div><b>7 Days</b>Easy returns</div></div>
    <div class="acc open"><button>Details<i></i></button><div class="acc-b"><div><ul><li>${p.cat === 'hoodies' || p.cat === 'sweatshirts' || p.cat === 'jackets' ? 'Heavyweight 380–480 GSM fabric' : 'Heavyweight 220–240 GSM cotton'}</li><li>Garment washed for a broken-in feel</li><li>Pre-shrunk — true to size</li><li>Designed in Lahore, Pakistan</li></ul></div></div></div>
    <div class="acc"><button>Fabric &amp; care<i></i></button><div class="acc-b"><div>Machine wash cold, inside out, with similar colours. Do not bleach. Tumble dry low or hang dry. Iron on reverse, never on the print.</div></div></div>
    <div class="acc"><button>Delivery &amp; returns<i></i></button><div class="acc-b"><div>Delivery in 2–4 working days across Pakistan. Free over ${fmt(BRAND.freeShipOver)}, otherwise ${fmt(BRAND.shipFee)}. Cash on delivery available. Unworn items can be returned or exchanged within 7 days.</div></div></div>
  </div></div>`;
  document.body.insertAdjacentHTML('beforeend', `<div class="sticky-atc" id="stick" aria-hidden="true"><div><b>${p.name}</b><span>${fmt(p.price)}</span></div><button class="btn btn-solid btn-sm" id="stickBtn" tabindex="-1">Add to cart</button></div>`);
  const img = $('#galImg'), main = $('#galMain');
  const badge = p.badge || (was ? '−' + was + '%' : ''); if (badge) { const b = $('#galBadge'); b.textContent = badge; b.hidden = false; }

  function showImg(first) {
    const u = U(col.img, 1000, 1250, 78);
    if (first) { img.src = u; img.alt = `${p.name} in ${col.name}`; return; }
    const n = new Image(); n.onload = () => { img.src = u; img.alt = `${p.name} in ${col.name}`; img.classList.remove('swap-in'); void img.offsetWidth; if (!reduceMotion) img.classList.add('swap-in'); }; n.src = u;
  }
  function draw(first) {
    $('#colName').textContent = col.name;
    $('#galTh').innerHTML = p.colors.map(c => `<button class="${c.key === col.key ? 'on' : ''}" data-c="${c.key}" aria-label="${c.name}"><img src="${U(c.img, 170, 212)}" alt="" loading="lazy"></button>`).join('');
    $('#swatches').innerHTML = p.colors.map(c => `<button class="sw${c.key === col.key ? ' on' : ''}" data-c="${c.key}" style="--c:${c.hex}" aria-label="${c.name}" title="${c.name}"></button>`).join('');
    showImg(first);
  }
  function setCol(k) { col = p.colors.find(c => c.key === k) || col; draw(false); }
  draw(true);
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-c]'); if (c) setCol(c.dataset.c);
    const s = e.target.closest('[data-s]'); if (s) { size = s.dataset.s; $$('#sizes .sz').forEach(b => { b.classList.toggle('on', b === s); b.setAttribute('aria-pressed', b === s); }); $('#sizeName').textContent = '— ' + size; }
  });
  const step = d => { const i = p.colors.indexOf(col); setCol(p.colors[(i + d + p.colors.length) % p.colors.length].key); };
  $('#gPrev').onclick = e => { e.stopPropagation(); step(-1); }; $('#gNext').onclick = e => { e.stopPropagation(); step(1); };
  /* zoom on hover (desktop) / tap */
  main.addEventListener('mousemove', e => { if (!finePointer) return; const r = main.getBoundingClientRect(); main.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); main.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%'); main.classList.add('zoom'); });
  main.addEventListener('mouseleave', () => main.classList.remove('zoom'));
  $('#qm').onclick = () => { qty = Math.max(1, qty - 1); $('#qv').textContent = qty; };
  $('#qp').onclick = () => { qty = Math.min(10, qty + 1); $('#qv').textContent = qty; };
  const needSize = () => { if (size) return false; const z = $('#sizes'); z.classList.add('shake'); z.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }); setTimeout(() => z.classList.remove('shake'), 600); toast('Pick a size first'); return true; };
  const add = () => { if (needSize()) return false; Store.add(p.id, col.key, size, qty); return true; };
  $('#addBtn').onclick = () => { if (add()) toast(`${p.name} · ${col.name} · ${size} added`, { label: 'View cart', fn: openDrawer }); };
  $('#buyBtn').onclick = () => { if (add()) location.href = 'cart.html#checkout'; };
  $('#stickBtn').onclick = () => $('#addBtn').click();
  const stick = $('#stick');
  new IntersectionObserver(es => es.forEach(en => { const on = !en.isIntersecting && en.boundingClientRect.top < 0; stick.classList.toggle('on', on); $('#stickBtn').tabIndex = on ? 0 : -1; stick.setAttribute('aria-hidden', !on); }), { threshold: 0 }).observe($('#piBuy'));
  initAcc(root); const open = $('.acc.open .acc-b', root); if (open) open.style.maxHeight = open.scrollHeight + 'px';
  initMagnetic(root);

  /* related */
  const rel = PRODUCTS.filter(x => x.id !== p.id).map(x => ({ x, s: (x.cat === p.cat ? 3 : 0) + (x.gender.some(g => p.gender.includes(g)) ? 2 : 0) + (x.best ? 1 : 0) })).sort((a, b) => b.s - a.s || a.x.id - b.x.id).slice(0, 4).map(o => o.x);
  $('#relGrid').innerHTML = rel.map((x, i) => cardHTML(x, i)).join('');
  initApp(p.name);
})();
