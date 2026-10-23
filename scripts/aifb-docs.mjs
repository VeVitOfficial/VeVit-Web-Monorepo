// Vygeneruje čitelné přehledy obsahu AIFB do docs/aifb/prehled/ (Markdown a JSON) přímo z obsahových
// souborů, aby dokumentace nezastarala. Spuštění: `npm run docs:aifb`. Ručně psané kapitoly
// (01–10) skript nemění, přepisuje jen soubory ve složce generovano/.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "src/content/aifb");
const outDir = join(root, "docs/aifb/prehled/generovano");
const read = (name) => JSON.parse(readFileSync(join(contentDir, name), "utf8"));

const catalog = read("aifb-catalog.json");
const theory = read("aifb-theory.json");
const course = read("aifb-kurz.json");
const pilots = read("pupil-pilots.json");
const categories = ["zs1", "zs2", "ss"].map((id) => read(`aifb-content-${id}.json`));

const NOTE = "<!-- Vygenerováno skriptem scripts/aifb-docs.mjs (npm run docs:aifb). Needitovat ručně. -->\n\n";
const plain = (text) => String(text).replaceAll(" ", " ");
const words = (value) => {
  if (typeof value === "string") return value.split(/\s+/u).filter(Boolean).length;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + words(item), 0);
  if (value && typeof value === "object") return Object.entries(value).reduce((sum, [key, item]) => (["type", "figure", "id", "tone", "component", "correct", "answer"].includes(key) ? sum : sum + words(item)), 0);
  return 0;
};

function blockMd(block) {
  switch (block.type) {
    case "p": return plain(block.text);
    case "list": {
      const items = block.items.map((item, i) => `${block.ordered ? `${i + 1}.` : "-"} ${plain(item)}`).join("\n");
      return block.title ? `**${block.title}**\n\n${items}` : items;
    }
    case "terms": return block.items.map((item) => `- **${item.term}:** ${plain(item.text)}`).join("\n");
    case "callout": return `> **${block.title}** (${block.tone})\n> ${plain(block.text)}`;
    case "figure": return `*[Ilustrace \`${block.figure}\`]* ${plain(block.caption)}`;
    case "example": return `**${block.title}**\n\n\`\`\`\n${block.text}\n\`\`\``;
    default: return `(neznámý blok ${block.type})`;
  }
}

function theoryMd(doc, level = "###") {
  const parts = [`*${plain(doc.lead)}*`];
  for (const section of doc.sections) parts.push(`${level} ${section.heading} \`#${section.id}\``, ...section.blocks.map(blockMd));
  parts.push(`${level} Shrnutí`, doc.summary.map((item) => `- ${plain(item)}`).join("\n"));
  return parts.join("\n\n");
}

function activityMd(activity) {
  if (!activity) return "";
  const { component, config } = activity;
  const out = [`**Cvičení na stránce: ${component}**`];
  if (component === "QuizCard") {
    for (const [i, q] of config.questions.entries()) {
      out.push(`${i + 1}. ${q.prompt}\n${q.options.map((o) => `   - ${o.id === q.correct ? "✅" : "▫️"} ${o.text}`).join("\n")}\n   - *Vysvětlení:* ${q.explanation}`);
    }
  } else if (component === "CardSort") {
    const pile = Object.fromEntries(config.piles.map((p) => [p.id, p.label]));
    if (config.hint) out.push(`*Nápověda:* ${config.hint}`);
    out.push(config.cards.map((card) => `- ${card.label} → **${pile[config.expected?.[card.id]] ?? "nehodnotí se"}**`).join("\n"));
  } else if (component === "TrafficLightCards") {
    const labels = config.labels ?? { green: "Zelená: můžu říct", red: "Červená: tajemství" };
    out.push(`Tlačítka: zelená „${labels.green}“, červená „${labels.red}“.`);
    out.push(config.situations.map((s) => `- ${s.text} → **${s.answer ? labels[s.answer] : "nehodnotí se"}**${s.feedback ? ` (${s.feedback})` : ""}`).join("\n"));
  } else if (component === "AiSandbox") {
    out.push("```json\n" + JSON.stringify(config, null, 2) + "\n```");
  }
  return out.join("\n\n");
}

// ── teorie.md ──────────────────────────────────────────────
const levelTitles = new Map(categories.flatMap((c) => c.levels.map((l) => [l.id, `${c.category.title} · ${l.code}: ${l.title}`])));
const topicUsers = {};
for (const [levelId, entry] of Object.entries(theory.levels)) (topicUsers[entry.topic] ??= []).push(levelId);
let theoryOut = `${NOTE}# Text teorie AIFB (všechna témata)\n\nStav: **${theory.status}**. ${plain(theory.note)}\n\nSoubor: \`src/content/aifb/aifb-theory.json\`. Celkem ${words(theory.topics) + words(Object.values(theory.levels).map((l) => l.extra ?? []))} slov.\n\n`;
theoryOut += "## Které téma patří ke kterému levelu\n\n| Téma | Slov | Bloky / levely | Sekce navíc |\n|---|---|---|---|\n";
for (const [topic, doc] of Object.entries(theory.topics)) {
  const users = topicUsers[topic] ?? [];
  const extra = users.flatMap((id) => (theory.levels[id].extra ?? []).map((s) => `${id}: ${s.heading}`));
  theoryOut += `| \`${topic}\` | ${words(doc)} | ${users.map((id) => levelTitles.get(id) ?? id).join("<br>")} | ${extra.join("<br>") || "–"} |\n`;
}
const figureUse = {};
const noteFigures = (where, sections) => sections.forEach((section) => section.blocks.filter((b) => b.type === "figure").forEach((b) => (figureUse[b.figure] ??= []).push(`${where}#${section.id}`)));
for (const [topic, doc] of Object.entries(theory.topics)) noteFigures(`téma ${topic}`, doc.sections);
for (const [id, entry] of Object.entries(theory.levels)) noteFigures(id, entry.extra ?? []);
for (const m of course.modules) noteFigures(`kurz ${m.id}`, m.theory.sections);
theoryOut += "\n## Ilustrace a kde se používají (teorie i online kurz)\n\nKomponenty jsou v `src/components/edu/aifb/theory-figures.tsx`, seznam id v `FIGURE_IDS` (`src/lib/edu/aifb/theory.ts`).\n\n| Ilustrace | Použití |\n|---|---|\n";
for (const [figure, uses] of Object.entries(figureUse).sort()) theoryOut += `| \`${figure}\` | ${uses.join("<br>")} |\n`;
for (const [topic, doc] of Object.entries(theory.topics)) {
  theoryOut += `\n---\n\n## Téma \`${topic}\`\n\nPoužívá: ${(topicUsers[topic] ?? []).map((id) => levelTitles.get(id) ?? id).join(", ")}\n\n${theoryMd(doc)}\n`;
  for (const id of topicUsers[topic] ?? []) {
    for (const section of theory.levels[id].extra ?? []) {
      theoryOut += `\n### Jen ${levelTitles.get(id) ?? id}: ${section.heading} \`#${section.id}\`\n\n${section.blocks.map(blockMd).join("\n\n")}\n`;
    }
  }
}

// ── online-kurz.md ─────────────────────────────────────────
const catTitle = Object.fromEntries(catalog.categories.map((c) => [c.id, c.title]));
let courseOut = `${NOTE}# ${course.title}: celý text\n\nStav: **${course.status}**. ${plain(course.note)}\n\nSoubor: \`src/content/aifb/aifb-kurz.json\`. Celkem ${words(course)} slov.\n\n*${plain(course.subtitle)}*\n\n${plain(course.lead)}\n\n**Pro koho:** ${plain(course.audience)}\n\n**Jak kurz funguje**\n\n${course.howItWorks.map((s) => `- ${plain(s)}`).join("\n")}\n\n`;
courseOut += "## Přehled modulů\n\n| Modul | Název | Délka | Vychází z | Teorie (slov) | Lekce |\n|---|---|---|---|---|---|\n";
for (const m of course.modules) courseOut += `| ${m.order} | ${m.title} | ${m.minutes} min | ${m.sources.map((s) => catTitle[s]).join(", ")} | ${words(m.theory)} | ${m.lessons.map((l) => `${l.order}. ${l.title}`).join("<br>")} |\n`;
for (const m of course.modules) {
  courseOut += `\n---\n\n## ${m.code}: ${m.title}\n\n*${m.subtitle}* · ${m.minutes} min · adresa \`/edu/ai-gramotnost/kurz/m${m.order}\`\n\n**Cíle**\n\n${m.goals.map((g) => `- ${plain(g)}`).join("\n")}\n\n### Teorie (\`${m.id}-teorie\`)\n\n${theoryMd(m.theory, "####")}\n`;
  for (const l of m.lessons) {
    courseOut += `\n### Lekce ${l.order}: ${l.title} (\`${l.id}\`, ${l.minutes} min)\n\n${plain(l.intro)}\n\n**Postup**\n\n${l.steps.map((s, i) => `${i + 1}. ${plain(s)}`).join("\n")}\n\n`;
    if (l.activity) courseOut += `${activityMd(l.activity)}\n\n`;
    if (l.tip) courseOut += `> **Tip:** ${plain(l.tip)}\n\n`;
    courseOut += `**Co si odneseš:** ${plain(l.outcome)}\n`;
  }
}

// ── lekce-aifb.md ──────────────────────────────────────────
let lessonsOut = `${NOTE}# Přehled kategorií, levelů a lekcí AIFB\n\nZdroj: \`aifb-content-zs1.json\`, \`aifb-content-zs2.json\`, \`aifb-content-ss.json\` (originály z plánu, nemění se). Teorie je samostatná stránka před lekcemi; lekce 1–5 jsou cvičení z plánu.\n\n`;
for (const c of categories) {
  const meta = c.category;
  lessonsOut += `## ${meta.title} (\`${meta.id}\`)\n\n${meta.subtitle}. ${meta.grades}. Jednotka: ${meta.unit}. Téma vzhledu: \`${meta.theme}\`. Režim: \`${meta.usageMode}\`.\n\n${meta.audience}\n\n`;
  for (const l of c.levels) {
    const slug = l.id.slice(meta.id.length + 1);
    lessonsOut += `### ${l.code}: ${l.title}${l.subtitle ? ` · ${l.subtitle}` : ""}\n\nAdresa \`/edu/ai-gramotnost/aifb/${meta.id}/${slug}\` · rozsah ${l.hours} · teorie: téma \`${theory.levels[l.id]?.topic ?? "–"}\`${l.certification ? ` · certifikace: ${l.certification.name ?? "bez názvu"} (${l.certification.status}, v aplikaci „Připravuje se“)` : ""}\n\n`;
    lessonsOut += "| Lekce | Název | Čas | Co má vzniknout | Interaktivní pilot |\n|---|---|---|---|---|\n";
    for (const lesson of l.lessons) {
      const pilot = pilots.lessons[lesson.id];
      const kind = lesson.type === "theory" ? "Teorie" : `Lekce ${lesson.order}`;
      lessonsOut += `| ${kind} | ${lesson.title} | ${lesson.teacher.time ?? "–"} | ${lesson.type === "exercise" ? plain(lesson.teacher.expectedOutput).replaceAll("|", "/") : "–"} | ${pilot ? `${pilot.component} (${pilot.status})` : "–"} |\n`;
    }
    lessonsOut += "\n**Cíle**\n\n" + l.goals.map((g) => `- ${plain(g)}`).join("\n") + "\n\n";
  }
}

// ── pilotni-cviceni.md ─────────────────────────────────────
let pilotsOut = `${NOTE}# Pilotní interaktivní cvičení (žákovská vrstva)\n\nSoubor: \`src/content/aifb/pupil-pilots.json\`. ${plain(pilots.note)}\n\n`;
for (const [id, layer] of Object.entries(pilots.lessons)) {
  pilotsOut += `## \`${id}\` · ${layer.component} · stav ${layer.status}\n\n${(layer.text ?? []).map(plain).join("\n\n")}\n\n${activityMd({ component: layer.component, config: layer.config })}\n\n`;
  if (layer.reviewNotes?.length) pilotsOut += `**K potvrzení vlastníkem**\n\n${layer.reviewNotes.map((n) => `- ${n}`).join("\n")}\n\n`;
}

// ── struktura.json ─────────────────────────────────────────
const structure = {
  generated: "scripts/aifb-docs.mjs",
  version: catalog.version,
  categories: categories.map((c) => ({
    id: c.category.id,
    title: c.category.title,
    route: `/edu/ai-gramotnost/aifb/${c.category.id}`,
    levels: c.levels.map((l) => ({
      id: l.id,
      code: l.code,
      title: l.title,
      theoryTopic: theory.levels[l.id]?.topic ?? null,
      lessons: l.lessons.map((lesson) => ({ id: lesson.id, type: lesson.type, title: lesson.title, pilot: pilots.lessons[lesson.id]?.component ?? null })),
    })),
  })),
  course: {
    status: course.status,
    route: "/edu/ai-gramotnost/kurz",
    modules: course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      minutes: m.minutes,
      sources: m.sources,
      theorySections: m.theory.sections.map((s) => s.heading),
      lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, minutes: l.minutes, activity: l.activity?.component ?? null })),
    })),
  },
  totals: {
    levels: categories.reduce((n, c) => n + c.levels.length, 0),
    theoryPages: Object.keys(theory.levels).length,
    exercises: categories.reduce((n, c) => n + c.levels.reduce((m, l) => m + l.lessons.filter((x) => x.type === "exercise").length, 0), 0),
    courseModules: course.modules.length,
    courseLessons: course.modules.reduce((n, m) => n + m.lessons.length, 0),
    theoryWords: words(theory.topics) + words(Object.values(theory.levels).map((l) => l.extra ?? [])),
    courseWords: words(course),
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "teorie.md"), theoryOut);
writeFileSync(join(outDir, "online-kurz.md"), courseOut);
writeFileSync(join(outDir, "lekce-aifb.md"), lessonsOut);
writeFileSync(join(outDir, "pilotni-cviceni.md"), pilotsOut);
writeFileSync(join(outDir, "struktura.json"), JSON.stringify(structure, null, 2) + "\n");
console.log(`docs/aifb/prehled/generovano: teorie.md, online-kurz.md, lekce-aifb.md, pilotni-cviceni.md, struktura.json`);
console.log(JSON.stringify(structure.totals));
