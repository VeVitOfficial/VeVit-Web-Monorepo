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
    'location.ai.title' => ['cs'=>'Zpracování probíhá přes AI model.','en'=>'Processing runs through an AI model.','de'=>'Die Verarbeitung läuft über ein KI-Modell.','es'=>'El procesamiento se realiza mediante un modelo de IA.','uk'=>'Обробка відбувається через модель ШІ.','fr'=>'Le traitement s\'effectue via un modèle d\'IA.','sk'=>'Spracovanie prebieha cez AI model.'],

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
    $dict = [];
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
            $dict[$overKey] = $csCatDesc[$cat]; // cs fallback placeholder
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
            $dict[$nameKey] = $csToolName[$slug];
        }
        if (isset($toolOverrides[$lang][$slug]['desc'])) {
            $dict[$descKey] = $toolOverrides[$lang][$slug]['desc'];
        } else {
            $dict[$descKey] = $csToolDesc[$slug];
        }
    }
    ksort($dict);
    $path = $outDir . '/' . $lang . '.php';
    if (file_put_contents($path, export_array_php($dict), LOCK_EX) === false) {
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