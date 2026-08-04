-- VeVit Edu courses data
-- 18 courses covering programming languages and tools

INSERT INTO courses (slug, title, description, difficulty, xp_reward, thumbnail_color, thumbnail_icon, sort_order) VALUES
('python',            'Python',                  'Nejpopulárnější jazyk pro začátečníky. Naučíš se základy i pokročilé konstrukce a napíšeš vlastní projekty.', 'beginner',     2000, '#3b82f6', 'code-2',     1),
('javascript',        'JavaScript',              'Jazyk webového frontendu i backendu. Od interaktivních stránek po server-side aplikace s Node.js.', 'beginner',     2000, '#f59e0b', 'braces',     2),
('html-css',           'HTML & CSS',              'Základ každého webu — struktura obsahu a vizuální stylování. Vytvoříš si vlastní responsivní stránku.', 'beginner',      800, '#ec4899', 'layout',     3),
('sql',                'SQL & Databáze',           'Nauč se pracovat s relačními databázemi. Od SELECT po JOIN a agregace — data pod kontrolou.', 'beginner',      900, '#06b6d4', 'database',   4),
('zaklady-programovani','Základy programování',   'Úvod do myšlení jako programátor. Proměnné, cykly, podmínky a algoritmy bez vazby na konkrétní jazyk.', 'beginner',      600, '#8b5cf6', 'cpu',        5),
('terminal',           'Terminál & Bash',          'Ovládníš příkazovou řádku a automatizuješ úlohy. Základ pro každého vývojáře a DevOps inženýra.', 'beginner',      600, '#6b7280', 'terminal',   6),
('typescript',         'TypeScript',              'JavaScript s typovou bezpečností. Nauč se psát robustnější kód a chápat rozdíly oproti čistému JS.', 'intermediate',  900, '#3b82f6', 'type',       7),
('php',                'PHP',                     'Serverový jazyk pro web. Od dynamických stránek po REST API a spolupráci s databází.', 'intermediate',  900, '#7c3aed', 'server',     8),
('java',               'Java',                    'Objektový jazyk pro enterprise aplikace. Od JVM základů po Spring Boot a mikroslužby.', 'intermediate', 1000, '#f97316', 'coffee',     9),
('csharp',             'C#',                      'Microsoftův jazyk pro .NET ekosystém. Desktop, web i herní vývoj s Unity pod jednou střechou.', 'intermediate', 1000, '#a855f7', 'hash',      10),
('cpp',                'C++',                     'Výkon blízko kovu. Nauč se správu paměti, pointery a psát efektivní systémové aplikace.', 'advanced',     1200, '#ef4444', 'zap',       11),
('rust',               'Rust',                    'Bezpečnost paměti bez garbage collectoru. Moderní jazyk pro systémové programování.', 'advanced',     1200, '#f97316', 'shield',    12),
('golang',             'Go',                      'Jednoduchý a rychlý jazyk od Googlu. Gorutiny, konkurenční programování a cloud-native nástroje.', 'intermediate', 1000, '#06b6d4', 'layers',    13),
('kotlin',             'Kotlin',                  'Moderní alternativ k Javě pro Android i backend. Stručný syntax, null safety a korutiny.', 'intermediate',  900, '#a855f7', 'smartphone', 14),
('swift',              'Swift',                   'Jazyk od Applu pro iOS a macOS. Bezpečný, rychlý a expresivní — od prototypu až po App Store.', 'intermediate',  900, '#f97316', 'apple',     15),
('ruby',               'Ruby',                    'Elegantní syntax zaměřený na produktivitu. Ideální pro webové aplikace s frameworkem Ruby on Rails.', 'intermediate',  800, '#ef4444', 'gem',       16),
('git',                'Git & GitHub',             'Verzovací systém, který používá každý tým. Od git init po rebase, konflikty a pull requesty.', 'beginner',      600, '#f97316', 'git-branch', 17),
('docker',             'Docker',                   'Kontejnerizace pro každého vývojáře. Nauč se vytvářet, spravovat a orchestrovat Docker kontejnery.', 'intermediate',  700, '#0ea5e9', 'container', 18);