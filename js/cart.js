/* cart.js — cart page, checkout form, order confirmation (client-side demo; no payment is taken) */
(function () {
  const root = $('#cartRoot');
  let view = location.hash === '#checkout' ? 'checkout' : 'cart';
  let promo = null; const PROMOS = { NOIR10: .1, WELCOME500: 500 };
  let pay = 'cod';
  const disc = sub => !promo ? 0 : PROMOS[promo] < 1 ? Math.round(sub * PROMOS[promo]) : Math.min(PROMOS[promo], sub);
  const totals = () => { const sub = Store.subtotal(), d = disc(sub), after = sub - d, ship = after === 0 || after >= BRAND.freeShipOver ? 0 : BRAND.shipFee; return { sub, d, ship, total: after + ship }; };

  function head(step) {
    const t = view === 'success' ? 'Order placed' : view === 'checkout' ? 'Checkout' : 'Your cart';
    $('#cartHead').innerHTML = pageHead('CART', [['Home', 'index.html'], [view === 'cart' ? 'Cart' : 'Cart', view === 'cart' ? null : 'cart.html'], ...(view === 'cart' ? [] : [[view === 'success' ? 'Done' : 'Checkout']])], t, '');
    splitText($('#cartHead h1')); initReveal($('#cartHead')); document.title = t + ' — ' + BRAND.name;
  }
  const stepsBar = () => `<div class="steps-bar" aria-label="Progress"><div class="${view === 'cart' ? 'on' : 'done'}"><i>01</i>Cart</div><div class="${view === 'checkout' ? 'on' : view === 'success' ? 'done' : ''}"><i>02</i>Details</div><div class="${view === 'success' ? 'on' : ''}"><i>03</i>Confirmed</div></div>`;

  function summary(withBtn) {
    const t = totals(), n = Store.count(), left = BRAND.freeShipOver - (t.sub - t.d);
    return `<aside class="sum"><h3>Summary</h3>
      <div class="sum-r"><span>Items (${n})</span><b>${fmt(t.sub)}</b></div>
      ${t.d ? `<div class="sum-r"><span>Discount (${promo})</span><b style="color:var(--accent)">− ${fmt(t.d)}</b></div>` : ''}
      <div class="sum-r"><span>Delivery</span><b>${t.ship ? fmt(t.ship) : 'Free'}</b></div>
      ${left > 0 && n ? `<p class="muted" style="font-size:12px;margin:6px 0 0">Add ${fmt(left)} more for free delivery.</p>` : ''}
      <form class="promo" id="promoForm"><input id="promoIn" placeholder="Promo code" aria-label="Promo code" value="${promo || ''}"><button type="submit">Apply</button></form>
      <div class="sum-r tot"><span>Total</span><b>${fmt(t.total)}</b></div>
      ${withBtn || ''}</aside>`;
  }
  function bindPromo() {
    const f = $('#promoForm'); if (!f) return;
    f.onsubmit = e => { e.preventDefault(); const c = $('#promoIn').value.trim().toUpperCase(); if (!c) { promo = null; render(); return; } if (PROMOS[c]) { promo = c; toast(`Code ${c} applied`); } else { promo = null; toast('That code isn’t valid. Try NOIR10'); } render(); };
  }

  function cartView() {
    const items = Store.items;
    if (!items.length) return `${stepsBar()}<div class="empty" style="margin-bottom:100px"><div class="display">Your cart is empty</div><p>Nothing here yet. Go grab something loud.</p><a class="btn btn-solid" href="shop.html" data-magnetic>Shop all</a></div>`;
    return `${stepsBar()}<div class="cart-grid"><div><div id="clList">${items.map((it, i) => `<div class="cl-row" style="--i:${i}"><a href="${it.custom ? 'customize.html' : 'product.html?id=' + it.id}"><img src="${U(it.img, 240, 300)}" alt="${it.name}"></a>
      <div><h4><a href="${it.custom ? 'customize.html' : 'product.html?id=' + it.id}">${it.name}</a></h4><p>${it.color} · Size ${it.size}</p>${it.note ? `<p style="margin-top:4px">${it.note}</p>` : ''}${(it.details || []).map(d => `<p style="font-size:12px;color:var(--dim);margin-top:2px">${d}</p>`).join('')}<p style="margin-top:6px">${fmt(it.price)} each</p>
      <div class="qty"><button data-q="${it.key}" data-d="-1" aria-label="Decrease quantity">−</button><span>${it.qty}</span><button data-q="${it.key}" data-d="1" aria-label="Increase quantity">+</button></div></div>
      <div><div class="pr">${fmt(it.price * it.qty)}</div><button class="rm" data-rm="${it.key}">Remove</button></div></div>`).join('')}</div>
      <a class="link-arrow" href="shop.html" style="margin-top:30px">Continue shopping ${IC.arrow}</a></div>
      ${summary(`<button class="btn btn-red btn-block" id="toCo" data-magnetic>Proceed to checkout ${IC.arrow}</button><p class="muted" style="font-size:12px;text-align:center;margin-top:14px">Cash on delivery available across Pakistan</p>`)}</div>`;
  }
  const field = (id, label, type = 'text', extra = '', em = 'This field is required.') => `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" ${extra}><div class="em">${em}</div></div>`;
  function checkoutView() {
    if (!Store.items.length) return cartView();
    return `${stepsBar()}<div class="cart-grid"><form id="coForm" novalidate>
      <h3 class="co-h">Contact</h3>
      <div class="row2">${field('coName', 'Full name', 'text', 'autocomplete="name" required', 'Please enter your name.')}${field('coPhone', 'Phone', 'tel', 'autocomplete="tel" placeholder="03XX XXXXXXX" required', 'Enter a valid Pakistani mobile number.')}</div>
      ${field('coEmail', 'Email (optional)', 'email', 'autocomplete="email"', 'Enter a valid email.')}
      <h3 class="co-h" style="margin-top:30px">Delivery address</h3>
      ${field('coAddr', 'Street address', 'text', 'autocomplete="street-address" required', 'Please enter your address.')}
      <div class="row2">${field('coCity', 'City', 'text', 'autocomplete="address-level2" required', 'Please enter your city.')}<div class="field"><label for="coProv">Province</label><select id="coProv"><option>Punjab</option><option>Sindh</option><option>Khyber Pakhtunkhwa</option><option>Balochistan</option><option>Islamabad Capital Territory</option><option>Azad Kashmir</option><option>Gilgit-Baltistan</option></select></div></div>
      <h3 class="co-h" style="margin-top:30px">Payment</h3>
      <div class="pay-o" role="radiogroup" aria-label="Payment method">
        ${[['cod', 'Cash on delivery', 'Pay when it arrives'], ['card', 'Debit / credit card', 'Visa · Mastercard'], ['jazz', 'JazzCash', 'Mobile wallet'], ['easy', 'Easypaisa', 'Mobile wallet']].map(([v, l, s]) => `<label><input type="radio" name="pay" value="${v}" ${v === pay ? 'checked' : ''}><b>${l}</b><span>${s}</span></label>`).join('')}</div>
      <p class="muted" style="font-size:12px;margin:-8px 0 22px">Demo store — no payment is taken and no order is sent.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-red" type="submit" data-magnetic>Place order · ${fmt(totals().total)}</button><button class="btn btn-line" type="button" id="backCart">Back to cart</button></div>
    </form>${summary()}</div>`;
  }
  function successView(o) {
    return `${stepsBar()}<div class="success"><div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <span class="eyebrow">Thank you, ${o.name.split(' ')[0]}</span><h2 class="display h-lg" style="margin:16px 0 0">Order confirmed</h2>
      <p>We’ve received your order and will message you on ${o.phone} when it ships. Delivery takes 2–4 working days.</p>
      <span class="oid">${o.id}</span><div style="margin-top:34px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-solid" href="shop.html" data-magnetic>Keep shopping</a><a class="btn btn-line" href="index.html">Back home</a></div></div>`;
  }

  function render() {
    root.innerHTML = view === 'checkout' ? checkoutView() : view === 'success' ? successView(window.__order) : cartView();
    head(); bindPromo();
    $('#toCo') && ($('#toCo').onclick = () => { view = 'checkout'; history.replaceState(null, '', '#checkout'); render(); scrollTo({ top: 0 }); });
    $('#backCart') && ($('#backCart').onclick = () => { view = 'cart'; history.replaceState(null, '', location.pathname); render(); scrollTo({ top: 0 }); });
    $('#clList') && $('#clList').addEventListener('click', e => {
      const qb = e.target.closest('[data-q]'), r = e.target.closest('[data-rm]');
      if (qb) { const it = Store.items.find(i => i.key === qb.dataset.q); Store.setQty(it.key, Math.min(10, it.qty + +qb.dataset.d)); }
      if (r) Store.remove(r.dataset.rm);
    });
    const f = $('#coForm'); if (f) {
      f.addEventListener('change', e => { if (e.target.name === 'pay') pay = e.target.value; });
      f.addEventListener('submit', e => {
        e.preventDefault(); let bad = null;
        const chk = (id, ok) => { const el = $('#' + id), fl = el.closest('.field'); fl.classList.toggle('err', !ok); if (!ok && !bad) bad = el; return ok; };
        chk('coName', $('#coName').value.trim().length > 1);
        chk('coPhone', /^(\+?92|0)?3\d{9}$/.test($('#coPhone').value.replace(/[\s-]/g, '')));
        const em = $('#coEmail').value.trim(); chk('coEmail', !em || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em));
        chk('coAddr', $('#coAddr').value.trim().length > 5); chk('coCity', $('#coCity').value.trim().length > 1);
        if (bad) { bad.focus(); toast('Please fix the highlighted fields'); return; }
        window.__order = { id: 'NT-' + Date.now().toString(36).toUpperCase().slice(-6), name: $('#coName').value.trim(), phone: $('#coPhone').value.trim() };
        Store.clear(); view = 'success'; history.replaceState(null, '', location.pathname); render(); scrollTo({ top: 0 });
      });
      $$('.field input', f).forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('err')));
    }
    initReveal(root); initMagnetic(root);
  }
  /* re-render when cart changes from the drawer / qty buttons (but not on the success screen) */
  document.addEventListener('cart:change', () => { if (view !== 'success') { const y = scrollY; const a = document.activeElement; if (view === 'checkout' && a && a.closest && a.closest('#coForm')) return; render(); scrollTo({ top: y }); } });
  window.addEventListener('hashchange', () => { const v = location.hash === '#checkout' ? 'checkout' : 'cart'; if (view !== 'success' && v !== view) { view = v; render(); } });
  initApp('Cart');
  render();
})();
