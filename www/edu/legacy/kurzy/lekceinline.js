import { MOCK_COURSES, getCourseIconUrl, getMockLesson, getMockQuizQuestions } from '../js/shared/mockData.js';
import { initComments } from '../js/components/comments.js';

// ─── HELPERS ───
function getProgress(kurzSlug) {
    return JSON.parse(localStorage.getItem(`vevit_progress_${kurzSlug}`) || '{}');
}
function saveProgress(kurzSlug, lessonId, data) {
    const p = getProgress(kurzSlug);
    p[lessonId] = data;
    localStorage.setItem(`vevit_progress_${kurzSlug}`, JSON.stringify(p));
}

function showToast(message, type = 'xp') {
    const container = document.getElementById('toast-container');
    const icons = { xp: 'star', success: 'check-circle', trophy: 'trophy' };
    const colors = { xp: 'border-accent/30', success: 'border-emerald-500/30', trophy: 'border-amber-500/30' };
    const toast = document.createElement('div');
    toast.className = `toast-enter flex items-center gap-3 px-5 py-3 rounded-2xl border bg-[#161616] ${colors[type] || colors.xp} text-white text-sm font-medium shadow-lg`;
    toast.innerHTML = `<i data-lucide="${icons[type] || 'star'}" class="w-5 h-5 ${type === 'trophy' ? 'text-amber-400' : 'text-accent'} shrink-0"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ─── QUIZ STATE ───
let quizState = { otazky: [], aktualni: 0, skore: 0, odpovezeno: false };

// ─── MAIN ───
async function init() {
    const params = new URLSearchParams(location.search);
    const lessonId = parseInt(params.get('id'));
    const kurzSlug = params.get('kurz');
    if (!lessonId || !kurzSlug) { location.href = 'programovani.html'; return; }

    // Load course + lesson
    const USE_MOCK = location.protocol === 'file:';
    let kurz, lesson, allLessons, courseSections;
    if (USE_MOCK) {
        kurz = MOCK_COURSES.find(c => c.slug === kurzSlug);
        courseSections = kurz ? kurz.sections : [];
        allLessons = courseSections.flatMap(s => s.lessons);
        lesson = allLessons.find(l => l.id === lessonId);
    } else {
        try {
            const res = await fetch(`/edu/legacy/api/lekce/${lessonId}`);
            const json = await res.json();
            lesson = json.data || json;
            kurz = { slug: kurzSlug, title: kurzSlug };
            allLessons = [];
        } catch {
            kurz = MOCK_COURSES.find(c => c.slug === kurzSlug);
            courseSections = kurz ? kurz.sections : [];
            allLessons = courseSections.flatMap(s => s.lessons);
            lesson = allLessons.find(l => l.id === lessonId);
        }
    }

    if (!lesson) { location.href = `kurz.html?slug=${kurzSlug}`; return; }

    const lessonType = lesson.type || lesson.lesson_type || 'lesson';
    const isQuiz = lessonType === 'quiz' || lessonType === 'final_quiz';
    const title = lesson.title || `Lekce ${lessonId}`;
    const xp = lesson.xp || lesson.xp_reward || 10;
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const totalLessons = allLessons.length;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < totalLessons - 1 ? allLessons[currentIndex + 1] : null;
    const progress = getProgress(kurzSlug);
    const isCompleted = progress[lessonId]?.completed;

    document.getElementById('skeleton').classList.add('hidden');
    const content = document.getElementById('content');
    const bottomNav = document.getElementById('bottom-nav');
    const bottomInner = document.getElementById('bottom-nav-inner');
    content.classList.remove('hidden');
    bottomNav.classList.remove('hidden');

    if (isQuiz) {
        renderQuiz(content, bottomInner, lesson, kurzSlug, xp, currentIndex, totalLessons, prevLesson, nextLesson, progress);
    } else {
        renderLesson(content, bottomInner, lesson, kurzSlug, kurz, xp, currentIndex, totalLessons, prevLesson, nextLesson, progress, isCompleted);
    }

    lucide.createIcons();
}

// ─── LESSON VIEW ───
function renderLesson(content, bottomInner, lesson, kurzSlug, kurz, xp, currentIdx, total, prevLesson, nextLesson, progress, isCompleted) {
    const title = lesson.title || `Lekce ${lesson.id}`;
    const contentHtml = lesson.content || `<div class="text-center py-12"><i data-lucide="file-text" class="w-12 h-12 text-[#6b7280] mx-auto mb-4"></i><p class="text-[#6b7280] text-lg font-semibold">${title}</p><p class="text-[#6b7280] text-sm mt-2">Obsah bude dostupný po importu databáze</p></div>`;
    const progressPct = total > 0 ? Math.round(((currentIdx + 1) / total) * 100) : 0;

    content.innerHTML = `
        <a href="kurz.html?slug=${kurzSlug}" class="inline-flex items-center gap-2 text-text-secondary hover:text-accent font-medium mb-4 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> ${kurz.title || kurzSlug}
        </a>
        <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-[#6b7280]">Lekce ${currentIdx + 1} / ${total}</span>
            <span class="text-xs font-semibold text-[#6b7280]">${progressPct}%</span>
        </div>
        <div class="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden mb-6">
            <div class="h-full bg-accent rounded-full transition-all" style="width:${progressPct}%"></div>
        </div>
        <div class="flex items-center gap-2 mb-4">
            <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-info/10 text-blue-400">Lekce</span>
            <span class="text-xs font-semibold text-[#6b7280]">${xp} XP</span>
            ${lesson.duration ? `<span class="text-xs font-semibold text-[#6b7280] flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${lesson.duration} min</span>` : ''}
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-6" style="line-height:1.2;letter-spacing:-0.02em">${title}</h1>
        <div class="w-12 h-1 bg-accent rounded-full mb-8"></div>
        <div id="lesson-content">${contentHtml}</div>
    `;

    // Bottom nav
    renderLessonBottomNav(bottomInner, kurzSlug, xp, title, prevLesson, nextLesson, isCompleted, lesson.id);
}

function renderLessonBottomNav(bottomInner, kurzSlug, xp, title, prevLesson, nextLesson, isCompleted, lessonId) {
    bottomInner.innerHTML = `
        <a href="${prevLesson ? `lekce.html?id=${prevLesson.id}&kurz=${kurzSlug}` : '#'}" class="px-4 py-2.5 text-sm font-semibold ${prevLesson ? 'text-text-secondary hover:text-text-primary bg-[#161616] border border-[rgba(255,255,255,0.08)] hover:border-accent/30' : 'text-[#6b7280] bg-[#161616] border border-[rgba(255,255,255,0.04)] opacity-50 pointer-events-none'} rounded-xl transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4 inline-block mr-1"></i> Předchozí
        </a>
        <button id="complete-btn" class="px-5 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 ${isCompleted
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
            : 'bg-accent hover:bg-accent-hover text-[#0d0d0d] shadow-lg shadow-accent/25'}">
            ${isCompleted ? 'Dokončeno ✓' : 'Dokončit lekci'}
        </button>
        <a href="${nextLesson ? `lekce.html?id=${nextLesson.id}&kurz=${kurzSlug}` : '#'}" class="px-4 py-2.5 text-sm font-semibold ${nextLesson ? 'text-text-secondary hover:text-text-primary bg-[#161616] border border-[rgba(255,255,255,0.08)] hover:border-accent/30' : 'text-[#6b7280] bg-[#161616] border border-[rgba(255,255,255,0.04)] opacity-50 pointer-events-none'} rounded-xl transition-colors">
            Další <i data-lucide="arrow-right" class="w-4 h-4 inline-block ml-1"></i>
        </a>
    `;
    lucide.createIcons();

    const btn = document.getElementById('complete-btn');
    if (btn && !isCompleted) {
        btn.addEventListener('click', () => {
            saveProgress(kurzSlug, lessonId, { completed: true, skore: null, datum: Date.now() });
            showToast(`+${xp} XP — ${title}`);
            btn.className = 'px-5 py-2.5 text-sm font-bold rounded-xl transition-all bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default';
            btn.textContent = 'Dokončeno ✓';
            btn.disabled = true;
        });
    }
}

// ─── QUIZ ENGINE ───
function renderQuiz(content, bottomInner, lesson, kurzSlug, xp, currentIdx, total, prevLesson, nextLesson, progress) {
    const title = lesson.title || 'Kvíz';
    const USE_MOCK = location.protocol === 'file:';

    // Load questions
    const loadQuestions = async () => {
        if (USE_MOCK) return getMockQuizQuestions(lesson.id);
        try {
            const res = await fetch(`/edu/legacy/api/kviz/${lesson.id}`);
            const json = await res.json();
            const data = json.data || json;
            const questions = data.questions || data;
            return questions.map((q, i) => ({
                id: q.id || i,
                question: q.question || q.text,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_answer: q.correct_answer,
                explanation: q.explanation || ''
            }));
        } catch {
            return getMockQuizQuestions(lesson.id);
        }
    };

    loadQuestions().then(questions => {
        quizState = { otazky: questions, aktualni: 0, skore: 0, odpovezeno: false };
        renderQuizQuestion(content, bottomInner, kurzSlug, title, xp, currentIdx, total, nextLesson, progress, lesson.id);
        lucide.createIcons();
    });

    content.innerHTML = `<div class="text-center py-12"><div class="skeleton h-6 w-48 rounded mb-4 mx-auto"></div><div class="skeleton h-4 w-full rounded mb-6"></div><div class="space-y-3"><div class="skeleton h-14 w-full rounded-xl"></div><div class="skeleton h-14 w-full rounded-xl"></div><div class="skeleton h-14 w-full rounded-xl"></div><div class="skeleton h-14 w-full rounded-xl"></div></div></div>`;
    bottomInner.innerHTML = '';
}

function renderQuizQuestion(content, bottomInner, kurzSlug, title, xp, currentIdx, total, nextLesson, progress, lessonId) {
    const q = quizState.otazky[quizState.aktualni];
    const totalQ = quizState.otazky.length;
    const progressPct = (quizState.aktualni / totalQ) * 100;

    if (!q) { renderQuizResults(content, bottomInner, kurzSlug, title, xp, total, nextLesson, progress, lessonId); return; }

    const options = [
        { letter: 'A', text: q.option_a },
        { letter: 'B', text: q.option_b },
        { letter: 'C', text: q.option_c },
        { letter: 'D', text: q.option_d },
    ].filter(o => o.text);

    content.innerHTML = `
        <a href="kurz.html?slug=${kurzSlug}" class="inline-flex items-center gap-2 text-text-secondary hover:text-accent font-medium mb-4 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na kurz
        </a>
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-[#6b7280]">Otázka ${quizState.aktualni + 1} z ${totalQ}</span>
            <span class="text-xs font-bold text-accent">Skóre: ${quizState.skore}/${quizState.aktualni}</span>
        </div>
        <div class="h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden mb-6">
            <div class="h-full bg-accent rounded-full transition-all" style="width:${progressPct}%"></div>
        </div>
        <div class="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
            <span class="text-xs font-bold uppercase tracking-wider text-[#6b7280] mb-3 block">Otázka ${quizState.aktualni + 1}</span>
            <h2 class="text-lg sm:text-xl font-bold text-text-primary mb-8" style="line-height:1.4">${q.question || q.text}</h2>
            <div class="space-y-3" id="quiz-options">
                ${options.map((o, i) => `<button data-index="${i}" data-letter="${q.correct_answer}" class="quiz-option w-full flex items-center gap-4 p-4 rounded-xl bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(16,185,129,0.3)] text-left transition-all group">
                    <span class="w-8 h-8 rounded-lg bg-white/5 text-text-muted group-hover:bg-accent/10 group-hover:text-accent flex items-center justify-center text-sm font-bold transition-all shrink-0">${o.letter}</span>
                    <span class="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">${o.text}</span>
                </button>`).join('')}
            </div>
            <div id="quiz-explanation" class="hidden mt-6 p-4 rounded-xl bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)]">
                <div class="flex items-center gap-2 mb-2"><i data-lucide="lightbulb" class="w-4 h-4 text-amber-400"></i><span class="text-xs font-bold uppercase tracking-wider text-[#6b7280]">Vysvětlení</span></div>
                <p id="explanation-text" class="text-sm text-[#9ca3af] leading-relaxed"></p>
            </div>
        </div>
        <div class="flex justify-end mt-4">
            <button id="quiz-next-btn" class="hidden px-6 py-3 bg-accent hover:bg-accent-hover text-[#0d0d0d] rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-accent/25">
                Další otázka →
            </button>
        </div>
    `;

    bottomInner.innerHTML = '';
    lucide.createIcons();
    setupQuizOptions(content, bottomInner, kurzSlug, title, xp, currentIdx, total, nextLesson, progress, lessonId);
}

function setupQuizOptions(content, bottomInner, kurzSlug, title, xp, currentIdx, total, nextLesson, progress, lessonId) {
    const options = content.querySelectorAll('.quiz-option');
    const explanation = document.getElementById('quiz-explanation');
    const explanationText = document.getElementById('explanation-text');
    const nextBtn = document.getElementById('quiz-next-btn');
    const q = quizState.otazky[quizState.aktualni];
    const correctLetter = q.correct_answer;
    const letterToIdx = { a: 0, b: 1, c: 2, d: 3 };
    const correctIdx = letterToIdx[correctLetter] ?? 0;
    let answered = false;

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (answered) return;
            answered = true;
            quizState.odpovezeno = true;
            const clickedIdx = parseInt(opt.dataset.index);
            const isCorrect = clickedIdx === correctIdx;
            if (isCorrect) quizState.skore++;

            options.forEach(o => {
                const idx = parseInt(o.dataset.index);
                o.style.pointerEvents = 'none';
                o.classList.remove('hover:border-[rgba(16,185,129,0.3)]');
                if (idx === correctIdx) {
                    o.classList.add('border-emerald-500/40', 'bg-emerald-500/8');
                    o.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0';
                } else if (idx === clickedIdx && !isCorrect) {
                    o.classList.add('border-red-500/40', 'bg-red-500/8');
                    o.querySelector('span:first-child').className = 'w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center text-sm font-bold shrink-0';
                } else {
                    o.style.opacity = '0.4';
                }
            });

            explanationText.textContent = q.explanation || '';
            if (q.explanation) {
                explanation.classList.remove('hidden');
                if (!isCorrect) explanation.classList.add('border-red-500/20');
            }

            nextBtn.classList.remove('hidden');
            nextBtn.textContent = quizState.aktualni < quizState.otazky.length - 1 ? 'Další otázka →' : 'Zobrazit výsledky';
            nextBtn.addEventListener('click', () => {
                quizState.aktualni++;
                quizState.odpovezeno = false;
                renderQuizQuestion(content, bottomInner, kurzSlug, title, xp, currentIdx, total, nextLesson, progress, lessonId);
                lucide.createIcons();
            });
        });
    });
}

function renderQuizResults(content, bottomInner, kurzSlug, title, xp, currentIdx, total, nextLesson, progress, lessonId) {
    const totalQ = quizState.otazky.length;
    const pct = Math.round((quizState.skore / totalQ) * 100);
    const color = pct >= 70 ? '#10b981' : '#f59e0b';
    let msg = 'Zkus to znovu!';
    if (pct >= 90) msg = 'Výborně!';
    else if (pct >= 70) msg = 'Dobře!';

    const isLast = !nextLesson;
    const bgGrad = `conic-gradient(${color} ${pct}%, rgba(255,255,255,0.06) ${pct}%)`;

    // Save progress
    saveProgress(kurzSlug, lessonId, { completed: true, skore: pct, datum: Date.now() });

    content.innerHTML = `
        <div class="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-2xl p-10 text-center animate-fadeUp">
            <div class="mx-auto mb-8 w-36 h-36 rounded-full flex items-center justify-center" style="background:${bgGrad}">
                <div class="w-28 h-28 rounded-full bg-[#161616] flex flex-col items-center justify-center">
                    <span class="text-3xl font-extrabold" style="color:${color}">${pct}%</span>
                    <span class="text-xs font-semibold text-[#6b7280]">${quizState.skore}/${totalQ} správně</span>
                </div>
            </div>
            <h2 class="text-2xl font-extrabold text-text-primary mb-2">${msg}</h2>
            <p class="text-sm text-[#9ca3af] mb-6">Kvíz: ${title}</p>
            <div class="flex items-center justify-center gap-6 mb-8">
                <div class="flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i><span class="text-sm font-semibold text-[#9ca3af]">${quizState.skore} správně</span></div>
                <div class="flex items-center gap-2"><i data-lucide="x-circle" class="w-5 h-5 text-red-400"></i><span class="text-sm font-semibold text-[#9ca3af]">${totalQ - quizState.skore} špatně</span></div>
                <div class="flex items-center gap-2"><i data-lucide="star" class="w-5 h-5 text-accent"></i><span class="text-sm font-semibold text-accent">+${xp} XP</span></div>
            </div>
            <div class="flex items-center justify-center gap-4">
                <a href="kurz.html?slug=${kurzSlug}" class="px-6 py-3 bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] hover:bg-[#262626] rounded-full font-semibold text-text-primary transition-colors">Zpět na kurz</a>
                ${!isLast && nextLesson ? `<a href="lekce.html?id=${nextLesson.id}&kurz=${kurzSlug}" class="px-6 py-3 bg-accent hover:bg-accent-hover text-[#0d0d0d] rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-accent/25">Pokračovat →</a>` : `<span class="px-6 py-3 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full font-bold">Kurz dokončen!</span>`}
            </div>
        </div>
    `;

    document.getElementById('bottom-nav').style.display = 'none';
    showToast(`+${xp} XP — ${title}`);
    if (pct >= 90) setTimeout(() => showToast('Perfektní skóre!', 'trophy'), 500);
    lucide.createIcons();
}

init();

// Comments — lessonId parsed from URL
const _commentLessonId = parseInt(new URLSearchParams(location.search).get('id'));
if (_commentLessonId) initComments(_commentLessonId, 'comments-section');
