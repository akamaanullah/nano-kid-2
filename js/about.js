(function () {
  $('#aboutHead').innerHTML = pageHead('STORY', [['Home', 'index.html'], ['About']], 'Our story', 'Heavyweight streetwear, designed in Lahore, worn across Pakistan.');
  $('#aboutImgA').src = U(IMG.aboutA, 900, 1150, 75);
  $('#aboutImgB').src = U(IMG.aboutB, 900, 1150, 75);
  initApp('About');
})();
