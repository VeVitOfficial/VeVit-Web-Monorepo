const APPS = Object.freeze([
  { id: 'Home', label: 'Domů', description: 'Hlavní stránka', href: '/home', icon: 'V' },
  { id: 'Account', label: 'Account', description: 'Účet a přihlášení', href: '/account', icon: 'A' },
  { id: 'Tools', label: 'Tools', description: 'Online nástroje', href: '/tools', icon: 'T' },
  { id: 'Edu', label: 'Edu', description: 'Výuka a kurzy', href: '/edu', icon: 'E' },
  { id: 'Store', label: 'Store', description: 'Obchod VeVit', href: '/store', icon: 'S' },
  { id: 'Art', label: 'VeVit Art', description: 'Platforma pro umělce', href: 'https://vevit.art', icon: 'V' },
  { id: 'Studios', label: 'Software Studios', description: 'Software na míru', href: 'https://studios.vevit.cz', icon: 'V' },
]);

function makeGridIcon() {
  const icon = document.createElement('span');
  icon.className = 'vv-app-switcher__grid';
  icon.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 9; index += 1) icon.append(document.createElement('i'));
  return icon;
}

function closeSwitcher(host) {
  const button = host.querySelector('button');
  const menu = host.querySelector('[data-vv-app-menu]');
  if (!button || !menu) return;
  button.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
}

function renderSwitcher(host) {
  if (host.dataset.vvAppSwitcherReady === 'true') return;
  const currentApp = host.dataset.vevitApp || '';
  const menuId = `vv-app-menu-${Math.random().toString(36).slice(2, 10)}`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vv-app-switcher__trigger';
  button.setAttribute('aria-label', 'Aplikace VeVit');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', menuId);
  button.append(makeGridIcon());

  const menu = document.createElement('nav');
  menu.className = 'vv-app-switcher__menu';
  menu.id = menuId;
  menu.setAttribute('data-vv-app-menu', '');
  menu.setAttribute('aria-label', 'Aplikace VeVit');
  menu.hidden = true;
  const title = document.createElement('p');
  title.className = 'vv-app-switcher__title';
  title.textContent = 'Aplikace VeVit';
  const list = document.createElement('div');
  list.className = 'vv-app-switcher__list';
  for (const app of APPS) {
    const link = document.createElement('a');
    link.className = 'vv-app-switcher__link';
    link.href = app.href;
    if (app.id === currentApp) link.setAttribute('aria-current', 'page');
    if (app.href.startsWith('https://')) link.rel = 'noopener';
    const icon = document.createElement('span');
    icon.className = `vv-app-switcher__app-icon vv-app-switcher__app-icon--${app.id.toLowerCase()}`;
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = app.icon;
    const copy = document.createElement('span');
    const label = document.createElement('strong');
    label.textContent = app.label;
    const description = document.createElement('small');
    description.textContent = app.description;
    copy.append(label, description);
    link.append(icon, copy);
    link.addEventListener('click', () => closeSwitcher(host));
    list.append(link);
  }
  menu.append(title, list);
  button.addEventListener('click', () => {
    const opening = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('[data-vevit-app-switcher]').forEach(closeSwitcher);
    button.setAttribute('aria-expanded', String(opening));
    menu.hidden = !opening;
  });
  host.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeSwitcher(host);
    button.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!host.contains(event.target)) closeSwitcher(host);
  });
  host.classList.add('vv-app-switcher');
  host.append(button, menu);
  host.dataset.vvAppSwitcherReady = 'true';
}

export function initAppSwitchers(roots = document.querySelectorAll('[data-vevit-app-switcher]')) {
  Array.from(roots).forEach(renderSwitcher);
}

if (typeof document !== 'undefined') {
  const boot = () => {
    initAppSwitchers();
    new MutationObserver(() => initAppSwitchers()).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
