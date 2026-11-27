// Právní dokumenty EveryTool.cz — Podmínky užití a Ochrana soukromí
// (obsah dle schválené makety legal.html).
//
// Při změně textu zvyšte TERMS_VERSION v src/lib/consent.ts — cookie lišta
// se pak zobrazí znovu.
//
// ⚠ EN verze je neověřený překlad nového českého textu — před publikací
//   nechat zkontrolovat. Česká verze je závazná.
//
// Placeholdery, které ještě čekají na údaje (nevyplňovat naslepo):
//   [X] dnů / [X] dní, [POSKYTOVATEL E-MAILŮ].
// Provozovatel: VeVit Technologies (bez IČO/sídla, zatím nejsou známy).

const OPERATOR = "VeVit Technologies";

export interface LegalShort {
  h: string;
  t: string;
}

/** odstavec = [tučný úvod (může být prázdný), vlastní text] */
export type LegalParagraph = readonly [string, string];

export interface LegalSection {
  id: string;
  h: string;
  p: readonly LegalParagraph[];
}

export interface LegalDoc {
  title: string;
  effective: string;
  intro: string;
  short: readonly LegalShort[];
  sections: readonly LegalSection[];
}

// ── Podmínky užití — čeština (zdroj: legal.html) ─────────────────────────

const CS_TERMS: LegalDoc = {
  title: "Podmínky užití",
  effective: "Účinné od 27. 11. 2026",
  intro: "Tyto podmínky upravují používání webu EveryTool.cz, jeho online nástrojů, uživatelských účtů a placeného předplatného. Používáním webu s nimi souhlasíte, proto si je prosím přečtěte. Snažili jsme se je napsat lidsky.",
  short: [
    { h: "Nástroje jsou zdarma", t: "Všech {count} nástrojů můžete používat bez účtu i bez placení. Premium jen přidává vyšší limity a pohodlí." },
    { h: "Výsledek si zkontrolujte", t: "Převody i AI se mohou splést. Před důležitým použitím výsledek vždy projděte a originál si nechte." },
    { h: "Předplatné zrušíte kdykoli", t: "Jedním kliknutím v nastavení účtu. Premium vám poběží do konce zaplaceného období." },
  ],
  sections: [
    { id: "t-uvod", h: "Úvodní ustanovení", p: [
      ["Provozovatel. ", `EveryTool.cz provozuje ${OPERATOR} (dále „provozovatel“ nebo „my“). Kontakt: info@vevit.cz.`],
      ["", "Podmínky platí pro web EveryTool.cz, všechny jeho nástroje, uživatelské účty a předplatné EveryTool Premium. Pro členství VeVit Premium platí navíc obchodní podmínky VeVit; v případě rozporu mají u VeVit Premium přednost ony."],
      ["", "Používáním kteréhokoli nástroje nebo založením účtu tyto podmínky přijímáte. Pokud s nimi nesouhlasíte, web nepoužívejte."],
    ]},
    { id: "t-zpracovani", h: "Kde se vaše soubory zpracovávají", p: [
      ["Lokálně. ", "Většina nástrojů zpracovává soubory přímo ve vašem prohlížeči. Soubor ani jeho obsah se na naše servery neodesílá."],
      ["Na serveru a přes AI. ", "Některé nástroje zpracovávají vstup na serverech Amazon Web Services; AI nástroje používají modely ve službě Amazon Bedrock. Vstup se přenáší šifrovaně a použije se jen k vyřízení vašeho požadavku. Po zpracování ho neukládáme."],
      ["Třetí strana. ", "Nástroj komunikuje přímo s uvedenou externí službou; u nástroje vždy popíšeme, jaká data se odesílají."],
      ["", "U každého nástroje je vidět, do které skupiny patří. Do serverových a AI nástrojů nevkládejte údaje, které nesmíte sdílet, například obchodní tajemství, zdravotní údaje, hesla nebo osobní údaje jiných lidí bez právního důvodu."],
    ]},
    { id: "t-ucet", h: "Uživatelský účet", p: [
      ["", "Účet je dobrovolný. Umožní vám ukládat oblíbené nástroje a historii na všech zařízeních a koupit předplatné."],
      ["", "Účet si může založit osoba starší 15 let. Mladší uživatelé jen se souhlasem zákonného zástupce."],
      ["", "Uvádějte pravdivé údaje a heslo nikomu nesdělujte. Za činnost ve svém účtu odpovídáte vy. Podezření na zneužití nám prosím hned nahlaste."],
      ["", "Účet můžete kdykoli zrušit v nastavení. My jej můžeme omezit nebo zrušit, pokud závažně porušíte tyto podmínky; o důvodu vás budeme informovat."],
    ]},
    { id: "t-premium", h: "Předplatné EveryTool Premium a VeVit Premium", p: [
      ["Co získáte. ", "Aktuální výhody, limity a ceny jednotlivých tarifů najdete na stránce Premium. Ceny jsou uvedeny v Kč včetně DPH."],
      ["Platba. ", "Předplatné se platí měsíčně nebo ročně předem. Platby zpracovává společnost Stripe; údaje o kartě se odesílají přímo jí a my je neukládáme. Doklad o platbě vám pošleme e-mailem."],
      ["Obnovení a zrušení. ", "Předplatné se automaticky obnovuje na další období, dokud ho nezrušíte. Zrušit ho můžete kdykoli v nastavení účtu; výhody vám zůstanou do konce zaplaceného období."],
      ["Změna ceny. ", "O změně ceny vás informujeme e-mailem nejméně 30 dní předem. Nová cena platí až od dalšího období; pokud s ní nesouhlasíte, předplatné včas zrušte."],
      ["VeVit Premium. ", "Členství VeVit Premium (Bronze, Silver, Gold, Platinum) zahrnuje výhody napříč službami VeVit. Které výhody EveryTool obsahuje, uvádí popis tarifu."],
    ]},
    { id: "t-odstoupeni", h: "Odstoupení od smlouvy", p: [
      ["", "Jste-li spotřebitel, můžete od smlouvy o předplatném odstoupit bez udání důvodu do 14 dnů od jejího uzavření, stačí napsat na info@vevit.cz."],
      ["", "Pokud jste výslovně požádali, aby Premium začalo hned, a během lhůty odstoupíte, vrátíme vám cenu sníženou o poměrnou část za dobu, po které jste Premium využívali. Peníze vrátíme do 14 dnů stejným způsobem, jakým jste platili."],
    ]},
    { id: "t-zaruka", h: "Výsledky jsou bez záruky", p: [
      ["", "Nástroje poskytujeme tak, jak jsou. Nezaručujeme, že výsledek bude vždy přesný, úplný nebo vhodný pro váš účel. Převod mezi formáty může změnit vzhled či rozložení a rozpoznávání textu (OCR) i výstupy AI mohou obsahovat chyby nebo smyšlené údaje."],
      ["", "Výsledek si před použitím zkontrolujte, zvlášť před právním, finančním, daňovým, zdravotním nebo úředním použitím. Výstupy AI ani výpočty kalkulaček nejsou odbornou radou."],
      ["", "Originály si vždy ponechte. Nástroje můžeme měnit, dočasně vypnout kvůli údržbě nebo ukončit. U placených funkcí vás na podstatné omezení upozorníme předem."],
    ]},
    { id: "t-odpovednost", h: "Omezení odpovědnosti", p: [
      ["", "V rozsahu, který připouští zákon, neodpovídáme za škodu vzniklou používáním nebo nemožností používání nástrojů či jejich výsledků, včetně ušlého zisku a ztráty dat."],
      ["", "Toto omezení se nevztahuje na škodu způsobenou úmyslně nebo z hrubé nedbalosti, na újmu na životě a zdraví, ani na práva spotřebitele, která nelze smluvně omezit."],
    ]},
    { id: "t-pravidla", h: "Pravidla používání", p: [
      ["", "Zpracovávejte jen obsah, ke kterému máte potřebná práva. Za vložený obsah a za to, jak výsledky použijete, odpovídáte vy."],
      ["", "Nástroje nesmíte používat k protiprávní činnosti, šíření škodlivého kódu, porušování práv jiných, vytváření klamavého nebo nenávistného obsahu, obcházení limitů ani k automatizovanému hromadnému zatěžování služby."],
      ["Limity. ", "Kvůli férovému sdílení mají některé nástroje denní limity nebo maximální velikost souboru. Konkrétní limity závisí na tarifu a jsou uvedeny u nástroje a na stránce Premium."],
    ]},
    { id: "t-prava", h: "Práva k obsahu", p: [
      ["", "Vaše soubory, texty i výsledky zůstávají vaše. Nezískáváme k nim žádná práva kromě těch, které jsou nutné k vyřízení vašeho požadavku, a nepoužíváme je k trénování AI."],
      ["", "Web, jeho design, značka EveryTool.cz a kód nástrojů jsou chráněny právem. Součásti třetích stran podléhají svým licencím."],
    ]},
    { id: "t-reklamace", h: "Reklamace a stížnosti", p: [
      ["", "Pokud placená služba nefunguje, jak má, napište nám na info@vevit.cz. Reklamaci vyřídíme bez zbytečného odkladu, nejpozději do 30 dnů."],
      ["", "Spotřebitel může spor řešit také mimosoudně u České obchodní inspekce (www.coi.cz) nebo přes evropskou platformu pro řešení sporů online."],
    ]},
    { id: "t-zmeny", h: "Změny podmínek", p: [
      ["", "Podmínky můžeme měnit, zejména při změně nástrojů, tarifů nebo zákonů. Aktuální znění je vždy na této stránce. O podstatné změně vás předem informujeme e-mailem nebo na webu; pokud nesouhlasíte, můžete účet či předplatné zrušit."],
    ]},
    { id: "t-zaver", h: "Závěrečná ustanovení", p: [
      ["", "Podmínky se řídí právem České republiky. Spotřebitelům tím nejsou dotčena práva, která jim dávají kogentní předpisy státu jejich bydliště."],
      ["", "Je-li některé ustanovení neplatné, ostatní zůstávají v platnosti."],
    ]},
  ],
};

// ── Ochrana soukromí — čeština (zdroj: legal.html) ───────────────────────

const CS_PRIVACY: LegalDoc = {
  title: "Ochrana soukromí",
  effective: "Účinné od 27. 11. 2026",
  intro: "Vaše soukromí bereme vážně. EveryTool.cz je postavený tak, aby o vás věděl co nejméně: většina nástrojů běží přímo ve vašem prohlížeči. Tady je přehled, jaké údaje přesto zpracováváme, proč a jak dlouho.",
  short: [
    { h: "Lokální nástroje nic neodesílají", t: "Soubory zpracované v prohlížeči nikdy neopustí vaše zařízení. Ani je nevidíme." },
    { h: "Data neprodáváme", t: "Vaše údaje nikomu neprodáváme a vaše soubory nepoužíváme k trénování AI." },
    { h: "Vaše data, vaše volba", t: "Údaje z účtu si můžete stáhnout nebo účet smazat. Analytiku zapneme jen s vaším souhlasem." },
  ],
  sections: [
    { id: "p-spravce", h: "Kdo vaše údaje zpracovává", p: [
      ["Správce. ", `${OPERATOR} (dále „my“).`],
      ["Kontakt. ", "Ve všech otázkách ochrany osobních údajů nám pište na info@vevit.cz."],
    ]},
    { id: "p-nastroje", h: "Obsah, který vložíte do nástrojů", p: [
      ["Lokální nástroje. ", "Zpracování probíhá ve vašem prohlížeči. Nic se k nám neodesílá, takže žádné osobní údaje nezpracováváme."],
      ["Serverové a AI nástroje. ", "Vstup (soubor nebo text) zpracujeme jen k vyřízení vašeho požadavku a po zpracování ho neuchováváme. Právní základ: plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)."],
    ]},
    { id: "p-ucet", h: "Účet, předplatné a komunikace", p: [
      ["Účet. ", "E-mail, jméno nebo přezdívka, zabezpečený otisk hesla, nastavení, oblíbené nástroje a historie. Slouží k provozu účtu. Právní základ: plnění smlouvy."],
      ["Předplatné. ", "Zvolený tarif, období, historie plateb a fakturační údaje. Kartu zpracovává Stripe, číslo karty nevidíme. Právní základ: plnění smlouvy a zákonné povinnosti v účetnictví a daních."],
      ["Přihlášení přes Google. ", "Pokud ho zvolíte, získáme od Googlu vaše jméno, e-mail a profilovou fotku. Nic jiného."],
      ["Komunikace. ", "Když nám napíšete, zpracujeme vaši zprávu a kontakt, abychom mohli odpovědět. Právní základ: oprávněný zájem."],
    ]},
    { id: "p-technicke", h: "Technické a bezpečnostní údaje", p: [
      ["", "Při používání webu se zpracovává IP adresa, typ prohlížeče a technické záznamy o požadavcích. Potřebujeme je k ochraně proti zneužití, k hlídání limitů nástrojů a k řešení chyb. Právní základ: oprávněný zájem na bezpečném provozu."],
    ]},
    { id: "p-cookies", h: "Cookies a úložiště v prohlížeči", p: [
      ["Nezbytné. ", "V prohlížeči ukládáme motiv, jazyk, oblíbené a naposledy použité nástroje, vaši volbu cookies a u přihlášených také přihlašovací relaci. Bez nich by web nefungoval, souhlas k nim není potřeba."],
      ["Analytické. ", "Anonymní měření návštěvnosti a rychlosti (Vercel Web Analytics a Speed Insights) zapneme jen s vaším souhlasem. Volbu můžete kdykoli změnit odkazem „Nastavení cookies“ v patičce."],
      ["", "Reklamní ani sledovací cookies třetích stran nepoužíváme."],
    ]},
    { id: "p-prijemci", h: "Komu údaje předáváme", p: [
      ["", "Údaje svěřujeme jen prověřeným zpracovatelům, kteří je smějí použít pouze pro nás:"],
      ["Amazon Web Services ", "– servery a AI modely (Amazon Bedrock) pro serverové a AI nástroje."],
      ["Vercel ", "– hosting webu a anonymní analytika (jen se souhlasem)."],
      ["Supabase ", "– databáze a přihlašování k účtu."],
      ["Stripe ", "– zpracování plateb za předplatné."],
      ["[POSKYTOVATEL E-MAILŮ] ", "– odesílání e-mailů o účtu a platbách."],
      ["", "Údaje neprodáváme a nepředáváme marketingovým partnerům."],
    ]},
    { id: "p-zahranici", h: "Předávání mimo EU", p: [
      ["", "Někteří zpracovatelé sídlí v USA. Předání probíhá na základě rámce EU–USA pro ochranu osobních údajů (Data Privacy Framework) nebo standardních smluvních doložek schválených Evropskou komisí."],
    ]},
    { id: "p-doba", h: "Jak dlouho údaje uchováváme", p: [
      ["Obsah nástrojů: ", "jen po dobu zpracování požadavku."],
      ["Účet: ", "po dobu jeho existence; po zrušení údaje smažeme do [X] dnů."],
      ["Platby a faktury: ", "10 let, jak ukládá zákon o DPH a účetnictví."],
      ["Technické záznamy: ", "nejvýše [X] dní, pokud je nepotřebujeme k řešení bezpečnostního incidentu."],
      ["Komunikace: ", "po dobu nutnou k vyřízení, nejdéle 3 roky."],
    ]},
    { id: "p-prava", h: "Vaše práva", p: [
      ["", "Máte právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování a přenositelnost. Můžete vznést námitku proti zpracování na základě oprávněného zájmu a kdykoli odvolat souhlas."],
      ["", "Údaje z účtu si můžete stáhnout a účet smazat přímo v nastavení. Ostatní žádosti posílejte na info@vevit.cz, vyřídíme je do 30 dnů."],
      ["", "Stížnost můžete podat u Úřadu pro ochranu osobních údajů (www.uoou.cz)."],
    ]},
    { id: "p-bezpecnost", h: "Zabezpečení", p: [
      ["", "Veškerá komunikace probíhá šifrovaně přes HTTPS. Hesla ukládáme jen jako bezpečný otisk, přístup k údajům má jen nezbytně nutný okruh lidí a pravidelně kontrolujeme zabezpečení. O případném úniku, který by vás ohrožoval, vás bez zbytečného odkladu informujeme."],
    ]},
    { id: "p-zmeny", h: "Změny těchto zásad", p: [
      ["", "Zásady aktualizujeme, když se změní naše služby nebo zákony. Aktuální verze je vždy na této stránce. O podstatných změnách vás informujeme předem."],
    ]},
  ],
};

// ── Terms of Use — English (NEověřený překlad, nechat zkontrolovat) ──────

const EN_TERMS: LegalDoc = {
  title: "Terms of Use",
  effective: "Effective from November 27, 2026",
  intro: "These terms govern the use of the EveryTool.cz website, its online tools, user accounts and paid subscriptions. By using the website you agree to them, so please read them. We tried to write them in plain human language.",
  short: [
    { h: "The tools are free", t: "All {count} tools can be used without an account and without paying. Premium only adds higher limits and comfort." },
    { h: "Check the result", t: "Converters and AI can make mistakes. Always review the result before important use and keep the original." },
    { h: "Cancel anytime", t: "With one click in account settings. Your Premium keeps running until the end of the paid period." },
  ],
  sections: [
    { id: "t-uvod", h: "Introductory provisions", p: [
      ["Operator. ", `EveryTool.cz is operated by ${OPERATOR} (the “operator” or “we”). Contact: info@vevit.cz.`],
      ["", "These terms apply to the EveryTool.cz website, all its tools, user accounts and the EveryTool Premium subscription. The VeVit terms additionally apply to VeVit Premium membership; in case of conflict, those prevail for VeVit Premium."],
      ["", "By using any tool or creating an account you accept these terms. If you do not agree, do not use the website."],
    ]},
    { id: "t-zpracovani", h: "Where your files are processed", p: [
      ["Locally. ", "Most tools process files directly in your browser. Neither the file nor its content is sent to our servers."],
      ["On the server and via AI. ", "Some tools process input on Amazon Web Services servers; AI tools use models in the Amazon Bedrock service. Input is transferred encrypted and used only to handle your request. We do not store it after processing."],
      ["Third party. ", "The tool communicates directly with the named external service; each tool always describes what data is sent."],
      ["", "Every tool shows which group it belongs to. Do not put data you must not share into server and AI tools, such as trade secrets, health data, passwords, or other people's personal data without a legal reason."],
    ]},
    { id: "t-ucet", h: "User account", p: [
      ["", "An account is optional. It lets you store favourite tools and history across devices and buy a subscription."],
      ["", "An account can be created by a person over 15 years of age. Younger users only with the consent of a legal guardian."],
      ["", "Provide truthful information and never share your password. You are responsible for activity in your account. Please report any suspected misuse to us immediately."],
      ["", "You can delete your account anytime in settings. We may restrict or delete it if you seriously breach these terms; we will inform you of the reason."],
    ]},
    { id: "t-premium", h: "EveryTool Premium and VeVit Premium subscriptions", p: [
      ["What you get. ", "Current benefits, limits and prices of each plan are listed on the Premium page. Prices are shown in CZK including VAT."],
      ["Payment. ", "Subscriptions are paid monthly or yearly in advance. Payments are processed by Stripe; card details are sent directly to Stripe and we do not store them. We email you a proof of payment."],
      ["Renewal and cancellation. ", "The subscription automatically renews for the next period until you cancel it. You can cancel anytime in account settings; benefits remain until the end of the paid period."],
      ["Price changes. ", "We will inform you about a price change by email at least 30 days in advance. The new price applies from the next period; if you disagree, cancel in time."],
      ["VeVit Premium. ", "VeVit Premium membership (Bronze, Silver, Gold, Platinum) includes benefits across VeVit services. The plan description states which EveryTool benefits it contains."],
    ]},
    { id: "t-odstoupeni", h: "Withdrawal from the contract", p: [
      ["", "If you are a consumer, you may withdraw from the subscription contract without giving a reason within 14 days of its conclusion; just write to info@vevit.cz."],
      ["", "If you expressly asked for Premium to start immediately and withdraw within the period, we will refund the price reduced by a proportionate part for the time you used Premium. We return the money within 14 days the same way you paid."],
    ]},
    { id: "t-zaruka", h: "Results come without warranty", p: [
      ["", "The tools are provided as they are. We do not guarantee that a result will always be accurate, complete or fit for your purpose. Format conversion may change appearance or layout, and text recognition (OCR) and AI outputs may contain errors or made-up information."],
      ["", "Check the result before use, especially before legal, financial, tax, medical or official use. AI outputs and calculator computations are not professional advice."],
      ["", "Always keep your originals. We may change tools, temporarily disable them for maintenance, or discontinue them. For paid features we will notify you of a significant restriction in advance."],
    ]},
    { id: "t-odpovednost", h: "Limitation of liability", p: [
      ["", "To the extent permitted by law, we are not liable for damage caused by using or being unable to use the tools or their results, including lost profit and data loss."],
      ["", "This limitation does not apply to damage caused intentionally or by gross negligence, to injury to life or health, or to consumer rights that cannot be limited contractually."],
    ]},
    { id: "t-pravidla", h: "Rules of use", p: [
      ["", "Only process content you have the necessary rights to. You are responsible for the content you upload and for how you use the results."],
      ["", "You must not use the tools for illegal activity, spreading malicious code, violating others' rights, creating deceptive or hateful content, circumventing limits, or automated mass overloading of the service."],
      ["Limits. ", "For fair sharing, some tools have daily limits or a maximum file size. Specific limits depend on the plan and are shown at the tool and on the Premium page."],
    ]},
    { id: "t-prava", h: "Content rights", p: [
      ["", "Your files, texts and results remain yours. We acquire no rights to them beyond those necessary to handle your request, and we do not use them to train AI."],
      ["", "The website, its design, the EveryTool.cz brand and tool code are protected by law. Third-party components are subject to their licenses."],
    ]},
    { id: "t-reklamace", h: "Complaints", p: [
      ["", "If a paid service does not work as it should, write to info@vevit.cz. We handle complaints without undue delay, at the latest within 30 days."],
      ["", "A consumer may also resolve a dispute out of court with the Czech Trade Inspection Authority (www.coi.cz) or through the European online dispute resolution platform."],
    ]},
    { id: "t-zmeny", h: "Changes to the terms", p: [
      ["", "We may change the terms, especially when tools, plans or laws change. The current version is always on this page. We will inform you of a material change in advance by email or on the web; if you disagree, you can delete your account or subscription."],
    ]},
    { id: "t-zaver", h: "Final provisions", p: [
      ["", "The terms are governed by Czech law. This does not affect rights given to consumers by mandatory rules of their country of residence."],
      ["", "If any provision is invalid, the rest remains in force."],
    ]},
  ],
};

// ── Privacy — English (NEověřený překlad, nechat zkontrolovat) ──────────

const EN_PRIVACY: LegalDoc = {
  title: "Privacy Notice",
  effective: "Effective from November 27, 2026",
  intro: "We take your privacy seriously. EveryTool.cz is built to know as little about you as possible: most tools run directly in your browser. Here is an overview of what data we still process, why, and for how long.",
  short: [
    { h: "Local tools send nothing", t: "Files processed in the browser never leave your device. We cannot even see them." },
    { h: "We do not sell data", t: "We never sell your data and we do not use your files to train AI." },
    { h: "Your data, your choice", t: "You can download your account data or delete the account. Analytics only runs with your consent." },
  ],
  sections: [
    { id: "p-spravce", h: "Who processes your data", p: [
      ["Controller. ", `${OPERATOR} (“we”).`],
      ["Contact. ", "For anything about personal data protection, write to info@vevit.cz."],
    ]},
    { id: "p-nastroje", h: "Content you put into tools", p: [
      ["Local tools. ", "Processing happens in your browser. Nothing is sent to us, so we process no personal data."],
      ["Server and AI tools. ", "Input (file or text) is processed only to handle your request and is not kept after processing. Legal basis: performance of a contract (Art. 6(1)(b) GDPR)."],
    ]},
    { id: "p-ucet", h: "Account, subscription and communication", p: [
      ["Account. ", "Email, name or nickname, a secure password hash, settings, favourite tools and history. Used to operate the account. Legal basis: performance of a contract."],
      ["Subscription. ", "Chosen plan, period, payment history and billing details. The card is processed by Stripe; we never see the card number. Legal basis: contract and legal accounting and tax obligations."],
      ["Sign in with Google. ", "If you choose it, we receive your name, email and profile picture from Google. Nothing else."],
      ["Communication. ", "When you write to us, we process your message and contact so we can reply. Legal basis: legitimate interest."],
    ]},
    { id: "p-technicke", h: "Technical and security data", p: [
      ["", "Using the website involves processing of the IP address, browser type and technical request logs. We need them for abuse protection, tool limit enforcement and debugging. Legal basis: legitimate interest in a secure operation."],
    ]},
    { id: "p-cookies", h: "Cookies and browser storage", p: [
      ["Essential. ", "We store the theme, language, favourites and recently used tools, your cookie choice and, for signed-in users, the login session in your browser. The site would not work without them; no consent is needed."],
      ["Analytics. ", "Anonymous traffic and speed measurement (Vercel Web Analytics and Speed Insights) only runs with your consent. You can change the choice anytime via “Cookie settings” in the footer."],
      ["", "We do not use advertising or third-party tracking cookies."],
    ]},
    { id: "p-prijemci", h: "Who we share data with", p: [
      ["", "We entrust data only to vetted processors who may use it solely for us:"],
      ["Amazon Web Services ", "– servers and AI models (Amazon Bedrock) for server and AI tools."],
      ["Vercel ", "– website hosting and anonymous analytics (consent only)."],
      ["Supabase ", "– database and account sign-in."],
      ["Stripe ", "– subscription payment processing."],
      ["[POSKYTOVATEL E-MAILŮ] ", "– sending account and payment emails."],
      ["", "We do not sell data or pass it to marketing partners."],
    ]},
    { id: "p-zahranici", h: "Transfers outside the EU", p: [
      ["", "Some processors are based in the USA. Transfers rely on the EU–US Data Privacy Framework or standard contractual clauses approved by the European Commission."],
    ]},
    { id: "p-doba", h: "How long we keep data", p: [
      ["Tool content: ", "only for the duration of processing the request."],
      ["Account: ", "for its lifetime; after deletion we erase the data within [X] days."],
      ["Payments and invoices: ", "10 years, as required by VAT and accounting law."],
      ["Technical logs: ", "at most [X] days, unless needed to resolve a security incident."],
      ["Communication: ", "as long as needed to handle it, at most 3 years."],
    ]},
    { id: "p-prava", h: "Your rights", p: [
      ["", "You have the right to access your data, and to rectification, erasure, restriction of processing and portability. You may object to processing based on legitimate interest and withdraw consent anytime."],
      ["", "You can download your account data and delete the account directly in settings. Send other requests to info@vevit.cz; we handle them within 30 days."],
      ["", "You can file a complaint with the Czech Data Protection Authority (www.uoou.cz)."],
    ]},
    { id: "p-bezpecnost", h: "Security", p: [
      ["", "All communication is encrypted over HTTPS. We store passwords only as a secure hash, only the necessary people can access the data, and we review security regularly. If a breach that could endanger you occurs, we will inform you without undue delay."],
    ]},
    { id: "p-zmeny", h: "Changes to this notice", p: [
      ["", "We update this notice when our services or the law change. The current version is always on this page. We inform you about material changes in advance."],
    ]},
  ],
};

/** cs/sk → česká verze, ostatní locale → anglický (neověřený) překlad. */
export const termsFor = (locale: string): LegalDoc => (locale === "cs" || locale === "sk" ? CS_TERMS : EN_TERMS);
export const privacyFor = (locale: string): LegalDoc => (locale === "cs" || locale === "sk" ? CS_PRIVACY : EN_PRIVACY);
