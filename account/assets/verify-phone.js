(function initPhoneVerification() {
  'use strict';
  const t = window.VVAccountI18n ? window.VVAccountI18n.t : (k) => k;
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
    resend.textContent = remaining > 0 ? t('auth.verifyphone.resendTimer', { n: remaining }) : t('auth.verifyphone.resend');
    if (remaining > 0) { remaining -= 1; timer = window.setTimeout(tick, 1000); }
  }
  input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 6); });
  input.addEventListener('paste', (event) => {
    const value = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    if (value) { event.preventDefault(); input.value = value; }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(input.value)) return message(t('auth.verifyphone.errCode'), false);
    verify.disabled = true; verify.textContent = t('auth.verifyphone.verifying'); message('', false);
    try {
      const response = await fetch('/account/api/phone/register-verify.php', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, code: input.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('auth.verifyphone.errInvalid'));
      message(t('auth.verifyphone.okVerified'), true); window.location.assign(data.redirect);
    } catch (error) {
      message(error.message || t('auth.verifyphone.errFailed'), false); verify.disabled = false; verify.textContent = t('auth.verifyphone.submit');
    }
  });
  resend.addEventListener('click', async () => {
    resend.disabled = true; message('', false);
    try {
      const response = await fetch('/account/api/phone/register-resend.php', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challenge }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('auth.verifyphone.errResend'));
      message(t('auth.verifyphone.okResent'), true); remaining = 60; window.clearTimeout(timer); tick();
    } catch (error) {
      message(error.message || t('auth.verifyphone.errResend'), false); resend.disabled = false;
    }
  });
  tick(); input.focus();
})();
