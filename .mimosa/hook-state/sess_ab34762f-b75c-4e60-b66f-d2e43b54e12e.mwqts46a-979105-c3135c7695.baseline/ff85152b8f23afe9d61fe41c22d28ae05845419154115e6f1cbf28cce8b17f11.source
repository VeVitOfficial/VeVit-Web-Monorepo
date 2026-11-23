// UI views. Obsah a lokální progress zůstávají samostatné, navigace sdílí systém VeVit Edu.

function renderShell() {
  return `<div class="app-shell">
    <header class="ai-edu-navbar">
      <div class="ai-edu-navbar__inner">
        <span class="vv-app-brand" aria-label="VeVit Edu">
          <a href="/home">VeVit</a>
          <a href="/edu">Edu</a>
        </span>
        <nav class="ai-edu-navbar__links" aria-label="Navigace VeVit Edu">
          <a href="/edu/">Přehled</a>
          <a href="/edu/programovani/">Programování</a>
          <a href="#dashboard" data-route="dashboard">AI gramotnost</a>
          <a href="/edu/hledat/">Vyhledat</a>
        </nav>
        <div class="ai-edu-navbar__actions">
          <span data-vevit-app-switcher data-vevit-app="Edu"></span>
          <span data-vevit-session><span class="vv-session vv-session--loading">Ověřuji přihlášení…</span></span>
        </div>
      </div>
    </header>
    <main id="view"></main>
  </div>`;
}

function paint(html) {
  const app = document.getElementById("app");
  app.innerHTML = renderShell();
  const view = document.getElementById("view");
  view.innerHTML = html;
  qsa("[data-route]", app).forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + (Router.current || "")));
  if (window.VevitSessionState) {
    qsa("[data-vevit-session]", app).forEach((root) => window.VevitSessionView?.renderSessionResult(root, window.VevitSessionState));
  }
  view.classList.add("fade-in");
  return view;
}

function renderError(msg) {
  paint(`<div class="card" style="max-width:520px;margin:3rem auto;text-align:center"><p style="color:var(--error)">⚠️ ${escapeHTML(msg || "Došlo k chybě.")}</p><p style="color:var(--text-secondary);margin-top:.5rem;font-size:.85rem">Zkontroluj připojení k databázi (api/config.php) a zda byl spuštěn seed.php.</p></div>`);
}

// === DASHBOARD ===
async function renderDashboard() {
  const view = paint(`<div class="loading-screen" style="min-height:60vh"><div class="spinner"></div></div>`);
  if (!AppState.course) { const c = await API.courses.detail(AppConfig.courseSlug); if (c && !c.error) AppState.setCourse(c); }
  const course = AppState.course;
  if (!course) { renderError("Kurz nenalezen v databázi."); return; }
  const xp = LocalProgress.totalXp(), lvl = xpIntoNextLevel(xp);
  const total = (course.chapters || []).reduce((a, ch) => a + (ch.lessons || []).length, 0);
  const done = LocalProgress.completedCount();
  const pct = total ? Math.round(done / total * 100) : 0;
  view.innerHTML = `
    <section class="hero">
      <h1>AI <span class="grad">Gramotnost</span></h1>
      <p>${escapeHTML(course.description || "Kompletní kurz AI gramotnosti.")}</p>
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${total}</div><div class="lbl">lekcí</div></div>
        <div class="stat-box"><div class="num">${formatXP(course.total_xp || 0)}</div><div class="lbl">XP celkem</div></div>
        <div class="stat-box"><div class="num">${done}/${total}</div><div class="lbl">dokončeno</div></div>
      </div>
    </section>
    ${window.VevitSessionState?.state === "authenticated" ? `<div id="quiz-progress-panel"></div><div id="quiz-review-panel" class="card" style="margin-bottom:1.5rem"></div><div class="card" style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem"><strong>Tvůj postup</strong><span style="color:var(--primary)">${done}/${total} • ${pct}%</span></div>
      <div class="progress-mini"><div style="width:${pct}%"></div></div>
      <div style="display:flex;gap:1.5rem;margin-top:.75rem;flex-wrap:wrap">
        <div><span class="tag">Level ${lvl.level}</span> <span style="color:var(--text-secondary);font-size:.85rem">${lvl.into}/${lvl.need} XP</span></div>
        <div><span class="tag">${icon("flame","icon")} ${LocalProgress.streak()} dní</span> <span style="color:var(--text-secondary);font-size:.85rem">streak</span></div>
        <div><span class="tag">${formatXP(xp)} XP</span></div>
        <div><span class="tag">${LocalProgress.unlockedAchievements().length}/${ACHIEVEMENTS.length}</span> <span style="color:var(--text-secondary);font-size:.85rem">achievementů</span></div>
      </div>
    </div>` : '<div class="card" style="margin-bottom:1.5rem"><p>Pro zobrazení postupu a XP se přihlaste.</p></div>'}
    ${renderChapters(course)}`;
  if (window.VevitSessionState?.state === 'authenticated' && window.VeVitQuizRuntime) {
    window.VeVitQuizRuntime.mountQuizProgress(qs('#quiz-progress-panel', view), qs('#quiz-review-panel', view)).catch(() => {});
  }
}

function lessonStatus(lid) {
  return LocalProgress.isCompleted(lid) ? "completed" : "available";
}
function renderChapters(course) {
  return (course.chapters || []).map((ch, ci) => {
    const lessons = (ch.lessons || []).map((l) => {
      const st = lessonStatus(l.id);
      const ic = st === "completed" ? "check" : "play";
      return `<a class="lesson-row" href="#lesson/${encodeURIComponent(l.slug)}">
        <span class="status-ic ${st}">${icon(ic, "icon")}</span>
        <span class="ltitle">${escapeHTML(l.title)}</span>
        <span class="lmeta"><span>${l.duration || 15} min</span><span>+${l.xp_reward || 25} XP</span></span>
      </a>`;
    }).join("");
    const milestone = ci < 5 ? `boss-${ci + 1}` : 'final-6';
    const milestoneTitle = ci < 5 ? `Boss kvíz kapitoly ${ci + 1}` : 'Závěrečný test a reflexe';
    return `<div class="chapter"><div class="chapter-head"><span class="num">${ci + 1}</span><strong>${escapeHTML(ch.title)}</strong></div>${lessons}<a class="lesson-row quiz-milestone-link" href="#milestone/${milestone}"><span class="status-ic available">${icon('award','icon')}</span><span class="ltitle">${milestoneTitle}</span><span class="lmeta"><span>${ci < 5 ? '10 otázek · 3 životy' : '25 otázek · adaptivní'}</span></span></a></div>`;
  }).join("");
}

async function renderMilestone(milestone, attempt = 1) {
  const view = paint(`<div class="loading-screen" style="min-height:60vh"><div class="spinner"></div></div>`);
  if (!window.VeVitQuizRuntime) { renderError('Kvízová vrstva není načtená.'); return; }
  if (window.VevitSessionState?.state !== 'authenticated') {
    view.innerHTML = '<section class="card"><h1>Milník kurzu</h1><p>Lekce zůstávají čitelné bez přihlášení. Pro boss kvíz, finální test, XP a odznak se přihlaste.</p><a class="btn btn-primary" href="/account/login?return_to=%2Fedu%2Fai-gramotnost%2F%23course">Přihlásit se</a></section>';
    return;
  }
  try {
    const api = await import('./quiz/api-client.mjs'); const config = await api.QuizApi.milestoneConfig(milestone, attempt);
    view.innerHTML = `<section class="hero"><h1>${milestone === 'final-6' ? 'Závěrečný test' : 'Boss kvíz'}</h1><p>${milestone === 'final-6' ? '25 základních otázek napříč kurzem; po chybě dostaneš doplňující otázku ze stejného tématu.' : 'Deset otázek vybraných deterministicky pro tvůj účet. Máš tři životy.'}</p></section><div id="quiz-milestone-host"></div>`;
    await window.VeVitQuizRuntime.mountMilestoneQuiz(qs('#quiz-milestone-host', view), config);
  } catch (error) { renderError(error.message || 'Milník nelze načíst.'); }
}

// === COURSE ===
async function renderCourse() {
  const view = paint(`<div class="loading-screen" style="min-height:60vh"><div class="spinner"></div></div>`);
  if (!AppState.course) { const c = await API.courses.detail(AppConfig.courseSlug); if (c && !c.error) AppState.setCourse(c); }
  const course = AppState.course; if (!course) { renderError("Kurz nenalezen."); return; }
  view.innerHTML = `<section class="hero"><h1><span class="grad">${escapeHTML(course.title)}</span></h1><p>${escapeHTML(course.description || "")}</p></section><div id="chapter-intros"></div>${renderChapters(course)}`;
  if (window.VeVitQuizRuntime) {
    const host = qs('#chapter-intros', view);
    for (let chapterNumber = 1; chapterNumber <= 6; chapterNumber++) {
      try {
        const loader = await import('./quiz/content-loader.mjs'); const chapter = await loader.fetchChapterContent(chapterNumber);
        const target = document.createElement('div'); window.VeVitQuizRuntime.mountChapterIntroduction(target, chapter); host.append(target);
      } catch (_) { /* Kapitola se ukáže až po doplnění svého statického úvodu. */ }
    }
  }
}

// === LESSON ===
async function renderLesson(slug) {
  if (slug === '6-4-zaverecny-test') { await renderMilestone('final-6'); return; }
  const view = paint(`<div class="loading-screen" style="min-height:60vh"><div class="spinner"></div></div>`);
  let quizLesson = null;
  try {
    const loader = await import('./quiz/content-loader.mjs');
    quizLesson = await loader.fetchLessonContent(slug);
  } catch (_) { /* Starší lekce zůstávají na původním API. */ }
  const lesson = quizLesson || await API.courses.lesson(slug);
  if (!lesson || lesson.error) { renderError(lesson && lesson.error ? lesson.error : "Lekce nenalezena."); return; }
  AppState.setLesson(lesson);
  const completed = LocalProgress.isCompleted(lesson.id);
  let safeLessonContent = '';
  try {
    safeLessonContent = window.VeVitContentSanitizer.sanitizeLesson(lesson.content || '');
  } catch (error) {
    console.error(error);
    safeLessonContent = '<p class="error-text">Obsah lekce nelze bezpečně vykreslit.</p>';
  }
  view.innerHTML = `
    <div class="lesson-layout">
      <div class="lesson-content card">
        <a href="#course" style="display:inline-flex;align-items:center;gap:.4rem;color:var(--text-secondary);font-size:.85rem;margin-bottom:1rem">${icon("arrow","icon")} Zpět na kurz</a>
        <h1>${escapeHTML(lesson.title)}</h1>
        <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:1.5rem">${lesson.duration || 15} min • +${lesson.xp_reward || 25} XP</p>
        <div class="lesson-body" id="lesson-body">${safeLessonContent}</div>
        <div id="quiz-difficulty-control"></div>
        <div id="quiz-rhythm"></div>
        <h2 style="margin-top:2rem">Cvičení</h2>
        <div id="exercise-list"></div>
        <div id="complete-wrap" style="margin-top:1.5rem"></div>
      </div>
      <aside class="lesson-sidebar card"><strong style="display:block;margin-bottom:.75rem">Obsah lekce</strong><div id="toc"></div></aside>
    </div>`;
  if (quizLesson) {
    const theory = qs('#lesson-body', view);
    theory.replaceChildren();
    theory.hidden = true;
  }
  const toc = qs("#toc", view);
  qsa(".lesson-body h2", view).forEach((h, i) => {
    h.id = h.id || "sec-" + i;
    const a = el("a", { href: "#" + h.id, style: "display:block;padding:.35rem 0;color:var(--text-secondary);font-size:.85rem;border-left:2px solid transparent;padding-left:.6rem" }, h.textContent);
    a.addEventListener("click", (e) => { e.preventDefault(); h.scrollIntoView({ behavior: "smooth", block: "start" }); a.style.borderColor = "var(--primary)"; });
    toc.appendChild(a);
  });
  const exList = qs("#exercise-list", view);
  const exercises = lesson.exercises || [];
  if (quizLesson && window.VeVitQuizRuntime) {
    const authenticated = window.VevitSessionState?.state === 'authenticated';
    const difficultyHost = qs('#quiz-difficulty-control', view);
    const rhythm = qs('#quiz-rhythm', view);
    const renderRhythm = (difficulty) => window.VeVitQuizRuntime.mountLessonRhythm(rhythm, quizLesson, { difficulty, authenticated });
    const difficulty = await window.VeVitQuizRuntime.mountDifficultyControl(difficultyHost, { authenticated, onChange: renderRhythm });
    await renderRhythm(difficulty);
    exList.replaceChildren();
  } else {
    if (!exercises.length) exList.innerHTML = `<p style="color:var(--text-muted)">Tato lekce zatím nemá cvičení.</p>`;
    renderExerciseList(exercises, exList, lesson);
  }
  const cw = qs("#complete-wrap", view);
  if (!completed) {
    const btn = el("button", { class: "btn btn-primary btn-block btn-lg" }, `${icon("check","icon")} Dokončit lekci (+${lesson.xp_reward || 25} XP)`);
    btn.addEventListener("click", () => {
      LocalProgress.completeLesson(lesson.id, lesson.xp_reward || 25);
      AppState.setProgress(LocalProgress.load());
      btn.replaceWith(el("div", { class: "ex-feedback ok", style: "text-align:center" }, "✓ Lekce dokončena!"));
    });
    cw.appendChild(btn);
  } else {
    cw.appendChild(el("div", { class: "ex-feedback ok", style: "text-align:center" }, "✓ Lekce již dokončena"));
  }
  if (window.Prism) Prism.highlightAllUnder(view);
}

function renderExerciseList(exercises, container, lesson) {
  exercises.forEach((ex, i) => {
    const engine = window.Engines && Engines[ex.type];
    const card = el("div", { class: "exercise card" });
    card.innerHTML = `<div class="ex-title"><span class="ex-num">${i + 1}</span>${escapeHTML(ex.title)}</div><div class="ex-prompt">${escapeHTML(ex.prompt || ex.title || "")}</div><div class="ex-body"></div><div class="ex-actions" style="margin-top:1rem"></div><div class="ex-feedback-wrap"></div>`;
    const body = qs(".ex-body", card), actions = qs(".ex-actions", card), fbw = qs(".ex-feedback-wrap", card);
    let ctrl = null;
    try { ctrl = engine ? engine.render(ex.config || {}, body) : null; } catch (e) { body.innerHTML = `<p style="color:var(--error)">Chyba enginu: ${escapeHTML(e.message)}</p>`; }
    if (!engine) body.innerHTML = `<p style="color:var(--text-muted)">Typ „${escapeHTML(ex.type)}" není podporován.</p>`;
    const checkBtn = el("button", { class: "btn btn-primary" }, "Zkontrolovat");
    checkBtn.addEventListener("click", async () => {
      if (!ctrl || checkBtn.dataset.done) return;
      const answer = ctrl.getAnswer();
      checkBtn.disabled = true; checkBtn.textContent = "Ověřuji…";
      const res = await API.exercises.submit({ exercise_id: ex.id, answer });
      checkBtn.disabled = false; checkBtn.textContent = "Zkontrolovat";
      if (res && res.error) { fbw.innerHTML = `<div class="ex-feedback bad">⚠️ ${escapeHTML(res.error)}</div>`; return; }
      if (ctrl.onResult) ctrl.onResult(res);
      fbw.innerHTML = `<div class="ex-feedback ${res.is_correct ? "ok" : "bad"}">${res.is_correct ? "✓ Správně!" : "✗ Zkus to znovu."} ${res.feedback ? escapeHTML(res.feedback) : ""}</div>`;
      if (res.is_correct) {
        LocalProgress.recordExercise(ex.id, ex.type, true, res.xp_reward || ex.xp_reward || 35);
        checkBtn.dataset.done = "1"; checkBtn.textContent = "✓ Hotovo"; checkBtn.classList.add("btn-ghost");
      }
      AppState.setProgress(LocalProgress.load());
    });
    actions.appendChild(checkBtn);
    container.appendChild(card);
  });
}

// === PROFILE ===
function renderProfile() {
  if (window.VevitSessionState?.state !== "authenticated") {
    paint('<div class="card" style="max-width:520px;margin:3rem auto;text-align:center"><p>Profil, XP a postup jsou dostupné po přihlášení.</p><span data-vevit-session></span></div>');
    return;
  }
  const xp = LocalProgress.totalXp(), lvl = xpIntoNextLevel(xp);
  const unlocked = new Set(LocalProgress.unlockedAchievements());
  const view = paint(`
    <section class="hero"><h1>Profil</h1></section>
    <div class="card" style="margin-bottom:1.5rem">
      <h3>Lokální postup (bez přihlášení)</h3>
      <p style="color:var(--text-secondary);font-size:.85rem;margin-top:.4rem">Progress se ukládá v tomto prohlížeči (localStorage). Po přihlášení do vevit edu bude synchronizován se serverem.</p>
      <div style="margin-top:1rem"><span class="tag">Level ${lvl.level}</span> <span class="tag">${formatXP(xp)} XP</span> <span class="tag">${icon("flame","icon")} ${LocalProgress.streak()} dní</span> <span class="tag">${LocalProgress.completedCount()} lekcí</span></div>
      <div class="progress-mini" style="margin-top:1rem"><div style="width:${lvl.pct}%"></div></div>
      <p style="font-size:.8rem;color:var(--text-muted);margin-top:.4rem">${lvl.into}/${lvl.need} XP do dalšího levelu</p>
    </div>
    <h2 style="margin-bottom:1rem">Achievementy</h2>
    <div class="grid-2">
      ${ACHIEVEMENTS.map((a) => { const on = unlocked.has(a.id); return `<div class="card" style="opacity:${on?1:0.45}"><div style="display:flex;gap:.75rem;align-items:center"><span style="width:40px;height:40px;border-radius:50%;background:${on?'var(--primary-glow)':'var(--bg-elevated)'};display:grid;place-items:center;color:${on?'var(--primary)':'var(--text-muted)'}">${icon(a.icon,'icon')}</span><div><strong>${escapeHTML(a.name)}</strong><div style="font-size:.82rem;color:var(--text-secondary)">${escapeHTML(a.description)} • +${a.xp_reward} XP</div></div></div></div>`; }).join("")}
    </div>
    <div class="card" style="margin-top:1.5rem">
      <button class="btn btn-ghost" id="reset-progress">Resetovat lokální progress</button>
    </div>`);
  qs("#reset-progress", view).addEventListener("click", () => {
    if (confirm("Opravdu resetovat veškerý lokální progress (XP, dokončené lekce, achievementy)?")) {
      localStorage.removeItem(LocalProgress.KEY); LocalProgress._d = null; LocalProgress.load(); AppState.setProgress(LocalProgress.load()); Router.navigate("dashboard");
    }
  });
}

function openModal(title, bodyHTML) {
  const c = document.getElementById("modal-container");
  const node = el("div", { class: "backdrop" });
  node.innerHTML = `<div class="modal"><h3>${escapeHTML(title)}</h3><div class="modal-body">${bodyHTML}</div><button class="btn btn-ghost" id="modal-close" style="margin-top:1rem">Zavřít</button></div>`;
  c.appendChild(node);
  node.addEventListener("click", (e) => { if (e.target === node || e.target.id === "modal-close") node.remove(); });
}
