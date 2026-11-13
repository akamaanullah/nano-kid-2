/* home.js — homepage sections: hero slider, marquees, categories, trending carousel,
   drop countdown, lookbook, custom-print preview, reviews, newsletter. */
(function () {
  /* ---------------------------------------------------------------- hero slider */
  const slides = PRODUCTS.filter(p => p.hero).map(p => ({
    p, cols: p.hero.vars.map(k => p.colors.find(c => c.key === k)).filter(Boolean)
  }));
  const el = id => document.getElementById(id);
  const hero = el('hero'), fig = el('heroFloat'), word = el('heroWord');
  let cur = -1, col = 0, timer = null, busy = false;
  const DUR = 7000;
  hero.style.setProperty('--dur', DUR + 'ms');

  el('heroDots').innerHTML = slides.map((s, i) => `<button class="hdot" data-i="${i}" role="tab" aria-label="Slide ${i + 1}: ${s.p.name}"></button>`).join('') + '<span class="num"><b id="hNum">01</b> / ' + String(slides.length).padStart(2, '0') + '</span>';

  function setWord(w) {
    word.style.setProperty('--wl', w.length);
    word.innerHTML = [...w].map((ch, i) => `<span class="c" style="display:inline-block;--ci:${i}">${ch}</span>`).join('');
    if (!reduceMotion) word.animate([{ opacity: 0, transform: 'translate(-50%,-46%) scale(.96)' }, { opacity: 1, transform: 'translate(-50%,-50%)' }], { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  function textFor(s, c) {
    const nm = s.p.name.split(' '); const l1 = nm.slice(0, Math.ceil(nm.length / 2)).join(' '), l2 = nm.slice(Math.ceil(nm.length / 2)).join(' ');
    el('heroKick').textContent = s.p.hero.kicker;
    el('heroTitle').innerHTML = l2 ? `${l1}<span class="l2">${l2}</span>` : `<span class="l2">${l1}</span>`;
    el('heroTag').textContent = s.p.hero.tag;
    el('heroColName').textContent = c.name;
    el('heroPrice').innerHTML = `<small>From</small>${fmt(s.p.price)}`;
  }
  function thumbs(s) {
    el('heroThumbs').innerHTML = s.cols.map((c, i) => `<button class="thumb${i === col ? ' on' : ''}" data-c="${i}" aria-label="${c.name}" title="${c.name}"><img src="${U(c.img, 160, 160)}" alt=""></button>`).join('');
  }
  function layer(src, cls) {
    const d = document.createElement('div'); d.className = 'layer ' + cls;
    const im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = src; d.appendChild(im); fig.appendChild(d); return d;
  }
  function swapFig(url, cls) {
    const old = [...fig.children]; const n = layer(url, reduceMotion ? '' : cls[0]);
    old.forEach(o => { if (!reduceMotion) o.className = 'layer ' + cls[1]; setTimeout(() => o.remove(), reduceMotion ? 0 : 900); });
    return n;
  }
  const swapEls = ['heroKick', 'heroTag', 'heroVar', 'heroPrice'].map(el);
  function go(i, dir) {
    i = (i + slides.length) % slides.length; if (i === cur || busy) return; busy = true;
    const first = cur < 0, s = slides[i]; cur = i; col = 0;
    const img = U(s.cols[0].img, 900, 1125, 78);
    const doText = () => {
      textFor(s, s.cols[0]); thumbs(s); setWord(s.p.hero.word);
      swapEls.forEach(e => e.classList.remove('out'));
      const t = el('heroTitle'); if (!reduceMotion && !first) t.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 800, easing: 'cubic-bezier(.22,1,.36,1)' });
    };
    if (first) { doText(); layer(img, reduceMotion ? '' : 'enter'); busy = false; }
    else { swapEls.forEach(e => e.classList.add('out')); setTimeout(doText, 320); swapFig(img, ['enter', 'leave']); setTimeout(() => busy = false, 700); }
    document.querySelectorAll('.hdot').forEach((d, k) => { d.classList.remove('on'); if (k === i) { void d.offsetWidth; d.classList.add('on'); } d.setAttribute('aria-selected', k === i); });
    const hn = el('hNum'); if (hn) hn.textContent = String(i + 1).padStart(2, '0');
    el('heroBadge').setAttribute('href', 'product.html?id=' + s.p.id);
    arm();
  }
  function arm() { clearTimeout(timer); if (reduceMotion) return; timer = setTimeout(() => { if (hero.classList.contains('paused')) arm(); else go(cur + 1); }, DUR); }
  function pickColor(k) {
    const s = slides[cur]; if (k === col) return; col = k; const c = s.cols[k];
    document.querySelectorAll('#heroThumbs .thumb').forEach((t, j) => t.classList.toggle('on', j === k));
    el('heroColName').textContent = c.name;
    swapFig(U(c.img, 900, 1125, 78), ['swapIn', 'swapOut']);
    arm();
  }
  el('heroThumbs').addEventListener('click', e => { const b = e.target.closest('.thumb'); if (b) pickColor(+b.dataset.c); });
  el('heroThumbs').addEventListener('mouseover', e => { const b = e.target.closest('.thumb'); if (b && finePointer) pickColor(+b.dataset.c); });
  el('heroDots').addEventListener('click', e => { const b = e.target.closest('.hdot'); if (b) go(+b.dataset.i); });
  el('hNext').onclick = () => go(cur + 1); el('hPrev').onclick = () => go(cur - 1);
  el('heroAdd').onclick = () => { const s = slides[cur], c = s.cols[col]; Store.add(s.p.id, c.key, s.p.sizes[Math.min(2, s.p.sizes.length - 1)]); toast(`${s.p.name} · ${c.name} added`, { label: 'View cart', fn: openDrawer }); };
  el('heroBuy').onclick = () => { const s = slides[cur], c = s.cols[col]; Store.add(s.p.id, c.key, s.p.sizes[Math.min(2, s.p.sizes.length - 1)]); location.href = 'cart.html#checkout'; };
  hero.addEventListener('mouseenter', () => hero.classList.add('paused')); hero.addEventListener('mouseleave', () => hero.classList.remove('paused'));
  addEventListener('keydown', e => { if (e.key === 'ArrowRight' && scrollY < innerHeight * .6 && !document.querySelector('.modal.on')) go(cur + 1); if (e.key === 'ArrowLeft' && scrollY < innerHeight * .6 && !document.querySelector('.modal.on')) go(cur - 1); });
  let sx = 0; hero.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  hero.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) go(cur + (d < 0 ? 1 : -1)); }, { passive: true });
  if (finePointer && !reduceMotion) hero.addEventListener('mousemove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    word.style.setProperty('--wx', (x * -34).toFixed(1) + 'px'); word.style.setProperty('--wy', (y * -22).toFixed(1) + 'px');
  });
  const stage = hero.querySelector('.hero-art'); if (!reduceMotion) addEventListener('scroll', () => { const y = scrollY; if (y < innerHeight * 1.2) { stage.style.marginTop = (y * .18) + 'px'; } }, { passive: true });
  go(0);
  initMagnetic(hero);

  /* ---------------------------------------------------------------- marquees */
  const mq = (id, words) => { const row = words.map(w => `<span>${w}</span>`).join(''); el(id).innerHTML = row + row + row + row; };
  mq('mq1', ['Heavyweight cotton', 'Free delivery over ' + fmt(BRAND.freeShipOver), 'Cash on delivery', 'New drop every Friday', '7-day easy returns', 'Custom prints']);
  mq('mq2', ['Wear it loud', 'Season 08', 'Built heavy', 'Made for the street', 'Limited runs', 'No restocks']);
  /* the track is 4× copies; translate -50% = 2 copies => seamless */

  /* ---------------------------------------------------------------- categories */
  const catPick = [['hoodies', 'Hoodies'], ['oversized', 'Oversized Tees'], ['jackets', 'Jackets'], ['graphic', 'Graphic Tees'], ['sweatshirts', 'Sweatshirts'], ['tanks', 'Tank Tops']];
  el('catGrid').innerHTML = catPick.map(([k, l], i) => {
    const ps = PRODUCTS.filter(p => p.cat === k); const img = (ps[Math.min(1, ps.length - 1)] || ps[0]).colors[0].img;
    return `<a class="cat" href="shop.html?cat=${k}" data-reveal="zoom" style="--i:${i % 3}"><img src="${U(img, 800, 900)}" alt="${l}" loading="lazy"><div class="cat-in"><span class="cat-no">${String(i + 1).padStart(2, '0')}</span><div class="cat-bot"><div><h3>${l}</h3><small>${ps.length} styles</small></div><span class="cat-go">${IC.arrow}</span></div></div></a>`;
  }).join('');

  /* ---------------------------------------------------------------- trending carousel */
  function carousel(carId, barId, prevId, nextId, list) {
    const car = el(carId); car.innerHTML = list.map((p, i) => cardHTML(p, i)).join('');
    const bar = el(barId), step = () => (car.querySelector('.pc')?.offsetWidth || 300) + 20;
    const upd = () => { const max = car.scrollWidth - car.clientWidth; const k = max > 0 ? car.scrollLeft / max : 0; const w = Math.max(.12, car.clientWidth / car.scrollWidth); bar.style.width = (w * 100) + '%'; bar.style.transform = `translateX(${k * (1 / w - 1) * 100}%)`; };
    car.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); setTimeout(upd, 300);
    el(nextId).onclick = () => car.scrollBy({ left: step() * 2, behavior: 'smooth' });
    el(prevId).onclick = () => car.scrollBy({ left: -step() * 2, behavior: 'smooth' });
    let dragging = false, dx = 0, sl = 0, moved = 0;
    car.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button')) return; dragging = true; moved = 0; dx = e.clientX; sl = car.scrollLeft; });
    addEventListener('pointermove', e => { if (!dragging) return; const d = e.clientX - dx; moved = Math.abs(d); if (moved > 4) car.classList.add('drag'); car.scrollLeft = sl - d; });
    addEventListener('pointerup', () => { if (!dragging) return; dragging = false; setTimeout(() => car.classList.remove('drag'), 0); });
    car.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    car.addEventListener('dragstart', e => e.preventDefault());
  }
  carousel('trend', 'trendBar', 'cPrev', 'cNext', PRODUCTS.filter(p => (p.best || p.new) && !p.gender.every(g => g === 'kids')).slice(0, 10));
  const kidsAll = PRODUCTS.filter(p => p.gender.includes('kids')).sort((a, b) => (b.best - a.best) || (b.new - a.new) || (b.created - a.created));
  carousel('kidsCar', 'kidsBar', 'kPrev', 'kNext', kidsAll.slice(0, 10));
  ['mini1', 'mini2', 'mini3'].forEach((k, i) => el(k).src = U(IMG[k], 700, 900, 75));

  /* ---------------------------------------------------------------- countdown */
  el('dropName').textContent = BRAND.dropName;
  el('dropImg').src = U(IMG.dropbg, 900, 1125, 75);
  let target = new Date(BRAND.dropDate).getTime(); const WEEK = 7 * 864e5;
  while (target < Date.now()) target += WEEK;
  const cdEls = {}; document.querySelectorAll('.cd-num').forEach(n => cdEls[n.dataset.u] = n);
  const last = {};
  function tick() {
    let d = Math.max(0, target - Date.now()); const v = { d: Math.floor(d / 864e5), h: Math.floor(d / 36e5) % 24, m: Math.floor(d / 6e4) % 60, s: Math.floor(d / 1e3) % 60 };
    for (const k in v) { const s = String(v[k]).padStart(2, '0'); if (last[k] !== s) { last[k] = s; cdEls[k].innerHTML = `<span>${s}</span>`; } }
  }
  tick(); setInterval(tick, 1000);

  /* ---------------------------------------------------------------- lookbook */
  const looks = [
    ['look1', 'Night run', 'Hoodies', 'shop.html?cat=hoodies'], ['look2', 'Studio', 'Tees', 'shop.html?cat=oversized'], ['look3', 'After hours', 'Jackets', 'shop.html?cat=jackets'],
    ['look4', 'Street', 'Graphic', 'shop.html?cat=graphic'], ['look5', 'Core', 'Essentials', 'shop.html?cat=tees'], ['look6', 'Heat', 'Tanks', 'shop.html?cat=tanks']
  ];
  el('lookGrid').innerHTML = looks.map(([k, t, s, h], i) => `<a class="lk" href="${h}" data-reveal="zoom" style="--i:${i % 3}"><img src="${U(IMG[k], 900, 1100)}" alt="Lookbook — ${t}" loading="lazy"><figcaption><div><small>${s}</small><b>${t}</b></div><span class="go">Shop ${IC.arrow}</span></figcaption></a>`).join('');

  /* ---------------------------------------------------------------- custom print preview */
  el('mockImg').src = U(IMG.custom, 1000, 1050, 75);
  const pr = el('print'), inp = el('printTxt');
  const draw = () => {
    const t = (inp.value.trim() || 'Your Name').toUpperCase(); pr.innerHTML = t.split(/\s+/).join('<br>');
    const longest = Math.max(...t.split(/\s+/).map(w => w.length)); const lines = t.split(/\s+/).length;
    pr.style.setProperty('--fs', Math.max(1.8, Math.min(5.2, 54 / Math.max(longest, 4), 20 / lines)).toFixed(2));
  };
  inp.addEventListener('input', draw); draw();
  el('printChips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    document.querySelectorAll('#printChips .chip').forEach(c => c.classList.toggle('on', c === b));
    pr.style.setProperty('--pc', b.dataset.c); pr.classList.toggle('onlight', b.hasAttribute('data-light') || b.dataset.c === '#E3A91A' || b.dataset.c === '#FF2E2E');
  });
  pr.style.setProperty('--pc', '#09090A');

  /* ---------------------------------------------------------------- reviews */
  const REVS = [
    ['Hamza R.', 'Lahore', 5, 'Phantom Hoodie', 'Easily the heaviest hoodie I own. Fit is spot on and the colour hasn’t faded after six washes.'],
    ['Ayesha K.', 'Karachi', 5, 'Void Oversized Tee', 'Proper drop-shoulder oversized fit, thick fabric that actually hangs well. Ordered three more.'],
    ['Saad M.', 'Islamabad', 5, 'Rush Bomber', 'Quilted lining is warm without being bulky. Delivery took 2 days and COD was painless.'],
    ['Zara A.', 'Lahore', 4, 'Custom print tee', 'Sent my crew logo, they cleaned it up free and the print came out crisp. Team loved it.'],
    ['Bilal S.', 'Faisalabad', 5, 'Rebel Muscle Tank', 'Great for the gym and summer. Ribbed cotton is soft and the cut-away armhole is perfect.'],
    ['Mahnoor T.', 'Rawalpindi', 5, 'Mini Heavy Hoodie', 'Bought for my son — he refuses to take it off. Soft fleece and it survived the washing machine.']
  ];
  el('revStars').innerHTML = stars(5);
  el('revGrid').innerHTML = REVS.map((r, i) => `<article class="rev" data-reveal><div style="display:flex;justify-content:space-between;align-items:center">${stars(r[2])}<span class="ver">Verified</span></div><q>${r[4]}</q><div class="who"><span aria-hidden="true" style="width:46px;height:46px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;font-family:var(--f-display);font-size:20px">${r[0][0]}</span><div><b>${r[0]}</b><span>${r[1]} · ${r[3]}</span></div></div></article>`).join('');

  /* ---------------------------------------------------------------- forms */
  const bindMail = (form, msg) => form.addEventListener('submit', e => {
    e.preventDefault(); const i = form.querySelector('input'); const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value.trim());
    if (!ok) { i.style.borderColor = 'var(--accent)'; i.focus(); toast('Enter a valid email'); return; }
    i.style.borderColor = ''; i.value = ''; toast(msg);
  });
  bindMail(el('notifyForm'), 'You’re on the list — we’ll email you before the drop');
  bindMail(el('newsForm'), 'Welcome to the crew — check your inbox for Rs. 500 off');

  initApp('Premium Streetwear');
})();
