import { getVevitUser } from '../auth.js';
import { courseIconImg, getCourseIconUrl } from '../shared/mockData.js';
import { api } from '../shared/api.js';

const DIFFICULTY_MAP = {
    beginner: { label: 'Začátečník', cls: 'bg-emerald-500/10 text-emerald-400', lightCls: 'bg-emerald-50 text-emerald-600' },
    intermediate: { label: 'Středně pokročilý', cls: 'bg-amber-500/10 text-amber-400', lightCls: 'bg-amber-50 text-amber-600' },
    advanced: { label: 'Pokročilý', cls: 'bg-red-500/10 text-red-400', lightCls: 'bg-red-50 text-red-600' }
};

const CATEGORIES = [
    { id: 'vse', label: 'Vše', icon: 'layout-grid', slugs: null, difficulty: null },
    { id: 'programovani', label: 'Programování', icon: 'code-2', slugs: ['python','javascript','typescript','php','java','csharp','cpp','rust','golang','kotlin','swift','ruby'], difficulty: null },
    { id: 'web', label: 'Web & DB', icon: 'globe', slugs: ['html-css','sql'], difficulty: null },
    { id: 'nastroje', label: 'Nástroje', icon: 'wrench', slugs: ['git','docker','terminal'], difficulty: null },
    { id: 'zaklady', label: 'Základy', icon: 'graduation-cap', slugs: ['zaklady-programovani'], difficulty: null },
    { id: 'zacatecnik', label: 'Pro začátečníky', icon: 'star', slugs: null, difficulty: 'beginner' },
    { id: 'pokrocily', label: 'Pokročilé', icon: 'zap', slugs: null, difficulty: ['intermediate','advanced'] },
];

let vsechnyKurzy = [];
let aktivniKategorie = 'vse';
let hledaniText = '';

export async function renderCourses(kat) {
    const app = document.getElementById('app');
    const isDark = window.getTheme() === 'dark';
    const t2 = isDark ? 'text-[#6b7280]' : 'text-gray-500';
    const tI = isDark ? 'text-[#6b7280]' : 'text-gray-400';

    // Determine active category from route param or sessionStorage
    if (kat && CATEGORIES.find(c => c.id === kat)) {
        aktivniKategorie = kat;
    } else {
        aktivniKategorie = sessionStorage.getItem('vevit_edu_kategorie') || 'vse';
    }
    hledaniText = '';

    // Fetch courses
    vsechnyKurzy = await api.getKurzy();

    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-7xl mx-auto w-full animate-fadeUp">
        <div class="mb-8">
            <a href="#/" data-link class="inline-flex items-center gap-2 ${isDark ? 'text-text-secondary hover:text-accent' : 'text-gray-500 hover:text-emerald-600'} font-medium transition-colors">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na úvod
            </a>
        </div>
        <div class="text-center mb-10">
            <h1 class="text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-text-primary' : 'text-gray-900'} tracking-tight mb-3">
                <span class="text-accent">Kurzy</span> programování
            </h1>
            <p class="text-lg ${t2}">Vyber si kurz a začně se učit.</p>
        </div>

        <!-- CATEGORY FILTER BAR -->
        <div class="sticky top-16 z-30 ${isDark ? 'bg-[#0d0d0d]/95' : 'bg-white/95'} backdrop-blur-md ${isDark ? 'border-white/[0.06]' : 'border-gray-200'} border-b -mx-3 sm:-mx-5 lg:-mx-6 px-3 sm:px-5 lg:px-6 py-3 mb-6">
            <div id="category-bar" class="flex gap-2 overflow-x-auto scrollbar-none pb-1" style="-ms-overflow-style:none; scrollbar-width:none;">
                ${CATEGORIES.map(cat => {
                    const count = countCategory(cat, vsechnyKurzy);
                    const isActive = cat.id === aktivniKategorie;
                    return `<button data-category="${cat.id}" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${isActive
                        ? `${isDark ? 'bg-accent text-[#0d0d0d] shadow-lg shadow-accent/25' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'}`
                        : `${isDark ? 'bg-[#161616] text-[#8b8ba8] hover:bg-[#1e1e1e] hover:text-[#e2e2f0] border border-[rgba(255,255,255,0.08)]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 border border-gray-200'}`
                    }">
                        <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
                        ${cat.label}
                        <span class="${isActive ? (isDark ? 'bg-white/20' : 'bg-white/30') : (isDark ? 'bg-white/10' : 'bg-gray-200')} text-xs px-1.5 py-0.5 rounded-full">${count}</span>
                    </button>`;
                }).join('')}
            </div>
        </div>

        <!-- COURSE COUNT + SEARCH -->
        <div class="flex items-center justify-between mb-4">
            <p class="text-sm ${t2}">
                Zobrazeno <span id="count-number">${vsechnyKurzy.length}</span> kurzů
            </p>
            <div class="relative">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${tI}"></i>
                <input id="kurz-search" type="text" placeholder="Hledat kurz..." class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.08)] text-text-primary placeholder-[#6b7280] focus:border-accent' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'} border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 w-48 transition-all" />
            </div>
        </div>

        <!-- COURSE GRID -->
        <div id="kurzy-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        </div>

        <!-- EMPTY STATE -->
        <div id="prazdny-stav" class="hidden text-center py-20">
            <i data-lucide="search-x" class="w-12 h-12 ${tI} mx-auto mb-4"></i>
            <p class="${t2} text-lg">Žádné kurzy nenalezeny</p>
            <button id="reset-filter-btn" class="mt-4 ${isDark ? 'text-accent' : 'text-emerald-600'} text-sm underline hover:no-underline">Zobrazit všechny kurzy</button>
        </div>
    </div>`;

    lucide.createIcons();
    setupCategoryFilter(isDark);
    setupCourseSearch(isDark);
    zobrazFiltrovane(isDark);
}

function countCategory(cat, kurzy) {
    if (!cat.slugs && !cat.difficulty) return kurzy.length;
    if (cat.slugs) return kurzy.filter(k => cat.slugs.includes(k.slug)).length;
    const diff = Array.isArray(cat.difficulty) ? cat.difficulty : [cat.difficulty];
    return kurzy.filter(k => diff.includes(k.difficulty)).length;
}

function renderKurzKarta(kurz, isDark) {
    const iconUrl = getCourseIconUrl(kurz.slug);
    const hasContent = (kurz.lesson_count || 0) > 0;
    const diffMap = {
        beginner:     { label: 'Začátečník', darkCls: 'bg-emerald-500/10 text-emerald-400', lightCls: 'bg-emerald-50 text-emerald-600' },
        intermediate: { label: 'Pokročilý',  darkCls: 'bg-amber-500/10 text-amber-400',    lightCls: 'bg-amber-50 text-amber-600' },
        advanced:     { label: 'Expert',      darkCls: 'bg-red-500/10 text-red-400',        lightCls: 'bg-red-50 text-red-600' },
    };
    const diff = diffMap[kurz.difficulty] || diffMap.beginner;
    const diffCls = isDark ? diff.darkCls : diff.lightCls;

    return `<a href="#/kurz/${kurz.slug}" data-link class="group ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border rounded-xl p-5 transition-all">
        <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center shrink-0">
                <img src="${iconUrl}" alt="${kurz.title}" class="w-6 h-6 object-contain" loading="lazy" onerror="this.style.display='none'">
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${diffCls}">${diff.label}</span>
        </div>
        <h3 class="text-sm font-bold ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors">${kurz.title}</h3>
        <p class="text-xs ${isDark ? 'text-[#6b7280]' : 'text-gray-500'} mt-1 line-clamp-2 leading-relaxed">${kurz.description || ''}</p>
        <div class="flex items-center gap-3 mt-3 text-xs font-semibold ${isDark ? 'text-[#6b7280]' : 'text-gray-500'}">
            ${hasContent
                ? `<span class="flex items-center gap-1"><i data-lucide="book-open" class="w-3 h-3"></i>${kurz.lesson_count} lekcí</span>`
                : '<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>Již brzy</span>'}
            <span class="flex items-center gap-1 ${isDark ? 'text-accent' : 'text-emerald-600'}"><i data-lucide="star" class="w-3 h-3"></i>${kurz.xp_reward} XP</span>
        </div>
    </a>`;
}

function filterKurzy(categoryId) {
    aktivniKategorie = categoryId;
    sessionStorage.setItem('vevit_edu_kategorie', categoryId);
    const isDark = window.getTheme() === 'dark';

    // Update pill active states
    document.querySelectorAll('.category-pill').forEach(btn => {
        const isActive = btn.dataset.category === categoryId;
        // Remove all state classes
        btn.className = btn.className
            .replace(/bg-accent/g, '').replace(/text-\[#0d0d0d\]/g, '')
            .replace(/shadow-lg/g, '').replace(/shadow-accent\/25/g, '')
            .replace(/bg-\[#161616\]/g, '').replace(/text-\[#8b8ba8\]/g, '')
            .replace(/hover:bg-\[#1e1e1e\]/g, '').replace(/hover:text-\[#e2e2f0\]/g, '')
            .replace(/border-\[rgba\(255,255,255,0\.08\)\]/g, '')
            .replace(/bg-emerald-600/g, '').replace(/text-white/g, '')
            .replace(/shadow-emerald-600\/25/g, '')
            .replace(/bg-gray-100/g, '').replace(/text-gray-500/g, '')
            .replace(/hover:bg-gray-200/g, '').replace(/hover:text-gray-700/g, '')
            .replace(/border-gray-200/g, '').replace(/border/g, '')
            .replace(/\s+/g, ' ').trim();

        if (isActive) {
            if (isDark) {
                btn.classList.add('bg-accent', 'text-[#0d0d0d]', 'shadow-lg', 'shadow-accent/25');
            } else {
                btn.classList.add('bg-emerald-600', 'text-white', 'shadow-lg', 'shadow-emerald-600/25');
            }
        } else {
            if (isDark) {
                btn.classList.add('bg-[#161616]', 'text-[#8b8ba8]', 'hover:bg-[#1e1e1e]', 'hover:text-[#e2e2f0]', 'border', 'border-[rgba(255,255,255,0.08)]');
            } else {
                btn.classList.add('bg-gray-100', 'text-gray-500', 'hover:bg-gray-200', 'hover:text-gray-700', 'border', 'border-gray-200');
            }
        }
    });

    zobrazFiltrovane(isDark);

    // Update URL without full page reload
    const newPath = categoryId === 'vse' ? '/kurzy' : `/kurzy/${categoryId}`;
    if (window.location.protocol === 'file:') {
        window.history.replaceState(null, '', `#${newPath}`);
    } else {
        window.history.replaceState(null, '', newPath);
    }
}

// Expose globally for onclick
window.filterKurzy = filterKurzy;

function zobrazFiltrovane(isDark) {
    const kategorie = CATEGORIES.find(c => c.id === aktivniKategorie);
    const query = hledaniText.toLowerCase().trim();

    let filtrovane = vsechnyKurzy.filter(kurz => {
        // Category filter
        let matchKat = true;
        if (kategorie && kategorie.slugs) {
            matchKat = kategorie.slugs.includes(kurz.slug);
        } else if (kategorie && kategorie.difficulty) {
            const diff = Array.isArray(kategorie.difficulty) ? kategorie.difficulty : [kategorie.difficulty];
            matchKat = diff.includes(kurz.difficulty);
        }

        // Search filter
        const matchSearch = !query ||
            kurz.title.toLowerCase().includes(query) ||
            (kurz.description || '').toLowerCase().includes(query);

        return matchKat && matchSearch;
    });

    // Update count
    const countEl = document.getElementById('count-number');
    if (countEl) countEl.textContent = filtrovane.length;

    // Show/hide empty state
    const prazdny = document.getElementById('prazdny-stav');
    const grid = document.getElementById('kurzy-grid');
    if (filtrovane.length === 0) {
        grid.classList.add('hidden');
        prazdny.classList.remove('hidden');
    } else {
        grid.classList.remove('hidden');
        prazdny.classList.add('hidden');
    }

    // Fade animation
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(8px)';
    grid.style.transition = 'opacity 200ms ease, transform 200ms ease';

    setTimeout(() => {
        grid.innerHTML = filtrovane.map(k => renderKurzKarta(k, isDark)).join('');
        lucide.createIcons();
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
    }, 200);
}

function setupCategoryFilter(isDark) {
    const bar = document.getElementById('category-bar');
    bar.addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;
        filterKurzy(pill.dataset.category);
    });

    // Reset filter button in empty state
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => filterKurzy('vse'));
    }
}

function setupCourseSearch(isDark) {
    const input = document.getElementById('kurz-search');
    if (!input) return;
    input.addEventListener('input', (e) => {
        hledaniText = e.target.value;
        zobrazFiltrovane(isDark);
    });
}