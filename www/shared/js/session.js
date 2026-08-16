let csrfToken = '';

const ME_ENDPOINT = '/account/api/me.php';

export function getCsrfToken() {
  return csrfToken;
}

export async function loadSession({ fetchImpl = globalThis.fetch } = {}) {
  try {
    const response = await fetchImpl(ME_ENDPOINT, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      csrfToken = '';
      return { state: 'anonymous' };
    }
    if (!response.ok) return { state: 'unavailable' };

    const payload = await response.json();
    if (
      payload?.authenticated !== true
      || !payload.user
      || typeof payload.csrf_token !== 'string'
      || payload.csrf_token === ''
    ) {
      return { state: 'unavailable' };
    }

    csrfToken = payload.csrf_token;
    return { state: 'authenticated', user: payload.user };
  } catch {
    return { state: 'unavailable' };
  }
}

function displayName(user) {
  for (const value of [user.full_name, user.nickname, user.email]) {
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return 'Účet VEVIT';
}

function initials(name) {
  return name.split(/\s+/u).filter(Boolean).slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('cs-CZ')).join('') || 'V';
}

export function avatarUrl(user) {
  if (typeof user?.avatar_url !== 'string' || user.avatar_url.trim() === '') return '';
  const value = user.avatar_url.trim();
  if (value.startsWith('storage:')) {
    return `/account/api/avatar.php?v=${encodeURIComponent(value)}`;
  }
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || url.origin === window.location.origin ? url.href : '';
  } catch {
    return '';
  }
}

function currentReturnTo(locationRef) {
  const path = `${locationRef.pathname || '/'}${locationRef.search || ''}${locationRef.hash || ''}`;
  return path.startsWith('/') && !path.startsWith('//') ? path : '/home';
}

function loginHref(locationRef) {
  const query = new URLSearchParams({ return_to: currentReturnTo(locationRef) });
  return `/account/login?${query.toString()}`;
}

function clear(root) {
  root.replaceChildren();
  root.removeAttribute('aria-busy');
}

function renderAuthenticated(root, user) {
  clear(root);
  const name = displayName(user);
  const link = document.createElement('a');
  link.className = 'vv-session vv-session--authenticated';
  link.href = '/account';
  link.setAttribute('aria-label', `Otevřít účet: ${name}`);

  const avatar = document.createElement('span');
  avatar.className = 'vv-session__avatar';
  const imageUrl = avatarUrl(user);
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    image.addEventListener('error', () => {
      image.remove();
      avatar.textContent = initials(name);
    }, { once: true });
    avatar.append(image);
  } else {
    avatar.textContent = initials(name);
  }
  const meta = document.createElement('span');
  meta.className = 'vv-session__meta';
  const label = document.createElement('strong');
  label.className = 'vv-session__name';
  label.textContent = name;
  const email = document.createElement('small');
  email.className = 'vv-session__email';
  email.textContent = typeof user.email === 'string' && user.email.trim() !== '' ? user.email.trim() : 'VeVit účet';
  const chevron = document.createElement('span');
  chevron.className = 'vv-session__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '⌄';
  meta.append(label, email);
  link.append(avatar, meta, chevron);
  root.append(link);
}

function renderAnonymous(root, locationRef) {
  clear(root);
  const link = document.createElement('a');
  link.className = 'vv-session vv-session--anonymous';
  link.href = loginHref(locationRef);
  link.textContent = 'Přihlásit se';
  root.append(link);
}

function renderUnavailable(root) {
  clear(root);
  const message = document.createElement('span');
  message.className = 'vv-session vv-session--unavailable';
  message.setAttribute('role', 'status');
  message.textContent = 'Přihlášení je dočasně nedostupné';
  root.append(message);
}

function renderLoading(root) {
  clear(root);
  root.setAttribute('aria-busy', 'true');
  const message = document.createElement('span');
  message.className = 'vv-session vv-session--loading';
  message.textContent = 'Ověřuji přihlášení…';
  root.append(message);
}

export function renderSessionResult(root, result, locationRef = window.location) {
  if (result?.state === 'authenticated') renderAuthenticated(root, result.user);
  else if (result?.state === 'anonymous') renderAnonymous(root, locationRef);
  else renderUnavailable(root);
}

export async function initSession({
  roots = document.querySelectorAll('[data-vevit-session]'),
  fetchImpl = globalThis.fetch,
  locationRef = window.location,
} = {}) {
  const targets = Array.from(roots);
  targets.forEach(renderLoading);
  const result = await loadSession({ fetchImpl });
  targets.forEach((root) => renderSessionResult(root, result, locationRef));
  window.dispatchEvent(new CustomEvent('vevit:sessionchange', { detail: result }));
  return result;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  // Klasické (nemodulové) legacy stránky mohou po vlastním rerenderu znovu
  // vykreslit pouze bezpečný vizuální stav; CSRF token zde záměrně nevystavujeme.
  window.VevitSessionView = { renderSessionResult };
  initSession();
}
