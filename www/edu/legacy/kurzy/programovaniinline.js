import { MOCK_COURSES, getCourseIconUrl } from '../js/shared/mockData.js';

const CATEGORIES = [
    { id: 'vse', label: 'Vše', icon: 'layout-grid', slugs: null, difficulty: null },
    { id: 'programovani', label: 'Programování', icon: 'code-2', slugs: ['python','javascript','typescript','php','java','csharp','cpp','rust','golang','kotlin','swift','ruby'], difficulty: null },
    { id: 'web', label: 'Web & DB', icon: 'globe', slugs: ['html-css','sql'], difficulty: null },
    { id: 'nastroje', label: 'Nástroje', icon: 'wrench', slugs: ['git','docker','terminal'], difficulty: null },
    { id: 'zaklady', label: 'Základy', icon: 'graduation-cap', slugs: ['zaklady-programovani'], difficulty: null },
    { id: 'zacatecnik', label: 'Pro začátečníky', icon: 'star', slugs: null, difficulty: 'beginner' },
    { id: 'pokrocily', label: 'Pokročilé', icon: 'zap', slugs: null, difficulty: ['intermediate','advanced'] },
];

const DIFF_MAP = {
    beginner:     { label: 'Začátečník', darkCls: 'bg-emerald-500/10 text-emerald-400' },
    intermediate: { label: 'Pokročilý',  darkCls: 'bg-amber-500/10 text-amber-400' },
    advanced:     { label: 'Expert',      darkCls: 'bg-red-500/10 text-red-400' },
};

let vsechnyKurzy = [];
let aktivniKategorie = 'programovani'; // default na této stránce
let hledaniText = '';

function countCategory(cat) {
    if (!cat.slugs && !cat.difficulty) return vsechnyKurzy.length;
    if (cat.slugs) return vsechnyKurzy.filter(k => cat.slugs.includes(k.slug)).length;
    const diff = Array.isArray(cat.difficulty) ? cat.difficulty : [cat.difficulty];
    return vsechnyKurzy.filter(k => diff.includes(k.difficulty)).length;
}

function renderCategoryBar() {
    const bar = document.getElementById('category-bar');
    bar.innerHTML = CATEGORIES.map(cat => {
        const count = countCategory(cat);
        const isActive = cat.id === aktivniKategorie;
        return `<button data-category="${cat.id}" class="category-pill flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${isActive
            ? 'bg-accent text-[#0d0d0d] shadow-lg shadow-accent/25'
            : 'bg-[#161616] text-[#8b8ba8] hover:bg-[#1e1e1e] hover:text-[#e2e2f0] border border-[rgba(255,255,255,0.08)]'
        }">
            <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
            ${cat.label}
            <span class="${isActive ? 'bg-white/20' : 'bg-white/10'} text-xs px-1.5 py-0.5 rounded-full">${count}</span>
        </button>`;
    }).join('');
    lucide.createIcons();
}

function renderKurzKarta(kurz) {
    const iconUrl = getCourseIconUrl(kurz.slug);
    const hasContent = (kurz.lesson_count || 0) > 0;
    const diff = DIFF_MAP[kurz.difficulty] || DIFF_MAP.beginner;

    // Build link to course detail page
    const href = hasContent ? `kurz.html?slug=${kurz.slug}` : '#';

    return `<a href="${href}" class="group bg-[#161616] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)] rounded-xl p-5 transition-all block ${hasContent ? '' : 'opacity-50 pointer-events-none'}">
        <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <img src="${iconUrl}" alt="${kurz.title}" class="w-6 h-6 object-contain" loading="lazy" data-hide-on-error>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.darkCls}">${diff.label}</span>
        </div>
        <h3 class="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">${kurz.title}</h3>
        <p class="text-xs text-[#6b7280] mt-1 line-clamp-2 leading-relaxed">${kurz.description || ''}</p>
        <div class="flex items-center gap-3 mt-3 text-xs font-semibold text-[#6b7280]">
            ${hasContent
                ? `<span class="flex items-center gap-1"><i data-lucide="book-open" class="w-3 h-3"></i>${kurz.lesson_count} lekcí</span>`
                : '<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>Již brzy</span>'}
            <span class="flex items-center gap-1 text-accent"><i data-lucide="star" class="w-3 h-3"></i>${kurz.xp_reward} XP</span>
        </div>
    </a>`;
}

function zobrazFiltrovane() {
    const kategorie = CATEGORIES.find(c => c.id === aktivniKategorie);
    const query = hledaniText.toLowerCase().trim();

    let filtrovane = vsechnyKurzy.filter(kurz => {
        let matchKat = true;
        if (kategorie && kategorie.slugs) {
            matchKat = kategorie.slugs.includes(kurz.slug);
        } else if (kategorie && kategorie.difficulty) {
            const diff = Array.isArray(kategorie.difficulty) ? kategorie.difficulty : [kategorie.difficulty];
            matchKat = diff.includes(kurz.difficulty);
        }
        const matchSearch = !query ||
            kurz.title.toLowerCase().includes(query) ||
            (kurz.description || '').toLowerCase().includes(query);
        return matchKat && matchSearch;
    });

    document.getElementById('count-number').textContent = filtrovane.length;

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
        grid.innerHTML = filtrovane.map(k => renderKurzKarta(k)).join('');
        lucide.createIcons();
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
    }, 200);
}

function filterKurzy(categoryId) {
    aktivniKategorie = categoryId;
    renderCategoryBar();
    zobrazFiltrovane();
}

// Init
async function init() {
    // Use mock data (same as SPA when file:// protocol)
    const USE_MOCK = location.protocol === 'file:';
    if (USE_MOCK) {
        vsechnyKurzy = MOCK_COURSES;
    } else {
        try {
            const res = await fetch('/edu/legacy/api/kurzy');
            const json = await res.json();
            vsechnyKurzy = json.data ?? json;
        } catch {
            vsechnyKurzy = MOCK_COURSES;
        }
    }

    // Read category from URL hash (e.g. #programovani, #web, #vse)
    const hashCat = location.hash.slice(1);
    if (hashCat && CATEGORIES.find(c => c.id === hashCat)) {
        aktivniKategorie = hashCat;
    }

    renderCategoryBar();
    zobrazFiltrovane();

    // Category click
    document.getElementById('category-bar').addEventListener('click', (e) => {
        const pill = e.target.closest('.category-pill');
        if (!pill) return;
        filterKurzy(pill.dataset.category);
    });

    // Reset button
    document.getElementById('reset-filter-btn').addEventListener('click', () => filterKurzy('vse'));

    // Search
    document.getElementById('kurz-search').addEventListener('input', (e) => {
        hledaniText = e.target.value;
        zobrazFiltrovane();
    });
}

document.addEventListener('error', (event) => {
    if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-hide-on-error')) event.target.hidden = true;
}, true);

init();
