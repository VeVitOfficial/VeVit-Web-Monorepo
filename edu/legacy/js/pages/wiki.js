function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

export async function renderWiki() {
    const app = document.getElementById('app');
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const articleTitle = params.get('article');
    const originalQuery = params.get('q');
    const highlightParam = params.get('highlight');
    const requestedLang = params.get('lang') || window.getLang();
    const lang = ['cs', 'en', 'de', 'uk', 'es'].includes(requestedLang) ? requestedLang : 'cs';
    const isDark = window.getTheme() === 'dark';

    if (!articleTitle) {
        app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-4 text-center">
            <i data-lucide="alert-circle" class="w-16 h-16 mx-auto mb-4 text-error"></i>
            <h2 class="text-xl font-bold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-2">Článek nenalezen</h2>
            <p class="${isDark ? 'text-text-secondary' : 'text-gray-500'} mb-6">Zadej název článku pro vyhledání.</p>
            <a href="#/" data-link class="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-[#0d0d0d] font-semibold rounded-md transition-colors">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na úvod
            </a>
        </div>`;
        lucide.createIcons();
        return;
    }

    // Skeleton
    app.innerHTML = `<div class="flex-1 pt-20">
        <div class="flex w-full">
            <aside class="hidden lg:block w-[200px] flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto px-4">
                <div class="py-6 space-y-4">
                    <div class="skeleton h-4 w-32 rounded"></div>
                    <div class="skeleton h-3 w-24 rounded"></div>
                    <div class="skeleton h-3 w-28 rounded"></div>
                    <div class="skeleton h-3 w-20 rounded"></div>
                </div>
            </aside>
            <main class="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
                <div class="max-w-3xl">
                    <div class="skeleton h-3 w-40 rounded mb-4"></div>
                    <div class="skeleton h-8 w-24 rounded mb-6"></div>
                    <div class="skeleton w-16 h-1 rounded-full mb-4"></div>
                    <div class="skeleton h-10 w-3/4 rounded mb-2"></div>
                    <div class="skeleton h-4 w-1/2 rounded mb-8"></div>
                    <div class="space-y-4">
                        <div class="skeleton w-full h-4 rounded"></div>
                        <div class="skeleton w-full h-4 rounded"></div>
                        <div class="skeleton w-5/6 h-4 rounded"></div>
                    </div>
                </div>
            </main>
        </div>
    </div>`;

    try {
        const res = await fetch(`/edu/api/wikipedia.php?action=parse&lang=${encodeURIComponent(lang)}&title=${encodeURIComponent(articleTitle)}`);
        const data = await res.json();

        if (!res.ok || data.error || typeof data.content !== 'string') throw new Error('Article not found');

        const article = {
            title: String(data.title || articleTitle),
            content: data.content,
            sections: Array.isArray(data.sections) ? data.sections : [],
            pageid: data.pageid
        };
        const safeTitle = escapeHtml(article.title);

        document.title = `${article.title} — edu.vevit.fun`;

        const topLevelSections = article.sections.filter(s => s.toclevel === 1);
        const langLabel = {cs:'Česky',en:'English',de:'Deutsch',uk:'Українська',es:'Español'}[lang] || 'Česky';

        app.innerHTML = `<div class="flex-1 pt-20">
            <div class="flex w-full">
                <!-- Left Sidebar / TOC (Desktop) — 200px sticky -->
                <aside class="hidden lg:block w-[200px] flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto px-4">
                    <div class="py-6">
                        <button id="wiki-scroll-top" class="w-full text-left text-sm font-bold ${isDark ? 'text-text-primary hover:text-accent' : 'text-gray-900 hover:text-emerald-600'} transition-colors mb-4 truncate">
                            ${safeTitle}
                        </button>
                        <h3 class="text-xs font-bold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-gray-400'} mb-3">Obsah</h3>
                        <nav id="toc-nav" class="space-y-1.5"></nav>
                    </div>
                </aside>

                <!-- Main Content -->
                <main class="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8">
                    <!-- Mobile Back Button -->
                    <div class="lg:hidden mb-6">
                        <a href="#/" data-link class="inline-flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-gray-50 border-gray-200'} border rounded-md text-sm ${isDark ? 'text-text-secondary' : 'text-gray-500'}">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět
                        </a>
                    </div>

                    <article class="max-w-3xl">
                        <!-- Article Header -->
                        <header class="mb-10">
                            <!-- Breadcrumb -->
                            <nav class="flex items-center gap-2 text-xs ${isDark ? 'text-text-muted' : 'text-gray-400'} mb-4">
                                <a href="#/" data-link class="hover:text-accent transition-colors">Domů</a>
                                <i data-lucide="chevron-right" class="w-3 h-3"></i>
                                <span>Wikipedie</span>
                            </nav>

                            <!-- Category badge -->
                            <div class="flex items-center gap-2 mb-4">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-white/5 text-[#9ca3af]' : 'bg-gray-100 text-gray-500'}">
                                    <span class="w-2 h-2 rounded-full bg-accent"></span>
                                    Wikipedie
                                </span>
                                <span class="text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-gray-400'}">${langLabel}</span>
                            </div>

                            <!-- Title -->
                            <h1 class="text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-text-primary' : 'text-gray-900'} tracking-tight mb-4" style="line-height: 1.2; letter-spacing: -0.02em;">${safeTitle}</h1>

                            <!-- Author row -->
                            <div class="flex items-center gap-3 text-sm ${isDark ? 'text-text-muted' : 'text-gray-400'}">
                                <div class="flex items-center gap-2">
                                    <div class="w-5 h-5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} flex items-center justify-center">
                                        <span class="text-[10px] font-bold">W</span>
                                    </div>
                                    <span>Wikipedie</span>
                                </div>
                                <span class="w-1 h-1 rounded-full ${isDark ? 'bg-text-muted' : 'bg-gray-300'}"></span>
                                <span class="uppercase tracking-wider">${langLabel}</span>
                            </div>

                            <!-- Separator -->
                            <div class="w-12 h-1 bg-accent rounded-full mt-6"></div>
                        </header>

                        <!-- Article Body -->
                        <div id="article-content" class="wiki-content"></div>

                        <!-- Footer -->
                        <footer class="mt-16 pt-8 ${isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-gray-200'} border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span class="text-sm ${isDark ? 'text-text-muted' : 'text-gray-400'}">Zdroj: Wikipedie</span>
                            <a href="https://${lang}.wikipedia.org/?curid=${article.pageid}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-5 py-2.5 ${isDark ? 'bg-[#1e1e1e] hover:bg-[#262626] border-[rgba(255,255,255,0.08)]' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} border ${isDark ? 'text-text-primary' : 'text-gray-900'} rounded-md font-semibold text-sm transition-colors">
                                Otevřít na Wikipedii <i data-lucide="external-link" class="w-4 h-4"></i>
                            </a>
                        </footer>
                    </article>
                </main>
            </div>
        </div>`;

        lucide.createIcons();

        document.getElementById('wiki-scroll-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        const toc = document.getElementById('toc-nav');
        toc?.replaceChildren(...topLevelSections.map(section => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `block w-full text-left text-xs ${isDark ? 'text-text-secondary hover:text-accent' : 'text-gray-500 hover:text-emerald-600'} transition-colors truncate py-0.5`;
            button.textContent = String(section.line || '');
            button.addEventListener('click', () => document.getElementById(String(section.anchor || ''))?.scrollIntoView({ behavior: 'smooth' }));
            return button;
        }));

        // Handle internal wiki links
        const content = document.getElementById('article-content');
        const sanitized = window.VeVitContentSanitizer?.sanitizeWikipedia(article.content);
        if (!(sanitized instanceof HTMLBodyElement)) throw new Error('Bezpečný renderer není dostupný.');
        content.replaceChildren(...Array.from(sanitized.childNodes));
        content.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;
            const href = target.getAttribute('href');
            if (href && (href.startsWith('/wiki/') || href.startsWith('./'))) {
                e.preventDefault();
                let titleSegment = href.startsWith('/wiki/') ? href.substring(6) : href.substring(2);
                try {
                    let newTitle = decodeURIComponent(titleSegment);
                    if (newTitle.includes('#')) newTitle = newTitle.split('#')[0];
                    if (newTitle) {
                        window.location.hash = `/wiki?article=${encodeURIComponent(newTitle)}&lang=${lang}`;
                    }
                } catch (err) { console.error('Error parsing link:', href); }
            }
        });

        // Highlighting
        if (typeof Mark !== 'undefined') {
            if (highlightParam) {
                const markInstance = new Mark(content);
                markInstance.mark(highlightParam.trim(), {
                    separateWordSearch: false,
                    acrossElements: true,
                    className: 'ai-highlight',
                    done: (marks) => {
                        if (marks > 0) {
                            const firstMark = content.querySelector('mark');
                            if (firstMark) {
                                setTimeout(() => {
                                    firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    firstMark.classList.add('pulse-highlight');
                                }, 300);
                            }
                        }
                    }
                });
            } else if (originalQuery) {
                const cleanQuery = originalQuery.replace(/\?+$/, '');
                const searchTerms = cleanQuery.split(' ').map(s => s.trim()).filter(s => s.length > 3);
                if (searchTerms.length > 0) {
                    const markInstance = new Mark(content);
                    markInstance.mark(searchTerms, {
                        done: (marks) => {
                            if (marks > 0) {
                                setTimeout(() => {
                                    const firstMark = content.querySelector('mark');
                                    firstMark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 500);
                            }
                        }
                    });
                }
            }
        }

    } catch (err) {
        console.error('Error loading article:', err);
        app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-4 text-center">
            <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8 max-w-md mx-auto">
                <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-circle" class="w-6 h-6 text-error"></i>
                </div>
                <h2 class="text-xl font-semibold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-2">Článek nenalezen</h2>
                <p class="${isDark ? 'text-text-secondary' : 'text-gray-500'} mb-6">Omlouváme se, ale tento článek se nepodařilo najít.</p>
                <a href="#/" data-link class="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-[#0d0d0d] font-semibold rounded-md transition-colors">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na úvod
                </a>
            </div>
        </div>`;
        lucide.createIcons();
    }
}
