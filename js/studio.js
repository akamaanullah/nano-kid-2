/* ==========================================================================
   studio.js — Design studio: live SVG preview, multi-layer editor (text / image /
   graphics), drag-resize-rotate, undo/redo, price engine, PNG export, cart, quote.
   ========================================================================== */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Bebas+Neue&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,700;1,700&family=Space+Grotesk:wght@400;700&display=swap';
  const FONTS = ['Anton', 'Bebas Neue', 'Bangers', 'Permanent Marker', 'Pacifico', 'Playfair Display', 'Space Grotesk'];
  const GY = 24; // garment y-offset inside the viewBox (room for the floor shadow)

  /* ----------------------------------------------------------------- garments */
  const P = {
    tee: n => `M130 40 L88 56 L32 112 L68 152 L100 130 L100 384 Q100 394 110 394 L290 394 Q300 394 300 384 L300 130 L332 152 L368 112 L312 56 L270 40 Q200 ${n} 130 40 Z`,
    oversized: n => `M124 44 L74 60 L10 130 L54 178 L88 152 L88 404 Q88 414 98 414 L302 414 Q312 414 312 404 L312 152 L346 178 L390 130 L326 60 L276 44 Q200 ${n} 124 44 Z`,
    sweat: n => `M130 40 L92 56 Q50 80 38 130 L24 318 Q24 328 34 330 L70 334 Q80 334 82 324 L100 190 L100 372 Q100 384 112 384 L288 384 Q300 384 300 372 L300 190 L318 324 Q320 334 330 334 L366 330 Q376 328 376 318 L362 130 Q350 80 308 56 L270 40 Q200 ${n} 130 40 Z`,
    hoodie: () => `M130 52 L94 64 Q52 86 40 134 L26 300 Q26 312 38 316 L72 322 Q82 322 84 312 L100 200 L100 372 Q100 384 112 384 L288 384 Q300 384 300 372 L300 200 L316 312 Q318 322 328 322 L362 316 Q374 312 374 300 L360 134 Q348 86 306 64 L270 52 Q248 10 200 6 Q152 10 130 52 Z`,
    tank: n => `M138 36 L164 36 Q200 ${n} 236 36 L262 36 Q260 98 284 142 Q302 178 298 232 L298 388 Q298 398 288 398 L112 398 Q102 398 102 388 L102 232 Q98 178 116 142 Q140 98 138 36 Z`,
    polo: n => `M130 40 L88 56 L32 112 L68 152 L100 130 L100 384 Q100 394 110 394 L290 394 Q300 394 300 384 L300 130 L332 152 L368 112 L312 56 L270 40 Q200 ${n} 130 40 Z`
  };
  const G = {
    tee: { label: 'T-shirt', base: 1800, path: s => P.tee(s === 'front' ? 78 : 52), sleeves: true,
      anchors: { front: [200, 205], chest: [256, 150], back: [200, 195], sleeve: [64, 112, -63] }, area: [128, 96, 144, 250] },
    oversized: { label: 'Oversized tee', base: 2300, path: s => P.oversized(s === 'front' ? 80 : 54), sleeves: true,
      anchors: { front: [200, 215], chest: [262, 160], back: [200, 205], sleeve: [48, 136, -58] }, area: [124, 100, 152, 260] },
    hoodie: { label: 'Hoodie', base: 3900, path: () => P.hoodie(), sleeves: true,
      anchors: { front: [200, 205], chest: [258, 152], back: [200, 205], sleeve: [58, 215, -85] }, area: [128, 120, 144, 230] },
    sweat: { label: 'Sweatshirt', base: 3300, path: s => P.sweat(s === 'front' ? 78 : 52), sleeves: true,
      anchors: { front: [200, 205], chest: [258, 152], back: [200, 200], sleeve: [58, 215, -85] }, area: [128, 100, 144, 250] },
    tank: { label: 'Tank top', base: 1500, path: s => P.tank(s === 'front' ? 112 : 70), sleeves: false,
      anchors: { front: [200, 215], chest: [246, 156], back: [200, 205] }, area: [130, 110, 140, 250] },
    polo: { label: 'Polo', base: 2400, path: s => P.polo(s === 'front' ? 58 : 48), sleeves: true,
      anchors: { front: [200, 245], chest: [258, 150], back: [200, 190], sleeve: [64, 112, -63] }, area: [128, 130, 144, 220] }
  };
  const GKEYS = Object.keys(G);
  const COLORS = [['Black', '#111111'], ['White', '#F3F3F1'], ['Charcoal', '#3B3B3D'], ['Heather Grey', '#9B9B9B'], ['Navy', '#1B2A4A'], ['Royal Blue', '#2F5FB0'],
    ['Red', '#D62828'], ['Burgundy', '#6E1423'], ['Forest', '#2F4A36'], ['Mustard', '#D9A21B'], ['Sand', '#D8C7A5'], ['Pink', '#E7A5B0']];
  const METHODS = {
    dtf: { label: 'DTF transfer', area: 450, extra: 120, setup: 0, desc: 'Full-colour, photo-quality, soft feel. Any quantity.', tag: 'Best for photos & gradients' },
    screen: { label: 'Screen print', area: 300, extra: 90, setup: 1200, desc: 'Bold, durable inks. Cheapest for bulk — one-off setup under 12 pcs.', tag: 'Best for 12+ pieces' },
    emb: { label: 'Embroidery', area: 700, extra: 350, setup: 0, desc: 'Premium stitched thread with raised texture. Photos are simplified.', tag: 'Premium finish' }
  };
  const TIERS = [[1, 4, 0], [5, 9, 5], [10, 24, 10], [25, 49, 15], [50, 99, 20], [100, 9999, 25]];
  const SIZE_FEE = { XXL: 150, XXXL: 250 };
  const LIB = {
    star: ['Star', '<path d="M0 -48 L14 -16 L48 -14 L22 8 L30 42 L0 24 L-30 42 L-22 8 L-48 -14 L-14 -16 Z"/>'],
    heart: ['Heart', '<path d="M0 40 C-60 0 -40 -48 -15 -38 C-6 -34 0 -26 0 -22 C0 -26 6 -34 15 -38 C40 -48 60 0 0 40 Z"/>'],
    bolt: ['Bolt', '<path d="M12 -50 L-28 6 L-4 6 L-14 50 L30 -8 L6 -8 Z"/>'],
    flame: ['Flame', '<path d="M0 -50 C10 -30 34 -20 34 8 C34 30 18 46 0 46 C-18 46 -34 30 -34 10 C-34 -6 -24 -14 -18 -26 C-14 -16 -8 -12 -4 -12 C-6 -26 -4 -40 0 -50 Z"/>'],
    crown: ['Crown', '<path d="M-44 30 L-48 -22 L-24 0 L0 -36 L24 0 L48 -22 L44 30 Z"/><rect x="-44" y="34" width="88" height="8"/>'],
    smiley: ['Smiley', '<circle r="44" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="-15" cy="-12" r="6"/><circle cx="15" cy="-12" r="6"/><path d="M-24 10 Q0 36 24 10" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>'],
    peace: ['Peace', '<circle r="42" fill="none" stroke="currentColor" stroke-width="8"/><path d="M0 -42 V42 M0 0 L-30 30 M0 0 L30 30" fill="none" stroke="currentColor" stroke-width="8"/>'],
    skull: ['Skull', '<path fill-rule="evenodd" d="M0 -46 C-30 -46 -42 -26 -42 -6 C-42 8 -34 16 -26 22 L-26 38 L-12 38 L-12 30 L-4 30 L-4 38 L4 38 L4 30 L12 30 L12 38 L26 38 L26 22 C34 16 42 8 42 -6 C42 -26 30 -46 0 -46 Z M-22 -8 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z M2 -8 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z"/>'],
    sun: ['Sun', '<circle r="16"/><path d="M0 -44 V-26 M0 44 V26 M-44 0 H-26 M44 0 H26 M-31 -31 L-19 -19 M31 31 L19 19 M-31 31 L-19 19 M31 -31 L19 -19" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>'],
    moon: ['Moon', '<path d="M14 -46 A46 46 0 1 0 14 46 A36 36 0 0 1 14 -46 Z"/>'],
    mountain: ['Peaks', '<path d="M-50 36 L-14 -26 L4 4 L18 -14 L50 36 Z"/>'],
    wave: ['Wave', '<path d="M-48 -14 Q-36 -36 -24 -14 T0 -14 T24 -14 T48 -14 M-48 10 Q-36 -12 -24 10 T0 10 T24 10 T48 10 M-48 34 Q-36 12 -24 34 T0 34 T24 34 T48 34" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>'],
    paw: ['Paw', '<ellipse cx="0" cy="18" rx="22" ry="18"/><ellipse cx="-30" cy="-6" rx="9" ry="12"/><ellipse cx="-11" cy="-28" rx="9" ry="12"/><ellipse cx="11" cy="-28" rx="9" ry="12"/><ellipse cx="30" cy="-6" rx="9" ry="12"/>'],
    rocket: ['Rocket', '<path fill-rule="evenodd" d="M0 -50 C18 -34 22 -8 18 20 L-18 20 C-22 -8 -18 -34 0 -50 Z M-8 -8 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z"/><path d="M-18 6 L-34 30 L-18 24 Z M18 6 L34 30 L18 24 Z M-8 26 L0 48 L8 26 Z"/>'],
    note: ['Music', '<path d="M-14 -40 L30 -50 L30 22 A14 11 0 1 1 22 12 L22 -34 L-6 -28 L-6 32 A14 11 0 1 1 -14 22 Z"/>'],
    arrow: ['Arrow', '<path d="M-48 -10 H10 V-30 L48 0 L10 30 V10 H-48 Z"/>'],
    diamond: ['Diamond', '<path d="M0 -46 L40 -6 L0 46 L-40 -6 Z"/>']
  };
  const TXT_COLORS = ['#F3F3F1', '#111111', '#FF2E2E', '#D9A21B', '#2F5FB0', '#2E8C4A', '#E7A5B0', '#8B5CF6'];

  /* ----------------------------------------------------------------- state */
  const uid = () => Math.random().toString(36).slice(2, 9);
  const IMGS = {}; // id -> { src, name, ar }
  const lum = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h); if (!m) return .5; const v = parseInt(m[1], 16); return (.2126 * (v >> 16 & 255) + .7152 * (v >> 8 & 255) + .0722 * (v & 255)) / 255; };
  const nameForColor = h => (COLORS.find(c => c[1].toLowerCase() === h.toLowerCase()) || ['Custom ' + h.toUpperCase()])[0];
  const defState = () => ({ garment: 'hoodie', color: '#111111', sset: 'adult', size: 'M', method: 'dtf', qty: 1, layers: [] });
  let S = defState(); let view = 'front', sel = null, bg = 'dark', showGuides = true;
  let Z = { z: 1, cx: 200, cy: 230 };
  const q = new URLSearchParams(location.search);
  if (G[q.get('garment')]) S.garment = q.get('garment');
  if (q.get('kids') === '1') { S.sset = 'kids'; S.size = '5-6Y'; }
  if (/^[0-9a-f]{6}$/i.test(q.get('color') || '')) S.color = '#' + q.get('color');

  /* history */
  let hist = [], hi = -1;
  const snap = () => JSON.stringify(S);
  function commit() { const s = snap(); if (hist[hi] === s) return; hist = hist.slice(0, hi + 1); hist.push(s); if (hist.length > 80) hist.shift(); hi = hist.length - 1; syncUndo(); }
  function restore(s) { S = JSON.parse(s); if (sel && !S.layers.find(l => l.id === sel)) sel = null; renderAll(); }
  const undo = () => { if (hi > 0) { hi--; restore(hist[hi]); syncUndo(); } };
  const redo = () => { if (hi < hist.length - 1) { hi++; restore(hist[hi]); syncUndo(); } };
  function syncUndo() { $('#undoBtn').disabled = hi <= 0; $('#redoBtn').disabled = hi >= hist.length - 1; }
  let ct; const commitSoon = () => { clearTimeout(ct); ct = setTimeout(commit, 450); };

  const L = id => S.layers.find(l => l.id === id);
  const selL = () => L(sel);

  /* ----------------------------------------------------------------- price engine */
  function zoneOf(l) {
    if (l.side === 'back') return 'back';
    if (G[S.garment].sleeves && (l.x < 96 || l.x > 304)) return 'sleeve';
    return 'front';
  }
  function calc() {
    const g = G[S.garment], kids = S.sset === 'kids', m = METHODS[S.method];
    let base = g.base; if (kids) base = Math.round(base * .8 / 10) * 10;
    const sizeFee = kids ? 0 : (SIZE_FEE[S.size] || 0);
    const vis = S.layers.filter(l => !l.hidden); const zones = {};
    vis.forEach(l => { const z = zoneOf(l); (zones[z] = zones[z] || []).push(l); });
    const areas = Object.entries(zones).map(([z, ls]) => ({ z, n: ls.length, fee: m.area + m.extra * (ls.length - 1) }));
    const printFee = areas.reduce((a, b) => a + b.fee, 0);
    const unit = base + sizeFee + printFee;
    const tier = TIERS.find(t => S.qty >= t[0] && S.qty <= t[1]) || TIERS[0];
    const gross = unit * S.qty, disc = Math.round(gross * tier[2] / 100);
    const setup = (m.setup && vis.length && S.qty < 12) ? m.setup : 0;
    const total = gross - disc + setup;
    return { base, sizeFee, areas, printFee, unit, tier, gross, disc, setup, total, perPc: Math.round(total / S.qty), nLayers: vis.length };
  }

  /* ----------------------------------------------------------------- SVG building */
  const stage = $('#stage'); let gG, layersG, selG, bgR;
  const zoneLabel = { front: 'Front', back: 'Back', sleeve: 'Sleeve' };
  function defsHTML() {
    return `<defs>
      <radialGradient id="bgDark" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#3d3d46"/><stop offset="1" stop-color="#101012"/></radialGradient>
      <radialGradient id="bgLight" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#f1eee8"/><stop offset="1" stop-color="#bdb8ad"/></radialGradient>
      <radialGradient id="bgRed" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#ff3b3b"/><stop offset="1" stop-color="#7d0b10"/></radialGradient>
      <linearGradient id="shG" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".30"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".07"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
      <linearGradient id="shV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
      <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur14" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
      <filter id="embFx" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx=".6" dy=".9" stdDeviation=".7" flood-color="#000" flood-opacity=".55"/></filter>
    </defs>`;
  }
  function garmentDetails(key, side, c) {
    const dark = lum(c) < .32, st = dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.28)', ln = `fill="none" stroke="${st}" stroke-width="1.6" stroke-linecap="round"`;
    const rib = `fill="none" stroke="${dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.16)'}" stroke-width="7" stroke-linecap="round"`;
    const f = side === 'front', n = P ? 0 : 0; let h = '';
    if (key === 'tee' || key === 'polo') {
      h += `<path d="M100 384 H300" ${ln}/><path d="M68 152 L100 130 M332 152 L300 130" ${ln}/><path d="M100 130 Q96 90 88 56 M300 130 Q304 90 312 56" ${ln} opacity=".6"/>`;
      if (key === 'tee') h += `<path d="M134 46 Q200 ${f ? 84 : 58} 266 46" ${rib}/>`;
      if (key === 'polo') {
        if (f) {
          h += `<path d="M130 40 L176 34 L200 88 L224 34 L270 40 L246 70 L200 104 L154 70 Z" fill="${dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'}" stroke="${st}" stroke-width="1.6" stroke-linejoin="round"/><path d="M200 88 V196" ${ln}/><path d="M194 92 V196 M206 92 V196" ${ln} opacity=".5"/>`;
          [118, 148, 178].forEach(y => h += `<circle cx="200" cy="${y}" r="3.4" fill="${dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'}"/>`);
        } else h += `<path d="M130 40 Q200 74 270 40 L270 54 Q200 90 130 54 Z" fill="${dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'}" stroke="${st}" stroke-width="1.6"/>`;
      }
    } else if (key === 'oversized') {
      h += `<path d="M88 404 H312" ${ln}/><path d="M54 178 L88 152 M346 178 L312 152" ${ln}/><path d="M88 152 Q84 100 74 60 M312 152 Q316 100 326 60" ${ln} opacity=".6"/><path d="M128 48 Q200 ${f ? 88 : 60} 272 48" ${rib}/>`;
    } else if (key === 'sweat') {
      h += `<path d="M100 364 H300" ${ln}/><path d="M24 306 L78 314 M376 306 L322 314" ${ln}/><path d="M100 190 Q96 120 92 56 M300 190 Q304 120 308 56" ${ln} opacity=".6"/><path d="M134 46 Q200 ${f ? 88 : 60} 266 46" ${rib}/>`;
    } else if (key === 'hoodie') {
      h += `<path d="M100 364 H300" ${ln}/><path d="M26 300 L78 314 M374 300 L322 314" ${ln}/><path d="M100 200 Q96 120 94 64 M300 200 Q304 120 306 64" ${ln} opacity=".6"/>`;
      if (f) h += `<path d="M134 54 Q200 120 266 54 Q250 16 200 12 Q150 16 134 54 Z" fill="rgba(0,0,0,${dark ? .5 : .32})" stroke="${st}" stroke-width="1.6"/><path d="M132 270 L268 270 L290 352 L110 352 Z" ${ln}/><path d="M118 360 L282 360" ${ln} opacity=".0"/><path d="M178 92 Q176 118 180 142 M222 92 Q224 118 220 142" fill="none" stroke="${dark ? '#e9e6df' : '#f3f1ec'}" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`;
      else h += `<path d="M136 58 Q200 134 264 58" ${ln}/><path d="M200 14 V122" ${ln} opacity=".7"/>`;
    } else if (key === 'tank') {
      h += `<path d="M102 388 H298" ${ln}/><path d="M${f ? '' : ''}138 36 Q130 90 108 138 M262 36 Q270 90 292 138" ${ln} opacity=".6"/><path d="M164 38 Q200 ${f ? 108 : 66} 236 38" ${rib}/>`;
    }
    return h;
  }
  function buildStage() {
    stage.innerHTML = defsHTML() + `<rect id="bgR" x="-600" y="-600" width="1600" height="1700" fill="url(#bgDark)"/>
      <ellipse id="floor" cx="200" cy="${GY + 420}" rx="150" ry="14" fill="#000" opacity=".4" filter="url(#blur14)"/>
      <g id="gG" transform="translate(0 ${GY})"></g>`;
    gG = $('#gG', stage); bgR = $('#bgR', stage);
  }
  function renderGarment() {
    const g = G[S.garment], d = g.path(view), c = S.color;
    const dark = lum(c) < .32;
    gG.innerHTML = `<clipPath id="gclip"><path d="${d}"/></clipPath>
      <path d="${d}" fill="${c}"/>
      <g class="gd">${garmentDetails(S.garment, view, c)}</g>
      <g id="guides" style="display:${showGuides ? 'block' : 'none'}"><rect x="${g.area[0]}" y="${g.area[1]}" width="${g.area[2]}" height="${g.area[3]}" rx="4" fill="none" stroke="${dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'}" stroke-dasharray="5 5" stroke-width="1.2" opacity="0"/></g>
      <g clip-path="url(#gclip)"><g id="layersG"></g></g>
      <path d="${d}" fill="url(#shG)" pointer-events="none"/><path d="${d}" fill="url(#shV)" pointer-events="none"/>
      <g clip-path="url(#gclip)" pointer-events="none"><path d="M138 120 Q156 210 144 330" fill="none" stroke="#000" stroke-width="12" opacity=".07" filter="url(#blur6)"/><path d="M262 140 Q248 230 262 340" fill="none" stroke="#000" stroke-width="12" opacity=".07" filter="url(#blur6)"/><path d="M190 300 Q210 340 230 390" fill="none" stroke="#fff" stroke-width="10" opacity=".05" filter="url(#blur6)"/></g>
      <path d="${d}" fill="none" stroke="${dark ? 'rgba(255,255,255,.34)' : 'rgba(0,0,0,.35)'}" stroke-width="1.4" stroke-linejoin="round" pointer-events="none"/>
      <g id="selG"></g>`;
    layersG = $('#layersG', gG); selG = $('#selG', gG);
    bgR.setAttribute('fill', `url(#bg${bg[0].toUpperCase() + bg.slice(1)})`);
    $('#floor', stage).setAttribute('opacity', bg === 'light' ? .25 : .4);
  }

  /* layer -> svg markup (local coords centred on 0,0) */
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function layerInner(l, id) {
    if (l.type === 'text') {
      const lines = (l.t || ' ').split('\n'), fam = `'${l.font}', sans-serif`;
      const common = `font-family="${fam}" font-size="${l.size}" font-weight="${l.bold ? 700 : 400}" font-style="${l.italic ? 'italic' : 'normal'}" fill="${l.color}" letter-spacing="${l.ls}" ${l.outline > 0 ? `stroke="${l.outlineColor}" stroke-width="${l.outline}" stroke-linejoin="round" paint-order="stroke fill"` : ''}`;
      if (l.arc && l.arc !== 0) {
        const r = Math.round(6000 / Math.abs(l.arc)), up = l.arc > 0;
        const path = up ? `M ${-r} ${r} A ${r} ${r} 0 0 1 ${r} ${r}` : `M ${-r} ${-r} A ${r} ${r} 0 0 0 ${r} ${-r}`;
        return `<defs><path id="arc-${id}" d="${path}"/></defs><text ${common} text-anchor="middle" dominant-baseline="middle"><textPath href="#arc-${id}" startOffset="50%">${esc(lines.join(' '))}</textPath></text>`;
      }
      const anchor = l.align === 'left' ? 'start' : l.align === 'right' ? 'end' : 'middle';
      const lh = l.size * 1.08, y0 = -((lines.length - 1) * lh) / 2;
      return `<text ${common} text-anchor="${anchor}" dominant-baseline="central" data-align="${l.align}">${lines.map((ln, i) => `<tspan x="0" y="${(y0 + i * lh).toFixed(1)}">${esc(ln) || ' '}</tspan>`).join('')}</text>`;
    }
    if (l.type === 'image') {
      const im = IMGS[l.imgId]; if (!im) return '';
      const w = l.size, h = l.size / im.ar;
      return `<image href="${im.src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    const lib = LIB[l.key]; const k = l.size / 100;
    return `<g transform="scale(${k})" fill="${l.color}" color="${l.color}">${lib[1]}</g>`;
  }
  const layerTf = l => `translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)}) scale(${l.flip ? -1 : 1} 1)`;
  function layerEl(l) {
    const embFx = S.method === 'emb' ? ' filter="url(#embFx)"' : '';
    return `<g class="lyr" id="L-${l.id}" data-layer="${l.id}" transform="${layerTf(l)}" opacity="${l.op}"${embFx}><g class="lyr-in">${layerInner(l, l.id)}</g></g>`;
  }
  function addHits() {
    $$('.lyr', layersG).forEach(g => { // transparent hit-box so letters/gaps are easy to grab
      const old = $('.hit', g); if (old) old.remove();
      const inn = $('.lyr-in', g); if (!inn || !inn.getBBox) return;
      const b = inn.getBBox(); if (!b.width) return;
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('class', 'hit'); r.setAttribute('x', b.x - 3); r.setAttribute('y', b.y - 3); r.setAttribute('width', b.width + 6); r.setAttribute('height', b.height + 6); r.setAttribute('fill', 'transparent');
      g.insertBefore(r, g.firstChild);
    });
  }
  function fixAlign() { fixAlign0(); addHits(); }
  function fixAlign0() {
    $$('text[data-align]', layersG).forEach(t => {
      const a = t.dataset.align; if (a === 'center') return;
      const ts = $$('tspan', t); const w = Math.max(...ts.map(x => x.getComputedTextLength ? x.getComputedTextLength() : 0));
      ts.forEach(x => x.setAttribute('x', a === 'left' ? -w / 2 : w / 2));
    });
  }
  function renderLayers() {
    const vis = S.layers.filter(l => l.side === view && !l.hidden);
    layersG.innerHTML = vis.map(layerEl).join('');
    fixAlign(); renderSel();
  }
  let snapGuide = false;
  function renderSel() {
    selG.innerHTML = '';
    const l = selL(); if (!l || l.side !== view || l.hidden) return;
    const el = $('#L-' + l.id, layersG); if (!el) return;
    let bb; try { bb = $('.lyr-in', el).getBBox(); } catch (e) { return; }
    if (!bb.width) bb = { x: -30, y: -15, width: 60, height: 30 };
    const pad = 6, x = bb.x - pad, y = bb.y - pad, w = bb.width + pad * 2, h = bb.height + pad * 2;
    const flip = l.flip ? -1 : 1;
    const hs = 7;
    const corner = (cx, cy, c) => `<g data-handle="resize" data-c="${c}" transform="translate(${cx} ${cy})"><circle r="16" fill="transparent"/><rect x="${-hs / 2 - 1}" y="${-hs / 2 - 1}" width="${hs + 2}" height="${hs + 2}" fill="#fff" stroke="#FF2E2E" stroke-width="1.6"/></g>`;
    selG.innerHTML = `<g transform="translate(${l.x} ${l.y}) rotate(${l.rot})">
      <g transform="scale(${flip} 1)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(255,46,46,.05)" stroke="#FF2E2E" stroke-width="1.3" stroke-dasharray="4 3" pointer-events="none"/></g>
      <line x1="0" y1="${y}" x2="0" y2="${y - 22}" stroke="#FF2E2E" stroke-width="1.3"/>
      <g data-handle="rotate" transform="translate(0 ${y - 22})"><circle r="16" fill="transparent"/><circle r="6.5" fill="#FF2E2E" stroke="#fff" stroke-width="1.6"/></g>
      ${corner(x + w, y + h, 'br')}${corner(x, y + h, 'bl')}${corner(x + w, y, 'tr')}
      <g data-handle="delete" transform="translate(${x} ${y})"><circle r="16" fill="transparent"/><circle r="8.5" fill="#FF2E2E" stroke="#fff" stroke-width="1.6"/><path d="M-3.2 -3.2 L3.2 3.2 M3.2 -3.2 L-3.2 3.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>
    </g>` + (snapGuide ? `<line x1="200" y1="-40" x2="200" y2="460" stroke="#FF2E2E" stroke-width="1" stroke-dasharray="3 4" opacity=".8"/>` : '');
    const gd = $('#guides rect', gG); if (gd) gd.setAttribute('opacity', dragging ? 1 : .0);
  }
  function applyZoom() {
    const w = 400 / Z.z, h = 460 / Z.z;
    Z.cx = Math.min(400 - w / 2, Math.max(w / 2, Z.cx)); Z.cy = Math.min(460 - h / 2, Math.max(h / 2, Z.cy));
    stage.setAttribute('viewBox', `${Z.cx - w / 2} ${Z.cy - h / 2} ${w} ${h}`);
    $('#zReset').textContent = Z.z.toFixed(Z.z % 1 ? 1 : 0) + '×';
    stage.classList.toggle('zoomed', Z.z > 1);
  }
  const setZoom = z => { Z.z = Math.min(3, Math.max(1, +z.toFixed(2))); if (Z.z === 1) { Z.cx = 200; Z.cy = 230; } applyZoom(); };

  /* ----------------------------------------------------------------- pointer interaction */
  let drag = null, dragging = false;
  const pt = (e) => { const p = stage.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = layersG.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
  const ptRoot = (e) => { const p = stage.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(stage.getScreenCTM().inverse()); };
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    const hnd = e.target.closest('[data-handle]'), lay = e.target.closest('[data-layer]');
    const l = selL();
    if (hnd && l) {
      const type = hnd.dataset.handle;
      if (type === 'delete') { removeLayer(l.id); return; }
      const p = pt(e);
      drag = { type, id: l.id, d0: Math.hypot(p.x - l.x, p.y - l.y) || 1, s0: l.size, moved: false };
    } else if (lay) {
      const id = lay.dataset.layer; if (sel !== id) { sel = id; renderSel(); renderEditor(); renderLayerList(); }
      const p = pt(e), l2 = L(id); drag = { type: 'move', id, dx: p.x - l2.x, dy: p.y - l2.y, moved: false };
    } else {
      if (sel) { sel = null; renderSel(); renderEditor(); renderLayerList(); }
      if (Z.z > 1) { const r = ptRoot(e); drag = { type: 'pan', sx: r.x, sy: r.y, cx: Z.cx, cy: Z.cy }; }
      else return;
    }
    stage.setPointerCapture(e.pointerId); dragging = true; stage.classList.add('dragging'); e.preventDefault();
    const gd = $('#guides rect', gG); if (gd && drag.type !== 'pan') gd.setAttribute('opacity', 1);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const l = L(drag.id);
    if (drag.type === 'pan') { const r = ptRoot(e); Z.cx = drag.cx - (r.x - drag.sx); Z.cy = drag.cy - (r.y - drag.sy); applyZoom(); return; }
    if (!l) return; const p = pt(e); drag.moved = true;
    if (drag.type === 'move') {
      let x = p.x - drag.dx, y = p.y - drag.dy; x = Math.min(380, Math.max(20, x)); y = Math.min(410, Math.max(10, y));
      snapGuide = Math.abs(x - 200) < 5; if (snapGuide) x = 200; l.x = x; l.y = y;
    } else if (drag.type === 'resize') {
      const d = Math.hypot(p.x - l.x, p.y - l.y); l.size = Math.max(l.type === 'text' ? 8 : 20, Math.min(l.type === 'text' ? 160 : 360, drag.s0 * d / drag.d0));
      if (l.type === 'text') syncEditorValues();
    } else if (drag.type === 'rotate') {
      let a = Math.atan2(p.y - l.y, p.x - l.x) * 180 / Math.PI + 90; a = ((a + 540) % 360) - 180;
      const r = Math.round(a / 15) * 15; if (Math.abs(a - r) < 4 || e.shiftKey) a = r; l.rot = a; syncEditorValues();
    }
    const el = $('#L-' + l.id, layersG);
    if (el) { el.setAttribute('transform', layerTf(l)); if (drag.type === 'resize') { $('.lyr-in', el).innerHTML = layerInner(l, l.id); fixAlign(); } }
    renderSel();
  });
  const endDrag = e => { if (!drag) return; const m = drag.moved; drag = null; dragging = false; snapGuide = false; stage.classList.remove('dragging'); renderSel(); if (m) { commit(); renderLayerList(); } };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('dblclick', e => {
    const lay = e.target.closest('[data-layer]');
    if (lay) { const l = L(lay.dataset.layer); if (l && l.type === 'text') { openStep('layers'); setTimeout(() => $('#tText') && $('#tText').focus(), 250); } return; }
    if (!e.target.closest('[data-handle]')) { if (Z.z === 1) { const r = ptRoot(e); Z.cx = r.x; Z.cy = r.y; setZoom(2); } else setZoom(1); }
  });
  stage.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); setZoom(Z.z * (e.deltaY < 0 ? 1.12 : .9)); }, { passive: false });

  /* ----------------------------------------------------------------- layer ops */
  function anchorFor(kind) { const a = G[S.garment].anchors; return a[kind] || a.front; }
  function newText() {
    const dark = lum(S.color) < .5;
    const a = anchorFor(view === 'back' ? 'back' : 'front');
    let ty = a[1] - (view === 'back' ? 20 : 0); // stagger new text so layers don't stack exactly
    while (S.layers.some(o => o.side === view && Math.abs(o.y - ty) < 14 && Math.abs(o.x - a[0]) < 30) && ty < 380) ty += 34;
    return { id: uid(), type: 'text', side: view, x: a[0], y: ty, rot: 0, op: 1, flip: false, hidden: false, size: 38, t: 'YOUR TEXT', font: 'Anton', color: dark ? '#F3F3F1' : '#111111', bold: false, italic: false, ls: 1, arc: 0, align: 'center', outline: 0, outlineColor: dark ? '#111111' : '#F3F3F1' };
  }
  function addLayer(l) { S.layers.push(l); sel = l.id; commit(); renderAll(); openStep('layers'); }
  function removeLayer(id) { S.layers = S.layers.filter(l => l.id !== id); if (sel === id) sel = null; commit(); renderAll(); }
  function dupLayer(id) { const l = L(id); if (!l) return; const c = JSON.parse(JSON.stringify(l)); c.id = uid(); c.x = Math.min(380, l.x + 16); c.y = Math.min(410, l.y + 16); S.layers.splice(S.layers.indexOf(l) + 1, 0, c); sel = c.id; commit(); renderAll(); }
  function moveLayer(id, d) { const i = S.layers.findIndex(l => l.id === id), j = i + d; if (i < 0 || j < 0 || j >= S.layers.length) return; const [l] = S.layers.splice(i, 1); S.layers.splice(j, 0, l); commit(); renderAll(); }
  function placeLayer(id, kind) {
    const l = L(id); if (!l) return; const a = anchorFor(kind);
    if (kind === 'sleeve' && !G[S.garment].sleeves) { toast('Tank tops have no sleeves'); return; }
    l.side = kind === 'back' ? 'back' : 'front'; l.x = a[0]; l.y = a[1]; l.rot = a[2] || 0;
    if (kind === 'chest' || kind === 'sleeve') { if (l.type === 'text') l.size = Math.min(l.size, kind === 'sleeve' ? 20 : 22); else l.size = Math.min(l.size, kind === 'sleeve' ? 34 : 52); }
    if (kind === 'back' && l.type !== 'text') l.size = Math.max(l.size, 140); if (kind === 'back' && l.type === 'text') l.size = Math.max(l.size, 44);
    if (kind === 'front' && l.size < 30 && l.type === 'text') l.size = 38;
    view = l.side; commit(); renderAll();
  }

  /* ----------------------------------------------------------------- UI: panels */
  const sumLayers = () => { const n = S.layers.length; $('#sum-layers').textContent = n + (n === 1 ? ' layer' : ' layers'); };
  function openStep(k, only) { const s = $(`.stp[data-step="${k}"]`); if (!s) return; s.classList.add('open'); $('.stp-h', s).setAttribute('aria-expanded', 'true'); }
  $$('.stp-h').forEach(b => b.addEventListener('click', () => { const s = b.parentElement, o = !s.classList.contains('open'); s.classList.toggle('open', o); b.setAttribute('aria-expanded', o); }));

  function renderGarmentGrid() {
    $('#garmentGrid').innerHTML = GKEYS.map(k => {
      const g = G[k]; const d = g.path('front');
      return `<button type="button" class="g-card${k === S.garment ? ' on' : ''}" data-g="${k}" role="radio" aria-checked="${k === S.garment}"><svg viewBox="0 0 400 430" aria-hidden="true"><path d="${d}" fill="${k === S.garment ? 'var(--accent)' : 'currentColor'}"/></svg><b>${g.label}</b><small>from ${fmt(S.sset === 'kids' ? Math.round(g.base * .8 / 10) * 10 : g.base)}</small></button>`;
    }).join('');
    $('#sum-garment').textContent = G[S.garment].label;
  }
  function renderColors() {
    $('#colorGrid').innerHTML = COLORS.map(([n, h]) => `<button type="button" class="c-sw${h.toLowerCase() === S.color.toLowerCase() ? ' on' : ''}" style="--c:${h}" data-c="${h}" title="${n}" aria-label="${n}" role="radio" aria-checked="${h.toLowerCase() === S.color.toLowerCase()}"></button>`).join('');
    $('#colorPick').value = S.color; $('#colorHex').textContent = S.color.toUpperCase(); $('#sum-color').textContent = nameForColor(S.color);
  }
  function renderSizes() {
    const list = S.sset === 'kids' ? SIZES_KIDS : SIZES_ADULT;
    if (!list.includes(S.size)) S.size = S.sset === 'kids' ? '5-6Y' : 'M';
    $('#sizeGrid').innerHTML = list.map(s => `<button type="button" class="sz${s === S.size ? ' on' : ''}" data-s="${s}" role="radio" aria-checked="${s === S.size}">${s}</button>`).join('');
    $$('[data-sset]').forEach(b => b.classList.toggle('on', b.dataset.sset === S.sset));
    $('#sizeNote').textContent = S.sset === 'kids' ? 'Kids sizes are priced 20% lower than adult. Ages 2–14.' : (SIZE_FEE[S.size] ? `${S.size} adds ${fmt(SIZE_FEE[S.size])} per piece.` : 'XXL adds Rs. 150 and XXXL adds Rs. 250 per piece.');
    $('#sum-size').textContent = S.size;
  }
  function renderMethods() {
    $('#methodGrid').innerHTML = Object.entries(METHODS).map(([k, m]) => `<button type="button" class="m-card${k === S.method ? ' on' : ''}" data-m="${k}" role="radio" aria-checked="${k === S.method}"><span class="m-top"><b>${m.label}</b><em>${fmt(m.area)}/area</em></span><span class="m-d">${m.desc}</span><small>${m.tag}</small></button>`).join('');
    const m = METHODS[S.method]; $('#methodNote').textContent = `Each print area (front, back, sleeve) costs ${fmt(m.area)}; every extra layer in the same area adds ${fmt(m.extra)}.` + (m.setup ? ` Orders under 12 pcs add a ${fmt(m.setup)} setup fee.` : '');
    $('#sum-method').textContent = m.label.split(' ')[0];
  }
  function renderLib() {
    $('#lib').innerHTML = Object.entries(LIB).map(([k, [n, p]]) => `<button type="button" class="lib-i" data-k="${k}" title="${n}" aria-label="Add ${n} graphic"><svg viewBox="-56 -56 112 112" fill="currentColor" color="currentColor" aria-hidden="true">${p}</svg></button>`).join('');
  }
  function layerLabel(l) { return l.type === 'text' ? (l.t.replace(/\n/g, ' ').slice(0, 22) || 'Text') : l.type === 'image' ? (IMGS[l.imgId] ? IMGS[l.imgId].name.slice(0, 22) : 'Image') : LIB[l.key][0]; }
  const IC = { up: '<path d="M12 19V5M6 11l6-6 6 6"/>', dn: '<path d="M12 5v14M6 13l6 6 6-6"/>', dup: '<rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/>', del: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.5 7.6C3.9 9.3 2 12 2 12s3.6 6 10 6a9.6 9.6 0 0 0 4-.9"/>', txt: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', img: '<path d="M4 4h16v16H4z"/><path d="m4 16 5-5 4 4 3-3 4 4"/>', star: '<path d="m12 3 2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17l-5.6 3.2L7.700 13.900 3 9.600l6.300-.7z"/>' };
  const ib = (k, a, id, t, dis) => `<button type="button" class="ib" data-a="${a}" data-id="${id}" title="${t}" aria-label="${t}"${dis ? ' disabled' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">${IC[k]}</svg></button>`;
  function renderLayerList() {
    sumLayers();
    const list = $('#layerList');
    if (!S.layers.length) { list.innerHTML = '<div class="lay-empty"><b>No layers yet</b><span>Add text, upload an image or pick a graphic in step 05.</span></div>'; return; }
    list.innerHTML = [...S.layers].reverse().map((l, ri) => { const i = S.layers.length - 1 - ri; const z = zoneOf(l);
      return `<div class="lay${l.id === sel ? ' on' : ''}${l.hidden ? ' off' : ''}" data-id="${l.id}" tabindex="0"><span class="lay-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">${IC[l.type === 'text' ? 'txt' : l.type === 'image' ? 'img' : 'star']}</svg></span><span class="lay-n"><b>${esc(layerLabel(l))}</b><small>${zoneLabel[z]}</small></span><span class="lay-a">${ib('up', 'fwd', l.id, 'Bring forward', i === S.layers.length - 1)}${ib('dn', 'bwd', l.id, 'Send backward', i === 0)}${ib('dup', 'dup', l.id, 'Duplicate')}${ib(l.hidden ? 'eyeoff' : 'eye', 'hide', l.id, l.hidden ? 'Show layer' : 'Hide layer')}${ib('del', 'del', l.id, 'Delete')}</span></div>`; }).join('');
  }
  $('#layerList').addEventListener('click', e => {
    const b = e.target.closest('.ib'), row = e.target.closest('.lay'); if (!row) return; const id = row.dataset.id;
    if (b) { e.stopPropagation(); const a = b.dataset.a; if (a === 'del') removeLayer(id); else if (a === 'dup') dupLayer(id); else if (a === 'fwd') moveLayer(id, 1); else if (a === 'bwd') moveLayer(id, -1); else if (a === 'hide') { const l = L(id); l.hidden = !l.hidden; commit(); renderAll(); } return; }
    const l = L(id); sel = id; if (l.side !== view) view = l.side; renderAll();
  });

  /* ---- editor (properties of selected layer) */
  const sl = (id, label, min, max, step, val, unit = '') => `<div class="rng"><label for="${id}">${label}<b id="${id}V">${val}${unit}</b></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  function swatchRow(id, cur) { return `<div class="sw-row" id="${id}">${TXT_COLORS.map(c => `<button type="button" class="tc${c.toLowerCase() === (cur || '').toLowerCase() ? ' on' : ''}" style="--c:${c}" data-c="${c}" aria-label="Colour ${c}"></button>`).join('')}<label class="tc pick" title="Custom colour"><input type="color" value="${cur}" aria-label="Custom colour"></label></div>`; }
  function renderEditor() {
    const box = $('#editor'), l = selL();
    if (!l) { box.innerHTML = S.layers.length ? '<p class="note">Select a layer on the preview or in the list to edit it.</p>' : ''; return; }
    let h = '';
    if (l.type === 'text') {
      h += `<div class="field"><label for="tText">Text <small>(Enter for a new line)</small></label><textarea id="tText" rows="2" maxlength="120">${esc(l.t)}</textarea></div>
      <div class="row2s"><div class="field"><label for="tFont">Font</label><select id="tFont">${FONTS.map(f => `<option value="${f}" style="font-family:'${f}'"${f === l.font ? ' selected' : ''}>${f}</option>`).join('')}</select></div>
      <div class="field"><label>Style</label><div class="tgl"><button type="button" id="tBold" class="${l.bold ? 'on' : ''}" aria-pressed="${l.bold}" aria-label="Bold"><b>B</b></button><button type="button" id="tItalic" class="${l.italic ? 'on' : ''}" aria-pressed="${l.italic}" aria-label="Italic"><i>I</i></button>
      <button type="button" data-al="left" class="${l.align === 'left' ? 'on' : ''}" aria-label="Align left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h10M4 18h14"/></svg></button><button type="button" data-al="center" class="${l.align === 'center' ? 'on' : ''}" aria-label="Align centre"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M5 18h14"/></svg></button><button type="button" data-al="right" class="${l.align === 'right' ? 'on' : ''}" aria-label="Align right"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M10 12h10M6 18h14"/></svg></button></div></div></div>
      <p class="lab">Colour</p>${swatchRow('tColor', l.color)}
      ${sl('tSize', 'Size', 8, 120, 1, Math.round(l.size))}${sl('tLs', 'Letter spacing', -3, 24, .5, l.ls)}${sl('tArc', 'Curve', -100, 100, 1, l.arc)}
      ${sl('tOut', 'Outline', 0, 8, .5, l.outline)}<div id="outCol" style="${l.outline > 0 ? '' : 'display:none'}"><p class="lab">Outline colour</p>${swatchRow('tOutColor', l.outlineColor)}</div>`;
    } else if (l.type === 'sticker') {
      h += `<p class="lab">Colour</p>${swatchRow('sColor', l.color)}${sl('sSize', 'Size', 20, 360, 1, Math.round(l.size))}`;
    } else {
      h += `<div class="im-row"><span class="im-n">${esc(layerLabel(l))}</span><button type="button" class="txt-link" id="replImg">Replace image</button></div>${sl('sSize', 'Size', 20, 360, 1, Math.round(l.size))}`;
    }
    h += sl('lRot', 'Rotation', -180, 180, 1, Math.round(l.rot), '°') + sl('lOp', 'Opacity', 10, 100, 1, Math.round(l.op * 100), '%');
    h += `<div class="tgl wide"><button type="button" id="lFlip" class="${l.flip ? 'on' : ''}" aria-pressed="${!!l.flip}">Flip horizontally</button></div>`;
    h += `<p class="lab">Placement</p><div class="place" id="place"><button type="button" data-p="front">Front centre</button><button type="button" data-p="chest">Left chest</button><button type="button" data-p="back">Back full</button><button type="button" data-p="sleeve"${G[S.garment].sleeves ? '' : ' disabled'}>Sleeve</button></div><p class="note">Drag the layer on the preview to fine-tune its position.</p>`;
    box.innerHTML = `<div class="ed-h"><b>Edit layer</b><span>${esc(layerLabel(l))}</span></div>` + h;
  }
  function syncEditorValues() {
    const l = selL(); if (!l) return;
    const set = (id, v, u = '') => { const i = $('#' + id), o = $('#' + id + 'V'); if (i && document.activeElement !== i) i.value = v; if (o) o.textContent = v + u; };
    set('tSize', Math.round(l.size)); set('sSize', Math.round(l.size)); set('lRot', Math.round(l.rot), '°');
  }
  const ed = $('#editor');
  function liveUpdate(l, soft) { const el = $('#L-' + l.id, layersG); if (!el) { renderLayers(); return; } el.setAttribute('transform', layerTf(l)); el.setAttribute('opacity', l.op); $('.lyr-in', el).innerHTML = layerInner(l, l.id); fixAlign(); renderSel(); if (!soft) renderLayerList(); }
  ed.addEventListener('input', e => {
    const l = selL(); if (!l) return; const t = e.target, id = t.id;
    const num = () => parseFloat(t.value);
    if (id === 'tText') { l.t = t.value; liveUpdate(l); commitSoon(); return; }
    if (t.type === 'range') {
      const v = num(), o = $('#' + id + 'V');
      const map = { tSize: () => l.size = v, sSize: () => l.size = v, tLs: () => l.ls = v, tArc: () => l.arc = v, tOut: () => { l.outline = v; $('#outCol').style.display = v > 0 ? '' : 'none'; }, lRot: () => l.rot = v, lOp: () => l.op = v / 100 };
      if (map[id]) map[id](); if (o) o.textContent = v + (id === 'lRot' ? '°' : id === 'lOp' ? '%' : ''); liveUpdate(l, true); return;
    }
    if (t.type === 'color') { const wrap = t.closest('.sw-row'); const c = t.value; if (wrap.id === 'tColor' || wrap.id === 'sColor') l.color = c; else l.outlineColor = c; $$('.tc', wrap).forEach(b => b.classList.remove('on')); t.parentElement.classList.add('on'); liveUpdate(l, true); commitSoon(); }
  });
  ed.addEventListener('change', e => { const t = e.target; if (t.id === 'tFont') { const l = selL(); l.font = t.value; document.fonts.load(`36px "${t.value}"`).finally(() => { liveUpdate(l); commit(); }); } else if (t.type === 'range') commit(); });
  ed.addEventListener('click', e => {
    const l = selL(); if (!l) return; const t = e.target;
    const tc = t.closest('.tc[data-c]');
    if (tc) { const wrap = tc.closest('.sw-row'); if (wrap.id === 'tColor' || wrap.id === 'sColor') l.color = tc.dataset.c; else l.outlineColor = tc.dataset.c; $$('.tc', wrap).forEach(b => b.classList.toggle('on', b === tc)); liveUpdate(l, true); commit(); return; }
    if (t.closest('#tBold')) { l.bold = !l.bold; renderEditor(); liveUpdate(l); commit(); return; }
    if (t.closest('#tItalic')) { l.italic = !l.italic; renderEditor(); liveUpdate(l); commit(); return; }
    const al = t.closest('[data-al]'); if (al) { l.align = al.dataset.al; renderEditor(); liveUpdate(l); commit(); return; }
    if (t.closest('#lFlip')) { l.flip = !l.flip; renderEditor(); liveUpdate(l); commit(); return; }
    const p = t.closest('[data-p]'); if (p) { placeLayer(l.id, p.dataset.p); return; }
    if (t.closest('#replImg')) { replaceTarget = l.id; $('#fileIn').click(); }
  });

  /* ---- other panels */
  $('#garmentGrid').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; S.garment = b.dataset.g; if (!G[S.garment].sleeves) S.layers.forEach(l => { if (l.x < 96 || l.x > 304) l.x = Math.min(290, Math.max(110, l.x)); }); commit(); renderAll(); flipAnim(); });
  $('#colorGrid').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; S.color = b.dataset.c; commit(); renderAll(); });
  $('#colorPick').addEventListener('input', e => { S.color = e.target.value; renderGarment(); renderLayers(); $('#colorHex').textContent = S.color.toUpperCase(); $('#sum-color').textContent = nameForColor(S.color); $$('.c-sw').forEach(b => b.classList.remove('on')); renderPrice(); commitSoon(); });
  $$('[data-sset]').forEach(b => b.addEventListener('click', () => { S.sset = b.dataset.sset; commit(); renderAll(); }));
  $('#sizeGrid').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; S.size = b.dataset.s; commit(); renderAll(); });
  $('#methodGrid').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; S.method = b.dataset.m; commit(); renderAll(); });
  $('#lib').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const a = anchorFor(view === 'back' ? 'back' : 'front'); const dark = lum(S.color) < .5; addLayer({ id: uid(), type: 'sticker', key: b.dataset.k, side: view, x: a[0], y: a[1] + (view === 'back' ? -10 : 0), rot: 0, op: 1, flip: false, hidden: false, size: 80, color: dark ? '#F3F3F1' : '#111111' }); });
  $('#addText').addEventListener('click', () => addLayer(newText()));
  $('#addImage').addEventListener('click', () => { replaceTarget = null; $('#fileIn').click(); });
  $('#qMinus').addEventListener('click', () => setQty(S.qty - 1)); $('#qPlus').addEventListener('click', () => setQty(S.qty + 1));
  $('#qtyIn').addEventListener('input', e => { const v = parseInt(e.target.value); if (v > 0) { S.qty = Math.min(999, v); renderPrice(); commitSoon(); } });
  $('#qtyIn').addEventListener('blur', () => { $('#qtyIn').value = S.qty; });
  function setQty(v) { S.qty = Math.min(999, Math.max(1, v)); $('#qtyIn').value = S.qty; commit(); renderPrice(); }
  $$('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; if (selL() && selL().side !== view) sel = null; renderAll(); flipAnim(); }));
  $$('[data-bg]').forEach(b => b.addEventListener('click', () => { bg = b.dataset.bg; $$('[data-bg]').forEach(x => x.classList.toggle('on', x === b)); renderGarment(); renderLayers(); }));
  $('#zIn').onclick = () => setZoom(Z.z + .5); $('#zOut').onclick = () => setZoom(Z.z - .5); $('#zReset').onclick = () => setZoom(1);
  $('#guideBtn').onclick = () => { showGuides = !showGuides; $('#guideBtn').classList.toggle('on', showGuides); const g = $('#guides', gG); if (g) g.style.display = showGuides ? 'block' : 'none'; };
  $('#undoBtn').onclick = undo; $('#redoBtn').onclick = redo;
  $('#resetBtn').onclick = () => { if (!confirm('Reset the whole design? You can still undo.')) return; const g = S.garment; S = defState(); S.garment = g; sel = null; view = 'front'; commit(); renderAll(); toast('Design reset'); };
  function flipAnim() { if (reduceMotion) return; gG.classList.remove('flip'); void gG.getBoundingClientRect(); gG.classList.add('flip'); }
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase(); if (['input', 'textarea', 'select'].includes(tag) && !(e.target.type === 'range')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    const l = selL(); if (!l) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeLayer(l.id); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); dupLayer(l.id); }
    else if (e.key.startsWith('Arrow') && tag !== 'range') { e.preventDefault(); const d = e.shiftKey ? 10 : 2; if (e.key === 'ArrowLeft') l.x -= d; if (e.key === 'ArrowRight') l.x += d; if (e.key === 'ArrowUp') l.y -= d; if (e.key === 'ArrowDown') l.y += d; liveUpdate(l, true); commitSoon(); }
  });

  /* ---- image upload */
  let replaceTarget = null;
  function loadFile(file) {
    if (!file) return; if (!/^image\//.test(file.type)) { toast('Please choose an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Image is over 5 MB — please use a smaller file'); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const id = uid(); const ar = (im.naturalWidth || 1) / (im.naturalHeight || 1);
        IMGS[id] = { src: fr.result, name: file.name || 'Image', ar };
        if (replaceTarget && L(replaceTarget)) { const l = L(replaceTarget); l.imgId = id; replaceTarget = null; commit(); renderAll(); toast('Image replaced'); return; }
        const a = anchorFor(view === 'back' ? 'back' : 'front');
        addLayer({ id: uid(), type: 'image', imgId: id, side: view, x: a[0], y: a[1], rot: 0, op: 1, flip: false, hidden: false, size: ar > 1 ? 130 : 100 });
        if (S.method === 'emb') toast('Embroidery simplifies photos to thread colours — logos work best');
      };
      im.onerror = () => toast('That image could not be read'); im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  $('#fileIn').addEventListener('change', e => { loadFile(e.target.files[0]); e.target.value = ''; });
  const dz = $('#dropZone');
  ['dragenter', 'dragover'].forEach(ev => { dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }); $('#stageWrap').addEventListener(ev, e => { if ([...(e.dataTransfer ? e.dataTransfer.types : [])].includes('Files')) { e.preventDefault(); dz.classList.add('over'); } }); });
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => { replaceTarget = null; loadFile(e.dataTransfer.files[0]); }); dz.addEventListener('click', () => $('#addImage').click());
  $('#stageWrap').addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); replaceTarget = null; loadFile(e.dataTransfer.files[0]); });
  $('#stageWrap').addEventListener('dragover', e => e.preventDefault());

  /* ----------------------------------------------------------------- price UI */
  function renderPrice() {
    const c = calc(), m = METHODS[S.method];
    $('#totalPrice').textContent = fmt(c.total);
    $('#perPc').textContent = `${fmt(c.perPc)} per piece · ${S.qty} pc${S.qty > 1 ? 's' : ''}`;
    $('#sum-qty').textContent = S.qty + (S.qty > 1 ? ' pcs' : ' pc');
    const row = (a, b, cls = '') => `<div class="br${cls ? ' ' + cls : ''}"><span>${a}</span><b>${b}</b></div>`;
    let h = row(`${G[S.garment].label} (${S.sset === 'kids' ? 'kids' : 'adult'}) × ${S.qty}`, fmt(c.base * S.qty));
    if (c.sizeFee) h += row(`Size ${S.size} surcharge × ${S.qty}`, fmt(c.sizeFee * S.qty));
    if (c.areas.length) c.areas.forEach(a => h += row(`${m.label.split(' ')[0]} · ${zoneLabel[a.z]} (${a.n} layer${a.n > 1 ? 's' : ''}) × ${S.qty}`, fmt(a.fee * S.qty)));
    else h += row('No design added yet', '—', 'dim');
    if (c.disc) h += row(`Bulk discount ${c.tier[2]}%`, '− ' + fmt(c.disc), 'red');
    if (c.setup) h += row('Screen setup fee (under 12 pcs)', fmt(c.setup));
    h += row('Delivery', c.total >= BRAND.freeShipOver ? 'Free' : fmt(BRAND.shipFee) + ' at checkout', 'dim');
    $('#brkBody').innerHTML = h;
    $('#tiers tbody').innerHTML = TIERS.map(t => `<tr class="${t === c.tier ? 'on' : ''}"><td>${t[0]}${t[1] >= 9999 ? '+' : t[1] === t[0] ? '' : '–' + t[1]} pcs</td><td>${t[2] ? t[2] + '% off' : '—'}</td></tr>`).join('');
    const next = TIERS.find(t => t[0] > S.qty);
    $('#qtyNote').textContent = next ? `Add ${next[0] - S.qty} more for ${next[2]}% off.` : 'Maximum bulk discount unlocked.';
    $('#qtyIn').value = S.qty;
  }

  /* ----------------------------------------------------------------- render all */
  function renderAll() {
    renderGarmentGrid(); renderColors(); renderSizes(); renderMethods();
    $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === view));
    renderGarment(); renderLayers(); renderLayerList(); renderEditor(); renderPrice(); syncUndo();
    $('#stageHint').textContent = S.layers.some(l => l.side === view && !l.hidden) ? 'Drag a layer to move · corners resize · top handle rotates' : `Nothing on the ${view} yet — add text, an image or a graphic`;
  }

  /* ----------------------------------------------------------------- export (PNG) */
  let fontCSS = null;
  async function b64(url) { const r = await fetch(url); const b = await r.blob(); return await new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }); }
  async function getFontCSS(used) {
    if (!fontCSS) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
      try {
        const css = await (await fetch(FONT_CSS_URL, { signal: ctl.signal })).text(); const out = [];
        const re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g; let m; const jobs = [];
        while ((m = re.exec(css))) { if (m[1] !== 'latin') continue; const body = m[2]; const u = /url\((https:[^)]+)\)/.exec(body); const fam = /font-family:\s*'([^']+)'/.exec(body); if (u && fam) jobs.push(b64(u[1]).then(d => out.push({ fam: fam[1], css: `@font-face{${body.replace(/src:[^;]+;/, `src:url(${d}) format('woff2');`)}}` }))); }
        await Promise.all(jobs); fontCSS = out;
      } catch (e) { fontCSS = []; } finally { clearTimeout(to); }
    }
    return fontCSS.filter(f => used.has(f.fam)).map(f => f.css).join('\n');
  }
  async function svgString(opts = {}) {
    const clone = stage.cloneNode(true);
    $('#selG', clone) && ($('#selG', clone).innerHTML = ''); const gd = $('#guides', clone); if (gd) gd.remove();
    const used = new Set(S.layers.filter(l => l.type === 'text' && !l.hidden).map(l => l.font));
    clone.setAttribute('xmlns', NS); clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink'); clone.setAttribute('viewBox', '0 0 400 460'); clone.setAttribute('width', opts.w); clone.setAttribute('height', opts.h);
    clone.removeAttribute('class'); clone.removeAttribute('style');
    const css = used.size && !opts.noFonts ? await getFontCSS(used) : '';
    const wm = opts.mark ? `<text x="14" y="448" font-family="'Space Grotesk',sans-serif" font-size="9" letter-spacing="2" fill="${bg === 'light' ? '#222' : '#fff'}" opacity=".55">${esc(BRAND.name.toUpperCase())} · DESIGN PREVIEW · ${esc(G[S.garment].label.toUpperCase())} · ${view.toUpperCase()}</text>` : '';
    const inner = clone.innerHTML;
    return `<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 460" width="${opts.w}" height="${opts.h}"><style>${css}</style>${inner}${wm}</svg>`;
  }
  async function renderCanvas(w, h, o = {}) {
    const str = await svgString({ w, h, mark: o.mark, noFonts: o.noFonts });
    const img = new Image(); img.decoding = 'sync';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str); });
    if (img.decode) { try { await img.decode(); } catch (e) {} }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, w, h); return cv;
  }
  $('#dlBtn').addEventListener('click', async () => {
    const b = $('#dlBtn'); b.disabled = true; const t = $('span', b).textContent; $('span', b).textContent = 'Rendering…';
    try {
      const cv = await renderCanvas(1200, 1380, { mark: true });
      const blob = await new Promise(r => cv.toBlob(r, 'image/png')); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${BRAND.slug}-${S.garment}-${view}-design.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Preview downloaded (' + view + ' view)');
    } catch (e) { toast('Could not render the preview — try again'); }
    b.disabled = false; $('span', b).textContent = t;
  });

  /* ----------------------------------------------------------------- cart + quote */
  function designLines() {
    const ls = S.layers.filter(l => !l.hidden).map(l => `${zoneLabel[zoneOf(l)]}: ${l.type === 'text' ? '“' + l.t.replace(/\n/g, ' ').slice(0, 30) + '” · ' + l.font : l.type === 'image' ? 'Image · ' + (IMGS[l.imgId] ? IMGS[l.imgId].name.slice(0, 24) : '') : 'Graphic · ' + LIB[l.key][0]}`);
    return ls;
  }
  const summaryText = () => { const c = calc(); return `${G[S.garment].label} (${S.sset}) · ${nameForColor(S.color)} · size ${S.size} · ${METHODS[S.method].label} · qty ${S.qty}\n` + designLines().map(x => '- ' + x).join('\n') + `\nTotal: ${fmt(c.total)} (${fmt(c.perPc)}/pc)`; };
  async function thumb() {
    const save = view; const bk = S.layers.some(l => l.side === 'back' && !l.hidden), fr = S.layers.some(l => l.side === 'front' && !l.hidden);
    try {
      const cv = await Promise.race([renderCanvas(240, 276, { noFonts: !fontCSS }), new Promise((_, r) => setTimeout(r, 3500))]);
      return cv.toDataURL('image/jpeg', .82);
    } catch (e) { return null; }
  }
  const fallbackThumb = () => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="${NS}" viewBox="0 0 240 276"><rect width="240" height="276" fill="#151517"/><g transform="translate(20 30) scale(.5)"><path d="${G[S.garment].path('front')}" fill="${S.color}"/></g></svg>`);
  $('#addCart').addEventListener('click', async () => {
    const b = $('#addCart');
    if (!S.layers.filter(l => !l.hidden).length && !confirm('Your design is blank. Add this plain garment to the cart anyway?')) return;
    b.disabled = true; const c = calc(); const img = (await thumb()) || fallbackThumb();
    const key = 'custom|' + uid(); const items = Store.items;
    items.push({ key, id: 0, custom: true, name: 'Custom ' + G[S.garment].label, price: c.perPc, color: nameForColor(S.color), colorKey: 'custom', size: S.size, qty: S.qty, img, note: `${METHODS[S.method].label} · ${c.areas.length} print area${c.areas.length === 1 ? '' : 's'} · ${c.nLayers} layer${c.nLayers === 1 ? '' : 's'}`, details: designLines() });
    try { Store.items = items; } catch (e) { toast('Could not save to cart'); }
    b.disabled = false; toast('Custom ' + G[S.garment].label.toLowerCase() + ' added to cart', { label: 'View cart', fn: openDrawer });
  });
  const qm = $('#quoteModal');
  $('#quoteBtn').addEventListener('click', () => {
    const c = calc(); $('#quoteSum').innerHTML = `<div><b>${G[S.garment].label} · ${nameForColor(S.color)} · ${S.size}</b><span>${METHODS[S.method].label} · ${S.qty} pc${S.qty > 1 ? 's' : ''}</span></div>${designLines().map(l => `<small>${esc(l)}</small>`).join('') || '<small>Blank garment</small>'}<div class="q-t"><span>Estimated total</span><b>${fmt(c.total)}</b></div>`;
    $('#qWa').href = `https://wa.me/${BRAND.whatsapp}?text=` + encodeURIComponent(`Hi ${BRAND.name}, I'd like a quote for a custom order:\n` + summaryText());
    qm.classList.add('on'); $('#overlay').classList.add('on'); document.body.classList.add('lock');
  });
  $('#quoteForm').addEventListener('submit', e => {
    e.preventDefault(); let bad = null; const chk = (id, ok) => { const el = $('#' + id); el.closest('.field').classList.toggle('err', !ok); if (!ok && !bad) bad = el; };
    chk('qName', $('#qName').value.trim().length > 1); chk('qPhone', /^[+\d][\d\s-]{8,}$/.test($('#qPhone').value.trim())); chk('qEmail', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('#qEmail').value.trim()));
    if (bad) { bad.focus(); return; }
    closeAll(); e.target.reset(); toast('Quote request sent — we’ll reply within a few hours');
  });
  $$('#quoteForm input').forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('err')));

  /* ----------------------------------------------------------------- init */
  buildStage(); renderLib();
  S.layers.push(Object.assign(newText(), { t: 'YOUR\nTEXT', size: 46, ls: 1 }));
  sel = null; renderAll(); hist = []; hi = -1; commit(); applyZoom();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { renderLayers(); });
  window.__studio = { get S() { return S; }, IMGS, calc, get view() { return view; } }; // handy for tests / debugging
  initApp('Design studio');
})();
