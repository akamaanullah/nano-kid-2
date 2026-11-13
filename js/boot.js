/* boot.js — runs first thing in <body>: builds the preloader / page curtain so nothing flashes. */
(function () {
  var de = document.documentElement;
  var isHome = /(^|\/)(index\.html)?$/.test(location.pathname);
  var seen = false;
  try { seen = sessionStorage.getItem('pre-seen'); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var showPre = isHome && !seen && !reduce;
  var parts = (typeof BRAND !== 'undefined' ? BRAND.name : 'BRAND').split('');
  if (showPre) {
    var h = '<div class="preloader" id="preloader"><div class="preloader-inner"><div class="pre-logo" aria-label="' + BRAND.name + '">';
    parts.forEach(function (c, i) { h += '<span class="' + (c === '/' ? 'sl' : '') + '" style="--i:' + i + '">' + c + '</span>'; });
    h += '</div><div class="pre-bar"><i></i></div><div class="pre-count" id="preCount">000</div></div></div>';
    document.body.insertAdjacentHTML('afterbegin', h);
    document.body.classList.add('lock');
  } else {
    de.classList.add('no-pre');
    if (!reduce) document.body.classList.add('entering');
  }
  de.classList.add('js');
  // safety net: never leave the page covered
  setTimeout(function () {
    var p = document.getElementById('preloader'); if (p) p.classList.add('done');
    document.body.classList.remove('lock', 'entering'); de.classList.add('ready');
  }, 5000);
})();
