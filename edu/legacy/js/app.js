import router from './router.js';
import { renderHome } from './pages/home.js';
import { renderCourses } from './pages/courses.js';
import { renderCourse } from './pages/course.js';
import { renderLesson } from './pages/lesson.js';
import { renderQuiz } from './pages/quiz.js';
import { renderWiki } from './pages/wiki.js';
import { getVevitUser, formatXP, getLevel, getLevelTitle } from './auth.js';

// Theme management
function getTheme() {
    return localStorage.getItem('vevit-theme') || 'dark';
}

function setTheme(theme) {
    localStorage.setItem('vevit-theme', theme);
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.style.background = '#0d0d0d';
        document.body.style.color = '#f0f0f0';
    } else {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '#fafafa';
        document.body.style.color = '#111827';
    }
}

// Language management
const LANGUAGES = [
    { code: 'cs', label: 'CS', name: 'Čeština' },
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'de', label: 'DE', name: 'Deutsch' },
    { code: 'uk', label: 'UK', name: 'Українська' },
    { code: 'es', label: 'ES', name: 'Español' },
];

function getLang() {
    return localStorage.getItem('vevit-lang') || 'cs';
}

function setLang(lang) {
    localStorage.setItem('vevit-lang', lang);
    renderNavbar();
}

// Make globally available
window.getLang = getLang;
window.showToast = showToast;
window.setTheme = setTheme;
window.getTheme = getTheme;

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { xp: 'star', levelup: 'trophy', success: 'check-circle', error: 'alert-circle', info: 'info' };
    const colors = {
        xp: 'bg-emerald-600 border-emerald-500/30',
        levelup: 'bg-amber-600 border-amber-500/30',
        success: 'bg-green-600 border-green-500/30',
        error: 'bg-red-600 border-red-500/30',
        info: 'bg-[#1e1e1e] border-white/10'
    };
    const toast = document.createElement('div');
    toast.className = `toast-enter flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${colors[type] || colors.info} text-white text-sm font-medium`;
    const duration = type === 'levelup' ? 5000 : 3500;
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 shrink-0"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function renderNavbar() {
    const navbar = document.getElementById('navbar');
    const user = getVevitUser();
    const theme = getTheme();
    const lang = getLang();
    const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
    const isDark = theme === 'dark';

    const userSection = user
        ? `<div class="flex items-center gap-3">
            <span class="text-sm ${isDark ? 'text-[#9ca3af]' : 'text-gray-500'} hidden sm:block">${user.nickname || user.name || 'Uživatel'}</span>
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} border">
                <i data-lucide="star" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span class="text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}">${formatXP(user.xp || 0)}</span>
            </div>
            <span class="text-xs ${isDark ? 'text-[#9ca3af]' : 'text-gray-500'}">Lvl ${getLevel(user.xp || 0)}</span>
           </div>`
        : `<a href="https://account.vevit.fun" target="_blank" class="px-4 py-2 text-sm font-semibold text-base bg-accent hover:bg-accent-hover rounded-md transition-colors">
            Přihlásit se
           </a>`;

    navbar.innerHTML = `<header class="fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0d0d0d]/95' : 'bg-white/95'} backdrop-blur-sm ${isDark ? 'border-white/[0.06]' : 'border-gray-200'} border-b transition-colors">
        <div class="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between">
            <a href="#/" data-link class="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div class="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
                    <i data-lucide="book-open" class="w-4 h-4 text-[#0d0d0d]"></i>
                </div>
                <span class="text-lg font-semibold ${isDark ? 'text-text-primary' : 'text-gray-900'}">edu<span class="text-accent">.vevit</span>.fun</span>
            </a>
            <div class="hidden md:flex items-center gap-6">
                <a href="#/" data-link class="text-sm ${isDark ? 'text-text-secondary hover:text-text-primary' : 'text-gray-500 hover:text-gray-900'} transition-colors">Domů</a>
                <a href="#" data-nav-scroll="section-kurzy" class="text-sm ${isDark ? 'text-text-secondary hover:text-text-primary' : 'text-gray-500 hover:text-gray-900'} transition-colors">Kurzy</a>
                <a href="#" data-nav-scroll="section-lekce" class="text-sm ${isDark ? 'text-text-secondary hover:text-text-primary' : 'text-gray-500 hover:text-gray-900'} transition-colors">Lekce</a>
                <a href="#" data-nav-scroll="section-clanky" class="text-sm ${isDark ? 'text-text-secondary hover:text-text-primary' : 'text-gray-500 hover:text-gray-900'} transition-colors">Články</a>
            </div>
            <div class="flex items-center gap-3">
                <button data-set-theme="${isDark ? 'light' : 'dark'}" class="p-2 rounded-md ${isDark ? 'text-text-secondary hover:text-text-primary hover:bg-white/5' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'} transition-colors" title="${isDark ? 'Světlý režim' : 'Tmavý režim'}">
                    <i data-lucide="${isDark ? 'sun' : 'moon'}" class="w-4 h-4"></i>
                </button>
                <div class="relative" id="lang-dropdown">
                    <button data-toggle-lang class="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-semibold ${isDark ? 'text-text-secondary hover:text-text-primary hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} transition-colors">
                        ${currentLangObj.label}
                        <i data-lucide="chevron-down" class="w-3 h-3"></i>
                    </button>
                    <div id="lang-menu" class="hidden absolute right-0 top-full mt-1 w-36 rounded-lg ${isDark ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-gray-200'} border shadow-xl py-1 z-50">
                        ${LANGUAGES.map(l => `<button data-set-lang="${l.code}" class="w-full text-left px-3 py-2 text-sm ${isDark ? 'text-text-secondary hover:text-text-primary hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'} transition-colors ${l.code === lang ? 'text-accent font-semibold' : ''}">${l.name}</button>`).join('')}
                    </div>
                </div>
                ${userSection}
            </div>
        </div>
    </header>`;

    lucide.createIcons();
    navbar.querySelector('[data-set-theme]')?.addEventListener('click', (event) => window.setTheme(event.currentTarget.dataset.setTheme));
    navbar.querySelector('[data-toggle-lang]')?.addEventListener('click', () => document.getElementById('lang-menu')?.classList.toggle('hidden'));
    navbar.querySelectorAll('[data-set-lang]').forEach((button) => button.addEventListener('click', () => {
        window.setLang(button.dataset.setLang);
        document.getElementById('lang-menu')?.classList.add('hidden');
    }));

    // Close lang menu on outside click
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('lang-dropdown');
        const menu = document.getElementById('lang-menu');
        if (dropdown && menu && !dropdown.contains(e.target)) {
            menu.classList.add('hidden');
        }
    }, { once: true });

    // Navbar scroll-to-section links
    navbar.querySelectorAll('[data-nav-scroll]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.navScroll;
            const target = document.getElementById(targetId);
            if (target) {
                // Already on home page, just scroll
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // Not on home page — navigate there first
                sessionStorage.setItem('vevit_scroll_to', targetId);
                window.location.hash = '/';
            }
        });
    });
}

// Register routes
router
    .route('/', () => renderHome())
    .route('/kurzy', () => renderCourses())
    .route('/kurzy/:kat', (params) => renderCourses(params.kat))
    .route('/kurz/:slug', (params) => renderCourse(params.slug))
    .route('/lekce/:id', (params) => renderLesson(params.id))
    .route('/kviz/:id', (params) => renderQuiz(params.id))
    .route('/lekcе', () => renderPlaceholder('Lekce', 'notebook-pen', 'Uživatelské lekce', 'Zde se objeví lekce vytvořené komunitou. Každý bude moci sdílet své znalosti.'))
    .route('/clanky', () => renderPlaceholder('Články', 'file-text', 'Teoretické články', 'Články a teorie napsané uživateli. Od vysvětlení konceptů po ucelené studijní materiály.'))
    .route('/wiki', () => renderWiki())
    .init();

function renderPlaceholder(title, icon, heading, description) {
    const app = document.getElementById('app');
    const isDark = window.getTheme() === 'dark';
    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-5xl mx-auto w-full animate-fadeUp">
        <div class="mb-8">
            <a href="#/" data-link class="inline-flex items-center gap-2 ${isDark ? 'text-text-secondary hover:text-accent' : 'text-gray-500 hover:text-emerald-600'} font-medium transition-colors">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na úvod
            </a>
        </div>
        <div class="text-center mb-10">
            <h1 class="text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-text-primary' : 'text-gray-900'} tracking-tight mb-3">
                <span class="text-accent">${title}</span>
            </h1>
        </div>
        <div class="${isDark ? 'bg-surface border-surface-border' : 'bg-white border-gray-200'} border rounded-xl p-12 text-center">
            <i data-lucide="${icon}" class="w-16 h-16 mx-auto mb-6 ${isDark ? 'text-text-muted' : 'text-gray-400'}"></i>
            <h3 class="text-xl font-semibold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-3">${heading}</h3>
            <p class="text-sm ${isDark ? 'text-text-secondary' : 'text-gray-500'} max-w-md mx-auto mb-6">${description}</p>
            <span class="inline-block px-5 py-2 rounded-full text-sm font-bold ${isDark ? 'bg-accent/10 text-accent' : 'bg-emerald-50 text-emerald-600'}">Již brzy</span>
        </div>
    </div>`;
    lucide.createIcons();
}

// Initial render
setTheme(getTheme());
renderNavbar();

// Re-render navbar on hash change for file:// protocol
window.addEventListener('hashchange', () => {
    if (window.location.protocol === 'file:') {
        router.resolve();
    }
});

// Close lang menu on click outside (global)
document.addEventListener('click', (e) => {
    const menu = document.getElementById('lang-menu');
    const dropdown = document.getElementById('lang-dropdown');
    if (menu && dropdown && !dropdown.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

document.addEventListener('error', (event) => {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.hasAttribute('data-hide-on-error')) image.hidden = true;
}, true);
