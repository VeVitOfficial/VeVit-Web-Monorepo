// Podmínky užití VeVit Tools (/{locale}/tools/podminky-uziti). Při změně textu zvyšte
// TERMS_VERSION v src/lib/consent.ts — cookie lišta se pak zobrazí znovu.
import { TERMS_VERSION } from "@/lib/consent";

export interface TermsSection { h: string; p: string[] }
export interface TermsDoc { title: string; effective: string; intro: string; sections: TermsSection[] }

const [y, m, d] = TERMS_VERSION.split("-").map(Number);

const CS: TermsDoc = {
  title: "Podmínky užití nástrojů",
  effective: `Účinné od ${d}. ${m}. ${y}`,
  intro: "Tyto podmínky upravují používání online nástrojů VeVit Tools na webu www.vevit.cz (dále jen „nástroje“). Přečtěte si je prosím — používáním nástrojů s nimi souhlasíte.",
  sections: [
    {
      h: "1. Úvodní ustanovení",
      p: [
        "Nástroje provozuje VeVit (dále jen „provozovatel“ nebo „my“). Kontakt: info@vevit.cz.",
        "Nástroje jsou poskytovány zdarma a bez registrace. Používáním kteréhokoli nástroje, nebo potvrzením v liště cookies, přijímáte tyto podmínky. Pokud s nimi nesouhlasíte, nástroje nepoužívejte.",
      ],
    },
    {
      h: "2. Kde se vaše soubory a texty zpracovávají",
      p: [
        "Lokálně v prohlížeči (označení „Lokálně“): většina nástrojů zpracovává soubory přímo ve vašem zařízení. Soubor ani jeho obsah se na naše servery neodesílá.",
        "Na serveru a přes AI (označení „Na serveru“ a „Přes AI“): všechny AI nástroje a všechny nástroje zpracovávané na serveru zpracovávají vstupy na serverech Amazon Web Services (AWS); AI nástroje využívají jazykové a obrazové modely ve službě Amazon Bedrock. Vstup se přenáší šifrovaně (HTTPS) a použije se jen k vyřízení vašeho požadavku. Soubory ani texty po dokončení neukládáme; uchováváme pouze technické záznamy nezbytné pro provoz a bezpečnost (např. čas a velikost požadavku, chybová hlášení).",
        "Třetí strana (označení „Třetí strana“): nástroj komunikuje přímo s uvedenou externí službou; u nástroje je popsáno, jaká data se odesílají.",
        "Do nástrojů zpracovávaných na serveru nebo přes AI nevkládejte údaje, které nesmíte sdílet (např. obchodní tajemství, zdravotní údaje, hesla nebo osobní údaje třetích osob bez právního důvodu).",
      ],
    },
    {
      h: "3. Výsledky jsou bez záruky",
      p: [
        "Nástroje poskytujeme „tak, jak jsou“ a „jak jsou dostupné“. Nezaručujeme, že výsledek bude přesný, úplný, bezchybný nebo vhodný pro váš účel. Převod mezi formáty může změnit vzhled, písma, rozložení či kvalitu a část obsahu se může ztratit; rozpoznávání textu (OCR) a výstupy AI mohou obsahovat chyby nebo smyšlené údaje.",
        "Každý výsledek si před použitím zkontrolujte — zejména před právním, finančním, daňovým, zdravotním nebo úředním použitím. Výstupy AI ani výpočty kalkulaček nejsou odbornou radou.",
        "Originální soubory si vždy ponechte; nástroje je nemění, ale za ztrátu dat na vašem zařízení neodpovídáme.",
        "Nezaručujeme nepřetržitou dostupnost. Nástroje můžeme kdykoli změnit, omezit, dočasně vypnout (např. údržba) nebo ukončit, a to i bez předchozího upozornění.",
      ],
    },
    {
      h: "4. Omezení odpovědnosti",
      p: [
        "V rozsahu, který připouští právní předpisy, neodpovídáme za škodu ani jinou újmu (včetně ušlého zisku, ztráty dat nebo nepřímých škod) vzniklou používáním nebo nemožností používání nástrojů či jejich výsledků.",
        "Toto omezení se nevztahuje na škodu způsobenou úmyslně nebo z hrubé nedbalosti, na újmu na životě, zdraví či přirozených právech člověka, ani na práva spotřebitele, která nelze smluvně omezit nebo vyloučit.",
      ],
    },
    {
      h: "5. Pravidla používání",
      p: [
        "Zpracovávejte jen obsah, ke kterému máte potřebná práva nebo oprávnění. Za obsah, který do nástrojů vložíte, a za způsob, jakým výsledky použijete, odpovídáte vy.",
        "Je zakázáno používat nástroje k protiprávní činnosti, k šíření škodlivého kódu, k porušování práv třetích osob (včetně autorských práv a ochrany osobních údajů), k vytváření klamavého či nenávistného obsahu, k obcházení technických omezení nebo k automatizovanému hromadnému zatěžování služby.",
        "Při porušení podmínek můžeme omezit nebo zablokovat přístup k nástrojům.",
      ],
    },
    {
      h: "6. Práva k obsahu",
      p: [
        "Práva k vašim souborům, textům i výsledkům zůstávají vám. Nezískáváme k nim žádná práva kromě těch, které jsou nezbytné k jejich zpracování ve vašem požadavku.",
        "Web, jeho design a kód nástrojů jsou chráněny právem; součásti třetích stran podléhají svým (open-source) licencím.",
      ],
    },
    {
      h: "7. Osobní údaje a cookies",
      p: [
        "Lokální nástroje osobní údaje nezpracovávají. Pokud vstup do serverového nebo AI nástroje obsahuje osobní údaje, zpracováváme je výhradně k vyřízení vašeho požadavku (čl. 6 odst. 1 písm. b) GDPR); AWS vystupuje jako náš zpracovatel.",
        "Nezbytné úložiště v prohlížeči (localStorage) používáme pro motiv, jazyk, oblíbené a naposledy použité nástroje a pro uložení vaší volby v liště cookies. Anonymní měření návštěvnosti a rychlosti (Vercel Web Analytics a Speed Insights) zapínáme jen s vaším souhlasem („Přijmout vše“). Volbu můžete kdykoli změnit odkazem „Nastavení cookies“ v patičce.",
        "Máte právo na přístup k osobním údajům, jejich opravu, výmaz, omezení zpracování a právo vznést námitku; žádosti posílejte na info@vevit.cz. Stížnost můžete podat u Úřadu pro ochranu osobních údajů (www.uoou.cz).",
      ],
    },
    {
      h: "8. Změny podmínek",
      p: [
        "Podmínky můžeme měnit, zejména při změně nástrojů, jejich zpracování nebo právních předpisů. Aktuální znění s datem účinnosti je vždy na této stránce; po podstatné změně vás požádáme o nové potvrzení v liště cookies.",
      ],
    },
    {
      h: "9. Závěrečná ustanovení",
      p: [
        "Tyto podmínky se řídí právem České republiky. Je-li uživatel spotřebitelem, nejsou tím dotčena práva, která mu dávají kogentní předpisy státu jeho bydliště.",
        "Spotřebitel může spor řešit mimosoudně u České obchodní inspekce (www.coi.cz).",
        "Je-li některé ustanovení neplatné nebo neúčinné, ostatní ustanovení zůstávají v platnosti.",
      ],
    },
  ],
};

const EN: TermsDoc = {
  title: "Terms of Use",
  effective: `Effective from ${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  intro: "These terms govern the use of the VeVit Tools online tools at www.vevit.cz (the “tools”). Please read them — by using the tools you agree to them. The Czech version prevails in case of any discrepancy.",
  sections: [
    {
      h: "1. Introduction",
      p: [
        "The tools are operated by VeVit (the “operator”, “we”). Contact: info@vevit.cz.",
        "The tools are free and require no registration. By using any tool, or by confirming the cookie banner, you accept these terms. If you do not agree, do not use the tools.",
      ],
    },
    {
      h: "2. Where your files and texts are processed",
      p: [
        "Locally in your browser (label “Local”): most tools process files directly on your device. Neither the file nor its content is sent to our servers.",
        "On the server and via AI (labels “On server” and “Via AI”): all AI tools and all server-side tools process inputs on Amazon Web Services (AWS) servers; AI tools use language and image models in Amazon Bedrock. Input is transferred encrypted (HTTPS) and used only to handle your request. We do not store files or texts after processing; we keep only technical records needed for operation and security (e.g. request time and size, error messages).",
        "Third party (label “Third party”): the tool talks directly to the named external service; the tool describes which data is sent.",
        "Do not enter data you are not allowed to share into server-side or AI tools (e.g. trade secrets, health data, passwords, or third-party personal data without a legal basis).",
      ],
    },
    {
      h: "3. Results come without warranty",
      p: [
        "The tools are provided “as is” and “as available”. We do not guarantee that a result will be accurate, complete, error-free or fit for your purpose. Format conversion may change appearance, fonts, layout or quality and some content may be lost; text recognition (OCR) and AI output may contain errors or made-up information.",
        "Check every result before use — especially for legal, financial, tax, medical or official purposes. AI output and calculator results are not professional advice.",
        "Always keep your original files; the tools do not modify them, but we are not liable for data loss on your device.",
        "We do not guarantee uninterrupted availability. We may change, limit, temporarily disable (e.g. maintenance) or discontinue tools at any time, including without prior notice.",
      ],
    },
    {
      h: "4. Limitation of liability",
      p: [
        "To the extent permitted by law, we are not liable for any damage or loss (including lost profit, data loss or indirect damage) arising from the use of, or inability to use, the tools or their results.",
        "This limitation does not apply to damage caused intentionally or by gross negligence, to harm to life, health or natural rights, or to consumer rights that cannot be limited or excluded by contract.",
      ],
    },
    {
      h: "5. Acceptable use",
      p: [
        "Only process content you have the necessary rights or permission for. You are responsible for the content you enter and for how you use the results.",
        "You must not use the tools for unlawful activity, to spread malicious code, to infringe the rights of others (including copyright and data protection), to create deceptive or hateful content, to circumvent technical limits, or for automated bulk load on the service.",
        "If you breach these terms, we may restrict or block access to the tools.",
      ],
    },
    {
      h: "6. Rights to content",
      p: [
        "Your files, texts and results remain yours. We acquire no rights to them except those necessary to process your request.",
        "The website, its design and the tools' code are legally protected; third-party components are subject to their own (open-source) licences.",
      ],
    },
    {
      h: "7. Personal data and cookies",
      p: [
        "Local tools do not process personal data. If input to a server-side or AI tool contains personal data, we process it solely to handle your request (Art. 6(1)(b) GDPR); AWS acts as our processor.",
        "We use essential browser storage (localStorage) for theme, language, favourite and recently used tools and to store your cookie choice. Anonymous traffic and speed measurement (Vercel Web Analytics and Speed Insights) runs only with your consent (“Accept all”). You can change your choice at any time via “Cookie settings” in the footer.",
        "You have the right to access, rectify and erase your personal data, to restrict processing and to object; send requests to info@vevit.cz. You may lodge a complaint with the Czech Office for Personal Data Protection (www.uoou.cz) or your local authority.",
      ],
    },
    {
      h: "8. Changes",
      p: [
        "We may change these terms, in particular when the tools, their processing or the law change. The current version with its effective date is always on this page; after a material change we will ask you to confirm again in the cookie banner.",
      ],
    },
    {
      h: "9. Final provisions",
      p: [
        "These terms are governed by Czech law. If you are a consumer, this does not affect the mandatory rights granted to you by the law of your country of residence.",
        "Consumers may resolve disputes out of court through the Czech Trade Inspection Authority (www.coi.cz).",
        "If any provision is invalid or ineffective, the remaining provisions remain in force.",
      ],
    },
  ],
};

export const termsFor = (locale: string): TermsDoc => (locale === "cs" || locale === "sk" ? CS : EN);
