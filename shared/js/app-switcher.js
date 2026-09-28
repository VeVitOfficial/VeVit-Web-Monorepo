// App switcher — lokalizovaná rozhraní. Popisky aplikací per-lang.
// Jazyk se čte z <html lang> (nastavuje shared/js/localization.js) a z localStorage 'vevit-lang'.

const SUPPORTED_LANGS = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'];

const STRINGS = {
  cs: { menuTitle: 'Aplikace VeVit', more: 'Další projekty', current: 'Právě tady', home: 'Domů', apps: { Home: 'Hlavní stránka', Account: 'Účet a přihlášení', Tools: 'Online nástroje', Edu: 'Výuka a kurzy', Store: 'Obchod VeVit', Services: 'Poptávky a služby', Art: 'Platforma pro umělce', Studios: 'Software na míru' } },
  en: { menuTitle: 'VeVit apps', more: 'More from VeVit', current: 'You are here', home: 'Home', apps: { Home: 'Main page', Account: 'Account & sign-in', Tools: 'Online tools', Edu: 'Lessons & courses', Store: 'VeVit store', Services: 'Requests & services', Art: 'Platform for artists', Studios: 'Custom software' } },
  de: { menuTitle: 'VeVit-Apps', more: 'Weitere Projekte', current: 'Du bist hier', home: 'Startseite', apps: { Home: 'Hauptseite', Account: 'Konto & Anmeldung', Tools: 'Online-Werkzeuge', Edu: 'Lernen & Kurse', Store: 'VeVit-Shop', Services: 'Anfragen & Dienste', Art: 'Plattform für Künstler', Studios: 'Maßgeschneiderte Software' } },
  es: { menuTitle: 'Apps de VeVit', more: 'Más proyectos', current: 'Estás aquí', home: 'Inicio', apps: { Home: 'Página principal', Account: 'Cuenta e inicio de sesión', Tools: 'Herramientas online', Edu: 'Lecciones y cursos', Store: 'Tienda VeVit', Services: 'Solicitudes y servicios', Art: 'Plataforma para artistas', Studios: 'Software a medida' } },
  uk: { menuTitle: 'Застосунки VeVit', more: 'Інші проєкти', current: 'Ви тут', home: 'Головна', apps: { Home: 'Головна сторінка', Account: 'Облік і вхід', Tools: 'Онлайн-інструменти', Edu: 'Навчання й курси', Store: 'Магазин VeVit', Services: 'Запити та послуги', Art: 'Платформа для митців', Studios: 'Програмне рішення на замовлення' } },
  fr: { menuTitle: 'Applications VeVit', more: 'Autres projets', current: 'Vous êtes ici', home: 'Accueil', apps: { Home: 'Page principale', Account: 'Compte et connexion', Tools: 'Outils en ligne', Edu: 'Leçons et cours', Store: 'Boutique VeVit', Services: 'Demandes et services', Art: 'Plateforme pour artistes', Studios: 'Logiciel sur mesure' } },
  sk: { menuTitle: 'Aplikácie VeVit', more: 'Ďalšie projekty', current: 'Práve tu', home: 'Domov', apps: { Home: 'Hlavná stránka', Account: 'Účet a prihlásenie', Tools: 'Online nástroje', Edu: 'Výuka a kurzy', Store: 'Obchod VeVit', Services: 'Dopyty a služby', Art: 'Platforma pre umelcov', Studios: 'Software na mieru' } },
};

function currentLang() {
  const fromHtml = document.documentElement.lang;
  if (fromHtml && SUPPORTED_LANGS.includes(fromHtml)) return fromHtml;
  try {
    const stored = localStorage.getItem('vevit-lang');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {}
  return 'cs';
}

function tr() {
  return STRINGS[currentLang()] || STRINGS.cs;
}

// Ikony (lucide, 24×24, stroke) — statický obsah, vkládá se přes innerHTML.
const ICONS = {
  Home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  Account: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  Tools: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  Edu: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  Services: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  Store: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  Art: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  Studios: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
  external: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
};

// Aplikace VeVit (stejný účet) a další projekty na vlastních doménách.
const APPS = Object.freeze([
  { id: 'Home', labelKey: 'home', href: '/home' },
  { id: 'Account', label: 'Account', href: '/account' },
  { id: 'Tools', label: 'Tools', href: '/tools' },
  { id: 'Edu', label: 'Edu', href: '/edu' },
  { id: 'Store', label: 'Store', href: '/store' },
  { id: 'Services', label: 'Services', href: '/services' },
]);
const PROJECTS = Object.freeze([
  { id: 'Art', label: 'VeVit Art', href: 'https://vevit.art' },
  { id: 'Studios', label: 'Software Studios', href: 'https://www.vevit.space' },
]);

function svg(name, className) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  if (className) icon.setAttribute('class', className);
  icon.innerHTML = ICONS[name];
  return icon;
}

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
  const lang = currentLang();
  // Již renderováno pro tento jazyk → skip. Zabraňuje infinite loop: boot
  // registruje MutationObserver na body subtree, který spouští initAppSwitchers
  // při každé DOM mutaci — včetně mutací, které samotný renderSwitcher způsobí
  // (replaceChildren/append). Bez guardu: mutace → observer → re-render → mutace → …
  if (host.dataset.vvAppSwitcherReady === 'true' && host.dataset.vvAppLang === lang) return;
  const wasReady = host.dataset.vvAppSwitcherReady === 'true';
  if (wasReady) host.replaceChildren(); // re-render při změně jazyka
  const currentApp = host.dataset.vevitApp || '';
  const s = tr();
  const menuId = host.dataset.vvAppMenuId || `vv-app-menu-${Math.random().toString(36).slice(2, 10)}`;
  host.dataset.vvAppMenuId = menuId;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vv-app-switcher__trigger';
  button.setAttribute('aria-label', s.menuTitle);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', menuId);
  button.append(makeGridIcon());

  const menu = document.createElement('nav');
  menu.className = 'vv-app-switcher__menu';
  menu.id = menuId;
  menu.setAttribute('data-vv-app-menu', '');
  menu.setAttribute('aria-label', s.menuTitle);
  menu.hidden = true;
  const title = document.createElement('p');
  title.className = 'vv-app-switcher__title';
  title.textContent = s.menuTitle;
  const makeLink = (app, external) => {
    const link = document.createElement('a');
    link.className = 'vv-app-switcher__link';
    link.href = app.href;
    const current = app.id === currentApp;
    if (current) link.setAttribute('aria-current', 'page');
    if (external) link.rel = 'noopener';
    const icon = document.createElement('span');
    icon.className = `vv-app-switcher__app-icon vv-app-switcher__app-icon--${app.id.toLowerCase()}`;
    icon.setAttribute('aria-hidden', 'true');
    icon.append(svg(app.id));
    const copy = document.createElement('span');
    copy.className = 'vv-app-switcher__copy';
    const label = document.createElement('strong');
    label.textContent = app.labelKey ? s[app.labelKey] : app.label;
    const description = document.createElement('small');
    description.textContent = s.apps[app.id];
    copy.append(label, description);
    link.append(icon, copy);
    if (current) {
      const badge = document.createElement('span');
      badge.className = 'vv-app-switcher__badge';
      badge.textContent = s.current;
      link.append(badge);
    }
    if (external) link.append(svg('external', 'vv-app-switcher__ext'));
    link.addEventListener('click', () => closeSwitcher(host));
    return link;
  };
  const list = document.createElement('div');
  list.className = 'vv-app-switcher__list';
  APPS.forEach((app) => list.append(makeLink(app, false)));
  const subtitle = document.createElement('p');
  subtitle.className = 'vv-app-switcher__subtitle';
  subtitle.textContent = s.more;
  const projects = document.createElement('div');
  projects.className = 'vv-app-switcher__list';
  PROJECTS.forEach((app) => projects.append(makeLink(app, true)));
  menu.append(title, list, subtitle, projects);
  button.addEventListener('click', () => {
    const opening = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('[data-vevit-app-switcher]').forEach(closeSwitcher);
    button.setAttribute('aria-expanded', String(opening));
    // Na telefonu je menu fixed přes šířku obrazovky těsně pod tlačítkem.
    if (opening) menu.style.setProperty('--vv-menu-top', `${Math.round(button.getBoundingClientRect().bottom + 8)}px`);
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
  host.dataset.vvAppLang = lang;
}

export function initAppSwitchers(roots = document.querySelectorAll('[data-vevit-app-switcher]')) {
  Array.from(roots).forEach(renderSwitcher);
}

if (typeof document !== 'undefined') {
  const boot = () => {
    initAppSwitchers();
    new MutationObserver(() => initAppSwitchers()).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('vevit:localechange', () => initAppSwitchers());
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}