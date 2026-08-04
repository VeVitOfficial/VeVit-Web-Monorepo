import { getVevitUser, formatXP, getLevel } from '../auth.js';
import { api } from '../shared/api.js';
import { findCourseByLessonId } from '../shared/mockData.js';

function getBreadcrumbCourse(lessonId) {
    // 1. try URL param ?kurz=javascript
    const params = new URLSearchParams(location.search);
    const kurzParam = params.get('kurz');
    if (kurzParam) {
        const course = findCourseByLessonId(lessonId);
        if (course) return course;
        return { slug: kurzParam, title: kurzParam.charAt(0).toUpperCase() + kurzParam.slice(1) };
    }
    // 2. try sessionStorage
    try {
        const stored = sessionStorage.getItem('vevit_current_course');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.slug && parsed.title) return parsed;
        }
    } catch {}
    // 3. find in MOCK_COURSES
    const found = findCourseByLessonId(lessonId);
    if (found) return found;
    // 4. fallback
    return { slug: 'python', title: 'Python' };
}

export async function renderLesson(id) {
    const app = document.getElementById('app');
    const isDark = window.getTheme() === 'dark';

    // Skeleton
    app.innerHTML = `<div class="flex-1 pt-20">
        <div class="max-w-3xl mx-auto px-3 sm:px-5 lg:px-6 py-8">
            <div class="skeleton h-3 w-40 rounded mb-4"></div>
            <div class="skeleton h-4 w-24 rounded mb-6"></div>
            <div class="skeleton w-12 h-1 rounded-full mb-4"></div>
            <div class="skeleton h-9 w-3/4 rounded mb-2"></div>
            <div class="skeleton h-4 w-1/3 rounded mb-8"></div>
            <div class="space-y-4">
                <div class="skeleton w-full h-4 rounded"></div>
                <div class="skeleton w-full h-4 rounded"></div>
                <div class="skeleton w-5/6 h-4 rounded"></div>
            </div>
        </div>
    </div>`;

    const lesson = await api.getLekce(id);
    const courseInfo = getBreadcrumbCourse(id);

    // Normalize lesson type
    const lessonType = lesson ? (lesson.type || lesson.lesson_type || 'lesson') : 'lesson';
    const title = lesson ? (lesson.title || `Lekce ${id}`) : `Lekce ${id}`;
    const content = lesson ? (lesson.content || '<p>Obsah lekce se načítá...</p>') : '<p>Obsah lekce se načítá...</p>';
    const xpReward = lesson ? (lesson.xp || lesson.xp_reward || 10) : 10;

    const typeBadge = lessonType === 'quiz'
        ? '<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Kvíz</span>'
        : lessonType === 'final_quiz'
        ? '<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">Závěrečný kvíz</span>'
        : '<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Lekce</span>';

    app.innerHTML = `<div class="flex-1 pt-20">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeUp">
            <!-- Breadcrumb -->
            <nav class="flex items-center gap-2 text-xs ${isDark ? 'text-text-muted' : 'text-gray-500'} mb-4">
                <a href="#/" data-link class="hover:text-accent transition-colors">Domů</a>
                <i data-lucide="chevron-right" class="w-3 h-3"></i>
                <a href="#/kurzy" data-link class="hover:text-accent transition-colors">Kurzy</a>
                <i data-lucide="chevron-right" class="w-3 h-3"></i>
                <a href="#/kurz/${courseInfo.slug}" data-link class="hover:text-accent transition-colors">${courseInfo.title}</a>
            </nav>

            <!-- Category badge -->
            <div class="flex items-center gap-2 mb-4">
                ${typeBadge}
                <span class="text-xs font-semibold ${isDark ? 'text-text-muted' : 'text-gray-500'}">${xpReward} XP</span>
            </div>

            <!-- Title -->
            <h1 class="text-3xl sm:text-4xl font-extrabold ${isDark ? 'text-text-primary' : 'text-gray-900'} tracking-tight mb-4" style="line-height: 1.2; letter-spacing: -0.02em;">${title}</h1>

            <!-- Author row -->
            <div class="flex items-center gap-3 text-sm ${isDark ? 'text-text-muted' : 'text-gray-500'} mb-6">
                <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'} flex items-center justify-center">
                        <i data-lucide="graduation-cap" class="w-3 h-3"></i>
                    </div>
                    <span>VeVit Edu</span>
                </div>
                <span class="w-1 h-1 rounded-full ${isDark ? 'bg-text-muted' : 'bg-gray-300'}"></span>
                <span>${courseInfo.title}</span>
            </div>

            <!-- Separator -->
            <div class="w-12 h-1 bg-accent rounded-full mb-10"></div>

            <!-- Content -->
            <div class="wiki-content">
                ${content}
            </div>

            <!-- Footer -->
            <footer class="mt-12 pt-8 ${isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-gray-200'} border-t flex justify-between items-center">
                <span class="text-sm ${isDark ? 'text-text-muted' : 'text-gray-500'}">Zdroj: VeVit Edu</span>
                <button data-scroll-top class="px-5 py-2.5 bg-accent hover:bg-accent-hover text-[#0d0d0d] rounded-full font-semibold transition-all active:scale-95 flex items-center gap-2">
                    <i data-lucide="arrow-up" class="w-4 h-4"></i> Nahoru
                </button>
            </footer>
        </div>
    </div>`;

    lucide.createIcons();
    app.querySelector('[data-scroll-top]')?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
