import { phpMbSubstr, phpStripTags } from "@/lib/edu-wikipedia-sanitize";

/**
 * Port of edu/ai-gramotnost/data/content.php (+ the en overlay from
 * content.en.php, see gramotnostContentLang()) — clean course data with the
 * builder helpers and the no-DB fallback structures used by
 * edu/ai-gramotnost/api/courses.php + exercises.php.
 *
 * PHP numeric-string array keys become int keys, so item/option ids are
 * numbers where PHP would have them (phpKey below mirrors that), while list
 * values (e.g. correct order arrays) keep their string form — both sides of
 * every evaluation compare via strval, so parity holds.
 */

export type GramLang = "cs" | "en";

export type GramExercise = {
  title: string;
  type: string;
  prompt: string;
  config: Record<string, unknown>;
  correct_answer: unknown;
  explanation: string;
  xp: number;
};

export type GramLessonRow = {
  chapter: number;
  sort: number;
  title: string;
  slug: string;
  duration: number;
  xp: number;
  content: string;
  exercises: GramExercise[];
};

/** PHP treats numeric-string array keys as ints. */
function phpKey(id: string | number): string | number {
  return typeof id === "number" ? id : /^\d+$/.test(id) ? Number.parseInt(id, 10) : id;
}

/** PHP `(array)` cast of a scalar/null → single-element/empty list. */
function phpArray(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return Object.values(value as Record<string, unknown>);
  return [value];
}

// ── Buildery (mc/tf/sortEx/matchEx/fill/dd/pb/sim/codeEx/open) ──

function mc(
  title: string, prompt: string, opts: Record<string, string>, correct: unknown,
  explanation: string, xp = 35,
): GramExercise {
  const o = Object.keys(opts).map((id) => ({ id: phpKey(id), text: opts[id] }));
  const correctRaw = phpArray(correct);
  return {
    title, type: "multiple_choice", prompt,
    config: { options: o, allowMultiple: Array.isArray(correct) && correctRaw.length > 1 },
    correct_answer: { correctIds: correctRaw.map((v) => String(v)) },
    explanation, xp,
  };
}

function tf(title: string, prompt: string, isTrue: boolean, explanation: string, xp = 25): GramExercise {
  return {
    title, type: "true_false", prompt,
    config: {},
    correct_answer: { correctIds: [isTrue ? "true" : "false"] },
    explanation, xp,
  };
}

function sortEx(
  title: string, prompt: string, items: Record<string, string>, order: string[],
  explanation: string, xp = 35,
): GramExercise {
  const it = Object.keys(items).map((id) => ({ id: phpKey(id), text: items[id] }));
  return {
    title, type: "sorting", prompt,
    config: { items: it },
    correct_answer: { order },
    explanation, xp,
  };
}

function matchEx(
  title: string, prompt: string, pairs: Record<string, [string, string]>,
  explanation: string, xp = 35,
): GramExercise {
  const keys = Object.keys(pairs);
  const pp = keys.map((id) => ({ id: phpKey(id), left: pairs[id][0], right: pairs[id][1] }));
  const cor = keys.map((id) => ({ leftId: phpKey(id), rightId: phpKey(id) }));
  return {
    title, type: "matching", prompt,
    config: { pairs: pp },
    correct_answer: { pairs: cor },
    explanation, xp,
  };
}

function fill(
  title: string, prompt: string, text: string, answers: string[],
  explanation: string, xp = 35,
): GramExercise {
  return {
    title, type: "fill_blank", prompt,
    config: { text },
    correct_answer: { answers },
    explanation, xp,
  };
}

function dd(
  title: string, prompt: string, items: Record<string, string>, zones: Record<string, string>,
  placements: Record<string, string>, explanation: string, xp = 35,
): GramExercise {
  const it = Object.keys(items).map((id) => ({ id: phpKey(id), text: items[id] }));
  const z = Object.keys(zones).map((id) => ({ id: phpKey(id), label: zones[id] }));
  const cor: Record<string | number, string> = {};
  for (const [id, zone] of Object.entries(placements)) cor[phpKey(id)] = zone;
  return {
    title, type: "drag_drop", prompt,
    config: { items: it, zones: z },
    correct_answer: { placements: cor },
    explanation, xp,
  };
}

function pb(
  title: string, prompt: string, blocks: Record<string, string>, order: string[],
  explanation: string, xp = 35,
): GramExercise {
  const b = Object.keys(blocks).map((id) => ({ id: phpKey(id), label: blocks[id] }));
  return {
    title, type: "prompt_builder", prompt,
    config: { blocks: b },
    correct_answer: { order },
    explanation, xp,
  };
}

function sim(
  title: string, prompt: string, scenario: string, goal: string, maxTurns: number,
  responses: Array<{ trigger: string; response: string; isWin: boolean }>,
  explanation: string, xp = 35,
): GramExercise {
  return {
    title, type: "simulation", prompt,
    config: { scenario, goal, maxTurns, responses, fallback: "Zkus to jinak." },
    correct_answer: { wonExpected: true },
    explanation, xp,
  };
}

function codeEx(
  title: string, prompt: string, lang: string, starter: string, kw: string[],
  explanation: string, xp = 35,
): GramExercise {
  return {
    title, type: "code_playground", prompt,
    config: { language: lang, starterCode: starter },
    correct_answer: { keywords: kw },
    explanation, xp,
  };
}

function open(title: string, prompt: string, kw: string[], explanation: string, xp = 35): GramExercise {
  return {
    title, type: "open_response", prompt,
    config: { keywords: kw },
    correct_answer: { keywords: kw },
    explanation, xp,
  };
}

// ── Data (cs canonical; lesson bodies stay cs until the full-content
//    translation follow-up, same as the PHP overlay approach) ──

const ACHS_CS: unknown[][] = [
  ["První kroky", "Dokonči 1 lekci", "zap", 1, "lessons_count", 1, 50],
  ["Prompt Wizard", "100 % v 5 prompt builder cvičeních", "brain", 2, "perfect_exercises", 5, 100],
  ["Streak Master", "7 dní v řadě", "flame", 3, "streak", 7, 75],
  ["Speedrunner", "3 lekce pod 50 % průměrného času", "zap", 4, "speed_bonus_count", 3, 50],
  ["Perfectionist", "Dokonči kapitolu se 100 %", "trophy", 5, "perfect_chapter", 1, 100],
  ["Code Poet", "Všechna kódová cvičení", "zap", 6, "all_code_exercises", 1, 75],
  ["RAG Pioneer", "Dokonči kapitolu 5", "brain", 7, "chapter_complete", 5, 50],
  ["Full Stack", "Dokonči celý kurz", "trophy", 8, "course_complete", 1, 200],
  ["Early Bird", "Přihlas se před 8:00", "zap", 9, "login_before_hour", 8, 25],
  ["Night Owl", "Studuj po 22:00", "brain", 10, "login_after_hour", 22, 25],
];
const CHAPTERS_CS: Record<number, [string, string]> = {
  1: ["Úvod do AI", "Základy, historie, dělení AI a etika."],
  2: ["Jak AI funguje", "Neuronové sítě, LLM, modely, multimodalita."],
  3: ["Prompt Engineering", "Od základů po pokročilé techniky."],
  4: ["Praktická integrace AI nástrojů", "AI v praxi – kancelář, výzkum, automatizace."],
  5: ["Pokročilá témata", "API, chatboti, RAG, fine-tuning, trendy."],
  6: ["Závěr a projekty", "Kritické myšlení a závěrečné projekty."],
};
const COURSE_META_CS = {
  title: "AI Gramotnost",
  description: "Kompletní kurz AI gramotnosti – od základů po pokročilé techniky prompt engineeringu a integrace AI nástrojů.",
};

const ACHS_EN: unknown[][] = [
  ["First Steps", "Complete 1 lesson", "zap", 1, "lessons_count", 1, 50],
  ["Prompt Wizard", "100% in 5 prompt builder exercises", "brain", 2, "perfect_exercises", 5, 100],
  ["Streak Master", "7 days in a row", "flame", 3, "streak", 7, 75],
  ["Speedrunner", "3 lessons under 50% of average time", "zap", 4, "speed_bonus_count", 3, 50],
  ["Perfectionist", "Complete a chapter with 100%", "trophy", 5, "perfect_chapter", 1, 100],
  ["Code Poet", "All code exercises", "zap", 6, "all_code_exercises", 1, 75],
  ["RAG Pioneer", "Complete chapter 5", "brain", 7, "chapter_complete", 5, 50],
  ["Full Stack", "Complete the entire course", "trophy", 8, "course_complete", 1, 200],
  ["Early Bird", "Log in before 8:00", "zap", 9, "login_before_hour", 8, 25],
  ["Night Owl", "Study after 22:00", "brain", 10, "login_after_hour", 22, 25],
];
const CHAPTERS_EN: Record<number, [string, string]> = {
  1: ["Intro to AI", "Foundations, history, AI types and ethics."],
  2: ["How AI Works", "Neural networks, LLMs, models, multimodality."],
  3: ["Prompt Engineering", "From basics to advanced techniques."],
  4: ["Practical AI Tool Integration", "AI in practice – office, research, automation."],
  5: ["Advanced Topics", "APIs, chatbots, RAG, fine-tuning, trends."],
  6: ["Conclusion & Projects", "Critical thinking and final projects."],
};
const COURSE_META_EN = {
  title: "AI Literacy",
  description: "A complete AI literacy course – from foundations to advanced prompt engineering and AI tool integration.",
};

// Achievement defs are used only by data/seed.php (kept in the port for the
// seeding follow-up; the API endpoints never read them).
export const GRAMOTNOST_ACHS = { cs: ACHS_CS, en: ACHS_EN };

const LESSONS: GramLessonRow[] = [

{ chapter: 1, sort: 1, title: "Co je AI? – Historie a základy", slug: "1-1-co-je-ai", duration: 15, xp: 25,
content: '<p>Umělá inteligence (AI) je odvětví informatiky, které vytváří systémy schopné plnit úkoly vyžadující lidskou inteligenci – rozpoznávání řeči, rozhodování, překlad nebo tvorbu textu.</p><p>Klíčové milníky: <strong>1950</strong> Turingův test; <strong>1956</strong> Dartmouth workshop, kde vznikl termín „artificial intelligence"; <strong>1974</strong> první zima AI; <strong>1997</strong> Deep Blue poráží Kasparova; <strong>2011</strong> Watson; <strong>2016</strong> AlphaGo; <strong>2017</strong> Transformer; <strong>2020</strong> GPT-3; <strong>2022</strong> ChatGPT; <strong>2026</strong> multimodální agenti a reasoning modely.</p><div class="callout">AI není jedna technologie, ale rodina metod – od pravidel přes strojové učení po hluboké učení a generativní modely.</div>',
exercises: [
  mc("Kdy se konal Dartmouth workshop?", "Vyber rok, kdy vznikl termín „artificial intelligence\".", { a: "1948", b: "1956", c: "1974", d: "2017" }, "b", "Dartmouth workshop 1956."),
  sortEx("Milníky na časové ose", "Seřaď události od nejstarší.", { t: "Turingův test", d: "Dartmouth workshop", db: "Deep Blue", g: "ChatGPT" }, ["t", "d", "db", "g"], "Turing 1950, Dartmouth 1956, Deep Blue 1997, ChatGPT 2022."),
  tf("Deep Blue a šachy", "Deep Blue porazil šachového mistra světa už v roce 1997.", true, "Deep Blue (IBM) porazil Kasparova v roce 1997.") ]},

{ chapter: 1, sort: 2, title: "Rozdělení AI: slabá, silná, generativní", slug: "1-2-rozdeleni-ai", duration: 15, xp: 25,
content: '<p>AI dělíme podle schopností: <strong>Narrow AI (slabá)</strong> řeší jeden úkol (Siri, navigace, spam filtr) – dnes převažuje. <strong>General AI (silná)</strong> má úroveň člověka v jakémkoli úkolu, zatím hypotetická. <strong>Super AI</strong> překonává člověka ve všem. <strong>Generativní AI</strong> tvoří nový obsah (text, obrázek, kód): ChatGPT, DALL-E, Midjourney.</p><p>Rozdíl je v cíli: narrow optimalizuje jednu metriku, generativní modely se učí distribuci dat a vzorkují z ní nové výstupy.</p>',
exercises: [
  matchEx("Přiřaď typ AI", "Spáruj příklad s typem AI.", { 1: ["Siri / hlasový asistent", "Narrow AI"], 2: ["ChatGPT generuje článek", "Generativní AI"], 3: ["AI s úrovní člověka ve všem", "General AI"], 4: ["AI překonávající člověka", "Super AI"] }, "Narrow = jeden úkol, generativní = tvorba obsahu."),
  mc("Co je generativní AI?", "Vyber, co nejlépe popisuje generativní AI.", { a: "Řeší jeden konkrétní úkol", b: "Tvoří nový obsah (text, obrázek, kód)", c: "Je vždy rychlejší než člověk", d: "Funguje bez dat" }, "b", "Generativní AI vytváří nový obsah."),
  dd("Narrow vs Generativní", "Zařaď příklady do zón.", { 1: "Spam filtr", 2: "DALL-E obrázek", 3: "Překladač Google", 4: "GPT píše e-mail" }, { n: "Narrow AI", g: "Generativní AI" }, { 1: "n", 3: "n", 2: "g", 4: "g" }, "Spam a překladač = narrow; DALL-E a e-mail = generativní.") ]},

{ chapter: 1, sort: 3, title: "Strojové učení vs. hluboké učení vs. LLM", slug: "1-3-ml-dl-llm", duration: 15, xp: 25,
content: '<p>Jedná se o vnořené pojmy: <strong>Strojové učení (ML)</strong> – algoritmy učící se z dat místo pravidel. Dělí se na <em>supervised</em> (labeled data), <em>unsupervised</em> (hledá vzory), <em>reinforcement</em> (odměny/tresty). <strong>Hluboké učení (DL)</strong> – ML s hlubokými neuronovými sítěmi (CNN pro obraz, RNN pro sekvence). <strong>LLM</strong> – velký jazykový model, speciální případ DL na Transformeru, trénovaný na obrovském textu.</p><p>Každé LLM je hluboké učení, každé DL je ML – ale ne obráceně.</p>',
exercises: [
  fill("Hierarchie", "Doplň: Každé ___ je hluboké učení, každé hluboké učení je ___.", "Každé ___ je hluboké učení, každé hluboké učení je ___.", ["LLM", "strojové učení"], "LLM ⊂ DL ⊂ ML."),
  mc("Typy učení", "Který typ učení používá labeled data (vstupy + správné odpovědi)?", { a: "Supervised learning", b: "Unsupervised learning", c: "Reinforcement learning", d: "Žádný" }, "a", "Supervised = učení s označenými daty."),
  sortEx("Vrstvený model", "Seřaď od nejobecnějšího po nejkonkrétnější.", { ml: "Strojové učení", dl: "Hluboké učení", llm: "LLM" }, ["ml", "dl", "llm"], "ML ⊃ DL ⊃ LLM.") ]},

{ chapter: 1, sort: 4, title: "Etika a bezpečnost v AI", slug: "1-4-etika-bezpecnost", duration: 20, xp: 30,
content: '<p>AI přináší rizika: <strong>Bias v datech</strong> – např. Amazonův náborový AI znevýhodňoval ženy, protože se učil z historických dat mužského náboru. <strong>Halucinace LLM</strong> – modely sebevědomě tvrdí nepravdy; nutné ověřování faktů. <strong>Deepfakes</strong> – syntetický obraz/hlas zneužitelný k dezinformacím. <strong>Autorská práva</strong> – trénink na scrapeovaných datech bez souhlasu. <strong>GDPR a EU AI Act</strong> – právo na vysvětlení, ochrana údajů, klasifikace AI podle rizika.</p><p>Odpovědnost za rozhodnutí AI nakonec nese člověk, ne model.</p>',
exercises: [
  tf("Případ Amazon", "Náborový AI Amazonu diskriminoval ženy kvůli biasu v tréninkových datech.", true, "Model se učil z historických dat odrážejících genderovou nerovnováhu."),
  mc("Bias detektor", "Který případ je příkladem biasu v AI?", { a: "Model lépe rozpozná tváře světlé pleti, protože tréninková data nebyla vyrovnaná", b: "Model je pomalý na starém hardwaru", c: "Model má limitovaný kontext", d: "Model nepodporuje češtinu" }, "a", "Nevyrovnaná tréninková data vedou k biasu."),
  sortEx("EU AI Act rizika", "Seřaď od nejnižšího k nejvyššímu riziku.", { min: "Minimální riziko", lim: "Omezené riziko", vys: "Vysoké riziko", ned: "Nepřijatelné riziko" }, ["min", "lim", "vys", "ned"], "EU AI Act rozlišuje 4 úrovně rizika.") ]},

{ chapter: 2, sort: 5, title: "Principy neuronových sítí", slug: "2-1-neuronove-site", duration: 15, xp: 25,
content: '<p>Umělý neuron přijímá vstupy xᵢ, vynásobí je vahami wᵢ, sečte, přičte bias <em>b</em> a výsledek prožene <strong>aktivační funkcí</strong>. ReLU (max(0,x)) je rychlá a dominantní; Sigmoid (0–1) dává pravděpodobnost. Síť má vrstvy input → hidden → output. Učení probíhá <strong>backpropagation</strong> – chyba se šíří zpět a váhy se upravují, aby se příště chyba zmenšila.</p>',
exercises: [
  fill("Rovnice neuronu", "Doplň: výstup = aktivační funkce( součet( vstup × ___ ) + ___ ).", "výstup = aktivační funkce( součet( vstup × ___ ) + ___ )", ["váha", "bias"], "Σ(wᵢ·xᵢ) + b."),
  mc("Aktivační funkce", "Co vrací ReLU pro vstup −5?", { a: "−5", b: "0", c: "0,5", d: "1" }, "b", "ReLU(x)=max(0,x), pro záporné vstupy vrací 0."),
  sortEx("Tok signálu", "Seřaď tok signálu sítí.", { in: "Input vrstva", hi: "Hidden vrstva(y)", ou: "Output vrstva" }, ["in", "hi", "ou"], "Input → hidden → output.") ]},

{ chapter: 2, sort: 6, title: "Velké jazykové modely (LLM)", slug: "2-2-llm", duration: 15, xp: 25,
content: '<p>LLM tvoří text ve čtyřech krocích: <strong>1. Tokenizace</strong> – text se rozdělí na tokeny (často BPE, přibližně slova/podsláva). <strong>2. Embeddingy</strong> – tokeny na vektory zachycující význam. <strong>3. Attention</strong> – každý token se „dívá\" na ostatní a váží, které jsou důležité (jádro Transformeru). <strong>4. Generování</strong> – model predikuje jeden token za druhým podle kontextu. Transformer je blok tvořený vrstvami attention a feed-forward sítí, kterých je v modelu desítky.</p>',
exercises: [
  mc("Co je attention?", "Co dělá mechanismus attention v Transformeru?", { a: "Váží důležitost ostatních tokenů pro aktuální token", b: "Komprimuje obrázek", c: "Šifruje text", d: "Počítá tokeny" }, "a", "Attention určuje, na které tokeny se aktuální token dívá."),
  sortEx("Tok LLM", "Seřaď kroky generování textu.", { tok: "Tokenizace", emb: "Embedding", att: "Attention", gen: "Predikce dalšího tokenu" }, ["tok", "emb", "att", "gen"], "Text → tokeny → vektory → attention → další token."),
  tf("Tokenizace", "Jeden token vždy odpovídá přesně jednomu slovu.", false, "Token může být i část slova nebo znak (BPE).") ]},

{ chapter: 2, sort: 7, title: "Porovnání hlavních modelů", slug: "2-3-modely", duration: 20, xp: 35,
content: '<p>Hlavní modely (2026): <strong>GPT-4o (OpenAI)</strong> multimodální, rychlý, komerční. <strong>Claude 4 (Anthropic)</strong> silné reasoning, dlouhý kontext, bezpečnostní fokus. <strong>Gemini 2.5 (Google)</strong> integrovaný v Workspace, obrovský kontext. <strong>Llama 4 (Meta)</strong> open-weight, lokálně spustitelná. <strong>Mistral</strong> evropský, efektivní open-weight.</p><p>Klíčové parametry: kontextové okno (4k–2M), cena za token, multimodalita, rychlost, otevřenost/licence. Výběr závisí na úkolu: rychlý chat vs. dlouhé dokumenty vs. lokální soukromí.</p>',
exercises: [
  mc("Výběr modelu", "Pro citlivá data vyžadující lokální běh bez cloudu vybereš:", { a: "GPT-4o přes API", b: "Llama 4 lokálně (open-weight)", c: "Gemini ve Workspace", d: "Claude online" }, "b", "Lokální open-weight model pro soukromí."),
  matchEx("Parametry modelů", "Spáruj vlastnost s popisem.", { 1: ["Kontextové okno", "Počet tokenů zpracovaných najednou"], 2: ["Multimodalita", "Zpracování více typů vstupu"], 3: ["Open-weight", "Lze spustit lokálně"], 4: ["Cena za token", "Náklad na volání API"] }, "Kontext = kapacita; multimodalita = více vstupů."),
  tf("Open vs komerční", "Llama 4 je uzavřený komerční model, který nelze spustit lokálně.", false, "Llama 4 je open-weight, lokálně spustitelná.") ]},

{ chapter: 2, sort: 8, title: "Multimodální AI", slug: "2-4-multimodalni", duration: 20, xp: 35,
content: '<p>Multimodální AI zpracovává více typů vstupů/výstupů: <strong>DALL-E 3, Midjourney, Stable Diffusion</strong> – text→obraz pomocí diffuzních modelů (začínají od šumu a postupně ho odstraňují směrem k obrázku – latent space + denoising). <strong>Sora</strong> – text→video. <strong>Suno</strong> – text→audio. <strong>GPT-4o vision</strong> – chápe obrázky v konverzaci. Klíčem je sdílený prostor reprezentací (latent space), kde lze překládat mezi modalitami.</p>',
exercises: [
  mc("Diffuse – jak?", "Jak generuje obrázek difuzní model?", { a: "Postupné odstraňování šumu z náhodného počátečního obrazu podle promptu", b: "Kreslení pixel po pixelu", c: "Hledání obrázku v databázi", d: "Zrcadlení textu do obrázku" }, "a", "Diffuse = iterativní denoising z šumu."),
  matchEx("Nástroje a modalit", "Spáruj nástroj s modalitou.", { 1: ["DALL-E 3", "Text→obraz"], 2: ["Sora", "Text→video"], 3: ["Suno", "Text→audio"], 4: ["GPT-4o vision", "Obrázek v chatu"] }, "DALL-E obraz, Sora video, Suno audio."),
  tf("Multimodalita", "Multimodální model umí pracovat např. s textem i obrázkem najednou.", true, "Multimodalita = více vstupních modalit.") ]},

{ chapter: 3, sort: 9, title: "Úvod do prompt engineeringu", slug: "3-1-uvod-prompt", duration: 15, xp: 35,
content: '<p>Prompt engineering je dovednost formulovat zadání tak, aby model vrátil co nejlepší výstup. Formulace zásadně ovlivňuje výsledek: „napiš něco o AI\" dá generický text, zatímco „vysvětli princip attention mechanismu v 5 větách pro středoškoláka\" dá konkrétní, použitelné vysvětlení.</p><p>Tři principy: <strong>jasnost</strong> (co přesně chci), <strong>specifičnost</strong> (formát, délka, tón), <strong>kontext</strong> (pro koho, v jaké situaci). Kvalitní prompt šetří čas a zvyšuje kvalitu.</p>',
exercises: [
  mc("Kvalitní prompt", "Který prompt dá nejkvalitnější výstup?", { a: "napiš něco o AI", b: "vysvětli princip attention v 5 větách pro středoškoláka", c: "AI", d: "info o attention" }, "b", "Konkrétní prompt s formátem, délkou a cílovým publikem."),
  matchEx("Principy promptu", "Spáruj princip s otázkou.", { 1: ["Jasnost", "Co přesně chci?"], 2: ["Specifičnost", "Jaký formát, délka, tón?"], 3: ["Kontext", "Pro koho, v jaké situaci?"] }, "Tři pilíře dobrého promptu."),
  tf("Vliv formulace", "Formulace promptu ovlivňuje kvalitu výstupu modelu.", true, "Konkrétní prompt → konkrétní výstup.") ]},

{ chapter: 3, sort: 10, title: "Základní struktura promptu", slug: "3-2-struktura-promptu", duration: 15, xp: 35,
content: '<p>Dobrý prompt má 5 bloků: <strong>Role</strong> („Jsi expert na…\"), <strong>Kontext</strong> („V kontextu e-shopu…\"), <strong>Úkol</strong> („Vytvoř…\"), <strong>Formát</strong> („Vrať jako JSON…\"), <strong>Omezení</strong> („Max 500 slov, bez žargonu\"). Ne vždy je nutný každý blok, ale úkol a formát jsou minimum. Pořadí pomáhá modelu chápat prioritu.</p>',
exercises: [
  pb("Sestav prompt", "Přidej bloky ve správném pořadí.", { 1: "Role", 2: "Kontext", 3: "Úkol", 4: "Formát", 5: "Omezení" }, ["1", "2", "3", "4", "5"], "Role → Kontext → Úkol → Formát → Omezení."),
  fill("Chybějící blok", "Doplň: Každý prompt by měl obsahovat minimálně ___ a ___.", "Dobrý prompt obsahuje minimálně ___ a ___.", ["úkol", "formát"], "Úkol a formát jsou minimum."),
  mc("Bloky promptu", "Které jsou 5 bloků promptu?", { a: "Role, kontext, úkol, formát, omezení", b: "Úvod, tělo, závěr", c: "Vstup, výstup", d: "Název, popis, cena" }, "a", "Role, kontext, úkol, formát, omezení.") ]},

{ chapter: 3, sort: 11, title: "Typy promptů", slug: "3-3-typy-promptu", duration: 15, xp: 35,
content: '<p>Typy promptů: <strong>Zero-shot</strong> – přímý dotaz bez příkladů. <strong>One-shot</strong> – jeden příklad. <strong>Few-shot</strong> – 3+ příklady ukazující vzor. <strong>Chain-of-Thought (CoT)</strong> – „přemýšlej krok za krokem\", zlepšuje reasoning. <strong>Tree-of-Thoughts</strong> – prozkoumá více větví uvažování a vybere nejlepší. Few-shot je ideální pro konzistentní formát výstupu.</p>',
exercises: [
  mc("Co je few-shot?", "Co znamená few-shot prompt?", { a: "Přímý dotaz bez příkladů", b: "3 a více příkladů ukazujících vzor", c: "Krok za krokem", d: "Více větví" }, "b", "Few-shot = několik příkladů v promptu."),
  matchEx("Typy promptů", "Spáruj typ s popisem.", { 1: ["Zero-shot", "Přímý dotaz bez příkladů"], 2: ["Few-shot", "3+ příklady vzoru"], 3: ["Chain-of-Thought", "Přemýšlej krok za krokem"], 4: ["Tree-of-Thoughts", "Prozkoumej více větví"] }, "Typy se liší mírou vedení modelu."),
  tf("CoT", "Chain-of-Thought zlepšuje schopnost reasoning u modelu.", true, "„Přemýšlej krok za krokem\" vede model k lepšímu uvažování.") ]},

{ chapter: 3, sort: 12, title: "Iterace a ladění promptů", slug: "3-4-iterace-promptu", duration: 15, xp: 35,
content: '<p>Prvním promptem zřídkakdy dostaneš ideální výstup. Postup: <strong>1.</strong> Testuj (A/B test dvou verzí). <strong>2.</strong> Měř kvalitu (konkrétnost, relevance, formát). <strong>3.</strong> Identifikuj slabá místa (příliš obecné? chybí formát?). <strong>4.</strong> Uprav a verzuj. Versioning promptů (v1, v2…) pomáhá porovnávat a vrátit se zpět. Iterace je normální součást práce.</p>',
exercises: [
  sortEx("Iterační cyklus", "Seřaď kroky iterace.", { 1: "Testuj (A/B)", 2: "Měř kvalitu", 3: "Identifikuj slabá místa", 4: "Uprav a verzuj" }, ["1", "2", "3", "4"], "Test → měř → najdi slabiny → uprav."),
  mc("A/B test", "Co je A/B testování promptů?", { a: "Porovnání dvou verzí promptu na stejném zadání", b: "Test dvou modelů", c: "Test rychlosti", d: "Test bezpečnosti" }, "a", "A/B = dvě varianty promptu, vyber lepší."),
  tf("Versioning", "Verzování promptů pomáhá vrátit se k lepší verzi.", true, "v1, v2… umožňuje porovnání a návrat.") ]},

{ chapter: 3, sort: 13, title: "Systémové vs. uživatelské prompty", slug: "3-5-system-user-prompt", duration: 15, xp: 35,
content: '<p>LLM API rozlišuje <strong>system message</strong> (trvalé chování modelu – role, pravidla, tón) a <strong>user message</strong> (konkrétní dotaz). Systémový prompt nastavuje „osobnost\" modelu pro celou konverzaci. <strong>Metaprompting</strong> = prompt, který píše další prompt. Systémový prompt má hranice – model ho může být vyzván ignorovat (prompt injection), proto do něj nepatří tajná data.</p>',
exercises: [
  mc("System message", "Co nastavuje system message?", { a: "Trvalé chování a roli modelu", b: "Jednorázový dotaz", c: "Formát odpovědi", d: "Cenu volání" }, "a", "System = chování modelu napříč konverzací."),
  matchEx("Typy zpráv", "Spáruj typ s rolí.", { 1: ["System message", "Nastaví chování modelu"], 2: ["User message", "Konkrétní dotaz"], 3: ["Metaprompting", "Prompt píšící prompt"] }, "System = role, user = dotaz."),
  tf("Prompt injection", "Do systémového promptu je bezpečné dávat tajná data.", false, "Systémový prompt lze obcházet (prompt injection) – žádná tajná data.") ]},

{ chapter: 3, sort: 14, title: "Promptování pro sumarizaci", slug: "3-6-sumarizace", duration: 15, xp: 35,
content: '<p>Sumarizace: hlídej <strong>délku výstupu</strong> („max 3 věty\", „TL;DR\"), <strong>zachování klíčových faktů</strong>, <strong>přizpůsobení publiku</strong> (děti vs. odborníci) a <strong>strukturu</strong> (odrážky, tabulka). Špatně: „Shrni to.\" Správně: „Shrni následující článek do 3 odrážek pro laika, zachovej klíčová čísla.\"</p>',
exercises: [
  mc("Kvalitní sumarizace", "Který prompt je nejlepší pro sumarizaci?", { a: "Shrni to", b: "Shrni článek do 3 odrážek pro laika, zachovej klíčová čísla", c: "Sumarizace", d: "Krátké shrnutí" }, "b", "Konkrétní délka, publikum a zachování faktů."),
  matchEx("Aspekty sumarizace", "Spáruj aspekt s otázkou.", { 1: ["Délka", "Max 3 věty / TL;DR"], 2: ["Fakta", "Zachovat klíčová čísla"], 3: ["Publikum", "Děti vs. odborníci"], 4: ["Struktura", "Odrážky / tabulka"] }, "Sumarizace = délka + fakta + publikum + struktura."),
  tf("Délka výstupu", "Délku sumarizace lze řídit promptem (max N vět).", true, "„Max 3 věty\" omezí délku.") ]},

{ chapter: 3, sort: 15, title: "Promptování pro tvorbu obsahu", slug: "3-7-tvorba-obsahu", duration: 15, xp: 35,
content: '<p>Tvorba obsahu (články, e-maily, příspěvky): specifikuj <strong>styl</strong> (formální/přátelský), <strong>délku</strong>, <strong>strukturu</strong> (předmět, oslovení, CTA). Rozlišuj <strong>generování</strong> (nový text) a <strong>redakci</strong> (úprava existujícího). Pro e-mail: „Napiš přátelský e-mail (max 150 slov) klientovi, nabízej slevu, konči výzvou k akci.\"</p>',
exercises: [
  mc("Generování vs redakce", "Jaký je rozdíl mezi generováním a redakcí?", { a: "Generování = nový text, redakce = úprava existujícího", b: "Jsou stejné", c: "Generování je pomalejší", d: "Redakce je dražší" }, "a", "Generování tvoří, redakce upravuje."),
  matchEx("Tvorba e-mailu", "Spáruj prvek e-mailu s popisem.", { 1: ["Předmět", "Stručný a lákavý"], 2: ["Oslovení", "Přátelské, podle publiku"], 3: ["Tělo", "Jasná nabídka"], 4: ["CTA", "Výzva k akci"] }, "Dobrý e-mail má předmět, oslovení, tělo, CTA."),
  tf("Styl a délka", "U tvorby obsahu je důležité specifikovat styl i délku.", true, "Styl a délka řídí tón a rozsah.") ]},

{ chapter: 3, sort: 16, title: "Promptování pro kód", slug: "3-8-kod", duration: 15, xp: 35,
content: '<p>Pro kód specifikuj: <strong>jazyk/verzi</strong> (Python 3.12), <strong>knihovny</strong>, <strong>očekávaný výstup</strong>, <strong>testování</strong> a <strong>bezpečnost</strong> (ochrana před SQL injection, XSS). Špatně: „Napiš funkci.\" Správně: „Napiš v Pythonu 3.12 funkci validate_email(email) vracející bool, použij re, přidej 3 testovací případy.\"</p>',
exercises: [
  codeEx("Specifikace kódu", "Napiš funkci podle zadání (Python).", "python", "# Napiš funkci validate_email(email) -> bool pomoci knihovny re", ["def", "validate_email", "re", "return"], "Funkce s re a return podle specifikace."),
  mc("Bezpečnost kódu", "Co by měl prompt pro kód zmínit kvůli bezpečnosti?", { a: "Ochranu před SQL injection / XSS", b: "Barvu syntaxe", c: "Velikost písma", d: "Jméno souboru" }, "a", "Bezpečnostní aspekty jsou při kódu klíčové."),
  sortEx("Specifikace kódu", "Seřař prvky kvalitního promptu pro kód.", { 1: "Jazyk/verze", 2: "Knihovny", 3: "Očekávaný výstup", 4: "Testy" }, ["1", "2", "3", "4"], "Jazyk → knihovny → výstup → testy.") ]},

{ chapter: 3, sort: 17, title: "Promptování pro analýzu dat", slug: "3-9-analyza-dat", duration: 15, xp: 35,
content: '<p>Analýza dat: specifikuj <strong>formát dat</strong> (CSV, JSON), <strong>statistické metriky</strong> (průměr, medián, korelace), <strong>vizualizaci</strong> (matplotlib, Chart.js) a <strong>hypotézy</strong>. Důležité je data-driven rozhodování – model nenavrhne strategii bez kontextu cílů. „Analyzuj prodej v JSON, spočti měsíční nárůst v %, navrhni Chart.js sloupcový graf.\"</p>',
exercises: [
  mc("Formát dat", "Který formát je strukturovaný pro analýzu?", { a: "JSON / CSV", b: "PNG", c: "PDF", d: "DOCX" }, "a", "JSON a CSV jsou strukturované formáty."),
  matchEx("Analýza dat", "Spáruj prvek analýzy s popisem.", { 1: ["Formát dat", "CSV / JSON"], 2: ["Metriky", "Průměr, korelace"], 3: ["Vizualizace", "Chart.js / matplotlib"], 4: ["Hypotézy", "Co ověřujeme"] }, "Analýza = formát + metriky + vizualizace + hypotézy."),
  tf("Kontext cílů", "Pro data-driven rozhodnutí je nutný kontext cílů.", true, "Bez cílů model navrhne jen obecné kroky.") ]},

{ chapter: 3, sort: 18, title: "Promptování pro kreativní úkoly", slug: "3-10-kreativni", duration: 20, xp: 40,
content: '<p>Kreativní úkoly (básně, příběhy, scénáře): specifikuj <strong>žánr</strong>, <strong>tón</strong>, <strong>postavy</strong>, <strong>prostředí</strong>, <strong>délku</strong>. Kombinování žánrů dává originální výstupy (sci-fi detektivka). Omezení („150 slov, bez klišé\") paradoxně zvyšují kreativitu. „Napiš krátký příběh (200 slov) – noir detektiv na vesmírné stanici, tón melancholický, překvapivý konec.\"</p>',
exercises: [
  mc("Omezení a kreativita", "Jak omezení v kreativním promptu působí?", { a: "Paradoxně zvyšují kreativitu", b: "Brzdí kreativitu", c: "Ignorují se", d: "Zkracují výstup" }, "a", "Omezení vedou k originálnějším výstupům."),
  matchEx("Kreativní prvky", "Spáruj prvek s popisem.", { 1: ["Žánr", "Sci-fi detektivka"], 2: ["Tón", "Melancholický"], 3: ["Prostředí", "Vesmírná stanice"], 4: ["Délka", "200 slov"] }, "Specifikace žánru, tónu, prostředí a délky."),
  sortEx("Kreativní brief", "Seřař prvky kreativního zadání.", { 1: "Žánr", 2: "Tón", 3: "Postavy/prostředí", 4: "Délka" }, ["1", "2", "3", "4"], "Žánr → tón → postavy → délka.") ]},

{ chapter: 3, sort: 19, title: "Promptování pro překlady a lokalizaci", slug: "3-11-preklady", duration: 15, xp: 35,
content: '<p>Překlad s AI: specifikuj <strong>kontext</strong> (technický vs. marketingový), <strong>kulturní adaptaci</strong> (idiomy, měny, formáty data), <strong>terminologickou konzistenci</strong> (glosář) a <strong>gender-neutrální jazyk</strong>. Doslovný překlad idiomatických výrazů selhává.</p>',
exercises: [
  mc("Kulturní adaptace", "Jak přeložit idiom „it’s raining cats and dogs\"?", { a: "Doslovně: „prší kočky a psi\"", b: "Adaptovat: „lije jako z konve\"", c: "Vyhodit", d: "Ponechat anglicky" }, "b", "Idiomy se adaptují, nepřekládají doslova."),
  matchEx("Překladatelské aspekty", "Spáruj aspekt s popisem.", { 1: ["Kontext", "Technický vs. marketingový tón"], 2: ["Kulturní adaptace", "Idiomy, měny, formáty"], 3: ["Terminologie", "Glosář pro konzistenci"], 4: ["Gender-neutrální jazyk", "Vyhnout se stereotypům"] }, "Překlad = kontext + kultura + terminologie + inkluzivita."),
  tf("Doslovný překlad", "Doslovný překlad idiomatických výrazů funguje dobře.", false, "Idiomy je třeba kulturně adaptovat.") ]},

{ chapter: 3, sort: 20, title: "Pokročilé techniky", slug: "3-12-pokrocile-techniky", duration: 25, xp: 45,
content: '<p>Pokročilé techniky: <strong>ReAct</strong> (Reasoning + Acting – model uvažuje a volá nástroje střídavě). <strong>Self-Consistency</strong> (více odpovědí + hlasování). <strong>Reflexe</strong> (model kritizuje vlastní výstup a opraví ho). <strong>APE</strong> – model sám navrhne lepší prompt.</p>',
exercises: [
  mc("Co je ReAct?", "Co znamená ReAct u LLM?", { a: "Reasoning + Acting – střídání uvažování a akce/nástrojů", b: "Reakce na chybu", c: "Rychlý režim", d: "Regulace API" }, "a", "ReAct = reasoning + acting střídavě."),
  matchEx("Pokročilé techniky", "Spáruj techniku s popisem.", { 1: ["ReAct", "Reasoning + Acting"], 2: ["Self-Consistency", "Více odpovědí + hlasování"], 3: ["Reflexe", "Model kritizuje a opraví vlastní výstup"], 4: ["APE", "Model navrhne lepší prompt"] }, "ReAct, Self-Consistency, Reflexe, APE."),
  sortEx("Self-Consistency flow", "Seřaď kroky self-consistency.", { 1: "Vygeneruj N odpovědí", 2: "Shromáždi", 3: "Odhlasuj většinovou", 4: "Vrať finální" }, ["1", "2", "3", "4"], "Generuj → shromáždi → odhlasuj → vrať.") ]},

{ chapter: 4, sort: 21, title: "AI v kancelářských nástrojích", slug: "4-1-kancelar", duration: 20, xp: 40,
content: '<p>AI v kancelářských nástrojích: <strong>Microsoft Copilot</strong> (Word, Excel, PowerPoint) – sumarizace, generování vzorce, draft prezentace. <strong>Google Workspace AI</strong> – Smart Compose, sumarizace vláken. <strong>Notion AI</strong> – psaní a úpravy.</p>',
exercises: [
  mc("Copilot úkon", "Co umí Microsoft Copilot v Excelu?", { a: "Generovat vzorce a analyzovat data", b: "Pouze formátovat buňky", c: "Tisknout", d: "Mazat soubory" }, "a", "Copilot generuje vzorce a analyzuje data."),
  matchEx("Nástroje a funkce", "Spáruj nástroj s funkcí.", { 1: ["Word Copilot", "Sumarizace a přepis dokumentu"], 2: ["Excel Copilot", "Generování vzorců a grafů"], 3: ["PowerPoint Copilot", "Draft slidů z textu"], 4: ["Notion AI", "Psaní a úpravy textu"] }, "AI v kanceláři: text, data, prezentace, poznámky."),
  tf("Workspace AI", "Google Workspace AI nabízí Smart Compose a sumarizaci vláken.", true, "Smart Compose doplňuje text, sumarizace zhušťuje vlákna.") ]},

{ chapter: 4, sort: 22, title: "AI pro prezentace a vizuální obsah", slug: "4-2-prezentace", duration: 20, xp: 40,
content: '<p>AI prezentace: <strong>Gamma.app, Canva Magic Design, Beautiful.ai</strong> – generují slidy z textu. AI obrázky (DALL-E, Midjourney). Zadat téma, tón, publikum a počet slidů.</p>',
exercises: [
  mc("Gamma.app", "Co umí Gamma.app?", { a: "Generovat slidy z textového zadání", b: "Pouze převod PDF", c: "Videohovory", d: "E-mail" }, "a", "Gamma generuje slidy z textu."),
  matchEx("Vizuální AI", "Spáruj nástroj s funkcí.", { 1: ["Gamma.app", "Slidy z textu"], 2: ["Canva Magic Design", "Návrh z popisu"], 3: ["DALL-E", "AI obrázek do slide"], 4: ["Beautiful.ai", "Auto-layout prezentace"] }, "Generování slidů, návrh, obrázky, layout."),
  tf("Zadání prezentace", "Pro AI prezentaci stačí zadat jen téma.", false, "Téma, tón, publikum i počet slidů zlepšují výsledek.") ]},

{ chapter: 4, sort: 23, title: "AI pro komunikaci a e-maily", slug: "4-3-emaily", duration: 20, xp: 40,
content: '<p>AI v komunikaci: <strong>Smart Compose</strong>, <strong>sumarizace vláken</strong>, <strong>generování odpovědí</strong> s tone adjustment, <strong>překlad v reálném čase</strong>.</p>',
exercises: [
  mc("Tone adjustment", "Co znamená tone adjustment u e-mailu?", { a: "Změna tónu (formální/přátelský) podle potřeby", b: "Změna barvy", c: "Změna písma", d: "Změna jazyka" }, "a", "Tone adjustment upravuje tón zprávy."),
  matchEx("E-mail AI funkce", "Spáruj funkci s popisem.", { 1: ["Smart Compose", "Doplňování textu"], 2: ["Sumarizace vláken", "Zhuštění korespondence"], 3: ["Generování odpovědi", "S tone adjustment"], 4: ["Překlad real-time", "Překlad v reálném čase"] }, "AI v e-mailu: doplň, zhušťuj, odpovídej, překládej."),
  tf("Sumarizace vláken", "AI umí zhušťovat dlouhá e-mailová vlákna.", true, "Sumarizace vláken šetří čas čtení.") ]},

{ chapter: 4, sort: 24, title: "AI pro výzkum a studium", slug: "4-4-vyzkum", duration: 20, xp: 40,
content: '<p>Výzkumné AI: <strong>Perplexity.ai</strong> (AI vyhledávání s citacemi), <strong>Elicit.org</strong> (analýza studií), <strong>Consensus</strong> (odpovědi z recenzovaných zdrojů), <strong>Scholarcy</strong> (sumarizace článků). Klíčové: syntéza zdrojů a ověřování (fact-check).</p>',
exercises: [
  mc("Perplexity", "Co dělá Perplexity.ai?", { a: "AI vyhledávání s citacemi", b: "Pouze novinky", c: "E-shop", d: "Video" }, "a", "Perplexity = AI vyhledávání s odkazy na zdroje."),
  matchEx("Výzkumné nástroje", "Spáruj nástroj s funkcí.", { 1: ["Perplexity.ai", "AI vyhledávání s citacemi"], 2: ["Elicit.org", "Analýza studií"], 3: ["Consensus", "Odpovědi z recenzovaných zdrojů"], 4: ["Scholarcy", "Sumarizace článků"] }, "Výzkumné AI: hledání, analýza, odpovědi, sumarizace."),
  tf("Ověřování zdrojů", "Při výzkumu s AI je nutné ověřovat zdroje (fact-check).", true, "AI může halucinovat zdroje – ověřuj.") ]},

{ chapter: 4, sort: 25, title: "AI agenty a automatizace", slug: "4-5-agenty", duration: 25, xp: 45,
content: '<p>AI agenti: <strong>Zapier AI, Make (Integromat), n8n, Relevance AI</strong> – agenti, kteří plní více kroků samostatně. Rozdíl: <em>simple prompt</em> = jeden dotaz, <em>agent</em> = vícekrokový tok s rozhodováním a nástroji.</p>',
exercises: [
  mc("Prompt vs agent", "Jaký je rozdíl mezi promptem a agentem?", { a: "Prompt = jeden dotaz, agent = vícekrokový tok s rozhodováním", b: "Jsou stejné", c: "Agent je pomalejší", d: "Prompt je složitější" }, "a", "Agent = více kroků + rozhodování + nástroje."),
  matchEx("Workflow nástroje", "Spáruj nástroj s typem.", { 1: ["Zapier AI", "Integrace + AI kroky"], 2: ["Make (Integromat)", "Vizuální workflow"], 3: ["n8n", "Open-source self-host workflow"], 4: ["Relevance AI", "AI agenti jako služba"] }, "Agenta a automatizační platformy."),
  sortEx("Agent workflow", "Seřař kroky e-mail agenta.", { 1: "Načti e-mail", 2: "Extrahuj data", 3: "Vlož do tabulky", 4: "Odešli notifikaci" }, ["1", "2", "3", "4"], "Načti → extrahuj → vlož → notifikuj.") ]},

{ chapter: 4, sort: 26, title: "Nástroje pro integraci AI (API, playgroundy)", slug: "4-6-api-tools", duration: 20, xp: 40,
content: '<p>Integrační nástroje: <strong>OpenAI Playground, Anthropic Console, Google AI Studio</strong>. Nastavitelné: <em>temperature</em> (kreativita 0–2), <em>max_tokens</em>, <em>system prompt</em>. API klíče, billing, rate limiting.</p>',
exercises: [
  matchEx("API parametry", "Spáruj parametr s významem.", { 1: ["temperature", "Kreativita 0–2"], 2: ["max_tokens", "Max. délka odpovědi"], 3: ["system prompt", "Chování modelu"], 4: ["API key", "Autentizace"] }, "API parametry ovlivňují výstup."),
  mc("Temperature", "Co určuje temperature u LLM?", { a: "Kreativitu/náhodnost výstupu (0–2)", b: "Rychlost", c: "Cenu", d: "Jazyk" }, "a", "Vyšší temperature = kreativnější, méně deterministické."),
  sortEx("API setup", "Seřař kroky pro práci s API.", { 1: "Získej API klíč", 2: "Nastav parametry", 3: "Pošli request", 4: "Zpracuj odpověď" }, ["1", "2", "3", "4"], "Klíč → parametry → request → odpověď.") ]},

{ chapter: 5, sort: 27, title: "Práce s API OpenAI / Anthropic", slug: "5-1-prace-api", duration: 20, xp: 40,
content: '<p>LLM API: <strong>REST</strong> přes HTTPS, JSON tělo, autentizace <em>Bearer token</em>. HTTP metody (POST pro chat completions). Error handling (429 rate limit, 500). Rate limiting.</p>',
exercises: [
  matchEx("HTTP a API", "Spáruj pojem s popisem.", { 1: ["REST", "Architektura přes HTTP"], 2: ["Bearer token", "Autentizace"], 3: ["POST", "Metoda pro odeslání dat"], 4: ["429", "Rate limit překročen"] }, "REST API základy."),
  mc("Autentizace", "Jak se autentizuje API request?", { a: "Bearer token v hlavičce Authorization", b: "Heslo v URL", c: "Cookie", d: "Bez autentizace" }, "a", "Bearer token v Authorization hlavičce."),
  sortEx("Error handling", "Seřař reakci na chybu API.", { 1: "Zachyť chybu", 2: "Ověř status kód", 3: "Retry s backoff", 4: "Zaloguj" }, ["1", "2", "3", "4"], "Zachyť → ověř → retry → log.") ]},

{ chapter: 5, sort: 28, title: "Vytvoření vlastního chatbota", slug: "5-2-chatbot", duration: 20, xp: 40,
content: '<p>No-code chatbot platformy: <strong>Voiceflow, Botpress, Stack AI</strong>. Postup: definuj <strong>personu</strong>, <strong>konverzační tok</strong>, <strong>fallback</strong> (když nerozumí). Testuj na reálných dotazech.</p>',
exercises: [
  mc("Fallback strategie", "Co je fallback u chatbota?", { a: "Co dělá bot, když nerozumí (předání člověku/FAQ)", b: "Rychlost bota", c: "Barva", d: "Cena" }, "a", "Fallback = řešení, když bot neví."),
  matchEx("Bot design", "Spáruj prvek s popisem.", { 1: ["Persona", "Kdo je bot, jaký tón"], 2: ["Konverzační tok", "Pozdrav → potřeba → řešení"], 3: ["Fallback", "Předání člověku/FAQ"], 4: ["Testování", "Reálné dotazy"] }, "Persona, tok, fallback, testování."),
  sortEx("Konverzační tok", "Seřař typický tok chatbota.", { 1: "Pozdrav", 2: "Zjisti potřebu", 3: "Nabídni řešení", 4: "Uzavři/předej" }, ["1", "2", "3", "4"], "Pozdrav → potřeba → řešení → uzavření."),
  sim("Simulace chatbota", "Vyzkoušej chat s e-shop botem.", "Jsi přátelský bot e-shopu s elektronikou.", "Doporuč zákazníkovi produkt.", 5, [
    { trigger: "ahoj", response: "Dobrý den! Hledáte notebook, telefon nebo příslušenství?", isWin: false },
    { trigger: "notebook", response: "Doporučuji model X. Chcete slevu?", isWin: true },
    { trigger: "slevu", response: "Skvělé, doporučuji model X se slevou 10 %.", isWin: true } ], "Dovedl jsi zákazníka k doporučení.", 35) ]},

{ chapter: 5, sort: 29, title: "Úvod do RAG", slug: "5-3-rag", duration: 25, xp: 45,
content: '<p>RAG řeší <strong>knowledge cutoff</strong>. Postup: <strong>1.</strong> Rozděl dokumenty na chunky. <strong>2.</strong> Vytvoř embeddingy a ulož do vektorové DB (Pinecone, Chroma). <strong>3.</strong> Při dotazu najdi relevantní chunky (retrieval). <strong>4.</strong> Přidej do promptu (augmentation) a generuj odpověď.</p>',
exercises: [
  sortEx("RAG pipeline", "Seřař kroky RAG.", { 1: "Chunking dokumentů", 2: "Embeddingy do vektorové DB", 3: "Retrieval relevantních chunků", 4: "Augmentation + generace" }, ["1", "2", "3", "4"], "Chunk → embedding → retrieval → augment."),
  mc("Proč RAG?", "Jaký problém RAG řeší?", { a: "Knowledge cutoff – model nezná vaše data", b: "Pomalý model", c: "Drahé API", d: "Barva" }, "a", "RAG přidá aktuální znalost z vašich zdrojů."),
  matchEx("RAG komponenty", "Spáruj komponentu s rolí.", { 1: ["Vektorová DB", "Uložení embeddingů (Pinecone, Chroma)"], 2: ["Chunking", "Rozdělení dokumentů"], 3: ["Embeddingy", "Vektorové reprezentace"], 4: ["Retrieval", "Hledání relevantních chunků"] }, "Vektor DB, chunking, embeddingy, retrieval."),
  tf("RAG výhoda", "RAG dává ověřitelné odpovědi z vašich zdrojů.", true, "Odpovědi jsou založeny na načtených chunků.") ]},

{ chapter: 5, sort: 30, title: "Principy fine-tuningu", slug: "5-4-finetuning", duration: 25, xp: 45,
content: '<p>Fine-tuning dolutuje model na vaše data. <strong>Kdy</strong>: hodně příkladů a konsistentní styl/úkol. <strong>Kdy ne</strong>: RAG je levnější pro znalosti. Dataset ve <em>JSONL</em>. Pozor na <strong>overfitting</strong> (moc epochs) a <strong>underfitting</strong>. Hyperparametry: <em>learning rate</em>, <em>epochs</em>.</p>',
exercises: [
  mc("Fine-tuning vs RAG", "Kdy preferovat fine-tuning před RAG?", { a: "Mám hodně příkladů a chci konzistentní styl/úkol", b: "Vždy", c: "Nikdy", d: "Pro jednorázový dotaz" }, "a", "Fine-tuning pro styl/úkol s mnoha příklady; RAG pro znalosti."),
  matchEx("Fine-tuning pojmy", "Spáruj pojem s významem.", { 1: ["JSONL", "Formát datasetu"], 2: ["Overfitting", "Příliš mnoho epochs"], 3: ["Learning rate", "Velikost kroku učení"], 4: ["Epochs", "Počet průchodů daty"] }, "Dataset, overfitting, learning rate, epochs."),
  tf("Overfitting", "Příliš mnoho epochs může vést k overfittingu.", true, "Model se naučí data nazpaměť a ztratí generalizaci.") ]},

{ chapter: 5, sort: 31, title: "Budoucnost AI a aktuální trendy", slug: "5-5-budoucnost", duration: 20, xp: 45,
content: '<p>Trendy 2026: <strong>AI agenti</strong> (AutoGPT, Devin), <strong>reasoning modely</strong> (o-řada), <strong>AI ve fyzickém světě</strong> (robotika, self-driving), <strong>multimodální agenti</strong>. Regulace: <strong>EU AI Act</strong>.</p>',
exercises: [
  mc("Reasoning modely", "Co umožňují reasoning modely (o-řada)?", { a: "Delší, uváženější uvažování před odpovědí", b: "Rychlejší odpovědi", c: "Nižší cenu", d: "Pouze obrázky" }, "a", "Reasoning modely přemýšlejí déle pro lepší výsledek."),
  matchEx("Trendy a regulace", "Spáruj pojem s popisem.", { 1: ["AI agenti", "Samostatně plní úkoly (AutoGPT, Devin)"], 2: ["Reasoning modely", "Důkladnější uvažování"], 3: ["EU AI Act", "Klasifikace AI podle rizika"], 4: ["Robotika", "AI ve fyzickém světě"] }, "Agenti, reasoning, regulace, robotika."),
  tf("EU AI Act", "EU AI Act klasifikuje AI systémy podle rizika.", true, "Rizikové třídy určují povinnosti.") ]},

{ chapter: 5, sort: 32, title: "Lokální modely a soukromí", slug: "5-6-lokalni-modely", duration: 20, xp: 45,
content: '<p>Lokální modely: <strong>Ollama, LM Studio, GPT4All</strong> – inference na vlastním stroji, data neopouští zařízení. <strong>Kvantizace</strong> (4/8-bit) zmenší model. Kdy: citlivá data, offline. Hardware: GPU s dostatečnou VRAM.</p>',
exercises: [
  mc("Lokální vs cloud", "Kdy preferovat lokální model?", { a: "Citlivá data vyžadující soukromí/offline", b: "Vždy", c: "Pro nejvyšší kvalitu za každou cenu", d: "Pro nejnovější model" }, "a", "Lokální pro soukromí a offline."),
  matchEx("Lokální AI", "Spáruj pojem s významem.", { 1: ["Ollama", "Lokální inference modelů"], 2: ["Kvantizace", "Zmenšení modelu (4/8-bit)"], 3: ["GPT4All", "Lokální běh na běžném PC"], 4: ["VRAM", "Paměť GPU pro model"] }, "Ollama, kvantizace, GPT4All, VRAM."),
  tf("Kvantizace", "Kvantizace zmenší model na úkor mírné ztráty kvality.", true, "4/8-bit zmenší model, mírně sníží kvalitu.") ]},

{ chapter: 6, sort: 33, title: "AI gramotnost – kritické myšlení", slug: "6-1-kriticke-myjsleni", duration: 20, xp: 45,
content: '<p>Kritické myšlení: <strong>ověřuj informace</strong> (AI halucinuje), <strong>rozpoznávej bias</strong>, <strong>deepfakes</strong>, <strong>média literacy</strong>. Metoda <strong>SIFT</strong>: Stop, Investigate, Find, Trace. <strong>Lateral reading</strong> – ověřuj mimo zdroj.</p>',
exercises: [
  sortEx("SIFT metoda", "Seřař kroky SIFT.", { s: "Stop (zastav se)", i: "Investigate (prověř zdroj)", f: "Find (najdi lepší zdroj)", t: "Trace (dohledej originál)" }, ["s", "i", "f", "t"], "Stop → Investigate → Find → Trace."),
  mc("Deepfake detekce", "Jak rozpoznat deepfake?", { a: "Ověř zdroj, hledej nesrovnalosti, použij detektor", b: "Věř všemu", c: "Podle barvy", d: "Podle délky" }, "a", "Ověření zdroje a detektor deepfake."),
  tf("Lateral reading", "Lateral reading znamená ověřovat informace mimo původní stránku.", true, "Kontroluj jinde, ne jen na zdroji samotném.") ]},

{ chapter: 6, sort: 34, title: "Projekt: Navrhni prompt pro konkrétní úlohu", slug: "6-2-projekt-prompt", duration: 30, xp: 45,
content: '<p>Komplexní projekt: „Vytvoř marketingovou strategii pro lokální kavárnu.\" Postup: rozeber zadání → iteruj prompt (kontext, formát, omezení) → peer review → dokumentuj verze.</p>',
exercises: [
  sortEx("Projektový postup", "Seřař kroky projektu.", { 1: "Rozeber zadání", 2: "Iteruj prompt", 3: "Peer review", 4: "Dokumentuj" }, ["1", "2", "3", "4"], "Zadání → iteruj → review → dokumentuj."),
  mc("Peer review", "Co znamená peer review promptu?", { a: "Nechat přezkoumat od kolegy/AI", b: "Smaže prompt", c: "Změní jazyk", d: "Zvýší cenu" }, "a", "Peer review = nezávislé zhodnocení."),
  open("Marketingový prompt", "Napiš prompt pro marketingovou strategii kavárny (role, kontext, úkol, formát).", ["kavárna", "marketing", "strategie", "role", "formát"], "Dobrý projektový prompt má roli, kontext, úkol i formát.") ]},

{ chapter: 6, sort: 35, title: "Projekt: Postav si vlastní AI workflow", slug: "6-3-projekt-workflow", duration: 45, xp: 60,
content: '<p>Projekt: propoj 3+ nástroje do funkčního řešení (např. e-mail → AI extrakce → Notion → notifikace). Postup: sběr požadavků → architektura → testování → dokumentace.</p>',
exercises: [
  sortEx("Workflow postup", "Seřař fáze návrhu workflow.", { 1: "Sběr požadavků", 2: "Architektura (nástroje)", 3: "Testování", 4: "Dokumentace" }, ["1", "2", "3", "4"], "Požadavky → architektura → test → dokumentace."),
  mc("Požadavky", "Co je součástí sběru požadavků?", { a: "Vstupy a výstupy workflow", b: "Barva tlačítek", c: "Jméno souboru", d: "Cena domény" }, "a", "Vstupy a výstupy jsou jádrem požadavků."),
  open("Návrh workflow", "Popiš AI workflow propojující 3 nástroje (vstupy, AI krok, výstupy).", ["nástroj", "vstup", "výstup", "workflow", "AI"], "Workflow má vstupy, AI krok a výstupy.") ]},

{ chapter: 6, sort: 36, title: "Závěrečný test / reflexe", slug: "6-4-zaver", duration: 30, xp: 60,
content: '<p>Závěrečný test pokrývá všechny kapitoly. Osobní plán rozvoje: další kroky (API hlouběji, RAG projekt, agenti). Reflexe: které koncepty byly nejužitečnější, kde aplikovat AI v praxi.</p>',
exercises: [
  mc("Osobní plán", "Co patří do osobního plánu rozvoje po kurzu?", { a: "Konkrétní další kroky (API, RAG projekt, agenti)", b: "Nic", c: "Jen teorie", d: "Pouze opakování" }, "a", "Plán = konkrétní další kroky v praxi."),
  matchEx("Konzolidace znalostí", "Spáruj oblast s dalším krokem.", { 1: ["API", "Hlubší práce s OpenAI/Anthropic API"], 2: ["RAG", "Vlastní RAG projekt"], 3: ["Agenti", "Vícekrokový agent"], 4: ["Reflexe", "Kde aplikovat AI v praxi"] }, "API, RAG, agenti, reflexe."),
  tf("Závěr", "Cílem závěrečného testu je konsolidovat znalosti z celého kurzu.", true, "Test prověřuje všechny kapitoly a nastaví další kroky.") ]},

];

// ── No-DB fallback builders (port of contentData() + content*() helpers) ──

type GramData = {
  course: Record<string, unknown>;
  lessonsBySlug: Map<string, Record<string, unknown>>;
  lessonById: Map<number, Record<string, unknown>>;
  exById: Map<number, Record<string, unknown>>;
};

let dataCs: GramData | null = null;
let dataEn: GramData | null = null;

function lessonDescription(content: string): string {
  return phpStripTags(phpMbSubstr(content, 0, 160)).trim();
}

/** The en overlay only exists for `en`; every other locale falls back to cs. */
function gramotnostContentLang(lang: string): GramLang {
  return lang === "en" ? "en" : "cs";
}

function buildData(lang: GramLang): GramData {
  const chaptersMeta = lang === "en" ? CHAPTERS_EN : CHAPTERS_CS;
  const courseMeta = lang === "en" ? COURSE_META_EN : COURSE_META_CS;
  const course: Record<string, unknown> = {
    id: 1, slug: "ai-gramotnost",
    title: courseMeta.title, description: courseMeta.description,
    icon: "brain", color: "#10B981", estimated_hours: 20, difficulty: "beginner", total_xp: 0,
  };
  const chapters = new Map<number, Record<string, unknown>>();
  const lessonsBySlug = new Map<string, Record<string, unknown>>();
  const lessonById = new Map<number, Record<string, unknown>>();
  const exById = new Map<number, Record<string, unknown>>();
  let lessonId = 100;
  let exId = 1000;
  for (const row of LESSONS) {
    const { chapter, sort, title, slug, duration, xp, content, exercises } = row;
    if (!chapters.has(chapter)) {
      chapters.set(chapter, {
        id: chapter, course_id: 1, sort_order: chapter,
        title: chaptersMeta[chapter][0], description: chaptersMeta[chapter][1], lessons: [],
      });
    }
    const lesson: Record<string, unknown> = {
      id: lessonId, chapter_id: chapter, sort_order: sort, title, slug,
      description: lessonDescription(content), content, duration, xp,
      chapter_title: chaptersMeta[chapter][0],
    };
    lessonsBySlug.set(slug, lesson);
    lessonById.set(lessonId, lesson);
    (chapters.get(chapter)!.lessons as unknown[]).push(lesson);
    course.total_xp = (course.total_xp as number) + xp;
    exercises.forEach((ex, i) => {
      exById.set(exId, {
        id: exId, lesson_id: lessonId, sort_order: i + 1,
        title: ex.title, type: ex.type, prompt: ex.prompt, config: ex.config,
        correct_answer: ex.correct_answer, explanation: ex.explanation, xp_reward: ex.xp,
      });
      exId += 1;
    });
    lessonId += 1;
  }
  course.chapters = [...chapters.values()];
  return { course, lessonsBySlug, lessonById, exById };
}

function gramotnostData(lang: GramLang): GramData {
  if (lang === "en") {
    if (dataEn === null) dataEn = buildData("en");
    return dataEn;
  }
  if (dataCs === null) dataCs = buildData("cs");
  return dataCs;
}

export function contentCourseMeta(lang: string): Record<string, unknown> {
  const data = gramotnostData(gramotnostContentLang(lang));
  const course = { ...data.course };
  delete course.chapters;
  return course;
}

export function contentCourseDetail(lang: string): Record<string, unknown> {
  const data = gramotnostData(gramotnostContentLang(lang));
  const chapters: unknown[] = [];
  for (const chapter of data.course.chapters as Array<Record<string, unknown>>) {
    const lessons = (chapter.lessons as Array<Record<string, unknown>>).map((lesson) => ({
      id: lesson.id, sort_order: lesson.sort_order, title: lesson.title, slug: lesson.slug,
      description: lesson.description, duration: lesson.duration, xp_reward: lesson.xp_reward,
    }));
    chapters.push({
      id: chapter.id, sort_order: chapter.sort_order, title: chapter.title,
      description: chapter.description, lessons,
    });
  }
  const course = { ...data.course };
  course.chapters = chapters;
  return course;
}

export function contentLesson(lang: string, slug: string): Record<string, unknown> | null {
  const data = gramotnostData(gramotnostContentLang(lang));
  const lesson = data.lessonsBySlug.get(slug);
  if (lesson === undefined) return null;
  const exercises: unknown[] = [];
  for (const ex of data.exById.values()) {
    if (ex.lesson_id === lesson.id) {
      const rest = { ...ex };
      delete rest.correct_answer;
      exercises.push(rest);
    }
  }
  return { ...lesson, exercises };
}

export function contentExercise(id: number): Record<string, unknown> | null {
  // PHP's contentExercise($id) ignores the locale too — exercise ids in the
  // fallback path are cs-canonical (identical in both overlays).
  const data = gramotnostData("cs");
  return data.exById.get(id) ?? null;
}

export function contentExercisesByLesson(lang: string, lessonId: number): unknown[] {
  const data = gramotnostData(gramotnostContentLang(lang));
  const out: unknown[] = [];
  for (const ex of data.exById.values()) {
    if (ex.lesson_id === lessonId) {
      const rest = { ...ex };
      delete rest.correct_answer;
      out.push(rest);
    }
  }
  return out;
}