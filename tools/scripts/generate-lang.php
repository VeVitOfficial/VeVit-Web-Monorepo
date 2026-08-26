#!/usr/bin/env php
<?php
/** Generuje tools/lang/{cs,en,de,es,uk,fr,sk}.php ze zdrojů:
 *  - UI řetězce (header/footer/hub/tool_page/status/location/category.label) — tabulka níže.
 *  - tool.<slug>.name / .desc a category.<cat>.desc — z registry.php (cs hodnoty;
 *    v ostatních jazycích záměrně cs fallback placeholder, dokud nepřijdí reálné
 *    překlady — follow-up task).
 *
 *  Spuštění:  php scripts/generate-lang.php
 *  Output:    tools/lang/<code>.php (7 souborů, paritní klíče).
 *
 *  Pro reálné překlady tool name/desc přidej do $toolOverrides tabulku:
 *    $toolOverrides = ['en' => ['pdf-merge' => ['name' => 'Merge PDF', 'desc' => '...']]];
 */
declare(strict_types=1);

require_once __DIR__ . '/../includes/registry.php';

const VV_LANGS = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'];

/**
 * UI překlady. Struktura: ['key' => ['cs'=>…, 'en'=>…, …]].
 * Klíče bez plného překladu doplní generátor cs fallbackem.
 */
const UI_STRINGS = [
    // ── header ─────────────────────────────────────────────────────
    'header.title' => [
        'cs' => 'VeVit Tools — Nástroje pro vaši práci',
        'en' => 'VeVit Tools — Tools for your work',
        'de' => 'VeVit Tools — Werkzeuge für Ihre Arbeit',
        'es' => 'VeVit Tools — Herramientas para tu trabajo',
        'uk' => 'VeVit Tools — Інструменти для вашої роботи',
        'fr' => 'VeVit Tools — Outils pour votre travail',
        'sk' => 'VeVit Tools — Nástroje pre vašu prácu',
    ],
    'header.meta_description' => [
        'cs' => 'Sada nástrojů pro PDF, obrázky, média, text, AI, vývoj, bezpečnost i kalkulačky. Většinu souborů zpracujeme lokálně v prohlížeči, bez nahrávání na server.',
        'en' => 'A set of tools for PDF, images, media, text, AI, development, security and calculators. Most files are processed locally in your browser, without uploading to a server.',
        'de' => 'Eine Sammlung von Werkzeugen für PDF, Bilder, Medien, Text, KI, Entwicklung, Sicherheit und Rechner. Die meisten Dateien werden lokal im Browser verarbeitet, ohne Upload auf einen Server.',
        'es' => 'Un conjunto de herramientas para PDF, imágenes, multimedia, texto, IA, desarrollo, seguridad y calculadoras. La mayoría de archivos se procesan localmente en tu navegador, sin subirlos a un servidor.',
        'uk' => 'Набір інструментів для PDF, зображень, медіа, тексту, ШІ, розробки, безпеки та калькуляторів. Більшість файлів обробляються локально у вашому браузері, без завантаження на сервер.',
        'fr' => "Un ensemble d'outils pour PDF, images, médias, texte, IA, développement, sécurité et calculatrices. La plupart des fichiers sont traités localement dans votre navigateur, sans envoi vers un serveur.",
        'sk' => 'Sada nástrojov pre PDF, obrázky, médiá, text, AI, vývoj, bezpečnosť a kalkulačky. Väčšinu súborov spracujeme lokálne v prehliadači, bez nahrávania na server.',
    ],
    'header.brand_name' => ['cs'=>'VeVit','en'=>'VeVit','de'=>'VeVit','es'=>'VeVit','uk'=>'VeVit','fr'=>'VeVit','sk'=>'VeVit'],
    'header.brand_suffix' => ['cs'=>'Tools','en'=>'Tools','de'=>'Tools','es'=>'Tools','uk'=>'Tools','fr'=>'Tools','sk'=>'Tools'],
    'header.categories' => [
        'cs'=>'Kategorie','en'=>'Categories','de'=>'Kategorien','es'=>'Categorías',
        'uk'=>'Категорії','fr'=>'Catégories','sk'=>'Kategórie',
    ],
    'header.newest' => [
        'cs'=>'Nejnovější','en'=>'Newest','de'=>'Neueste','es'=>'Más recientes',
        'uk'=>'Найновіші','fr'=>'Plus récents','sk'=>'Najnovšie',
    ],
    'header.login_title' => [
        'cs' => 'Přihlášení k účtu VeVit je volitelné — všechny nástroje fungují i bez něj.',
        'en' => 'Signing in to your VeVit account is optional — all tools work without it.',
        'de' => 'Die Anmeldung beim VeVit-Konto ist optional — alle Werkzeuge funktionieren auch ohne.',
        'es' => 'Iniciar sesión en tu cuenta de VeVit es opcional — todas las herramientas funcionan sin ella.',
        'uk' => 'Вхід у обліковий запис VeVit необовʼязковий — усі інструменти працюють і без нього.',
        'fr' => "La connexion à votre compte VeVit est facultative — tous les outils fonctionnent sans.",
        'sk' => 'Prihlásenie do účtu VeVit je voliteľné — všetky nástroje fungujú aj bez neho.',
    ],
    'header.login' => [
        'cs'=>'Přihlásit se','en'=>'Sign in','de'=>'Anmelden','es'=>'Iniciar sesión',
        'uk'=>'Увійти','fr'=>'Se connecter','sk'=>'Prihlásiť sa',
    ],

    // ── footer ─────────────────────────────────────────────────────
    'footer.back' => [
        'cs'=>'Zpět na VeVit.cz','en'=>'Back to VeVit.cz','de'=>'Zurück zu VeVit.cz',
        'es'=>'Volver a VeVit.cz','uk'=>'Назад до VeVit.cz','fr'=>'Retour à VeVit.cz','sk'=>'Späť na VeVit.cz',
    ],
    'footer.privacy' => [
        'cs'=>'Vše zpracováno lokálně v prohlížeči',
        'en'=>'Everything processed locally in your browser',
        'de'=>'Alles wird lokal im Browser verarbeitet',
        'es'=>'Todo se procesa localmente en tu navegador',
        'uk'=>'Усе обробляється локально у браузері',
        'fr'=>'Tout est traité localement dans votre navigateur',
        'sk'=>'Všetko spracované lokálne v prehliadači',
    ],
    'footer.copyright' => [
        'cs'=>'© 2026 VeVit Tools.','en'=>'© 2026 VeVit Tools.','de'=>'© 2026 VeVit Tools.',
        'es'=>'© 2026 VeVit Tools.','uk'=>'© 2026 VeVit Tools.','fr'=>'© 2026 VeVit Tools.','sk'=>'© 2026 VeVit Tools.',
    ],

    // ── hub (index page) ───────────────────────────────────────────
    'hub.eyebrow' => [
        'cs'=>'Nástroje','en'=>'Tools','de'=>'Werkzeuge','es'=>'Herramientas',
        'uk'=>'Інструменти','fr'=>'Outils','sk'=>'Nástroje',
    ],
    'hub.h1_pre' => [
        'cs'=>'Nástroje pro','en'=>'Tools for','de'=>'Werkzeuge für','es'=>'Herramientas para',
        'uk'=>'Інструменти для','fr'=>'Outils pour','sk'=>'Nástroje pre',
    ],
    'hub.h1_mid' => [
        'cs'=>'práci','en'=>'work','de'=>'Arbeit','es'=>'trabajar',
        'uk'=>'роботу','fr'=>'travailler','sk'=>'prácu',
    ],
    'hub.h1_amp' => ['cs'=>'&','en'=>'&','de'=>'&','es'=>'&','uk'=>'&','fr'=>'&','sk'=>'&'],
    'hub.h1_post' => [
        'cs'=>'každý den.','en'=>'every day.','de'=>'jeden Tag.','es'=>'cada día.',
        'uk'=>'кожен день.','fr'=>'chaque jour.','sk'=>'každý deň.',
    ],
    'hub.subtitle' => [
        'cs' => 'PDF, obrázky, video, text, AI i kalkulačky. Většinu souborů zpracujeme přímo ve vašem prohlížeči — bez nahrávání na server.',
        'en' => 'PDF, images, video, text, AI and calculators. Most files are processed right in your browser — no upload to a server.',
        'de' => 'PDF, Bilder, Video, Text, KI und Rechner. Die meisten Dateien werden direkt in Ihrem Browser verarbeitet — ohne Server-Upload.',
        'es' => 'PDF, imágenes, vídeo, texto, IA y calculadoras. La mayoría de archivos se procesan directamente en tu navegador — sin subirlos a un servidor.',
        'uk' => 'PDF, зображення, відео, текст, ШІ та калькулятори. Більшість файлів обробляються прямо у вашому браузері — без завантаження на сервер.',
        'fr' => 'PDF, images, vidéo, texte, IA et calculatrices. La plupart des fichiers sont traités directement dans votre navigateur — sans envoi vers un serveur.',
        'sk' => 'PDF, obrázky, video, text, AI a kalkulačky. Väčšinu súborov spracujeme priamo vo vašom prehliadači — bez nahrávania na server.',
    ],
    'hub.pill_total' => [
        'cs'=>'{total} nástrojů','en'=>'{total} tools','de'=>'{total} Werkzeuge','es'=>'{total} herramientas',
        'uk'=>'{total} інструментів','fr'=>'{total} outils','sk'=>'{total} nástrojov',
    ],
    'hub.pill_local' => [
        'cs'=>'Zpracováno lokálně','en'=>'Processed locally','de'=>'Lokal verarbeitet',
        'es'=>'Procesado localmente','uk'=>'Оброблено локально','fr'=>'Traité localement','sk'=>'Spracované lokálne',
    ],
    'hub.pill_free' => [
        'cs'=>'Zdarma & bez registrace','en'=>'Free & no sign-up','de'=>'Kostenlos & ohne Anmeldung',
        'es'=>'Gratis y sin registro','uk'=>'Безкоштовно та без реєстрації','fr'=>'Gratuit & sans inscription','sk'=>'Zadarmo a bez registrácie',
    ],
    'hub.stat_local' => [
        'cs'=>'{client} běží lokálně','en'=>'{client} run locally','de'=>'{client} laufen lokal',
        'es'=>'{client} se ejecutan localmente','uk'=>'{client} працюють локально','fr'=>'{client} en local','sk'=>'{client} beží lokálne',
    ],
    'hub.stat_categories' => [
        'cs'=>'{cats} kategorií','en'=>'{cats} categories','de'=>'{cats} Kategorien','es'=>'{cats} categorías',
        'uk'=>'{cats} категорій','fr'=>'{cats} catégories','sk'=>'{cats} kategórií',
    ],
    'hub.stat_no_reg' => [
        'cs'=>'0 nucených registrací','en'=>'0 forced sign-ups','de'=>'0 erzwungene Anmeldungen',
        'es'=>'0 registros forzados','uk'=>'0 примусових реєстрацій','fr'=>'0 inscriptions forcées','sk'=>'0 nútených registrácií',
    ],
    'hub.search_label' => [
        'cs'=>'Hledat nástroj','en'=>'Search a tool','de'=>'Werkzeug suchen','es'=>'Buscar herramienta',
        'uk'=>'Шукати інструмент','fr'=>'Rechercher un outil','sk'=>'Hľadať nástroj',
    ],
    'hub.search_placeholder' => [
        "cs"=>"Hledat nástroj... (např. 'json', 'pdf', 'hash')",
        "en"=>"Search tools... (e.g. 'json', 'pdf', 'hash')",
        "de"=>"Werkzeug suchen... (z.B. 'json', 'pdf', 'hash')",
        "es"=>"Buscar herramientas... (ej. 'json', 'pdf', 'hash')",
        "uk"=>"Шукати інструмент... (напр. 'json', 'pdf', 'hash')",
        "fr"=>"Rechercher un outil... (ex. 'json', 'pdf', 'hash')",
        "sk"=>"Hľadať nástroj... (napr. 'json', 'pdf', 'hash')",
    ],
    'hub.search_clear' => [
        'cs'=>'Vymazat hledání','en'=>'Clear search','de'=>'Suche löschen','es'=>'Borrar búsqueda',
        'uk'=>'Очистити пошук','fr'=>'Effacer la recherche','sk'=>'Vymazať hľadanie',
    ],
    'hub.search_help' => [
        'cs'=>'Pro pohyb ve výsledcích použijte šipky nahoru a dolů, Enter nástroj otevře.',
        'en'=>'Use the up and down arrows to navigate results; Enter opens a tool.',
        'de'=>'Mit den Pfeilen nach oben/unten durch die Ergebnisse navigieren; Enter öffnet ein Werkzeug.',
        'es'=>'Usa las flechas arriba y abajo para navegar por los resultados; Enter abre una herramienta.',
        'uk'=>'Для навігації за результатами використовуйте стрілки вгору та вниз; Enter відкриває інструмент.',
        'fr'=>'Utilisez les flèches haut/bas pour parcourir les résultats ; Entrée ouvre un outil.',
        'sk'=>'Pre pohyb vo výsledkoch použite šípky nahor a nadol, Enter nástroj otvorí.',
    ],
    'hub.filters_aria' => [
        'cs'=>'Filtry nástrojů','en'=>'Tool filters','de'=>'Werkzeugfilter','es'=>'Filtros de herramientas',
        'uk'=>'Фільтри інструментів','fr'=>'Filtres d\'outils','sk'=>'Filtre nástrojov',
    ],
    'hub.filter_category' => ['cs'=>'Kategorie','en'=>'Category','de'=>'Kategorie','es'=>'Categoría','uk'=>'Категорія','fr'=>'Catégorie','sk'=>'Kategória'],
    'hub.filter_processing' => ['cs'=>'Zpracování','en'=>'Processing','de'=>'Verarbeitung','es'=>'Procesamiento','uk'=>'Обробка','fr'=>'Traitement','sk'=>'Spracovanie'],
    'hub.filter_status' => ['cs'=>'Stav','en'=>'Status','de'=>'Status','es'=>'Estado','uk'=>'Стан','fr'=>'Statut','sk'=>'Stav'],
    'hub.filter_sort' => ['cs'=>'Řazení','en'=>'Sort','de'=>'Sortierung','es'=>'Orden','uk'=>'Сортування','fr'=>'Tri','sk'=>'Triedenie'],
    'hub.option_all_categories' => [
        'cs'=>'Všechny kategorie','en'=>'All categories','de'=>'Alle Kategorien','es'=>'Todas las categorías',
        'uk'=>'Усі категорії','fr'=>'Toutes les catégories','sk'=>'Všetky kategórie',
    ],
    'hub.option_all_places' => [
        'cs'=>'Všechna místa','en'=>'All places','de'=>'Alle Orte','es'=>'Todos los lugares',
        'uk'=>'Усі місця','fr'=>'Tous les emplacements','sk'=>'Všetky miesta',
    ],
    'hub.option_local_browser' => [
        'cs'=>'Lokálně v prohlížeči','en'=>'Locally in browser','de'=>'Lokal im Browser','es'=>'Localmente en el navegador',
        'uk'=>'Локально у браузері','fr'=>'Localement dans le navigateur','sk'=>'Lokálne v prehliadači',
    ],
    'hub.option_vevit_server' => [
        'cs'=>'Na VeVit serveru','en'=>'On VeVit server','de'=>'Auf dem VeVit-Server','es'=>'En el servidor VeVit',
        'uk'=>'На сервері VeVit','fr'=>'Sur le serveur VeVit','sk'=>'Na serveri VeVit',
    ],
    'hub.option_external_ai' => [
        'cs'=>'Externí AI','en'=>'External AI','de'=>'Externe KI','es'=>'IA externa',
        'uk'=>'Зовнішній ШІ','fr'=>'IA externe','sk'=>'Externá AI',
    ],
    'hub.option_all_statuses' => [
        'cs'=>'Všechny stavy','en'=>'All statuses','de'=>'Alle Status','es'=>'Todos los estados',
        'uk'=>'Усі стани','fr'=>'Tous les statuts','sk'=>'Všetky stavy',
    ],
    'hub.option_status_working' => ['cs'=>'Dostupné','en'=>'Available','de'=>'Verfügbar','es'=>'Disponibles','uk'=>'Доступні','fr'=>'Disponibles','sk'=>'Dostupné'],
    'hub.option_status_limited' => ['cs'=>'Omezeně dostupné','en'=>'Limited','de'=>'Eingeschränkt','es'=>'Limitados','uk'=>'Обмежені','fr'=>'Limités','sk'=>'Obmedzene dostupné'],
    'hub.option_status_experimental' => ['cs'=>'Experimentální','en'=>'Experimental','de'=>'Experimentell','es'=>'Experimentales','uk'=>'Експериментальні','fr'=>'Expérimentaux','sk'=>'Experimentálne'],
    'hub.option_status_coming_soon' => ['cs'=>'Připravujeme','en'=>'Coming soon','de'=>'In Vorbereitung','es'=>'Próximamente','uk'=>'Очікуються','fr'=>'À venir','sk'=>'Pripravujeme'],
    'hub.option_status_unavailable' => ['cs'=>'Nedostupné na WEDOS','en'=>'Unavailable on WEDOS','de'=>'Auf WEDOS nicht verfügbar','es'=>'No disponible en WEDOS','uk'=>'Недоступні на WEDOS','fr'=>'Indisponibles sur WEDOS','sk'=>'Nedostupné na WEDOS'],
    'hub.option_status_broken' => ['cs'=>'Nefunkční','en'=>'Broken','de'=>'Defekt','es'=>'Rotos','uk'=>'Непрацюючі','fr'=>'En panne','sk'=>'Nefunkčné'],
    'hub.option_sort_relevance' => ['cs'=>'Relevance','en'=>'Relevance','de'=>'Relevanz','es'=>'Relevancia','uk'=>'Релевантність','fr'=>'Pertinence','sk'=>'Relevantnosť'],
    'hub.option_sort_name' => ['cs'=>'Název A–Z','en'=>'Name A–Z','de'=>'Name A–Z','es'=>'Nombre A–Z','uk'=>'Назва A–Z','fr'=>'Nom A–Z','sk'=>'Názov A–Z'],
    'hub.option_sort_newest' => ['cs'=>'Nejnovější','en'=>'Newest','de'=>'Neueste','es'=>'Más recientes','uk'=>'Найновіші','fr'=>'Plus récents','sk'=>'Najnovšie'],
    'hub.option_new_only' => ['cs'=>'Jen nové nástroje','en'=>'Only new tools','de'=>'Nur neue Werkzeuge','es'=>'Solo herramientas nuevas','uk'=>'Лише нові інструменти','fr'=>'Only new tools','sk'=>'Iba nové nástroje'],
    'hub.reset_filters' => ['cs'=>'Zrušit filtry','en'=>'Reset filters','de'=>'Filter zurücksetzen','es'=>'Restablecer filtros','uk'=>'Скинути фільтри','fr'=>'Réinitialiser les filtres','sk'=>'Zrušiť filtre'],
    'hub.beta_tag' => ['cs'=>'BETA TESTING','en'=>'BETA TESTING','de'=>'BETA-TEST','es'=>'PRUEBA BETA','uk'=>'БЕТА-ТЕСТУВАННЯ','fr'=>'BÊTA-TEST','sk'=>'BETA TESTOVANIE'],
    'hub.beta_title' => ['cs'=>'Beta testing','en'=>'Beta testing','de'=>'Beta-Test','es'=>'Prueba beta','uk'=>'Бета-тестування','fr'=>'Bêta-test','sk'=>'Beta testovanie'],
    'hub.beta_sub' => [
        'cs'=>'Narazili jste na chybu, něco nefunguje nebo chybí? Napište nám to sem — stačí jeden text. Nic víc po vás nechceme.',
        'en'=>'Found a bug, something broken or missing? Tell us here — just one text is enough. Nothing more.',
        'de'=>'Haben Sie einen Fehler gefunden, etwas funktioniert nicht oder fehlt? Schreiben Sie es hier rein — ein Text genügt. Mehr wollen wir nicht.',
        'es'=>'¿Encontraste un error, algo no funciona o falta? Escríbenoslo aquí — basta con un texto. Nada más.',
        'uk'=>'Знайшли помилку, щось не працює або відсутнє? Напишіть нам тут — достатньо одного тексту. Більше нічого.',
        'fr'=>'Vous avez trouvé un bug, quelque chose ne fonctionne pas ou manque ? Écrivez-le ici — un seul texte suffit. Rien de plus.',
        'sk'=>'Našli ste chybu, niečo nefunguje alebo chýba? Napíšte nám to sem — stačí jeden text. Nič viac.',
    ],
    'hub.beta_placeholder' => [
        'cs'=>'Popište, co se nepovedlo (nástroj, kroky, co jste čekali vs. co se stalo)…',
        'en'=>'Describe what went wrong (tool, steps, expected vs. actual)…',
        'de'=>'Beschreiben Sie, was schiefging (Werkzeug, Schritte, erwartet vs. passiert)…',
        'es'=>'Describe qué salió mal (herramienta, pasos, esperado vs. ocurrido)…',
        'uk'=>'Опишіть, що пішло не так (інструмент, кроки, очікувано vs. сталося)…',
        'fr'=>'Décrivez ce qui a mal tourné (outil, étapes, attendu vs. obtenu)…',
        'sk'=>'Popíšte, čo sa nepodarilo (nástroj, kroky, očakávané vs. skutočnosť)…',
    ],
    'hub.beta_send' => ['cs'=>'Odeslat hlášení','en'=>'Send report','de'=>'Bericht senden','es'=>'Enviar informe','uk'=>'Надіслати звіт','fr'=>'Envoyer le rapport','sk'=>'Odoslať hlásenie'],
    'hub.beta_note' => [
        'cs'=>'Díky! Hlášení jsme poslali na info@vevit.cz.',
        'en'=>'Thanks! We sent the report to info@vevit.cz.',
        'de'=>'Danke! Wir haben den Bericht an info@vevit.cz gesendet.',
        'es'=>'¡Gracias! Enviamos el informe a info@vevit.cz.',
        'uk'=>'Дякуємо! Звіт надіслано на info@vevit.cz.',
        'fr'=>'Merci ! Nous avons envoyé le rapport à info@vevit.cz.',
        'sk'=>'Ďakujeme! Hlásenie sme poslali na info@vevit.cz.',
    ],
    'hub.beta_small' => [
        'cs' => 'Pro toho, kdo najde chybu, nahlásí ji a do zprávy připojí svůj e-mail, máme připravený rank beta-tester s výhodami — dřívější přístup k novým nástrojům, priorita hlášení a malé bonusy. E-mail do zprávy je čistě dobrovolný; bez něj hlášení normálně pošleme, jen se ozveme jen tehdy, když k tomu bude důvod.',
        'en' => 'For anyone who finds a bug, reports it and includes their e-mail in the message, we have a beta-tester rank with perks — earlier access to new tools, report priority and small bonuses. Including an e-mail is purely voluntary; without it we still send the report, we just only reach out when there is a reason.',
        'de' => 'Wer einen Fehler findet, ihn meldet und seine E-Mail-Adresse in der Nachricht angibt, bekommt den Beta-Tester-Rang mit Vorteilen — früherer Zugang zu neuen Werkzeugen, Meldungspriorität und kleine Boni. Die E-Mail ist rein freiwillig; ohne sie senden wir die Meldung trotzdem, wir melden uns nur bei Bedarf.',
        'es' => 'Para quien encuentre un error, lo informe e incluya su correo electrónico en el mensaje, hay un rango de beta-tester con ventajas — acceso temprano a nuevas herramientas, prioridad en informes y pequeñas bonificaciones. Incluir el correo es puramente voluntario; sin él igual enviamos el informe, solo te contactaremos si hay motivo.',
        'uk' => 'Той, хто знайде помилку, повідомить про неї і додасть свій e-mail у повідомленні, отримує ранг бета-тестувальника з перевагами — раніший доступ до нових інструментів, пріоритет звітів і невеликі бонуси. Додавати e-mail суто добровільно; без нього ми все одно надішлемо звіт, лише звернемося, коли буде причина.',
        'fr' => "Pour quiconque trouve un bug, le signale et inclut son e-mail dans le message, nous offrons le rang de bêta-testeur avec des avantages — accès anticipé aux nouveaux outils, priorité des signalements et petites bonus. L'inclusion de l'e-mail est purement facultative ; sans lui, nous envoyons quand même le signalement, nous ne vous recontactons qu'en cas de besoin.",
        'sk' => 'Pre toho, kto nájde chybu, nahlási ju a do správy priloží svoj e-mail, máme pripravený rank beta-testera s výhodami — skorší prístup k novým nástrojom, priorita hlásení a malé bonusy. E-mail do správy je čisto dobrovoľný; bez neho hlásenie normálne pošleme, len sa ozveme, keď bude dôvod.',
    ],
    'hub.results_title' => [
        'cs'=>'{count} výsledků pro „{q}“','en'=>'{count} results for “{q}”','de'=>'{count} Ergebnisse für „{q}“',
        'es'=>'{count} resultados para «{q}»','uk'=>'{count} результатів для «{q}»','fr'=>'{count} résultats pour « {q} »','sk'=>'{count} výsledkov pre „{q}“',
    ],
    'hub.results_title_empty' => ['cs'=>'Žádné výsledky','en'=>'No results','de'=>'Keine Ergebnisse','es'=>'Sin resultados','uk'=>'Без результатів','fr'=>'Aucun résultat','sk'=>'Žiadne výsledky'],
    'hub.results_loading' => ['cs'=>'Načítám vyhledávání…','en'=>'Loading search…','de'=>'Suche wird geladen…','es'=>'Cargando búsqueda…','uk'=>'Завантаження пошуку…','fr'=>'Chargement de la recherche…','sk'=>'Načítavam vyhľadávanie…'],
    'hub.results_error' => [
        'cs'=>'Hledání se nepodařilo načíst. Kategorie níže zůstávají dostupné.',
        'en'=>'Search failed to load. Categories below remain available.',
        'de'=>'Suche konnte nicht geladen werden. Die Kategorien unten bleiben verfügbar.',
        'es'=>'No se pudo cargar la búsqueda. Las categorías siguientes siguen disponibles.',
        'uk'=>'Не вдалося завантажити пошук. Категорії нижче залишаються доступними.',
        'fr'=>'La recherche n\'a pas pu être chargée. Les catégories ci-dessous restent disponibles.',
        'sk'=>'Hľadanie sa nepodarilo načítať. Kategórie nižšie zostávajú dostupné.',
    ],
    'hub.empty_title' => ['cs'=>'Žádný nástroj neodpovídá hledání.','en'=>'No tool matches your search.','de'=>'Kein Werkzeug passt zur Suche.','es'=>'Ninguna herramienta coincide con la búsqueda.','uk'=>'Жоден інструмент не відповідає пошуку.','fr'=>'Aucun outil ne correspond à la recherche.','sk'=>'Žiadny nástroj nezodpovedá hľadaniu.'],
    'hub.empty_sub' => ['cs'=>'Zkuste jiné klíčové slovo.','en'=>'Try a different keyword.','de'=>'Versuchen Sie ein anderes Schlüsselwort.','es'=>'Prueba otra palabra clave.','uk'=>'Спробуйте інше ключове слово.','fr'=>'Essayez un autre mot-clé.','sk'=>'Skúste iné kľúčové slovo.'],
    'hub.section_newest' => ['cs'=>'Nejnovější nástroje','en'=>'Newest tools','de'=>'Neueste Werkzeuge','es'=>'Herramientas más recientes','uk'=>'Найновіші інструменти','fr'=>'Outils les plus récents','sk'=>'Najnovšie nástroje'],
    'hub.section_newest_desc' => ['cs'=>'Čerstvě přidané nástroje, které ještě nemusíte znát.','en'=>'Freshly added tools you might not know yet.','de'=>'Frisch hinzugefügte Werkzeuge, die Sie vielleicht noch nicht kennen.','es'=>'Herramientas recién añadidas que tal vez no conozcas.','uk'=>'Нещодавно додані інструменти, про які ви могли не знати.','fr'=>'Outils récemment ajoutés que vous ne connaissez peut-être pas encore.','sk'=>'Nadol pridané nástroje, ktoré možno ešte nepoznáte.'],
    'hub.badge_new' => ['cs'=>'NOVÉ','en'=>'NEW','de'=>'NEU','es'=>'NUEVO','uk'=>'НОВЕ','fr'=>'NOUVEAU','sk'=>'NOVÉ'],
    'hub.card_open' => ['cs'=>'Otevřít →','en'=>'Open →','de'=>'Öffnen →','es'=>'Abrir →','uk'=>'Відкрити →','fr'=>'Ouvrir →','sk'=>'Otvoriť →'],

    // ── tool_page (tools.php shell) ────────────────────────────────
    'tool_page.breadcrumb_tools' => ['cs'=>'Nástroje','en'=>'Tools','de'=>'Werkzeuge','es'=>'Herramientas','uk'=>'Інструменти','fr'=>'Outils','sk'=>'Nástroje'],
    'tool_page.not_found_title' => ['cs'=>'Nástroj nebyl nalezen','en'=>'Tool not found','de'=>'Werkzeug nicht gefunden','es'=>'Herramienta no encontrada','uk'=>'Інструмент не знайдено','fr'=>'Outil introuvable','sk'=>'Nástroj nebol nájdený'],
    'tool_page.not_found_text' => ['cs'=>'Tento nástroj neexistuje.','en'=>'This tool does not exist.','de'=>'Dieses Werkzeug existiert nicht.','es'=>'Esta herramienta no existe.','uk'=>'Цей інструмент не існує.','fr'=>'Cet outil n\'existe pas.','sk'=>'Tento nástroj neexistuje.'],
    'tool_page.not_found_back' => ['cs'=>'Zpět na přehled','en'=>'Back to overview','de'=>'Zurück zur Übersicht','es'=>'Volver al resumen','uk'=>'Назад до огляду','fr'=>'Retour à l\'aperçu','sk'=>'Späť na prehľad'],
    'tool_page.placeholder_status' => ['cs'=>'{status}.','en'=>'{status}.','de'=>'{status}.','es'=>'{status}.','uk'=>'{status}.','fr'=>'{status}.','sk'=>'{status}.'],
    'tool_page.workflow_label' => ['cs'=>'Průběh nástroje','en'=>'Tool progress','de'=>'Werkzeugfortschritt','es'=>'Progreso de la herramienta','uk'=>'Хід роботи інструмента','fr'=>'Progression de l’outil','sk'=>'Priebeh nástroja'],
    'tool_page.step_input' => ['cs'=>'Vstup','en'=>'Input','de'=>'Eingabe','es'=>'Entrada','uk'=>'Вхід','fr'=>'Entrée','sk'=>'Vstup'],
    'tool_page.step_settings' => ['cs'=>'Nastavení','en'=>'Settings','de'=>'Einstellungen','es'=>'Ajustes','uk'=>'Налаштування','fr'=>'Réglages','sk'=>'Nastavenie'],
    'tool_page.step_result' => ['cs'=>'Výsledek','en'=>'Result','de'=>'Ergebnis','es'=>'Resultado','uk'=>'Результат','fr'=>'Résultat','sk'=>'Výsledok'],
    'tool_page.processing_title' => ['cs'=>'Kde a jak probíhá zpracování','en'=>'Where and how processing happens','de'=>'Wo und wie die Verarbeitung erfolgt','es'=>'Dónde y cómo se procesa','uk'=>'Де і як відбувається обробка','fr'=>'Où et comment se fait le traitement','sk'=>'Kde a ako prebieha spracovanie'],
    'tool_page.requirements_title' => ['cs'=>'Požadavky a omezení','en'=>'Requirements and limits','de'=>'Anforderungen und Grenzen','es'=>'Requisitos y límites','uk'=>'Вимоги та обмеження','fr'=>'Prérequis et limites','sk'=>'Požiadavky a obmedzenia'],
    'tool_page.ready_announcement' => ['cs'=>'Nástroj je připraven.','en'=>'The tool is ready.','de'=>'Das Werkzeug ist bereit.','es'=>'La herramienta está lista.','uk'=>'Інструмент готовий.','fr'=>'L’outil est prêt.','sk'=>'Nástroj je pripravený.'],

    // ── shared ToolUI runtime ────────────────────────────────────
    'tool_ui.copied' => ['cs'=>'Zkopírováno do schránky','en'=>'Copied to clipboard','de'=>'In die Zwischenablage kopiert','es'=>'Copiado al portapapeles','uk'=>'Скопійовано в буфер обміну','fr'=>'Copié dans le presse-papiers','sk'=>'Skopírované do schránky'],
    'tool_ui.copy_failed' => ['cs'=>'Kopírování selhalo','en'=>'Copy failed','de'=>'Kopieren fehlgeschlagen','es'=>'No se pudo copiar','uk'=>'Не вдалося скопіювати','fr'=>'Échec de la copie','sk'=>'Kopírovanie zlyhalo'],
    'tool_ui.copy' => ['cs'=>'Kopírovat','en'=>'Copy','de'=>'Kopieren','es'=>'Copiar','uk'=>'Копіювати','fr'=>'Copier','sk'=>'Kopírovať'],
    'tool_ui.invalid_type' => ['cs'=>'Některé soubory byly přeskočeny: tento typ není podporovaný.','en'=>'Some files were skipped because their type is not supported.','de'=>'Einige Dateien wurden wegen eines nicht unterstützten Typs übersprungen.','es'=>'Se omitieron algunos archivos porque su tipo no es compatible.','uk'=>'Деякі файли пропущено через непідтримуваний тип.','fr'=>'Certains fichiers ont été ignorés car leur type n’est pas pris en charge.','sk'=>'Niektoré súbory boli preskočené, pretože ich typ nie je podporovaný.'],
    'tool_ui.file_too_large' => ['cs'=>'Soubor {name} je větší než povolený limit {limit}.','en'=>'{name} is larger than the {limit} limit.','de'=>'{name} überschreitet das Limit von {limit}.','es'=>'{name} supera el límite de {limit}.','uk'=>'Файл {name} перевищує ліміт {limit}.','fr'=>'Le fichier {name} dépasse la limite de {limit}.','sk'=>'Súbor {name} prekračuje limit {limit}.'],
    'tool_ui.remove_file' => ['cs'=>'Odebrat {name}','en'=>'Remove {name}','de'=>'{name} entfernen','es'=>'Quitar {name}','uk'=>'Видалити {name}','fr'=>'Retirer {name}','sk'=>'Odobrať {name}'],
    'tool_ui.move_up' => ['cs'=>'Přesunout {name} výše','en'=>'Move {name} up','de'=>'{name} nach oben verschieben','es'=>'Subir {name}','uk'=>'Перемістити {name} вище','fr'=>'Déplacer {name} vers le haut','sk'=>'Presunúť {name} vyššie'],
    'tool_ui.move_down' => ['cs'=>'Přesunout {name} níže','en'=>'Move {name} down','de'=>'{name} nach unten verschieben','es'=>'Bajar {name}','uk'=>'Перемістити {name} нижче','fr'=>'Déplacer {name} vers le bas','sk'=>'Presunúť {name} nižšie'],
    'tool_ui.load_failed' => ['cs'=>'Potřebnou část nástroje se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.','en'=>'A required part of the tool failed to load. Check your connection and try again.','de'=>'Ein benötigter Teil konnte nicht geladen werden. Prüfen Sie die Verbindung und versuchen Sie es erneut.','es'=>'No se pudo cargar una parte necesaria. Comprueba la conexión e inténtalo de nuevo.','uk'=>'Не вдалося завантажити потрібну частину. Перевірте з’єднання та спробуйте ще раз.','fr'=>'Une partie requise n’a pas pu être chargée. Vérifiez la connexion et réessayez.','sk'=>'Potrebnú časť nástroja sa nepodarilo načítať. Skontrolujte pripojenie a skúste to znova.'],
    'tool_ui.state_idle' => ['cs'=>'Čeká na vstup','en'=>'Waiting for input','de'=>'Wartet auf Eingabe','es'=>'Esperando entrada','uk'=>'Очікує на введення','fr'=>'En attente d’une entrée','sk'=>'Čaká na vstup'],
    'tool_ui.state_ready' => ['cs'=>'Připraveno ke zpracování','en'=>'Ready to process','de'=>'Bereit zur Verarbeitung','es'=>'Listo para procesar','uk'=>'Готово до обробки','fr'=>'Prêt à traiter','sk'=>'Pripravené na spracovanie'],
    'tool_ui.state_processing' => ['cs'=>'Probíhá zpracování','en'=>'Processing','de'=>'Verarbeitung läuft','es'=>'Procesando','uk'=>'Триває обробка','fr'=>'Traitement en cours','sk'=>'Prebieha spracovanie'],
    'tool_ui.state_success' => ['cs'=>'Výsledek je připraven','en'=>'Result is ready','de'=>'Ergebnis ist bereit','es'=>'El resultado está listo','uk'=>'Результат готовий','fr'=>'Le résultat est prêt','sk'=>'Výsledok je pripravený'],
    'tool_ui.state_error' => ['cs'=>'Zpracování se nezdařilo','en'=>'Processing failed','de'=>'Verarbeitung fehlgeschlagen','es'=>'El procesamiento falló','uk'=>'Помилка обробки','fr'=>'Échec du traitement','sk'=>'Spracovanie zlyhalo'],
    'tool_ui.cancel' => ['cs'=>'Zrušit','en'=>'Cancel','de'=>'Abbrechen','es'=>'Cancelar','uk'=>'Скасувати','fr'=>'Annuler','sk'=>'Zrušiť'],
    'tool_ui.retry' => ['cs'=>'Zkusit znovu','en'=>'Try again','de'=>'Erneut versuchen','es'=>'Intentar de nuevo','uk'=>'Спробувати ще раз','fr'=>'Réessayer','sk'=>'Skúsiť znova'],
    'tool_ui.reset' => ['cs'=>'Začít znovu','en'=>'Start over','de'=>'Neu beginnen','es'=>'Empezar de nuevo','uk'=>'Почати знову','fr'=>'Recommencer','sk'=>'Začať znova'],
    'tool_ui.download' => ['cs'=>'Stáhnout výsledek','en'=>'Download result','de'=>'Ergebnis herunterladen','es'=>'Descargar resultado','uk'=>'Завантажити результат','fr'=>'Télécharger le résultat','sk'=>'Stiahnuť výsledok'],
    'tool_ui.result_ready' => ['cs'=>'Hotovo — výsledek je připraven','en'=>'Done — your result is ready','de'=>'Fertig — Ihr Ergebnis ist bereit','es'=>'Listo — el resultado está preparado','uk'=>'Готово — результат підготовлено','fr'=>'Terminé — votre résultat est prêt','sk'=>'Hotovo — výsledok je pripravený'],
    'tool_ui.enter_json' => ['cs'=>'Vložte JSON ke zpracování.','en'=>'Enter JSON to process.','de'=>'Geben Sie JSON zur Verarbeitung ein.','es'=>'Introduce el JSON que quieres procesar.','uk'=>'Введіть JSON для обробки.','fr'=>'Saisissez le JSON à traiter.','sk'=>'Vložte JSON na spracovanie.'],
    'tool_ui.invalid_json' => ['cs'=>'Neplatný JSON: {message}','en'=>'Invalid JSON: {message}','de'=>'Ungültiges JSON: {message}','es'=>'JSON no válido: {message}','uk'=>'Некоректний JSON: {message}','fr'=>'JSON invalide : {message}','sk'=>'Neplatný JSON: {message}'],
    'tool_ui.invalid_range' => ['cs'=>'Zkontrolujte zadaný rozsah.','en'=>'Check the entered range.','de'=>'Prüfen Sie den eingegebenen Bereich.','es'=>'Comprueba el intervalo introducido.','uk'=>'Перевірте введений діапазон.','fr'=>'Vérifiez la plage saisie.','sk'=>'Skontrolujte zadaný rozsah.'],
    'tool_ui.invalid_time' => ['cs'=>'Čas zadávejte jako HH:MM:SS a konec musí být později než začátek.','en'=>'Use HH:MM:SS and make sure the end is later than the start.','de'=>'Verwenden Sie HH:MM:SS; das Ende muss nach dem Start liegen.','es'=>'Usa HH:MM:SS y asegúrate de que el final sea posterior al inicio.','uk'=>'Використовуйте HH:MM:SS; кінець має бути пізніше за початок.','fr'=>'Utilisez HH:MM:SS et placez la fin après le début.','sk'=>'Použite HH:MM:SS a koniec musí byť neskôr ako začiatok.'],
    'tool_ui.loading' => ['cs'=>'Načítání…','en'=>'Loading…','de'=>'Wird geladen…','es'=>'Cargando…','uk'=>'Завантаження…','fr'=>'Chargement…','sk'=>'Načítava sa…'],
    'tool_ui.saving' => ['cs'=>'Příprava výsledku…','en'=>'Preparing result…','de'=>'Ergebnis wird vorbereitet…','es'=>'Preparando el resultado…','uk'=>'Підготовка результату…','fr'=>'Préparation du résultat…','sk'=>'Pripravuje sa výsledok…'],
    'tool_ui.thinking' => ['cs'=>'Přemýšlím…','en'=>'Thinking…','de'=>'Denke nach…','es'=>'Pensando…','uk'=>'Обмірковую…','fr'=>'Réflexion…','sk'=>'Premýšľam…'],
    'tool_ui.interrupted' => ['cs'=>'Odpověď byla zastavena.','en'=>'The response was stopped.','de'=>'Die Antwort wurde gestoppt.','es'=>'La respuesta se detuvo.','uk'=>'Відповідь зупинено.','fr'=>'La réponse a été arrêtée.','sk'=>'Odpoveď bola zastavená.'],
    'tool_ui.unknown_error' => ['cs'=>'Nastala neznámá chyba. Zkuste to znovu.','en'=>'An unknown error occurred. Try again.','de'=>'Ein unbekannter Fehler ist aufgetreten. Versuchen Sie es erneut.','es'=>'Se produjo un error desconocido. Inténtalo de nuevo.','uk'=>'Сталася невідома помилка. Спробуйте ще раз.','fr'=>'Une erreur inconnue s’est produite. Réessayez.','sk'=>'Nastala neznáma chyba. Skúste to znova.'],
    'tool_ui.page' => ['cs'=>'Strana {number}','en'=>'Page {number}','de'=>'Seite {number}','es'=>'Página {number}','uk'=>'Сторінка {number}','fr'=>'Page {number}','sk'=>'Strana {number}'],
    'tool_ui.undo' => ['cs'=>'Vrátit změnu','en'=>'Undo change','de'=>'Änderung rückgängig','es'=>'Deshacer cambio','uk'=>'Скасувати зміну','fr'=>'Annuler la modification','sk'=>'Vrátiť zmenu'],
    'ai_chat.new_chat' => ['cs'=>'Nový chat','en'=>'New chat','de'=>'Neuer Chat','es'=>'Nuevo chat','uk'=>'Новий чат','fr'=>'Nouveau chat','sk'=>'Nový chat'],
    'ai_chat.starter_explain' => ['cs'=>'Vysvětli mi složité téma jednoduše','en'=>'Explain a complex topic simply','de'=>'Erkläre ein komplexes Thema einfach','es'=>'Explica un tema complejo de forma sencilla','uk'=>'Поясни складну тему просто','fr'=>'Explique simplement un sujet complexe','sk'=>'Vysvetli zložitú tému jednoducho'],
    'ai_chat.starter_plan' => ['cs'=>'Pomoz mi vytvořit praktický plán','en'=>'Help me make a practical plan','de'=>'Hilf mir, einen praktischen Plan zu erstellen','es'=>'Ayúdame a crear un plan práctico','uk'=>'Допоможи скласти практичний план','fr'=>'Aide-moi à créer un plan pratique','sk'=>'Pomôž mi vytvoriť praktický plán'],
    'ai_chat.starter_improve' => ['cs'=>'Vylepši srozumitelnost mého textu','en'=>'Improve the clarity of my text','de'=>'Verbessere die Verständlichkeit meines Textes','es'=>'Mejora la claridad de mi texto','uk'=>'Покращ зрозумілість мого тексту','fr'=>'Améliore la clarté de mon texte','sk'=>'Zlepši zrozumiteľnosť môjho textu'],
    'ai_chat.disclaimer' => ['cs'=>'AI může chybovat. Nezadávejte citlivé údaje a důležité informace si ověřte.','en'=>'AI can make mistakes. Do not enter sensitive data and verify important information.','de'=>'KI kann Fehler machen. Geben Sie keine sensiblen Daten ein und prüfen Sie wichtige Informationen.','es'=>'La IA puede equivocarse. No introduzcas datos sensibles y verifica la información importante.','uk'=>'ШІ може помилятися. Не вводьте конфіденційні дані та перевіряйте важливу інформацію.','fr'=>'L’IA peut se tromper. Ne saisissez pas de données sensibles et vérifiez les informations importantes.','sk'=>'AI sa môže mýliť. Nezadávajte citlivé údaje a dôležité informácie si overte.'],
    'ai_chat.copy_response' => ['cs'=>'Kopírovat odpověď','en'=>'Copy response','de'=>'Antwort kopieren','es'=>'Copiar respuesta','uk'=>'Копіювати відповідь','fr'=>'Copier la réponse','sk'=>'Kopírovať odpoveď'],
    'ai_chat.retry' => ['cs'=>'Zopakovat dotaz','en'=>'Retry prompt','de'=>'Anfrage wiederholen','es'=>'Repetir consulta','uk'=>'Повторити запит','fr'=>'Relancer la demande','sk'=>'Zopakovať otázku'],
    'tool_ui.print' => ['cs'=>'Vytisknout výsledek','en'=>'Print result','de'=>'Ergebnis drucken','es'=>'Imprimir resultado','uk'=>'Друкувати результат','fr'=>'Imprimer le résultat','sk'=>'Vytlačiť výsledok'],
    'loan_calc.extra' => ['cs'=>'Mimořádná splátka za období (Kč)','en'=>'Extra payment per period (CZK)','de'=>'Zusätzliche Zahlung pro Periode (CZK)','es'=>'Pago extra por periodo (CZK)','uk'=>'Додатковий платіж за період (CZK)','fr'=>'Paiement supplémentaire par période (CZK)','sk'=>'Mimoriadna splátka za obdobie (CZK)'],
    'loan_calc.principal_share' => ['cs'=>'Jistina','en'=>'Principal','de'=>'Tilgung','es'=>'Principal','uk'=>'Основна сума','fr'=>'Capital','sk'=>'Istina'],
    'loan_calc.interest_share' => ['cs'=>'Úrok','en'=>'Interest','de'=>'Zinsen','es'=>'Intereses','uk'=>'Відсотки','fr'=>'Intérêts','sk'=>'Úrok'],
    'tool_page.info_title' => ['cs'=>'Co je potřeba vědět','en'=>'What you need to know','de'=>'Was Sie wissen müssen','es'=>'Lo que debes saber','uk'=>'Що потрібно знати','fr'=>'Ce qu’il faut savoir','sk'=>'Čo potrebujete vedieť'],
    'tool_page.info_no_action' => ['cs'=>'Tato stránka momentálně nic nezpracovává ani neodesílá.','en'=>'This page currently processes and sends nothing.','de'=>'Diese Seite verarbeitet und sendet derzeit nichts.','es'=>'Esta página no procesa ni envía nada actualmente.','uk'=>'Ця сторінка зараз нічого не обробляє і не надсилає.','fr'=>'Cette page ne traite et n’envoie actuellement aucune donnée.','sk'=>'Táto stránka momentálne nič nespracúva ani neodosiela.'],
    'tool_page.alternatives' => ['cs'=>'Bezpečné alternativy','en'=>'Safe alternatives','de'=>'Sichere Alternativen','es'=>'Alternativas seguras','uk'=>'Безпечні альтернативи','fr'=>'Alternatives sûres','sk'=>'Bezpečné alternatívy'],
    'tool_page.alt_ai_image' => ['cs'=>'Pro generování obrázků použijte službu, které důvěřujete, a předem zkontrolujte její práci s daty.','en'=>'Use an image service you trust and review its data policy first.','de'=>'Nutzen Sie einen vertrauenswürdigen Bilddienst und prüfen Sie zuvor dessen Datenrichtlinie.','es'=>'Usa un servicio de imágenes de confianza y revisa antes su política de datos.','uk'=>'Скористайтеся надійним сервісом зображень і спершу перевірте його політику даних.','fr'=>'Utilisez un service d’images de confiance et vérifiez d’abord sa politique de données.','sk'=>'Použite dôveryhodnú službu na obrázky a vopred si overte jej pravidlá práce s údajmi.'],
    'tool_page.alt_pdf_password' => ['cs'=>'Heslo lze spravovat lokálně v desktopové aplikaci s podporou šifrování PDF, například qpdf.','en'=>'Manage the password locally in a desktop PDF encryption app such as qpdf.','de'=>'Verwalten Sie das Passwort lokal in einer Desktop-App zur PDF-Verschlüsselung, etwa qpdf.','es'=>'Gestiona la contraseña localmente con una aplicación de escritorio que cifre PDF, como qpdf.','uk'=>'Керуйте паролем локально в настільній програмі для шифрування PDF, наприклад qpdf.','fr'=>'Gérez le mot de passe localement avec une application de chiffrement PDF telle que qpdf.','sk'=>'Heslo spravujte lokálne v desktopovej aplikácii na šifrovanie PDF, napríklad qpdf.'],
    'tool_page.alt_screenshot' => ['cs'=>'Použijte vestavěný snímek obrazovky v prohlížeči nebo operačním systému; citlivá URL tak neopustí zařízení.','en'=>'Use the browser or operating system screenshot feature so a sensitive URL stays on your device.','de'=>'Nutzen Sie die Screenshot-Funktion des Browsers oder Betriebssystems, damit eine sensible URL auf Ihrem Gerät bleibt.','es'=>'Usa la captura del navegador o del sistema operativo para mantener una URL sensible en tu dispositivo.','uk'=>'Скористайтеся знімком екрана в браузері або ОС, щоб конфіденційна URL-адреса залишалася на пристрої.','fr'=>'Utilisez la capture du navigateur ou du système pour conserver une URL sensible sur votre appareil.','sk'=>'Použite snímku obrazovky v prehliadači alebo systéme, aby citlivá URL zostala v zariadení.'],
    'tool_ui.text_meta' => ['cs'=>'{characters} znaků · {lines} řádků','en'=>'{characters} characters · {lines} lines','de'=>'{characters} Zeichen · {lines} Zeilen','es'=>'{characters} caracteres · {lines} líneas','uk'=>'{characters} символів · {lines} рядків','fr'=>'{characters} caractères · {lines} lignes','sk'=>'{characters} znakov · {lines} riadkov'],
    'tool_ui.file_format' => ['cs'=>'{type} · {size}','en'=>'{type} · {size}','de'=>'{type} · {size}','es'=>'{type} · {size}','uk'=>'{type} · {size}','fr'=>'{type} · {size}','sk'=>'{type} · {size}'],
    'tool_ui.strength_very_weak' => ['cs'=>'Velmi slabé','en'=>'Very weak','de'=>'Sehr schwach','es'=>'Muy débil','uk'=>'Дуже слабкий','fr'=>'Très faible','sk'=>'Veľmi slabé'],
    'tool_ui.strength_weak' => ['cs'=>'Slabé','en'=>'Weak','de'=>'Schwach','es'=>'Débil','uk'=>'Слабкий','fr'=>'Faible','sk'=>'Slabé'],
    'tool_ui.strength_medium' => ['cs'=>'Střední','en'=>'Medium','de'=>'Mittel','es'=>'Medio','uk'=>'Середній','fr'=>'Moyen','sk'=>'Stredné'],
    'tool_ui.strength_strong' => ['cs'=>'Silné','en'=>'Strong','de'=>'Stark','es'=>'Fuerte','uk'=>'Сильний','fr'=>'Fort','sk'=>'Silné'],
    'tool_ui.strength_very_strong' => ['cs'=>'Velmi silné','en'=>'Very strong','de'=>'Sehr stark','es'=>'Muy fuerte','uk'=>'Дуже сильний','fr'=>'Très fort','sk'=>'Veľmi silné'],
    'tool_ui.choose_charset' => ['cs'=>'Vyberte alespoň jednu skupinu znaků.','en'=>'Select at least one character group.','de'=>'Wählen Sie mindestens eine Zeichengruppe.','es'=>'Selecciona al menos un grupo de caracteres.','uk'=>'Виберіть принаймні одну групу символів.','fr'=>'Sélectionnez au moins un groupe de caractères.','sk'=>'Vyberte aspoň jednu skupinu znakov.'],
    'tool_ui.password_copied' => ['cs'=>'Heslo bylo zkopírováno.','en'=>'Password copied.','de'=>'Passwort kopiert.','es'=>'Contraseña copiada.','uk'=>'Пароль скопійовано.','fr'=>'Mot de passe copié.','sk'=>'Heslo bolo skopírované.'],
    'password_gen.mode' => ['cs'=>'Režim','en'=>'Mode','de'=>'Modus','es'=>'Modo','uk'=>'Режим','fr'=>'Mode','sk'=>'Režim'],
    'password_gen.mode_chars' => ['cs'=>'Náhodné znaky','en'=>'Random characters','de'=>'Zufällige Zeichen','es'=>'Caracteres aleatorios','uk'=>'Випадкові символи','fr'=>'Caractères aléatoires','sk'=>'Náhodné znaky'],
    'password_gen.mode_words' => ['cs'=>'Heslová fráze','en'=>'Passphrase','de'=>'Passphrase','es'=>'Frase de contraseña','uk'=>'Парольна фраза','fr'=>'Phrase secrète','sk'=>'Heslová fráza'],
    'password_gen.ambiguous' => ['cs'=>'Vynechat podobné znaky (0/O, 1/l/I)','en'=>'Exclude ambiguous characters (0/O, 1/l/I)','de'=>'Mehrdeutige Zeichen ausschließen (0/O, 1/l/I)','es'=>'Excluir caracteres ambiguos (0/O, 1/l/I)','uk'=>'Виключити схожі символи (0/O, 1/l/I)','fr'=>'Exclure les caractères ambigus (0/O, 1/l/I)','sk'=>'Vynechať podobné znaky (0/O, 1/l/I)'],
    'password_gen.entropy' => ['cs'=>'Odhad entropie: {bits} bitů','en'=>'Estimated entropy: {bits} bits','de'=>'Geschätzte Entropie: {bits} Bit','es'=>'Entropía estimada: {bits} bits','uk'=>'Оцінка ентропії: {bits} біт','fr'=>'Entropie estimée : {bits} bits','sk'=>'Odhad entropie: {bits} bitov'],

    // ── status labels ──────────────────────────────────────────────
    'status.working' => ['cs'=>'Dostupný','en'=>'Available','de'=>'Verfügbar','es'=>'Disponible','uk'=>'Доступний','fr'=>'Disponible','sk'=>'Dostupný'],
    'status.limited' => ['cs'=>'Omezeně dostupný','en'=>'Limited','de'=>'Eingeschränkt verfügbar','es'=>'Disponible limitadamente','uk'=>'Обмежено доступний','fr'=>'Disponible de manière limitée','sk'=>'Obmedzene dostupný'],
    'status.experimental' => ['cs'=>'Experimentální','en'=>'Experimental','de'=>'Experimentell','es'=>'Experimental','uk'=>'Експериментальний','fr'=>'Expérimental','sk'=>'Experimentálny'],
    'status.coming_soon' => ['cs'=>'Připravujeme','en'=>'Coming soon','de'=>'In Vorbereitung','es'=>'Próximamente','uk'=>'Очікується','fr'=>'À venir','sk'=>'Pripravujeme'],
    'status.unavailable_on_wedos' => ['cs'=>'Nedostupné na WEDOS','en'=>'Unavailable on WEDOS','de'=>'Auf WEDOS nicht verfügbar','es'=>'No disponible en WEDOS','uk'=>'Недоступно на WEDOS','fr'=>'Indisponible sur WEDOS','sk'=>'Nedostupné na WEDOS'],
    'status.broken' => ['cs'=>'Dočasně nefunkční','en'=>'Temporarily broken','de'=>'Vorübergehend defekt','es'=>'Temporalmente roto','uk'=>'Тимчасово не працює','fr'=>'Temporairement en panne','sk'=>'Dočasne nefunkčný'],

    // ── location labels + titles ───────────────────────────────────
    'location.client.label' => ['cs'=>'Lokálně','en'=>'Locally','de'=>'Lokal','es'=>'Localmente','uk'=>'Локально','fr'=>'En local','sk'=>'Lokálne'],
    'location.client.title' => ['cs'=>'Soubor se zpracovává ve vašem prohlížeči a neopustí tento počítač.','en'=>'The file is processed in your browser and never leaves this computer.','de'=>'Die Datei wird in Ihrem Browser verarbeitet und verläßt diesen Computer nicht.','es'=>'El archivo se procesa en tu navegador y no sale de esta computadora.','uk'=>'Файл обробляється у вашому браузері і не залишає цей комп\'ютер.','fr'=>'Le fichier est traité dans votre navigateur et ne quitte pas cet ordinateur.','sk'=>'Súbor sa spracováva vo vašom prehliadači a neopustí tento počítač.'],
    'location.server.label' => ['cs'=>'Na serveru','en'=>'On server','de'=>'Auf dem Server','es'=>'En el servidor','uk'=>'На сервері','fr'=>'Sur le serveur','sk'=>'Na serveri'],
    'location.server.title' => ['cs'=>'Soubor se zpracuje na serveru a po dokončení se smaže.','en'=>'The file is processed on the server and deleted after completion.','de'=>'Die Datei wird auf dem Server verarbeitet und nach Abschluss gelöscht.','es'=>'El archivo se procesa en el servidor y se elimina al terminar.','uk'=>'Файл обробляється на сервері та видаляється після завершення.','fr'=>'Le fichier est traité sur le serveur et supprimé après achèvement.','sk'=>'Súbor sa spracuje na serveri a po dokončení sa vymaže.'],
    'location.ai.label' => ['cs'=>'Přes AI','en'=>'Via AI','de'=>'Über KI','es'=>'Vía IA','uk'=>'Через ШІ','fr'=>'Via IA','sk'=>'Cez AI'],
    'location.ai.title' => ['cs'=>'Zadaný obsah se po vědomém spuštění odešle přes server VeVit do externího AI modelu.','en'=>'After you deliberately start the tool, the entered content is sent through the VeVit server to an external AI model.','de'=>'Nach dem bewussten Start wird der eingegebene Inhalt über den VeVit-Server an ein externes KI-Modell gesendet.','es'=>'Cuando inicias la herramienta, el contenido introducido se envía mediante el servidor VeVit a un modelo de IA externo.','uk'=>'Після свідомого запуску введений вміст надсилається через сервер VeVit до зовнішньої моделі ШІ.','fr'=>'Après votre action explicite, le contenu saisi est envoyé via le serveur VeVit à un modèle d’IA externe.','sk'=>'Po vedomom spustení sa zadaný obsah odošle cez server VeVit do externého AI modelu.'],

    // ── category labels ────────────────────────────────────────────
    'category.pdf.label' => ['cs'=>'PDF','en'=>'PDF','de'=>'PDF','es'=>'PDF','uk'=>'PDF','fr'=>'PDF','sk'=>'PDF'],
    'category.image.label' => ['cs'=>'Obrázky','en'=>'Images','de'=>'Bilder','es'=>'Imágenes','uk'=>'Зображення','fr'=>'Images','sk'=>'Obrázky'],
    'category.media.label' => ['cs'=>'Média','en'=>'Media','de'=>'Medien','es'=>'Multimedia','uk'=>'Медіа','fr'=>'Médias','sk'=>'Média'],
    'category.text.label' => ['cs'=>'Text','en'=>'Text','de'=>'Text','es'=>'Texto','uk'=>'Текст','fr'=>'Texte','sk'=>'Text'],
    'category.ai.label' => ['cs'=>'AI','en'=>'AI','de'=>'KI','es'=>'IA','uk'=>'ШІ','fr'=>'IA','sk'=>'AI'],
    'category.dev.label' => ['cs'=>'Dev','en'=>'Dev','de'=>'Dev','es'=>'Dev','uk'=>'Dev','fr'=>'Dev','sk'=>'Dev'],
    'category.security.label' => ['cs'=>'Bezpečnost','en'=>'Security','de'=>'Sicherheit','es'=>'Seguridad','uk'=>'Безпека','fr'=>'Sécurité','sk'=>'Bezpečnosť'],
    'category.calc.label' => ['cs'=>'Kalkulačky','en'=>'Calculators','de'=>'Rechner','es'=>'Calculadoras','uk'=>'Калькулятори','fr'=>'Calculatrices','sk'=>'Kalkulačky'],

    // ── pdf_merge (VZOR šablona) ───────────────────────────────────
    'pdf_merge.drop_title' => ['cs'=>'Přetáhněte sem PDF soubory','en'=>'Drop PDF files here','de'=>'PDF-Dateien hierher ziehen','es'=>'Suelta archivos PDF aquí','uk'=>'Перетягніть PDF-файли сюди','fr'=>'Déposez vos fichiers PDF ici','sk'=>'Pretiahnite sem PDF súbory'],
    'pdf_merge.drop_hint' => ['cs'=>'nebo klikněte pro výběr','en'=>'or click to choose','de'=>'oder klicken zum Auswählen','es'=>'o haz clic para elegir','uk'=>'або натисніть, щоб обрати','fr'=>'ou cliquez pour choisir','sk'=>'alebo kliknite pre výber'],
    'pdf_merge.drop_accept' => ['cs'=>'Pouze .pdf · více souborů · pořadí lze měnit','en'=>'Only .pdf · multiple files · order can be changed','de'=>'Nur .pdf · mehrere Dateien · Reihenfolge änderbar','es'=>'Solo .pdf · varios archivos · orden editable','uk'=>'Лише .pdf · кілька файлів · порядок можна змінити','fr'=>'Uniquement .pdf · plusieurs fichiers · ordre modifiable','sk'=>'Iba .pdf · viac súborov · poradie možno zmeniť'],
    'pdf_merge.list_aria' => ['cs'=>'Vybrané soubory','en'=>'Selected files','de'=>'Ausgewählte Dateien','es'=>'Archivos seleccionados','uk'=>'Обрані файли','fr'=>'Fichiers sélectionnés','sk'=>'Vybrané súbory'],
    'pdf_merge.run' => ['cs'=>'Sloučit PDF','en'=>'Merge PDF','de'=>'PDF zusammenführen','es'=>'Fusionar PDF','uk'=>'Об\'єднати PDF','fr'=>'Fusionner PDF','sk'=>'Zlúčiť PDF'],
    'pdf_merge.clear' => ['cs'=>'Vyčistit','en'=>'Clear','de'=>'Leeren','es'=>'Limpiar','uk'=>'Очистити','fr'=>'Effacer','sk'=>'Vyčistiť'],
    'pdf_merge.result_name' => ['cs'=>'sloučeno.pdf','en'=>'merged.pdf','de'=>'zusammengeführt.pdf','es'=>'fusionado.pdf','uk'=>'об\'єднано.pdf','fr'=>'fusionne.pdf','sk'=>'zlúčené.pdf'],
    'pdf_merge.download' => ['cs'=>'Stáhnout','en'=>'Download','de'=>'Herunterladen','es'=>'Descargar','uk'=>'Завантажити','fr'=>'Télécharger','sk'=>'Stiahnuť'],
    'pdf_merge.privacy' => ['cs'=>'PDF se slévají lokálně v prohlížeči přes pdf-lib. Soubory se nikdy neodesílají na server.','en'=>'PDFs are merged locally in your browser via pdf-lib. Files are never sent to a server.','de'=>'PDFs werden lokal im Browser via pdf-lib zusammengeführt. Dateien werden nie an einen Server gesendet.','es'=>'Los PDF se fusionan localmente en tu navegador vía pdf-lib. Los archivos nunca se envían a un servidor.','uk'=>'PDF-файли об\'єднуються локально у браузері через pdf-lib. Файли ніколи не надсилаються на сервер.','fr'=>'Les PDF sont fusionnés localement dans votre navigateur via pdf-lib. Les fichiers ne sont jamais envoyés à un serveur.','sk'=>'PDF sa zlučujú lokálne v prehliadači cez pdf-lib. Súbory sa nikdy neodosielajú na server.'],
];

/**
 * Reálné překlady tool name/desc a category desc (follow-up). Struktura:
 *   ['en' => ['pdf-merge' => ['name' => 'Merge PDF', 'desc' => '…'], 'category.pdf.desc' => '…']]]
 * Prázdné = generátor použije cs hodnotu jako placeholder.
 */
$toolOverrides = [];

// ── Generace ─────────────────────────────────────────────────────

function resolve_ui(string $key, string $lang): string {
    if (!isset(UI_STRINGS[$key])) return $key;
    $row = UI_STRINGS[$key];
    if (isset($row[$lang])) return $row[$lang];
    return $row['cs']; // fallback (nemělo by nastat, parity garantována)
}

function export_array_php(array $dict): string {
    $lines = ["<?php", "// Auto-generováno tools/scripts/generate-lang.php — NEEDITUJ ručně.",
              "// Pro UI překlady uprav UI_STRINGS v generátoru. Pro reálné překlady tool",
              "// name/desc přidej záznam do \$toolOverrides. Spusť: php scripts/generate-lang.php",
              "return ["];
    foreach ($dict as $k => $v) {
        $kEnc = var_export($k, true);
        $vEnc = var_export($v, true);
        $lines[] = "  $kEnc => $vEnc,";
    }
    $lines[] = "];";
    return implode("\n", $lines) . "\n";
}

/** Aktualizuje existující slovník bez zahození komentářů a pořadí klíčů. */
function merge_array_php(string $path, array $dict): string {
    $source = (string) file_get_contents($path);
    $existing = require $path;
    $append = [];
    foreach ($dict as $key => $value) {
        $keyEncoded = var_export($key, true);
        $valueEncoded = var_export($value, true);
        if (array_key_exists($key, $existing)) {
            $pattern = '/^\s*' . preg_quote($keyEncoded, '/') . '\s*=>\s*.*,$/m';
            $updated = preg_replace($pattern, '  ' . $keyEncoded . ' => ' . $valueEncoded . ',', $source);
            if (is_string($updated)) $source = $updated;
        } else {
            $append[] = '  ' . $keyEncoded . ' => ' . $valueEncoded . ',';
        }
    }
    if ($append) {
        $position = strrpos($source, '];');
        if ($position === false) throw new RuntimeException("Slovník {$path} nemá ukončení ];");
        $source = substr($source, 0, $position) . "\n  // === UX redesign shared runtime ===\n" . implode("\n", $append) . "\n" . substr($source, $position);
    }
    return $source;
}

$outDir = __DIR__ . '/../lang';
if (!is_dir($outDir) && !mkdir($outDir, 0755, true)) {
    fwrite(STDERR, "Nelze vytvořit $outDir\n");
    exit(1);
}

$csCatDesc = CATEGORY_DESCRIPTIONS;
$csCatLabel = CATEGORY_LABELS;
$csToolName = [];
$csToolDesc = [];
foreach (TOOLS as $t) {
    $csToolName[$t['slug']] = $t['name'];
    $csToolDesc[$t['slug']] = $t['desc'];
}

$counts = [];
foreach (VV_LANGS as $lang) {
    // Zachovej všechny tool-specific překlady, které historicky vznikly mimo
    // tuto tabulku. Generátor spravuje známé UI klíče a pouze doplňuje chybějící
    // registry položky; nikdy nesmí zmenšit existující slovník.
    $existingPath = $outDir . '/' . $lang . '.php';
    $existing = is_file($existingPath) ? require $existingPath : [];
    $dict = is_array($existing) ? $existing : [];
    // UI strings
    foreach (UI_STRINGS as $key => $_) {
        $dict[$key] = resolve_ui($key, $lang);
    }
    // category labels + descs
    foreach (CATEGORY_ORDER as $cat) {
        $dict["category.{$cat}.label"] = resolve_ui("category.{$cat}.label", $lang);
        $overKey = "category.{$cat}.desc";
        if (isset($toolOverrides[$lang][$overKey])) {
            $dict[$overKey] = $toolOverrides[$lang][$overKey];
        } else {
            $dict[$overKey] = $dict[$overKey] ?? $csCatDesc[$cat];
        }
    }
    // status + location (již v UI_STRINGS)
    // tool name/desc
    foreach (TOOLS as $t) {
        $slug = $t['slug'];
        $nameKey = "tool.{$slug}.name";
        $descKey = "tool.{$slug}.desc";
        if (isset($toolOverrides[$lang][$slug]['name'])) {
            $dict[$nameKey] = $toolOverrides[$lang][$slug]['name'];
        } else {
            $dict[$nameKey] = $dict[$nameKey] ?? $csToolName[$slug];
        }
        if (isset($toolOverrides[$lang][$slug]['desc'])) {
            $dict[$descKey] = $toolOverrides[$lang][$slug]['desc'];
        } else {
            $dict[$descKey] = $dict[$descKey] ?? $csToolDesc[$slug];
        }
    }
    ksort($dict);
    $path = $outDir . '/' . $lang . '.php';
    $output = is_file($path) ? merge_array_php($path, $dict) : export_array_php($dict);
    if (file_put_contents($path, $output, LOCK_EX) === false) {
        fwrite(STDERR, "Nelze zapsat $path\n");
        exit(1);
    }
    $counts[$lang] = count($dict);
}

// Parity kontrola
$reference = $counts['cs'] ?? 0;
foreach ($counts as $lang => $n) {
    if ($n !== $reference) {
        fwrite(STDERR, "PARITY ERROR: $lang has $n keys, cs has $reference\n");
        exit(1);
    }
}
echo "Zapsáno 7 slovníků do tools/lang/ (počet klíčů na jazyk: $reference).\n";
echo "Z toho UI klíčů: " . count(UI_STRINGS) . ", kategorií: " . (count(CATEGORY_ORDER) * 2) . ", nástrojů: " . (count(TOOLS) * 2) . ".\n";
