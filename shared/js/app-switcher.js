// App switcher — lokalizovaná rozhraní. Popisky aplikací per-lang.
// Jazyk se čte z <html lang> (nastavuje shared/js/localization.js) a z localStorage 'vevit-lang'.

const SUPPORTED_LANGS = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'];

const STRINGS = {
  cs: { menuTitle: 'Aplikace VeVit', home: 'Domů', apps: { Home: 'Hlavní stránka', Account: 'Účet a přihlášení', Tools: 'Online nástroje', Edu: 'Výuka a kurzy', Store: 'Obchod VeVit', Art: 'Platforma pro umělce', Studios: 'Software na míru' } },
  en: { menuTitle: 'VeVit apps', home: 'Home', apps: { Home: 'Main page', Account: 'Account & sign-in', Tools: 'Online tools', Edu: 'Lessons & courses', Store: 'VeVit store', Art: 'Platform for artists', Studios: 'Custom software' } },
  de: { menuTitle: 'VeVit-Apps', home: 'Startseite', apps: { Home: 'Hauptseite', Account: 'Konto & Anmeldung', Tools: 'Online-Werkzeuge', Edu: 'Lernen & Kurse', Store: 'VeVit-Shop', Art: 'Plattform für Künstler', Studios: 'Maßgeschneiderte Software' } },
  es: { menuTitle: 'Apps de VeVit', home: 'Inicio', apps: { Home: 'Página principal', Account: 'Cuenta e inicio de sesión', Tools: 'Herramientas online', Edu: 'Lecciones y cursos', Store: 'Tienda VeVit', Art: 'Plataforma para artistas', Studios: 'Software a medida' } },
  uk: { menuTitle: 'Застосунки VeVit', home: 'Головна', apps: { Home: 'Головна сторінка', Account: 'Облік і вхід', Tools: 'Онлайн-інструменти', Edu: 'Навчання й курси', Store: 'Магазин VeVit', Art: 'Платформа для митців', Studios: 'Програмне рішення на замовлення' } },
  fr: { menuTitle: 'Applications VeVit', home: 'Accueil', apps: { Home: 'Page principale', Account: 'Compte et connexion', Tools: 'Outils en ligne', Edu: 'Leçons et cours', Store: 'Boutique VeVit', Art: 'Plateforme pour artistes', Studios: 'Logiciel sur mesure' } },
  sk: { menuTitle: 'Aplikácie VeVit', home: 'Domov', apps: { Home: 'Hlavná stránka', Account: 'Účet a prihlásenie', Tools: 'Online nástroje', Edu: 'Výuka a kurzy', Store: 'Obchod VeVit', Art: 'Platforma pre umelcov', Studios: 'Software na mieru' } },
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

const APPS = Object.freeze([
  { id: 'Home', labelKey: 'home', href: '/home', icon: 'V' },
  { id: 'Account', label: 'Account', href: '/account', icon: 'A' },
  { id: 'Tools', label: 'Tools', href: '/tools', icon: 'T' },
  { id: 'Edu', label: 'Edu', href: '/edu', icon: 'E' },
  { id: 'Store', label: 'Store', href: '/store', icon: 'S' },
  { id: 'Art', label: 'VeVit Art', href: 'https://vevit.art', icon: 'V' },
  { id: 'Studios', label: 'Software Studios', href: 'https://studios.vevit.cz', icon: 'V' },
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
    label.textContent = app.labelKey ? s[app.labelKey] : app.label;
    const description = document.createElement('small');
    description.textContent = s.apps[app.id];
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