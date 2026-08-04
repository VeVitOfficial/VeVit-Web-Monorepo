import { getVevitUser } from '../auth.js';
import { courseIconImg } from '../shared/mockData.js';
import { api } from '../shared/api.js';

const DIFFICULTY_MAP = {
    beginner: { label: 'Začátečník', cls: 'bg-emerald-500/10 text-emerald-400', lightCls: 'bg-emerald-50 text-emerald-600' },
    intermediate: { label: 'Středně pokročilý', cls: 'bg-amber-500/10 text-amber-400', lightCls: 'bg-amber-50 text-amber-600' },
    advanced: { label: 'Pokročilý', cls: 'bg-red-500/10 text-red-400', lightCls: 'bg-red-50 text-red-600' }
};

function svgProgressRing(percent, size = 64, stroke = 5, isDark = true) {
    const r = (size / 2) - stroke;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const trackStroke = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
    return `<svg width="${size}" height="${size}" class="transform -rotate-90">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="${trackStroke}" stroke-width="${stroke}" fill="none"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="#10b981" stroke-width="${stroke}" fill="none"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
            style="transition: stroke-dashoffset 0.6s ease"/>
    </svg>`;
}

export async function renderCourse(slug) {
    const app = document.getElementById('app');
    const isDark = window.getTheme() === 'dark';

    // Skeleton
    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-5xl mx-auto w-full animate-fadeUp">
        <div class="skeleton w-28 h-5 rounded mb-8"></div>
        <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8 mb-8">
            <div class="flex items-center gap-4 mb-4">
                <div class="skeleton w-16 h-16 rounded-xl"></div>
                <div class="flex-1"><div class="skeleton h-8 w-48 rounded mb-2"></div><div class="skeleton h-4 w-24 rounded"></div></div>
            </div>
            <div class="skeleton h-4 w-full rounded mb-2"></div>
            <div class="skeleton h-4 w-2/3 rounded"></div>
        </div>
        <div class="space-y-2">
            ${Array(5).fill('').map(() => `<div class="skeleton h-12 w-full rounded-lg"></div>`).join('')}
        </div>
    </div>`;

    lucide.createIcons();

    // Fetch course data
    const kurz = await api.getKurz(slug);
    if (!kurz) {
        app.innerHTML = `<div class="flex-1 pt-24 pb-16 text-center">
            <p class="text-lg ${isDark ? 'text-text-muted' : 'text-gray-500'}">Kurz nenalezen</p>
            <a href="#/kurzy" data-link class="text-accent mt-4 inline-block">Zpět na kurzy</a>
        </div>`;
        lucide.createIcons();
        return;
    }

    const lessons = await api.getKurzLekce(slug);

    const diff = DIFFICULTY_MAP[kurz.difficulty] || DIFFICULTY_MAP.beginner;
    const diffCls = isDark ? diff.cls : diff.lightCls;
    const user = getVevitUser();
    const totalXP = lessons.reduce((s, l) => s + (l.xp || l.xp_reward || 0), 0);
    const lessonCount = lessons.filter(l => (l.type || l.lesson_type) === 'lesson').length;
    const quizCount = lessons.filter(l => {
        const t = l.type || l.lesson_type;
        return t === 'quiz' || t === 'final_quiz';
    }).length;

    // Simulated progress (mock: user completed first 3 lessons)
    const completedIds = user ? lessons.slice(0, 3).map(l => l.id) : [];
    const completedCount = lessons.filter(l => completedIds.includes(l.id)).length;
    const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

    // Store course context for lesson breadcrumb
    sessionStorage.setItem('vevit_current_course', JSON.stringify({ slug: kurz.slug, title: kurz.title }));

    // Use sections from mockData if available, otherwise group flat lessons
    const sections = kurz.sections || groupLessonsIntoSections(lessons);

    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-5xl mx-auto w-full animate-fadeUp">
        <a href="#/kurzy" data-link class="inline-flex items-center gap-2 ${isDark ? 'text-text-secondary hover:text-accent' : 'text-gray-500 hover:text-emerald-600'} font-medium mb-8 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na kurzy
        </a>

        <!-- HEADER CARD (asymmetric: 60/40) -->
        <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8 mb-8">
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Left: 60% — Icon, title, description -->
                <div class="flex-1 lg:flex-[3]">
                    <div class="flex items-center gap-4 mb-5">
                        <div class="w-16 h-16 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, ${kurz.thumbnail_color}20, ${kurz.thumbnail_color}35)">
                            ${courseIconImg(slug, 48)}
                        </div>
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold ${isDark ? 'text-text-primary' : 'text-gray-900'} tracking-tight">${kurz.title}</h1>
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${diffCls} mt-1 inline-block">${diff.label}</span>
                        </div>
                    </div>
                    ${kurz.description ? `<p class="text-sm ${isDark ? 'text-text-secondary' : 'text-gray-500'} leading-relaxed">${kurz.description}</p>` : ''}
                </div>
                <!-- Right: 40% — Stats -->
                <div class="lg:flex-[2] flex flex-col items-center justify-center ${isDark ? 'border-[rgba(255,255,255,0.06)] lg:border-l' : 'border-gray-200 lg:border-l'} lg:pl-8 pt-6 lg:pt-0 ${isDark ? 'border-t lg:border-t-0' : 'border-t lg:border-t-0'}">
                    <div class="flex flex-col items-center gap-3">
                        ${svgProgressRing(progressPercent, 72, 5, isDark)}
                        <span class="text-sm font-bold ${isDark ? 'text-text-primary' : 'text-gray-900'}">${progressPercent}% dokončeno</span>
                    </div>
                    <div class="flex items-center gap-6 mt-5">
                        <div class="flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-gray-500'}">
                            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>${totalXP} XP</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-gray-500'}">
                            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                            <span>${lessonCount} lekcí</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-text-secondary' : 'text-gray-500'}">
                            <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
                            <span>${quizCount} kvízů</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- SECTION LIST -->
        <div id="chapter-list">
            ${lessons.length === 0 ? `
                <div class="text-center py-16 ${isDark ? 'text-text-muted' : 'text-gray-500'}">
                    <i data-lucide="clock" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p class="text-lg font-semibold">Kurz se připravuje</p>
                    <p class="text-sm">Lekce budou brzy k dispozici.</p>
                </div>
            ` : sections.map((section, si) => renderSection(section, si, completedIds, isDark)).join('')}
        </div>
    </div>`;

    lucide.createIcons();
    app.querySelectorAll('[data-locked="true"]').forEach((link) => {
        link.addEventListener('click', (event) => event.preventDefault());
    });
}

function groupLessonsIntoSections(lessons) {
    if (!lessons.length) return [];
    // Group by section field if present, otherwise group every 10
    const hasSections = lessons.some(l => l.section);
    if (hasSections) {
        const map = new Map();
        lessons.forEach(l => {
            const sec = l.section || 'Kurz';
            if (!map.has(sec)) map.set(sec, []);
            map.get(sec).push(l);
        });
        return Array.from(map.entries()).map(([title, lessons]) => ({ title, lessons }));
    }
    // Default: group every 10 lessons
    const sections = [];
    for (let i = 0; i < lessons.length; i += 10) {
        sections.push({ title: `Kapitola ${sections.length + 1}`, lessons: lessons.slice(i, i + 10) });
    }
    return sections;
}

function renderSection(section, sectionIndex, completedIds, isDark) {
    return `<div class="mb-6">
        <h2 class="text-sm font-bold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-gray-500'} mb-2 px-2">${section.title}</h2>
        <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-xl overflow-hidden">
            ${section.lessons.map((l, i) => renderLessonRow(l, i, completedIds, isDark)).join('')}
        </div>
    </div>`;
}

function renderLessonRow(lesson, index, completedIds, isDark) {
    const lessonType = lesson.type || lesson.lesson_type;
    const isQuiz = lessonType === 'quiz' || lessonType === 'final_quiz';
    const isCompleted = completedIds.includes(lesson.id);
    const isLocked = false;
    const xp = lesson.xp || lesson.xp_reward || 0;

    let statusIcon;
    if (isCompleted) {
        statusIcon = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>`;
    } else if (isLocked) {
        statusIcon = `<i data-lucide="lock" class="w-4 h-4 text-gray-600"></i>`;
    } else {
        statusIcon = `<i data-lucide="play-circle" class="w-4 h-4 text-emerald-400"></i>`;
    }

    const href = (!isLocked && !isQuiz) ? `#/lekce/${lesson.id}` : (isQuiz ? `#/kviz/${lesson.id}` : '#');
    const lockedState = isLocked ? 'data-locked="true"' : '';
    const lockedOverlay = isLocked ? 'opacity-50' : '';
    const borderClass = index > 0 ? `border-t ${isDark ? 'border-[rgba(255,255,255,0.06)]' : 'border-gray-200'}` : '';

    return `<a href="${href}" data-link ${lockedState} class="flex items-center h-12 px-4 ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'} transition-colors group ${lockedOverlay} ${borderClass}" style="text-decoration:none">
        <span class="text-xs font-semibold ${isDark ? 'text-gray-600' : 'text-gray-400'} w-8 shrink-0">${index + 1}</span>
        <div class="flex-1 min-w-0 flex items-center gap-2">
            <span class="text-sm font-semibold ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors truncate">${lesson.title}</span>
            ${isQuiz ? '<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">Kvíz</span>' : ''}
        </div>
        <div class="flex items-center gap-3 shrink-0">
            <span class="text-xs font-semibold ${isDark ? 'text-text-muted' : 'text-gray-500'}">${xp} XP</span>
            ${statusIcon}
        </div>
    </a>`;
}
