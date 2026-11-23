// Sdílené chování napříč stránkami: rozbalovací menu kategorií v headeru.
(function () {
  var toggle = document.getElementById('cat-toggle');
  var menu = document.getElementById('cat-menu');
  if (!toggle || !menu) return;

  function open() { menu.classList.remove('hidden'); toggle.setAttribute('aria-expanded', 'true'); }
  function close() { menu.classList.add('hidden'); toggle.setAttribute('aria-expanded', 'false'); }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.classList.contains('hidden')) open(); else close();
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== toggle) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // Zavřít menu po kliku na odkaz (na hubu proběhne nativní kotvové scrollování).
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });
})();