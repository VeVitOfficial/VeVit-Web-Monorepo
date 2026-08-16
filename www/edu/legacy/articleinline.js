document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();

            // TOC active state on scroll
            const tocLinks = document.querySelectorAll('.toc-link');
            const sections = document.querySelectorAll('.article-content h2[id], .article-content h3[id]');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        tocLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${entry.target.id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, { rootMargin: '-20% 0px -70% 0px' });

            sections.forEach(section => observer.observe(section));
        });
