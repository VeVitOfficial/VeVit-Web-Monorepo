(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const show = (element) => element && element.removeAttribute('hidden');
const hide = (element) => element && element.setAttribute('hidden', '');

const ROUTES = {
  overview: {
    path: '/account',
    title: 'Přehled',
    description: 'Rychlý pohled na profil, zabezpečení a předplatné.',
  },
  profile: {
    path: '/account/profile',
    title: 'Profil',
    description: 'Spravujte osobní údaje a podobu svého profilu.',
  },
  security: {
    path: '/account/security',
    title: 'Zabezpečení',
    description: 'Heslo, dvoufázové ověření a aktivní relace.',
  },
  billing: {
    path: '/account/billing',
    title: 'Předplatné a fakturace',
    description: 'Tarif, platby, fakturační údaje a historie faktur.',
  },
  connections: {
    path: '/account/connections',
    title: 'Propojené účty',
    description: 'Spravujte způsoby, kterými se přihlašujete.',
  },
  notifications: {
    path: '/account/notifications',
    title: 'Oznámení',
    description: 'Vyberte, které provozní a produktové zprávy chcete dostávat.',
  },
  preferences: {
    path: '/account/preferences',
    title: 'Jazyk a region',
    description: 'Nastavte jazyk, časové pásmo a místní formáty.',
  },
  privacy: {
    path: '/account/privacy',
    title: 'Soukromí a data',
    description: 'Export dat, souhlasy a bezpečné smazání účtu.',
  },
};

const sectionCache = new Map();
let currentUser = null;
let currentRoute = 'overview';
let profileOriginal = null;
let profileDraft = null;
let profileErrors = {};
let nicknameAvailable = true;
let nicknamePending = false;
let nicknameTimer = null;
let nicknameController = null;
let pendingNavigation = null;
let dirtyDialogTrigger = null;
let toastTimer = null;
let userMenuOpen = false;

async function api(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  const relayAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', relayAbort, { once: true });
  }

  const options = {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  try {
    const response = await fetch('/account/api/' + path, options);
    if (response.status === 401) {
      location.replace('/account/login');
      throw new Error('unauthorized');
    }
    const payload = response.status === 204
      ? null
      : await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error || 'Požadavek se nepodařilo dokončit.');
      error.field = payload?.field || '';
      error.status = response.status;
      throw error;
    }
    return payload;
  } finally {
    window.clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', relayAbort);
  }
}

function routeFromPath(pathname) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const found = Object.entries(ROUTES).find(([, route]) => route.path === normalized);
  return found ? found[0] : 'overview';
}

function initialsFor(user) {
  const source = (user?.full_name || user?.nickname || user?.email || '').trim();
  if (!source) return 'VV';
  const words = source.split(/\s+/).filter(Boolean);
  const initials = words.length > 1
    ? words[0][0] + words[words.length - 1][0]
    : words[0].slice(0, 2);
  return initials.toLocaleUpperCase('cs-CZ');
}

function setAvatar(image, fallback, user) {
  const avatarUrl = typeof user?.avatar_url === 'string' ? user.avatar_url.trim() : '';
  fallback.textContent = initialsFor(user);
  if (avatarUrl) {
    image.src = avatarUrl.startsWith('storage:') ? '/account/api/avatar.php?v=' + encodeURIComponent(avatarUrl) : avatarUrl;
    image.hidden = false;
    fallback.hidden = true;
  } else {
    image.removeAttribute('src');
    image.hidden = true;
    fallback.hidden = false;
  }
}

function hydrateIdentity(user) {
  const name = user.full_name || user.nickname || 'Uživatel VEVIT';
  const email = user.email || '';
  $('hdrName').textContent = name;
  $('hdrEmail').textContent = email;
  $('menuName').textContent = name;
  $('menuEmail').textContent = email;
  setAvatar($('hdrAvatar'), $('hdrInitials'), user);
  setAvatar($('profAvatar'), $('profInitials'), user);
  const removeButton = $('avatarRemoveBtn');
  if (removeButton) removeButton.disabled = !(typeof user.avatar_url === 'string' && user.avatar_url.trim());
}

async function uploadAvatar(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 1 || file.size > 5 * 1024 * 1024) {
    showToast('Vyberte obrázek JPG, PNG nebo WebP do 5 MB.', 'error');
    return;
  }
  const uploadTrigger = $('avatarUploadTrigger');
  const removeButton = $('avatarRemoveBtn');
  const temporaryUrl = URL.createObjectURL(file);
  $('profAvatar').src = temporaryUrl; $('profAvatar').hidden = false; $('profInitials').hidden = true;
  uploadTrigger.disabled = true; uploadTrigger.setAttribute('aria-busy', 'true'); uploadTrigger.setAttribute('aria-label', 'Nahrávám profilovou fotografii'); removeButton.disabled = true;
  try {
    const form = new FormData(); form.append('avatar', file);
    const response = await fetch('/account/api/avatar-upload.php', { method: 'POST', credentials: 'same-origin', body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Fotografii se nepodařilo nahrát.');
    currentUser = { ...currentUser, avatar_url: payload.avatar_url || '' };
    hydrateIdentity(currentUser); showToast('Profilová fotografie byla nahrána.');
  } catch (error) {
    console.error('Avatar upload failed', error);
    hydrateIdentity(currentUser); showToast(error.message || 'Fotografii se nepodařilo nahrát.', 'error');
  } finally {
    URL.revokeObjectURL(temporaryUrl); uploadTrigger.disabled = false; uploadTrigger.removeAttribute('aria-busy'); uploadTrigger.setAttribute('aria-label', 'Změnit profilovou fotografii');
    $('avatarUploadInput').value = '';
  }
}

async function removeAvatar() {
  if (!currentUser?.avatar_url || !confirm('Opravdu chcete profilovou fotografii odebrat?')) return;
  const button = $('avatarRemoveBtn'); button.disabled = true; button.textContent = 'Odebírám…';
  try {
    await api('avatar-remove.php', { method: 'POST', body: {} });
    currentUser = { ...currentUser, avatar_url: '' }; hydrateIdentity(currentUser); showToast('Profilová fotografie byla odebrána.');
  } catch (error) { showToast(error.message || 'Fotografii se nepodařilo odebrat.', 'error'); }
  finally { button.textContent = 'Odebrat'; hydrateIdentity(currentUser); }
}

function setUserMenu(open, { restoreFocus = false } = {}) {
  userMenuOpen = open;
  const userMenuButton = $('userMenuButton');
  const userMenu = $('userMenu');
  userMenuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  userMenu.toggleAttribute('hidden', !open);
  if (open) {
    userMenu.querySelector('[role="menuitem"]')?.focus();
  } else if (restoreFocus) {
    userMenuButton.focus();
  }
}

function showToast(message, kind = 'success') {
  const toast = $('accountToast');
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.dataset.kind = kind;
  show(toast);
  toastTimer = window.setTimeout(() => hide(toast), 3200);
}

function syncRouteUi(section, focusMain) {
  const route = ROUTES[section] || ROUTES.overview;
  currentRoute = section in ROUTES ? section : 'overview';
  $$('.account-panel').forEach((panel) => {
    panel.toggleAttribute('hidden', panel.dataset.panel !== currentRoute);
  });
  $$('.settings-nav__item').forEach((link) => {
    if (link.dataset.route === currentRoute) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('mobileSectionSelect').value = currentRoute;
  $('sectionTitle').textContent = route.title;
  $('sectionDescription').textContent = route.description;
  document.title = route.title + ' · Nastavení účtu · vevit';
  if (focusMain) $('mainContent').focus({ preventScroll: true });
}

function restoreCurrentRouteControl() {
  $('mobileSectionSelect').value = currentRoute;
}

function navigate(
  section,
  { push = true, replace = false, focusMain = true, ignoreDirty = false } = {}
) {
  const target = section in ROUTES ? section : 'overview';
  if (!ignoreDirty && isProfileDirty() && target !== currentRoute) {
    restoreCurrentRouteControl();
    pendingNavigation = { section: target, push, replace, focusMain };
    openDirtyDialog(document.activeElement);
    return;
  }

  syncRouteUi(target, focusMain);
  if (replace && location.pathname !== ROUTES[target].path) {
    window.history.replaceState({ section: target }, '', ROUTES[target].path);
  } else if (push && location.pathname !== ROUTES[target].path) {
    window.history.pushState({ section: target }, '', ROUTES[target].path);
  }
  loadSection(target);
}

function loadSection(section) {
  if (section === 'overview') loadOverview();
  if (section === 'profile') hydrateProfileForm();
  if (section === 'security') loadSecurity();
  if (section === 'billing') loadBilling();
  if (section === 'connections') loadConnections();
  if (section === 'notifications') loadNotifications();
  if (section === 'preferences') loadPreferences();
  if (section === 'privacy') loadPrivacy();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function maskEmail(value) {
  const [local, domain] = String(value || '').split('@');
  return local && domain ? local.slice(0, 2) + '•••@' + domain : 'E-mail není dostupný';
}
function setSectionHtml(id, html, state = 'success') { const host = $(id); host.dataset.state = state; host.innerHTML = html; }
function sectionError(id, message, retry) { setSectionHtml(id, `<div class="card state-card state-card--error"><span class="state-card__icon">!</span><div><strong>Data se nepodařilo načíst.</strong><p>${escapeHtml(message)}</p></div><button class="btn btn--ghost btn--sm" type="button" data-retry="${retry}">Zkusit znovu</button></div>`, 'error'); }

async function loadSecurity(force = false) {
  const host = $('securityState'); if (!force && sectionCache.has('security')) { renderSecuritySection(sectionCache.get('security')); return; }
  try {
    const [sessions, overview, connections, twofa] = await Promise.all([api('sessions-list.php'), api('account-overview.php'), api('connections.php'), api('2fa/status.php')]);
    const data = { sessions, overview, connections, twofa }; sectionCache.set('security', data); renderSecuritySection(data);
    const reauth=new URLSearchParams(location.search).get('twofa_reauth');
    if(reauth){const reauthAction=new URLSearchParams(location.search).get('twofa_action')||'setup';history.replaceState({section:'security'},'',ROUTES.security.path);try{if(reauthAction==='setup')showTotpSetup(await api('2fa/setup-start.php',{method:'POST',body:{reauth_challenge:reauth}}));else{const code=prompt('Zadejte aktuální TOTP nebo recovery kód:');if(code===null)return;const endpoint=reauthAction==='disable'?'2fa/disable.php':'2fa/recovery-regenerate.php';const result=await api(endpoint,{method:'POST',body:{reauth_challenge:reauth,code}});if(reauthAction==='disable'){showToast('Dvoufázové ověření bylo vypnuto.');sectionCache.delete('security');loadSecurity(true);}else showRecoveryCodes(result.recovery_codes||[]);}}catch(error){showToast(error.message,'error');}}
  } catch (error) { console.error('Security load failed', error); sectionError('securityState', 'Zabezpečení se nepodařilo načíst.', 'security'); }
}
function renderSecuritySection(data) {
  const hasPassword = Boolean(data.connections?.has_password); const sessions = data.sessions?.sessions || []; const last = data.overview?.security?.last_password_change;
  const twofa = data.twofa || {}; const twofaCard = twofa.enabled
    ? `<article class="card"><div class="card-heading card-heading--split"><div><h2>Dvoufázové ověření</h2><p><span class="status-badge">Aktivní</span> · zapnuto ${escapeHtml(formatDate(twofa.enabled_at))} · zbývá ${Number(twofa.recovery_codes_remaining)||0} recovery kódů</p></div><div class="button-row"><button class="btn btn--ghost btn--sm" type="button" data-action="regenerate-2fa" data-has-password="${hasPassword?'1':'0'}" data-oauth-provider="${escapeHtml(Object.keys(data.connections?.connections||{})[0]||'')}">Nové recovery kódy</button><button class="btn btn--warn btn--sm" type="button" data-action="disable-2fa" data-has-password="${hasPassword?'1':'0'}" data-oauth-provider="${escapeHtml(Object.keys(data.connections?.connections||{})[0]||'')}">Vypnout 2FA</button></div></div></article>`
    : `<article class="card"><div class="card-heading card-heading--split"><div><h2>Dvoufázové ověření</h2><p>Vypnuto · Chraňte účet kódem z ověřovací aplikace.</p></div><button class="btn btn--primary btn--sm" type="button" data-action="enable-2fa" data-has-password="${hasPassword?'1':'0'}" data-oauth-provider="${escapeHtml(Object.keys(data.connections?.connections||{})[0]||'')}">Zapnout 2FA</button></div></article>`;
  const rows = sessions.length ? sessions.map((session) => `<div class="settings-row"><div><strong>${escapeHtml(session.device || 'Webové zařízení')}${session.is_current ? ' <span class="status-badge">Toto zařízení</span>' : ''}</strong><p>${escapeHtml(session.ip_address || 'Neuvedeno')} · vytvořeno ${escapeHtml(formatDate(session.created_at))} · aktivní ${escapeHtml(formatDate(session.last_seen_at))} · expirace ${escapeHtml(formatDate(session.expires_at))}</p></div>${session.is_current ? '' : `<button class="btn btn--ghost btn--sm" type="button" data-action="revoke-session" data-session-id="${escapeHtml(session.id)}">Odhlásit</button>`}</div>`).join('') : '<div class="state-card state-card--empty"><span class="state-card__icon">○</span><div><strong>Žádné další relace.</strong><p>Aktivní zařízení se zobrazí zde.</p></div></div>';
  setSectionHtml('securityState', `<article class="card"><div class="card-heading card-heading--split"><div><h2>Heslo</h2><p>${hasPassword ? 'Lokální heslo je nastavené.' : 'Tento účet zatím nemá nastavené heslo.'}</p></div><button class="btn btn--primary btn--sm" type="button" data-action="change-password">${hasPassword ? 'Změnit heslo' : 'Nastavit heslo'}</button></div><p class="field-hint">${last ? 'Poslední změna: ' + escapeHtml(formatDate(last)) : 'Zatím nebyla zaznamenána změna hesla.'}</p></article>${twofaCard}<article class="card"><div class="card-heading card-heading--split"><div><h2>Aktivní relace</h2><p>${sessions.length} neexpirovaných relací</p></div>${sessions.length > 1 ? '<button class="btn btn--ghost btn--sm" type="button" data-action="revoke-others">Odhlásit ostatní</button>' : ''}</div><div class="settings-list">${rows}</div></article>`);
}

function closeTotpOverlay() { document.getElementById('totpOverlay')?.remove(); }
function showRecoveryCodes(codes) {
  closeTotpOverlay(); const overlay=document.createElement('div'); overlay.id='totpOverlay'; overlay.className='overlay';
  overlay.innerHTML=`<div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="recoveryTitle"><h2 class="modal-title" id="recoveryTitle">Uložte si recovery kódy</h2><p class="modal-sub">Každý kód lze použít pouze jednou. Po zavření je už nezobrazíme.</p><div class="codes">${codes.map((code)=>`<code class="code">${escapeHtml(code)}</code>`).join('')}</div><div class="modal-actions"><button class="btn btn--ghost" type="button" id="copyRecovery">Zkopírovat</button><button class="btn btn--ghost" type="button" id="downloadRecovery">Stáhnout TXT</button></div><label class="settings-toggle"><input id="recoverySaved" type="checkbox"><span>Kódy jsem si bezpečně uložil/a.</span></label><button class="btn btn--primary" id="closeRecovery" type="button" disabled>Hotovo</button></div>`;
  document.body.append(overlay); const text=codes.join('\n');
  overlay.querySelector('#copyRecovery').onclick=()=>navigator.clipboard.writeText(text).then(()=>showToast('Recovery kódy byly zkopírovány.'));
  overlay.querySelector('#downloadRecovery').onclick=()=>{const url=URL.createObjectURL(new Blob(['VEVIT recovery kódy\\n\\n'+text+'\\n'],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='vevit-recovery-codes.txt';a.click();URL.revokeObjectURL(url)};
  overlay.querySelector('#recoverySaved').onchange=(e)=>{overlay.querySelector('#closeRecovery').disabled=!e.target.checked};
  overlay.querySelector('#closeRecovery').onclick=()=>{closeTotpOverlay();sectionCache.delete('security');sectionCache.delete('overview-core');loadSecurity(true)};
}
function showTotpSetup(data) {
  closeTotpOverlay(); const overlay=document.createElement('div'); overlay.id='totpOverlay'; overlay.className='overlay';
  overlay.innerHTML=`<form class="modal modal--wide" id="totpSetupForm" role="dialog" aria-modal="true" aria-labelledby="totpSetupTitle"><h2 class="modal-title" id="totpSetupTitle">Zapnout dvoufázové ověření</h2><p class="modal-sub">Naskenujte QR kód v autentizační aplikaci. Issuer: VEVIT.</p><img class="qr" src="${escapeHtml(data.qr_code)}" alt="QR kód pro autentizační aplikaci"><p class="modal-hint">Ruční klíč: <strong>${escapeHtml(data.secret)}</strong></p><label for="totpSetupCode">Šestimístný kód</label><input class="input" id="totpSetupCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required><p class="field-error" id="totpSetupError" role="alert"></p><div class="modal-actions"><button class="btn btn--ghost" type="button" id="cancelTotp">Zrušit</button><button class="btn btn--primary" type="submit">Ověřit a zapnout</button></div></form>`;
  document.body.append(overlay); overlay.querySelector('#cancelTotp').onclick=closeTotpOverlay;
  overlay.querySelector('#totpSetupForm').onsubmit=async(e)=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{const result=await api('2fa/setup-confirm.php',{method:'POST',body:{challenge:data.challenge,code:overlay.querySelector('#totpSetupCode').value}});showRecoveryCodes(result.recovery_codes||[])}catch(error){overlay.querySelector('#totpSetupError').textContent=error.message;button.disabled=false}};
  overlay.querySelector('#totpSetupCode').focus();
}

async function loadBilling(force = false) {
  try { const data = !force && sectionCache.has('billing') ? sectionCache.get('billing') : await api('subscription.php'); sectionCache.set('billing', data); const subscription = data.subscription; const body = subscription ? `<strong class="metric-value">${escapeHtml(subscription.tier)}</strong><p class="overview-detail">${escapeHtml(subscriptionStatus(subscription.status))} · ${escapeHtml(formatDate(subscription.started_at))}${subscription.expires_at ? ' · obnovení ' + escapeHtml(formatDate(subscription.expires_at)) : ''}</p>` : '<strong class="metric-value">Bez aktivního předplatného</strong><p class="overview-detail">Účet momentálně používá bezplatný tarif.</p>'; setSectionHtml('billingState', `<article class="card"><div class="card-heading"><div><h2>Aktuální tarif</h2><p>Skutečný stav podle dostupných dat předplatného.</p></div></div>${body}</article><article class="card"><div class="card-heading card-heading--split"><div><h2>Dostupné tarify</h2><p>Placené tarify připravujeme.</p></div><button class="btn btn--ghost btn--sm" disabled>Brzy dostupné</button></div></article><article class="card"><div class="card-heading"><div><h2>Historie faktur</h2><p>Zatím nemáte žádné faktury.</p></div></div></article>`); } catch (error) { sectionError('billingState', 'Předplatné se nepodařilo načíst.', 'billing'); }
}

async function loadConnections(force = false) {
  try { const data = !force && sectionCache.has('connections') ? sectionCache.get('connections') : await api('connections.php'); sectionCache.set('connections', data); const cards = ['google','github','discord'].map((provider) => { const connection = data.connections?.[provider]; return `<article class="card connection-card"><div class="card-heading card-heading--split"><div><h2>${provider[0].toUpperCase()+provider.slice(1)}</h2><p>${connection ? 'Připojeno · ' + escapeHtml(maskEmail(connection.provider_email)) + ' · ' + escapeHtml(formatDate(connection.created_at)) : 'Nepřipojeno'}</p></div>${connection ? `<button class="btn btn--ghost btn--sm" type="button" data-action="disconnect-provider" data-provider="${provider}">Odpojit</button>` : `<button class="btn btn--primary btn--sm" type="button" data-action="connect-provider" data-provider="${provider}">Připojit</button>`}</div></article>`; }).join(''); setSectionHtml('connectionsState', `<div class="settings-cards">${cards}</div>`); } catch (error) { sectionError('connectionsState', 'Propojené účty se nepodařilo načíst.', 'connections'); }
}

async function loadNotifications(force = false) {
  try { const data = !force && sectionCache.has('notifications') ? sectionCache.get('notifications') : await api('notifications.php'); sectionCache.set('notifications', data); const p = data.prefs || {}; setSectionHtml('notificationsState', `<form class="card settings-form" id="notificationsForm"><div class="card-heading"><div><h2>Bezpečnostní oznámení</h2><p>Povinné bezpečnostní oznámení</p></div></div><label class="settings-toggle"><input type="checkbox" checked disabled><span>Nové přihlášení a změny zabezpečení</span></label><div class="card-heading"><div><h2>Produkt a fakturace</h2><p>Nastavte, co chcete dostávat e-mailem nebo v aplikaci.</p></div></div><label class="settings-toggle"><input name="product_updates" type="checkbox" ${p.product_updates ? 'checked' : ''}><span>Novinky VEVIT a nové funkce</span></label><label class="settings-toggle"><input name="marketing" type="checkbox" ${p.marketing ? 'checked' : ''}><span>Tipy, doporučení a průzkumy</span></label><label class="settings-toggle"><input name="billing_summary" type="checkbox" ${p.billing_summary ? 'checked' : ''}><span>Fakturační souhrny</span></label><div class="form-actions"><button class="btn btn--primary" type="submit">Uložit nastavení</button></div></form>`); } catch (error) { sectionError('notificationsState', 'Oznámení se nepodařilo načíst.', 'notifications'); }
}

async function loadPreferences(force = false) {
  try { const data = !force && sectionCache.has('preferences') ? sectionCache.get('preferences') : await api('preferences.php'); sectionCache.set('preferences', data); const p = data.preferences || {}; setSectionHtml('preferencesState', `<form class="card settings-form" id="preferencesForm"><div class="card-heading"><div><h2>Jazyk a region</h2><p>Rozhraní je nyní dostupné v češtině.</p></div></div><div class="form-grid"><div class="form-field"><label>Jazyk</label><select class="input" disabled><option>Čeština</option></select><span class="field-hint">Další jazyky brzy.</span></div><div class="form-field"><label for="prefTimezone">Časové pásmo</label><select class="input" id="prefTimezone" name="timezone"><option value="Europe/Prague" ${p.timezone === 'Europe/Prague' ? 'selected' : ''}>Europe/Prague</option></select></div><div class="form-field"><label for="prefDateFormat">Formát data</label><select class="input" id="prefDateFormat" name="date_format"><option ${p.date_format === 'DD. MM. YYYY' ? 'selected' : ''}>DD. MM. YYYY</option><option ${p.date_format === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option></select></div><div class="form-field"><label for="prefWeek">První den týdne</label><select class="input" id="prefWeek" name="week_starts_on"><option value="monday" ${p.week_starts_on === 'monday' ? 'selected' : ''}>Pondělí</option><option value="sunday" ${p.week_starts_on === 'sunday' ? 'selected' : ''}>Neděle</option></select></div></div><div class="form-actions"><button class="btn btn--primary" type="submit">Uložit nastavení</button></div></form>`); } catch (error) { sectionError('preferencesState', 'Nastavení se nepodařilo načíst.', 'preferences'); }
}

function loadPrivacy() { setSectionHtml('privacyState', `<article class="card"><div class="card-heading card-heading--split"><div><h2>Export dat</h2><p>Export obsahuje profil, OAuth identity bez tokenů, relace bez session tokenů, oznámení, aktivitu a fakturační údaje.</p></div><button class="btn btn--primary btn--sm" type="button" data-action="export-data">Vyžádat export dat</button></div></article><article class="card card--danger"><div class="card-heading card-heading--split"><div><h2>Smazání účtu</h2><p>Smazání účtu je nevratné. Zruší relace a odstraní propojené identity i data podle datového modelu.</p></div><button class="btn btn--warn btn--sm" type="button" data-action="delete-account">Smazat účet</button></div></article>`); }

function renderSectionError(host, message, retryKey) {
  host.dataset.state = 'error';
  host.replaceChildren();
  const card = document.createElement('div');
  card.className = 'state-card state-card--error';
  card.dataset.state = 'error';

  const icon = document.createElement('span');
  icon.className = 'state-card__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '!';

  const copy = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = 'Data se nepodařilo načíst.';
  const detail = document.createElement('p');
  detail.textContent = message;
  copy.append(title, detail);

  const retry = document.createElement('button');
  retry.className = 'btn btn--ghost btn--sm';
  retry.type = 'button';
  retry.dataset.retry = retryKey;
  retry.textContent = 'Zkusit znovu';
  card.append(icon, copy, retry);
  host.append(card);
}

function renderEmpty(host, title, detail) {
  host.dataset.state = 'empty';
  host.replaceChildren();
  const card = document.createElement('div');
  card.className = 'state-card state-card--empty';
  card.dataset.state = 'empty';
  const icon = document.createElement('span');
  icon.className = 'state-card__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '○';
  const copy = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = detail;
  copy.append(heading, text);
  card.append(icon, copy);
  host.append(card);
}

function actionLink(label, route) {
  const link = document.createElement('a');
  link.className = 'btn btn--ghost btn--sm';
  link.href = ROUTES[route].path;
  link.dataset.route = route;
  link.textContent = label;
  return link;
}

function renderProfileOverview(profile) {
  const host = $('overviewProfileState').querySelector('.state-host');
  host.dataset.state = 'success';
  host.replaceChildren();
  const metric = document.createElement('div');
  metric.className = 'metric-row';
  const value = document.createElement('strong');
  value.className = 'metric-value';
  value.textContent = String(profile.completion) + ' %';
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = 'dokončeno';
  metric.append(value, label);
  const track = document.createElement('div');
  track.className = 'progress-track';
  const fill = document.createElement('div');
  fill.className = 'progress-value';
  fill.style.width = Math.max(0, Math.min(100, Number(profile.completion) || 0)) + '%';
  track.append(fill);
  const detail = document.createElement('p');
  detail.className = 'overview-detail';
  detail.textContent = profile.missing?.length
    ? 'Doplňte: ' + profile.missing.join(', ') + '.'
    : 'Profil obsahuje všechny základní údaje.';
  const actions = document.createElement('div');
  actions.className = 'overview-actions';
  actions.append(actionLink(profile.missing?.length ? 'Dokončit profil' : 'Zobrazit profil', 'profile'));
  host.append(metric, track, detail, actions);
}

function formatDate(value) {
  if (!value) return 'neuvedeno';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'neuvedeno'
    : new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' }).format(date);
}

function renderSecurityOverview(security) {
  const host = $('overviewSecurityState').querySelector('.state-host');
  host.dataset.state = 'success';
  host.replaceChildren();
  const metric = document.createElement('div');
  metric.className = 'metric-row';
  const value = document.createElement('strong');
  value.className = 'metric-value';
  value.textContent = security.two_factor_enabled ? '2FA zapnuto' : '2FA vypnuto';
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = String(security.active_sessions) + ' aktivní relace';
  metric.append(value, label);
  const detail = document.createElement('p');
  detail.className = 'overview-detail';
  detail.textContent = security.last_password_change
    ? 'Poslední změna hesla: ' + formatDate(security.last_password_change) + '.'
    : 'Datum poslední změny hesla není dostupné.';
  const actions = document.createElement('div');
  actions.className = 'overview-actions';
  actions.append(actionLink(security.two_factor_enabled ? 'Spravovat zabezpečení' : 'Zabezpečit účet', 'security'));
  host.append(metric, detail, actions);
}

const ACTIVITY_LABELS = {
  login: ['Přihlášení', '↗'],
  password_change: ['Změna hesla', '◇'],
  profile_update: ['Úprava profilu', '○'],
  session_revoke: ['Odhlášení zařízení', '×'],
  connection: ['Propojení účtu', '↗'],
  subscription: ['Změna předplatného', '▱'],
  invoice: ['Vystavení faktury', '▤'],
};

function renderActivity(activities) {
  const host = $('overviewActivityState');
  if (!activities.length) {
    renderEmpty(host, 'Zatím žádná aktivita', 'Bezpečnostní a profilové události se objeví po první změně.');
    return;
  }
  host.dataset.state = 'success';
  host.replaceChildren();
  activities.forEach((activity) => {
    const row = document.createElement('div');
    row.className = 'activity-item';
    const icon = document.createElement('span');
    icon.className = 'activity-icon';
    icon.setAttribute('aria-hidden', 'true');
    const [titleText, iconText] = ACTIVITY_LABELS[activity.kind] || ['Aktivita účtu', '•'];
    icon.textContent = iconText;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = titleText;
    const detail = document.createElement('p');
    detail.textContent = activity.detail || 'Událost byla bezpečně zaznamenána.';
    copy.append(title, detail);
    const time = document.createElement('time');
    time.dateTime = activity.created_at || '';
    time.textContent = formatDate(activity.created_at);
    row.append(icon, copy, time);
    host.append(row);
  });
}

function subscriptionStatus(status) {
  const labels = {
    active: 'Aktivní',
    trialing: 'Zkušební období',
    past_due: 'Platba se nezdařila',
    canceling: 'Zrušení naplánováno',
    canceled: 'Zrušeno',
  };
  return labels[status] || 'Bez předplatného';
}

function renderSubscription(data) {
  const host = $('overviewSubscriptionState').querySelector('.state-host');
  const subscription = data?.subscription;
  if (!subscription) {
    host.dataset.state = 'empty';
    host.replaceChildren();
    const metric = document.createElement('div');
    metric.className = 'metric-row';
    const value = document.createElement('strong');
    value.className = 'metric-value';
    value.textContent = 'Bez předplatného';
    metric.append(value);
    const detail = document.createElement('p');
    detail.className = 'overview-detail';
    detail.textContent = 'Účet momentálně nemá aktivní placený tarif.';
    const actions = document.createElement('div');
    actions.className = 'overview-actions';
    actions.append(actionLink('Vybrat tarif', 'billing'));
    host.append(metric, detail, actions);
    return;
  }

  host.dataset.state = 'success';
  host.replaceChildren();
  const metric = document.createElement('div');
  metric.className = 'metric-row';
  const value = document.createElement('strong');
  value.className = 'metric-value';
  value.textContent = subscription.tier || 'Tarif';
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = subscriptionStatus(subscription.status);
  metric.append(value, label);
  const price = data?.price?.price_czk ?? subscription.price;
  const interval = subscription.billing_cycle === 'yearly' ? 'rok' : 'měsíc';
  const detail = document.createElement('p');
  detail.className = 'overview-detail';
  detail.textContent = [
    price !== null && price !== undefined ? String(price) + ' Kč / ' + interval : '',
    subscription.expires_at ? 'další období ' + formatDate(subscription.expires_at) : '',
  ].filter(Boolean).join(' · ') || 'Fakturační údaje nejsou dostupné.';
  const actions = document.createElement('div');
  actions.className = 'overview-actions';
  actions.append(actionLink('Spravovat předplatné', 'billing'));
  host.append(metric, detail, actions);
}

async function loadOverviewCore(force = false) {
  const profileHost = $('overviewProfileState').querySelector('.state-host');
  const securityHost = $('overviewSecurityState').querySelector('.state-host');
  const activityHost = $('overviewActivityState');
  if (!force && sectionCache.has('overview-core')) {
    const cached = sectionCache.get('overview-core');
    renderProfileOverview(cached.profile);
    renderSecurityOverview(cached.security);
    renderActivity(cached.activity);
    return;
  }

  [profileHost, securityHost, activityHost].forEach((host) => { host.dataset.state = 'loading'; });
  try {
    const data = await api('account-overview.php');
    sectionCache.set('overview-core', data);
    renderProfileOverview(data.profile);
    if (data.errors?.security) {
      renderSectionError(securityHost, data.errors.security, 'overview-core');
    } else {
      renderSecurityOverview(data.security);
    }
    if (data.errors?.activity) {
      renderSectionError(activityHost, data.errors.activity, 'overview-core');
    } else {
      renderActivity(data.activity || []);
    }
  } catch (error) {
    if (error.message === 'unauthorized') return;
    console.error('Account overview failed', error);
    renderSectionError(profileHost, 'Profilový souhrn není právě dostupný.', 'overview-core');
    renderSectionError(securityHost, 'Bezpečnostní souhrn není právě dostupný.', 'overview-core');
    renderSectionError(activityHost, 'Aktivitu účtu se nepodařilo načíst.', 'overview-core');
  } finally {
    [profileHost, securityHost, activityHost].forEach((host) => {
      if (host.dataset.state === 'loading') host.dataset.state = 'error';
    });
  }
}

async function loadSubscriptionOverview(force = false) {
  const host = $('overviewSubscriptionState').querySelector('.state-host');
  if (!force && sectionCache.has('subscription')) {
    renderSubscription(sectionCache.get('subscription'));
    return;
  }
  host.dataset.state = 'loading';
  try {
    const data = await api('subscription.php');
    sectionCache.set('subscription', data);
    renderSubscription(data);
  } catch (error) {
    if (error.message === 'unauthorized') return;
    console.error('Subscription overview failed', error);
    renderSectionError(host, 'Předplatné se nepodařilo načíst.', 'subscription');
  } finally {
    if (host.dataset.state === 'loading') host.dataset.state = 'error';
  }
}

function loadOverview() {
  loadOverviewCore();
  loadSubscriptionOverview();
}

const PROFILE_FIELDS = {
  full_name: 'profFullName',
  nickname: 'profNickname',
  bio: 'profBio',
  phone: 'profPhone',
  location: 'profLocation',
  birth_date: 'profBirthDate',
};

function profileFromUser(user) {
  return Object.fromEntries(
    Object.keys(PROFILE_FIELDS).map((key) => [key, typeof user[key] === 'string' ? user[key] : ''])
  );
}

function profilesEqual(left, right) {
  return Object.keys(PROFILE_FIELDS).every((key) => (left?.[key] || '') === (right?.[key] || ''));
}

function isProfileDirty() {
  return Boolean(profileOriginal && profileDraft && !profilesEqual(profileOriginal, profileDraft));
}

function validateProfile() {
  const errors = {};
  const name = profileDraft.full_name.trim();
  const nickname = profileDraft.nickname.trim();
  if (name.length < 2) errors.full_name = 'Zadejte celé jméno alespoň o 2 znacích.';
  if (!/^[a-z0-9_.]{3,30}$/i.test(nickname)) {
    errors.nickname = 'Použijte 3–30 písmen, číslic, podtržítek nebo teček.';
  } else if (!nicknameAvailable && nickname !== profileOriginal.nickname) {
    errors.nickname = 'Tato přezdívka je již obsazená.';
  }
  profileErrors = errors;
  $('fullNameError').textContent = errors.full_name || '';
  $('nicknameError').textContent = nicknamePending ? 'Ověřuji dostupnost…' : (errors.nickname || '');
  $('profFullName').setAttribute('aria-invalid', errors.full_name ? 'true' : 'false');
  $('profNickname').setAttribute('aria-invalid', errors.nickname ? 'true' : 'false');
  $('saveProfileBtn').disabled = !isProfileDirty() || Object.keys(errors).length > 0 || nicknamePending;
  return Object.keys(errors).length === 0;
}

function hydrateProfileForm() {
  if (!profileOriginal) {
    profileOriginal = profileFromUser(currentUser);
    profileDraft = { ...profileOriginal };
    Object.entries(PROFILE_FIELDS).forEach(([key, id]) => {
      $(id).value = profileDraft[key];
    });
    $('profEmail').value = currentUser.email || '';
  }
  $('bioCount').textContent = String(profileDraft.bio.length);
  validateProfile();
}

function scheduleNicknameCheck() {
  window.clearTimeout(nicknameTimer);
  nicknameController?.abort();
  const nickname = profileDraft.nickname.trim();
  if (nickname === profileOriginal.nickname || !/^[a-z0-9_.]{3,30}$/i.test(nickname)) {
    nicknameAvailable = true;
    nicknamePending = false;
    validateProfile();
    return;
  }
  nicknamePending = true;
  validateProfile();
  nicknameTimer = window.setTimeout(async () => {
    nicknameController = new AbortController();
    try {
      const result = await api(
        'nickname-availability.php?nickname=' + encodeURIComponent(nickname),
        { signal: nicknameController.signal }
      );
      if (profileDraft.nickname.trim() === nickname) {
        nicknameAvailable = Boolean(result.available);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Nickname availability failed', error);
        nicknameAvailable = false;
        profileErrors.nickname = 'Dostupnost přezdívky se nepodařilo ověřit.';
      }
    } finally {
      if (profileDraft.nickname.trim() === nickname) {
        nicknamePending = false;
        validateProfile();
      }
    }
  }, 350);
}

function onProfileInput(event) {
  const key = event.target.name;
  if (!(key in PROFILE_FIELDS)) return;
  profileDraft[key] = event.target.value;
  if (key === 'bio') $('bioCount').textContent = String(profileDraft.bio.length);
  if (key === 'nickname') scheduleNicknameCheck();
  else validateProfile();
}

function setProfileSubmitting(submitting) {
  $$('#profileForm input, #profileForm textarea, #profileForm button').forEach((control) => {
    if (control.id !== 'profEmail') control.disabled = submitting;
  });
  $('saveProfileBtn').setAttribute('aria-busy', submitting ? 'true' : 'false');
  $('profileSaveStatus').textContent = submitting ? 'Ukládám změny…' : '';
}

async function saveProfile(event) {
  event.preventDefault();
  if (!validateProfile() || !isProfileDirty()) return;
  setProfileSubmitting(true);
  const patch = Object.fromEntries(
    Object.keys(PROFILE_FIELDS).map((key) => [key, profileDraft[key].trim()])
  );
  try {
    const result = await api('profile-update.php', { method: 'PATCH', body: patch });
    currentUser = result.user || { ...currentUser, ...patch };
    profileOriginal = profileFromUser(currentUser);
    profileDraft = { ...profileOriginal };
    sectionCache.delete('overview-core');
    hydrateIdentity(currentUser);
    validateProfile();
    showToast('Změny byly uloženy');
  } catch (error) {
    console.error('Profile save failed', error);
    if (error.field === 'nickname') {
      nicknameAvailable = false;
      validateProfile();
    }
    showToast(error.message || 'Změny se nepodařilo uložit.', 'error');
  } finally {
    setProfileSubmitting(false);
    validateProfile();
  }
}

function openDirtyDialog(trigger) {
  dirtyDialogTrigger = trigger instanceof HTMLElement ? trigger : null;
  show($('dirtyDialog'));
  $('keepEditingBtn').focus();
}

function closeDirtyDialog({ restoreFocus = true } = {}) {
  hide($('dirtyDialog'));
  if (restoreFocus) dirtyDialogTrigger?.focus();
}

function discardProfileChanges() {
  profileDraft = { ...profileOriginal };
  Object.entries(PROFILE_FIELDS).forEach(([key, id]) => { $(id).value = profileDraft[key]; });
  nicknameAvailable = true;
  nicknamePending = false;
  validateProfile();
  const destination = pendingNavigation;
  pendingNavigation = null;
  closeDirtyDialog({ restoreFocus: false });
  if (destination) navigate(destination.section, { ...destination, ignoreDirty: true });
}

function wireEvents() {
  document.addEventListener('click', (event) => {
    const routeLink = event.target.closest('[data-route]');
    if (routeLink instanceof HTMLAnchorElement) {
      event.preventDefault();
      setUserMenu(false);
      navigate(routeLink.dataset.route);
      return;
    }

    const retry = event.target.closest('[data-retry]');
    if (retry) {
      if (retry.dataset.retry === 'overview-core') loadOverviewCore(true);
      if (retry.dataset.retry === 'subscription') loadSubscriptionOverview(true);
      if (retry.dataset.retry === 'security') loadSecurity(true);
      if (retry.dataset.retry === 'billing') loadBilling(true);
      if (retry.dataset.retry === 'connections') loadConnections(true);
      if (retry.dataset.retry === 'notifications') loadNotifications(true);
      if (retry.dataset.retry === 'preferences') loadPreferences(true);
      return;
    }

    const action = event.target.closest('[data-action]');
    if (action) handleAccountAction(action);

    if (userMenuOpen && !event.target.closest('.user-menu-wrap')) setUserMenu(false);
  });

  $('mobileSectionSelect').addEventListener('change', (event) => navigate(event.target.value));
  $('userMenuButton').addEventListener('click', () => setUserMenu(!userMenuOpen));
  $('signOutBtn').addEventListener('click', async () => {
    $('signOutBtn').disabled = true;
    try {
      await api('logout.php', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      location.replace('/account/login');
    }
  });

  $('profileForm').addEventListener('input', onProfileInput);
  $('profileForm').addEventListener('submit', saveProfile);
  $('avatarUploadTrigger').addEventListener('click', () => $('avatarUploadInput').click());
  $('avatarUploadInput').addEventListener('change', (event) => uploadAvatar(event.target.files?.[0]));
  $('avatarRemoveBtn').addEventListener('click', removeAvatar);
  document.addEventListener('submit', handleSettingsSubmit);
  $('keepEditingBtn').addEventListener('click', () => {
    pendingNavigation = null;
    closeDirtyDialog();
  });
  $('discardChangesBtn').addEventListener('click', discardProfileChanges);
  $('dirtyDialog').addEventListener('click', (event) => {
    if (event.target === $('dirtyDialog')) {
      pendingNavigation = null;
      closeDirtyDialog();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!$('dirtyDialog').hasAttribute('hidden')) {
        pendingNavigation = null;
        closeDirtyDialog();
      } else if (userMenuOpen) {
        setUserMenu(false, { restoreFocus: true });
      }
    }
  });

  window.addEventListener('popstate', () => {
    const target = routeFromPath(location.pathname);
    if (isProfileDirty() && target !== currentRoute) {
      pendingNavigation = {
        section: target,
        push: false,
        replace: true,
        focusMain: true,
      };
      history.pushState({ section: currentRoute }, '', ROUTES[currentRoute].path);
      openDirtyDialog($('mobileSectionSelect'));
      return;
    }
    navigate(target, { push: false });
  });

  window.addEventListener('beforeunload', (event) => {
    if (!isProfileDirty()) return;
    event.preventDefault();
    event.returnValue = '';
  });
}

async function handleAccountAction(action) {
  const type = action.dataset.action;
  if (type === 'connect-provider') { location.assign('/account/api/oauth/start.php?provider=' + encodeURIComponent(action.dataset.provider) + '&mode=connect'); return; }
  if (type === 'disconnect-provider') {
    if (!confirm('Opravdu chcete tento účet odpojit?')) return;
    try { await api('connections-disconnect.php', { method:'POST', body:{ provider: action.dataset.provider } }); sectionCache.delete('connections'); showToast('Účet byl odpojen.'); loadConnections(true); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'revoke-session' || type === 'revoke-others') {
    if (!confirm(type === 'revoke-others' ? 'Opravdu odhlásit všechna ostatní zařízení?' : 'Opravdu odhlásit toto zařízení?')) return;
    try { await api('sessions-revoke.php', { method:'POST', body:type === 'revoke-others' ? { all_others:true } : { session_id: action.dataset.sessionId } }); sectionCache.delete('security'); sectionCache.delete('overview-core'); showToast('Relace byla ukončena.'); loadSecurity(true); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'change-password') {
    const current = prompt('Současné heslo (nechte prázdné při prvním nastavení):') ?? null; if (current === null) return;
    const next = prompt('Nové heslo (min. 8 znaků, velké i malé písmeno, číslo a speciální znak):') ?? null; if (next === null) return;
    const confirmPassword = prompt('Potvrďte nové heslo:') ?? null; if (confirmPassword !== next) { showToast('Hesla se neshodují.', 'error'); return; }
    try { await api('change-password.php', { method:'POST', body:{ current_password:current, new_password:next } }); sectionCache.delete('security'); sectionCache.delete('connections'); sectionCache.delete('overview-core'); showToast('Heslo bylo změněno.'); loadSecurity(true); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'enable-2fa') {
    if(action.dataset.hasPassword!=='1'){const provider=action.dataset.oauthProvider;if(!provider){showToast('Nejdříve připojte OAuth účet nebo nastavte heslo.','error');return;}location.assign('/account/api/oauth/start.php?mode=twofa_reauth&provider='+encodeURIComponent(provider));return;}
    const password=prompt('Pro potvrzení zadejte současné heslo:');if(password===null)return;
    try{showTotpSetup(await api('2fa/setup-start.php',{method:'POST',body:{password}}));}catch(error){showToast(error.message,'error');}return;
  }
  if (type === 'regenerate-2fa') {
    if(action.dataset.hasPassword!=='1'){const provider=action.dataset.oauthProvider;if(!provider){showToast('Nejdříve připojte OAuth účet nebo nastavte heslo.','error');return;}location.assign('/account/api/oauth/start.php?mode=twofa_reauth&twofa_action=regenerate&provider='+encodeURIComponent(provider));return;}
    const password=prompt('Zadejte současné heslo:');if(password===null)return;const code=prompt('Zadejte aktuální kód z aplikace:');if(code===null)return;
    try{const result=await api('2fa/recovery-regenerate.php',{method:'POST',body:{password,code}});showRecoveryCodes(result.recovery_codes||[]);}catch(error){showToast(error.message,'error');}return;
  }
  if (type === 'disable-2fa') {
    if(action.dataset.hasPassword!=='1'){const provider=action.dataset.oauthProvider;if(!provider){showToast('Nejdříve připojte OAuth účet nebo nastavte heslo.','error');return;}location.assign('/account/api/oauth/start.php?mode=twofa_reauth&twofa_action=disable&provider='+encodeURIComponent(provider));return;}
    if(!confirm('Opravdu chcete vypnout dvoufázové ověření? Ostatní zařízení budou odhlášena.'))return;const password=prompt('Zadejte současné heslo:');if(password===null)return;const code=prompt('Zadejte aktuální kód z aplikace:');if(code===null)return;
    try{await api('2fa/disable.php',{method:'POST',body:{password,code}});sectionCache.delete('security');sectionCache.delete('overview-core');showToast('Dvoufázové ověření bylo vypnuto.');loadSecurity(true);}catch(error){showToast(error.message,'error');}return;
  }
  if (type === 'export-data') {
    try { const response = await fetch('/account/api/export-data.php', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:'{}' }); if (!response.ok) throw new Error('Export se nepodařilo vytvořit.'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href=url; link.download='vevit-export.json'; link.click(); URL.revokeObjectURL(url); showToast('Export dat byl vytvořen.'); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'delete-account') {
    if ((prompt('Pro potvrzení napište SMAZAT:') || '') !== 'SMAZAT') return;
    const password = prompt('Současné heslo (OAuth účet může nechat prázdné):') ?? null; if (password === null) return;
    try { await api('delete-account.php', { method:'POST', body:{ confirmation:'SMAZAT', current_password:password } }); location.replace('/account/login'); } catch (error) { showToast(error.message, 'error'); }
  }
}

async function handleSettingsSubmit(event) {
  if (event.target.id !== 'notificationsForm' && event.target.id !== 'preferencesForm') return;
  event.preventDefault(); const form = event.target; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
  try {
    const body = form.id === 'notificationsForm' ? Object.fromEntries(['product_updates','marketing','billing_summary'].map((name) => [name, form.elements[name].checked])) : { timezone:form.elements.timezone.value, date_format:form.elements.date_format.value, week_starts_on:form.elements.week_starts_on.value };
    const endpoint = form.id === 'notificationsForm' ? 'notifications.php' : 'preferences.php'; const key = form.id === 'notificationsForm' ? 'notifications' : 'preferences';
    await api(endpoint, { method:'POST', body }); sectionCache.delete(key); showToast('Nastavení byla uložena.');
  } catch (error) { showToast(error.message, 'error'); } finally { button.disabled = false; }
}

function showBootError(message) {
  hide($('app'));
  $('bootErrorMessage').textContent = message;
  show($('bootError'));
}

async function boot() {
  try {
    const bootstrap = $('vv-bootstrap');
    currentUser = bootstrap ? JSON.parse(bootstrap.dataset.user || '{}') : null;
    if (!currentUser || typeof currentUser !== 'object') {
      const data = await api('me.php');
      currentUser = data.user;
    }
    hydrateIdentity(currentUser);
    wireEvents();
    show($('app'));
    const bootstrapRoute = bootstrap?.dataset.route || '';
    const initialRoute = bootstrapRoute in ROUTES
      ? bootstrapRoute
      : routeFromPath(location.pathname);
    syncRouteUi(initialRoute, false);
    loadSection(initialRoute);
  } catch (error) {
    console.error('Account boot failed', error);
    if (error.message === 'unauthorized') return;
    showBootError(
      error.name === 'AbortError'
        ? 'Načtení účtu trvá příliš dlouho. Zkuste stránku načíst znovu.'
        : 'Data účtu se nepodařilo načíst.'
    );
  }
}

$('retryBootBtn').addEventListener('click', () => location.reload());
boot();

}());
