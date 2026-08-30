(function () {
  'use strict';

  // Cloudflare Turnstile — načítá se jen když server vrátí siteKey
  // (TURNSTILE_SITE_KEY na Vercelu). Bez klíče se nic nenačítá a token
  // zůstává prázdný; backend pak ověření přeskočí.
  var container = document.getElementById('cfCaptcha');
  if (!container) return;

  fetch('./api/captcha-config.php', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? r.json() : { siteKey: null }; })
    .catch(function () { return { siteKey: null }; })
    .then(function (data) {
      if (!data || !data.siteKey) return;
      var script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = function () {
        try { window.turnstile.render(container, { sitekey: data.siteKey, theme: 'dark' }); } catch (e) { /* noop */ }
      };
      document.head.appendChild(script);
    });

  window.VVCaptcha = {
    // Token z widgetu; prázdný řetězec když CAPTCHA není aktivní nebo se
    // ještě nezobrazila (backend pak fail-closed zamítne).
    token: function () {
      try { return window.turnstile ? (window.turnstile.getResponse() || '') : ''; } catch (e) { return ''; }
    },
    // Turnstile tokeny jsou jednorázové — po neúspěšném pokusu treba resetovat.
    reset: function () {
      try { if (window.turnstile && window.turnstile.getResponse()) window.turnstile.reset(); } catch (e) { /* noop */ }
    }
  };
}());