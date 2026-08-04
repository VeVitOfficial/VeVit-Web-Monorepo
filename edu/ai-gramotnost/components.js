// UI views (no-auth). Progress/XP/achievementy z LocalProgress (localStorage).

function renderShell() {
  const xp = LocalProgress.totalXp(), lvl = xpIntoNextLevel(xp), st = LocalProgress.streak();
  return `<div class="app-shell">
    <nav class="navbar">
      <a class="brand" href="#dashboard"><span class="logo">${icon("brain")}</span> AI Gramotnost</a>
      <a href="/home" class="nav-back" title="Zpět na hlavní web">← vevit.cz</a>
      <div class="nav-links">
        <a href="#dashboard" data-route="dashboard">Domů</a>
        <a href="#course" data-route="course">Kurz</a>
        <a href="#profile" data-route="profile">Profil</a>
      </div>
      <div class="spacer"></div>
      <div class="user-chip"><span class="lvl">Lvl ${lvl.level}</span><span class="name">${formatXP(xp)} XP</span><span style="color:var(--warning)" title="Streak">${icon("flame","icon")} ${st}</span></div>
    </nav>
    <main id="view"></main>
  </div>`;
}

function paint(html) {
  const app = document.getElementById("app");
  app.innerHTML = renderShell();
  const view = document.getElementById("view");
  view.innerHTML = html;
  qsa("[data-route]", app).forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + (Router.current || "")));
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
    <div class="card" style="margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem"><strong>Tvůj postup</strong><span style="color:var(--primary)">${done}/${total} • ${pct}%</span></div>
      <div class="progress-mini"><div style="width:${pct}%"></div></div>
      <div style="display:flex;gap:1.5rem;margin-top:.75rem;flex-wrap:wrap">
        <div><span class="tag">Level ${lvl.level}</span> <span style="color:var(--text-secondary);font-size:.85rem">${lvl.into}/${lvl.need} XP</span></div>
        <div><span class="tag">${icon("flame","icon")} ${LocalProgress.streak()} dní</span> <span style="color:var(--text-secondary);font-size:.85rem">streak</span></div>
        <div><span class="tag">${formatXP(xp)} XP</span></div>
        <div><span class="tag">${LocalProgress.unlockedAchievements().length}/${ACHIEVEMENTS.length}</span> <span style="color:var(--text-secondary);font-size:.85rem">achievementů</span></div>
      </div>
    </div>
    ${renderChapters(course)}`;
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
    return `<div class="chapter"><div class="chapter-head"><span class="num">${ci + 1}</span><strong>${escapeHTML(ch.title)}</strong></div>${lessons}</div>`;
  }).join("");
}

// === COURSE ===
async function renderCourse() {
  const view = paint(`<div class="loading-screen" style="min-height:60vh"><div class="spinner"></div></div>`);
  if (!AppState.course) { const c = await API.courses.detail(AppConfig.courseSlug); if (c && !c.error) AppState.setCourse(c); }
  const course = AppState.course; if (!course) { renderError("Kurz nenalezen."); return; }
  view.innerHTML = `<section class="hero"><h1><span class="grad">${escapeHTML(course.title)}</span></h1><p>${escapeHTML(course.description || "")}</p></section>${renderChapters(course)}`;
}

// === LESSON ===
async function renderLesson(slug) {
  const view = paint(`<div class="loading-screen" style="min-height:60vh"><div class="spinner"></div></div>`);
  const lesson = await API.courses.lesson(slug);
  if (!lesson || lesson.error) { renderError(lesson && lesson.error ? lesson.error : "Lekce nenalezena."); return; }
  AppState.setLesson(lesson);
  const completed = LocalProgress.isCompleted(lesson.id);
  view.innerHTML = `
    <div class="lesson-layout">
      <div class="lesson-content card">
        <a href="#course" style="display:inline-flex;align-items:center;gap:.4rem;color:var(--text-secondary);font-size:.85rem;margin-bottom:1rem">${icon("arrow","icon")} Zpět na kurz</a>
        <h1>${escapeHTML(lesson.title)}</h1>
        <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:1.5rem">${lesson.duration || 15} min • +${lesson.xp_reward || 25} XP</p>
        <div class="lesson-body">${lesson.content || ""}</div>
        <h2 style="margin-top:2rem">Cvičení</h2>
        <div id="exercise-list"></div>
        <div id="complete-wrap" style="margin-top:1.5rem"></div>
      </div>
      <aside class="lesson-sidebar card"><strong style="display:block;margin-bottom:.75rem">Obsah lekce</strong><div id="toc"></div></aside>
    </div>`;
  const toc = qs("#toc", view);
  qsa(".lesson-body h2", view).forEach((h, i) => {
    h.id = h.id || "sec-" + i;
    const a = el("a", { href: "#" + h.id, style: "display:block;padding:.35rem 0;color:var(--text-secondary);font-size:.85rem;border-left:2px solid transparent;padding-left:.6rem" }, h.textContent);
    a.addEventListener("click", (e) => { e.preventDefault(); h.scrollIntoView({ behavior: "smooth", block: "start" }); a.style.borderColor = "var(--primary)"; });
    toc.appendChild(a);
  });
  const exList = qs("#exercise-list", view);
  const exercises = lesson.exercises || [];
  if (!exercises.length) exList.innerHTML = `<p style="color:var(--text-muted)">Tato lekce zatím nemá cvičení.</p>`;
  renderExerciseList(exercises, exList, lesson);
  const cw = qs("#complete-wrap", view);
  if (!completed) {
    const btn = el("button", { class: "btn btn-primary btn-block btn-lg" }, `${icon("check","icon")} Dokončit lekci (+${lesson.xp_reward || 25} XP)`);
    btn.addEventListener("click", () => {
      const earned = LocalProgress.completeLesson(lesson.id, lesson.xp_reward || 25);
      if (earned) showXpToast(earned, lesson.title);
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
        const earned = LocalProgress.recordExercise(ex.id, ex.type, true, res.xp_reward || ex.xp_reward || 35);
        if (earned) showXpToast(earned, ex.title);
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
