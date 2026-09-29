// Všechny texty, které se ve videu zobrazují. Úprava textu = úprava tohoto
// souboru a nový render (npm run render). Oslovení: tykání (jako hero na vevit.cz).
// Delší texty zkontroluj v náhledu (npm run studio), ať se vejdou na řádek.

export const TEXTS = {
  hook: {
    // Tři rychlé střihy (každý ~1 s), pak pointa.
    lines: ["Zmenšit PDF.", "Naučit se Python.", "Sehnat elektrikáře."],
    punch: "Všechno na jednom místě.",
  },
  intro: {
    tag: "VeVit",
    title: "Český digitální ekosystém",
    subtitle: "Nástroje, lekce a služby na jednom místě.",
    emphasis: "Bez reklam.",
  },
  tools: {
    tag: "Tools",
    title: "VeVit Tools",
    subtitle: "107 nástrojů zdarma, bez registrace",
    url: "vevit.cz/tools",
  },
  toolsAction: {
    tag: "Lokálně v prohlížeči",
    title: "Soubory neopouštějí tvůj počítač.",
    subtitle: "PDF, obrázky, video, text, AI i kalkulačky.",
    labels: ["QR generátor", "Komprese PDF", "Generátor hesel"],
  },
  edu: {
    tag: "Edu",
    title: "VeVit Edu",
    subtitle: "18 kurzů programování, 342 lekcí.",
    subtitleRun: "JavaScript si spustíš přímo v lekci.",
    url: "vevit.cz/edu",
  },
  ai: {
    tag: "Edu · AI gramotnost",
    title: "AI gramotnost",
    subtitle: "Od základů po prompt engineering. S certifikátem.",
    url: "vevit.cz/edu/ai-gramotnost",
  },
  services: {
    tag: "Services",
    title: "VeVit Services",
    subtitle: "Šikovní lidé na cokoli – kousek od tebe, nebo na dálku.",
    steps: ["Zadej poptávku zdarma", "Porovnej nabídky", "Ohodnoť spolupráci"],
    note: "Kontakt až po výběru · Hlídací pes na nové poptávky",
    url: "vevit.cz/services",
  },
  account: {
    tag: "Account",
    title: "Jeden účet pro všechno",
    subtitle: "XP a levely napříč aplikacemi · 2FA · 7 jazyků",
    url: "vevit.cz/account",
  },
  space: {
    tag: "Služby VeVit",
    title: "VeVit Software Studios",
    subtitle: "Software na míru. Ceny veřejně, nabídka do 3 dnů.",
    points: ["Weby od 18 000 Kč", "Rezervační a interní systémy", "První konzultace zdarma"],
    url: "vevit.space",
  },
  art: {
    tag: "Služby VeVit",
    title: "VeVit Art",
    subtitle: "Prostor, kde umění roste. Komunita pro začínající umělce.",
    points: [
      { title: "Portfolio zdarma", text: "Vlastní online portfolio bez starostí s technikou." },
      { title: "Komunitní prostor", text: "Discord, kde sdílíme práci a radíme si." },
      { title: "Mentoring", text: "Rady od zkušenějších umělců z komunity." },
    ],
    url: "vevit.art",
  },
  outro: {
    kicker: "Vyzkoušej zdarma",
    url: "vevit.cz",
    apps: ["Tools", "Edu", "Services", "Account"],
    games: "+ 28 her na vevit.fun",
    more: ["vevit.space", "vevit.art"],
    footer: "Bez reklam · Postaveno v ČR",
  },
} as const;
