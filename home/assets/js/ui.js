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
            about: { title1: 'Kdo VeVit tvoří', title2: 'a proč vzniká?', p1: 'Jmenuji se Vít a VeVit vyvíjím ve volném čase.', p2: 'Chtěl jsem vytvořit nástroje a aplikace bez personalizovaných reklam a zbytečného sběru dat.', p3: 'VeVit teď nabízí {TOOLS_COUNT} nástrojů, 18 her, 500+ lekcí, tržiště služeb a obchod.', features: { innovation: { title: 'Jeden vývojář', desc: 'Vývoj, obsah i rozhodování má na starosti jeden člověk.', }, quality: { title: 'Soubory zůstávají u vás', desc: 'Většina nástrojů zpracuje nahrané soubory přímo v prohlížeči.', }, ecosystem: { title: 'Společný účet', desc: 'VeVit Account postupně propojuje přihlášení a postup v jednotlivých aplikacích.', }, } },
            contact: { title: 'Napište nám', subtitle: 'Ozvěte se s dotazem, nápadem nebo nabídkou spolupráce.', connectTitle: 'Kontakt', socialsTitle: 'Sociální sítě', locationTitle: 'Země', locationVal: 'Česká republika', formTitle: 'Zpráva', form: { name: 'Jméno', email: 'E-mail', subject: 'Předmět', message: 'Zpráva', send: 'Odeslat zprávu', sending: 'Odesílám...', success: 'Zpráva byla odeslána.', error: 'Zprávu se nepodařilo odeslat.', fallback: 'Odeslat v e-mailové aplikaci', blockError: 'Prohlížeč automatické odeslání zablokoval. Použijte tlačítko výše.', subjects: { general: 'Obecný dotaz', collab: 'Spolupráce', support: 'Podpora aplikací', bug: 'Nahlášení chyby', } } },
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
                    notifyCta: 'Upozornit na spuštění'
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
            about: { title1: 'Who builds VeVit', title2: 'and why?', p1: 'My name is Vít, and I build VeVit in my spare time.', p2: 'I wanted tools and apps without personalised ads or unnecessary data collection.', p3: 'VeVit currently includes {TOOLS_COUNT} tools, 18 games, 500+ lessons, a services marketplace, and a store.', features: { innovation: { title: 'One developer', desc: 'One person handles the development, content, and product decisions.', }, quality: { title: 'Your files stay with you', desc: 'Most tools process uploaded files directly in your browser.', }, ecosystem: { title: 'A shared account', desc: 'VeVit Account is gradually connecting sign-in and progress across the apps.', }, } },
            contact: { title: 'Contact us', subtitle: 'Write to us with a question, an idea, or a collaboration proposal.', connectTitle: 'Contact', socialsTitle: 'Social media', locationTitle: 'Country', locationVal: 'Czech Republic', formTitle: 'Message', form: { name: 'Name', email: 'Email', subject: 'Subject', message: 'Message', send: 'Send message', sending: 'Sending...', success: 'Your message was sent.', error: 'We could not send your message.', fallback: 'Open your email app', blockError: 'Your browser blocked automatic sending. Use the button above.', subjects: { general: 'General question', collab: 'Collaboration', support: 'App support', bug: 'Report a bug', } } },
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
                    notifyCta: 'Notify me at launch'
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
            about: { title1: 'Quién crea VeVit', title2: 'y por qué?', p1: 'Me llamo Vít y desarrollo VeVit en mi tiempo libre.', p2: 'Quería crear herramientas y aplicaciones sin anuncios personalizados ni recopilación innecesaria de datos.', p3: 'VeVit incluye actualmente {TOOLS_COUNT} herramientas, 18 juegos, 500+ lecciones, un mercado de servicios y una tienda.', features: { innovation: { title: 'Un desarrollador', desc: 'Una sola persona se ocupa del desarrollo, el contenido y las decisiones del producto.', }, quality: { title: 'Tus archivos se quedan contigo', desc: 'La mayoría de las herramientas procesan los archivos directamente en tu navegador.', }, ecosystem: { title: 'Una cuenta compartida', desc: 'VeVit Account conecta poco a poco el acceso y el progreso entre las aplicaciones.', }, } },
            contact: { title: 'Escríbenos', subtitle: 'Envíanos una pregunta, una idea o una propuesta de colaboración.', connectTitle: 'Contacto', socialsTitle: 'Redes sociales', locationTitle: 'País', locationVal: 'República Checa', formTitle: 'Mensaje', form: { name: 'Nombre', email: 'Correo electrónico', subject: 'Asunto', message: 'Mensaje', send: 'Enviar mensaje', sending: 'Enviando...', success: 'El mensaje se ha enviado.', error: 'No hemos podido enviar el mensaje.', fallback: 'Abrir la aplicación de correo', blockError: 'El navegador bloqueó el envío automático. Usa el botón de arriba.', subjects: { general: 'Pregunta general', collab: 'Colaboración', support: 'Soporte de aplicaciones', bug: 'Informar de un error', } } },
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
                    notifyCta: 'Avísame al lanzar'
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
            about: { title1: 'Wer VeVit entwickelt', title2: 'und warum?', p1: 'Ich heiße Vít und entwickle VeVit in meiner Freizeit.', p2: 'Ich wollte Tools und Apps ohne personalisierte Werbung und unnötige Datensammlung bauen.', p3: 'VeVit umfasst derzeit {TOOLS_COUNT} Tools, 18 Spiele, 500+ Lektionen, einen Service-Marktplatz und einen Shop.', features: { innovation: { title: 'Ein Entwickler', desc: 'Eine Person kümmert sich um Entwicklung, Inhalte und Produktentscheidungen.', }, quality: { title: 'Ihre Dateien bleiben bei Ihnen', desc: 'Die meisten Tools verarbeiten hochgeladene Dateien direkt im Browser.', }, ecosystem: { title: 'Ein gemeinsames Konto', desc: 'VeVit Account verbindet nach und nach Anmeldung und Fortschritt in den Apps.', }, } },
            contact: { title: 'Kontakt aufnehmen', subtitle: 'Schreiben Sie uns mit einer Frage, einer Idee oder einem Vorschlag zur Zusammenarbeit.', connectTitle: 'Kontakt', socialsTitle: 'Soziale Medien', locationTitle: 'Land', locationVal: 'Tschechische Republik', formTitle: 'Nachricht', form: { name: 'Name', email: 'E-Mail', subject: 'Betreff', message: 'Nachricht', send: 'Nachricht senden', sending: 'Wird gesendet...', success: 'Die Nachricht wurde gesendet.', error: 'Die Nachricht konnte nicht gesendet werden.', fallback: 'E-Mail-App öffnen', blockError: 'Der Browser hat den automatischen Versand blockiert. Verwenden Sie die Schaltfläche oben.', subjects: { general: 'Allgemeine Frage', collab: 'Zusammenarbeit', support: 'App-Support', bug: 'Fehler melden', } } },
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
                    notifyCta: 'Beim Start benachrichtigen'
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
            about: { title1: 'Хто створює VeVit', title2: 'і навіщо?', p1: 'Мене звати Віт, і я розробляю VeVit у вільний час.', p2: 'Я хотів створити інструменти й застосунки без персоналізованої реклами та зайвого збору даних.', p3: 'Зараз VeVit містить {TOOLS_COUNT} інструментів, 18 ігор, 500+ уроків, ринок послуг і магазин.', features: { innovation: { title: 'Один розробник', desc: 'Одна людина відповідає за розробку, контент і продуктові рішення.', }, quality: { title: 'Ваші файли залишаються у вас', desc: 'Більшість інструментів обробляє завантажені файли безпосередньо в браузері.', }, ecosystem: { title: 'Спільний обліковий запис', desc: 'VeVit Account поступово поєднує вхід і прогрес у різних застосунках.', }, } },
            contact: { title: 'Напишіть нам', subtitle: 'Надішліть запитання, ідею або пропозицію співпраці.', connectTitle: 'Контакт', socialsTitle: 'Соціальні мережі', locationTitle: 'Країна', locationVal: 'Чеська Республіка', formTitle: 'Повідомлення', form: { name: 'Ім\'я', email: 'Електронна пошта', subject: 'Тема', message: 'Повідомлення', send: 'Надіслати', sending: 'Надсилаємо...', success: 'Повідомлення надіслано.', error: 'Не вдалося надіслати повідомлення.', fallback: 'Відкрити поштовий застосунок', blockError: 'Браузер заблокував автоматичне надсилання. Скористайтеся кнопкою вище.', subjects: { general: 'Загальне запитання', collab: 'Співпраця', support: 'Підтримка застосунків', bug: 'Повідомити про помилку', } } },
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
                    notifyCta: 'Повідомити про запуск'
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
            about: { title1: 'Qui crée VeVit', title2: 'et pourquoi ?', p1: 'Je m\'appelle Vít et je développe VeVit sur mon temps libre.', p2: 'Je voulais des outils et des applications sans publicités personnalisées ni collecte de données inutile.', p3: 'VeVit propose actuellement {TOOLS_COUNT} outils, 18 jeux, 500+ leçons, un marché de services et une boutique.', features: { innovation: { title: 'Un seul développeur', desc: 'Une seule personne gère le développement, le contenu et les décisions produit.', }, quality: { title: 'Vos fichiers restent chez vous', desc: 'La plupart des outils traitent les fichiers directement dans votre navigateur.', }, ecosystem: { title: 'Un compte commun', desc: 'VeVit Account relie peu à peu la connexion et la progression entre les applications.', }, } },
            contact: { title: 'Écrivez-nous', subtitle: 'Envoyez-nous une question, une idée ou une proposition de collaboration.', connectTitle: 'Contact', socialsTitle: 'Réseaux sociaux', locationTitle: 'Pays', locationVal: 'République tchèque', formTitle: 'Message', form: { name: 'Nom', email: 'E-mail', subject: 'Sujet', message: 'Message', send: 'Envoyer le message', sending: 'Envoi...', success: 'Le message a été envoyé.', error: 'Le message n\'a pas pu être envoyé.', fallback: 'Ouvrir l\'application e-mail', blockError: 'Le navigateur a bloqué l\'envoi automatique. Utilisez le bouton ci-dessus.', subjects: { general: 'Question générale', collab: 'Collaboration', support: 'Support d\'application', bug: 'Signaler un bug', } } },
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
                    notifyCta: 'Me prévenir au lancement'
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
            about: { title1: 'Kto tvorí VeVit', title2: 'a prečo vzniká?', p1: 'Volám sa Vít a VeVit vyvíjam vo voľnom čase.', p2: 'Chcel som vytvoriť nástroje a aplikácie bez personalizovaných reklám a zbytočného zberu údajov.', p3: 'VeVit teraz ponúka {TOOLS_COUNT} nástrojov, 18 hier, 500+ lekcií, trhovisko služieb a obchod.', features: { innovation: { title: 'Jeden vývojár', desc: 'Vývoj, obsah aj rozhodovanie má na starosti jeden človek.', }, quality: { title: 'Súbory zostávajú u teba', desc: 'Väčšina nástrojov spracuje nahrané súbory priamo v prehliadači.', }, ecosystem: { title: 'Spoločný účet', desc: 'VeVit Account postupne prepája prihlásenie a postup v jednotlivých aplikáciách.', }, } },
            contact: { title: 'Napíšte nám', subtitle: 'Ozvite sa s otázkou, nápadom alebo ponukou spolupráce.', connectTitle: 'Kontakt', socialsTitle: 'Sociálne siete', locationTitle: 'Krajina', locationVal: 'Česká republika', formTitle: 'Správa', form: { name: 'Meno', email: 'E-mail', subject: 'Predmet', message: 'Správa', send: 'Odoslať správu', sending: 'Odosielam...', success: 'Správa bola odoslaná.', error: 'Správu sa nepodarilo odoslať.', fallback: 'Odoslať v e-mailovej aplikácii', blockError: 'Prehliadač automatické odoslanie zablokoval. Použite tlačidlo vyššie.', subjects: { general: 'Všeobecný dotaz', collab: 'Spolupráca', support: 'Podpora aplikácií', bug: 'Nahlásenie chyby', } } },
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
                    notifyCta: 'Upozorniť na spustenie'
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
