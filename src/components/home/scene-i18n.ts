// Texty 3D scén a „Připravuje se" stránek. cs + en; ostatní jazyky padají na angličtinu.

import type { AppId, AppStatus } from "./scene-data";

export interface SceneStrings {
  status: Record<AppStatus, string>;
  card: Record<AppId, string>;
  roadmap: Record<AppId, string>;
  open: string;
  lofiOn: string;
  lofiOff: string;
  notify: string;
  drag: string;
  dragBoard: string;
  hint: string;
  done: string;
  target: string;
  doneEdge: string;
  plannedEdge: string;
  roadHint: string;
  progress: string;
  boardTitle: string;
  boardEyebrow: string;
  boardText: string;
  exploreEyebrow: string;
  exploreTitle: string;
  exploreText: string;
  studiosTag: string;
  studiosText: string;
  artTag: string;
  artText: string;
  soon: {
    badge: string;
    soon: string;
    back: string;
    notify: string;
    progress: string;
    bodies: Record<AppId, string>;
    captions: Record<AppId, string>;
    points: Record<AppId, [string, string, string]>;
  };
}

const cs: SceneStrings = {
  status: { beta: "V betě", online: "Online", planned: "V plánu", soon: "Připravujeme" },
  card: {
    account: "Na jednom místě se zaregistruješ a přihlásíš ke svému VeVit účtu. Můžeš použít heslo, Google, GitHub nebo Discord.",
    tools: "Kalkulačky, konvertory, generátory, PDF nástroje, AI pomocníci a dev utility. Nástroje běží lokálně v prohlížeči.",
    games: "28 her k vyzkoušení, včetně Snake, Tetrisu, Pac-Mana a 2048.",
    edu: "300+ lekcí, kvízů a článků. Programování, matematika, jazyky.",
    mail: "E-mailová schránka na adrese @vevit.cz. Přihlášení přes VeVit účet.",
    office: "Kancelářský balík pro dokumenty, tabulky a prezentace. Soubory se ukládají k účtu.",
    services: "Zadej poptávku nebo nabídni vlastní službu. Třeba tvorbu webu, doučování, ilustraci nebo pomoc na zahradě.",
    search: "Univerzální vyhledávač přes celý VeVit ekosystém.",
    store: "Oficiální merch, digitální produkty a Premium plány.",
  },
  roadmap: {
    account: "Registrace a přihlášení jsou v betě. Na XP profil, achievementy, levely a propojení aplikací dál pracujeme.",
    tools: "Kalkulačky, konvertory, generátory, PDF nástroje a dev utility. Běží lokálně v prohlížeči.",
    games: "28 her s XP odměnami, včetně Snake, Tetrisu, Pac-Mana a 2048.",
    edu: "Lekce, kvízy a články o programování, matematice a jazycích. Otevřená beta.",
    mail: "Schránka @vevit.cz napojená na účet. Zatím ve fázi návrhu.",
    office: "Desktopový kancelářský balík. Dokumenty, tabulky a prezentace.",
    services: "Připravujeme tržiště, kde půjde zadat poptávku nebo nabídnout vlastní službu.",
    search: "Jeden vyhledávač napříč všemi 100+ nástroji, hrami, lekcemi a dokumentací. Klávesová zkratka ⌘K kdekoliv v ekosystému.",
    store: "Merch, digitální produkty, e-knihy a kurzy. Premium uživatelé mají 20 % slevu, faktury s DPH automaticky.",
  },
  open: "Otevřít",
  lofiOn: "Pustit lo-fi",
  lofiOff: "Zastavit lo-fi",
  notify: "Upozornit mě",
  drag: "Táhni pro otočení · klikni na aplikaci",
  dragBoard: "Kliknutím aplikaci vybereš, dvojklikem ji otevřeš.",
  hint: "Táhni pro otočení · klikni na sloupec",
  done: "hotovo",
  target: "cíl 100 %",
  doneEdge: "← HOTOVO",
  plannedEdge: "V PLÁNU →",
  roadHint: "Táhni pro otočení · klikni na sloupec",
  progress: "% hotovo",
  boardTitle: "Vyber si aplikaci",
  boardEyebrow: "Propojení",
  boardText: "Account je procesor celé desky a každá aplikace k němu má vlastní linku. Kliknutím aplikaci vybereš, dvojklikem ji otevřeš.",
  exploreEyebrow: "Více než web",
  exploreTitle: "Další projekty VeVit",
  exploreText: "Vedle webových aplikací vyvíjíme software na míru a připravujeme platformu pro umělce.",
  studiosTag: "Software na míru",
  studiosText: "Vyvíjíme webové aplikace, interní systémy a integrace na míru firmám i jednotlivcům.",
  artTag: "Platforma pro umělce",
  artText: "VeVit Art připravujeme pro začínající umělce, kteří chtějí sdílet svou tvorbu.",
  soon: {
    badge: "Připravuje se",
    soon: "Již brzy",
    back: "Zpět na VeVit",
    notify: "Napsat nám",
    progress: "hotovo",
    bodies: {
      account: "",
      tools: "",
      games: "",
      edu: "",
      mail: "Vlastní e-mailová schránka na adrese @vevit.cz, napojená na VeVit účet. Zatím ve fázi návrhu.",
      office: "Desktopový kancelářský balík pro dokumenty, tabulky a prezentace. Soubory se budou ukládat k tvému účtu.",
      services: "Tržiště, kde zadáš poptávku nebo nabídneš vlastní službu. Od tvorby webu po doučování a pomoc na zahradě.",
      search: "Jeden vyhledávač napříč všemi nástroji, hrami, lekcemi a dokumentací. Zkratka ⌘K kdekoliv v ekosystému.",
      store: "Oficiální merch, digitální produkty, e-knihy a kurzy. Premium uživatelé budou mít slevu 20 %.",
    },
    captions: {
      account: "",
      tools: "",
      games: "",
      edu: "",
      mail: "Schránky se právě třídí.",
      office: "Dokument se píše sám. Zatím jen pár řádků.",
      services: "Poptávky a nabídky hledají cestu k sobě.",
      search: "Lupa už něco našla. Čekáme na zbytek.",
      store: "Zboží se balí. Pult ještě není otevřený.",
    },
    points: {
      account: ["", "", ""],
      tools: ["", "", ""],
      games: ["", "", ""],
      edu: ["", "", ""],
      mail: ["Adresa @vevit.cz", "Přihlášení přes VeVit účet", "Bez reklam a sledování"],
      office: ["Dokumenty, tabulky, prezentace", "Soubory uložené u účtu", "Desktopová aplikace"],
      services: ["Zadání poptávky zdarma", "Nabídka vlastních služeb", "Profil a hodnocení"],
      search: ["Nástroje, hry i lekce na jednom místě", "Zkratka ⌘K kdekoliv", "Hledání v dokumentaci"],
      store: ["Merch a digitální produkty", "E-knihy a kurzy", "Sleva 20 % pro Premium"],
    },
  },
};

const en: SceneStrings = {
  status: { beta: "In beta", online: "Live", planned: "Planned", soon: "Coming soon" },
  card: {
    account: "Sign up and sign in to your VeVit account in one place. Use a password, Google, GitHub or Discord.",
    tools: "Calculators, converters, generators, PDF tools, AI helpers and dev utilities. Tools run locally in your browser.",
    games: "28 games to try, including Snake, Tetris, Pac-Man and 2048.",
    edu: "300+ lessons, quizzes and articles. Programming, maths, languages.",
    mail: "A mailbox at @vevit.cz. Sign in with your VeVit account.",
    office: "An office suite for documents, spreadsheets and presentations. Files are stored with your account.",
    services: "Post a request or offer your own service. Web design, tutoring, illustration or help in the garden.",
    search: "A universal search across the whole VeVit ecosystem.",
    store: "Official merch, digital products and Premium plans.",
  },
  roadmap: {
    account: "Sign-up and sign-in are in beta. We are still working on the XP profile, achievements, levels and app linking.",
    tools: "Calculators, converters, generators, PDF tools and dev utilities. They run locally in your browser.",
    games: "28 games with XP rewards, including Snake, Tetris, Pac-Man and 2048.",
    edu: "Lessons, quizzes and articles about programming, maths and languages. Open beta.",
    mail: "A @vevit.cz mailbox linked to your account. Still in the design phase.",
    office: "A desktop office suite. Documents, spreadsheets and presentations.",
    services: "We are preparing a marketplace where you can post a request or offer your own service.",
    search: "One search across all 100+ tools, games, lessons and docs. Keyboard shortcut ⌘K anywhere in the ecosystem.",
    store: "Merch, digital products, e-books and courses. Premium users get 20 % off, invoices with VAT automatically.",
  },
  open: "Open",
  lofiOn: "Play lo-fi",
  lofiOff: "Stop lo-fi",
  notify: "Notify me",
  drag: "Drag to rotate · click an app",
  dragBoard: "Click to select an app, double-click to open it.",
  hint: "Drag to rotate · click a column",
  done: "done",
  target: "target 100 %",
  doneEdge: "← DONE",
  plannedEdge: "PLANNED →",
  roadHint: "Drag to rotate · click a column",
  progress: "% done",
  boardTitle: "Pick an app",
  boardEyebrow: "Connections",
  boardText: "Account is the processor of the whole board and every app has its own link to it. Click to select an app, double-click to open it.",
  exploreEyebrow: "More than the web",
  exploreTitle: "More VeVit projects",
  exploreText: "Besides web apps we build custom software and are preparing a platform for artists.",
  studiosTag: "Custom software",
  studiosText: "We build web apps, internal systems and integrations for companies and individuals.",
  artTag: "Platform for artists",
  artText: "We are preparing VeVit Art for emerging artists who want to share their work.",
  soon: {
    badge: "In preparation",
    soon: "Coming soon",
    back: "Back to VeVit",
    notify: "Write to us",
    progress: "done",
    bodies: {
      account: "",
      tools: "",
      games: "",
      edu: "",
      mail: "Your own mailbox at @vevit.cz, linked to your VeVit account. Still in the design phase.",
      office: "A desktop office suite for documents, spreadsheets and presentations. Files will be stored with your account.",
      services: "A marketplace where you post a request or offer your own service. From web design to tutoring and garden help.",
      search: "One search across all tools, games, lessons and docs. Shortcut ⌘K anywhere in the ecosystem.",
      store: "Official merch, digital products, e-books and courses. Premium users will get 20 % off.",
    },
    captions: {
      account: "",
      tools: "",
      games: "",
      edu: "",
      mail: "The inboxes are being sorted.",
      office: "The document is writing itself. Just a few lines so far.",
      services: "Requests and offers are finding their way to each other.",
      search: "The magnifier has found something. Waiting for the rest.",
      store: "Goods are being packed. The counter is not open yet.",
    },
    points: {
      account: ["", "", ""],
      tools: ["", "", ""],
      games: ["", "", ""],
      edu: ["", "", ""],
      mail: ["@vevit.cz address", "Sign in with your VeVit account", "No ads, no tracking"],
      office: ["Documents, spreadsheets, presentations", "Files stored with your account", "Desktop app"],
      services: ["Posting a request is free", "Offer your own services", "Profile and reviews"],
      search: ["Tools, games and lessons in one place", "⌘K shortcut anywhere", "Search the docs"],
      store: ["Merch and digital products", "E-books and courses", "20 % off for Premium"],
    },
  },
};

export function sceneStrings(locale: string): SceneStrings {
  return locale === "cs" ? cs : en;
}
