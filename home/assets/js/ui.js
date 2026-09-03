// ui.js - UI komponenty, ikony, překlady

const UI = {
    values: {
        TOOLS_COUNT: '100+',
        ROADMAP_TOOLS_PROGRESS: 85,
        ROADMAP_EDU_PROGRESS: 30,
        ROADMAP_GAMES_PROGRESS: 10,
        ROADMAP_SERVICES_PROGRESS: 40,
        ROADMAP_ACCOUNT_PROGRESS: 90,
        ROADMAP_SEARCH_PROGRESS: 65,
        ROADMAP_STORE_PROGRESS: 30
    },

    icons: {
        Menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>',
        X: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>',
        Sun: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10" /></svg>',
        Moon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" /></svg>',
        Globe: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10" /></svg>',
        ChevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>',
        Check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>',
        Heart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>',
        Mail: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>',
        MessageSquare: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>',
        MapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>',
        Send: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>',
        Loader2: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>',
        CheckCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>',
        AlertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>',
        ExternalLink: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>',
        Copy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>',
        Download: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>',
        Share2: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>',
        ArrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>',
        Sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z" /></svg>',
        Lock: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>',
        Wrench: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>',
        Gamepad2: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="12" y2="12" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="15" x2="15.01" y1="13" y2="13" /><line x1="18" x2="18.01" y1="11" y2="11" /><rect width="20" height="12" x="2" y="6" rx="2" /></svg>',
        GraduationCap: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>',
        ShoppingBag: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>',
        Cpu: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg>',
        Github: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>',
        Instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>',
        Twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>',
        Layers: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></svg>',
        Code2: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>',
        Discord: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 4.4c-1.6-.7-3.3-1.2-5-1.5 0 0-.6 1.1-.8 2 0 0 0 0 0 0-1.8-.3-3.6-.3-5.4 0-.2-.9-.7-2-.7-2-1.7.3-3.4.8-5 1.5-3.3 4.8-4.2 9.5-3.7 14.1 2 1.5 4 2.4 5.9 3 .5-.6.9-1.3 1.2-2-.7-.2-1.4-.5-2.1-.9.2-.1.3-.3.5-.4 4.3 2 9 2 13.3 0 .2.1.3.3.5.4-.7.4-1.3.7-2.1.9.4.7.8 1.4 1.2 2 2-.6 4-1.5 5.9-3 .6-5-1.2-9.6-3.7-14.1zM8 15.3c-1.2 0-2.2-1.1-2.2-2.4 0-1.3 1-2.4 2.2-2.4 1.2 0 2.2 1.1 2.2 2.4 0 1.3-1 2.4-2.2 2.4zm8 0c-1.2 0-2.2-1.1-2.2-2.4 0-1.3 1-2.4 2.2-2.4 1.2 0 2.2 1.1 2.2 2.4 0 1.3-1 2.4-2.2 2.4z"/></svg>',
        Radio: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" /></svg>',
        Users: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>',
        Briefcase: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        ArrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
        Search: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
        Monitor: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
        Download: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
        Grid: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
        ChevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>'
    },

    translations: {
        cs: {
            nav: { home: 'Domů', apps: 'Aplikace', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'O VeVit', premium: 'Premium', contact: 'Kontakt', card: 'Vizitka', login: 'Přihlásit se', register: 'Zaregistrovat se' },
            appsDropdown: {
                header: 'Aplikace',
                webAppDesc: 'Online platforma',
                searchDesc: 'Vyhledávač',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Brzy'
            },
            hero: { welcome: 'VeVit na jednom místě', title1: 'Nástroje, hry', title2: 'a vzdělávání', description: 'VeVit spojuje online nástroje, hry, lekce a služby. Jednotlivé aplikace vyvíjíme a zveřejňujeme postupně.', explore: 'Zobrazit projekty', contact: 'Napsat nám', support: 'Podpořit na Ko-fi', stats: { users: 'Registrovaní uživatelé', games: 'Dostupné hry', tools: 'Online nástroje', lessons: 'Dostupné lekce' } },
            hub: { title: 'Aplikace VeVit', subtitle: 'Vyber si aplikaci podle toho, co právě potřebuješ.', status: { live: 'Online', earlyAccess: 'Early Access', comingSoon: 'Brzy', preparing: 'Připravuje se', opening: 'Otevíráme 1. 4. 2026' }, preparing: 'Připravuje se' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Kalkulačky, konvertory a generátory pro běžnou práci.', }, games: { title: 'VeVit Games', desc: 'Arkádové a logické hry pro krátkou pauzu.', }, edu: { title: 'VeVit Edu', desc: 'Lekce a kvízy zaměřené na programování, matematiku a jazyky.', }, services: { title: 'VeVit Services', desc: 'Poptávky a nabídky služeb pro firmy i jednotlivce.', }, store: { title: 'VeVit Store', desc: 'Digitální produkty a merch značky VeVit.', } },
            apps: { title: 'Desktopové aplikace připravujeme', subtitle: 'Až budou dostupné ke stažení, najdeš tady odkazy.', back: 'Zpět domů' },
            about: { title1: 'Kdo VeVit tvoří', title2: 'a proč vzniká?', p1: 'Jmenuji se Vít a VeVit vyvíjím ve volném čase.', p2: 'Chtěl jsem vytvořit nástroje a aplikace bez personalizovaných reklam a zbytečného sběru dat.', p3: 'VeVit teď nabízí {TOOLS_COUNT} nástrojů, 21+ her, 300+ lekcí, tržiště služeb a obchod.', features: { innovation: { title: 'Jeden vývojář', desc: 'Vývoj, obsah i rozhodování má na starosti jeden člověk.', }, quality: { title: 'Soubory zůstávají u vás', desc: 'Většina nástrojů zpracuje nahrané soubory přímo v prohlížeči.', }, ecosystem: { title: 'Společný účet', desc: 'VeVit Account postupně propojuje přihlášení a postup v jednotlivých aplikacích.', }, } },
            contact: { title: 'Napište nám', subtitle: 'Ozvěte se s dotazem, nápadem nebo nabídkou spolupráce.', connectTitle: 'Kontakt', socialsTitle: 'Sociální sítě', locationTitle: 'Země', locationVal: 'Česká republika', formTitle: 'Zpráva', form: { name: 'Jméno', email: 'E-mail', subject: 'Předmět', message: 'Zpráva', send: 'Odeslat zprávu', sending: 'Odesílám...', success: 'Zpráva byla odeslána.', error: 'Zprávu se nepodařilo odeslat.', fallback: 'Odeslat v e-mailové aplikaci', blockError: 'Prohlížeč automatické odeslání zablokoval. Použijte tlačítko výše.', emailCopied: 'E-mail {EMAIL} byl zkopírován.', emailCopyError: 'E-mail se nepodařilo zkopírovat. Adresa je {EMAIL}.', subjects: { general: 'Obecný dotaz', collab: 'Spolupráce', support: 'Podpora aplikací', bug: 'Nahlášení chyby', } } },
            footer: { projects: 'Projekty', company: 'O projektu', privacy: 'Ochrana soukromí', rights: 'Všechna práva vyhrazena.', madeWith: 'Vytvořeno s', inCz: 'v České republice.', desc: 'Nástroje, hry a vzdělávání od českého projektu.', },
            card: { role: 'Český digitální projekt', desc: 'Online nástroje, hry, lekce a služby.', save: 'Uložit kontakt', share: 'Sdílet', copied: 'Zkopírováno', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} nástrojů',
                    toolsMarquee: '{TOOLS_COUNT} NÁSTROJŮ',
                    toolsAvailable: 'Osm vybraných nástrojů z více než {TOOLS_COUNT} dostupných.',
                    toolsSearch: 'Jeden vyhledávač napříč všemi {TOOLS_COUNT} nástroji, hrami, lekcemi a dokumentací.'
                },
                roadmap: {
                    tools: { status: 'V betě', progress: '{ROADMAP_TOOLS_PROGRESS} % hotovo' },
                    edu: { status: 'V betě', progress: '{ROADMAP_EDU_PROGRESS} % hotovo' },
                    games: { status: 'Připravujeme', progress: '{ROADMAP_GAMES_PROGRESS} % hotovo' },
                    services: { status: 'Připravujeme', progress: '{ROADMAP_SERVICES_PROGRESS} % hotovo' },
                    account: { status: 'V betě', progress: '{ROADMAP_ACCOUNT_PROGRESS} % hotovo' },
                    search: { status: 'Připravujeme', progress: '{ROADMAP_SEARCH_PROGRESS} % hotovo' },
                    store: { status: 'V plánu', progress: '{ROADMAP_STORE_PROGRESS} % hotovo' }
                },
                services: {
                    navigation: 'Poptávky a nabídky služeb',
                    card: 'Zadej poptávku nebo nabídni vlastní službu. Třeba tvorbu webu, doučování, ilustraci nebo pomoc na zahradě.',
                    meta: 'POPTÁVKY · NABÍDKY · SLUŽBY',
                    roadmap: 'Připravujeme tržiště, kde půjde zadat poptávku nebo nabídnout vlastní službu.'
                },
                account: {
                    navigation: 'Registrace a přihlášení',
                    card: 'Na jednom místě se zaregistruješ a přihlásíš ke svému VeVit účtu. Můžeš použít heslo, Google, GitHub nebo Discord. Další funkce profilu připravujeme.',
                    roadmap: 'Registrace a přihlášení jsou v betě. Na XP profil, achievementy, levely a propojení aplikací dál pracujeme.'
                },
                premium: {
                    status: 'Připravujeme',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium připravujeme. Nech nám kontakt a dáme ti vědět, jakmile ho spustíme.',
                    notifyCta: 'Upozornit na spuštění',
                    notifyAria: 'Upozornit na spuštění VeVit Premium',
                    notifyMessage: 'Chci dostat zprávu, až spustíte VeVit Premium.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Další funkce pro pravidelné uživatele',
                yourPlan: 'Tvůj aktuální plán',
                select: 'Vybrat',
                perMonth: '/ měsíc',
                perYear: '/ rok (2 měsíce zdarma)',
                popular: 'Nejoblíbenější',
                profileFrame: 'Profilový rámeček',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP ze všech aktivit', 'Denní XP bonus: +50 XP', 'Odznak Bronze u profilu', 'Bronzový profilový rámeček', 'Stahování Edu článků', 'Prioritní email podpora'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP ze všech aktivit', 'Denní XP bonus: +150 XP', 'Odznak Silver u profilu', 'Stříbrný profilový rámeček', 'AI nástroje: 100 dotazů / měsíc', 'Silver Edu lekce', 'Zvýraznění inzerátu na Services'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP ze všech aktivit', 'Denní XP bonus: +400 XP', 'Odznak Gold u profilu', 'Zlatý profilový rámeček', 'AI nástroje: neomezeno', 'Inzerát na vrcholu Services', 'Veškerý Edu obsah', 'Podpora do 24 h'] },
                    platinum: { name: 'Platinum', badge: 'Pro firmy', benefits: ['×2.5 XP ze všech aktivit', 'Denní XP bonus: +1 000 XP', 'Odznak Platinum u profilu', 'Platinový profilový rámeček', 'AI nástroje: neomezeno + priorita', 'Inzerát vždy první na Services', 'Veškerý Edu obsah + certifikáty', 'Samostatný Discord kanál', 'Podpora do 4 h'] }
                }
            },
            page: {
                premium: { eyebrow: 'Prémiové členství' },
                nav: { webApps: 'Web apps', desktopApps: 'Desktop apps', services: 'Služby VeVit', aboutUs: 'O nás', ariaMain: 'Hlavní navigace', ariaOpen: 'Otevřít menu', ariaMobile: 'Mobilní navigace', ariaClose: 'Zavřít menu', badgeBeta: 'Beta' },
                navItem: { tools: 'Kalkulačky a nástroje', games: 'Hry s XP odměnami', edu: 'Lekce a kvízy', search: 'Univerzální vyhledávač', store: 'Merch a digitální produkty', browser: 'Náš webový prohlížeč', office: 'Kancelářský balík', studios: 'Software na míru', art: 'Platforma pro umělce' },
                hero: { eyebrow: 'Český digitální ekosystém', h1a: 'Nástroje, hry', h1b: 'a lekce.', h1c: 'Bez reklam.', sub: '21+ her a 300+ lekcí. Nástroje můžeš používat přímo v prohlížeči.', ctaTools: 'Otevřít Tools', ctaExplore: 'Prozkoumat ekosystém', metaTools: 'nástrojů', metaGames: 'her', metaLessons: 'lekcí', metaUsers: 'uživatelů' },
                soloNote: { eyebrow: 'O projektu', text: 'VeVit ve volném čase vyvíjí jeden člověk — Vít. Tools, Edu a Account běží v betě, zbytek ekosystému postupně přibývá.' },
                marquee: { games: '21+ HER', lessons: '300+ LEKCÍ', users: '1 200+ UŽIVATELŮ', noAds: 'BEZ REKLAM', local: 'VŠE LOKÁLNĚ V PROHLÍŽEČI', cz: 'POSTAVENO V ČR' },
                explore: { eyebrow: 'Více než web', title: 'Další projekty VeVit', subtitle: 'Vedle webových aplikací vyvíjíme software na míru a připravujeme platformu pro umělce.', studiosDesc: 'Vyvíjíme webové aplikace, interní systémy a integrace na míru firmám i jednotlivcům.', studiosTag: 'Software na míru', artDesc: 'VeVit Art připravujeme pro začínající umělce, kteří chtějí sdílet svou tvorbu.', artTag: 'Platforma pro umělce' },
                platforms: { eyebrow: 'Ekosystém', title: 'Webové aplikace', subtitle: 'Každá aplikace má vlastní zaměření. VeVit účet je postupně propojuje.', badgeBeta: 'Beta testing', toolsDesc: 'Kalkulačky, konvertory, generátory, PDF nástroje, AI pomocníci a dev utility. Nástroje běží lokálně v prohlížeči. Soubory nemusíš nahrávat na server.', gamesDesc: 'Připravujeme 21+ her, včetně Snake, Tetrisu, Pac-Mana a 2048.', gamesMeta: 'her na výběr', eduDesc: '300+ lekcí, kvízů a článků. Programování, matematika, jazyky.', eduMeta: 'lekcí zdarma', searchDesc: 'Univerzální vyhledávač přes celý VeVit ekosystém.', storeDesc: 'Oficiální merch, digitální produkty a Premium plány.' },
                toolsShowcase: { eyebrow: 'Výběr nástrojů', title: 'Nejnovější nástroje', recommended: 'Doporučeno', use: 'Použít', cat: { images: 'Obrázky', pdf: 'PDF', dev: 'Dev', security: 'Bezpečnost', text: 'Text' }, tools: [ { name: 'Odstranit pozadí', desc: 'Odstraní pozadí z fotografie pomocí AI.' }, { name: 'Komprese obrázku', desc: 'Zmenší obrázek a uloží ho jako JPEG nebo WebP.' }, { name: 'Komprese PDF', desc: 'Zmenší velikost PDF souboru.' }, { name: 'Sloučení PDF', desc: 'Sloučí více PDF souborů do jednoho.' }, { name: 'QR generátor', desc: 'Vytvoří QR kód pro text, odkaz, Wi-Fi nebo kontakt.' }, { name: 'JSON formátovač', desc: 'Formátuje a zkontroluje JSON strukturu.' }, { name: 'Generátor hesel', desc: 'Vytvoří bezpečné heslo podle zvolených pravidel.' }, { name: 'Překlad textu', desc: 'Přeloží text mezi vybranými jazyky pomocí AI.' } ] },
                why: { eyebrow: 'O VeVitu', title: 'Proč VeVit existuje', subtitle: 'VeVit stavíme podle šesti jednoduchých zásad.', cells: [ { title: 'Bez reklam', desc: 'Nepoužíváme personalizované reklamy ani sledovací pixely. Projekt financujeme přes Premium a Store.' }, { title: 'Nástroje na jednom místě', desc: 'Najdeš tu PDF nástroje, kalkulačky, konvertory, AI pomocníky i nástroje pro vývojáře.' }, { title: 'Postup, který je vidět', desc: 'Za používání aplikací můžeš získávat XP, levely a profilové odměny.' }, { title: 'Projekt jednoho vývojáře', desc: 'VeVit ve volném čase vyvíjí Vít. Jednotlivé aplikace vznikají postupně podle toho, co je připravené k použití.' }, { title: 'Čeština od začátku', desc: 'Rozhraní i podpora vznikají nejdřív v češtině. Další jazyky přidáváme postupně.' }, { title: 'Veřejná roadmapa', desc: 'Na této stránce najdeš aktuální stav aplikací a přehled toho, na čem pracujeme.' } ], timeline4: [ '2023 start', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (teď)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'Co chystáme', subtitle: 'Account, Tools a Edu jsou v betě. Ostatní aplikace dál připravujeme.', toolsDescA: 'Kalkulačky, konvertory, generátory, PDF nástroje a dev utility. Běží lokálně v prohlížeči na', eduDescA: 'Lekce, kvízy a články o programování, matematice a jazycích. Otevřená beta běží na', gamesDesc: 'Připravujeme 21+ her s XP odměnami, včetně Snake, Tetrisu, Pac-Mana a 2048.', storeDesc: 'Merch, digitální produkty, e-knihy a kurzy. Premium uživatelé mají 20 % slevu, faktury s DPH automaticky.', searchTitle: 'Univerzální Search', searchShortcut: 'Klávesová zkratka', searchShortcutTail: 'kdekoliv v ekosystému.' },
                kontakt: { socialsTitle: 'Sledujte nás', namePh: 'Vaše jméno', emailPh: 'vas@email.cz', msgPh: 'S čím vám můžeme pomoct?' },
                footer: { colPlatforms: 'Platformy', colAccount: 'Účet', colSupport: 'Podpora', linkGames: 'Hry', linkTools: 'Nástroje', linkEdu: 'Vzdělávání', linkServices: 'Služby', linkLogin: 'Přihlášení', linkRegister: 'Registrace', linkDashboard: 'Dashboard', linkContact: 'Kontakt', linkFaq: 'FAQ', linkSupport: 'Support', socialsAria: 'Sociální sítě', copy: 'Dělá Vít Vedral,', madeIn: 'Česko.' },
                mobile: { groupWebApps: 'Webové aplikace', groupServices: 'Služby VeVit', groupMore: 'Další' }
            }
        },
        en: {
            nav: { home: 'Home', apps: 'Apps', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'About', premium: 'Premium', contact: 'Contact', card: 'Card', login: 'Login', register: 'Register' },
            appsDropdown: {
                header: 'Apps',
                webAppDesc: 'Online platform',
                searchDesc: 'Search engine',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Soon'
            },
            hero: { welcome: 'VeVit in one place', title1: 'Tools, games', title2: 'and learning', description: 'VeVit brings together online tools, games, lessons, and services. We build and release each app step by step.', explore: 'View projects', contact: 'Contact us', support: 'Support us on Ko-fi', stats: { users: 'Registered users', games: 'Available games', tools: 'Online tools', lessons: 'Available lessons' } },
            hub: { title: 'VeVit apps', subtitle: 'Choose the app that fits what you need today.', status: { live: 'Online', earlyAccess: 'Early access', comingSoon: 'Coming soon', preparing: 'In development', opening: 'Opening 1 April 2026' }, preparing: 'In development' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Calculators, converters, and generators for everyday tasks.', }, games: { title: 'VeVit Games', desc: 'Arcade and puzzle games for a short break.', }, edu: { title: 'VeVit Edu', desc: 'Lessons and quizzes about programming, maths, and languages.', }, services: { title: 'VeVit Services', desc: 'A place to request a service or offer your own.', }, store: { title: 'VeVit Store', desc: 'Digital products and VeVit merchandise.', } },
            apps: { title: 'Desktop apps are in development', subtitle: 'Download links will appear here when the apps are ready.', back: 'Back home' },
            about: { title1: 'Who builds VeVit', title2: 'and why?', p1: 'My name is Vít, and I build VeVit in my spare time.', p2: 'I wanted tools and apps without personalised ads or unnecessary data collection.', p3: 'VeVit currently includes {TOOLS_COUNT} tools, 21+ games, 300+ lessons, a services marketplace, and a store.', features: { innovation: { title: 'One developer', desc: 'One person handles the development, content, and product decisions.', }, quality: { title: 'Your files stay with you', desc: 'Most tools process uploaded files directly in your browser.', }, ecosystem: { title: 'A shared account', desc: 'VeVit Account is gradually connecting sign-in and progress across the apps.', }, } },
            contact: { title: 'Contact us', subtitle: 'Write to us with a question, an idea, or a collaboration proposal.', connectTitle: 'Contact', socialsTitle: 'Social media', locationTitle: 'Country', locationVal: 'Czech Republic', formTitle: 'Message', form: { name: 'Name', email: 'Email', subject: 'Subject', message: 'Message', send: 'Send message', sending: 'Sending...', success: 'Your message was sent.', error: 'We could not send your message.', fallback: 'Open your email app', blockError: 'Your browser blocked automatic sending. Use the button above.', emailCopied: 'Email {EMAIL} was copied.', emailCopyError: 'We could not copy the email. The address is {EMAIL}.', subjects: { general: 'General question', collab: 'Collaboration', support: 'App support', bug: 'Report a bug', } } },
            footer: { projects: 'Projects', company: 'About', privacy: 'Privacy policy', rights: 'All rights reserved.', madeWith: 'Made with', inCz: 'in the Czech Republic.', desc: 'Tools, games, and learning from a Czech project.', },
            card: { role: 'Czech digital project', desc: 'Online tools, games, lessons, and services.', save: 'Save contact', share: 'Share', copied: 'Copied', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} tools',
                    toolsMarquee: '{TOOLS_COUNT} TOOLS',
                    toolsAvailable: 'Eight selected tools from more than {TOOLS_COUNT} available.',
                    toolsSearch: 'One search across all {TOOLS_COUNT} tools, games, lessons and docs.'
                },
                roadmap: {
                    tools: { status: 'In beta', progress: '{ROADMAP_TOOLS_PROGRESS} % done' },
                    edu: { status: 'In beta', progress: '{ROADMAP_EDU_PROGRESS} % done' },
                    games: { status: 'Coming soon', progress: '{ROADMAP_GAMES_PROGRESS} % done' },
                    services: { status: 'Coming soon', progress: '{ROADMAP_SERVICES_PROGRESS} % done' },
                    account: { status: 'In beta', progress: '{ROADMAP_ACCOUNT_PROGRESS} % done' },
                    search: { status: 'Coming soon', progress: '{ROADMAP_SEARCH_PROGRESS} % done' },
                    store: { status: 'Planned', progress: '{ROADMAP_STORE_PROGRESS} % done' }
                },
                services: {
                    navigation: 'Service requests and offers',
                    card: 'Request a service or offer your own — web design, tutoring, illustration or garden help.',
                    meta: 'REQUESTS · OFFERS · SERVICES',
                    roadmap: 'A marketplace to request or offer services is coming soon.'
                },
                account: {
                    navigation: 'Sign up and log in',
                    card: 'Register and sign in to your VeVit account in one place. Use a password, Google, GitHub or Discord. More profile features are coming.',
                    roadmap: 'Registration and login are in beta. XP profile, achievements, levels and app linking are in progress.'
                },
                premium: {
                    status: 'Coming soon',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium is coming. Leave your contact and we will let you know when it launches.',
                    notifyCta: 'Notify me at launch',
                    notifyAria: 'Notify me when VeVit Premium launches',
                    notifyMessage: 'I\'d like to hear when VeVit Premium launches.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Extra features for regular users',
                yourPlan: 'Your current plan',
                select: 'Select',
                perMonth: '/ month',
                perYear: '/ year (2 months free)',
                popular: 'Most Popular',
                profileFrame: 'Profile frame',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP from all activities', 'Daily XP bonus: +50 XP', 'Bronze badge on profile', 'Bronze profile frame', 'Edu articles download', 'Priority email support'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP from all activities', 'Daily XP bonus: +150 XP', 'Silver badge on profile', 'Silver profile frame', 'AI tools: 100 queries / month', 'Silver Edu lessons', 'Highlighted Services ad'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP from all activities', 'Daily XP bonus: +400 XP', 'Gold badge on profile', 'Gold profile frame', 'AI tools: unlimited', 'Ad at the top of Services', 'All Edu content', 'Support within 24h'] },
                    platinum: { name: 'Platinum', badge: 'For business', benefits: ['×2.5 XP from all activities', 'Daily XP bonus: +1,000 XP', 'Platinum badge on profile', 'Platinum profile frame', 'AI tools: unlimited + priority', 'Ad always first on Services', 'All Edu content + certificates', 'Separate Discord channel', 'Support within 4h'] }
                }
            },
            page: {
                premium: { eyebrow: 'Premium membership' },
                nav: { webApps: 'Web apps', desktopApps: 'Desktop apps', services: 'VeVit Services', aboutUs: 'About', ariaMain: 'Main navigation', ariaOpen: 'Open menu', ariaMobile: 'Mobile navigation', ariaClose: 'Close menu', badgeBeta: 'Beta' },
                navItem: { tools: 'Calculators and tools', games: 'Games with XP rewards', edu: 'Lessons and quizzes', search: 'Universal search', store: 'Merch and digital products', browser: 'Our web browser', office: 'Office suite', studios: 'Custom software', art: 'Platform for artists' },
                hero: { eyebrow: 'Czech digital ecosystem', h1a: 'Tools, games', h1b: 'and lessons.', h1c: 'No ads.', sub: '21+ games and 300+ lessons. Tools run right in your browser.', ctaTools: 'Open Tools', ctaExplore: 'Explore the ecosystem', metaTools: 'tools', metaGames: 'games', metaLessons: 'lessons', metaUsers: 'users' },
                soloNote: { eyebrow: 'About the project', text: 'VeVit is built in spare time by one person — Vít. Tools, Edu and Account are live or in beta; the rest of the ecosystem is being added gradually.' },
                marquee: { games: '21+ GAMES', lessons: '300+ LESSONS', users: '1,200+ USERS', noAds: 'NO ADS', local: 'ALL LOCAL IN THE BROWSER', cz: 'BUILT IN CZ' },
                explore: { eyebrow: 'More than the web', title: 'Other VeVit projects', subtitle: 'Beyond web apps, we build custom software and are preparing a platform for artists.', studiosDesc: 'We build web apps, internal systems and custom integrations for companies and individuals.', studiosTag: 'Custom software', artDesc: 'We are building VeVit Art for emerging artists who want to share their work.', artTag: 'Platform for artists' },
                platforms: { eyebrow: 'Ecosystem', title: 'Web apps', subtitle: 'Each app has its own focus. VeVit Account connects them over time.', badgeBeta: 'Beta testing', toolsDesc: 'Calculators, converters, generators, PDF tools, AI helpers and dev utilities. Tools run locally in your browser. No need to upload files.', gamesDesc: 'We are preparing 21+ games, including Snake, Tetris, Pac-Man and 2048.', gamesMeta: 'games to choose from', eduDesc: '300+ lessons, quizzes and articles. Programming, maths, languages.', eduMeta: 'free lessons', searchDesc: 'Universal search across the whole VeVit ecosystem.', storeDesc: 'Official merch, digital products and Premium plans.' },
                toolsShowcase: { eyebrow: 'Tool selection', title: 'Newest tools', recommended: 'Recommended', use: 'Use', cat: { images: 'Images', pdf: 'PDF', dev: 'Dev', security: 'Security', text: 'Text' }, tools: [ { name: 'Background remover', desc: 'Removes the background from a photo using AI.' }, { name: 'Image compression', desc: 'Shrinks an image and saves it as JPEG or WebP.' }, { name: 'PDF compression', desc: 'Reduces the size of a PDF file.' }, { name: 'PDF merge', desc: 'Merges several PDF files into one.' }, { name: 'QR generator', desc: 'Creates a QR code for text, a link, Wi-Fi or a contact.' }, { name: 'JSON formatter', desc: 'Formats and checks JSON structure.' }, { name: 'Password generator', desc: 'Creates a secure password by your chosen rules.' }, { name: 'Text translation', desc: 'Translates text between selected languages using AI.' } ] },
                why: { eyebrow: 'About VeVit', title: 'Why VeVit exists', subtitle: 'We build VeVit by six simple principles.', cells: [ { title: 'No ads', desc: 'We don\'t use personalised ads or tracking pixels. The project is funded by Premium and Store.' }, { title: 'Tools in one place', desc: 'PDF tools, calculators, converters, AI helpers and dev tools all here.' }, { title: 'Visible progress', desc: 'Using the apps earns you XP, levels and profile rewards.' }, { title: 'A one-developer project', desc: 'Vít develops VeVit in his spare time. Apps are released gradually as they are ready.' }, { title: 'Czech from the start', desc: 'The interface and support start in Czech. Other languages are added over time.' }, { title: 'Public roadmap', desc: 'On this page you find the current status of the apps and what we are working on.' } ], timeline4: [ '2023 start', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (now)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'What\'s next', subtitle: 'Account, Tools and Edu are in beta. The other apps are still in the works.', toolsDescA: 'Calculators, converters, generators, PDF tools and dev utilities. Run locally in the browser on', eduDescA: 'Lessons, quizzes and articles on programming, maths and languages. Open beta runs on', gamesDesc: 'We are preparing 21+ games with XP rewards, including Snake, Tetris, Pac-Man and 2048.', storeDesc: 'Merch, digital products, e-books and courses. Premium users get 20% off, invoices with VAT automatically.', searchTitle: 'Universal Search', searchShortcut: 'Keyboard shortcut', searchShortcutTail: 'anywhere in the ecosystem.' },
                kontakt: { socialsTitle: 'Follow us', namePh: 'Your name', emailPh: 'you@email.com', msgPh: 'How can we help?' },
                footer: { colPlatforms: 'Platforms', colAccount: 'Account', colSupport: 'Support', linkGames: 'Games', linkTools: 'Tools', linkEdu: 'Education', linkServices: 'Services', linkLogin: 'Log in', linkRegister: 'Register', linkDashboard: 'Dashboard', linkContact: 'Contact', linkFaq: 'FAQ', linkSupport: 'Support', socialsAria: 'Social media', copy: 'Made by Vít Vedral,', madeIn: 'Czechia.' },
                mobile: { groupWebApps: 'Web apps', groupServices: 'VeVit Services', groupMore: 'More' }
            }
        },
        es: {
            nav: { home: 'Inicio', apps: 'Aplicaciones', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'Sobre VeVit', premium: 'Premium', contact: 'Contacto', card: 'Tarjeta', login: 'Iniciar sesión', register: 'Registrarse' },
            appsDropdown: {
                header: 'Aplicaciones',
                webAppDesc: 'Plataforma online',
                searchDesc: 'Buscador',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Pronto'
            },
            hero: { welcome: 'VeVit en un solo lugar', title1: 'Herramientas, juegos', title2: 'y aprendizaje', description: 'VeVit reúne herramientas online, juegos, lecciones y servicios. Desarrollamos y publicamos cada aplicación paso a paso.', explore: 'Ver proyectos', contact: 'Escríbenos', support: 'Apóyanos en Ko-fi', stats: { users: 'Usuarios registrados', games: 'Juegos disponibles', tools: 'Herramientas online', lessons: 'Lecciones disponibles' } },
            hub: { title: 'Aplicaciones VeVit', subtitle: 'Elige la aplicación que necesites hoy.', status: { live: 'Online', earlyAccess: 'Acceso anticipado', comingSoon: 'Próximamente', preparing: 'En desarrollo', opening: 'Apertura el 1 de abril de 2026' }, preparing: 'En desarrollo' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Calculadoras, conversores y generadores para tareas cotidianas.', }, games: { title: 'VeVit Games', desc: 'Juegos arcade y de lógica para una pausa.', }, edu: { title: 'VeVit Edu', desc: 'Lecciones y cuestionarios de programación, matemáticas e idiomas.', }, services: { title: 'VeVit Services', desc: 'Un espacio para solicitar un servicio u ofrecer el tuyo.', }, store: { title: 'VeVit Store', desc: 'Productos digitales y artículos de VeVit.', } },
            apps: { title: 'Las aplicaciones de escritorio están en desarrollo', subtitle: 'Los enlaces de descarga aparecerán cuando estén listas.', back: 'Volver al inicio' },
            about: { title1: 'Quién crea VeVit', title2: 'y por qué?', p1: 'Me llamo Vít y desarrollo VeVit en mi tiempo libre.', p2: 'Quería crear herramientas y aplicaciones sin anuncios personalizados ni recopilación innecesaria de datos.', p3: 'VeVit incluye actualmente {TOOLS_COUNT} herramientas, 21+ juegos, 300+ lecciones, un mercado de servicios y una tienda.', features: { innovation: { title: 'Un desarrollador', desc: 'Una sola persona se ocupa del desarrollo, el contenido y las decisiones del producto.', }, quality: { title: 'Tus archivos se quedan contigo', desc: 'La mayoría de las herramientas procesan los archivos directamente en tu navegador.', }, ecosystem: { title: 'Una cuenta compartida', desc: 'VeVit Account conecta poco a poco el acceso y el progreso entre las aplicaciones.', }, } },
            contact: { title: 'Escríbenos', subtitle: 'Envíanos una pregunta, una idea o una propuesta de colaboración.', connectTitle: 'Contacto', socialsTitle: 'Redes sociales', locationTitle: 'País', locationVal: 'República Checa', formTitle: 'Mensaje', form: { name: 'Nombre', email: 'Correo electrónico', subject: 'Asunto', message: 'Mensaje', send: 'Enviar mensaje', sending: 'Enviando...', success: 'El mensaje se ha enviado.', error: 'No hemos podido enviar el mensaje.', fallback: 'Abrir la aplicación de correo', blockError: 'El navegador bloqueó el envío automático. Usa el botón de arriba.', emailCopied: 'Correo {EMAIL} copiado.', emailCopyError: 'No se pudo copiar el correo. La dirección es {EMAIL}.', subjects: { general: 'Pregunta general', collab: 'Colaboración', support: 'Soporte de aplicaciones', bug: 'Informar de un error', } } },
            footer: { projects: 'Proyectos', company: 'Acerca de', privacy: 'Política de privacidad', rights: 'Todos los derechos reservados.', madeWith: 'Hecho con', inCz: 'en la República Checa.', desc: 'Herramientas, juegos y aprendizaje de un proyecto checo.', },
            card: { role: 'Proyecto digital checo', desc: 'Herramientas online, juegos, lecciones y servicios.', save: 'Guardar contacto', share: 'Compartir', copied: 'Copiado', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} herramientas',
                    toolsMarquee: '{TOOLS_COUNT} HERRAMIENTAS',
                    toolsAvailable: 'Ocho herramientas seleccionadas de más de {TOOLS_COUNT} disponibles.',
                    toolsSearch: 'Un buscador para todos los {TOOLS_COUNT} herramientas, juegos, lecciones y documentación.'
                },
                roadmap: {
                    tools: { status: 'En beta', progress: '{ROADMAP_TOOLS_PROGRESS} % hecho' },
                    edu: { status: 'En beta', progress: '{ROADMAP_EDU_PROGRESS} % hecho' },
                    games: { status: 'Próximamente', progress: '{ROADMAP_GAMES_PROGRESS} % hecho' },
                    services: { status: 'Próximamente', progress: '{ROADMAP_SERVICES_PROGRESS} % hecho' },
                    account: { status: 'En beta', progress: '{ROADMAP_ACCOUNT_PROGRESS} % hecho' },
                    search: { status: 'Próximamente', progress: '{ROADMAP_SEARCH_PROGRESS} % hecho' },
                    store: { status: 'Planificado', progress: '{ROADMAP_STORE_PROGRESS} % hecho' }
                },
                services: {
                    navigation: 'Peticiones y ofertas de servicios',
                    card: 'Pide un servicio u ofrece el tuyo: diseño web, clases, ilustración o ayuda en el jardín.',
                    meta: 'PETICIONES · OFERTAS · SERVICIOS',
                    roadmap: 'Próximamente un mercado para pedir u ofrecer servicios.'
                },
                account: {
                    navigation: 'Registro e inicio de sesión',
                    card: 'Regístrate e inicia sesión en tu cuenta VeVit en un solo lugar. Usa contraseña, Google, GitHub o Discord. Más funciones de perfil en camino.',
                    roadmap: 'El registro y el inicio de sesión están en beta. Trabajamos en el perfil XP, logros, niveles y conexión de aplicaciones.'
                },
                premium: {
                    status: 'Próximamente',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium está en preparación. Déjanos tu contacto y te avisamos cuando se lance.',
                    notifyCta: 'Avísame al lanzar',
                    notifyAria: 'Avísame cuando se lance VeVit Premium',
                    notifyMessage: 'Quiero que me avisen cuando lancéis VeVit Premium.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Funciones adicionales para usuarios habituales',
                yourPlan: 'Tu plan actual',
                select: 'Seleccionar',
                perMonth: '/ mes',
                perYear: '/ año (2 meses gratis)',
                popular: 'Más Popular',
                profileFrame: 'Marco de perfil',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP de todas las actividades', 'Bonus XP diario: +50 XP', 'Insignia Bronze en perfil', 'Marco de perfil bronce', 'Descarga de artículos Edu', 'Soporte por email prioritario'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP de todas las actividades', 'Bonus XP diario: +150 XP', 'Insignia Silver en perfil', 'Marco de perfil plateado', 'Herramientas IA: 100 consultas/mes', 'Lecciones Edu Silver', 'Anuncio destacado en Services'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP de todas las actividades', 'Bonus XP diario: +400 XP', 'Insignia Gold en perfil', 'Marco de perfil dorado', 'Herramientas IA: ilimitado', 'Anuncio en la parte superior de Services', 'Todo el contenido Edu', 'Soporte en 24 horas'] },
                    platinum: { name: 'Platinum', badge: 'Para empresas', benefits: ['×2.5 XP de todas las actividades', 'Bonus XP diario: +1,000 XP', 'Insignia Platinum', 'Marco de perfil platino', 'Herramientas IA: ilimitado + prioridad', 'Anuncio siempre primero en Services', 'Todo contenido Edu + certificados', 'Canal de Discord separado', 'Soporte en 4 horas'] }
                }
            },
            page: {
                premium: { eyebrow: 'Membresía premium' },
                nav: { webApps: 'Web apps', desktopApps: 'Apps de escritorio', services: 'VeVit Services', aboutUs: 'Sobre nosotros', ariaMain: 'Navegación principal', ariaOpen: 'Abrir menú', ariaMobile: 'Navegación móvil', ariaClose: 'Cerrar menú', badgeBeta: 'Beta' },
                navItem: { tools: 'Calculadoras y herramientas', games: 'Juegos con recompensas XP', edu: 'Lecciones y cuestionarios', search: 'Búsqueda universal', store: 'Merch y productos digitales', browser: 'Nuestro navegador web', office: 'Paquete ofimático', studios: 'Software a medida', art: 'Plataforma para artistas' },
                hero: { eyebrow: 'Ecosistema digital checo', h1a: 'Herramientas, juegos', h1b: 'y lecciones.', h1c: 'Sin anuncios.', sub: '21+ juegos y 300+ lecciones. Las herramientas funcionan directamente en el navegador.', ctaTools: 'Abrir Tools', ctaExplore: 'Explorar el ecosistema', metaTools: 'herramientas', metaGames: 'juegos', metaLessons: 'lecciones', metaUsers: 'usuarios' },
                soloNote: { eyebrow: 'Sobre el proyecto', text: 'VeVit lo desarrolla en su tiempo libre una sola persona: Vít. Tools, Edu y Account están activos o en beta; el resto del ecosistema se añade poco a poco.' },
                marquee: { games: '21+ JUEGOS', lessons: '300+ LECCIONES', users: '1.200+ USUARIOS', noAds: 'SIN ANUNCIOS', local: 'TODO LOCAL EN EL NAVEGADOR', cz: 'HECHO EN CZ' },
                explore: { eyebrow: 'Más que la web', title: 'Otros proyectos VeVit', subtitle: 'Además de las apps web, desarrollamos software a medida y preparamos una plataforma para artistas.', studiosDesc: 'Desarrollamos apps web, sistemas internos e integraciones a medida para empresas e individuos.', studiosTag: 'Software a medida', artDesc: 'Preparamos VeVit Art para artistas emergentes que quieren compartir su obra.', artTag: 'Plataforma para artistas' },
                platforms: { eyebrow: 'Ecosistema', title: 'Apps web', subtitle: 'Cada app tiene su propio enfoque. VeVit Account las conecta poco a poco.', badgeBeta: 'Pruebas beta', toolsDesc: 'Calculadoras, conversores, generadores, herramientas PDF, asistentes de IA y utilidades dev. Las herramientas funcionan localmente en el navegador. No hace falta subir archivos.', gamesDesc: 'Preparamos 21+ juegos, incluidos Snake, Tetris, Pac-Man y 2048.', gamesMeta: 'juegos disponibles', eduDesc: '300+ lecciones, cuestionarios y artículos. Programación, matemáticas, idiomas.', eduMeta: 'lecciones gratis', searchDesc: 'Búsqueda universal en todo el ecosistema VeVit.', storeDesc: 'Merch oficial, productos digitales y planes Premium.' },
                toolsShowcase: { eyebrow: 'Selección de herramientas', title: 'Herramientas más recientes', recommended: 'Recomendado', use: 'Usar', cat: { images: 'Imágenes', pdf: 'PDF', dev: 'Dev', security: 'Seguridad', text: 'Texto' }, tools: [ { name: 'Quitar fondo', desc: 'Quita el fondo de una foto con IA.' }, { name: 'Compresión de imagen', desc: 'Reduce una imagen y la guarda como JPEG o WebP.' }, { name: 'Compresión PDF', desc: 'Reduce el tamaño de un archivo PDF.' }, { name: 'Fusionar PDF', desc: 'Fusiona varios archivos PDF en uno.' }, { name: 'Generador QR', desc: 'Crea un código QR para texto, enlace, Wi-Fi o contacto.' }, { name: 'Formateador JSON', desc: 'Formatea y comprueba la estructura JSON.' }, { name: 'Generador de contraseñas', desc: 'Crea una contraseña segura según las reglas que elijas.' }, { name: 'Traducción de texto', desc: 'Traduce texto entre los idiomas seleccionados con IA.' } ] },
                why: { eyebrow: 'Sobre VeVit', title: 'Por qué existe VeVit', subtitle: 'Construimos VeVit con seis principios sencillos.', cells: [ { title: 'Sin anuncios', desc: 'No usamos anuncios personalizados ni píxeles de rastreo. El proyecto se financia con Premium y Store.' }, { title: 'Herramientas en un solo lugar', desc: 'Herramientas PDF, calculadoras, conversores, asistentes de IA y herramientas para devs.' }, { title: 'Progreso visible', desc: 'Usar las apps te da XP, niveles y recompensas de perfil.' }, { title: 'Proyecto de un desarrollador', desc: 'Vít desarrolla VeVit en su tiempo libre. Las apps se publican poco a poco según están listas.' }, { title: 'Checo desde el principio', desc: 'La interfaz y el soporte nacen primero en checo. Otros idiomas se añaden poco a poco.' }, { title: 'Hoja de ruta pública', desc: 'En esta página encuentras el estado actual de las apps y en qué trabajamos.' } ], timeline4: [ '2023 inicio', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (ahora)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'Lo que viene', subtitle: 'Account, Tools y Edu están en beta. Seguimos preparando las demás.', toolsDescA: 'Calculadoras, conversores, generadores, herramientas PDF y utilidades dev. Funcionan localmente en el navegador en', eduDescA: 'Lecciones, cuestionarios y artículos sobre programación, matemáticas e idiomas. La beta abierta funciona en', gamesDesc: 'Preparamos 21+ juegos con recompensas XP, incluidos Snake, Tetris, Pac-Man y 2048.', storeDesc: 'Merch, productos digitales, e-books y cursos. Los usuarios Premium tienen 20 % de descuento, facturas con IVA automáticamente.', searchTitle: 'Search universal', searchShortcut: 'Atajo de teclado', searchShortcutTail: 'en cualquier lugar del ecosistema.' },
                kontakt: { socialsTitle: 'Síguenos', namePh: 'Tu nombre', emailPh: 'tu@email.cz', msgPh: '¿En qué podemos ayudarte?' },
                footer: { colPlatforms: 'Plataformas', colAccount: 'Cuenta', colSupport: 'Soporte', linkGames: 'Juegos', linkTools: 'Herramientas', linkEdu: 'Educación', linkServices: 'Servicios', linkLogin: 'Inicio de sesión', linkRegister: 'Registro', linkDashboard: 'Panel', linkContact: 'Contacto', linkFaq: 'FAQ', linkSupport: 'Soporte', socialsAria: 'Redes sociales', copy: 'Hecho por Vít Vedral,', madeIn: 'Chequia.' },
                mobile: { groupWebApps: 'Apps web', groupServices: 'VeVit Services', groupMore: 'Más' }
            }
        },
        de: {
            nav: { home: 'Startseite', apps: 'Apps', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'Über VeVit', premium: 'Premium', contact: 'Kontakt', card: 'Karte', login: 'Anmelden', register: 'Registrieren' },
            appsDropdown: {
                header: 'Apps',
                webAppDesc: 'Online-Plattform',
                searchDesc: 'Suchmaschine',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Bald'
            },
            hero: { welcome: 'VeVit an einem Ort', title1: 'Tools, Spiele', title2: 'und Lernen', description: 'VeVit verbindet Online-Tools, Spiele, Lektionen und Dienstleistungen. Wir entwickeln und veröffentlichen jede App Schritt für Schritt.', explore: 'Projekte ansehen', contact: 'Kontakt aufnehmen', support: 'Auf Ko-fi unterstützen', stats: { users: 'Registrierte Nutzer', games: 'Verfügbare Spiele', tools: 'Online-Tools', lessons: 'Verfügbare Lektionen' } },
            hub: { title: 'VeVit Apps', subtitle: 'Wählen Sie die App, die Sie heute brauchen.', status: { live: 'Online', earlyAccess: 'Früher Zugang', comingSoon: 'Demnächst', preparing: 'In Entwicklung', opening: 'Start am 1. April 2026' }, preparing: 'In Entwicklung' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Rechner, Konverter und Generatoren für alltägliche Aufgaben.', }, games: { title: 'VeVit Games', desc: 'Arcade- und Logikspiele für eine kurze Pause.', }, edu: { title: 'VeVit Edu', desc: 'Lektionen und Quizze zu Programmierung, Mathematik und Sprachen.', }, services: { title: 'VeVit Services', desc: 'Ein Ort für Serviceanfragen und eigene Angebote.', }, store: { title: 'VeVit Store', desc: 'Digitale Produkte und VeVit-Merchandise.', } },
            apps: { title: 'Desktop-Apps sind in Entwicklung', subtitle: 'Download-Links erscheinen hier, sobald die Apps bereit sind.', back: 'Zurück zur Startseite' },
            about: { title1: 'Wer VeVit entwickelt', title2: 'und warum?', p1: 'Ich heiße Vít und entwickle VeVit in meiner Freizeit.', p2: 'Ich wollte Tools und Apps ohne personalisierte Werbung und unnötige Datensammlung bauen.', p3: 'VeVit umfasst derzeit {TOOLS_COUNT} Tools, 21+ Spiele, 300+ Lektionen, einen Service-Marktplatz und einen Shop.', features: { innovation: { title: 'Ein Entwickler', desc: 'Eine Person kümmert sich um Entwicklung, Inhalte und Produktentscheidungen.', }, quality: { title: 'Ihre Dateien bleiben bei Ihnen', desc: 'Die meisten Tools verarbeiten hochgeladene Dateien direkt im Browser.', }, ecosystem: { title: 'Ein gemeinsames Konto', desc: 'VeVit Account verbindet nach und nach Anmeldung und Fortschritt in den Apps.', }, } },
            contact: { title: 'Kontakt aufnehmen', subtitle: 'Schreiben Sie uns mit einer Frage, einer Idee oder einem Vorschlag zur Zusammenarbeit.', connectTitle: 'Kontakt', socialsTitle: 'Soziale Medien', locationTitle: 'Land', locationVal: 'Tschechische Republik', formTitle: 'Nachricht', form: { name: 'Name', email: 'E-Mail', subject: 'Betreff', message: 'Nachricht', send: 'Nachricht senden', sending: 'Wird gesendet...', success: 'Die Nachricht wurde gesendet.', error: 'Die Nachricht konnte nicht gesendet werden.', fallback: 'E-Mail-App öffnen', blockError: 'Der Browser hat den automatischen Versand blockiert. Verwenden Sie die Schaltfläche oben.', emailCopied: 'E-Mail {EMAIL} wurde kopiert.', emailCopyError: 'E-Mail konnte nicht kopiert werden. Die Adresse lautet {EMAIL}.', subjects: { general: 'Allgemeine Frage', collab: 'Zusammenarbeit', support: 'App-Support', bug: 'Fehler melden', } } },
            footer: { projects: 'Projekte', company: 'Über das Projekt', privacy: 'Datenschutz', rights: 'Alle Rechte vorbehalten.', madeWith: 'Erstellt mit', inCz: 'in der Tschechischen Republik.', desc: 'Tools, Spiele und Lernen aus einem tschechischen Projekt.', },
            card: { role: 'Tschechisches Digitalprojekt', desc: 'Online-Tools, Spiele, Lektionen und Dienstleistungen.', save: 'Kontakt speichern', share: 'Teilen', copied: 'Kopiert', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} Tools',
                    toolsMarquee: '{TOOLS_COUNT} TOOLS',
                    toolsAvailable: 'Acht ausgewählte Tools aus mehr als {TOOLS_COUNT} verfügbaren.',
                    toolsSearch: 'Eine Suche über alle {TOOLS_COUNT} Tools, Spiele, Lektionen und Dokumentation.'
                },
                roadmap: {
                    tools: { status: 'In Beta', progress: '{ROADMAP_TOOLS_PROGRESS} % fertig' },
                    edu: { status: 'In Beta', progress: '{ROADMAP_EDU_PROGRESS} % fertig' },
                    games: { status: 'Demnächst', progress: '{ROADMAP_GAMES_PROGRESS} % fertig' },
                    services: { status: 'Demnächst', progress: '{ROADMAP_SERVICES_PROGRESS} % fertig' },
                    account: { status: 'In Beta', progress: '{ROADMAP_ACCOUNT_PROGRESS} % fertig' },
                    search: { status: 'Demnächst', progress: '{ROADMAP_SEARCH_PROGRESS} % fertig' },
                    store: { status: 'Geplant', progress: '{ROADMAP_STORE_PROGRESS} % fertig' }
                },
                services: {
                    navigation: 'Serviceanfragen und -angebote',
                    card: 'Fordern Sie einen Service an oder bieten Sie Ihren eigenen — Webdesign, Nachhilfe, Illustration oder Gartenhilfe.',
                    meta: 'ANFRAGEN · ANGEBOTE · SERVICES',
                    roadmap: 'Ein Marktplatz für Serviceanfragen und -angebote ist in Vorbereitung.'
                },
                account: {
                    navigation: 'Registrierung und Anmeldung',
                    card: 'Registrieren und anmelden Sie sich an einem Ort bei Ihrem VeVit-Konto. Passwort, Google, GitHub oder Discord. Weitere Profilfunktionen folgen.',
                    roadmap: 'Registrierung und Anmeldung sind in Beta. XP-Profil, Abzeichen, Level und App-Verknüpfung sind in Arbeit.'
                },
                premium: {
                    status: 'Demnächst',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium ist in Vorbereitung. Hinterlassen Sie Ihren Kontakt und wir benachrichtigen Sie beim Start.',
                    notifyCta: 'Beim Start benachrichtigen',
                    notifyAria: 'Beim Start von VeVit Premium benachrichtigen',
                    notifyMessage: 'Ich möchte informiert werden, wenn VeVit Premium startet.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Zusätzliche Funktionen für regelmäßige Nutzer',
                yourPlan: 'Dein aktueller Plan',
                select: 'Auswählen',
                perMonth: '/ Monat',
                perYear: '/ Jahr (2 Monate gratis)',
                popular: 'Beliebteste',
                profileFrame: 'Profilrahmen',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP aus allen Aktivitäten', 'Täglicher XP-Bonus: +50 XP', 'Bronze-Abzeichen im Profil', 'Bronze-Profilrahmen', 'Edu-Artikel herunterladen', 'Priorisierter E-Mail-Support'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP aus allen Aktivitäten', 'Täglicher XP-Bonus: +150 XP', 'Silver-Abzeichen im Profil', 'Silber-Profilrahmen', 'KI-Tools: 100 Anfragen/Monat', 'Silver Edu-Lektionen', 'Hervorgehobene Services-Anzeige'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP aus allen Aktivitäten', 'Täglicher XP-Bonus: +400 XP', 'Gold-Abzeichen im Profil', 'Gold-Profilrahmen', 'KI-Tools: unbegrenzt', 'Anzeige oben in Services', 'Alle Edu-Inhalte', 'Support in 24 Stunden'] },
                    platinum: { name: 'Platinum', badge: 'Für Firmen', benefits: ['×2.5 XP aus allen Aktivitäten', 'Täglicher XP-Bonus: +1.000 XP', 'Platinum-Abzeichen', 'Platin-Profilrahmen', 'KI-Tools: unbegrenzt + Priorität', 'Anzeige immer zuerst in Services', 'Alle Edu-Inhalte + Zertifikate', 'Separater Discord-Kanal', 'Support in 4 Stunden'] }
                }
            },
            page: {
                premium: { eyebrow: 'Premium-Mitgliedschaft' },
                nav: { webApps: 'Web apps', desktopApps: 'Desktop-Apps', services: 'VeVit Services', aboutUs: 'Über uns', ariaMain: 'Hauptnavigation', ariaOpen: 'Menü öffnen', ariaMobile: 'Mobile Navigation', ariaClose: 'Menü schließen', badgeBeta: 'Beta' },
                navItem: { tools: 'Rechner und Werkzeuge', games: 'Spiele mit XP-Belohnungen', edu: 'Lektionen und Quiz', search: 'Universelle Suche', store: 'Merch und digitale Produkte', browser: 'Unser Webbrowser', office: 'Office-Paket', studios: 'Maßgeschneiderte Software', art: 'Plattform für Künstler' },
                hero: { eyebrow: 'Tschechisches digitales Ökosystem', h1a: 'Tools, Spiele', h1b: 'und Lektionen.', h1c: 'Ohne Werbung.', sub: '21+ Spiele und 300+ Lektionen. Tools laufen direkt im Browser.', ctaTools: 'Tools öffnen', ctaExplore: 'Ökosystem entdecken', metaTools: 'Tools', metaGames: 'Spiele', metaLessons: 'Lektionen', metaUsers: 'Nutzer' },
                soloNote: { eyebrow: 'Über das Projekt', text: 'VeVit wird in der Freizeit von einer Person entwickelt — Vít. Tools, Edu und Account laufen oder sind in der Beta-Phase, der Rest des Ökosystems entsteht nach und nach.' },
                marquee: { games: '21+ SPIELE', lessons: '300+ LEKTIONEN', users: '1.200+ NUTZER', noAds: 'OHNE WERBUNG', local: 'ALLES LOKAL IM BROWSER', cz: 'IN CZ GEMACHT' },
                explore: { eyebrow: 'Mehr als das Web', title: 'Weitere VeVit-Projekte', subtitle: 'Neben Web-Apps entwickeln wir maßgeschneiderte Software und bereiten eine Plattform für Künstler vor.', studiosDesc: 'Wir entwickeln Web-Apps, interne Systeme und maßgeschneiderte Integrationen für Firmen und Einzelpersonen.', studiosTag: 'Maßgeschneiderte Software', artDesc: 'VeVit Art bereiten wir für aufstrebende Künstler vor, die ihre Arbeit teilen möchten.', artTag: 'Plattform für Künstler' },
                platforms: { eyebrow: 'Ökosystem', title: 'Web-Apps', subtitle: 'Jede App hat ihren eigenen Fokus. VeVit Account verbindet sie nach und nach.', badgeBeta: 'Beta-Testphase', toolsDesc: 'Rechner, Konverter, Generatoren, PDF-Tools, AI-Helfer und Dev-Werkzeuge. Tools laufen lokal im Browser. Dateien musst du nicht hochladen.', gamesDesc: 'Wir bereiten 21+ Spiele vor, darunter Snake, Tetris, Pac-Man und 2048.', gamesMeta: 'Spiele zur Auswahl', eduDesc: '300+ Lektionen, Quiz und Artikel. Programmierung, Mathematik, Sprachen.', eduMeta: 'Lektionen kostenlos', searchDesc: 'Universelle Suche über das gesamte VeVit-Ökosystem.', storeDesc: 'Offizieller Merch, digitale Produkte und Premium-Pläne.' },
                toolsShowcase: { eyebrow: 'Werkzeugauswahl', title: 'Neueste Tools', recommended: 'Empfohlen', use: 'Verwenden', cat: { images: 'Bilder', pdf: 'PDF', dev: 'Dev', security: 'Sicherheit', text: 'Text' }, tools: [ { name: 'Hintergrund entfernen', desc: 'Entfernt den Hintergrund aus einem Foto mit AI.' }, { name: 'Bildkompression', desc: 'Verkleinert ein Bild und speichert es als JPEG oder WebP.' }, { name: 'PDF-Kompression', desc: 'Verkleinert die Größe einer PDF-Datei.' }, { name: 'PDF zusammenführen', desc: 'Führt mehrere PDF-Dateien zusammen.' }, { name: 'QR-Generator', desc: 'Erstellt einen QR-Code für Text, Link, WLAN oder Kontakt.' }, { name: 'JSON-Formatierer', desc: 'Formatiert und prüft die JSON-Struktur.' }, { name: 'Passwort-Generator', desc: 'Erstellt ein sicheres Passwort nach deinen Regeln.' }, { name: 'Text übersetzen', desc: 'Übersetzt Text zwischen ausgewählten Sprachen mit AI.' } ] },
                why: { eyebrow: 'Über VeVit', title: 'Warum es VeVit gibt', subtitle: 'Wir bauen VeVit nach sechs einfachen Grundsätzen.', cells: [ { title: 'Keine Werbung', desc: 'Wir nutzen keine personalisierte Werbung oder Tracking-Pixel. Das Projekt finanzieren wir über Premium und Store.' }, { title: 'Tools an einem Ort', desc: 'PDF-Tools, Rechner, Konverter, AI-Helfer und Dev-Werkzeuge hier.' }, { title: 'Sichtbarer Fortschritt', desc: 'Durch die Nutzung der Apps verdienst du XP, Level und Profil-Belohnungen.' }, { title: 'Ein Entwickler-Projekt', desc: 'Vít entwickelt VeVit in seiner Freizeit. Apps entstehen Schritt für Schritt, wenn sie bereit sind.' }, { title: 'Tschechisch von Anfang an', desc: 'Oberfläche und Support entstehen zuerst auf Tschechisch. Weitere Sprachen kommen nach und nach.' }, { title: 'Öffentliche Roadmap', desc: 'Auf dieser Seite findest du den aktuellen Stand der Apps und woran wir arbeiten.' } ], timeline4: [ '2023 Start', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (jetzt)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'Was wir planen', subtitle: 'Account, Tools und Edu sind in der Beta. Die anderen Apps bereiten wir weiter vor.', toolsDescA: 'Rechner, Konverter, Generatoren, PDF-Tools und Dev-Werkzeuge. Laufen lokal im Browser auf', eduDescA: 'Lektionen, Quiz und Artikel zu Programmierung, Mathematik und Sprachen. Offene Beta läuft auf', gamesDesc: 'Wir bereiten 21+ Spiele mit XP-Belohnungen vor, darunter Snake, Tetris, Pac-Man und 2048.', storeDesc: 'Merch, digitale Produkte, E-Books und Kurse. Premium-Nutzer erhalten 20 % Rabatt, Rechnungen mit MwSt. automatisch.', searchTitle: 'Universelle Search', searchShortcut: 'Tastenkombination', searchShortcutTail: 'überall im Ökosystem.' },
                kontakt: { socialsTitle: 'Folge uns', namePh: 'Dein Name', emailPh: 'du@email.cz', msgPh: 'Wie können wir helfen?' },
                footer: { colPlatforms: 'Plattformen', colAccount: 'Konto', colSupport: 'Support', linkGames: 'Spiele', linkTools: 'Tools', linkEdu: 'Bildung', linkServices: 'Dienste', linkLogin: 'Anmeldung', linkRegister: 'Registrierung', linkDashboard: 'Dashboard', linkContact: 'Kontakt', linkFaq: 'FAQ', linkSupport: 'Support', socialsAria: 'Soziale Netzwerke', copy: 'Gemacht von Vít Vedral,', madeIn: 'Tschechien.' },
                mobile: { groupWebApps: 'Web-Apps', groupServices: 'VeVit Services', groupMore: 'Mehr' }
            }
        },
        uk: {
            nav: { home: 'Головна', apps: 'Додатки', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'Про VeVit', premium: 'Premium', contact: 'Контакти', card: 'Візитка', login: 'Увійти', register: 'Зареєструватися' },
            appsDropdown: {
                header: 'Додатки',
                webAppDesc: 'Онлайн платформа',
                searchDesc: 'Пошукова система',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Скоро'
            },
            hero: { welcome: 'VeVit в одному місці', title1: 'Інструменти, ігри', title2: 'та навчання', description: 'VeVit об’єднує онлайн-інструменти, ігри, уроки та послуги. Кожен застосунок ми розробляємо й публікуємо поступово.', explore: 'Переглянути проєкти', contact: 'Написати нам', support: 'Підтримати на Ko-fi', stats: { users: 'Зареєстровані користувачі', games: 'Доступні ігри', tools: 'Онлайн-інструменти', lessons: 'Доступні уроки' } },
            hub: { title: 'Застосунки VeVit', subtitle: 'Оберіть застосунок для поточного завдання.', status: { live: 'Онлайн', earlyAccess: 'Ранній доступ', comingSoon: 'Незабаром', preparing: 'У розробці', opening: 'Відкриття 1 квітня 2026 року' }, preparing: 'У розробці' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Калькулятори, конвертери та генератори для щоденних завдань.', }, games: { title: 'VeVit Games', desc: 'Аркадні та логічні ігри для короткої перерви.', }, edu: { title: 'VeVit Edu', desc: 'Уроки та тести з програмування, математики й мов.', }, services: { title: 'VeVit Services', desc: 'Місце для запитів на послуги та власних пропозицій.', }, store: { title: 'VeVit Store', desc: 'Цифрові продукти та мерч VeVit.', } },
            apps: { title: 'Десктопні застосунки в розробці', subtitle: 'Посилання для завантаження з’являться, коли застосунки будуть готові.', back: 'На головну' },
            about: { title1: 'Хто створює VeVit', title2: 'і навіщо?', p1: 'Мене звати Віт, і я розробляю VeVit у вільний час.', p2: 'Я хотів створити інструменти й застосунки без персоналізованої реклами та зайвого збору даних.', p3: 'Зараз VeVit містить {TOOLS_COUNT} інструментів, 21+ ігор, 300+ уроків, ринок послуг і магазин.', features: { innovation: { title: 'Один розробник', desc: 'Одна людина відповідає за розробку, контент і продуктові рішення.', }, quality: { title: 'Ваші файли залишаються у вас', desc: 'Більшість інструментів обробляє завантажені файли безпосередньо в браузері.', }, ecosystem: { title: 'Спільний обліковий запис', desc: 'VeVit Account поступово поєднує вхід і прогрес у різних застосунках.', }, } },
            contact: { title: 'Напишіть нам', subtitle: 'Надішліть запитання, ідею або пропозицію співпраці.', connectTitle: 'Контакт', socialsTitle: 'Соціальні мережі', locationTitle: 'Країна', locationVal: 'Чеська Республіка', formTitle: 'Повідомлення', form: { name: 'Ім\'я', email: 'Електронна пошта', subject: 'Тема', message: 'Повідомлення', send: 'Надіслати', sending: 'Надсилаємо...', success: 'Повідомлення надіслано.', error: 'Не вдалося надіслати повідомлення.', fallback: 'Відкрити поштовий застосунок', blockError: 'Браузер заблокував автоматичне надсилання. Скористайтеся кнопкою вище.', emailCopied: 'Електронну пошту {EMAIL} скопійовано.', emailCopyError: 'Не вдалося скопіювати ел. пошту. Адреса: {EMAIL}.', subjects: { general: 'Загальне запитання', collab: 'Співпраця', support: 'Підтримка застосунків', bug: 'Повідомити про помилку', } } },
            footer: { projects: 'Проєкти', company: 'Про проєкт', privacy: 'Конфіденційність', rights: 'Усі права захищено.', madeWith: 'Створено з', inCz: 'у Чеській Республіці.', desc: 'Інструменти, ігри та навчання від чеського проєкту.', },
            card: { role: 'Чеський цифровий проєкт', desc: 'Онлайн-інструменти, ігри, уроки та послуги.', save: 'Зберегти контакт', share: 'Поділитися', copied: 'Скопійовано', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} інструментів',
                    toolsMarquee: '{TOOLS_COUNT} ІНСТРУМЕНТІВ',
                    toolsAvailable: 'Вісім обраних інструментів із понад {TOOLS_COUNT} доступних.',
                    toolsSearch: 'Один пошук усіма {TOOLS_COUNT} інструментами, іграми, уроками та документацією.'
                },
                roadmap: {
                    tools: { status: 'У бета-версії', progress: '{ROADMAP_TOOLS_PROGRESS} % готово' },
                    edu: { status: 'У бета-версії', progress: '{ROADMAP_EDU_PROGRESS} % готово' },
                    games: { status: 'Незабаром', progress: '{ROADMAP_GAMES_PROGRESS} % готово' },
                    services: { status: 'Незабаром', progress: '{ROADMAP_SERVICES_PROGRESS} % готово' },
                    account: { status: 'У бета-версії', progress: '{ROADMAP_ACCOUNT_PROGRESS} % готово' },
                    search: { status: 'Незабаром', progress: '{ROADMAP_SEARCH_PROGRESS} % готово' },
                    store: { status: 'У планах', progress: '{ROADMAP_STORE_PROGRESS} % готово' }
                },
                services: {
                    navigation: 'Запити та пропозиції послуг',
                    card: 'Залиште запит на послугу або запропонуйте власну — вебдизайн, репетиторство, ілюстрація чи допомога в саду.',
                    meta: 'ЗАПИТИ · ПРОПОЗИЦІЇ · ПОСЛУГИ',
                    roadmap: 'Готуємо маркетплейс для запитів і пропозицій послуг.'
                },
                account: {
                    navigation: 'Реєстрація та вхід',
                    card: 'Зареєструйтеся й увійдіть у свій обліковий запис VeVit в одному місці. Можете використати пароль, Google, GitHub або Discord. Інші функції профілю готуються.',
                    roadmap: 'Реєстрація та вхід у бета-версії. Працюємо над XP-профілем, досягненнями, рівнями та прив’язкою застосунків.'
                },
                premium: {
                    status: 'Незабаром',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium готується. Залиште контакт, і ми повідомимо вас про запуск.',
                    notifyCta: 'Повідомити про запуск',
                    notifyAria: 'Повідомити про запуск VeVit Premium',
                    notifyMessage: 'Хочу отримати повідомлення про запуск VeVit Premium.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Додаткові функції для постійних користувачів',
                yourPlan: 'Ваш поточний план',
                select: 'Обрати',
                perMonth: '/ місяць',
                perYear: '/ рік (2 місяці безкоштовно)',
                popular: 'Найпопулярніший',
                profileFrame: 'Рамка профілю',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP з усіх активностей', 'Щоденний XP бонус: +50 XP', 'Значок Bronze у профілі', 'Бронзова рамка профілю', 'Завантаження Edu статей', 'Пріоритетна email підтримка'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP з усіх активностей', 'Щоденний XP бонус: +150 XP', 'Значок Silver у профілі', 'Срібна рамка профілю', 'AI інструменти: 100 запитів/міс', 'Silver Edu уроки', 'Виділення оголошення на Services'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP з усіх активностей', 'Щоденний XP бонус: +400 XP', 'Значок Gold у профілі', 'Золота рамка профілю', 'AI інструменти: безліміт', 'Оголошення вгорі Services', 'Весь Edu контент', 'Підтримка до 24 годин'] },
                    platinum: { name: 'Platinum', badge: 'Для бізнесу', benefits: ['×2.5 XP з усіх активностей', 'Щоденний XP бонус: +1000 XP', 'Значок Platinum', 'Платинова рамка профілю', 'AI інструменти: безліміт + пріоритет', 'Оголошення завжди перше на Services', 'Весь Edu контент + сертифікати', 'Окремий канал Discord', 'Підтримка до 4 годин'] }
                }
            },
            page: {
                premium: { eyebrow: 'Преміум-членство' },
                nav: { webApps: 'Веб-додатки', desktopApps: 'Десктопні додатки', services: 'Сервіси VeVit', aboutUs: 'Про нас', ariaMain: 'Основна навігація', ariaOpen: 'Відкрити меню', ariaMobile: 'Мобільна навігація', ariaClose: 'Закрити меню', badgeBeta: 'Бета' },
                navItem: { tools: 'Калькулятори та інструменти', games: 'Ігри з XP-винагородами', edu: 'Уроки та тести', search: 'Універсальний пошук', store: 'Мерч і цифрові продукти', browser: 'Наш веббраузер', office: 'Офісний пакет', studios: 'Програмне рішення на замовлення', art: 'Платформа для митців' },
                hero: { eyebrow: 'Чеська цифрова екосистема', h1a: 'Інструменти, ігри', h1b: 'і уроки.', h1c: 'Без реклами.', sub: '21+ ігор і 300+ уроків. Інструменти працюють прямо в браузері.', ctaTools: 'Відкрити Tools', ctaExplore: 'Оглянути екосистему', metaTools: 'інструментів', metaGames: 'ігор', metaLessons: 'уроків', metaUsers: 'користувачів' },
                soloNote: { eyebrow: 'Про проєкт', text: 'VeVit у вільний час розробляє одна людина — Віт. Tools, Edu та Account працюють або в бета-версії, решта екосистеми додається поступово.' },
                marquee: { games: '21+ ІГОР', lessons: '300+ УРОКІВ', users: '1 200+ КОРИСТУВАЧІВ', noAds: 'БЕЗ РЕКЛАМИ', local: 'УСЕ ЛОКАЛЬНО В БРАУЗЕРІ', cz: 'ЗРОБЛЕНО В ЧЕХІЇ' },
                explore: { eyebrow: 'Більше ніж веб', title: 'Інші проєкти VeVit', subtitle: 'Окрім веб-додатків, ми розробляємо програмне забезпечення на замовлення та готуємо платформу для митців.', studiosDesc: 'Розробляємо веб-додатки, внутрішні системи та інтеграції на замовлення для компаній і приватних осіб.', studiosTag: 'Програмне забезпечення на замовлення', artDesc: 'VeVit Art готуємо для митців-початківців, які хочуть ділитися своєю творчістю.', artTag: 'Платформа для митців' },
                platforms: { eyebrow: 'Екосистема', title: 'Веб-додатки', subtitle: 'Кожен додаток має свій фокус. VeVit Account поступово їх поєднує.', badgeBeta: 'Бета-тестування', toolsDesc: 'Калькулятори, конвертери, генератори, PDF-інструменти, AI-помічники та утиліти для розробників. Інструменти працюють локально в браузері. Файли не треба завантажувати на сервер.', gamesDesc: 'Готуємо 21+ ігор, зокрема Snake, Tetris, Pac-Man та 2048.', gamesMeta: 'ігор на вибір', eduDesc: '300+ уроків, тестів і статей. Програмування, математика, мови.', eduMeta: 'уроків безкоштовно', searchDesc: 'Універсальний пошук по всій екосистемі VeVit.', storeDesc: 'Офіційний мерч, цифрові продукти та плани Premium.' },
                toolsShowcase: { eyebrow: 'Вибір інструментів', title: 'Найновіші інструменти', recommended: 'Рекомендовано', use: 'Використати', cat: { images: 'Зображення', pdf: 'PDF', dev: 'Dev', security: 'Безпека', text: 'Текст' }, tools: [ { name: 'Видалення фону', desc: 'Видаляє фон з фотографії за допомогою AI.' }, { name: 'Стиснення зображення', desc: 'Зменшує зображення і зберігає його як JPEG або WebP.' }, { name: 'Стиснення PDF', desc: 'Зменшує розмір PDF-файла.' }, { name: 'Об\'єднання PDF', desc: 'Об\'єднує кілька PDF-файлів в один.' }, { name: 'QR-генератор', desc: 'Створює QR-код для тексту, посилання, Wi-Fi або контакту.' }, { name: 'JSON-форматер', desc: 'Форматує і перевіряє структуру JSON.' }, { name: 'Генератор паролів', desc: 'Створює надійний пароль за обраними правилами.' }, { name: 'Переклад тексту', desc: 'Перекладає текст між обраними мовами за допомогою AI.' } ] },
                why: { eyebrow: 'Про VeVit', title: 'Чому існує VeVit', subtitle: 'Ми будуємо VeVit за шістьма простими принципами.', cells: [ { title: 'Без реклами', desc: 'Ми не використовуємо персоналізовану рекламу чи пікселі стеження. Проєкт фінансується через Premium і Store.' }, { title: 'Інструменти в одному місці', desc: 'PDF-інструменти, калькулятори, конвертери, AI-помічники та інструменти для розробників.' }, { title: 'Помітний прогрес', desc: 'За використання додатків можна отримувати XP, рівні та профільні винагороди.' }, { title: 'Проєкт одного розробника', desc: 'Віт розробляє VeVit у вільний час. Додатки з\'являються поступово, коли готові.' }, { title: 'Чеська спочатку', desc: 'Інтерфейс і підтримка створюються спочатку чеською. Інші мови додаємо поступово.' }, { title: 'Відкрита дорожня карта', desc: 'На цій сторінці знайдеш поточний стан додатків і над чим працюємо.' } ], timeline4: [ '2023 старт', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (зараз)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'Що далі', subtitle: 'Account, Tools та Edu у бета-версії. Інші застосунки далі готуємо.', toolsDescA: 'Калькулятори, конвертери, генератори, PDF-інструменти та утиліти для розробників. Працюють локально в браузері на', eduDescA: 'Уроки, тести і статті про програмування, математику та мови. Відкрита бета працює на', gamesDesc: 'Готуємо 21+ ігор з XP-винагородами, зокрема Snake, Tetris, Pac-Man та 2048.', storeDesc: 'Мерч, цифрові продукти, е-книги та курси. Користувачі Premium мають 20 % знижку, рахунки з ПДВ автоматично.', searchTitle: 'Універсальний Search', searchShortcut: 'Клавіатурне скорочення', searchShortcutTail: 'будь-де в екосистемі.' },
                kontakt: { socialsTitle: 'Стежте за нами', namePh: 'Ваше ім\'я', emailPh: 'vi@email.cz', msgPh: 'Чим можемо допомогти?' },
                footer: { colPlatforms: 'Платформи', colAccount: 'Облік', colSupport: 'Підтримка', linkGames: 'Ігри', linkTools: 'Інструменти', linkEdu: 'Навчання', linkServices: 'Сервіси', linkLogin: 'Вхід', linkRegister: 'Реєстрація', linkDashboard: 'Панель', linkContact: 'Контакти', linkFaq: 'FAQ', linkSupport: 'Підтримка', socialsAria: 'Соціальні мережі', copy: 'Робить Віт Ведрал,', madeIn: 'у Чехії.' },
                mobile: { groupWebApps: 'Веб-додатки', groupServices: 'Сервіси VeVit', groupMore: 'Інше' }
            }
        },
        fr: {
            nav: { home: 'Accueil', apps: 'Applications', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'À propos', premium: 'Premium', contact: 'Contact', card: 'Carte', login: 'Connexion', register: 'S\'inscrire' },
            appsDropdown: {
                header: 'Applications',
                webAppDesc: 'Plateforme en ligne',
                searchDesc: 'Moteur de recherche',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Bientôt'
            },
            hero: { welcome: 'VeVit au même endroit', title1: 'Outils, jeux', title2: 'et apprentissage', description: 'VeVit réunit des outils en ligne, des jeux, des leçons et des services. Nous développons et publions chaque application étape par étape.', explore: 'Voir les projets', contact: 'Nous écrire', support: 'Soutenir sur Ko-fi', stats: { users: 'Utilisateurs inscrits', games: 'Jeux disponibles', tools: 'Outils en ligne', lessons: 'Leçons disponibles' } },
            hub: { title: 'Applications VeVit', subtitle: 'Choisissez l\'application dont vous avez besoin aujourd\'hui.', status: { live: 'En ligne', earlyAccess: 'Accès anticipé', comingSoon: 'Bientôt', preparing: 'En développement', opening: 'Ouverture le 1er avril 2026' }, preparing: 'En développement' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Calculatrices, convertisseurs et générateurs pour les tâches courantes.', }, games: { title: 'VeVit Games', desc: 'Jeux d\'arcade et de logique pour une pause.', }, edu: { title: 'VeVit Edu', desc: 'Leçons et quiz sur la programmation, les maths et les langues.', }, services: { title: 'VeVit Services', desc: 'Un espace pour demander ou proposer un service.', }, store: { title: 'VeVit Store', desc: 'Produits numériques et articles VeVit.', } },
            apps: { title: 'Les applications desktop sont en développement', subtitle: 'Les liens de téléchargement apparaîtront ici une fois prêtes.', back: 'Retour à l\'accueil' },
            about: { title1: 'Qui crée VeVit', title2: 'et pourquoi ?', p1: 'Je m\'appelle Vít et je développe VeVit sur mon temps libre.', p2: 'Je voulais des outils et des applications sans publicités personnalisées ni collecte de données inutile.', p3: 'VeVit propose actuellement {TOOLS_COUNT} outils, 21+ jeux, 300+ leçons, un marché de services et une boutique.', features: { innovation: { title: 'Un seul développeur', desc: 'Une seule personne gère le développement, le contenu et les décisions produit.', }, quality: { title: 'Vos fichiers restent chez vous', desc: 'La plupart des outils traitent les fichiers directement dans votre navigateur.', }, ecosystem: { title: 'Un compte commun', desc: 'VeVit Account relie peu à peu la connexion et la progression entre les applications.', }, } },
            contact: { title: 'Écrivez-nous', subtitle: 'Envoyez-nous une question, une idée ou une proposition de collaboration.', connectTitle: 'Contact', socialsTitle: 'Réseaux sociaux', locationTitle: 'Pays', locationVal: 'République tchèque', formTitle: 'Message', form: { name: 'Nom', email: 'E-mail', subject: 'Sujet', message: 'Message', send: 'Envoyer le message', sending: 'Envoi...', success: 'Le message a été envoyé.', error: 'Le message n\'a pas pu être envoyé.', fallback: 'Ouvrir l\'application e-mail', blockError: 'Le navigateur a bloqué l\'envoi automatique. Utilisez le bouton ci-dessus.', emailCopied: 'L\'e-mail {EMAIL} a été copié.', emailCopyError: 'Impossible de copier l\'e-mail. L\'adresse est {EMAIL}.', subjects: { general: 'Question générale', collab: 'Collaboration', support: 'Support d\'application', bug: 'Signaler un bug', } } },
            footer: { projects: 'Projets', company: 'À propos', privacy: 'Confidentialité', rights: 'Tous droits réservés.', madeWith: 'Fait avec', inCz: 'en République tchèque.', desc: 'Outils, jeux et apprentissage d\'un projet tchèque.', },
            card: { role: 'Projet numérique tchèque', desc: 'Outils en ligne, jeux, leçons et services.', save: 'Enregistrer le contact', share: 'Partager', copied: 'Copié', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} outils',
                    toolsMarquee: '{TOOLS_COUNT} OUTILS',
                    toolsAvailable: 'Huit outils sélectionnés parmi plus de {TOOLS_COUNT} disponibles.',
                    toolsSearch: 'Une recherche sur tous les {TOOLS_COUNT} outils, jeux, leçons et documentation.'
                },
                roadmap: {
                    tools: { status: 'En bêta', progress: '{ROADMAP_TOOLS_PROGRESS} % fait' },
                    edu: { status: 'En bêta', progress: '{ROADMAP_EDU_PROGRESS} % fait' },
                    games: { status: 'Bientôt', progress: '{ROADMAP_GAMES_PROGRESS} % fait' },
                    services: { status: 'Bientôt', progress: '{ROADMAP_SERVICES_PROGRESS} % fait' },
                    account: { status: 'En bêta', progress: '{ROADMAP_ACCOUNT_PROGRESS} % fait' },
                    search: { status: 'Bientôt', progress: '{ROADMAP_SEARCH_PROGRESS} % fait' },
                    store: { status: 'Prévu', progress: '{ROADMAP_STORE_PROGRESS} % fait' }
                },
                services: {
                    navigation: 'Demandes et offres de services',
                    card: 'Demandez un service ou proposez le vôtre — création de site, tutorat, illustration ou aide au jardin.',
                    meta: 'DEMANDES · OFFRES · SERVICES',
                    roadmap: 'Un marché pour demander ou offrir des services arrive bientôt.'
                },
                account: {
                    navigation: 'Inscription et connexion',
                    card: 'Inscrivez-vous et connectez-vous à votre compte VeVit au même endroit. Mot de passe, Google, GitHub ou Discord. D\'autres fonctions de profil arrivent.',
                    roadmap: 'L\'inscription et la connexion sont en bêta. Le profil XP, les badges, les niveaux et la liaison des applications sont en cours.'
                },
                premium: {
                    status: 'Bientôt',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium est en préparation. Laissez votre contact et nous vous préviendrons au lancement.',
                    notifyCta: 'Me prévenir au lancement',
                    notifyAria: 'Me prévenir du lancement de VeVit Premium',
                    notifyMessage: 'Je souhaite être prévenu du lancement de VeVit Premium.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Fonctions supplémentaires pour les utilisateurs réguliers',
                yourPlan: 'Votre offre actuelle',
                select: 'Choisir',
                perMonth: '/ mois',
                perYear: '/ an (2 mois gratuits)',
                popular: 'Le plus populaire',
                profileFrame: 'Cadre de profil',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP sur toutes les activités', 'Bonus XP quotidien : +50 XP', 'Badge Bronze au profil', 'Cadre de profil bronze', 'Téléchargement d\'articles Edu', 'Support e-mail prioritaire'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP sur toutes les activités', 'Bonus XP quotidien : +150 XP', 'Badge Silver au profil', 'Cadre de profil argenté', 'Outils IA : 100 requêtes/mois', 'Leçons Edu Silver', 'Annonce Services mise en avant'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP sur toutes les activités', 'Bonus XP quotidien : +400 XP', 'Badge Gold au profil', 'Cadre de profil doré', 'Outils IA : illimité', 'Annonce en haut de Services', 'Tout le contenu Edu', 'Support sous 24 h'] },
                    platinum: { name: 'Platinum', badge: 'Pour entreprises', benefits: ['×2.5 XP sur toutes les activités', 'Bonus XP quotidien : +1 000 XP', 'Badge Platinum au profil', 'Cadre de profil platine', 'Outils IA : illimité + priorité', 'Annonce toujours première sur Services', 'Tout le contenu Edu + certificats', 'Canal Discord séparé', 'Support sous 4 h'] }
                }
            },
            page: {
                premium: { eyebrow: 'Adhésion premium' },
                nav: { webApps: 'Web apps', desktopApps: 'Apps bureau', services: 'Services VeVit', aboutUs: 'À propos', ariaMain: 'Navigation principale', ariaOpen: 'Ouvrir le menu', ariaMobile: 'Navigation mobile', ariaClose: 'Fermer le menu', badgeBeta: 'Beta' },
                navItem: { tools: 'Calculatrices et outils', games: 'Jeux avec récompenses XP', edu: 'Leçons et quiz', search: 'Recherche universelle', store: 'Merch et produits numériques', browser: 'Notre navigateur web', office: 'Suite bureautique', studios: 'Logiciel sur mesure', art: 'Plateforme pour artistes' },
                hero: { eyebrow: 'Écosystème numérique tchèque', h1a: 'Outils, jeux', h1b: 'et leçons.', h1c: 'Sans publicités.', sub: '21+ jeux et 300+ leçons. Les outils fonctionnent directement dans le navigateur.', ctaTools: 'Ouvrir Tools', ctaExplore: 'Explorer l\'écosystème', metaTools: 'outils', metaGames: 'jeux', metaLessons: 'leçons', metaUsers: 'utilisateurs' },
                soloNote: { eyebrow: 'À propos du projet', text: 'VeVit est développé sur son temps libre par une seule personne, Vít. Tools, Edu et Account sont en ligne ou en bêta ; le reste de l\'écosystème arrive progressivement.' },
                marquee: { games: '21+ JEUX', lessons: '300+ LEÇONS', users: '1 200+ UTILISATEURS', noAds: 'SANS PUB', local: 'TOUT LOCAL DANS LE NAVIGATEUR', cz: 'CONÇU EN CZ' },
                explore: { eyebrow: 'Plus que le web', title: 'Autres projets VeVit', subtitle: 'Au-delà des apps web, nous développons des logiciels sur mesure et préparons une plateforme pour artistes.', studiosDesc: 'Nous développons des apps web, des systèmes internes et des intégrations sur mesure pour entreprises et particuliers.', studiosTag: 'Logiciel sur mesure', artDesc: 'Nous préparons VeVit Art pour les artistes émergents qui veulent partager leur travail.', artTag: 'Plateforme pour artistes' },
                platforms: { eyebrow: 'Écosystème', title: 'Apps web', subtitle: 'Chaque app a son propre focus. VeVit Account les relie peu à peu.', badgeBeta: 'Test bêta', toolsDesc: 'Calculatrices, convertisseurs, générateurs, outils PDF, assistants IA et utilitaires dev. Les outils fonctionnent localement dans le navigateur. Pas besoin de téléverser de fichiers.', gamesDesc: 'Nous préparons 21+ jeux, dont Snake, Tetris, Pac-Man et 2048.', gamesMeta: 'jeux au choix', eduDesc: '300+ leçons, quiz et articles. Programmation, maths, langues.', eduMeta: 'leçons gratuites', searchDesc: 'Recherche universelle dans tout l\'écosystème VeVit.', storeDesc: 'Merch officiel, produits numériques et plans Premium.' },
                toolsShowcase: { eyebrow: 'Sélection d\'outils', title: 'Outils les plus récents', recommended: 'Recommandé', use: 'Utiliser', cat: { images: 'Images', pdf: 'PDF', dev: 'Dev', security: 'Sécurité', text: 'Texte' }, tools: [ { name: 'Supprimer l\'arrière-plan', desc: 'Supprime l\'arrière-plan d\'une photo avec l\'IA.' }, { name: 'Compression d\'image', desc: 'Réduit une image et l\'enregistre en JPEG ou WebP.' }, { name: 'Compression PDF', desc: 'Réduit la taille d\'un fichier PDF.' }, { name: 'Fusion PDF', desc: 'Fusionne plusieurs fichiers PDF en un seul.' }, { name: 'Générateur QR', desc: 'Crée un code QR pour texte, lien, Wi-Fi ou contact.' }, { name: 'Formateur JSON', desc: 'Formate et vérifie la structure JSON.' }, { name: 'Générateur de mots de passe', desc: 'Crée un mot de passe sécurisé selon vos règles.' }, { name: 'Traduction de texte', desc: 'Traduit du texte entre les langues sélectionnées avec l\'IA.' } ] },
                why: { eyebrow: 'À propos de VeVit', title: 'Pourquoi VeVit existe', subtitle: 'Nous construisons VeVit selon six principes simples.', cells: [ { title: 'Sans publicités', desc: 'Nous n\'utilisons pas de publicités personnalisées ni de pixels de suivi. Le projet est financé par Premium et Store.' }, { title: 'Outils au même endroit', desc: 'Outils PDF, calculatrices, convertisseurs, assistants IA et outils dev ici.' }, { title: 'Progrès visible', desc: 'Utiliser les apps vous fait gagner XP, niveaux et récompenses de profil.' }, { title: 'Projet d\'un développeur', desc: 'Vít développe VeVit sur son temps libre. Les apps sortent peu à peu quand elles sont prêtes.' }, { title: 'Tchèque dès le départ', desc: 'L\'interface et le support naissent d\'abord en tchèque. D\'autres langues s\'ajoutent peu à peu.' }, { title: 'Feuille de route publique', desc: 'Sur cette page, l\'état actuel des apps et ce sur quoi nous travaillons.' } ], timeline4: [ '2023 départ', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (maintenant)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'À venir', subtitle: 'Account, Tools et Edu sont en bêta. Les autres applications sont encore en préparation.', toolsDescA: 'Calculatrices, convertisseurs, générateurs, outils PDF et utilitaires dev. Fonctionnent localement dans le navigateur sur', eduDescA: 'Leçons, quiz et articles sur la programmation, les maths et les langues. La bêta ouverte tourne sur', gamesDesc: 'Nous préparons 21+ jeux avec récompenses XP, dont Snake, Tetris, Pac-Man et 2048.', storeDesc: 'Merch, produits numériques, e-books et cours. Les utilisateurs Premium ont 20 % de réduction, factures avec TVA automatiquement.', searchTitle: 'Search universel', searchShortcut: 'Raccourci clavier', searchShortcutTail: 'n\'importe où dans l\'écosystème.' },
                kontakt: { socialsTitle: 'Suivez-nous', namePh: 'Votre nom', emailPh: 'vous@email.cz', msgPh: 'Comment pouvons-nous aider ?' },
                footer: { colPlatforms: 'Plateformes', colAccount: 'Compte', colSupport: 'Support', linkGames: 'Jeux', linkTools: 'Outils', linkEdu: 'Éducation', linkServices: 'Services', linkLogin: 'Connexion', linkRegister: 'Inscription', linkDashboard: 'Tableau de bord', linkContact: 'Contact', linkFaq: 'FAQ', linkSupport: 'Support', socialsAria: 'Réseaux sociaux', copy: 'Fait par Vít Vedral,', madeIn: 'en Tchéquie.' },
                mobile: { groupWebApps: 'Apps web', groupServices: 'Services VeVit', groupMore: 'Plus' }
            }
        },
        sk: {
            nav: { home: 'Domov', apps: 'Aplikácie', webApp: 'Web App', search: 'VeVit Search', desktopApp: 'Desktop App', projects: 'Web App', about: 'O VeVit', premium: 'Premium', contact: 'Kontakt', card: 'Vizitka', login: 'Prihlásiť sa', register: 'Zaregistrovať sa' },
            appsDropdown: {
                header: 'Aplikácie',
                webAppDesc: 'Online platforma',
                searchDesc: 'Vyhľadávač',
                desktopAppDesc: 'Windows & macOS',
                comingSoon: 'Čoskoro'
            },
            hero: { welcome: 'VeVit na jednom mieste', title1: 'Nástroje, hry', title2: 'a vzdelávanie', description: 'VeVit spája online nástroje, hry, lekcie a služby. Jednotlivé aplikácie vyvíjame a zverejňujeme postupne.', explore: 'Zobraziť projekty', contact: 'Napísať nám', support: 'Podporiť na Ko-fi', stats: { users: 'Registrovaní používatelia', games: 'Dostupné hry', tools: 'Online nástroje', lessons: 'Dostupné lekcie' } },
            hub: { title: 'Aplikácie VeVit', subtitle: 'Vyber si aplikáciu podľa toho, čo práve potrebuješ.', status: { live: 'Online', earlyAccess: 'Early Access', comingSoon: 'Čoskoro', preparing: 'Pripravuje sa', opening: 'Otvárame 1. 4. 2026' }, preparing: 'Pripravuje sa' },
            projects: { tools: { title: 'VeVit Tools', desc: 'Kalkulačky, konvertory a generátory pre bežnú prácu.', }, games: { title: 'VeVit Games', desc: 'Arkádové a logické hry na krátku pauzu.', }, edu: { title: 'VeVit Edu', desc: 'Lekcie a kvízy zamerané na programovanie, matematiku a jazyky.', }, services: { title: 'VeVit Services', desc: 'Dopyty a ponuky služieb pre firmy aj jednotlivcov.', }, store: { title: 'VeVit Store', desc: 'Digitálne produkty a merch značky VeVit.', } },
            apps: { title: 'Desktopové aplikácie pripravujeme', subtitle: 'Akonáhle budú dostupné na stiahnutie, nájdeš tu odkazy.', back: 'Späť domov' },
            about: { title1: 'Kto tvorí VeVit', title2: 'a prečo vzniká?', p1: 'Volám sa Vít a VeVit vyvíjam vo voľnom čase.', p2: 'Chcel som vytvoriť nástroje a aplikácie bez personalizovaných reklám a zbytočného zberu údajov.', p3: 'VeVit teraz ponúka {TOOLS_COUNT} nástrojov, 21+ hier, 300+ lekcií, trhovisko služieb a obchod.', features: { innovation: { title: 'Jeden vývojár', desc: 'Vývoj, obsah aj rozhodovanie má na starosti jeden človek.', }, quality: { title: 'Súbory zostávajú u teba', desc: 'Väčšina nástrojov spracuje nahrané súbory priamo v prehliadači.', }, ecosystem: { title: 'Spoločný účet', desc: 'VeVit Account postupne prepája prihlásenie a postup v jednotlivých aplikáciách.', }, } },
            contact: { title: 'Napíšte nám', subtitle: 'Ozvite sa s otázkou, nápadom alebo ponukou spolupráce.', connectTitle: 'Kontakt', socialsTitle: 'Sociálne siete', locationTitle: 'Krajina', locationVal: 'Česká republika', formTitle: 'Správa', form: { name: 'Meno', email: 'E-mail', subject: 'Predmet', message: 'Správa', send: 'Odoslať správu', sending: 'Odosielam...', success: 'Správa bola odoslaná.', error: 'Správu sa nepodarilo odoslať.', fallback: 'Odoslať v e-mailovej aplikácii', blockError: 'Prehliadač automatické odoslanie zablokoval. Použite tlačidlo vyššie.', emailCopied: 'E-mail {EMAIL} bol skopírovaný.', emailCopyError: 'E-mail sa nepodarilo skopírovať. Adresa je {EMAIL}.', subjects: { general: 'Všeobecný dotaz', collab: 'Spolupráca', support: 'Podpora aplikácií', bug: 'Nahlásenie chyby', } } },
            footer: { projects: 'Projekty', company: 'O projekte', privacy: 'Ochrana súkromia', rights: 'Všetky práva vyhradené.', madeWith: 'Vytvorené s', inCz: 'v Českej republike.', desc: 'Nástroje, hry a vzdelávanie od českého projektu.', },
            card: { role: 'Český digitálny projekt', desc: 'Online nástroje, hry, lekcie a služby.', save: 'Uložiť kontakt', share: 'Zdieľať', copied: 'Skopírované', },
            landing: {
                counts: {
                    tools: '{TOOLS_COUNT}',
                    toolsLabel: '{TOOLS_COUNT} nástrojov',
                    toolsMarquee: '{TOOLS_COUNT} NÁSTROJOV',
                    toolsAvailable: 'Osem vybraných nástrojov z viac než {TOOLS_COUNT} dostupných.',
                    toolsSearch: 'Jeden vyhľadávač naprieč všetkými {TOOLS_COUNT} nástrojmi, hrami, lekciu a dokumentáciou.'
                },
                roadmap: {
                    tools: { status: 'V bete', progress: '{ROADMAP_TOOLS_PROGRESS} % hotovo' },
                    edu: { status: 'V bete', progress: '{ROADMAP_EDU_PROGRESS} % hotovo' },
                    games: { status: 'Pripravujeme', progress: '{ROADMAP_GAMES_PROGRESS} % hotovo' },
                    services: { status: 'Pripravujeme', progress: '{ROADMAP_SERVICES_PROGRESS} % hotovo' },
                    account: { status: 'V bete', progress: '{ROADMAP_ACCOUNT_PROGRESS} % hotovo' },
                    search: { status: 'Pripravujeme', progress: '{ROADMAP_SEARCH_PROGRESS} % hotovo' },
                    store: { status: 'V pláne', progress: '{ROADMAP_STORE_PROGRESS} % hotovo' }
                },
                services: {
                    navigation: 'Dopyty a ponuky služieb',
                    card: 'Zadaj dopyt alebo ponúkni vlastnú službu. Napríklad tvorbu webu, doučovanie, ilustráciu alebo pomoc na záhrade.',
                    meta: 'DOPYTY · PONUKY · SLUŽBY',
                    roadmap: 'Pripravujeme trhovisko, kde bude možné zadať dopyt alebo ponúknuť vlastnú službu.'
                },
                account: {
                    navigation: 'Registrácia a prihlásenie',
                    card: 'Na jednom mieste sa zaregistruješ a prihlásiš ku svojmu účtu VeVit. Môžeš použiť heslo, Google, GitHub alebo Discord. Ďalšie funkcie profilu pripravujeme.',
                    roadmap: 'Registrácia a prihlásenie sú v bete. Na XP profil, achievementy, levely a prepojenie aplikácií ďalej pracujeme.'
                },
                premium: {
                    status: 'Pripravujeme',
                    title: 'VeVit Premium',
                    description: 'VeVit Premium pripravujeme. Nechaj nám kontakt a dáme ti vedieť, akonáhle ho spustíme.',
                    notifyCta: 'Upozorniť na spustenie',
                    notifyAria: 'Upozorniť na spustenie VeVit Premium',
                    notifyMessage: 'Chcem dostať správu, keď spustíte VeVit Premium.'
                }
            },
            premium: {
                title: 'VeVit Premium',
                subtitle: 'Ďalšie funkcie pre pravidelných používateľov',
                yourPlan: 'Tvoj aktuálny plán',
                select: 'Vybrať',
                perMonth: '/ mesiac',
                perYear: '/ rok (2 mesiace zadarmo)',
                popular: 'Najobľúbenejší',
                profileFrame: 'Profilový rámik',
                tiers: {
                    bronze: { name: 'Bronze', benefits: ['×1.2 XP zo všetkých aktivít', 'Denný XP bonus: +50 XP', 'Odznak Bronze pri profile', 'Bronzový profilový rámik', 'Sťahovanie Edu článkov', 'Prioritná email podpora'] },
                    silver: { name: 'Silver', benefits: ['×1.5 XP zo všetkých aktivít', 'Denný XP bonus: +150 XP', 'Odznak Silver pri profile', 'Strieborný profilový rámik', 'AI nástroje: 100 dopytov / mesiac', 'Silver Edu lekcie', 'Zvýraznenie inzerátu na Services'] },
                    gold: { name: 'Gold', benefits: ['×2.0 XP zo všetkých aktivít', 'Denný XP bonus: +400 XP', 'Odznak Gold pri profile', 'Zlatý profilový rámik', 'AI nástroje: neobmedzene', 'Inzerát na vrchole Services', 'Celý Edu obsah', 'Podpora do 24 h'] },
                    platinum: { name: 'Platinum', badge: 'Pre firmy', benefits: ['×2.5 XP zo všetkých aktivít', 'Denný XP bonus: +1 000 XP', 'Odznak Platinum pri profile', 'Platinový profilový rámik', 'AI nástroje: neobmedzene + priorita', 'Inzerát vždy prvý na Services', 'Celý Edu obsah + certifikáty', 'Samostatný Discord kanál', 'Podpora do 4 h'] }
                }
            },
            page: {
                premium: { eyebrow: 'Prémiové členstvo' },
                nav: { webApps: 'Web apps', desktopApps: 'Desktop aplikácie', services: 'Služby VeVit', aboutUs: 'O nás', ariaMain: 'Hlavná navigácia', ariaOpen: 'Otvoriť menu', ariaMobile: 'Mobilná navigácia', ariaClose: 'Zavrieť menu', badgeBeta: 'Beta' },
                navItem: { tools: 'Kalkulačky a nástroje', games: 'Hry s XP odmenami', edu: 'Lekcie a kvízy', search: 'Univerzálny vyhľadávač', store: 'Merch a digitálne produkty', browser: 'Náš webový prehliadač', office: 'Kancelársky balík', studios: 'Software na mieru', art: 'Platforma pre umelcov' },
                hero: { eyebrow: 'Český digitálny ekosystém', h1a: 'Nástroje, hry', h1b: 'a lekcie.', h1c: 'Bez reklám.', sub: '21+ hier a 300+ lekcií. Nástroje môžeš používať priamo v prehliadači.', ctaTools: 'Otvoriť Tools', ctaExplore: 'Preskúmať ekosystém', metaTools: 'nástrojov', metaGames: 'hier', metaLessons: 'lekcií', metaUsers: 'používateľov' },
                soloNote: { eyebrow: 'O projekte', text: 'VeVit vo voľnom čase vyvíja jeden človek — Vít. Tools, Edu a Account bežia alebo sú v bete, zvyšok ekosystému postupne pribúda.' },
                marquee: { games: '21+ HIER', lessons: '300+ LEKCIÍ', users: '1 200+ POUŽÍVATEĽOV', noAds: 'BEZ REKLÁM', local: 'VŠETKO LOKÁLNE V PREHLIADAČI', cz: 'POSTAVENÉ V CZ' },
                explore: { eyebrow: 'Viac než web', title: 'Ďalšie projekty VeVit', subtitle: 'Okrem webových aplikácií vyvíjame softvér na mieru a pripravujeme platformu pre umelcov.', studiosDesc: 'Vyvíjame webové aplikácie, interné systémy a integrácie na mieru firmám aj jednotlivcom.', studiosTag: 'Softvér na mieru', artDesc: 'VeVit Art pripravujeme pre začínajúcich umelcov, ktorí chcú zdieľať svoju tvorbu.', artTag: 'Platforma pre umelcov' },
                platforms: { eyebrow: 'Ekosystém', title: 'Webové aplikácie', subtitle: 'Každá aplikácia má vlastné zameranie. VeVit účet ich postupne prepája.', badgeBeta: 'Beta testovanie', toolsDesc: 'Kalkulačky, konvertory, generátory, PDF nástroje, AI pomocníci a dev utility. Nástroje bežia lokálne v prehliadači. Súbory nemusíš nahrávať na server.', gamesDesc: 'Pripravujeme 21+ hier, vrátane Snake, Tetrisu, Pac-Mana a 2048.', gamesMeta: 'hier na výber', eduDesc: '300+ lekcií, kvízov a článkov. Programovanie, matematika, jazyky.', eduMeta: 'lekcií zadarmo', searchDesc: 'Univerzálny vyhľadávač naprieč celým ekosystémom VeVit.', storeDesc: 'Oficiálny merch, digitálne produkty a Premium plány.' },
                toolsShowcase: { eyebrow: 'Výber nástrojov', title: 'Najnovšie nástroje', recommended: 'Odporúčané', use: 'Použiť', cat: { images: 'Obrázky', pdf: 'PDF', dev: 'Dev', security: 'Bezpečnosť', text: 'Text' }, tools: [ { name: 'Odstrániť pozadie', desc: 'Odstráni pozadie z fotografie pomocou AI.' }, { name: 'Komprimácia obrázku', desc: 'Zmenší obrázok a uloží ho ako JPEG alebo WebP.' }, { name: 'Komprimácia PDF', desc: 'Zmenší veľkosť PDF súboru.' }, { name: 'Zlúčenie PDF', desc: 'Zlúči viacero PDF súborov do jedného.' }, { name: 'QR generátor', desc: 'Vytvorí QR kód pre text, odkaz, Wi-Fi alebo kontakt.' }, { name: 'JSON formátovač', desc: 'Formátuje a skontroluje JSON štruktúru.' }, { name: 'Generátor hesiel', desc: 'Vytvorí bezpečné heslo podľa zvolených pravidiel.' }, { name: 'Preklad textu', desc: 'Preloží text medzi zvolenými jazykmi pomocou AI.' } ] },
                why: { eyebrow: 'O VeVite', title: 'Prečo VeVit existuje', subtitle: 'Stavíme VeVit podľa šiestich jednoduchých zásad.', cells: [ { title: 'Bez reklám', desc: 'Nepoužívame personalizované reklamy ani sledovacie pixely. Projekt financujeme cez Premium a Store.' }, { title: 'Nástroje na jednom mieste', desc: 'Nájdeš tu PDF nástroje, kalkulačky, konvertory, AI pomocníkov aj nástroje pre vývojárov.' }, { title: 'Pokrok, ktorý je vidieť', desc: 'Za používanie aplikácií môžeš získavať XP, levely a profilové odmeny.' }, { title: 'Projekt jedného vývojára', desc: 'VeVit vo voľnom čase vyvíja Vít. Jednotlivé aplikácie vznikajú postupne podľa toho, čo je pripravené.' }, { title: 'Čeština od začiatku', desc: 'Rozhranie a podpora vznikajú najprv v češtine. Ďalšie jazyky pridávame postupne.' }, { title: 'Verejná roadmapa', desc: 'Na tejto stránke nájdeš aktuálny stav aplikácií a prehľad toho, na čom pracujeme.' } ], timeline4: [ '2023 štart', '2024 Tools', '2025 Premium' ], timeline5: [ 'v0.9', 'v1.0 (teraz)', 'v1.1' ] },
                roadmap: { eyebrow: 'Roadmap', title: 'Čo chystáme', subtitle: 'Account, Tools a Edu sú v bete. Ostatné aplikácie ďalej pripravujeme.', toolsDescA: 'Kalkulačky, konvertory, generátory, PDF nástroje a dev utility. Bežia lokálne v prehliadači na', eduDescA: 'Lekcie, kvízy a články o programovaní, matematike a jazykoch. Otvorená beta beží na', gamesDesc: 'Pripravujeme 21+ hier s XP odmenami, vrátane Snake, Tetrisu, Pac-Mana a 2048.', storeDesc: 'Merch, digitálne produkty, e-knihy a kurzy. Premium používatelia majú 20 % zľavu, faktúry s DPH automaticky.', searchTitle: 'Univerzálny Search', searchShortcut: 'Klávesová skratka', searchShortcutTail: 'kdekoľvek v ekosystéme.' },
                kontakt: { socialsTitle: 'Sledujte nás', namePh: 'Tvoje meno', emailPh: 'ty@email.cz', msgPh: 'S čím ti môžeme pomôcť?' },
                footer: { colPlatforms: 'Platformy', colAccount: 'Účet', colSupport: 'Podpora', linkGames: 'Hry', linkTools: 'Nástroje', linkEdu: 'Vzdelávanie', linkServices: 'Služby', linkLogin: 'Prihlásenie', linkRegister: 'Registrácia', linkDashboard: 'Nástenka', linkContact: 'Kontakt', linkFaq: 'FAQ', linkSupport: 'Podpora', socialsAria: 'Sociálne siete', copy: 'Robí Vít Vedral,', madeIn: 'Česko.' },
                mobile: { groupWebApps: 'Webové aplikácie', groupServices: 'Služby VeVit', groupMore: 'Ďalšie' }
            }
        }
    },

    interpolate(value, values = this.values) {
        if (typeof value !== 'string') return value;
        return value.replace(/\{([A-Z0-9_]+)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
        );
    },

    lookup(key, lang) {
        const keys = key.split('.');
        let current = this.translations[lang] || this.translations['cs'];
        for (const k of keys) {
            if (current && current[k] !== undefined) {
                current = current[k];
            } else {
                return undefined;
            }
        }
        return current;
    },

    t(key, lang = 'cs') {
        const localized = this.lookup(key, lang);
        const value = localized === undefined ? this.lookup(key, 'cs') : localized;
        return this.interpolate(value === undefined ? key : value, this.values);
    },

    apply(root = document, lang = document.documentElement.lang || 'cs') {
        root.querySelectorAll('[data-ui-text]').forEach((element) => {
            element.textContent = this.t(element.dataset.uiText, lang);
        });

        root.querySelectorAll('[data-ui-attr]').forEach((element) => {
            element.dataset.uiAttr.split(',').forEach((pair) => {
                const colon = pair.indexOf(':');
                if (colon < 1) return;
                const attr = pair.slice(0, colon).trim();
                const key = pair.slice(colon + 1).trim();
                if (attr && key) element.setAttribute(attr, this.t(key, lang));
            });
        });

        root.querySelectorAll('[data-ui-progress]').forEach((element) => {
            const value = this.values[element.dataset.uiProgress];
            if (typeof value === 'number') {
                element.style.setProperty('--p', `${value}%`);
            }
        });
    }
};

window.UI = UI;

document.addEventListener('DOMContentLoaded', () => UI.apply());
window.addEventListener('vevit:localechange', (event) => UI.apply(document, event.detail?.locale || 'cs'));
