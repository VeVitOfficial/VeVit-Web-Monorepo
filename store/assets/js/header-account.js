(function initStoreAccountHeader() {
  'use strict';
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-account-login]');
    if (!button) return;
    window.VevitAccount?.openLogin();
    if (button.hasAttribute('data-close-drawer')) window.closeStoreDrawer?.();
  });

  if (document.body.dataset.vevitHydrateAccount !== '1' || !window.VevitAccount) return;
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;
  window.VevitAccount.checkSession().then(result => {
    if (result.state !== 'authenticated' || !result.user) return;
    const user = result.user;
    let avatar;
    if (user.avatarUrl) {
      avatar = document.createElement('img');
      avatar.width = 32;
      avatar.height = 32;
      avatar.className = 'w-8 h-8 rounded-full object-cover border border-outline-variant';
      avatar.alt = '';
      avatar.src = user.avatarUrl;
    } else {
      avatar = document.createElement('span');
      avatar.className = 'w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface-variant';
      const icon = document.createElement('span');
      icon.className = 'material-symbols-outlined text-[18px]';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'person';
      avatar.appendChild(icon);
    }
    const name = document.createElement('span');
    name.className = 'font-body-md text-sm text-on-surface max-w-[120px] truncate';
    name.textContent = user.displayName || '';
    const logout = document.createElement('a');
    logout.href = `${document.body.dataset.vevitBase || ''}logout.php`;
    logout.setAttribute('aria-label', 'Odhlásit se');
    logout.title = 'Odhlásit se';
    logout.className = 'p-1.5 rounded-md text-on-surface-variant hover:text-error transition-colors';
    const logoutIcon = document.createElement('span');
    logoutIcon.className = 'material-symbols-outlined text-[18px]';
    logoutIcon.setAttribute('aria-hidden', 'true');
    logoutIcon.textContent = 'logout';
    logout.appendChild(logoutIcon);
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';
    wrapper.append(avatar, name, logout);
    navAuth.replaceChildren(wrapper);
  }).catch(() => {});
}());
