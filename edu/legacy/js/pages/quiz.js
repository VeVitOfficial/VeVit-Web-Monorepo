import { api } from '../shared/api.js';
import { findCourseByLessonId } from '../shared/mockData.js';

let currentQuestion = 0;
let selectedAnswer = null;
let answers = [];
let quizData = null;
let quizSubmitted = false;

function getBreadcrumbCourse(lessonId) {
    try {
        const stored = sessionStorage.getItem('vevit_current_course');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.slug && parsed.title) return parsed;
        }
    } catch {}
    const found = findCourseByLessonId(lessonId);
    if (found) return found;
    return { slug: 'python', title: 'Python' };
}

export async function renderQuiz(id) {
    const app = document.getElementById('app');
    const isDark = window.getTheme() === 'dark';

    currentQuestion = 0;
    selectedAnswer = null;
    answers = [];
    quizSubmitted = false;

    // Skeleton
    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-4xl mx-auto w-full animate-fadeUp">
        <div class="skeleton w-28 h-5 rounded mb-6"></div>
        <div class="skeleton h-2 w-full rounded-full mb-8"></div>
        <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8">
            <div class="skeleton h-4 w-16 rounded mb-4"></div>
            <div class="skeleton h-6 w-3/4 rounded mb-6"></div>
            <div class="space-y-3">
                <div class="skeleton h-14 w-full rounded-xl"></div>
                <div class="skeleton h-14 w-full rounded-xl"></div>
                <div class="skeleton h-14 w-full rounded-xl"></div>
                <div class="skeleton h-14 w-full rounded-xl"></div>
            </div>
        </div>
    </div>`;

    try {
        const questions = await api.getKviz(id);
        if (questions && questions.length > 0) {
            const courseInfo = getBreadcrumbCourse(id);
            quizData = {
                id: parseInt(id),
                title: 'Kvíz',
                course_slug: courseInfo.slug,
                questions: questions.map((q, i) => ({
                    id: q.id || i,
                    text: q.question || q.text,
                    options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean).length > 0
                        ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean)
                        : (q.options || []),
                    correct: q.correct_answer
                        ? 'abcd'.indexOf(q.correct_answer)
                        : (q.correct || 0),
                    explanation: q.explanation || ''
                })),
                xp_reward: questions.length * 10
            };
        } else {
            throw new Error('No questions');
        }
    } catch {
        // Fallback mock quiz
        const courseInfo = getBreadcrumbCourse(id);
        quizData = {
            id: parseInt(id),
            title: 'Kvíz',
            course_slug: courseInfo.slug,
            questions: [
                {
                    id: 1,
                    text: 'Jaký je hlavní účel tohoto konceptu?',
                    options: ['Zrychlení běhu', 'Zvýšení bezpečnosti', 'Zlepšení čitelnosti', 'Snížení velikosti'],
                    correct: 2,
                    explanation: 'Čitelnost a udržovatelnost kódu jsou klíčové v moderním programování.'
                },
                {
                    id: 2,
                    text: 'Který přístup je doporučený?',
                    options: ['Globální proměnné', 'Modulární architektura', 'Monolitický kód', 'Kopírování kódu'],
                    correct: 1,
                    explanation: 'Modulární architektura umožňuje lepší údržbu a znovupoužitelnost kódu.'
                },
                {
                    id: 3,
                    text: 'Co je DRY princip?',
                    options: ['Do Repeat Yourself', "Don't Repeat Yourself", 'Debug Regularly Yet', 'Deploy Rapidly Yesterday'],
                    correct: 1,
                    explanation: "DRY — Don't Repeat Yourself — zásada vyhnout se duplicitě v kódu."
                }
            ],
            xp_reward: 30
        };
    }

    renderQuestion(isDark);
}

function renderQuestion(isDark) {
    const app = document.getElementById('app');
    const q = quizData.questions[currentQuestion];
    const total = quizData.questions.length;
    const progress = ((currentQuestion) / total) * 100;

    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-4xl mx-auto w-full animate-fadeUp">
        <a href="#/kurz/${quizData.course_slug || 'python'}" data-link class="inline-flex items-center gap-2 ${isDark ? 'text-text-secondary hover:text-accent' : 'text-gray-500 hover:text-emerald-600'} font-medium mb-6 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Zpět na kurz
        </a>

        <!-- Progress bar -->
        <div class="mb-8">
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold ${isDark ? 'text-text-muted' : 'text-gray-500'}">Otázka ${currentQuestion + 1} / ${total}</span>
                <span class="text-xs font-bold text-accent">${quizData.xp_reward} XP</span>
            </div>
            <div class="h-1.5 ${isDark ? 'bg-[#1e1e1e]' : 'bg-gray-100'} rounded-full overflow-hidden">
                <div class="h-full bg-accent rounded-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
        </div>

        <!-- Question card -->
        <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-8">
            <span class="text-xs font-bold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-gray-500'} mb-3 block">Otázka ${currentQuestion + 1}</span>
            <h2 class="text-lg sm:text-xl font-bold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-8" style="line-height: 1.4">${q.text}</h2>

            <!-- Answer options -->
            <div class="space-y-3" id="quiz-options">
                ${q.options.map((opt, i) => quizOption(opt, i, isDark)).join('')}
            </div>

            <!-- Explanation -->
            <div id="quiz-explanation" class="hidden mt-6 p-4 rounded-xl ${isDark ? 'bg-[#1e1e1e] border-[rgba(255,255,255,0.08)]' : 'bg-gray-50 border-gray-200'} border">
                <div class="flex items-center gap-2 mb-2">
                    <i data-lucide="lightbulb" class="w-4 h-4 text-amber-400"></i>
                    <span class="text-xs font-bold uppercase tracking-wider ${isDark ? 'text-text-muted' : 'text-gray-500'}">Vysvětlení</span>
                </div>
                <p class="text-sm ${isDark ? 'text-text-secondary' : 'text-gray-600'} leading-relaxed">${q.explanation}</p>
            </div>
        </div>

        <!-- Navigation -->
        <div class="flex justify-end mt-6">
            <button id="quiz-next-btn" class="px-6 py-3 bg-accent hover:bg-accent-hover text-[#0d0d0d] rounded-full font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed" disabled>
                ${currentQuestion < total - 1 ? 'Další otázka' : 'Dokončit kvíz'} <i data-lucide="arrow-right" class="w-4 h-4 inline-block ml-1"></i>
            </button>
        </div>
    </div>`;

    lucide.createIcons();
    setupQuizInteraction(isDark);
}

function quizOption(text, index, isDark) {
    const letters = ['A', 'B', 'C', 'D'];
    return `<button data-index="${index}" class="quiz-option w-full flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-[#1e1e1e] border-[rgba(255,255,255,0.08)] hover:border-[rgba(16,185,129,0.3)]' : 'bg-gray-50 border-gray-200 hover:border-emerald-300'} border text-left transition-all group">
        <span class="w-8 h-8 rounded-lg ${isDark ? 'bg-white/5 text-text-muted group-hover:bg-accent/10 group-hover:text-accent' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'} flex items-center justify-center text-sm font-bold transition-all shrink-0">${letters[index]}</span>
        <span class="text-sm font-semibold ${isDark ? 'text-text-primary group-hover:text-accent' : 'text-gray-900 group-hover:text-emerald-600'} transition-colors">${text}</span>
    </button>`;
}

function setupQuizInteraction(isDark) {
    const options = document.querySelectorAll('.quiz-option');
    const nextBtn = document.getElementById('quiz-next-btn');
    const explanation = document.getElementById('quiz-explanation');
    const q = quizData.questions[currentQuestion];
    let answered = false;

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            if (answered) return;
            answered = true;
            selectedAnswer = parseInt(opt.dataset.index);
            answers[currentQuestion] = selectedAnswer;

            options.forEach(o => {
                const idx = parseInt(o.dataset.index);
                o.classList.remove('hover:border-[rgba(16,185,129,0.3)]', 'hover:border-emerald-300');
                o.style.pointerEvents = 'none';

                if (idx === q.correct) {
                    o.classList.add('quiz-correct');
                    o.querySelector('span:first-child').className = `w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0`;
                } else if (idx === selectedAnswer && idx !== q.correct) {
                    o.classList.add('quiz-wrong');
                    o.querySelector('span:first-child').className = `w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center text-sm font-bold shrink-0`;
                } else {
                    o.style.opacity = '0.4';
                }
            });

            explanation.classList.remove('hidden');
            lucide.createIcons();
            nextBtn.disabled = false;
        });
    });

    nextBtn.addEventListener('click', () => {
        currentQuestion++;
        if (currentQuestion >= quizData.questions.length) {
            renderResults(isDark);
        } else {
            selectedAnswer = null;
            renderQuestion(isDark);
        }
    });
}

function renderResults(isDark) {
    const app = document.getElementById('app');
    const total = quizData.questions.length;
    const correct = answers.reduce((count, ans, i) => {
        return count + (ans === quizData.questions[i].correct ? 1 : 0);
    }, 0);
    const percent = Math.round((correct / total) * 100);

    let scoreColor = '#ef4444';
    if (percent >= 80) scoreColor = '#10b981';
    else if (percent >= 50) scoreColor = '#f59e0b';

    let scoreMessage = 'Zkus to znovu!';
    if (percent >= 80) scoreMessage = 'Výborně! Zvládl jsi to!';
    else if (percent >= 50) scoreMessage = 'Dobrá práce! Máš na čem stavět.';

    const conicGradient = `conic-gradient(${scoreColor} ${percent}%, ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'} ${percent}%)`;

    app.innerHTML = `<div class="flex-1 pt-24 pb-16 px-3 sm:px-5 lg:px-6 max-w-4xl mx-auto w-full animate-fadeUp">
        <div class="${isDark ? 'bg-[#161616] border-[rgba(255,255,255,0.06)]' : 'bg-white border-gray-200'} border rounded-2xl p-10 text-center">
            <!-- Score circle -->
            <div class="mx-auto mb-8 w-36 h-36 rounded-full flex items-center justify-center" style="background: ${conicGradient}">
                <div class="w-28 h-28 rounded-full ${isDark ? 'bg-[#161616]' : 'bg-white'} flex flex-col items-center justify-center">
                    <span class="text-3xl font-extrabold" style="color: ${scoreColor}">${percent}%</span>
                    <span class="text-xs font-semibold ${isDark ? 'text-text-muted' : 'text-gray-500'}">${correct}/${total} správně</span>
                </div>
            </div>

            <h2 class="text-2xl font-extrabold ${isDark ? 'text-text-primary' : 'text-gray-900'} mb-2">${scoreMessage}</h2>
            <p class="text-sm ${isDark ? 'text-text-secondary' : 'text-gray-500'} mb-6">Kvíz: ${quizData.title}</p>

            <!-- Answer summary -->
            <div class="flex items-center justify-center gap-6 mb-8">
                <div class="flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>
                    <span class="text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-gray-600'}">${correct} správně</span>
                </div>
                <div class="flex items-center gap-2">
                    <i data-lucide="x-circle" class="w-5 h-5 text-red-400"></i>
                    <span class="text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-gray-600'}">${total - correct} špatně</span>
                </div>
                <div class="flex items-center gap-2">
                    <i data-lucide="zap" class="w-5 h-5 text-amber-400"></i>
                    <span class="text-sm font-semibold ${isDark ? 'text-text-secondary' : 'text-gray-600'}">+${quizData.xp_reward} XP</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-center gap-4">
                <a href="#/kurz/${quizData.course_slug || 'python'}" data-link class="px-6 py-3 ${isDark ? 'bg-[#1e1e1e] border-[rgba(255,255,255,0.08)] hover:bg-[#262626]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} border rounded-full font-semibold ${isDark ? 'text-text-primary' : 'text-gray-900'} transition-colors">
                    Zpět na kurz
                </a>
                <button onclick="location.hash='/kviz/${quizData.id}'" class="px-6 py-3 bg-accent hover:bg-accent-hover text-[#0d0d0d] rounded-full font-bold transition-all active:scale-95">
                    Zkusit znovu
                </button>
            </div>
        </div>
    </div>`;

    lucide.createIcons();

    if (window.showToast) {
        window.showToast(`+${quizData.xp_reward} XP za kvíz!`, 'xp');
    }
}