(function () {
  $('#contactHead').innerHTML = pageHead('HELLO', [['Home', 'index.html'], ['Contact']], 'Get in<br>touch', 'Orders, custom prints, wholesale — we usually reply within a few hours.');
  const topic = new URLSearchParams(location.search).get('topic'); if (topic && [...$('#cTopic').options].some(o => o.value === topic)) $('#cTopic').value = topic;
  const em = $('[data-contact="email"]'); em.textContent = BRAND.email; em.href = 'mailto:' + BRAND.email;
  const ph = $('[data-contact="phone"]'); ph.textContent = BRAND.phone; ph.href = 'https://wa.me/' + BRAND.whatsapp; ph.target = '_blank'; ph.rel = 'noopener';
  const FAQ = [
    ['How long does delivery take?', `Orders arrive in 2–4 working days across Pakistan. Delivery is free over ${fmt(BRAND.freeShipOver)}, otherwise a flat ${fmt(BRAND.shipFee)}.`],
    ['Can I pay cash on delivery?', 'Yes. COD is available nationwide. You can also pay by card, JazzCash or Easypaisa.'],
    ['What is your return policy?', 'Unworn, unwashed items with tags can be returned or exchanged within 7 days of delivery. Custom-printed pieces are final sale unless faulty.'],
    ['How do I pick my size?', 'Open the size guide on any product page. Oversized pieces are cut roomy — take your normal size for the relaxed fit, or size down for a closer one. Between sizes? Go up.'],
    ['Do you do custom prints?', 'Yes — one piece or one hundred. Choose the “Custom print” topic above, send your artwork and we’ll reply with a free mock-up. Production takes 5–7 days.'],
    ['Do you offer wholesale?', 'We do for orders of 24+ pieces. Choose “Wholesale” in the form above and tell us what you’re after.']
  ];
  $('#faqList').innerHTML = FAQ.map(([q, a]) => `<div class="acc" data-reveal><button>${q}<i></i></button><div class="acc-b"><div>${a}</div></div></div>`).join('');
  initAcc();
  const f = $('#contactForm');
  f.addEventListener('submit', e => {
    e.preventDefault(); let bad = null;
    const chk = (id, ok) => { const el = $('#' + id); el.closest('.field').classList.toggle('err', !ok); if (!ok && !bad) bad = el; };
    chk('cName', $('#cName').value.trim().length > 1); chk('cEmail', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('#cEmail').value.trim())); chk('cMsg', $('#cMsg').value.trim().length >= 10);
    if (bad) { bad.focus(); toast('Please fix the highlighted fields'); return; }
    f.reset(); toast('Message sent — we’ll be in touch soon');
  });
  $$('.field input,.field textarea', f).forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('err')));
  initApp('Contact');
  if (location.hash === '#faq') setTimeout(() => $('#faq').scrollIntoView(), 200);
})();
