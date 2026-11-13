/* shop.js — filtering, sorting, URL state, load more */
(function () {
  initApp('Shop'); // header, drawer, footer + effects
  const q = new URLSearchParams(location.search);
  const PAGE = 12;
  const st = {
    gender: new Set(q.get('gender') ? [q.get('gender')] : []),
    cat: new Set(q.get('cat') ? q.get('cat').split(',') : []),
    size: new Set(q.get('size') ? q.get('size').split(',') : []), fam: new Set(), q: (q.get('q') || '').trim(),
    max: 12000, sort: q.get('sort') || 'featured', shown: PAGE
  };
  const MAXP = Math.ceil(Math.max(...PRODUCTS.map(p => p.price)) / 500) * 500;
  st.max = MAXP;
  const sortEl = $('#sort'); if ([...sortEl.options].some(o => o.value === st.sort)) sortEl.value = st.sort; else st.sort = 'featured';

  const GL = { men: 'Men', women: 'Women', kids: 'Kids' };
  const SIZES = SIZES_ADULT, KSIZES = SIZES_KIDS;
  const FAMS = Object.keys(COLOR_FAMILIES);

  function matches(p, skip) {
    if (skip !== 'gender' && st.gender.size && !p.gender.some(g => st.gender.has(g))) return false;
    if (skip !== 'cat' && st.cat.size && !st.cat.has(p.cat)) return false;
    if (skip !== 'size' && st.size.size && !p.sizes.some(s => st.size.has(s))) return false;
    if (skip !== 'fam' && st.fam.size && !p.colors.some(c => st.fam.has(c.fam))) return false;
    if (p.price > st.max) return false;
    if (st.q) { const hay = (p.name + ' ' + catLabel(p.cat) + ' ' + p.gender.join(' ') + ' ' + p.colors.map(c => c.name).join(' ')).toLowerCase(); if (!st.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  }
  const sorters = {
    featured: (a, b) => (b.best - a.best) || (a.created - b.created), new: (a, b) => b.created - a.created, best: (a, b) => (b.best - a.best) || (b.reviews - a.reviews),
    low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating
  };
  const list = () => PRODUCTS.filter(p => matches(p)).sort(sorters[st.sort]);

  /* ---------- head ---------- */
  function head() {
    const g = [...st.gender][0], c = st.cat.size === 1 ? [...st.cat][0] : null;
    let title = 'Shop all', sub = 'Heavyweight tees, hoodies, jackets and more — built for the street.';
    if (st.q) { title = 'Search'; sub = `Results for “${st.q}”`; }
    else if (st.sort === 'new' && !g && !c) { title = 'New in'; sub = 'The latest pieces from Season 08.'; }
    else if (g && c) { title = `${GL[g]}’s ${catLabel(c)}`; sub = ''; }
    else if (g) { title = GL[g]; sub = `Everything for ${g === 'kids' ? 'the little ones' : g}.`; }
    else if (c) { title = catLabel(c); sub = ''; }
    const crumbs = [['Home', 'index.html'], ['Shop', g || c ? 'shop.html' : null]]; if (g || c) crumbs.push([title]);
    $('#shopHead').innerHTML = pageHead('SHOP', crumbs, title, sub);
    splitText($('#shopHead h1')); initReveal($('#shopHead'));
    document.title = title + ' — ' + BRAND.name;
  }

  /* ---------- sidebar ---------- */
  const opt = (type, val, label, n, type2 = 'checkbox', cls = '') => `<label class="opt ${cls}"><input type="${type2}" data-f="${type}" value="${val}"><span class="bx">${IC.check}</span><span class="t">${label}</span><span class="n">${n}</span></label>`;
  function buildFilters() {
    const grp = (title, body, id) => `<div class="fg" data-g="${id}"><button class="fg-h" aria-expanded="true">${title}${IC.chev}</button><div class="fg-b">${body}</div></div>`;
    $('#filters').innerHTML = `<div class="f-close"><span>Filters</span><button class="icon-btn" id="fClose" aria-label="Close filters">${IC.x}</button></div>` +
      grp('Gender', ['men', 'women', 'kids'].map(g => opt('gender', g, GL[g], 0)).join(''), 'gender') +
      grp('Category', CATEGORIES.map(c => opt('cat', c.key, c.label, 0)).join(''), 'cat') +
      grp('Size', `<div class="sz-sub" data-sz="adult"><p class="sz-lab">Adult</p><div class="sz-grid">${SIZES.map(s => `<button class="sz" data-size="${s}" aria-pressed="false">${s}</button>`).join('')}</div></div><div class="sz-sub" data-sz="kids"><p class="sz-lab">Kids · age</p><div class="sz-grid">${KSIZES.map(s => `<button class="sz" data-size="${s}" aria-pressed="false">${s.replace('Y', ' yrs')}</button>`).join('')}</div></div>`, 'size') +
      grp('Colour', `<div class="col-grid">${FAMS.map(f => `<button class="cf" data-fam="${f}" style="--c:${COLOR_FAMILIES[f]}" title="${f}" aria-label="${f}" aria-pressed="false"></button>`).join('')}</div>`, 'fam') +
      grp('Price', `<input type="range" class="price-r" id="priceR" min="1000" max="${MAXP}" step="500" value="${MAXP}" aria-label="Maximum price"><div class="price-v"><span>${fmt(1000)}</span><span>Up to <b id="priceV">${fmt(MAXP)}</b></span></div>`, 'price') +
      `<div class="f-apply"><button class="btn btn-solid btn-block" id="fApply">Show results</button></div>`;
    const f = $('#filters');
    f.addEventListener('click', e => {
      const h = e.target.closest('.fg-h'); if (h) { const g = h.parentElement; g.classList.toggle('closed'); h.setAttribute('aria-expanded', !g.classList.contains('closed')); return; }
      const s = e.target.closest('[data-size]'); if (s) { toggle(st.size, s.dataset.size); update(); return; }
      const c = e.target.closest('[data-fam]'); if (c) { toggle(st.fam, c.dataset.fam); update(); }
    });
    f.addEventListener('change', e => { const i = e.target.closest('[data-f]'); if (i) { toggle(st[i.dataset.f], i.value, i.checked); update(); } });
    $('#priceR').addEventListener('input', e => { st.max = +e.target.value; $('#priceV').textContent = fmt(st.max); update(); });
    $('#filterBtn').onclick = () => openF(true); $('#fClose').onclick = () => openF(false); $('#fApply').onclick = () => openF(false);
    $('#overlay').addEventListener('click', () => openF(false));
  }
  function openF(on) { $('#filters').classList.toggle('on', on); $('#overlay').classList.toggle('on', on); document.body.classList.toggle('lock', on); }
  function toggle(set, v, on) { (on === undefined ? !set.has(v) : on) ? set.add(v) : set.delete(v); st.shown = PAGE; }

  function pruneSizes() {
    const g = [...st.gender], onlyKids = g.length && g.every(x => x === 'kids'), noKids = g.length && !g.includes('kids');
    st.size.forEach(v => { const k = KSIZES.includes(v); if ((onlyKids && !k) || (noKids && k)) st.size.delete(v); });
  }
  function syncSidebar() {
    pruneSizes();
    { const g = [...st.gender], onlyKids = g.length && g.every(x => x === 'kids'), noKids = g.length && !g.includes('kids');
      $('[data-sz="adult"]').hidden = !!onlyKids; $('[data-sz="kids"]').hidden = !!noKids; }
    $$('#filters [data-f]').forEach(i => { i.checked = st[i.dataset.f].has(i.value); const n = PRODUCTS.filter(p => matches(p, i.dataset.f) && (i.dataset.f === 'gender' ? p.gender.includes(i.value) : p.cat === i.value)).length; i.parentElement.querySelector('.n').textContent = n; i.parentElement.style.opacity = n || i.checked ? 1 : .35; });
    $$('#filters [data-size]').forEach(b => { const on = st.size.has(b.dataset.size); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $$('#filters [data-fam]').forEach(b => { const on = st.fam.has(b.dataset.fam); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#priceR').value = st.max; $('#priceV').textContent = fmt(st.max);
  }

  /* ---------- render ---------- */
  function chips() {
    const a = [];
    st.gender.forEach(v => a.push(['gender', v, GL[v]])); st.cat.forEach(v => a.push(['cat', v, catLabel(v)]));
    st.size.forEach(v => a.push(['size', v, 'Size ' + v.replace('Y', ' yrs')])); st.fam.forEach(v => a.push(['fam', v, v[0].toUpperCase() + v.slice(1)]));
    if (st.max < MAXP) a.push(['max', '', 'Under ' + fmt(st.max)]); if (st.q) a.push(['q', '', '“' + st.q + '”']);
    $('#activeF').innerHTML = a.length ? a.map(([t, v, l]) => `<button class="af" data-t="${t}" data-v="${v}">${l}${IC.x}</button>`).join('') + '<button class="af clear" data-t="all">Clear all</button>' : '';
  }
  $('#activeF').addEventListener('click', e => {
    const b = e.target.closest('.af'); if (!b) return; const t = b.dataset.t;
    if (t === 'all') { st.gender.clear(); st.cat.clear(); st.size.clear(); st.fam.clear(); st.max = MAXP; st.q = ''; }
    else if (t === 'max') st.max = MAXP; else if (t === 'q') st.q = ''; else st[t].delete(b.dataset.v);
    st.shown = PAGE; update();
  });
  function render(append) {
    const all = list(), n = all.length, vis = all.slice(0, st.shown);
    $('#count').innerHTML = `<b>${n}</b> product${n === 1 ? '' : 's'}`;
    const grid = $('#grid');
    if (!n) { grid.innerHTML = ''; grid.insertAdjacentHTML('beforeend', `<div class="empty" style="grid-column:1/-1"><div class="display">No matches</div><p>Nothing fits those filters. Try removing one or two.</p><button class="btn btn-solid" id="resetF">Reset filters</button></div>`); $('#resetF').onclick = () => $('#activeF .af.clear')?.click() || (st.q = '', update()); }
    else if (append) { const from = grid.children.length; grid.insertAdjacentHTML('beforeend', vis.slice(from).map((p, i) => cardHTML(p, i)).join('')); initReveal(grid); }
    else { grid.innerHTML = vis.map((p, i) => cardHTML(p, i)).join(''); initReveal(grid); }
    $('#more').innerHTML = n > st.shown ? `<button class="btn btn-line" id="moreBtn" data-magnetic>Load more <span class="muted" style="letter-spacing:.1em">(${n - st.shown} left)</span></button>` : (n > PAGE ? `<span class="muted" style="font-size:12px;letter-spacing:.22em;text-transform:uppercase">You’ve seen it all</span>` : '');
    const mb = $('#moreBtn'); if (mb) mb.onclick = () => { st.shown += PAGE; render(true); };
  }
  function url() {
    const p = new URLSearchParams();
    if (st.gender.size === 1) p.set('gender', [...st.gender][0]); if (st.cat.size) p.set('cat', [...st.cat].join(','));
    if (st.size.size) p.set('size', [...st.size].join(','));
    if (st.sort !== 'featured') p.set('sort', st.sort); if (st.q) p.set('q', st.q);
    try { history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')); } catch (e) {}
  }
  function update() { syncSidebar(); chips(); render(false); url(); head(); }
  sortEl.addEventListener('change', () => { st.sort = sortEl.value; st.shown = PAGE; update(); });

  buildFilters();
  syncSidebar(); chips(); render(false); head();
})();
