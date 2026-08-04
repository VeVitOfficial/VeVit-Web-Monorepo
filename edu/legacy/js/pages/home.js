import { COURSE_ICON_URLS, SITE_ITEMS } from '../shared/mockData.js';

const WIKI_APIS = {
    cs: 'https://cs.wikipedia.org/w/api.php',
    en: 'https://en.wikipedia.org/w/api.php',
    de: 'https://de.wikipedia.org/w/api.php',
    uk: 'https://uk.wikipedia.org/w/api.php',
    es: 'https://es.wikipedia.org/w/api.php',
};

export async function renderHome() {
    const app = document.getElementById('app');
    const isDark = window.getTheme() === 'dark';
    const t2 = isDark ? 'text-[#6b7280]' : 'text-gray-500';   // secondary text
    const t3 = isDark ? 'text-text-muted' : 'text-gray-400';    // muted/tertiary
    const tI = isDark ? 'text-[#6b7280]' : 'text-gray-400';     // icons muted

    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-7xl mx-auto w-full animate-fadeUp">
        <!-- HERO -->
        <div class="text-center mb-10 mt-6">
            <h1 class="text-5xl font-bold mb-3 tracking-tight ${isDark ? 'text-text-primary' : 'text-gray-900'}" style="letter-spacing:-0.02em">
                Uč se. Zkoušej. <span class="text-accent">Rostuj.</span>
            </h1>
            <p class="text-base ${t2} max-w-xl mx-auto mb-8">
                Kurzy, články a kvízy v češtině — zcela zdarma.
            </p>
            <!-- Search -->
            <div class="max-w-xl mx-auto relative">
                <div class="relative flex items-center">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black ${t3} select-none">W</span>
                    <input id="search-input" type="text" placeholder="Hledej na stránce i na Wikipedii..." class="search-input w-full pl-11 pr-4 py-3.5 rounded-xl ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-300'} border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-sm" />
                </div>
                <div id="search-live" class="hidden absolute top-full left-0 right-0 mt-2 rounded-xl ${isDark ? 'bg-[#1e1e1e] border-[rgba(255,255,255,0.1)]' : 'bg-white border-gray-200'} border shadow-2xl z-50 overflow-hidden"></div>
            </div>
        </div>

        <!-- CATEGORY GRID (BENTO) -->
        <section id="section-kurzy" class="mb-14">
            <div class="grid grid-cols-2 gap-3">
                <!-- Programování -->
                <a href="kurzy/programovani.html" class="row-span-2 flex items-start gap-5 rounded-2xl ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border p-8 transition-all group cursor-pointer min-h-[200px]">
                    <div class="w-12 h-12 rounded-xl ${isDark ? 'bg-accent/10' : 'bg-emerald-50'} flex items-center justify-center shrink-0">
                        <i data-lucide="code-2" class="w-6 h-6 ${isDark ? 'text-accent' : 'text-emerald-500'}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-xl font-bold ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors">Programování</span>
                        <p class="text-sm ${t2} mt-1.5 line-clamp-2">Python, JavaScript, HTML/CSS, SQL a další. Od základů po pokročilé projekty.</p>
                        <span class="inline-flex items-center gap-1.5 mt-3 text-xs font-bold ${isDark ? 'text-accent' : 'text-emerald-600'}">
                            <i data-lucide="book-open" class="w-3.5 h-3.5"></i> 500+ lekcí
                        </span>
                    </div>
                </a>
                <!-- Matematika -->
                <a href="#/kurzy" data-link class="flex items-start gap-4 rounded-2xl ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border p-5 transition-all group cursor-pointer min-h-[96px]">
                    <div class="w-10 h-10 rounded-lg ${isDark ? 'bg-accent/10' : 'bg-emerald-50'} flex items-center justify-center shrink-0">
                        <i data-lucide="calculator" class="w-5 h-5 ${isDark ? 'text-accent' : 'text-emerald-500'}"></i>
                    </div>
                    <div>
                        <span class="font-semibold ${isDark ? 'text-[#f0f0f0] group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors" style="font-size:1rem;line-height:1.5rem">Matematika</span>
                        <span class="block text-xs ${t2} mt-0.5">Již brzy</span>
                    </div>
                </a>
                <!-- Věda -->
                <a href="#/kurzy" data-link class="flex items-start gap-4 rounded-2xl ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border p-5 transition-all group cursor-pointer min-h-[96px]">
                    <div class="w-10 h-10 rounded-lg ${isDark ? 'bg-accent/10' : 'bg-emerald-50'} flex items-center justify-center shrink-0">
                        <i data-lucide="flask-conical" class="w-5 h-5 ${isDark ? 'text-accent' : 'text-emerald-500'}"></i>
                    </div>
                    <div>
                        <span class="font-semibold ${isDark ? 'text-[#f0f0f0] group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors" style="font-size:1rem;line-height:1.5rem">Věda</span>
                        <span class="block text-xs ${t2} mt-0.5">Již brzy</span>
                    </div>
                </a>
                <!-- Jazyky -->
                <a href="#/kurzy" data-link class="flex items-start gap-3 rounded-2xl ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border p-4 transition-all group cursor-pointer min-h-[80px]">
                    <div class="w-9 h-9 rounded-lg ${isDark ? 'bg-accent/10' : 'bg-emerald-50'} flex items-center justify-center shrink-0">
                        <i data-lucide="languages" class="w-4 h-4 ${isDark ? 'text-accent' : 'text-emerald-500'}"></i>
                    </div>
                    <div>
                        <span class="font-semibold text-sm ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors">Jazyky</span>
                        <span class="block text-xs ${t2} mt-0.5">Již brzy</span>
                    </div>
                </a>
                <!-- Historie -->
                <a href="#/kurzy" data-link class="flex items-start gap-3 rounded-2xl ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border p-4 transition-all group cursor-pointer min-h-[80px]">
                    <div class="w-9 h-9 rounded-lg ${isDark ? 'bg-accent/10' : 'bg-emerald-50'} flex items-center justify-center shrink-0">
                        <i data-lucide="landmark" class="w-4 h-4 ${isDark ? 'text-accent' : 'text-emerald-500'}"></i>
                    </div>
                    <div>
                        <span class="font-semibold text-sm ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors">Historie</span>
                        <span class="block text-xs ${t2} mt-0.5">Již brzy</span>
                    </div>
                </a>
            </div>
        </section>

        <!-- NEDÁVNO PŘIDÁNO -->
        <section class="mb-14">
            <h2 class="text-xl font-bold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-5">Nedávno přidáno</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                ${recentArticle(isDark, 'Programování', 'Python: Instalace a první program', '1. dubna 2026', '10 min', 'python', 1)}
                ${recentArticle(isDark, 'Programování', 'Python: Proměnné a přiřazení', '1. dubna 2026', '10 min', 'python', 2)}
                ${recentArticle(isDark, 'Programování', 'JavaScript: Úvod do JS', '3. dubna 2026', '12 min', 'javascript', 101)}
            </div>
        </section>

        <!-- LEKCE -->
        <section id="section-lekce" class="mb-14">
            <h2 class="text-xl font-bold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-5">Lekce</h2>
            <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center">
                <i data-lucide="notebook-pen" class="w-10 h-10 mx-auto mb-3 ${tI}"></i>
                <h3 class="font-semibold ${isDark ? 'text-[#f0f0f0]' : 'text-gray-900'} mb-1" style="font-size:1rem;line-height:1.5rem">Uživatelské lekce</h3>
                <p class="text-sm ${t2}">Lekce vytvořené komunitou.</p>
                <span class="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-white/5 text-[#6b7280]' : 'bg-gray-100 text-gray-500'}">Již brzy</span>
            </div>
        </section>

        <!-- ČLÁNKY -->
        <section id="section-clanky" class="mb-8">
            <h2 class="text-xl font-bold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-5">Články</h2>
            <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center">
                <i data-lucide="file-text" class="w-10 h-10 mx-auto mb-3 ${tI}"></i>
                <h3 class="font-semibold ${isDark ? 'text-[#f0f0f0]' : 'text-gray-900'} mb-1" style="font-size:1rem;line-height:1.5rem">Teoretické články</h3>
                <p class="text-sm ${t2}">Články a teorie napsané uživateli.</p>
                <span class="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-white/5 text-[#6b7280]' : 'bg-gray-100 text-gray-500'}">Již brzy</span>
            </div>
        </section>
    </div>`;

    lucide.createIcons();
    setupSearch(isDark);

    // Scroll to section if requested via navbar
    const scrollTarget = sessionStorage.getItem('vevit_scroll_to');
    if (scrollTarget) {
        sessionStorage.removeItem('vevit_scroll_to');
        setTimeout(() => {
            const el = document.getElementById(scrollTarget);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function recentArticle(isDark, category, title, date, readTime, slug, lessonId) {
    const href = `#/lekce/${lessonId}`;
    const t2 = isDark ? 'text-[#6b7280]' : 'text-gray-500';
    const iconUrl = COURSE_ICON_URLS[slug];
    const iconHtml = iconUrl
        ? `<img src="${iconUrl}" alt="${slug}" class="w-8 h-8 object-contain" loading="lazy">`
        : `<i data-lucide="file-text" class="w-4 h-4 ${isDark ? 'text-accent' : 'text-emerald-500'}"></i>`;
    return `<a href="${href}" data-link class="flex items-start gap-4 ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)] hover:border-[rgba(16,185,129,0.2)]' : 'bg-white border-gray-200 hover:border-emerald-300'} border rounded-xl p-4 transition-all group">
        <div class="w-10 h-10 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'} flex items-center justify-center shrink-0">${iconHtml}</div>
        <div class="flex-1 min-w-0">
            <span class="text-xs uppercase font-bold tracking-wider ${isDark ? 'text-accent' : 'text-emerald-600'}">${category}</span>
            <h4 class="text-sm font-semibold ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors mt-0.5 line-clamp-1">${title}</h4>
            <div class="flex items-center gap-2 mt-1.5 text-xs ${t2}">
                <span>${date}</span>
                <span>·</span>
                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${readTime}</span>
            </div>
        </div>
    </a>`;
}

let searchTimeout = null;

function setupSearch(isDark) {
    const input = document.getElementById('search-input');
    const liveDiv = document.getElementById('search-live');

    input.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const q = input.value.trim();
        if (q.length < 2) { liveDiv.classList.add('hidden'); return; }
        searchTimeout = setTimeout(() => performUnifiedSearch(q, isDark), 250);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(searchTimeout);
            const q = input.value.trim();
            if (q.length >= 2) performUnifiedSearch(q, isDark);
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !liveDiv.contains(e.target)) liveDiv.classList.add('hidden');
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) liveDiv.classList.remove('hidden');
    });
}

async function performUnifiedSearch(query, isDark) {
    const liveDiv = document.getElementById('search-live');
    const q = query.toLowerCase();
    const t2 = isDark ? 'text-[#6b7280]' : 'text-gray-500';
    const tI = isDark ? 'text-[#6b7280]' : 'text-gray-400';
    liveDiv.classList.remove('hidden');

    liveDiv.innerHTML = `<div class="p-4 space-y-3">
        <div class="skeleton h-5 w-32 rounded"></div>
        <div class="skeleton h-12 w-full rounded-lg"></div>
    </div>`;

    // Fetch both in parallel
    const siteResults = SITE_ITEMS.filter(item =>
        item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );

    const lang = window.getLang();
    const wikiUrl = WIKI_APIS[lang] || WIKI_APIS.cs;
    let wikiResults = [];
    try {
        const res = await fetch(`${wikiUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*&utf8=1`);
        const data = await res.json();
        wikiResults = data.query?.search || [];
    } catch {}

    if (siteResults.length === 0 && wikiResults.length === 0) {
        liveDiv.innerHTML = `<div class="p-5 text-center">
            <p class="text-sm ${t2}">Žádné výsledky pro "${query}"</p>
        </div>`;
        return;
    }

    // Merge: first result = Wiki, second = VeVit (if any), then interleave by relevance
    const merged = [];
    const wikiItems = wikiResults.map(r => ({
        type: 'wiki',
        title: r.title,
        desc: r.snippet.replace(/<[^>]+>/g, ''),
        href: `#/wiki?article=${encodeURIComponent(r.title)}&q=${encodeURIComponent(query)}`,
    }));
    const vevitItems = siteResults.slice(0, 5).map(item => {
        const isCourse = item.type === 'kurz';
        return {
            type: 'vevit',
            title: item.title,
            desc: item.desc,
            href: isCourse ? `#/kurz/${item.slug}` : `#/lekce/${item.slug}`,
            label: isCourse ? 'Kurz' : 'Lekce',
        };
    });

    // First: Wiki, second: VeVit (if exists), then interleave rest
    let wi = 0, vi = 0;
    // Pick first wiki
    if (wi < wikiItems.length) { merged.push(wikiItems[wi++]); }
    // Pick first vevit
    if (vi < vevitItems.length) { merged.push(vevitItems[vi++]); }
    // Interleave remaining
    while (wi < wikiItems.length || vi < vevitItems.length) {
        if (wi < wikiItems.length) merged.push(wikiItems[wi++]);
        if (vi < vevitItems.length) merged.push(vevitItems[vi++]);
    }

    let html = '';
    for (const item of merged) {
        if (item.type === 'wiki') {
            html += `<a href="${item.href}" data-link class="flex items-center gap-3 px-4 py-2.5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors">
                <span class="w-5 h-5 flex items-center justify-center text-xs font-black ${tI} shrink-0">W</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold ${isDark ? 'text-text-primary' : 'text-gray-900'} truncate">${item.title}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-white/5 text-[#6b7280]' : 'bg-gray-100 text-gray-500'}">Wiki</span>
                    </div>
                    <p class="text-xs ${t2} line-clamp-1">${item.desc}</p>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 ${isDark ? 'text-[#6b7280]' : 'text-gray-400'} shrink-0"></i>
            </a>`;
        } else {
            html += `<a href="${item.href}" data-link class="flex items-center gap-3 px-4 py-2.5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors">
                <i data-lucide="book-open" class="w-4 h-4 ${tI} shrink-0"></i>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold ${isDark ? 'text-text-primary' : 'text-gray-900'} truncate">${item.title}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-accent/10 text-accent' : 'bg-emerald-50 text-emerald-600'}">${item.label}</span>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 ${isDark ? 'text-[#6b7280]' : 'text-gray-400'} shrink-0"></i>
            </a>`;
        }
    }

    liveDiv.innerHTML = html;
    lucide.createIcons();

    liveDiv.querySelectorAll('a[data-link]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            liveDiv.classList.add('hidden');
            window.location.hash = a.getAttribute('href').replace('#', '');
        });
    });
}