        let pageId = null;

        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            document.getElementById('scroll-to-top')?.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            initWikiPage();
        });

        async function initWikiPage() {
            const params = new URLSearchParams(window.location.search);
            const articleTitle = params.get('article');
            const originalQuery = params.get('q');
            const highlightParam = params.get('highlight');

            if (!articleTitle) {
                showError();
                return;
            }

            try {
                const data = await getArticleDetails(articleTitle);

                if (!data) {
                    showError();
                    return;
                }

                pageId = data.pageid;

                // Update page
                document.title = `${data.title} — edu.vevit.fun`;
                document.getElementById('article-title').textContent = data.title;
                document.getElementById('article-title-nav').textContent = data.title;
                const sanitized = window.VeVitContentSanitizer?.sanitizeWikipedia(data.content);
                if (!(sanitized instanceof HTMLBodyElement)) throw new Error('Bezpečný renderer není dostupný.');
                document.getElementById('article-content').replaceChildren(...Array.from(sanitized.childNodes));
                document.getElementById('wiki-link').href = `https://cs.wikipedia.org/?curid=${pageId}`;

                // Build TOC
                buildTOC(data.sections);

                // Show content
                document.getElementById('loading-state').classList.add('hidden');
                document.getElementById('content-wrapper').classList.remove('hidden');

                lucide.createIcons();

                // Handle internal links
                setupInternalLinks();

                // Highlighting
                if (highlightParam) {
                    highlightText(highlightParam);
                } else if (originalQuery) {
                    const cleanQuery = originalQuery.replace(/\?+$/, '');
                    const searchTerms = cleanQuery.split(' ').map(s => s.trim()).filter(s => s.length > 3);
                    if (searchTerms.length > 0) {
                        highlightTerms(searchTerms);
                    }
                }
            } catch (error) {
                console.error('Error loading article:', error);
                showError();
            }
        }

        async function getArticleDetails(title) {
            const url = `/edu/api/wikipedia.php?action=parse&lang=cs&title=${encodeURIComponent(title)}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (!response.ok || data.error || typeof data.content !== 'string') return null;
                return data;
            } catch (error) {
                console.error('Wiki article error:', error);
                return null;
            }
        }

        function buildTOC(sections) {
            const nav = document.getElementById('toc-nav');
            const topLevelSections = sections.filter(s => s.toclevel === 1);

            nav.replaceChildren(...topLevelSections.map(section => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'block w-full text-left text-sm text-text-secondary hover:text-accent transition-colors truncate';
                button.textContent = section.line;
                button.addEventListener('click', () => scrollToSection(section.anchor));
                return button;
            }));
        }

        function scrollToSection(anchor) {
            const element = document.getElementById(anchor);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

        function setupInternalLinks() {
            const content = document.getElementById('article-content');
            content.addEventListener('click', (e) => {
                const target = e.target.closest('a');
                if (!target) return;

                const href = target.getAttribute('href');

                if (href && (href.startsWith('/wiki/') || href.startsWith('./'))) {
                    e.preventDefault();

                    let titleSegment = href.startsWith('/wiki/') ? href.substring(6) : href.substring(2);

                    try {
                        let newTitle = decodeURIComponent(titleSegment);
                        if (newTitle.includes('#')) {
                            newTitle = newTitle.split('#')[0];
                        }
                        if (newTitle) {
                            window.location.href = `/wiki.html?article=${encodeURIComponent(newTitle)}`;
                        }
                    } catch (err) {
                        console.error('Error parsing link:', href);
                    }
                }
            });
        }

        function highlightText(text) {
            const content = document.getElementById('article-content');
            const markInstance = new Mark(content);

            markInstance.mark(text.trim(), {
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
        }

        function highlightTerms(terms) {
            const content = document.getElementById('article-content');
            const markInstance = new Mark(content);

            markInstance.mark(terms, {
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

        function showError() {
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('error-state').classList.remove('hidden');
        }
