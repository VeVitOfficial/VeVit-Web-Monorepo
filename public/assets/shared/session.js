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
    return { state: 'authenticated', user: payload.user, access: payload.access ?? null };
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

const RANK_LABELS = {
  novacek: 'Nováček', ucen: 'Učeň', pruzkumnik: 'Průzkumník', tvurce: 'Tvůrce', expert: 'Expert',
  mistr: 'Mistr', legenda: 'Legenda', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
  betatester: 'Betatester', partner: 'Partner', moderator: 'Moderátor', admin: 'Admin', owner: 'Owner',
};
const TIER_LABELS = { free: 'Free', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

function menuLink(href, label, hint) {
  const item = document.createElement('a');
  item.className = 'vv-session-menu__item';
  item.href = href;
  item.setAttribute('role', 'menuitem');
  item.tabIndex = -1;
  const text = document.createElement('span');
  text.textContent = label;
  item.append(text);
  if (hint) {
    const small = document.createElement('small');
    small.textContent = hint;
    item.append(small);
  }
  return item;
}

async function logout() {
  try {
    await fetch('/account/api/logout.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
    });
  } finally {
    window.location.reload();
  }
}

function renderAuthenticated(root, user, access) {
  clear(root);
  const name = displayName(user);
  const wrap = document.createElement('div');
  wrap.className = 'vv-session-wrap';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vv-session vv-session--authenticated';
  button.setAttribute('aria-haspopup', 'menu');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', `Účet: ${name}`);

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
  button.append(avatar, meta, chevron);

  const menu = document.createElement('div');
  menu.className = 'vv-session-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Účet');
  menu.hidden = true;

  const head = document.createElement('div');
  head.className = 'vv-session-menu__head';
  const headName = document.createElement('strong');
  headName.textContent = name;
  const headMeta = document.createElement('small');
  const level = Number(user.level) || 1;
  const xp = Number(user.xp) || 0;
  headMeta.textContent = `Level ${level} · ${xp.toLocaleString('cs-CZ')} XP`;
  head.append(headName, headMeta);
  const ranks = Array.isArray(access?.ranks) ? access.ranks : [];
  if (ranks.length) {
    const chips = document.createElement('span');
    chips.className = 'vv-session-menu__ranks';
    for (const key of ranks) {
      const chip = document.createElement('span');
      chip.textContent = RANK_LABELS[key] ?? key;
      chips.append(chip);
    }
    head.append(chips);
  }

  const tier = typeof access?.tier === 'string' ? access.tier : 'free';
  const permissions = Array.isArray(access?.permissions) ? access.permissions : [];
  const items = [
    menuLink('/account', 'Můj účet', 'Přehled, level a aktivita'),
    menuLink('/account/profile', 'Profil'),
    menuLink('/account/billing', 'Předplatné', tier === 'free' ? 'Vyzkoušet Premium' : TIER_LABELS[tier] ?? tier),
    menuLink('/account/security', 'Zabezpečení', '2FA, heslo, relace'),
    menuLink('/account/preferences', 'Předvolby'),
  ];
  if (permissions.includes('*') || permissions.includes('admin.console')) {
    items.push(menuLink('/account/admin', 'Konzole', 'Správa uživatelů a ranků'));
  }
  const separator = document.createElement('div');
  separator.className = 'vv-session-menu__sep';
  separator.setAttribute('role', 'separator');
  const out = document.createElement('button');
  out.type = 'button';
  out.className = 'vv-session-menu__item vv-session-menu__item--danger';
  out.setAttribute('role', 'menuitem');
  out.tabIndex = -1;
  out.textContent = 'Odhlásit se';
  out.addEventListener('click', () => {
    out.disabled = true;
    logout();
  });
  menu.append(head, ...items, separator, out);

  const focusables = () => Array.from(menu.querySelectorAll('[role="menuitem"]'));
  const setOpen = (open, focusFirst = false) => {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    wrap.classList.toggle('is-open', open);
    if (open && focusFirst) focusables()[0]?.focus();
  };
  button.addEventListener('click', () => setOpen(menu.hidden));
  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true, true);
    }
  });
  menu.addEventListener('keydown', (event) => {
    const list = focusables();
    const index = list.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      setOpen(false);
      button.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  });
  document.addEventListener('click', (event) => {
    if (!wrap.contains(event.target)) setOpen(false);
  });

  wrap.append(button, menu);
  root.append(wrap);
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
  if (result?.state === 'authenticated') renderAuthenticated(root, result.user, result.access);
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
