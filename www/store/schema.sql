-- VeVit Store — Database Schema (PostgreSQL)

-- Kategorie
CREATE TABLE IF NOT EXISTS store_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NULL,
    sort_order INT NOT NULL DEFAULT 0
);

-- Produkty
CREATE TABLE IF NOT EXISTS store_products (
    id SERIAL PRIMARY KEY,
    category_id INT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_desc VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'physical' CHECK (type IN ('physical','digital')),
    stock INT NULL,
    images TEXT,
    download_file VARCHAR(500) NULL,
    stripe_price_id VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES store_categories(id) ON DELETE SET NULL
);

-- Objednávky
CREATE TABLE IF NOT EXISTS store_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'czk',
    stripe_session_id VARCHAR(255) NULL,
    stripe_payment_intent VARCHAR(255) NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pro updated_at (ekvivalent ON UPDATE CURRENT_TIMESTAMP)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_store_orders_updated_at ON store_orders;
CREATE TRIGGER update_store_orders_updated_at
    BEFORE UPDATE ON store_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Položky objednávky
CREATE TABLE IF NOT EXISTS store_order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('physical','digital')),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    download_token VARCHAR(64) NULL,
    download_expires_at TIMESTAMP NULL,
    download_count INT NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE RESTRICT
);


-- ====================================================================
-- Alza-style: značky, kategorická hierarchie, sledování zobrazení
-- ====================================================================

ALTER TABLE store_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NULL;
ALTER TABLE store_categories ADD COLUMN IF NOT EXISTS parent_id INT NULL
  REFERENCES store_categories(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS store_product_views (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
    user_id TEXT NULL,                       -- kompatibilní se store_orders.user_id
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_views_user ON store_product_views (user_id, viewed_at DESC);

-- ====================================================================
-- Demo kategorie — 3 úrovně (8 hlavních + 25 podkategorií + 75 vnořených)
-- Rodič: parent_id NULL. Dítě/vnuk: parent_id přes slug subselect.
-- ====================================================================
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Elektronika a Příslušenství','elektronika-a-prislusenstvi','devices',1,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Audio & Sluchátka','audio-and-sluchatka',NULL,10,(SELECT id FROM store_categories WHERE slug='elektronika-a-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Bezdrátová špuntová sluchátka (TWS)','bezdratova-spuntova-sluchatka-tws',NULL,100,(SELECT id FROM store_categories WHERE slug='audio-and-sluchatka'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Náhlavní sluchátka s potlačením hluku (ANC)','nahlavni-sluchatka-s-potlacenim-hluku-anc',NULL,101,(SELECT id FROM store_categories WHERE slug='audio-and-sluchatka'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Bluetooth reproduktory (přenosné / vodotěsné)','bluetooth-reproduktory-prenosne-vodotesne',NULL,102,(SELECT id FROM store_categories WHERE slug='audio-and-sluchatka'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Příslušenství pro mobily a monitory','prislusenstvi-pro-mobily-a-monitory',NULL,11,(SELECT id FROM store_categories WHERE slug='elektronika-a-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('MagSafe nabíječky, stojánky a držáky do auta','magsafe-nabijecky-stojanky-a-drzaky-do-auta',NULL,110,(SELECT id FROM store_categories WHERE slug='prislusenstvi-pro-mobily-a-monitory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kryty, pouzdra a ochranná skla','kryty-pouzdra-a-ochranna-skla',NULL,111,(SELECT id FROM store_categories WHERE slug='prislusenstvi-pro-mobily-a-monitory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Rychlonabíjecí kabely (GaN adaptéry, opletené USB-C)','rychlonabijeci-kabely-gan-adaptery-opletene-usb-c',NULL,112,(SELECT id FROM store_categories WHERE slug='prislusenstvi-pro-mobily-a-monitory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ergonomická ramena na monitory','ergonomicka-ramena-na-monitory',NULL,113,(SELECT id FROM store_categories WHERE slug='prislusenstvi-pro-mobily-a-monitory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Chytrá domácnost (Smart Home)','chytra-domacnost-smart-home',NULL,12,(SELECT id FROM store_categories WHERE slug='elektronika-a-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('LED pásky a smart osvětlení','led-pasky-a-smart-osvetleni',NULL,120,(SELECT id FROM store_categories WHERE slug='chytra-domacnost-smart-home'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Bezpečnostní Wi-Fi kamery','bezpecnostni-wi-fi-kamery',NULL,121,(SELECT id FROM store_categories WHERE slug='chytra-domacnost-smart-home'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Senzory teploty, pohybu a úniku vody','senzory-teploty-pohybu-a-uniku-vody',NULL,122,(SELECT id FROM store_categories WHERE slug='chytra-domacnost-smart-home'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Tvorba obsahu & Vlogging','tvorba-obsahu-and-vlogging',NULL,13,(SELECT id FROM store_categories WHERE slug='elektronika-a-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ring lights (kruhová světla) a RGB světelné panely','ring-lights-kruhova-svetla-a-rgb-svetelne-panely',NULL,130,(SELECT id FROM store_categories WHERE slug='tvorba-obsahu-and-vlogging'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Klopové bezdrátové mikrofony k telefonu','klopove-bezdratove-mikrofony-k-telefonu',NULL,131,(SELECT id FROM store_categories WHERE slug='tvorba-obsahu-and-vlogging'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Stabilizátory (gimbaly) a stativy','stabilizatory-gimbaly-a-stativy',NULL,132,(SELECT id FROM store_categories WHERE slug='tvorba-obsahu-and-vlogging'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Herní příslušenství','herni-prislusenstvi',NULL,14,(SELECT id FROM store_categories WHERE slug='elektronika-a-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ergonomické myši a mechanické klávesnice','ergonomicke-mysi-a-mechanicke-klavesnice',NULL,140,(SELECT id FROM store_categories WHERE slug='herni-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('RGB podložky pod myš','rgb-podlozky-pod-mys',NULL,141,(SELECT id FROM store_categories WHERE slug='herni-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Stojany na sluchátka a držáky na ovladače','stojany-na-sluchatka-a-drzaky-na-ovladace',NULL,142,(SELECT id FROM store_categories WHERE slug='herni-prislusenstvi'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Umění, Papírenství a Tvořivost','umeni-papirenstvi-a-tvorivost','palette',2,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Výtvarné potřeby','vytvarne-potreby',NULL,20,(SELECT id FROM store_categories WHERE slug='umeni-papirenstvi-a-tvorivost'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Akrylové, akvarelové a olejové barvy','akrylove-akvarelove-a-olejove-barvy',NULL,200,(SELECT id FROM store_categories WHERE slug='vytvarne-potreby'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Profesionální štětce, špachtle a plátna','profesionalni-stetce-spachtle-a-platna',NULL,201,(SELECT id FROM store_categories WHERE slug='vytvarne-potreby'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Skicáky s vysokou gramáží papíru','skicaky-s-vysokou-gramazi-papiru',NULL,202,(SELECT id FROM store_categories WHERE slug='vytvarne-potreby'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Umělecké fixy a markery na bázi alkoholu','umelecke-fixy-a-markery-na-bazi-alkoholu',NULL,203,(SELECT id FROM store_categories WHERE slug='vytvarne-potreby'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kreativní DIY sady','kreativni-diy-sady',NULL,21,(SELECT id FROM store_categories WHERE slug='umeni-papirenstvi-a-tvorivost'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Sady na výrobu svíček nebo mýdel','sady-na-vyrobu-svicek-nebo-mydel',NULL,210,(SELECT id FROM store_categories WHERE slug='kreativni-diy-sady'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Vyšívání, pletení a macramé sady','vysivani-pleteni-a-macrame-sady',NULL,211,(SELECT id FROM store_categories WHERE slug='kreativni-diy-sady'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Sady pro práci s pryskyřicí (Epoxy art)','sady-pro-praci-s-pryskyrici-epoxy-art',NULL,212,(SELECT id FROM store_categories WHERE slug='kreativni-diy-sady'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Papírenství a organizace','papirenstvi-a-organizace',NULL,22,(SELECT id FROM store_categories WHERE slug='umeni-papirenstvi-a-tvorivost'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Nedatované plánovače, diáře a Bullet Journaly','nedatovane-planovace-diare-a-bullet-journaly',NULL,220,(SELECT id FROM store_categories WHERE slug='papirenstvi-a-organizace'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Estetické lepicí pásky (Washi tapes) a nálepky','esteticke-lepici-pasky-washi-tapes-a-nalepky',NULL,221,(SELECT id FROM store_categories WHERE slug='papirenstvi-a-organizace'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kaligrafická pera a štětcové fixy (Brush peny)','kaligraficka-pera-a-stetcove-fixy-brush-peny',NULL,222,(SELECT id FROM store_categories WHERE slug='papirenstvi-a-organizace'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Domov, Kuchyně a Bydlení','domov-kuchyne-a-bydleni','home',3,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Organizéry a úložné prostory','organizery-a-ulozne-prostory',NULL,30,(SELECT id FROM store_categories WHERE slug='domov-kuchyne-a-bydleni'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Organizéry do kuchyňských linek a lednice','organizery-do-kuchynskych-linek-a-lednice',NULL,300,(SELECT id FROM store_categories WHERE slug='organizery-a-ulozne-prostory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Dávkovače, kořenky a skleněné dózy','davkovace-korenky-a-sklenene-dozy',NULL,301,(SELECT id FROM store_categories WHERE slug='organizery-a-ulozne-prostory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Boxy pod postel a šatní organizéry','boxy-pod-postel-a-satni-organizery',NULL,302,(SELECT id FROM store_categories WHERE slug='organizery-a-ulozne-prostory'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Káva, Čaj & Nápoje','kava-caj-and-napoje',NULL,31,(SELECT id FROM store_categories WHERE slug='domov-kuchyne-a-bydleni'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ruční mlýnky na kávu a French pressy','rucni-mlynky-na-kavu-a-french-pressy',NULL,310,(SELECT id FROM store_categories WHERE slug='kava-caj-and-napoje'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Nerezové a skleněné termo lahve','nerezove-a-sklenene-termo-lahve',NULL,311,(SELECT id FROM store_categories WHERE slug='kava-caj-and-napoje'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Sady na přípravu Matcha čaje','sady-na-pripravu-matcha-caje',NULL,312,(SELECT id FROM store_categories WHERE slug='kava-caj-and-napoje'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Osvětlení a atmosféra','osvetleni-a-atmosfera',NULL,32,(SELECT id FROM store_categories WHERE slug='domov-kuchyne-a-bydleni'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Designové stolní lampičky','designove-stolni-lampicky',NULL,320,(SELECT id FROM store_categories WHERE slug='osvetleni-a-atmosfera'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Aroma difuzéry a zvlhčovače vzduchu','aroma-difuzery-a-zvlhcovace-vzduchu',NULL,321,(SELECT id FROM store_categories WHERE slug='osvetleni-a-atmosfera'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Svíčky ze sójového vosku','svicky-ze-sojoveho-vosku',NULL,322,(SELECT id FROM store_categories WHERE slug='osvetleni-a-atmosfera'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Domácí rostliny & Hydroponie','domaci-rostliny-and-hydroponie',NULL,33,(SELECT id FROM store_categories WHERE slug='domov-kuchyne-a-bydleni'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Self-watering (samozavlažovací) květináče','self-watering-samozavlazovaci-kvetinace',NULL,330,(SELECT id FROM store_categories WHERE slug='domaci-rostliny-and-hydroponie'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('LED osvětlení pro pěstování (Grow lights)','led-osvetleni-pro-pestovani-grow-lights',NULL,331,(SELECT id FROM store_categories WHERE slug='domaci-rostliny-and-hydroponie'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Designové konvičky a rozprašovače','designove-konvicky-a-rozprasovace',NULL,332,(SELECT id FROM store_categories WHERE slug='domaci-rostliny-and-hydroponie'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Sport, Fitness a Outdoor','sport-fitness-a-outdoor','fitness_center',4,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Cvičení doma','cviceni-doma',NULL,40,(SELECT id FROM store_categories WHERE slug='sport-fitness-a-outdoor'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Odporové gumy (Resistance bands)','odporove-gumy-resistance-bands',NULL,400,(SELECT id FROM store_categories WHERE slug='cviceni-doma'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Protiskluzové podložky na jógu','protiskluzove-podlozky-na-jogu',NULL,401,(SELECT id FROM store_categories WHERE slug='cviceni-doma'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Masážní válce (Foam rollery) a masážní pistole','masazni-valce-foam-rollery-a-masazni-pistole',NULL,402,(SELECT id FROM store_categories WHERE slug='cviceni-doma'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Outdoor a Kempování','outdoor-a-kempovani',NULL,41,(SELECT id FROM store_categories WHERE slug='sport-fitness-a-outdoor'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ultra-lehké houpací sítě (hamaky)','ultra-lehke-houpaci-site-hamaky',NULL,410,(SELECT id FROM store_categories WHERE slug='outdoor-a-kempovani'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Solární powerbanky a outdoorová světla','solarni-powerbanky-a-outdoorova-svetla',NULL,411,(SELECT id FROM store_categories WHERE slug='outdoor-a-kempovani'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Skládací nerezové nádobí','skladaci-nerezove-nadobi',NULL,412,(SELECT id FROM store_categories WHERE slug='outdoor-a-kempovani'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Cyklistika a mikromobilita','cyklistika-a-mikromobilita',NULL,42,(SELECT id FROM store_categories WHERE slug='sport-fitness-a-outdoor'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Brašny na kolo a koloběžky','brasny-na-kolo-a-kolobezky',NULL,420,(SELECT id FROM store_categories WHERE slug='cyklistika-a-mikromobilita'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Výkonná světla na kolo s USB nabíjením','vykonna-svetla-na-kolo-s-usb-nabijenim',NULL,421,(SELECT id FROM store_categories WHERE slug='cyklistika-a-mikromobilita'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Zámky a držáky na telefon','zamky-a-drzaky-na-telefon',NULL,422,(SELECT id FROM store_categories WHERE slug='cyklistika-a-mikromobilita'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Móda, Oblečení a Doplňky','moda-obleceni-a-doplnky','checkroom',5,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Streetwear & Volný čas','streetwear-and-volny-cas',NULL,50,(SELECT id FROM store_categories WHERE slug='moda-obleceni-a-doplnky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Unisex mikiny a trička z těžké bavlny (Heavyweight)','unisex-mikiny-a-tricka-z-tezke-bavlny-heavyweight',NULL,500,(SELECT id FROM store_categories WHERE slug='streetwear-and-volny-cas'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ponožky s originálními motivy','ponozky-s-originalnimi-motivy',NULL,501,(SELECT id FROM store_categories WHERE slug='streetwear-and-volny-cas'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kšiltovky, čepice a bucket hats','ksiltovky-cepice-a-bucket-hats',NULL,502,(SELECT id FROM store_categories WHERE slug='streetwear-and-volny-cas'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Doplňky a Šperky','doplnky-a-sperky',NULL,51,(SELECT id FROM store_categories WHERE slug='moda-obleceni-a-doplnky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Minimalistické šperky z chirurgické oceli','minimalisticke-sperky-z-chirurgicke-oceli',NULL,510,(SELECT id FROM store_categories WHERE slug='doplnky-a-sperky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Sluneční brýle','slunecni-bryle',NULL,511,(SELECT id FROM store_categories WHERE slug='doplnky-a-sperky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kožené i textilní opasky','kozene-i-textilni-opasky',NULL,512,(SELECT id FROM store_categories WHERE slug='doplnky-a-sperky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Tašky a Zazipované doplňky','tasky-a-zazipovane-doplnky',NULL,52,(SELECT id FROM store_categories WHERE slug='moda-obleceni-a-doplnky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Batohy na notebook s proti-krádežovými prvky','batohy-na-notebook-s-proti-kradezovymi-prvky',NULL,520,(SELECT id FROM store_categories WHERE slug='tasky-a-zazipovane-doplnky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ledvinky a crossbody tašky','ledvinky-a-crossbody-tasky',NULL,521,(SELECT id FROM store_categories WHERE slug='tasky-a-zazipovane-doplnky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Cestovní organizéry do kufru (Packing cubes)','cestovni-organizery-do-kufru-packing-cubes',NULL,522,(SELECT id FROM store_categories WHERE slug='tasky-a-zazipovane-doplnky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Krása, Zdraví a Osobní péče','krasa-zdravi-a-osobni-pece','spa',6,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Péče o pleť (Skincare)','pece-o-plet-skincare',NULL,60,(SELECT id FROM store_categories WHERE slug='krasa-zdravi-a-osobni-pece'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Masážní kameny (Gua Sha) a obličejové válečky','masazni-kameny-gua-sha-a-oblicejove-valecky',NULL,600,(SELECT id FROM store_categories WHERE slug='pece-o-plet-skincare'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Čisticí silikonové kartáčky na obličej','cistici-silikonove-kartacky-na-oblicej',NULL,601,(SELECT id FROM store_categories WHERE slug='pece-o-plet-skincare'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kosmetické taštičky a organizéry','kosmeticke-tasticky-a-organizery',NULL,602,(SELECT id FROM store_categories WHERE slug='pece-o-plet-skincare'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Vlasová péče a Styling','vlasova-pece-a-styling',NULL,61,(SELECT id FROM store_categories WHERE slug='krasa-zdravi-a-osobni-pece'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Hedvábné gumičky a povlaky na polštáře','hedvabne-gumicky-a-povlaky-na-polstare',NULL,610,(SELECT id FROM store_categories WHERE slug='vlasova-pece-a-styling'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Kartáče na rozčesávání a masáž pokožky hlavy','kartace-na-rozcesavani-a-masaz-pokozky-hlavy',NULL,611,(SELECT id FROM store_categories WHERE slug='vlasova-pece-a-styling'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Péče o tělo & Relaxace','pece-o-telo-and-relaxace',NULL,62,(SELECT id FROM store_categories WHERE slug='krasa-zdravi-a-osobni-pece'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Polštáře s paměťovou pěnou pro lepší spánek','polstare-s-pametovou-penou-pro-lepsi-spanek',NULL,620,(SELECT id FROM store_categories WHERE slug='pece-o-telo-and-relaxace'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Nahřívací polštářky a masky na oči','nahrivaci-polstarky-a-masky-na-oci',NULL,621,(SELECT id FROM store_categories WHERE slug='pece-o-telo-and-relaxace'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Sady na manikúru a pedikúru','sady-na-manikuru-a-pedikuru',NULL,622,(SELECT id FROM store_categories WHERE slug='pece-o-telo-and-relaxace'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Chovatelské potřeby (Pet Products)','chovatelske-potreby-pet-products','pets',7,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Pro psy','pro-psy',NULL,70,(SELECT id FROM store_categories WHERE slug='chovatelske-potreby-pet-products'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Nastavitelné postroje a designová vodítka','nastavitelne-postroje-a-designova-voditka',NULL,700,(SELECT id FROM store_categories WHERE slug='pro-psy'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Interaktivní hlavolamy na pamlsky','interaktivni-hlavolamy-na-pamlsky',NULL,701,(SELECT id FROM store_categories WHERE slug='pro-psy'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Ortopedické pelíšky','ortopedicke-pelisky',NULL,702,(SELECT id FROM store_categories WHERE slug='pro-psy'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Pro kočky','pro-kocky',NULL,71,(SELECT id FROM store_categories WHERE slug='chovatelske-potreby-pet-products'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Moderní škrabadla a odpočívadla','moderni-skrabadla-a-odpocivadla',NULL,710,(SELECT id FROM store_categories WHERE slug='pro-kocky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Automatická pítka a dávkovače krmiva','automaticka-pitka-a-davkovace-krmiva',NULL,711,(SELECT id FROM store_categories WHERE slug='pro-kocky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Hračky s šantou kočičí (Catnip)','hracky-s-santou-kocici-catnip',NULL,712,(SELECT id FROM store_categories WHERE slug='pro-kocky'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Eko & Udržitelný životní styl','eko-and-udrzitelny-zivotni-styl','eco',8,NULL);
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Domácnost bez odpadu (Zero Waste)','domacnost-bez-odpadu-zero-waste',NULL,80,(SELECT id FROM store_categories WHERE slug='eko-and-udrzitelny-zivotni-styl'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Znovupoužitelné voskované ubrousky na potraviny','znovupouzitelne-voskovane-ubrousky-na-potraviny',NULL,800,(SELECT id FROM store_categories WHERE slug='domacnost-bez-odpadu-zero-waste'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Nerezová a skleněná brčka','nerezova-a-sklenena-brcka',NULL,801,(SELECT id FROM store_categories WHERE slug='domacnost-bez-odpadu-zero-waste'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Bambusové kartáčky a čisticí doplňky','bambusove-kartacky-a-cistici-doplnky',NULL,802,(SELECT id FROM store_categories WHERE slug='domacnost-bez-odpadu-zero-waste'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Eko hygiena','eko-hygiena',NULL,81,(SELECT id FROM store_categories WHERE slug='eko-and-udrzitelny-zivotni-styl'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Tuhé šampony a mýdla','tuhe-sampony-a-mydla',NULL,810,(SELECT id FROM store_categories WHERE slug='eko-hygiena'));
INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ('Odličovací pratelné tampóny','odlicovaci-pratelne-tampony',NULL,811,(SELECT id FROM store_categories WHERE slug='eko-hygiena'));
