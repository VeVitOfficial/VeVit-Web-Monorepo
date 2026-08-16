// Quiz data
        const quizData = [
            {
                question: "Jaký je správný způsob deklarace konstanty v JavaScriptu?",
                answers: [
                    { text: "var x = 10;", key: "a" },
                    { text: "let x = 10;", key: "b" },
                    { text: "const x = 10;", key: "c", correct: true },
                    { text: "constant x = 10;", key: "d" }
                ],
                explanation: "const je klíčové slovo pro deklaraci konstanty. var a let deklarují proměnné, 'constant' není platné klíčové slovo."
            },
            {
                question: "Který z následujících je primitivní datový typ v JavaScriptu?",
                answers: [
                    { text: "Object", key: "a" },
                    { text: "Array", key: "b" },
                    { text: "number", key: "c", correct: true },
                    { text: "Function", key: "d" }
                ],
                explanation: "number je primitivní typ. Object, Array a Function jsou komplexní typy odvozené od Object."
            },
            {
                question: "Jaký je výsledek: typeof null?",
                answers: [
                    { text: '"null"', key: "a" },
                    { text: '"undefined"', key: "b" },
                    { text: '"object"', key: "c", correct: true },
                    { text: '"boolean"', key: "d" }
                ],
                explanation: "Toto je známá 'chyba' v JavaScriptu. typeof null vrací 'object', ačkoliv null je primitivní typ."
            },
            {
                question: "Který operátor provádí striktní porovnání (hodnota i typ)?",
                answers: [
                    { text: "==", key: "a" },
                    { text: "===", key: "b", correct: true },
                    { text: "!=", key: "c" },
                    { text: "!==", key: "d" }
                ],
                explanation: "=== je striktní operátor rovnosti, který porovnává hodnotu i typ. == provádí typovou konverzi."
            },
            {
                question: "Jaká je hodnota proměnné x po: let x;",
                answers: [
                    { text: "null", key: "a" },
                    { text: "undefined", key: "b", correct: true },
                    { text: "0", key: "c" },
                    { text: '""', key: "d" }
                ],
                explanation: "Proměnné deklarované pomocí let bez přiřazení mají výchozí hodnotu undefined."
            },
            {
                question: "Který zápis je správný pro template literal?",
                answers: [
                    { text: '"Ahoj ${jmeno}"', key: "a" },
                    { text: "`Ahoj ${jmeno}`", key: "b", correct: true },
                    { text: "'Ahoj ${jmeno}'", key: "c" },
                    { text: "Ahoj ${jmeno}", key: "d" }
                ],
                explanation: "Template literals používají backticks (`) a umožňují interpolaci výrazů pomocí ${}."
            },
            {
                question: "Jaký je rozdíl mezi let a const?",
                answers: [
                    { text: "Žádný, jsou stejné", key: "a" },
                    { text: "const nelze deklarovat", key: "b" },
                    { text: "const nelze po deklaraci změnit", key: "c", correct: true },
                    { text: "let je pouze pro čísla", key: "d" }
                ],
                explanation: "const vytváří konstantu, jejíž hodnotu nelze po přiřazení změnit (ačkoliv vlastnosti objektu ano)."
            },
            {
                question: "Jaký je výsledek: '5' + 3?",
                answers: [
                    { text: "8", key: "a" },
                    { text: '"53"', key: "b", correct: true },
                    { text: "error", key: "c" },
                    { text: "NaN", key: "d" }
                ],
                explanation: "Operátor + s řetězcem provádí zřetězení. '5' + 3 = '53' (string concatenation)."
            },
            {
                question: "Který zápis deklaruje pole?",
                answers: [
                    { text: "const arr = ();", key: "a" },
                    { text: "const arr = [];", key: "b", correct: true },
                    { text: "const arr = {};", key: "c" },
                    { text: "const arr = '';", key: "d" }
                ],
                explanation: "Hranaté závorky [] jsou syntax pro vytvoření pole. {} vytváří objekt."
            },
            {
                question: "Jaký operátor použijete pro logické A?",
                answers: [
                    { text: "AND", key: "a" },
                    { text: "&&", key: "b", correct: true },
                    { text: "&", key: "c" },
                    { text: "||", key: "d" }
                ],
                explanation: "&& je logické AND v JavaScriptu. || je OR, & je bitové AND. 'AND' není platný operátor."
            }
        ];

        // State
        let currentQuestionIndex = 0;
        let score = 0;
        let selectedAnswer = null;
        let answered = false;
        let userAnswers = [];

        // Elements
        const questionText = document.getElementById('question-text');
        const answersContainer = document.getElementById('answers-container');
        const nextBtn = document.getElementById('next-btn');
        const progressSection = document.getElementById('progress-section');
        const questionCard = document.getElementById('question-card');
        const resultsScreen = document.getElementById('results-screen');
        const currentQuestionEl = document.getElementById('current-question');
        const totalQuestionsEl = document.getElementById('total-questions');
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');
        const scoreNumber = document.getElementById('score-number');
        const scoreRing = document.querySelector('.score-ring');
        const xpEarned = document.getElementById('xp-earned');
        const explanationToggle = document.getElementById('explanation-toggle');
        const explanationContent = document.getElementById('explanation-content');
        const explanationsList = document.getElementById('explanations-list');
        const retryBtn = document.getElementById('retry-btn');
        const shareBtn = document.getElementById('share-btn');

        // Initialize
        totalQuestionsEl.textContent = quizData.length;
        loadQuestion();

        function loadQuestion() {
            const q = quizData[currentQuestionIndex];
            questionText.textContent = q.question;

            answersContainer.innerHTML = q.answers.map(a => `
                <button class="answer-option w-full bg-surface border border-surface-border rounded-md p-4 text-left flex items-center justify-between" data-key="${a.key}">
                    <span class="text-base text-text-secondary">${a.text}</span>
                    <i data-lucide="check-circle" class="w-4 h-4 text-success hidden"></i>
                    <i data-lucide="x-circle" class="w-4 h-4 text-error hidden"></i>
                </button>
            `).join('');

            lucide.createIcons();

            // Add click handlers
            document.querySelectorAll('.answer-option').forEach(btn => {
                btn.addEventListener('click', () => selectAnswer(btn, q));
            });

            // Update progress
            const progress = ((currentQuestionIndex + 1) / quizData.length) * 100;
            currentQuestionEl.textContent = currentQuestionIndex + 1;
            progressBar.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;

            selectedAnswer = null;
            answered = false;
            nextBtn.classList.add('hidden');
        }

        function selectAnswer(btn, question) {
            if (answered) return;

            selectedAnswer = btn.dataset.key;
            answered = true;
            userAnswers.push(selectedAnswer);

            const correctAnswer = question.answers.find(a => a.correct);
            const isCorrect = selectedAnswer === correctAnswer.key;

            if (isCorrect) {
                score++;
                btn.classList.add('correct');
                btn.querySelector('[data-lucide="check-circle"]').classList.remove('hidden');
            } else {
                btn.classList.add('wrong');
                btn.querySelector('[data-lucide="x-circle"]').classList.remove('hidden');
                // Show correct answer
                document.querySelectorAll('.answer-option').forEach(b => {
                    if (b.dataset.key === correctAnswer.key) {
                        b.classList.add('correct');
                        b.querySelector('[data-lucide="check-circle"]').classList.remove('hidden');
                    }
                });
            }

            lucide.createIcons();

            // Show next button
            if (currentQuestionIndex < quizData.length - 1) {
                nextBtn.textContent = 'Další otázka';
                nextBtn.innerHTML = 'Další otázka <i data-lucide="arrow-right" class="w-4 h-4 inline ml-1"></i>';
            } else {
                nextBtn.textContent = 'Zobrazit výsledky';
                nextBtn.innerHTML = 'Zobrazit výsledky <i data-lucide="arrow-right" class="w-4 h-4 inline ml-1"></i>';
            }
            nextBtn.classList.remove('hidden');
            lucide.createIcons();
        }

        nextBtn.addEventListener('click', () => {
            currentQuestionIndex++;

            if (currentQuestionIndex >= quizData.length) {
                showResults();
            } else {
                loadQuestion();
            }
        });

        function showResults() {
            progressSection.classList.add('hidden');
            questionCard.classList.add('hidden');
            resultsScreen.classList.remove('hidden');

            const percentage = (score / quizData.length) * 100;
            scoreNumber.textContent = score;
            scoreRing.style.setProperty('--score', `${percentage}%`);
            xpEarned.textContent = score * 50;

            // Populate explanations
            explanationsList.innerHTML = quizData.map((q, i) => {
                const userAnswer = userAnswers[i];
                const correctAnswer = q.answers.find(a => a.correct);
                const isCorrect = userAnswer === correctAnswer.key;

                return `
                    <div class="border-b border-surface-border pb-4 last:border-0 last:pb-0">
                        <div class="flex items-start gap-3 mb-2">
                            ${isCorrect
                                ? '<i data-lucide="check-circle" class="w-4 h-4 text-success flex-shrink-0 mt-0.5"></i>'
                                : '<i data-lucide="x-circle" class="w-4 h-4 text-error flex-shrink-0 mt-0.5"></i>'
                            }
                            <div>
                                <p class="text-sm font-semibold text-text-primary mb-1">${q.question}</p>
                                <p class="text-xs text-text-secondary">${q.explanation}</p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            lucide.createIcons();
        }

        explanationToggle.addEventListener('click', () => {
            explanationContent.classList.toggle('hidden');
            const icon = explanationToggle.querySelector('[data-lucide]');
            if (explanationContent.classList.contains('hidden')) {
                icon.setAttribute('data-lucide', 'chevron-down');
            } else {
                icon.setAttribute('data-lucide', 'chevron-up');
            }
            lucide.createIcons();
        });

        retryBtn.addEventListener('click', () => {
            currentQuestionIndex = 0;
            score = 0;
            selectedAnswer = null;
            answered = false;
            userAnswers = [];

            progressSection.classList.remove('hidden');
            questionCard.classList.remove('hidden');
            resultsScreen.classList.add('hidden');

            loadQuestion();
        });

        shareBtn.addEventListener('click', () => {
            const text = `V kvízu JavaScript: Základy jsem dosáhl ${score}/${quizData.length} správných odpovědí na edu.vevit.fun!`;
            if (navigator.share) {
                navigator.share({ text });
            } else {
                navigator.clipboard.writeText(text);
                showToast('Výsledek zkopírován do schránky', 'success');
            }
        });

        // Toast function
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
            const colors = { success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };

            toast.className = 'flex items-center gap-3 px-4 py-3 bg-surface-elevated border border-surface-border rounded-md shadow-md max-w-sm';
            toast.style.borderLeft = `3px solid ${colors[type]}`;
            toast.innerHTML = `
                <i data-lucide="${icons[type]}" class="w-4 h-4" style="color: ${colors[type]}"></i>
                <span class="text-sm text-text-primary">${message}</span>
            `;

            container.appendChild(toast);
            lucide.createIcons();

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 200ms ease-out';
                setTimeout(() => toast.remove(), 200);
            }, 4000);
        }
