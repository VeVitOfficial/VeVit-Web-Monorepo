(function initPhoneVerification() {
  'use strict';
  const form = document.getElementById('verifyForm');
  const challenge = form.dataset.challenge;
  const input = document.getElementById('verificationCode');
  const verify = document.getElementById('verifyButton');
  const resend = document.getElementById('resendButton');
  const status = document.getElementById('status');
  let remaining = Number.parseInt(form.dataset.resendDelay, 10) || 0;
  let timer = 0;

  function message(text, ok) { status.textContent = text; status.className = 'status ' + (ok ? 'ok' : 'error'); }
  function tick() {
    resend.disabled = remaining > 0;
    resend.textContent = remaining > 0 ? `Poslat kód znovu (${remaining} s)` : 'Poslat kód znovu';
    if (remaining > 0) { remaining -= 1; timer = window.setTimeout(tick, 1000); }
  }
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); });
  input.addEventListener('paste', (event) => {
    const value = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    if (value) { event.preventDefault(); input.value = value; }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(input.value)) return message('Zadejte šestimístný kód.', false);
    verify.disabled = true; verify.textContent = 'Ověřuji…'; message('', false);
    try {
      const response = await fetch('/account/api/phone/register-verify.php', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, code: input.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kód je neplatný.');
      message('Telefonní číslo bylo ověřeno.', true); window.location.assign(data.redirect);
    } catch (error) {
      message(error.message || 'Ověření se nepodařilo.', false); verify.disabled = false; verify.textContent = 'Ověřit a vytvořit účet';
    }
  });
  resend.addEventListener('click', async () => {
    resend.disabled = true; message('', false);
    try {
      const response = await fetch('/account/api/phone/register-resend.php', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kód se nepodařilo odeslat.');
      message('Nový kód byl odeslán.', true); remaining = 60; window.clearTimeout(timer); tick();
    } catch (error) {
      message(error.message || 'Kód se nepodařilo odeslat.', false); resend.disabled = false;
    }
  });
  tick(); input.focus();
})();
