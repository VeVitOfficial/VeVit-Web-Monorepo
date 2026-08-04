/**
 * VeVit Account — Universal Auth Adapter
 * For *.vevit.cz applications served under store.vevit.cz.
 *
 * BLOCKERS — must be confirmed with VeVit Account team before production:
 *   [B1] Exact endpoint URL for /api/me.php on account.vevit.cz.
 *   [B2] Login redirect URL and exact return_url parameter name.
 *   [B3] Response JSON schema (authenticated flag, user object fields).
 *   [B4] Allowed-origins list configured on account.vevit.cz (CORS).
 *   [B5] Logout endpoint, HTTP method, CSRF contract, and post-logout redirect.
 *
 * Security guarantees enforced by this module:
 *   - NEVER reads document.cookie or any cookie value.
 *   - NEVER stores session or token in localStorage or sessionStorage.
 *   - NEVER passes session or token through the URL or DOM attributes.
 *   - NEVER redirects automatically on 401 or other errors.
 *   - NEVER uses innerHTML with user-supplied data.
 *   - Does not poll the account endpoint on its own.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------
     Configuration
     Override via window.VEVIT_ACCOUNT_CONFIG before loading this file.
     Example (in PHP template or inline script):
       window.VEVIT_ACCOUNT_CONFIG = {
         meUrl:    'https://vevit.cz/account/api/me.php',  // [B1]
         loginUrl: 'https://vevit.cz/account/login',       // [B2]
         appOrigin: 'https://vevit.cz',
       };
  ------------------------------------------------------------------ */
  var cfg = (global.VEVIT_ACCOUNT_CONFIG && typeof global.VEVIT_ACCOUNT_CONFIG === 'object')
    ? global.VEVIT_ACCOUNT_CONFIG : {};

  var ME_URL    = (typeof cfg.meUrl    === 'string' && cfg.meUrl)    ? cfg.meUrl    : 'https://vevit.cz/account/api/me.php'; // [B1]
  var LOGIN_URL = (typeof cfg.loginUrl === 'string' && cfg.loginUrl) ? cfg.loginUrl : 'https://vevit.cz/account/login';     // [B2]
  var APP_ORIGIN = (typeof cfg.appOrigin === 'string' && cfg.appOrigin)
    ? cfg.appOrigin
    : (typeof global.location !== 'undefined' ? global.location.origin : '');

  /* ------------------------------------------------------------------
     Internal state
  ------------------------------------------------------------------ */
  var _state = 'loading'; // 'loading'|'authenticated'|'unauthenticated'|'forbidden'|'rate_limited'|'temporarily_unavailable'
  var _user  = null;      // { id, displayName, avatarUrl } | null
  var _retryAfter = null; // Retry-After value from 429 response

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */
  function _safeAvatarUrl(raw) {
    if (typeof raw !== 'string' || raw === '') return null;
    try {
      var u = new URL(raw);
      return u.protocol === 'https:' ? raw : null;
    } catch (_) {
      return null;
    }
  }

  function _parseUser(payload) {
    var u = payload && payload.user;
    if (!u || typeof u.display_name !== 'string') return null;
    return {
      id:          typeof u.id === 'string' ? u.id : null,
      displayName: u.display_name,
      avatarUrl:   _safeAvatarUrl(u.avatar_url != null ? u.avatar_url : null),
    };
  }

  function _fallbackAvatarEl() {
    var wrap = document.createElement('span');
    wrap.className = 'w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center flex-shrink-0';
    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-[18px] text-on-surface-variant';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'person';
    wrap.appendChild(icon);
    return wrap;
  }

  /* ------------------------------------------------------------------
     checkSession()
     Calls account.vevit.cz/api/me.php with credentials:include.
     The browser sends the HttpOnly vevit_session cookie automatically.
     This script never sees the cookie value.
  ------------------------------------------------------------------ */
  function checkSession(options) {
    var signal = (options && options.signal) ? options.signal : undefined;

    return fetch(ME_URL, {
      method:      'GET',
      credentials: 'include',
      headers:     { 'Accept': 'application/json' },
      signal:      signal,
    }).then(function (response) {
      if (response.status === 401) {
        _state = 'unauthenticated';
        _user  = null;
        return { state: _state, user: null };
      }
      if (response.status === 403) {
        _state = 'forbidden';
        _user  = null;
        return { state: _state, user: null };
      }
      if (response.status === 429) {
        _state      = 'rate_limited';
        _user       = null;
        _retryAfter = response.headers.get('Retry-After');
        return { state: _state, user: null, retryAfter: _retryAfter };
      }
      if (!response.ok) {
        _state = 'temporarily_unavailable';
        _user  = null;
        return { state: _state, user: null };
      }

      var ct = response.headers.get('Content-Type') || '';
      if (ct.toLowerCase().indexOf('application/json') === -1) {
        _state = 'temporarily_unavailable';
        _user  = null;
        return { state: _state, user: null };
      }

      return response.json().then(function (payload) {
        if (!payload || payload.authenticated !== true) {
          // authenticated flag absent → treat as unauthenticated, not as server error
          _state = 'unauthenticated';
          _user  = null;
          return { state: _state, user: null };
        }

        var user = _parseUser(payload);
        if (!user) {
          // Authenticated flag present but user object malformed → unavailable
          _state = 'temporarily_unavailable';
          _user  = null;
          return { state: _state, user: null };
        }

        _state = 'authenticated';
        _user  = user;
        return { state: _state, user: _user };
      }).catch(function () {
        _state = 'temporarily_unavailable';
        _user  = null;
        return { state: _state, user: null };
      });
    }).catch(function (err) {
      if (err && err.name === 'AbortError') throw err;
      _state = 'temporarily_unavailable';
      _user  = null;
      return { state: _state, user: null };
    });
  }

  /* ------------------------------------------------------------------
     openLogin()
     Redirects to VeVit Account login page on user action.
     NEVER call automatically — only on explicit user gesture.
     [B2] return_url parameter name must be confirmed with account team.
  ------------------------------------------------------------------ */
  function openLogin() {
    if (typeof global.location === 'undefined') return;
    var returnUrl = APP_ORIGIN ? (APP_ORIGIN + '/') : '';
    var target = returnUrl
      ? (LOGIN_URL + '?return_url=' + encodeURIComponent(returnUrl))  // [B2] param name unconfirmed
      : LOGIN_URL;
    global.location.href = target;
  }

  /* ------------------------------------------------------------------
     retrySessionCheck()
     Respects Retry-After header on 429. Does not loop indefinitely.
  ------------------------------------------------------------------ */
  function retrySessionCheck() {
    if (_state === 'rate_limited' && _retryAfter) {
      var wait = parseInt(_retryAfter, 10);
      if (!isNaN(wait) && wait > 0 && wait <= 120) {
        return new Promise(function (resolve) {
          setTimeout(function () { resolve(checkSession()); }, wait * 1000);
        });
      }
    }
    return checkSession();
  }

  /* ------------------------------------------------------------------
     renderAccountState(container, result, options)
     Renders auth state into a DOM container.
     All user text goes through textContent — never innerHTML.
  ------------------------------------------------------------------ */
  function renderAccountState(container, result, options) {
    if (!container) return;
    options = options || {};

    while (container.firstChild) container.removeChild(container.firstChild);

    var state = result.state;
    var user  = result.user;

    if (state === 'loading') {
      var loadEl = document.createElement('span');
      loadEl.setAttribute('aria-label', 'Načítám stav přihlášení');
      loadEl.setAttribute('aria-busy', 'true');
      loadEl.className = 'inline-block w-6 h-6 rounded-full border-2 border-outline-variant border-t-primary animate-spin';
      container.appendChild(loadEl);
      return;
    }

    if (state === 'authenticated' && user) {
      _renderAuthenticated(container, user);
      return;
    }

    if (state === 'forbidden') {
      var forbidEl = document.createElement('span');
      forbidEl.className = 'text-error font-caption text-caption';
      forbidEl.textContent = 'Přístup zamítnut.';
      container.appendChild(forbidEl);
      return;
    }

    if (state === 'rate_limited') {
      var rlEl = document.createElement('div');
      rlEl.className = 'flex items-center gap-2';
      var rlMsg = document.createElement('span');
      rlMsg.className = 'text-warning font-caption text-caption';
      rlMsg.textContent = 'Příliš mnoho požadavků. Zkuste to za chvíli.';
      rlEl.appendChild(rlMsg);
      var rlBtn = _retryButton(container, result, options);
      rlEl.appendChild(rlBtn);
      container.appendChild(rlEl);
      return;
    }

    if (state === 'temporarily_unavailable') {
      var unavEl = document.createElement('div');
      unavEl.className = 'flex items-center gap-2';
      var unavMsg = document.createElement('span');
      unavMsg.className = 'text-on-surface-variant font-caption text-caption';
      unavMsg.textContent = 'Přihlášení se nyní nepodařilo ověřit.';
      unavEl.appendChild(unavMsg);
      var unavBtn = _retryButton(container, result, options);
      unavEl.appendChild(unavBtn);
      container.appendChild(unavEl);
      return;
    }

    // unauthenticated — show login button
    var loginBtn = document.createElement('button');
    loginBtn.type = 'button';
    loginBtn.setAttribute('aria-label', 'Přihlásit se');
    loginBtn.className = 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high p-2 rounded transition-all duration-200';
    var loginIcon = document.createElement('span');
    loginIcon.className = 'material-symbols-outlined text-[24px]';
    loginIcon.setAttribute('aria-hidden', 'true');
    loginIcon.textContent = 'account_circle';
    loginBtn.appendChild(loginIcon);
    loginBtn.addEventListener('click', function () {
      if (typeof options.onLogin === 'function') options.onLogin();
      else openLogin();
    });
    container.appendChild(loginBtn);
  }

  function _retryButton(container, resultBefore, options) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'text-primary underline font-caption text-caption';
    btn.textContent = 'Zkusit znovu';
    btn.addEventListener('click', function () {
      btn.disabled = true;
      retrySessionCheck().then(function (r) {
        renderAccountState(container, r, options);
      }).catch(function () {
        btn.disabled = false;
      });
    });
    return btn;
  }

  function _renderAuthenticated(container, user) {
    var wrap = document.createElement('div');
    wrap.className = 'flex items-center gap-2';

    if (user.avatarUrl) {
      var img = document.createElement('img');
      img.className = 'w-8 h-8 rounded-full object-cover border border-outline-variant flex-shrink-0';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.src = user.avatarUrl; // already validated as https:// in _safeAvatarUrl
      img.addEventListener('error', function () {
        img.replaceWith(_fallbackAvatarEl());
      });
      wrap.appendChild(img);
    } else {
      wrap.appendChild(_fallbackAvatarEl());
    }

    var nameEl = document.createElement('span');
    nameEl.className = 'font-body-md text-sm text-on-surface max-w-[120px] truncate';
    nameEl.textContent = user.displayName; // textContent — never innerHTML
    wrap.appendChild(nameEl);

    // [B5] Logout contract not yet confirmed with VeVit Account team.
    // Currently links to local logout.php which destroys the store session.
    // Must be replaced once logout endpoint and CSRF contract are known.
    var logoutLink = document.createElement('a');
    logoutLink.href = 'logout.php'; // [B5] replace with account.vevit.cz/logout
    logoutLink.setAttribute('aria-label', 'Odhlásit se');
    logoutLink.className = 'p-1.5 rounded-md text-on-surface-variant hover:text-error transition-colors flex-shrink-0';
    var logoutIcon = document.createElement('span');
    logoutIcon.className = 'material-symbols-outlined text-[18px]';
    logoutIcon.setAttribute('aria-hidden', 'true');
    logoutIcon.textContent = 'logout';
    logoutLink.appendChild(logoutIcon);
    wrap.appendChild(logoutLink);

    container.appendChild(wrap);
  }

  /* ------------------------------------------------------------------
     Export
  ------------------------------------------------------------------ */
  var VevitAccount = {
    checkSession:       checkSession,
    openLogin:          openLogin,
    retrySessionCheck:  retrySessionCheck,
    renderAccountState: renderAccountState,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VevitAccount; // Node.js / test environment
  } else {
    global.VevitAccount = VevitAccount; // browser
  }

}(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this));
