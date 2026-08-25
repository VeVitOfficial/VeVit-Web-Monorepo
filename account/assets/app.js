(function () {
'use strict';

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const show = (element) => element && element.removeAttribute('hidden');
const hide = (element) => element && element.setAttribute('hidden', '');

// i18n (account/assets/i18n.js — classic script, načten před app.js).
// Chybí-li globál (např. starý cache), fallback na identitu (cs).
const I18N = window.VVAccountI18n || {
  t: (k, v) => k, tp: (k, n) => k, tz: (z) => z, lang: () => 'cs', intlLocale: () => 'cs-CZ',
};
const t = I18N.t;
const tp = I18N.tp;
const tz = I18N.tz;
const intlLocale = I18N.intlLocale;

// ROUTES: title/description přes t() se řeší lokálně při renderu
// (syncRouteUi); zde jen cesty (jazykově neutrální).
const ROUTES = {
  overview: { path: '/account', titleKey: 'nav.overview', descKey: 'route.overview.desc' },
  profile: { path: '/account/profile', titleKey: 'nav.profile', descKey: 'route.profile.desc' },
  security: { path: '/account/security', titleKey: 'nav.security', descKey: 'route.security.desc' },
  billing: { path: '/account/billing', titleKey: 'nav.billing', descKey: 'route.billing.desc' },
  connections: { path: '/account/connections', titleKey: 'nav.connections', descKey: 'route.connections.desc' },
  notifications: { path: '/account/notifications', titleKey: 'nav.notifications', descKey: 'route.notifications.desc' },
  preferences: { path: '/account/preferences', titleKey: 'nav.preferences', descKey: 'route.preferences.desc' },
  privacy: { path: '/account/privacy', titleKey: 'nav.privacy', descKey: 'route.privacy.desc' },
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
let sharedGetCsrfToken = () => '';

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
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    options.headers['X-CSRF-Token'] = sharedGetCsrfToken();
  }
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
      const error = new Error(payload?.error || t('error.requestFailed'));
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
  return initials.toLocaleUpperCase(intlLocale());
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
  const name = user.full_name || user.nickname || t('name.fallback');
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
    showToast(t('avatar.invalidType'), 'error');
    return;
  }
  const uploadTrigger = $('avatarUploadTrigger');
  const removeButton = $('avatarRemoveBtn');
  const temporaryUrl = URL.createObjectURL(file);
  $('profAvatar').src = temporaryUrl; $('profAvatar').hidden = false; $('profInitials').hidden = true;
  uploadTrigger.disabled = true; uploadTrigger.setAttribute('aria-busy', 'true'); uploadTrigger.setAttribute('aria-label', t('profile.uploadingAria')); removeButton.disabled = true;
  try {
    const form = new FormData(); form.append('avatar', file);
    const response = await fetch('/account/api/avatar-upload.php', { method: 'POST', credentials: 'same-origin', body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || t('avatar.uploadFailed'));
    currentUser = { ...currentUser, avatar_url: payload.avatar_url || '' };
    hydrateIdentity(currentUser); showToast(t('avatar.uploaded'));
  } catch (error) {
    console.error('Avatar upload failed', error);
    hydrateIdentity(currentUser); showToast(error.message || t('avatar.uploadFailed'), 'error');
  } finally {
    URL.revokeObjectURL(temporaryUrl); uploadTrigger.disabled = false; uploadTrigger.removeAttribute('aria-busy'); uploadTrigger.setAttribute('aria-label', t('profile.changePhotoAria'));
    $('avatarUploadInput').value = '';
  }
}

async function removeAvatar() {
  if (!currentUser?.avatar_url || !confirm(t('avatar.removeConfirm'))) return;
  const button = $('avatarRemoveBtn'); button.disabled = true; button.textContent = t('avatar.removing');
  try {
    await api('avatar-remove.php', { method: 'POST', body: {} });
    currentUser = { ...currentUser, avatar_url: '' }; hydrateIdentity(currentUser); showToast(t('avatar.removed'));
  } catch (error) { showToast(error.message || t('avatar.removeFailed'), 'error'); }
  finally { button.textContent = t('profile.removeBtn'); hydrateIdentity(currentUser); }
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
  $('sectionTitle').textContent = t(route.titleKey);
  $('sectionDescription').textContent = t(route.descKey);
  document.title = t(route.titleKey) + ' · ' + t('doc.sectionSuffix');
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
  return local && domain ? local.slice(0, 2) + '•••@' + domain : t('email.unavailable');
}
function setSectionHtml(id, html, state = 'success') { const host = $(id); host.dataset.state = state; host.innerHTML = html; }
function sectionError(id, message, retry) { setSectionHtml(id, `<div class="card state-card state-card--error"><span class="state-card__icon">!</span><div><strong>${escapeHtml(t('state.errorTitle'))}</strong><p>${escapeHtml(message)}</p></div><button class="btn btn--ghost btn--sm" type="button" data-retry="${retry}">${escapeHtml(t('action.retry'))}</button></div>`, 'error'); }

async function loadSecurity(force = false) {
  const host = $('securityState'); if (!force && sectionCache.has('security')) { renderSecuritySection(sectionCache.get('security')); return; }
  try {
    const [sessions, overview, connections, twofa] = await Promise.all([api('sessions-list.php'), api('account-overview.php'), api('connections.php'), api('2fa/status.php')]);
    const data = { sessions, overview, connections, twofa }; sectionCache.set('security', data); renderSecuritySection(data);
    const reauth=new URLSearchParams(location.search).get('twofa_reauth');
    if(reauth){const reauthAction=new URLSearchParams(location.search).get('twofa_action')||'setup';history.replaceState({section:'security'},'',ROUTES.security.path);try{if(reauthAction==='setup')showTotpSetup(await api('2fa/setup-start.php',{method:'POST',body:{reauth_challenge:reauth}}));else{const code=prompt(t('security.promptReauthCode'));if(code===null)return;const endpoint=reauthAction==='disable'?'2fa/disable.php':'2fa/recovery-regenerate.php';const result=await api(endpoint,{method:'POST',body:{reauth_challenge:reauth,code}});if(reauthAction==='disable'){showToast(t('security.2faDisabled'));sectionCache.delete('security');loadSecurity(true);}else showRecoveryCodes(result.recovery_codes||[]);}}catch(error){showToast(error.message,'error');}}
  } catch (error) { console.error('Security load failed', error); sectionError('securityState', t('security.loadFailed'), 'security'); }
}
function renderSecuritySection(data) {
  const hasPassword = Boolean(data.connections?.has_password); const sessions = data.sessions?.sessions || []; const last = data.overview?.security?.last_password_change;
  const twofa = data.twofa || {}; const recoveryRemaining = Number(twofa.recovery_codes_remaining) || 0; const twofaCard = twofa.enabled
    ? `<article class="card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('security.2faTitle'))}</h2><p><span class="status-badge">${escapeHtml(t('security.2faActive'))}</span> · ${escapeHtml(t('security.2faEnabledPrefix'))} ${escapeHtml(formatDate(twofa.enabled_at))} · ${escapeHtml(tp('security.2faRecoveryRemaining', recoveryRemaining, { n: recoveryRemaining }))}</p></div><div class="button-row"><button class="btn btn--ghost btn--sm" type="button" data-action="regenerate-2fa" data-has-password="${hasPassword?'1':'0'}" data-oauth-provider="${escapeHtml(Object.keys(data.connections?.connections||{})[0]||'')}">${escapeHtml(t('security.regenerate2fa'))}</button><button class="btn btn--warn btn--sm" type="button" data-action="disable-2fa" data-has-password="${hasPassword?'1':'0'}" data-oauth-provider="${escapeHtml(Object.keys(data.connections?.connections||{})[0]||'')}">${escapeHtml(t('security.disable2fa'))}</button></div></div></article>`
    : `<article class="card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('security.2faTitle'))}</h2><p>${escapeHtml(t('security.2faDisabledDesc'))}</p></div><button class="btn btn--primary btn--sm" type="button" data-action="enable-2fa" data-has-password="${hasPassword?'1':'0'}" data-oauth-provider="${escapeHtml(Object.keys(data.connections?.connections||{})[0]||'')}">${escapeHtml(t('security.enable2fa'))}</button></div></article>`;
  const rows = sessions.length ? sessions.map((session) => `<div class="settings-row"><div><strong>${escapeHtml(session.device || t('security.webDevice'))}${session.is_current ? ' <span class="status-badge status-badge--current">' + escapeHtml(t('security.currentDevice')) + '</span>' : ''}</strong><p>${escapeHtml(session.ip_address || t('security.ipUnspecified'))} · ${escapeHtml(t('security.sessionCreated'))} ${escapeHtml(formatDateTime(session.created_at))} · ${escapeHtml(t('security.sessionActive'))} ${escapeHtml(formatDateTime(session.last_seen_at))} · ${escapeHtml(t('security.sessionValidUntil'))} ${escapeHtml(formatDateTime(session.expires_at))}</p></div>${session.is_current ? '' : `<button class="btn btn--ghost btn--sm" type="button" data-action="revoke-session" data-session-id="${escapeHtml(session.id)}">${escapeHtml(t('security.revokeSession'))}</button>`}</div>`).join('') : `<div class="state-card state-card--empty"><span class="state-card__icon">○</span><div><strong>${escapeHtml(t('security.noOtherSessions'))}</strong><p>${escapeHtml(t('security.sessionsEmptyDesc'))}</p></div></div>`;
  setSectionHtml('securityState', `<article class="card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('security.passwordTitle'))}</h2><p>${hasPassword ? escapeHtml(t('security.passwordSet')) : escapeHtml(t('security.passwordNotSet'))}</p></div><button class="btn btn--primary btn--sm" type="button" data-action="change-password">${escapeHtml(hasPassword ? t('security.changePassword') : t('security.setPassword'))}</button></div><p class="field-hint">${last ? escapeHtml(t('security.lastPasswordChangePrefix')) + ' ' + escapeHtml(formatDate(last)) : escapeHtml(t('security.noPasswordChange'))}</p></article>${twofaCard}<article class="card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('security.sessionsTitle'))}</h2><p>${escapeHtml(tp('security.sessionsCount', sessions.length, { n: sessions.length }))}</p></div>${sessions.length > 1 ? '<button class="btn btn--ghost btn--sm" type="button" data-action="revoke-others">' + escapeHtml(t('security.revokeOthers')) + '</button>' : ''}</div><div class="settings-list">${rows}</div></article>`);
}

function closeTotpOverlay() { document.getElementById('totpOverlay')?.remove(); }

function showConfirmDialog({ title, message, confirmLabel, dangerous = false }) {
  return new Promise((resolve) => {
    document.getElementById('vvConfirmDialog')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'vvConfirmDialog';
    overlay.className = 'overlay';
    const okLabel = confirmLabel || t('action.confirm');
    overlay.innerHTML = `<div class="modal${dangerous ? ' modal--danger' : ''}" role="dialog" aria-modal="true" aria-labelledby="vvConfirmTitle"><h2 class="modal-title" id="vvConfirmTitle">${escapeHtml(title)}</h2><p class="modal-sub">${escapeHtml(message)}</p><div class="modal-actions"><button class="btn btn--ghost" type="button" id="vvConfirmCancel">${escapeHtml(t('action.cancel'))}</button><button class="btn ${dangerous ? 'btn--warn' : 'btn--primary'}" type="button" id="vvConfirmOk">${escapeHtml(okLabel)}</button></div></div>`;
    document.body.append(overlay);
    const close = (result) => { overlay.remove(); resolve(result); };
    overlay.querySelector('#vvConfirmCancel').addEventListener('click', () => close(false));
    overlay.querySelector('#vvConfirmOk').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    overlay.querySelector('#vvConfirmOk').focus();
  });
}
function showRecoveryCodes(codes) {
  closeTotpOverlay(); const overlay=document.createElement('div'); overlay.id='totpOverlay'; overlay.className='overlay';
  overlay.innerHTML=`<div class="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="recoveryTitle"><h2 class="modal-title" id="recoveryTitle">${escapeHtml(t('recovery.title'))}</h2><p class="modal-sub">${escapeHtml(t('recovery.desc'))}</p><div class="codes">${codes.map((code)=>`<code class="code">${escapeHtml(code)}</code>`).join('')}</div><div class="modal-actions"><button class="btn btn--ghost" type="button" id="copyRecovery">${escapeHtml(t('recovery.copy'))}</button><button class="btn btn--ghost" type="button" id="downloadRecovery">${escapeHtml(t('recovery.download'))}</button></div><label class="settings-toggle"><input id="recoverySaved" type="checkbox"><span>${escapeHtml(t('recovery.savedConfirm'))}</span></label><button class="btn btn--primary" id="closeRecovery" type="button" disabled>${escapeHtml(t('recovery.done'))}</button></div>`;
  document.body.append(overlay); const text=codes.join('\n');
  overlay.querySelector('#copyRecovery').onclick=()=>navigator.clipboard.writeText(text).then(()=>showToast(t('recovery.copied')));
  overlay.querySelector('#downloadRecovery').onclick=()=>{const url=URL.createObjectURL(new Blob([t('recovery.fileHeader')+'\\n\\n'+text+'\\n'],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='vevit-recovery-codes.txt';a.click();URL.revokeObjectURL(url)};
  overlay.querySelector('#recoverySaved').onchange=(e)=>{overlay.querySelector('#closeRecovery').disabled=!e.target.checked};
  overlay.querySelector('#closeRecovery').onclick=()=>{closeTotpOverlay();sectionCache.delete('security');sectionCache.delete('overview-core');loadSecurity(true)};
}
function showTotpSetup(data) {
  closeTotpOverlay(); const overlay=document.createElement('div'); overlay.id='totpOverlay'; overlay.className='overlay';
  overlay.innerHTML=`<form class="modal modal--wide" id="totpSetupForm" role="dialog" aria-modal="true" aria-labelledby="totpSetupTitle"><h2 class="modal-title" id="totpSetupTitle">${escapeHtml(t('totp.title'))}</h2><p class="modal-sub">${escapeHtml(t('totp.desc'))}</p><img class="qr" src="${escapeHtml(data.qr_code)}" alt="${escapeHtml(t('totp.qrAlt'))}"><p class="modal-hint">${escapeHtml(t('totp.manualKey'))} <strong>${escapeHtml(data.secret)}</strong></p><label for="totpSetupCode">${escapeHtml(t('totp.codeLabel'))}</label><input class="input" id="totpSetupCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required><p class="field-error" id="totpSetupError" role="alert"></p><div class="modal-actions"><button class="btn btn--ghost" type="button" id="cancelTotp">${escapeHtml(t('action.cancel'))}</button><button class="btn btn--primary" type="submit">${escapeHtml(t('totp.verifyAndEnable'))}</button></div></form>`;
  document.body.append(overlay); overlay.querySelector('#cancelTotp').onclick=closeTotpOverlay;
  overlay.querySelector('#totpSetupForm').onsubmit=async(e)=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{const result=await api('2fa/setup-confirm.php',{method:'POST',body:{challenge:data.challenge,code:overlay.querySelector('#totpSetupCode').value}});showRecoveryCodes(result.recovery_codes||[])}catch(error){overlay.querySelector('#totpSetupError').textContent=error.message;button.disabled=false}};
  overlay.querySelector('#totpSetupCode').focus();
}

async function loadBilling(force = false) {
  try { const data = !force && sectionCache.has('billing') ? sectionCache.get('billing') : await api('subscription.php'); sectionCache.set('billing', data); const subscription = data.subscription; const body = subscription ? `<strong class="metric-value">${escapeHtml(subscription.tier)}</strong><p class="overview-detail">${escapeHtml(subscriptionStatus(subscription.status))} · ${escapeHtml(formatDate(subscription.started_at))}${subscription.expires_at ? ' · ' + escapeHtml(t('billing.renewal')) + ' ' + escapeHtml(formatDate(subscription.expires_at)) : ''}</p>` : `<strong class="metric-value">${escapeHtml(t('billing.noSubscription'))}</strong><p class="overview-detail">${escapeHtml(t('billing.freeTier'))}</p>`; setSectionHtml('billingState', `<article class="card"><div class="card-heading"><div><h2>${escapeHtml(t('billing.currentTier'))}</h2><p>${escapeHtml(t('billing.currentTierDesc'))}</p></div></div>${body}</article><article class="card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('billing.availableTiers'))}</h2><p>${escapeHtml(t('billing.availableDesc'))}</p></div><button class="btn btn--ghost btn--sm" disabled>${escapeHtml(t('billing.comingSoon'))}</button></div></article><article class="card"><div class="card-heading"><div><h2>${escapeHtml(t('billing.invoicesTitle'))}</h2><p>${escapeHtml(t('billing.noInvoices'))}</p></div></div></article>`); } catch (error) { sectionError('billingState', t('billing.loadFailed'), 'billing'); }
}

async function loadConnections(force = false) {
  try { const data = !force && sectionCache.has('connections') ? sectionCache.get('connections') : await api('connections.php'); sectionCache.set('connections', data); const cards = ['google','github','discord'].map((provider) => { const connection = data.connections?.[provider]; return `<article class="card connection-card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(provider[0].toUpperCase()+provider.slice(1))}</h2><p>${connection ? escapeHtml(t('conn.connected')) + ' · ' + escapeHtml(maskEmail(connection.provider_email)) + ' · ' + escapeHtml(formatDate(connection.created_at)) : escapeHtml(t('conn.notConnected'))}</p></div>${connection ? `<button class="btn btn--ghost btn--sm" type="button" data-action="disconnect-provider" data-provider="${provider}">${escapeHtml(t('conn.disconnect'))}</button>` : `<button class="btn btn--primary btn--sm" type="button" data-action="connect-provider" data-provider="${provider}">${escapeHtml(t('conn.connect'))}</button>`}</div></article>`; }).join(''); setSectionHtml('connectionsState', `<div class="settings-cards">${cards}</div>`); } catch (error) { sectionError('connectionsState', t('conn.loadFailed'), 'connections'); }
}

async function loadNotifications(force = false) {
  try { const data = !force && sectionCache.has('notifications') ? sectionCache.get('notifications') : await api('notifications.php'); sectionCache.set('notifications', data); const p = data.prefs || {}; setSectionHtml('notificationsState', `<form class="card settings-form" id="notificationsForm"><div class="card-heading"><div><h2>${escapeHtml(t('notif.securityTitle'))}</h2><p>${escapeHtml(t('notif.securityDesc'))}</p></div></div><label class="settings-toggle"><input type="checkbox" checked disabled><span>${escapeHtml(t('notif.securityToggle'))}</span></label><div class="card-heading"><div><h2>${escapeHtml(t('notif.productTitle'))}</h2><p>${escapeHtml(t('notif.productDesc'))}</p></div></div><label class="settings-toggle"><input name="product_updates" type="checkbox" ${p.product_updates ? 'checked' : ''}><span>${escapeHtml(t('notif.productUpdates'))}</span></label><label class="settings-toggle"><input name="marketing" type="checkbox" ${p.marketing ? 'checked' : ''}><span>${escapeHtml(t('notif.marketing'))}</span></label><label class="settings-toggle"><input name="billing_summary" type="checkbox" ${p.billing_summary ? 'checked' : ''}><span>${escapeHtml(t('notif.billingSummary'))}</span></label><div class="form-actions"><button class="btn btn--primary" type="submit">${escapeHtml(t('action.saveSettings'))}</button></div></form>`); } catch (error) { sectionError('notificationsState', t('notif.loadFailed'), 'notifications'); }
}

async function loadPreferences(force = false) {
  try { const data = !force && sectionCache.has('preferences') ? sectionCache.get('preferences') : await api('preferences.php'); sectionCache.set('preferences', data); const p = data.preferences || {}; const language = currentUser?.language || 'cs'; const languages = [['cs','Čeština'],['de','Deutsch'],['es','Español'],['uk','Українська'],['fr','Français'],['sk','Slovenčina']]; const zoneValues = ['Europe/Prague','Europe/Bratislava','Europe/Berlin','Europe/Madrid','Europe/Paris','Europe/Kyiv','Europe/London','America/New_York','America/Los_Angeles','Asia/Tokyo','Australia/Sydney','UTC']; const languageOptions = languages.map(([value,label]) => `<option value="${value}" ${language === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join(''); const timezoneOptions = zoneValues.map((value) => `<option value="${value}" ${p.timezone === value ? 'selected' : ''}>${escapeHtml(tz(value))} (${escapeHtml(value)})</option>`).join(''); setSectionHtml('preferencesState', `<form class="card settings-form" id="preferencesForm"><div class="card-heading"><div><h2>${escapeHtml(t('prefs.title'))}</h2><p>${escapeHtml(t('prefs.desc'))}</p></div></div><div class="form-grid"><div class="form-field"><label for="prefLanguage">${escapeHtml(t('prefs.language'))}</label><select class="input" id="prefLanguage" name="language">${languageOptions}</select></div><div class="form-field"><label for="prefTimezone">${escapeHtml(t('prefs.timezone'))}</label><select class="input" id="prefTimezone" name="timezone">${timezoneOptions}</select></div><div class="form-field"><label for="prefDateFormat">${escapeHtml(t('prefs.dateFormat'))}</label><select class="input" id="prefDateFormat" name="date_format"><option ${p.date_format === 'DD. MM. YYYY' ? 'selected' : ''}>DD. MM. YYYY</option><option ${p.date_format === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option></select></div><div class="form-field"><label for="prefWeek">${escapeHtml(t('prefs.weekStart'))}</label><select class="input" id="prefWeek" name="week_starts_on"><option value="monday" ${p.week_starts_on === 'monday' ? 'selected' : ''}>${escapeHtml(t('prefs.monday'))}</option><option value="sunday" ${p.week_starts_on === 'sunday' ? 'selected' : ''}>${escapeHtml(t('prefs.sunday'))}</option></select></div></div><div class="form-actions"><button class="btn btn--primary" type="submit">${escapeHtml(t('action.saveSettings'))}</button></div></form>`); } catch (error) { sectionError('preferencesState', t('prefs.loadFailed'), 'preferences'); }
}

function loadPrivacy() { setSectionHtml('privacyState', `<article class="card"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('privacy.exportTitle'))}</h2><p>${escapeHtml(t('privacy.exportDesc'))}</p></div><button class="btn btn--primary btn--sm" type="button" data-action="export-data">${escapeHtml(t('privacy.exportAction'))}</button></div></article><article class="card card--danger"><div class="card-heading card-heading--split"><div><h2>${escapeHtml(t('privacy.deleteTitle'))}</h2><p>${escapeHtml(t('privacy.deleteDesc'))}</p></div><button class="btn btn--warn btn--sm" type="button" data-action="delete-account">${escapeHtml(t('privacy.deleteAction'))}</button></div></article>`); }

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
  title.textContent = t('state.errorTitle');
  const detail = document.createElement('p');
  detail.textContent = message;
  copy.append(title, detail);

  const retry = document.createElement('button');
  retry.className = 'btn btn--ghost btn--sm';
  retry.type = 'button';
  retry.dataset.retry = retryKey;
  retry.textContent = t('action.retry');
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
  label.textContent = t('overview.completed');
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
    ? t('overview.missingPrefix') + ' ' + profile.missing.join(', ') + '.'
    : t('overview.profileComplete');
  const actions = document.createElement('div');
  actions.className = 'overview-actions';
  actions.append(actionLink(profile.missing?.length ? t('overview.completeProfile') : t('overview.viewProfile'), 'profile'));
  host.append(metric, track, detail, actions);
}

function formatDate(value) {
  if (!value) return t('date.unspecified');
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t('date.unspecified')
    : new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium' }).format(date);
}

function formatDateTime(value) {
  if (!value) return t('date.unspecified');
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? t('date.unspecified')
    : new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function renderSecurityOverview(security) {
  const host = $('overviewSecurityState').querySelector('.state-host');
  host.dataset.state = 'success';
  host.replaceChildren();
  const metric = document.createElement('div');
  metric.className = 'metric-row';
  const value = document.createElement('strong');
  value.className = 'metric-value';
  value.textContent = security.two_factor_enabled ? t('overview.2faOn') : t('overview.2faOff');
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = tp('overview.activeSessions', Number(security.active_sessions) || 0, { n: Number(security.active_sessions) || 0 });
  metric.append(value, label);
  const detail = document.createElement('p');
  detail.className = 'overview-detail';
  detail.textContent = security.last_password_change
    ? t('overview.lastPasswordChangePrefix') + ' ' + formatDate(security.last_password_change) + '.'
    : t('overview.noPasswordChange');
  const actions = document.createElement('div');
  actions.className = 'overview-actions';
  actions.append(actionLink(security.two_factor_enabled ? t('overview.manageSecurity') : t('overview.secureAccount'), 'security'));
  host.append(metric, detail, actions);
}

const ACTIVITY_LABELS = {
  login: ['activity.login', '↗'],
  password_change: ['activity.password_change', '◇'],
  profile_update: ['activity.profile_update', '○'],
  session_revoke: ['activity.session_revoke', '×'],
  connection: ['activity.connection', '↗'],
  subscription: ['activity.subscription', '▱'],
  invoice: ['activity.invoice', '▤'],
};

function renderActivity(activities) {
  const host = $('overviewActivityState');
  if (!activities.length) {
    renderEmpty(host, t('activity.emptyTitle'), t('activity.emptyDesc'));
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
    const [labelKey, iconText] = ACTIVITY_LABELS[activity.kind] || ['activity.default', '•'];
    icon.textContent = iconText;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = t(labelKey);
    const detail = document.createElement('p');
    detail.textContent = activity.detail || t('activity.defaultDetail');
    copy.append(title, detail);
    const time = document.createElement('time');
    time.dateTime = activity.created_at || '';
    time.textContent = formatDate(activity.created_at);
    row.append(icon, copy, time);
    host.append(row);
  });
}

function subscriptionStatus(status) {
  const known = ['active', 'trialing', 'past_due', 'canceling', 'canceled'];
  return known.includes(status) ? t('sub.' + status) : t('sub.none');
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
    value.textContent = t('overview.noSubscriptionValue');
    metric.append(value);
    const detail = document.createElement('p');
    detail.className = 'overview-detail';
    detail.textContent = t('overview.noSubscriptionDesc');
    const actions = document.createElement('div');
    actions.className = 'overview-actions';
    actions.append(actionLink(t('overview.chooseTier'), 'billing'));
    host.append(metric, detail, actions);
    return;
  }

  host.dataset.state = 'success';
  host.replaceChildren();
  const metric = document.createElement('div');
  metric.className = 'metric-row';
  const value = document.createElement('strong');
  value.className = 'metric-value';
  value.textContent = subscription.tier || t('overview.tierDefault');
  const label = document.createElement('span');
  label.className = 'metric-label';
  label.textContent = subscriptionStatus(subscription.status);
  metric.append(value, label);
  const price = data?.price?.price_czk ?? subscription.price;
  const interval = subscription.billing_cycle === 'yearly' ? t('billing.year') : t('billing.month');
  const detail = document.createElement('p');
  detail.className = 'overview-detail';
  detail.textContent = [
    price !== null && price !== undefined ? String(price) + ' Kč / ' + interval : '',
    subscription.expires_at ? t('overview.nextPeriodPrefix') + ' ' + formatDate(subscription.expires_at) : '',
  ].filter(Boolean).join(' · ') || t('overview.billingUnavailable');
  const actions = document.createElement('div');
  actions.className = 'overview-actions';
  actions.append(actionLink(t('overview.manageSubscription'), 'billing'));
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
    renderSectionError(profileHost, t('overview.profileSummaryFailed'), 'overview-core');
    renderSectionError(securityHost, t('overview.securitySummaryFailed'), 'overview-core');
    renderSectionError(activityHost, t('overview.activityFailed'), 'overview-core');
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
    renderSectionError(host, t('billing.loadFailed'), 'subscription');
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
  if (name.length < 2) errors.full_name = t('profile.errorFullName');
  if (!/^[a-z0-9_.]{3,30}$/i.test(nickname)) {
    errors.nickname = t('profile.errorNicknameFormat');
  } else if (!nicknameAvailable && nickname !== profileOriginal.nickname) {
    errors.nickname = t('profile.errorNicknameTaken');
  }
  profileErrors = errors;
  $('fullNameError').textContent = errors.full_name || '';
  $('nicknameError').textContent = nicknamePending ? t('profile.checkingAvailability') : (errors.nickname || '');
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
        profileErrors.nickname = t('profile.nicknameCheckFailed');
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
  $('profileSaveStatus').textContent = submitting ? t('profile.saving') : '';
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
    showToast(t('profile.saved'));
  } catch (error) {
    console.error('Profile save failed', error);
    if (error.field === 'nickname') {
      nicknameAvailable = false;
      validateProfile();
    }
    showToast(error.message || t('profile.saveFailed'), 'error');
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
    if (!confirm(t('conn.disconnectConfirm'))) return;
    try { await api('connections-disconnect.php', { method:'POST', body:{ provider: action.dataset.provider } }); sectionCache.delete('connections'); showToast(t('conn.disconnected')); loadConnections(true); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'revoke-session' || type === 'revoke-others') {
    let confirmed;
    if (type === 'revoke-others') {
      confirmed = await showConfirmDialog({
        title: t('security.revokeOthersTitle'),
        message: t('security.revokeOthersMessage'),
        confirmLabel: t('security.revokeOthers'),
        dangerous: true,
      });
    } else {
      confirmed = confirm(t('security.revokeOneConfirm'));
    }
    if (!confirmed) return;
    try { await api('sessions-revoke.php', { method:'POST', body:type === 'revoke-others' ? { all_others:true } : { session_id: action.dataset.sessionId } }); sectionCache.delete('security'); sectionCache.delete('overview-core'); showToast(t('security.sessionRevoked')); loadSecurity(true); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'change-password') {
    const current = prompt(t('security.promptCurrentPassword')) ?? null; if (current === null) return;
    const next = prompt(t('security.promptNewPassword')) ?? null; if (next === null) return;
    const confirmPassword = prompt(t('security.promptConfirmPassword')) ?? null; if (confirmPassword !== next) { showToast(t('security.passwordMismatch'), 'error'); return; }
    try { await api('change-password.php', { method:'POST', body:{ current_password:current, new_password:next } }); sectionCache.delete('security'); sectionCache.delete('connections'); sectionCache.delete('overview-core'); showToast(t('security.passwordChanged')); loadSecurity(true); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'enable-2fa') {
    if(action.dataset.hasPassword!=='1'){const provider=action.dataset.oauthProvider;if(!provider){showToast(t('security.needOAuthOrPassword'),'error');return;}location.assign('/account/api/oauth/start.php?mode=twofa_reauth&provider='+encodeURIComponent(provider));return;}
    const password=prompt(t('security.promptConfirmCurrent'));if(password===null)return;
    try{showTotpSetup(await api('2fa/setup-start.php',{method:'POST',body:{password}}));}catch(error){showToast(error.message,'error');}return;
  }
  if (type === 'regenerate-2fa') {
    if(action.dataset.hasPassword!=='1'){const provider=action.dataset.oauthProvider;if(!provider){showToast(t('security.needOAuthOrPassword'),'error');return;}location.assign('/account/api/oauth/start.php?mode=twofa_reauth&twofa_action=regenerate&provider='+encodeURIComponent(provider));return;}
    const password=prompt(t('security.promptConfirmCurrent'));if(password===null)return;const code=prompt(t('security.promptTotpCode'));if(code===null)return;
    try{const result=await api('2fa/recovery-regenerate.php',{method:'POST',body:{password,code}});showRecoveryCodes(result.recovery_codes||[]);}catch(error){showToast(error.message,'error');}return;
  }
  if (type === 'disable-2fa') {
    if(action.dataset.hasPassword!=='1'){const provider=action.dataset.oauthProvider;if(!provider){showToast(t('security.needOAuthOrPassword'),'error');return;}location.assign('/account/api/oauth/start.php?mode=twofa_reauth&twofa_action=disable&provider='+encodeURIComponent(provider));return;}
    if(!confirm(t('security.disable2faConfirm')))return;const password=prompt(t('security.promptConfirmCurrent'));if(password===null)return;const code=prompt(t('security.promptTotpCode'));if(code===null)return;
    try{await api('2fa/disable.php',{method:'POST',body:{password,code}});sectionCache.delete('security');sectionCache.delete('overview-core');showToast(t('security.2faDisabled'));loadSecurity(true);}catch(error){showToast(error.message,'error');}return;
  }
  if (type === 'export-data') {
    try { const response = await fetch('/account/api/export-data.php', { method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:'{}' }); if (!response.ok) throw new Error(t('privacy.exportFailed')); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href=url; link.download='vevit-export.json'; link.click(); URL.revokeObjectURL(url); showToast(t('privacy.exported')); } catch (error) { showToast(error.message, 'error'); } return;
  }
  if (type === 'delete-account') {
    if ((prompt(t('privacy.deleteConfirmPrompt')) || '') !== 'SMAZAT') return;
    const password = prompt(t('privacy.deletePasswordPrompt')) ?? null; if (password === null) return;
    try { await api('delete-account.php', { method:'POST', body:{ confirmation:'SMAZAT', current_password:password } }); location.replace('/account/login'); } catch (error) { showToast(error.message, 'error'); }
  }
}

async function handleSettingsSubmit(event) {
  if (event.target.id !== 'notificationsForm' && event.target.id !== 'preferencesForm') return;
  event.preventDefault(); const form = event.target; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
  try {
    const body = form.id === 'notificationsForm' ? Object.fromEntries(['product_updates','marketing','billing_summary'].map((name) => [name, form.elements[name].checked])) : { timezone:form.elements.timezone.value, date_format:form.elements.date_format.value, week_starts_on:form.elements.week_starts_on.value };
    const endpoint = form.id === 'notificationsForm' ? 'notifications.php' : 'preferences.php'; const key = form.id === 'notificationsForm' ? 'notifications' : 'preferences';
    await api(endpoint, { method:'POST', body });
    if (form.id === 'preferencesForm' && form.elements.language.value !== currentUser.language) {
      const result = await api('profile-update.php', { method:'PATCH', body:{ language:form.elements.language.value } });
      currentUser = result.user;
      // Základní jazyk (base) uložen do DB → dispatch event. localization.js
      // aktualizuje pill na {newBase, en} a přesměruje na /<newBase>/<sekci>/
      // (cross-device, zachová SPA sub-route). EN nemůže být base (nabídka
      // ho neobsahuje), defenzivně fallback na cs.
      const base = currentUser.language === 'en' ? 'cs' : currentUser.language;
      window.dispatchEvent(new CustomEvent('vevit:locale-basechange', { detail:{ locale: base } }));
      return;
    }
    sectionCache.delete(key); showToast(t('notif.saved'));
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
    const session = await import('/assets/shared/session.js?v=20260809c');
    await import('/assets/shared/app-switcher.js?v=20260809b');
    sharedGetCsrfToken = session.getCsrfToken;
    const result = await session.loadSession();
    if (result.state === 'anonymous') {
      location.replace('/account/login');
      return;
    }
    if (result.state !== 'authenticated') {
      throw new Error('session_unavailable');
    }
    currentUser = result.user;
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
        ? t('boot.timeout')
        : t('boot.loadFailed')
    );
  }
}

$('retryBootBtn').addEventListener('click', () => location.reload());
boot();

}());
