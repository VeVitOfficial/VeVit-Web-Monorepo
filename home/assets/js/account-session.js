(() => {
  'use strict';

  const ACCOUNT_ORIGIN = '';
  const ME_ENDPOINT = '/api/auth/me.php';
  const LOGOUT_ENDPOINT = '/api/auth/logout.php';
  const TRUSTED_RETURN_HOSTS = new Set([
    'vevit.cz',
    'www.vevit.cz',
    'vevit.cz',
    'app.vevit.cz',
  ]);
  let csrfToken = '';

  const clear = (root) => {
    root.replaceChildren();
  };

  const link = (label, href, className = '') => {
    const element = document.createElement('a');
    element.textContent = label;
    element.href = href;
    if (className) element.className = className;
    return element;
  };

  const button = (label, className = '') => {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    if (className) element.className = className;
    return element;
  };

  const loginUrl = () => {
    const url = new URL('/login.html', ACCOUNT_ORIGIN);
    if (window.location.protocol === 'https:' && TRUSTED_RETURN_HOSTS.has(window.location.hostname)) {
      url.searchParams.set('next', window.location.href);
    }
    return url.toString();
  };

  const safeAvatarUrl = (value) => {
    if (typeof value !== 'string' || value === '') return '';
    try {
      const url = new URL(value, ACCOUNT_ORIGIN);
      return url.protocol === 'https:' && url.origin === ACCOUNT_ORIGIN ? url.toString() : '';
    } catch {
      return '';
    }
  };

  const displayName = (user) => {
    for (const value of [user.full_name, user.nickname]) {
      if (typeof value === 'string' && value.trim() !== '') return value.trim();
    }
    return 'VEVIT účet';
  };

  const initials = (name) => name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('cs'))
    .join('') || 'V';

  const avatar = (user, name) => {
    const wrap = document.createElement('span');
    wrap.className = 'account-avatar';
    wrap.textContent = initials(name);
    const source = safeAvatarUrl(user.avatar_url);
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = '';
      image.addEventListener('error', () => image.remove(), { once: true });
      wrap.append(image);
    }
    return wrap;
  };

  const renderLoading = (root) => {
    clear(root);
    const status = document.createElement('span');
    status.className = 'account-session-status';
    status.textContent = 'Ověřuji účet…';
    root.append(status);
  };

  const renderAnonymous = (root) => {
    clear(root);
    const actions = document.createElement('div');
    actions.className = 'account-session-actions';
    actions.append(
      link('Přihlásit se', loginUrl(), 'btn btn-ghost btn-sm'),
      link('Vytvořit účet', `${ACCOUNT_ORIGIN}/register.html`, 'btn btn-primary btn-sm'),
    );
    root.append(actions);
  };

  const renderUnavailable = (root) => {
    clear(root);
    const state = document.createElement('div');
    state.className = 'account-session-unavailable';
    const message = document.createElement('span');
    message.textContent = 'Account je dočasně nedostupný';
    const retry = button('Zkusit znovu', 'account-session-retry');
    retry.addEventListener('click', loadSession);
    state.append(message, retry);
    root.append(state);
  };

  const closeMenus = (except = null) => {
    document.querySelectorAll('[data-account-menu]').forEach((menu) => {
      if (menu === except) return;
      menu.hidden = true;
      const trigger = menu.parentElement?.querySelector('[data-account-trigger]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  };

  const logout = async (trigger) => {
    trigger.disabled = true;
    try {
      const response = await fetch(LOGOUT_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });
      if (!response.ok) throw new Error('Logout failed');
      csrfToken = '';
      document.querySelectorAll('[data-vevit-auth]').forEach(renderAnonymous);
    } catch {
      trigger.disabled = false;
      trigger.textContent = 'Odhlášení se nepodařilo';
    }
  };

  const renderAuthenticated = (root, user) => {
    clear(root);
    const name = displayName(user);
    const wrap = document.createElement('div');
    wrap.className = 'account-session-menu';

    const trigger = button('', 'account-session-trigger');
    trigger.dataset.accountTrigger = '';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.append(avatar(user, name));
    const label = document.createElement('span');
    label.className = 'account-session-name';
    label.textContent = name;
    trigger.append(label);

    const menu = document.createElement('div');
    menu.className = 'account-session-dropdown';
    menu.dataset.accountMenu = '';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;

    const identity = document.createElement('div');
    identity.className = 'account-session-identity';
    const identityName = document.createElement('strong');
    identityName.textContent = name;
    const nickname = document.createElement('span');
    nickname.textContent = user.nickname ? `@${user.nickname}` : user.email;
    identity.append(identityName, nickname);

    const accountLink = link('Můj účet', '/account');
    accountLink.setAttribute('role', 'menuitem');
    const settingsLink = link('Nastavení', '/account/profile');
    settingsLink.setAttribute('role', 'menuitem');
    const signOut = button('Odhlásit se', 'account-session-logout');
    signOut.setAttribute('role', 'menuitem');
    signOut.addEventListener('click', () => logout(signOut));
    menu.append(identity, accountLink, settingsLink, signOut);

    trigger.addEventListener('click', () => {
      const opening = menu.hidden;
      closeMenus(opening ? menu : null);
      menu.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
    });
    wrap.append(trigger, menu);
    root.append(wrap);
  };

  async function loadSession() {
    const roots = document.querySelectorAll('[data-vevit-auth]');
    roots.forEach(renderLoading);
    try {
      const response = await fetch(ME_ENDPOINT, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (response.status === 401) {
        csrfToken = '';
        roots.forEach(renderAnonymous);
        return;
      }
      if (!response.ok) throw new Error('Account unavailable');
      const payload = await response.json();
      if (payload.authenticated !== true || !payload.user || typeof payload.csrf_token !== 'string') {
        throw new Error('Invalid Account response');
      }
      csrfToken = payload.csrf_token;
      roots.forEach((root) => renderAuthenticated(root, payload.user));
    } catch {
      roots.forEach(renderUnavailable);
    }
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.account-session-menu')) closeMenus();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenus();
  });
  loadSession();
})();
