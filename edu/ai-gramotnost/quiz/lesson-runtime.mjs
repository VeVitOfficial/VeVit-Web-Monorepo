import { loadType } from './type-loader.mjs';
import { QuizApi } from './api-client.mjs';
import { enqueueAttempt, flushAttempts } from './offline-queue.mjs';

const BADGES = [
  ['archeolog-ai', 'Archeolog AI', 'Kapitola 1'], ['mechanik-neuronu', 'Mechanik neuronů', 'Kapitola 2'], ['promptovy-kovar', 'Promptový kovář', 'Kapitola 3'], ['integrator', 'Integrátor', 'Kapitola 4'], ['stavitel', 'Stavitel', 'Kapitola 5'], ['skeptik-s-certifikatem', 'Skeptik s certifikátem', 'Kapitola 6'], ['detektiv-halucinaci', 'Detektiv halucinací', 'Skrytý'], ['tokenovy-lakomec', 'Tokenový lakomec', 'Skrytý'], ['kalibrovany', 'Kalibrovaný', 'Skrytý'],
];

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export async function mountQuizQuestions(container, lesson, { difficulty = 'junior', authenticated = false } = {}) {
  container.replaceChildren();
  const questions = Array.isArray(lesson?.questionBank) ? lesson.questionBank.filter((question) => question.difficulty === 'both' || question.difficulty === difficulty) : [];
  for (const [index, question] of questions.entries()) {
    const card = document.createElement('section'); card.className = 'quiz-question card';
    const heading = document.createElement('h3'); heading.textContent = `Otázka ${index + 1}`;
    const body = document.createElement('div'); const actions = document.createElement('div'); actions.className = 'quiz-question__actions'; const feedback = document.createElement('div'); feedback.id = `quiz-feedback-${question.id}`; body.setAttribute('aria-describedby', feedback.id);
    const module = await loadType(question.type); module.render(body, question, { difficulty });
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-primary'; button.textContent = 'Zkontrolovat';
    button.addEventListener('click', async () => {
      const answer = module.serialize(); const local = module.evaluate(answer, question); module.reveal(feedback, local, question);
      if (!local.valid || !authenticated) return;
      const attempt = { course: 'ai-gramotnost', lesson_slug: lesson.slug, question_id: question.id, client_attempt_uuid: uuid(), answer, difficulty };
      button.disabled = true;
      try {
        const saved = await QuizApi.evaluate(attempt);
        module.reveal(feedback, { ...local, ...saved.result }, question);
        const streak = document.createElement('p'); streak.className = 'quiz-streak-live'; streak.textContent = `🔥 Série v lekci: ${saved.state?.streak || 0} · ${Number(saved.state?.multiplier || 1) >= 1.25 ? '×1,25 aktivní' : '×1'}`; feedback.append(streak);
        if (question.trap === true && saved.result?.correct === false) {
          const review = document.createElement('button'); review.type = 'button'; review.className = 'btn btn-secondary'; review.textContent = 'Chci to zkusit znovu za pár lekcí';
          review.addEventListener('click', async () => { review.disabled = true; try { await QuizApi.scheduleReview([question.id]); review.textContent = 'Přidáno do opakování'; } catch (_) { review.disabled = false; review.textContent = 'Přidání se nezdařilo'; } });
          feedback.append(review);
        }
        if (question.type === 'poll') {
          const poll = await QuizApi.poll(question.id);
          const distribution = document.createElement('p');
          distribution.className = 'quiz-poll-distribution';
          distribution.textContent = `Odpovědi ostatních: ${(poll.distribution || []).map((item) => `${item.option_index}: ${item.response_count}`).join(' · ') || 'zatím žádné'}`;
          feedback.append(distribution);
        }
        if (question.id === '5-5-q3' && typeof answer.text === 'string') {
          await QuizApi.prediction(answer.text);
          const note = document.createElement('p'); note.textContent = 'Předpověď je uložená na 12 měsíců. E-mailový worker je samostatný provozní krok.'; feedback.append(note);
        }
      } catch (error) { enqueueAttempt(attempt); feedback.textContent = 'Odpověď je bezpečně ve frontě a po obnovení připojení se odešle právě jednou.'; }
      finally { button.disabled = false; }
    });
    actions.append(button); card.append(heading, body, actions, feedback); container.append(card);
  }
  return questions.length;
}

export async function flushOfflineQuizQueue() { return flushAttempts((attempt) => attempt._endpoint === 'microtask' ? QuizApi.microtask(attempt) : QuizApi.evaluate(attempt)); }

function rhythmHeading(title, description) {
  const section = document.createElement('section'); section.className = 'quiz-rhythm-section card';
  const heading = document.createElement('h2'); heading.textContent = title;
  const detail = document.createElement('p'); detail.className = 'quiz-rhythm-section__description'; detail.textContent = description;
  section.append(heading, detail); return section;
}

function plainMarkdown(text) {
  return String(text || '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function appendPlanMarkdown(container, markdown) {
  let list = null; let listType = '';
  const flushList = () => { if (list) container.append(list); list = null; listType = ''; };
  for (const sourceLine of String(markdown || '').split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line) { flushList(); continue; }
    const heading = line.match(/^###\s+(.+)$/);
    if (heading) { flushList(); const node = document.createElement('h3'); node.textContent = plainMarkdown(heading[1]); container.append(node); continue; }
    const ordered = line.match(/^\d+\.\s+(.+)$/); const unordered = line.match(/^[-*]\s+(.+)$/);
    if (ordered || unordered) {
      const nextType = ordered ? 'ol' : 'ul'; if (listType !== nextType) { flushList(); list = document.createElement(nextType); listType = nextType; }
      const item = document.createElement('li'); item.textContent = plainMarkdown((ordered || unordered)[1]); list.append(item); continue;
    }
    flushList();
    const node = document.createElement(line.startsWith('>') ? 'blockquote' : 'p');
    node.textContent = plainMarkdown(line.replace(/^>\s*/, '')); container.append(node);
  }
  flushList();
}

function theoryBlocks(container, lesson, difficulty) {
  (lesson.theory?.blocks || []).forEach((block) => {
    const part = document.createElement('section');
    if (block.title) { const h = document.createElement('h3'); h.textContent = block.title; part.append(h); }
    const markdown = difficulty === 'pro' ? (block.pro || block.md || block.junior || '') : (block.junior || block.md || block.pro || '');
    appendPlanMarkdown(part, markdown); container.append(part);
  });
}

function rememberBlock(container, lesson, authenticated) {
  const list = document.createElement('ul');
  (lesson.remember || []).slice(0, 3).forEach((item) => { const li = document.createElement('li'); li.textContent = item; list.append(li); });
  const save = document.createElement('button'); save.type = 'button'; save.className = 'btn btn-secondary'; save.textContent = 'Přidat do opakování';
  save.disabled = !authenticated;
  save.textContent = authenticated ? 'Přidat do opakování' : 'Přihlásit se pro opakování';
  save.addEventListener('click', async () => {
    save.disabled = true;
    try { await QuizApi.scheduleReview((lesson.questionBank || []).slice(0, 5).map((question) => question.id)); save.textContent = 'Přidáno do opakování'; }
    catch (_) { save.disabled = false; save.textContent = 'Přidání se nezdařilo'; }
  });
  container.append(list, save);
}

async function calibrationBlock(container) {
  const section = rhythmHeading('Kalibrační graf', 'Porovnání tvé deklarované jistoty se skutečnou úspěšností.');
  try {
    const data = await QuizApi.calibration();
    if (!data.round_count) section.append(Object.assign(document.createElement('p'), { textContent: 'Graf se zobrazí po dokončení šesti sázek v této lekci.' }));
    else {
      const ns = 'http://www.w3.org/2000/svg'; const chart = document.createElementNS(ns, 'svg'); chart.classList.add('quiz-calibration-chart'); chart.setAttribute('viewBox', '0 0 480 260'); chart.setAttribute('role', 'img');
      chart.setAttribute('aria-label', `Kalibrační graf: osa X vsazená jistota, osa Y reálná úspěšnost. Odchylka ${data.mean_absolute_error_pct} procentního bodu.`);
      const line = (x1,y1,x2,y2,cls) => { const item=document.createElementNS(ns,'line'); [['x1',x1],['y1',y1],['x2',x2],['y2',y2],['class',cls]].forEach(([key,value])=>item.setAttribute(key,String(value))); chart.append(item); };
      const label = (x,y,value) => { const item=document.createElementNS(ns,'text'); item.setAttribute('x',String(x)); item.setAttribute('y',String(y)); item.textContent=value; chart.append(item); };
      line(55,20,55,220,'quiz-calibration-axis'); line(55,220,455,220,'quiz-calibration-axis'); label(8,22,'100 %'); label(24,224,'0 %'); label(190,252,'vsazená jistota (XP)');
      (data.buckets || []).forEach((bucket,index) => { const x=120+index*130; const expectedY=220-(bucket.confidence_pct*2); const actualY=220-(bucket.accuracy_pct*2); line(x,220,x,actualY,'quiz-calibration-actual'); const expected=document.createElementNS(ns,'circle'); expected.setAttribute('cx',String(x)); expected.setAttribute('cy',String(expectedY)); expected.setAttribute('r','7'); expected.setAttribute('class','quiz-calibration-expected'); chart.append(expected); const actual=document.createElementNS(ns,'circle'); actual.setAttribute('cx',String(x)); actual.setAttribute('cy',String(actualY)); actual.setAttribute('r','7'); actual.setAttribute('class','quiz-calibration-point'); chart.append(actual); label(x-18,240,`${bucket.stake} XP`); label(x-30,Math.max(15,actualY-12),`${bucket.accuracy_pct} % (${bucket.count}×)`); });
      const summary = document.createElement('p'); summary.textContent = `Průměrná kalibrační odchylka: ${data.mean_absolute_error_pct} procentního bodu.${data.calibrated ? ' Odznak Kalibrovaný je splněn.' : ''}`;
      section.append(chart, summary);
    }
  } catch (_) { section.append(Object.assign(document.createElement('p'), { textContent: 'Kalibrační graf je dočasně nedostupný; lekce zůstává použitelná.' })); }
  container.append(section);
}

async function mountWarmup(container, lesson, authenticated, difficulty) {
  if (lesson.slug === '1-1-co-je-ai') {
    const prompt = document.createElement('p'); prompt.textContent = 'Na kolik z 8 otázek o AI podle sebe teď odpovíš správně?';
    const range = document.createElement('input'); range.type = 'range'; range.min = '0'; range.max = '8'; range.value = '4'; range.setAttribute('aria-label', 'Vstupní odhad z osmi otázek');
    const output = document.createElement('output'); output.textContent = '4 z 8'; range.addEventListener('input', () => { output.textContent = `${range.value} z 8`; });
    const save = document.createElement('button'); save.type = 'button'; save.className = 'btn btn-secondary'; save.textContent = authenticated ? 'Uložit vstupní odhad' : 'Odhad se uloží po přihlášení'; save.disabled = !authenticated;
    save.addEventListener('click', async () => { save.disabled = true; try { await QuizApi.saveSelfAssessment(Number(range.value)); save.textContent = 'Vstupní odhad uložen'; } catch (_) { save.disabled = false; save.textContent = 'Uložení se nezdařilo'; } });
    container.append(prompt, range, output, save); return;
  }
  if (!authenticated) { container.append(Object.assign(document.createElement('p'), { textContent: 'Po přihlášení se rozcvička sestaví z předchozích chyb, pastí a termínů opakování.' })); return; }
  try {
    const prepared = await QuizApi.warmup(lesson.slug); const answers = {}; const checks = [];
    for (const question of prepared.questions || []) {
      const card = document.createElement('section'); card.className = 'quiz-question'; const body = document.createElement('div'); const feedback = document.createElement('div');
      const module = await loadType(question.type); module.render(body, question, { difficulty });
      const check = document.createElement('button'); check.type = 'button'; check.className = 'btn btn-secondary'; check.textContent = 'Zkontrolovat rozcvičku'; checks.push(check);
      check.addEventListener('click', () => { const value = module.serialize(); const result = module.evaluate(value, question); module.reveal(feedback, result, question); if (result.valid) { answers[question.id] = value; check.disabled = true; } });
      card.append(body, check, feedback); container.append(card);
    }
    if ((prepared.questions || []).length >= 2) {
      const save = document.createElement('button'); save.type = 'button'; save.className = 'btn btn-primary'; save.textContent = 'Dokončit rozcvičku';
      save.addEventListener('click', async () => { if (Object.keys(answers).length !== prepared.questions.length) { save.textContent = 'Nejdřív odpověz na všechny otázky'; return; } save.disabled = true; try { const result = await QuizApi.saveWarmup({ lesson_slug: lesson.slug, client_attempt_uuid: uuid(), answers }); save.textContent = `Rozcvička: ${result.score_pct} % · +${result.xp_awarded} XP`; } catch (_) { save.disabled = false; save.textContent = 'Rozcvičku se nepodařilo uložit'; } });
      container.append(save);
    }
  } catch (_) { container.append(Object.assign(document.createElement('p'), { textContent: 'Rozcvička je dočasně nedostupná; pokračuj teorií.' })); }
}

export async function mountLessonRhythm(container, lesson, { difficulty = 'junior', authenticated = false } = {}) {
  container.replaceChildren();
  const warmup = rhythmHeading('Rozcvička', 'Krátké zopakování z předchozích lekcí. Po zobrazení ji můžeš přeskočit.');
  await mountWarmup(warmup, lesson, authenticated, difficulty);
  const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'btn btn-secondary'; skip.textContent = 'Rozcvičku přeskočit';
  skip.addEventListener('click', () => { skip.disabled = true; skip.textContent = 'Rozcvička přeskočena'; }); warmup.append(skip);
  const theory = rhythmHeading('Teorie', 'Nejdřív si vytvoř pevný základ.'); theoryBlocks(theory, lesson, difficulty);
  const questions = rhythmHeading('Kontrolní otázky', 'Odpovídej postupně, feedback dostaneš ihned.');
  const questionHost = document.createElement('div'); questions.append(questionHost);
  await mountQuizQuestions(questionHost, lesson, { difficulty, authenticated });
  const microtask = rhythmHeading('Mikro-úkol', 'Dobrovolný úkol přidá XP, ale neblokuje dokončení lekce.');
  const micro = lesson.microtask || {}; const prompt = document.createElement('p'); prompt.textContent = micro.md || 'V této lekci není mikro-úkol.'; microtask.append(prompt);
  if (micro.proof === 'text') {
    const proof = document.createElement('textarea'); proof.rows = 4; proof.placeholder = 'Napiš krátký důkaz nebo výsledek.'; proof.setAttribute('aria-label', 'Důkaz splnění mikro-úkolu');
    const saveMicro = document.createElement('button'); saveMicro.type = 'button'; saveMicro.className = 'btn btn-primary'; saveMicro.textContent = authenticated ? 'Uložit mikro-úkol' : 'Přihlásit se pro uložení XP'; saveMicro.disabled = !authenticated;
    const microStatus = document.createElement('p'); microStatus.setAttribute('role', 'status');
    saveMicro.addEventListener('click', async () => {
      const text = proof.value.trim(); if (!text) { microStatus.textContent = 'Doplň krátký důkaz splnění.'; return; }
      const entry = { _endpoint:'microtask', lesson_slug:lesson.slug, client_attempt_uuid:uuid(), text }; saveMicro.disabled = true;
      try { const result = await QuizApi.microtask(entry); microStatus.textContent = `Mikro-úkol uložen · +${result.xp_awarded || 0} XP`; }
      catch (_) { enqueueAttempt(entry); microStatus.textContent = 'Mikro-úkol je bezpečně ve frontě a odešle se po obnovení připojení.'; saveMicro.disabled = false; }
    });
    microtask.append(proof, saveMicro, microStatus);
  }
  const remember = rhythmHeading('Zapamatuj si', 'Tři myšlenky, ke kterým se můžeš vrátit.'); rememberBlock(remember, lesson, authenticated);
  container.append(warmup, theory, questions, microtask, remember);
  if (lesson.slug === '6-1-kriticke-mysleni' && authenticated) await calibrationBlock(container);
}

export async function mountDifficultyControl(container, { authenticated = false, onChange = () => {} } = {}) {
  let difficulty = localStorage.getItem('vevit-edu-quiz-difficulty') === 'pro' ? 'pro' : 'junior';
  if (authenticated) {
    try { const profile = await QuizApi.profile(); difficulty = profile.difficulty === 'pro' ? 'pro' : 'junior'; } catch (_) { /* Bez sítě zůstane lokální fallback. */ }
  }
  const label = document.createElement('label'); label.className = 'quiz-difficulty'; label.textContent = 'Výklad: ';
  const select = document.createElement('select'); select.setAttribute('aria-label', 'Úroveň výkladu');
  [['junior', 'Junior'], ['pro', 'Pro']].forEach(([value, name]) => { const option = document.createElement('option'); option.value = value; option.textContent = name; option.selected = value === difficulty; select.append(option); });
  select.addEventListener('change', async () => {
    const next = select.value === 'pro' ? 'pro' : 'junior'; localStorage.setItem('vevit-edu-quiz-difficulty', next);
    if (authenticated) { try { await QuizApi.setDifficulty(next); } catch (_) { /* Lokální preference zůstává použitelná. */ } }
    onChange(next);
  });
  label.append(select); container.replaceChildren(label); return difficulty;
}

async function appendPeerReviews(container) {
  const section = document.createElement('section'); section.className = 'quiz-peer-review';
  const heading = document.createElement('h2'); heading.textContent = 'Anonymní peer review'; section.append(heading);
  try {
    const data = await QuizApi.peerReviews(); const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length) section.append(Object.assign(document.createElement('p'), { textContent: 'Teď nejsou dostupné žádné cizí odpovědi k hodnocení.' }));
    for (const review of reviews) {
      const card = document.createElement('article'); card.className = 'card quiz-peer-review__card';
      const title = document.createElement('h3'); title.textContent = `Odpověď k otázce ${review.question_id}`;
      const answer = document.createElement('blockquote'); answer.textContent = review.body;
      const scores = (review.rubric || []).map(() => null);
      (review.rubric || []).forEach((criterion, index) => {
        const label = document.createElement('label'); label.className = 'quiz-self-rubric__row';
        const textNode = document.createElement('span'); textNode.textContent = criterion.hint ? `${criterion.label} — ${criterion.hint}` : criterion.label;
        const select = document.createElement('select'); select.setAttribute('aria-label', `${criterion.label}: hodnocení 0 až 5`); select.append(new Option('Vyber 0–5', ''));
        for (let value=0;value<=5;value+=1) select.append(new Option(String(value),String(value)));
        select.addEventListener('change',()=>{scores[index]=select.value===''?null:Number(select.value);save.disabled=scores.some((score)=>!Number.isInteger(score));});
        label.append(textNode,select);card.append(label);
      });
      const save = document.createElement('button'); save.type = 'button'; save.className = 'btn btn-primary'; save.textContent = 'Odeslat anonymní hodnocení'; save.disabled = true;
      const status = document.createElement('p'); status.setAttribute('role','status');
      save.addEventListener('click',async()=>{save.disabled=true;try{const result=await QuizApi.savePeerReview(review.submission_id,scores);status.textContent=result.reviewed?`Hodnocení uloženo · +${result.xp_awarded} XP`:'Tuto odpověď už ohodnotil někdo jiný.';}catch(_){save.disabled=false;status.textContent='Hodnocení se nepodařilo uložit.';}});
      card.prepend(title,answer);card.append(save,status);section.append(card);
    }
  } catch (_) { section.append(Object.assign(document.createElement('p'), { textContent: 'Peer review je dočasně nedostupné.' })); }
  container.append(section);
}

export function mountChapterIntroduction(container, chapter) {
  container.replaceChildren();
  const root = document.createElement('section'); root.className = 'chapter-introduction card';
  const title = document.createElement('h1'); title.textContent = chapter.title || 'Úvod kapitoly';
  const hook = document.createElement('section'); const hookH = document.createElement('h2'); hookH.textContent = 'Háček'; const hookP = document.createElement('p'); hookP.textContent = chapter.hook?.md || ''; hook.append(hookH, hookP);
  const guess = document.createElement('section'); const guessH = document.createElement('h2'); guessH.textContent = 'Tipni si'; const guessP = document.createElement('p'); guessP.textContent = chapter.guess?.md || ''; guess.append(guessH, guessP);
  const three = document.createElement('section'); const threeH = document.createElement('h2'); threeH.textContent = 'Velká trojka'; const list = document.createElement('ol'); (chapter.bigThree || []).forEach((item) => { const li = document.createElement('li'); li.textContent = item; list.append(li); }); three.append(threeH, list);
  const figure = document.createElement('figure'); const image = document.createElement('img'); image.src = chapter.figure?.src || ''; image.alt = chapter.figure?.alt || ''; const caption = document.createElement('figcaption'); caption.textContent = chapter.figure?.caption || ''; figure.append(image, caption);
  const mission = document.createElement('section'); const missionH = document.createElement('h2'); missionH.textContent = 'Mise'; const missionP = document.createElement('p'); missionP.textContent = chapter.mission?.md || ''; mission.append(missionH, missionP);
  root.append(title, hook, guess, three, figure, mission); container.append(root);
}

export async function mountQuizProgress(container, reviewContainer = null) {
  const state = await QuizApi.state(); const quizXp = (state.states || []).reduce((sum, item) => sum + Number(item.xp_total || 0), 0);
  const lessonXp = Number(window.LocalProgress?.totalXp?.() || 0);
  const streak = Number(state.streak || 0); const multiplier = streak >= 3 ? '×1,25 aktivní' : '×1 po správných odpovědích';
  container.replaceChildren();
  const panel = document.createElement('section'); panel.className = 'card quiz-progress';
  panel.innerHTML = `<h2>Tvůj postup</h2><p><strong>Za lekce:</strong> ${lessonXp} XP</p><p><strong>Za kvízy:</strong> ${quizXp} XP</p><p class="quiz-streak">🔥 Série: ${streak} správně za sebou · ${multiplier}</p><h3>Odznaky</h3>`;
  const gallery = document.createElement('div'); gallery.className = 'quiz-badge-gallery'; const earned = new Set((state.badges || []).map((badge) => badge.badge_key));
  BADGES.forEach(([key, title, description]) => { const item = document.createElement('div'); item.className = `quiz-badge-card ${earned.has(key) ? 'is-earned' : ''}`; item.textContent = earned.has(key) ? `✓ ${title}` : `🔒 ${title} — ${description}`; gallery.append(item); }); panel.append(gallery); container.append(panel);
  if (reviewContainer) {
    reviewContainer.replaceChildren(); const due = (state.reviews || []).filter((item) => new Date(item.due_at).getTime() <= Date.now());
    const heading = document.createElement('h2'); heading.textContent = 'Na zopakování'; reviewContainer.append(heading);
    if (!due.length) reviewContainer.append(Object.assign(document.createElement('p'), { textContent: 'Dnes nemáš nic k opakování.' }));
    due.forEach((item) => { const link = document.createElement('a'); link.href = '#course'; link.className = 'lesson-row'; link.textContent = `${item.question_id} · interval ${item.interval_days} dní`; reviewContainer.append(link); });
    await appendPeerReviews(reviewContainer);
  }
  return state;
}

function adaptiveFor(question, pool, used) {
  const tag = (question.tags || []).find((value) => String(value).startsWith('chapter-'));
  return pool.find((candidate) => !used.has(candidate.id) && (!tag || (candidate.tags || []).includes(tag)))
    || pool.find((candidate) => !used.has(candidate.id)) || null;
}

export async function mountMilestoneQuiz(container, config) {
  container.replaceChildren();
  const answers = {}; const completed = new Set(); const used = new Set((config.questions || []).map((question) => question.id));
  let mistakes = 0; let adaptiveAdded = 0; const queue = [...(config.questions || [])];
  const status = document.createElement('p'); status.className = 'quiz-milestone-status'; status.setAttribute('aria-live', 'polite');
  const list = document.createElement('div');
  const submit = document.createElement('button'); submit.type = 'button'; submit.className = 'btn btn-primary'; submit.textContent = 'Vyhodnotit milník'; submit.disabled = true;
  const resultBox = document.createElement('div'); resultBox.setAttribute('role', 'status');
  const reflection = [];
  const reflectionSection = document.createElement('section'); reflectionSection.className = 'card quiz-final-reflection';
  if (config.milestone === 'final-6') {
    const title=document.createElement('h2'); title.textContent='Závěrečná reflexe'; reflectionSection.append(title);
    ['Co jsem si myslel(a) o AI před kurzem a co si myslím teď?','Jedna věc, kterou jsem si prakticky ověřil(a).','Moje pravidlo pro kontrolu AI výstupů.'].forEach((prompt,index)=>{
      reflection[index]={text:'',score:null};
      const group=document.createElement('fieldset'); const legend=document.createElement('legend'); legend.textContent=prompt;
      const area=document.createElement('textarea');area.rows=4;area.setAttribute('aria-label',prompt);area.addEventListener('input',()=>{reflection[index].text=area.value;refreshStatus();});
      const scoreLabel=document.createElement('label');scoreLabel.textContent='Jak konkrétní a ověřitelná je odpověď? ';
      const score=document.createElement('select');score.setAttribute('aria-label',`${prompt}: sebehodnocení 0 až 5`);score.append(new Option('Vyber 0–5',''));
      for(let value=0;value<=5;value+=1)score.append(new Option(String(value),String(value)));
      score.addEventListener('change',()=>{reflection[index].score=score.value===''?null:Number(score.value);refreshStatus();});
      scoreLabel.append(score);group.append(legend,area,scoreLabel);reflectionSection.append(group);
    });
  }
  const refreshStatus = () => {
    const lives = Number(config.lives || 0); const livesText = lives > 0 ? ` · životy ${Math.max(0, lives - mistakes)}/${lives}` : '';
    status.textContent = `Dokončeno ${completed.size}/${queue.length}${livesText}`;
    submit.disabled = queue.some((question) => !completed.has(question.id)) || (config.milestone === 'final-6' && (reflection.length !== 3 || reflection.some((value)=>String(value?.text||'').trim().length < 10 || !Number.isInteger(value?.score) || value.score < 0 || value.score > 5)));
  };
  const renderQuestion = async (question, adaptive = false) => {
    const card = document.createElement('section'); card.className = `quiz-question card${adaptive ? ' quiz-question--adaptive' : ''}`;
    const heading = document.createElement('h3'); heading.textContent = adaptive ? 'Doplňující otázka po chybě' : `Otázka ${list.children.length + 1}`;
    const body = document.createElement('div'); const feedback = document.createElement('div'); feedback.id = `milestone-feedback-${question.id}`; body.setAttribute('aria-describedby', feedback.id);
    const module = await loadType(question.type); module.render(body, question, { difficulty: 'pro' });
    const check = document.createElement('button'); check.type = 'button'; check.className = 'btn btn-secondary'; check.textContent = 'Uložit odpověď';
    check.addEventListener('click', async () => {
      const answer = module.serialize(); let evaluation;
      check.disabled = true;
      try { const checked = await QuizApi.checkMilestone(config.milestone, question.id, answer, config.attempt || 1); evaluation = checked.result; module.reveal(feedback, evaluation, { ...question, why: checked.why || question.why }); }
      catch (error) { feedback.textContent = error.message || 'Odpověď se nepodařilo ověřit.'; check.disabled = false; return; }
      answers[question.id] = answer; completed.add(question.id); check.disabled = true;
      if (evaluation.correct === false) {
        mistakes += 1;
        if (config.adaptive && adaptiveAdded < 5) {
          const extra = adaptiveFor(question, config.adaptive_pool || [], used);
          if (extra) { adaptiveAdded += 1; used.add(extra.id); queue.push(extra); await renderQuestion(extra, true); }
        }
      }
      refreshStatus();
    });
    card.append(heading, body, check, feedback); list.append(card);
  };
  for (const question of queue) await renderQuestion(question);
  submit.addEventListener('click', async () => {
    submit.disabled = true; resultBox.textContent = 'Vyhodnocuji…';
    try {
      const result = await QuizApi.milestone(config.milestone, { ...answers }, config.attempt || 1, reflection);
      resultBox.textContent = result.passed ? `Splněno: ${result.score_pct} %. Odznak byl ověřen serverem.` : `Nesplněno: ${result.score_pct} %. Zopakuj slabá témata a zkus to znovu.`;
      if (config.milestone === 'final-6') {
        try { const entry = await QuizApi.selfAssessment(); const compare = document.createElement('p'); compare.textContent = entry.estimate === null ? `Výsledek: ${result.score_pct} %. Vstupní odhad nebyl uložen.` : `Na začátku sis tipnul(a) ${entry.estimate} z 8; závěrečný výsledek je ${result.score_pct} %.`; resultBox.append(compare); } catch (_) { /* Výsledek zůstává zobrazen. */ }
        if (result.passed) { const certificate = document.createElement('a'); certificate.className = 'btn btn-secondary'; certificate.href = '/edu/ai-gramotnost/certificate.php'; certificate.textContent = 'Otevřít certifikát'; resultBox.append(certificate); }
      }
      if (!result.passed && String(config.milestone).startsWith('boss-')) { const retry = document.createElement('a'); retry.className = 'btn btn-secondary'; retry.href = `#milestone/${encodeURIComponent(config.milestone)}/${Number(config.attempt || 1) + 1}`; retry.textContent = 'Zopakovat s jinou sadou'; resultBox.append(retry); }
    } catch (_) { resultBox.textContent = 'Výsledek se nyní nepodařilo uložit. Odpovědi zůstávají na stránce.'; submit.disabled = false; }
  });
  container.append(status, list); if (config.milestone === 'final-6') container.append(reflectionSection); container.append(submit, resultBox); refreshStatus();
}

window.VeVitQuizRuntime = { mountQuizQuestions, mountQuizProgress, mountLessonRhythm, mountDifficultyControl, mountChapterIntroduction, mountMilestoneQuiz, flushOfflineQuizQueue };
window.addEventListener('online', () => { if (window.VevitSessionState?.state === 'authenticated') flushOfflineQuizQueue().catch(() => {}); });
window.addEventListener('vevit:sessionchange', (event) => { if (event.detail?.state === 'authenticated') flushOfflineQuizQueue().catch(() => {}); });
