(function () {
  'use strict';

  var form = document.getElementById('registerForm');
  var btn = document.getElementById('btnRegister');
  var authErr = document.getElementById('authErr');
  var authErrMsg = document.getElementById('authErrMsg');
  var nickInfo = document.getElementById('nickInfo');
  var success = document.getElementById('registerSuccess');
  var inputs = {
    name: document.getElementById('inpName'),
    nickname: document.getElementById('inpNick'),
    email: document.getElementById('inpEmail'),
    password: document.getElementById('inpPass'),
    passwordConfirm: document.getElementById('inpPassConfirm')
  };
  var fields = {
    name: document.getElementById('fieldName'),
    nickname: document.getElementById('fieldNick'),
    email: document.getElementById('fieldEmail'),
    password: document.getElementById('fieldPass'),
    passwordConfirm: document.getElementById('fieldPassConfirm')
  };
  var errors = {
    name: document.getElementById('errName'),
    nickname: document.getElementById('errNick'),
    email: document.getElementById('errEmail'),
    password: document.getElementById('errPass'),
    passwordConfirm: document.getElementById('errPassConfirm')
  };
  var state = { name: false, nickname: false, email: false, password: false, passwordConfirm: false, nicknameValue: '', submitting: false };
  var touched = {};
  var nicknameTimer = 0;
  var nicknameRequest = 0;
  var oauthButtons = Array.prototype.slice.call(document.querySelectorAll('[data-oauth-url]'));
  var oauthStatus = document.getElementById('oauthStatus');
  var identityModeToggle = document.getElementById('identityModeToggle');
  var identityLabel = document.getElementById('identityLabel');
  var identityHint = document.getElementById('identityHint');
  var identityMode = 'email';

  oauthButtons.forEach(function (button) { button.addEventListener('click', function () { if (button.disabled) return; oauthButtons.forEach(function (item) { item.disabled = true; }); button.querySelector('span').textContent = 'Přesměrování…'; oauthStatus.textContent = 'Přesměrování k externí službě…'; window.location.assign(button.dataset.oauthUrl); }); });

  function showError(message) { authErrMsg.textContent = message; authErr.removeAttribute('hidden'); }
  function hideError() { authErr.setAttribute('hidden', ''); }
  function setButtonState() {
    var valid = state.name && state.nickname && state.email && state.password && state.passwordConfirm && !state.submitting;
    btn.disabled = !valid;
    btn.setAttribute('aria-disabled', String(!valid));
  }
  function setFieldState(key, valid, message) {
    var field = fields[key];
    var input = inputs[key];
    var shouldShowError = touched[key] && !valid && message;
    field.classList.toggle('is-valid', Boolean(valid));
    field.classList.toggle('is-invalid', Boolean(shouldShowError));
    field.classList.remove('is-pending');
    input.setAttribute('aria-invalid', String(Boolean(shouldShowError)));
    errors[key].textContent = shouldShowError ? message : '';
    state[key] = Boolean(valid);
    setButtonState();
    return Boolean(valid);
  }
  function passwordRules(value) {
    return { length: value.length >= 8 && value.length <= 72, upper: /[A-Z]/.test(value), lower: /[a-z]/.test(value), number: /\d/.test(value), special: /[^A-Za-z0-9]/.test(value) };
  }
  function updatePasswordRules(value) {
    var rules = passwordRules(value);
    Object.keys(rules).forEach(function (rule) {
      document.querySelector('[data-rule="' + rule + '"]').classList.toggle('is-met', rules[rule]);
    });
    return rules;
  }
  function validateName() {
    var value = inputs.name.value.trim();
    return setFieldState('name', value.length >= 2, value ? 'Zadejte alespoň 2 znaky.' : 'Zadejte své jméno.');
  }
  function validateEmail() {
    var value = inputs.email.value.trim();
    if (identityMode === 'phone') {
      return setFieldState('email', normalizeCzechPhone(value) !== null, 'Neplatné telefonní číslo.');
    }
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return setFieldState('email', valid, value ? 'Zadejte e-mail ve správném formátu.' : 'Zadejte svůj e-mail.');
  }
  function normalizeCzechPhone(value) {
    var normalized = value.trim().replace(/[\s().-]/g, '');
    if (/^00420\d{9}$/.test(normalized)) normalized = '+420' + normalized.slice(5);
    if (/^\d{9}$/.test(normalized)) normalized = '+420' + normalized;
    return /^\+420\d{9}$/.test(normalized) ? normalized : null;
  }
  function normalizeNicknameInput(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  identityModeToggle.addEventListener('click', function () {
    identityMode = identityMode === 'email' ? 'phone' : 'email';
    var phoneMode = identityMode === 'phone';
    identityLabel.textContent = phoneMode ? 'Telefonní číslo' : 'E-mail';
    identityModeToggle.textContent = phoneMode ? 'Použít e-mail' : 'Použít telefonní číslo';
    inputs.email.type = phoneMode ? 'tel' : 'email';
    inputs.email.name = phoneMode ? 'phone' : 'email';
    inputs.email.autocomplete = phoneMode ? 'tel' : 'email';
    inputs.email.inputMode = phoneMode ? 'tel' : 'email';
    inputs.email.placeholder = phoneMode ? '111 222 333' : 'jan@email.cz';
    identityHint.hidden = !phoneMode;
    identityHint.textContent = phoneMode ? 'Můžete zadat 111 222 333 nebo +420 111 222 333.' : '';
    inputs.email.value = '';
    touched.email = false;
    fields.email.classList.remove('is-valid', 'is-invalid', 'is-pending');
    errors.email.textContent = '';
    state.email = false;
    setButtonState();
    inputs.email.focus();
  });
  function validatePassword() {
    var value = inputs.password.value;
    var rules = updatePasswordRules(value);
    var valid = rules.length && rules.upper && rules.lower && rules.number && rules.special;
    var message = value.length > 72 ? 'Heslo je příliš dlouhé.' : 'Heslo nesplňuje všechny uvedené podmínky.';
    setFieldState('password', valid, message);
    if (touched.passwordConfirm || inputs.passwordConfirm.value) validatePasswordConfirm();
    return valid;
  }
  function validatePasswordConfirm() {
    var value = inputs.passwordConfirm.value;
    return setFieldState('passwordConfirm', value !== '' && value === inputs.password.value, value ? 'Hesla se neshodují.' : 'Potvrďte prosím své heslo.');
  }
  function validateNickname() {
    var value = normalizeNicknameInput(inputs.nickname.value);
    window.clearTimeout(nicknameTimer);
    nicknameRequest += 1;
    state.nicknameValue = '';
    if (!value) return setFieldState('nickname', false, 'Zadejte přezdívku.');
    if (Array.from(value).length < 2 || Array.from(value).length > 30) return setFieldState('nickname', false, 'Přezdívka musí mít 2–30 znaků.');
    if (!/^[\p{L}\p{M}\p{N} ._'’-]+$/u.test(value)) return setFieldState('nickname', false, 'Přezdívka obsahuje nepovolené znaky.');

    fields.nickname.classList.remove('is-valid', 'is-invalid');
    fields.nickname.classList.add('is-pending');
    inputs.nickname.setAttribute('aria-invalid', 'false');
    errors.nickname.textContent = '';
    state.nickname = false;
    nickInfo.textContent = 'Kontroluji dostupnost…';
    nickInfo.classList.add('is-checking');
    setButtonState();
    var requestId = nicknameRequest;
    nicknameTimer = window.setTimeout(function () {
      fetch('./api/nickname-availability.php?nickname=' + encodeURIComponent(value), { credentials: 'same-origin' })
        .then(function (response) { return response.json().then(function (data) { return { ok: response.ok, data: data }; }); })
        .then(function (result) {
          if (requestId !== nicknameRequest) return;
          nickInfo.classList.remove('is-checking');
          if (!result.ok || typeof result.data.available !== 'boolean') {
            nickInfo.textContent = 'Dostupnost se nepodařilo ověřit.';
            setFieldState('nickname', false, 'Přezdívku se nepodařilo ověřit.');
            return;
          }
          if (!result.data.available) {
            nickInfo.textContent = 'Zkuste jinou přezdívku.';
            setFieldState('nickname', false, 'Tato přezdívka je již obsazená.');
            return;
          }
          nickInfo.textContent = 'Přezdívka je k dispozici.';
          state.nicknameValue = value;
          setFieldState('nickname', true, '');
        })
        .catch(function () {
          if (requestId !== nicknameRequest) return;
          nickInfo.classList.remove('is-checking');
          nickInfo.textContent = 'Dostupnost se nepodařilo ověřit.';
          setFieldState('nickname', false, 'Přezdívku se nepodařilo ověřit.');
        });
    }, 350);
    return false;
  }
  function markAllTouched() { Object.keys(inputs).forEach(function (key) { touched[key] = true; }); }
  function validateAll() {
    validateName(); validateEmail(); validatePassword(); validatePasswordConfirm();
    if (!state.nickname || state.nicknameValue !== normalizeNicknameInput(inputs.nickname.value)) validateNickname();
    return state.name && state.nickname && state.email && state.password && state.passwordConfirm && state.nicknameValue === normalizeNicknameInput(inputs.nickname.value);
  }
  function setSubmitting(submitting) {
    state.submitting = submitting;
    form.querySelectorAll('input, button').forEach(function (element) { element.disabled = submitting; });
    btn.setAttribute('aria-busy', String(submitting));
    btn.querySelector('.button-label').textContent = submitting ? 'Vytvářím účet…' : 'Vytvořit účet';
    setButtonState();
  }

  Object.keys(inputs).forEach(function (key) {
    inputs[key].addEventListener('input', function () {
      touched[key] = true;
      hideError();
      if (key === 'name') validateName();
      if (key === 'email') validateEmail();
      if (key === 'nickname') validateNickname();
      if (key === 'password') validatePassword();
      if (key === 'passwordConfirm') validatePasswordConfirm();
    });
    inputs[key].addEventListener('blur', function () {
      touched[key] = true;
      if (key === 'name') validateName();
      if (key === 'email') validateEmail();
      if (key === 'nickname' && !state.nickname) validateNickname();
      if (key === 'password') validatePassword();
      if (key === 'passwordConfirm') validatePasswordConfirm();
    });
  });

  document.querySelectorAll('[data-password-toggle]').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var input = document.getElementById(toggle.getAttribute('data-password-toggle'));
      var visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      toggle.setAttribute('aria-pressed', String(!visible));
      toggle.setAttribute('aria-label', visible ? 'Zobrazit heslo' : 'Skrýt heslo');
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (state.submitting) return;
    markAllTouched();
    if (!validateAll()) {
      showError('Zkontrolujte prosím označená pole.');
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    hideError();
    setSubmitting(true);
    var phone = identityMode === 'phone' ? normalizeCzechPhone(inputs.email.value) : null;
    var endpoint = identityMode === 'phone' ? './api/phone/register-start.php' : './api/register.php';
    var payload = { nickname: normalizeNicknameInput(inputs.nickname.value), full_name: inputs.name.value.trim(), password: inputs.password.value, password_confirmation: inputs.passwordConfirm.value };
    if (identityMode === 'phone') payload.phone = phone;
    else payload.email = inputs.email.value.trim();
    fetch(endpoint, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) { return response.json().catch(function () { return {}; }).then(function (data) { return { ok: response.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) {
          setSubmitting(false);
          showError(result.data.error || 'Registrace selhala. Zkuste to znovu.');
          return;
        }
        if (identityMode === 'phone') {
          window.location.assign(result.data.redirect);
          return;
        }
        form.hidden = true; success.removeAttribute('hidden');
        window.setTimeout(function () { window.location.replace('./'); }, 1200);
      })
      .catch(function () {
        setSubmitting(false);
        showError('Síťová chyba. Zkuste to znovu.');
      });
  });
  if (new URLSearchParams(window.location.search).get('mode') === 'phone') identityModeToggle.click();
}());
