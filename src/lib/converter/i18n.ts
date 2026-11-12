// Texty převodníků Word ⇄ PDF ve všech 7 jazycích webu. Ostatní nástroje mají zatím jen
// cs/en (TOOL_UI_I18N); tyhle dva nástroje jsou plně lokalizované.
import type { Locale } from "@/components/tools/registry/data";

export interface DocxPdfStrings {
  dz_title: string; dz_hint: string; dz_accept: string;
  privacy: string;
  opt_pdfa: string; opt_pdfa_hint: string; opt_local_fonts: string; opt_local_fonts_hint: string;
  convert: string; cancel: string; reset: string; download: string;
  phase_engine: string; phase_engine_cached: string; phase_fonts: string; phase_prepare: string; phase_convert: string; phase_finish: string;
  first_use: string; weak_device: string; big_file: string;
  warnings_title: string;
  warn_font: string; warn_font_metric: string; warn_macros: string; warn_local: string; warn_embedded: string;
  result_meta: string; preview_alt: string; done: string;
  password_label: string; password_submit: string;
  err_file_too_large: string; err_zip_bomb: string; err_encrypted: string; err_wrong_password: string; err_invalid_file: string;
  err_out_of_memory: string; err_engine_load: string; err_convert_failed: string; err_too_many_pages: string; err_pdfa: string;
  licenses: string;
}

const cs: DocxPdfStrings = {
  dz_title: "Přetáhněte sem dokument Word", dz_hint: "nebo klikněte pro výběr", dz_accept: ".docx · jeden soubor",
  privacy: "Převod probíhá ve vašem prohlížeči, soubor se nikam neodesílá.",
  opt_pdfa: "PDF/A-2b pro archivaci", opt_pdfa_hint: "Vhodné pro faktury a dokumenty, které musíte dlouhodobě uchovávat.",
  opt_local_fonts: "Použít fonty nainstalované v počítači", opt_local_fonts_hint: "Prohlížeč se zeptá na povolení. Fonty se načtou jen lokálně.",
  convert: "Převést do PDF", cancel: "Zrušit", reset: "Převést jiný dokument", download: "Stáhnout PDF",
  phase_engine: "Stahuji převodní engine… {loaded} z {total}", phase_engine_cached: "Převodní engine je připraven", phase_fonts: "Stahuji fonty… {loaded} z {total}",
  phase_prepare: "Připravuji dokument…", phase_convert: "Převádím dokument…", phase_finish: "Dokončuji PDF…",
  first_use: "Při prvním použití se stáhne převodní engine (asi {size}). Příště už bude k dispozici okamžitě, i bez připojení.",
  weak_device: "Toto zařízení má málo paměti. Dokumenty nad {size} nemusí jít převést.",
  big_file: "Velký dokument, převod může chvíli trvat.",
  warnings_title: "Upozornění",
  warn_font: "Font {requested} není k dispozici, použit {used}.", warn_font_metric: "Font {requested} není k dispozici, použit {used} (stejné šířky znaků, zalomení řádků zůstane).",
  warn_macros: "Dokument obsahuje makra. Makra se nikdy nespouštějí a do PDF se nepřenesou.",
  warn_local: "Použity fonty z vašeho počítače: {list}.", warn_embedded: "Použity fonty vložené v dokumentu: {list}.",
  result_meta: "{pages} str. · {size}", preview_alt: "Náhled první strany", done: "PDF je připraveno",
  password_label: "Dokument je chráněný heslem. Zadejte heslo:", password_submit: "Odemknout a převést",
  err_file_too_large: "Soubor je větší než limit {limit} pro toto zařízení.",
  err_zip_bomb: "Soubor vypadá poškozeně nebo podezřele (po rozbalení by byl příliš velký). Převod byl zastaven.",
  err_encrypted: "Dokument je chráněný heslem.", err_wrong_password: "Heslo není správné.",
  err_invalid_file: "Soubor není dokument Word (.docx) nebo je poškozený.",
  err_out_of_memory: "Na převod tohoto dokumentu nemá prohlížeč dost paměti. Zkuste menší dokument nebo počítač s více pamětí.",
  err_engine_load: "Převodní engine se nepodařilo stáhnout. Zkontrolujte připojení a zkuste to znovu.",
  err_convert_failed: "Převod se nezdařil: {message}", err_too_many_pages: "Dokument má víc než {limit} stran.",
  err_pdfa: "Dokument nejde uložit jako PDF/A: {message}. Zkuste převod bez PDF/A.",
  licenses: "Licence komponent",
};

const en: DocxPdfStrings = {
  dz_title: "Drop a Word document here", dz_hint: "or click to choose", dz_accept: ".docx · one file",
  privacy: "Conversion runs in your browser, the file is never uploaded.",
  opt_pdfa: "PDF/A-2b for archiving", opt_pdfa_hint: "For invoices and documents you need to keep long term.",
  opt_local_fonts: "Use fonts installed on this computer", opt_local_fonts_hint: "The browser asks for permission. Fonts are only read locally.",
  convert: "Convert to PDF", cancel: "Cancel", reset: "Convert another document", download: "Download PDF",
  phase_engine: "Downloading the conversion engine… {loaded} of {total}", phase_engine_cached: "Conversion engine ready", phase_fonts: "Downloading fonts… {loaded} of {total}",
  phase_prepare: "Preparing the document…", phase_convert: "Converting…", phase_finish: "Finishing the PDF…",
  first_use: "The first use downloads the conversion engine (about {size}). Next time it is available instantly, even offline.",
  weak_device: "This device has little memory. Documents over {size} may fail to convert.",
  big_file: "Large document, conversion may take a while.",
  warnings_title: "Warnings",
  warn_font: "Font {requested} is not available, {used} was used.", warn_font_metric: "Font {requested} is not available, {used} was used (same character widths, line breaks are kept).",
  warn_macros: "The document contains macros. Macros are never run and are not carried into the PDF.",
  warn_local: "Fonts from your computer were used: {list}.", warn_embedded: "Fonts embedded in the document were used: {list}.",
  result_meta: "{pages} pages · {size}", preview_alt: "Preview of the first page", done: "The PDF is ready",
  password_label: "The document is password protected. Enter the password:", password_submit: "Unlock and convert",
  err_file_too_large: "The file is larger than the {limit} limit for this device.",
  err_zip_bomb: "The file looks damaged or suspicious (it would be too large when unpacked). Conversion was stopped.",
  err_encrypted: "The document is password protected.", err_wrong_password: "The password is incorrect.",
  err_invalid_file: "The file is not a Word document (.docx) or it is damaged.",
  err_out_of_memory: "The browser does not have enough memory for this document. Try a smaller document or a computer with more memory.",
  err_engine_load: "The conversion engine could not be downloaded. Check your connection and try again.",
  err_convert_failed: "Conversion failed: {message}", err_too_many_pages: "The document has more than {limit} pages.",
  err_pdfa: "The document cannot be saved as PDF/A: {message}. Try converting without PDF/A.",
  licenses: "Component licences",
};

const de: DocxPdfStrings = {
  dz_title: "Word-Dokument hierher ziehen", dz_hint: "oder zum Auswählen klicken", dz_accept: ".docx · eine Datei",
  privacy: "Die Umwandlung läuft in Ihrem Browser, die Datei wird nirgendwohin gesendet.",
  opt_pdfa: "PDF/A-2b zur Archivierung", opt_pdfa_hint: "Für Rechnungen und Dokumente, die Sie lange aufbewahren müssen.",
  opt_local_fonts: "Auf diesem Computer installierte Schriften verwenden", opt_local_fonts_hint: "Der Browser fragt nach der Erlaubnis. Schriften werden nur lokal gelesen.",
  convert: "In PDF umwandeln", cancel: "Abbrechen", reset: "Anderes Dokument umwandeln", download: "PDF herunterladen",
  phase_engine: "Umwandlungs-Engine wird geladen… {loaded} von {total}", phase_engine_cached: "Umwandlungs-Engine bereit", phase_fonts: "Schriften werden geladen… {loaded} von {total}",
  phase_prepare: "Dokument wird vorbereitet…", phase_convert: "Wird umgewandelt…", phase_finish: "PDF wird fertiggestellt…",
  first_use: "Beim ersten Mal wird die Umwandlungs-Engine geladen (etwa {size}). Danach steht sie sofort bereit, auch offline.",
  weak_device: "Dieses Gerät hat wenig Arbeitsspeicher. Dokumente über {size} lassen sich eventuell nicht umwandeln.",
  big_file: "Großes Dokument, die Umwandlung kann etwas dauern.",
  warnings_title: "Hinweise",
  warn_font: "Schrift {requested} ist nicht verfügbar, {used} wurde verwendet.", warn_font_metric: "Schrift {requested} ist nicht verfügbar, {used} wurde verwendet (gleiche Zeichenbreiten, Zeilenumbrüche bleiben).",
  warn_macros: "Das Dokument enthält Makros. Makros werden nie ausgeführt und nicht ins PDF übernommen.",
  warn_local: "Schriften von Ihrem Computer wurden verwendet: {list}.", warn_embedded: "Im Dokument eingebettete Schriften wurden verwendet: {list}.",
  result_meta: "{pages} S. · {size}", preview_alt: "Vorschau der ersten Seite", done: "Das PDF ist fertig",
  password_label: "Das Dokument ist passwortgeschützt. Passwort eingeben:", password_submit: "Entsperren und umwandeln",
  err_file_too_large: "Die Datei ist größer als das Limit von {limit} für dieses Gerät.",
  err_zip_bomb: "Die Datei wirkt beschädigt oder verdächtig (entpackt wäre sie zu groß). Die Umwandlung wurde gestoppt.",
  err_encrypted: "Das Dokument ist passwortgeschützt.", err_wrong_password: "Das Passwort ist falsch.",
  err_invalid_file: "Die Datei ist kein Word-Dokument (.docx) oder beschädigt.",
  err_out_of_memory: "Der Browser hat für dieses Dokument nicht genug Speicher. Versuchen Sie ein kleineres Dokument oder einen Computer mit mehr Speicher.",
  err_engine_load: "Die Umwandlungs-Engine konnte nicht geladen werden. Prüfen Sie die Verbindung und versuchen Sie es erneut.",
  err_convert_failed: "Umwandlung fehlgeschlagen: {message}", err_too_many_pages: "Das Dokument hat mehr als {limit} Seiten.",
  err_pdfa: "Das Dokument kann nicht als PDF/A gespeichert werden: {message}. Versuchen Sie es ohne PDF/A.",
  licenses: "Lizenzen der Komponenten",
};

const es: DocxPdfStrings = {
  dz_title: "Arrastre aquí un documento de Word", dz_hint: "o haga clic para elegirlo", dz_accept: ".docx · un archivo",
  privacy: "La conversión se realiza en su navegador, el archivo no se envía a ningún sitio.",
  opt_pdfa: "PDF/A-2b para archivo", opt_pdfa_hint: "Para facturas y documentos que debe conservar a largo plazo.",
  opt_local_fonts: "Usar las fuentes instaladas en este ordenador", opt_local_fonts_hint: "El navegador pedirá permiso. Las fuentes solo se leen localmente.",
  convert: "Convertir a PDF", cancel: "Cancelar", reset: "Convertir otro documento", download: "Descargar PDF",
  phase_engine: "Descargando el motor de conversión… {loaded} de {total}", phase_engine_cached: "Motor de conversión listo", phase_fonts: "Descargando fuentes… {loaded} de {total}",
  phase_prepare: "Preparando el documento…", phase_convert: "Convirtiendo…", phase_finish: "Terminando el PDF…",
  first_use: "La primera vez se descarga el motor de conversión (unos {size}). Después estará disponible al instante, incluso sin conexión.",
  weak_device: "Este dispositivo tiene poca memoria. Los documentos de más de {size} podrían no convertirse.",
  big_file: "Documento grande, la conversión puede tardar un poco.",
  warnings_title: "Avisos",
  warn_font: "La fuente {requested} no está disponible, se usó {used}.", warn_font_metric: "La fuente {requested} no está disponible, se usó {used} (mismos anchos de carácter, se mantienen los saltos de línea).",
  warn_macros: "El documento contiene macros. Las macros nunca se ejecutan y no pasan al PDF.",
  warn_local: "Se usaron fuentes de su ordenador: {list}.", warn_embedded: "Se usaron fuentes incrustadas en el documento: {list}.",
  result_meta: "{pages} págs. · {size}", preview_alt: "Vista previa de la primera página", done: "El PDF está listo",
  password_label: "El documento está protegido con contraseña. Introdúzcala:", password_submit: "Desbloquear y convertir",
  err_file_too_large: "El archivo supera el límite de {limit} para este dispositivo.",
  err_zip_bomb: "El archivo parece dañado o sospechoso (sería demasiado grande al descomprimirlo). Se detuvo la conversión.",
  err_encrypted: "El documento está protegido con contraseña.", err_wrong_password: "La contraseña no es correcta.",
  err_invalid_file: "El archivo no es un documento de Word (.docx) o está dañado.",
  err_out_of_memory: "El navegador no tiene memoria suficiente para este documento. Pruebe con uno más pequeño o con un ordenador con más memoria.",
  err_engine_load: "No se pudo descargar el motor de conversión. Compruebe la conexión e inténtelo de nuevo.",
  err_convert_failed: "La conversión falló: {message}", err_too_many_pages: "El documento tiene más de {limit} páginas.",
  err_pdfa: "El documento no se puede guardar como PDF/A: {message}. Pruebe sin PDF/A.",
  licenses: "Licencias de los componentes",
};

const uk: DocxPdfStrings = {
  dz_title: "Перетягніть сюди документ Word", dz_hint: "або клацніть, щоб вибрати", dz_accept: ".docx · один файл",
  privacy: "Перетворення відбувається у вашому браузері, файл нікуди не надсилається.",
  opt_pdfa: "PDF/A-2b для архівування", opt_pdfa_hint: "Для рахунків і документів, які потрібно довго зберігати.",
  opt_local_fonts: "Використати шрифти, встановлені на комп’ютері", opt_local_fonts_hint: "Браузер попросить дозвіл. Шрифти читаються лише локально.",
  convert: "Перетворити на PDF", cancel: "Скасувати", reset: "Перетворити інший документ", download: "Завантажити PDF",
  phase_engine: "Завантажую рушій перетворення… {loaded} з {total}", phase_engine_cached: "Рушій перетворення готовий", phase_fonts: "Завантажую шрифти… {loaded} з {total}",
  phase_prepare: "Готую документ…", phase_convert: "Перетворюю…", phase_finish: "Завершую PDF…",
  first_use: "Під час першого використання завантажується рушій перетворення (близько {size}). Наступного разу він буде доступний одразу, навіть офлайн.",
  weak_device: "На цьому пристрої мало пам’яті. Документи понад {size} можуть не перетворитися.",
  big_file: "Великий документ, перетворення може тривати довше.",
  warnings_title: "Попередження",
  warn_font: "Шрифт {requested} недоступний, використано {used}.", warn_font_metric: "Шрифт {requested} недоступний, використано {used} (ті самі ширини символів, переноси рядків збережено).",
  warn_macros: "Документ містить макроси. Макроси ніколи не запускаються і не переносяться в PDF.",
  warn_local: "Використано шрифти з вашого комп’ютера: {list}.", warn_embedded: "Використано шрифти, вбудовані в документ: {list}.",
  result_meta: "{pages} стор. · {size}", preview_alt: "Попередній перегляд першої сторінки", done: "PDF готовий",
  password_label: "Документ захищено паролем. Введіть пароль:", password_submit: "Розблокувати й перетворити",
  err_file_too_large: "Файл більший за ліміт {limit} для цього пристрою.",
  err_zip_bomb: "Файл виглядає пошкодженим або підозрілим (після розпакування був би завеликий). Перетворення зупинено.",
  err_encrypted: "Документ захищено паролем.", err_wrong_password: "Неправильний пароль.",
  err_invalid_file: "Файл не є документом Word (.docx) або пошкоджений.",
  err_out_of_memory: "Браузеру не вистачає пам’яті для цього документа. Спробуйте менший документ або комп’ютер з більшим обсягом пам’яті.",
  err_engine_load: "Не вдалося завантажити рушій перетворення. Перевірте з’єднання і спробуйте ще раз.",
  err_convert_failed: "Перетворення не вдалося: {message}", err_too_many_pages: "Документ має понад {limit} сторінок.",
  err_pdfa: "Документ не можна зберегти як PDF/A: {message}. Спробуйте без PDF/A.",
  licenses: "Ліцензії компонентів",
};

const fr: DocxPdfStrings = {
  dz_title: "Déposez ici un document Word", dz_hint: "ou cliquez pour choisir", dz_accept: ".docx · un fichier",
  privacy: "La conversion se fait dans votre navigateur, le fichier n’est envoyé nulle part.",
  opt_pdfa: "PDF/A-2b pour l’archivage", opt_pdfa_hint: "Pour les factures et les documents à conserver longtemps.",
  opt_local_fonts: "Utiliser les polices installées sur cet ordinateur", opt_local_fonts_hint: "Le navigateur demande l’autorisation. Les polices sont lues uniquement en local.",
  convert: "Convertir en PDF", cancel: "Annuler", reset: "Convertir un autre document", download: "Télécharger le PDF",
  phase_engine: "Téléchargement du moteur de conversion… {loaded} sur {total}", phase_engine_cached: "Moteur de conversion prêt", phase_fonts: "Téléchargement des polices… {loaded} sur {total}",
  phase_prepare: "Préparation du document…", phase_convert: "Conversion…", phase_finish: "Finalisation du PDF…",
  first_use: "La première utilisation télécharge le moteur de conversion (environ {size}). Ensuite, il est disponible immédiatement, même hors ligne.",
  weak_device: "Cet appareil a peu de mémoire. Les documents de plus de {size} risquent de ne pas être convertis.",
  big_file: "Document volumineux, la conversion peut prendre un moment.",
  warnings_title: "Avertissements",
  warn_font: "La police {requested} n’est pas disponible, {used} a été utilisée.", warn_font_metric: "La police {requested} n’est pas disponible, {used} a été utilisée (mêmes largeurs de caractères, les retours à la ligne sont conservés).",
  warn_macros: "Le document contient des macros. Les macros ne sont jamais exécutées et ne passent pas dans le PDF.",
  warn_local: "Des polices de votre ordinateur ont été utilisées : {list}.", warn_embedded: "Des polices incorporées au document ont été utilisées : {list}.",
  result_meta: "{pages} p. · {size}", preview_alt: "Aperçu de la première page", done: "Le PDF est prêt",
  password_label: "Le document est protégé par un mot de passe. Saisissez-le :", password_submit: "Déverrouiller et convertir",
  err_file_too_large: "Le fichier dépasse la limite de {limit} pour cet appareil.",
  err_zip_bomb: "Le fichier semble endommagé ou suspect (il serait trop volumineux une fois décompressé). La conversion a été arrêtée.",
  err_encrypted: "Le document est protégé par un mot de passe.", err_wrong_password: "Le mot de passe est incorrect.",
  err_invalid_file: "Le fichier n’est pas un document Word (.docx) ou il est endommagé.",
  err_out_of_memory: "Le navigateur n’a pas assez de mémoire pour ce document. Essayez un document plus petit ou un ordinateur avec plus de mémoire.",
  err_engine_load: "Le moteur de conversion n’a pas pu être téléchargé. Vérifiez la connexion et réessayez.",
  err_convert_failed: "La conversion a échoué : {message}", err_too_many_pages: "Le document compte plus de {limit} pages.",
  err_pdfa: "Le document ne peut pas être enregistré en PDF/A : {message}. Essayez sans PDF/A.",
  licenses: "Licences des composants",
};

const sk: DocxPdfStrings = {
  dz_title: "Presuňte sem dokument Word", dz_hint: "alebo kliknite a vyberte", dz_accept: ".docx · jeden súbor",
  privacy: "Prevod prebieha vo vašom prehliadači, súbor sa nikam neodosiela.",
  opt_pdfa: "PDF/A-2b na archiváciu", opt_pdfa_hint: "Vhodné pre faktúry a dokumenty, ktoré musíte dlhodobo uchovávať.",
  opt_local_fonts: "Použiť písma nainštalované v počítači", opt_local_fonts_hint: "Prehliadač sa spýta na povolenie. Písma sa načítajú len lokálne.",
  convert: "Previesť do PDF", cancel: "Zrušiť", reset: "Previesť iný dokument", download: "Stiahnuť PDF",
  phase_engine: "Sťahujem prevodný engine… {loaded} z {total}", phase_engine_cached: "Prevodný engine je pripravený", phase_fonts: "Sťahujem písma… {loaded} z {total}",
  phase_prepare: "Pripravujem dokument…", phase_convert: "Prevádzam dokument…", phase_finish: "Dokončujem PDF…",
  first_use: "Pri prvom použití sa stiahne prevodný engine (asi {size}). Nabudúce bude k dispozícii okamžite, aj bez pripojenia.",
  weak_device: "Toto zariadenie má málo pamäte. Dokumenty nad {size} sa nemusia dať previesť.",
  big_file: "Veľký dokument, prevod môže chvíľu trvať.",
  warnings_title: "Upozornenia",
  warn_font: "Písmo {requested} nie je k dispozícii, použité {used}.", warn_font_metric: "Písmo {requested} nie je k dispozícii, použité {used} (rovnaké šírky znakov, zalomenie riadkov zostane).",
  warn_macros: "Dokument obsahuje makrá. Makrá sa nikdy nespúšťajú a do PDF sa neprenesú.",
  warn_local: "Použité písma z vášho počítača: {list}.", warn_embedded: "Použité písma vložené v dokumente: {list}.",
  result_meta: "{pages} str. · {size}", preview_alt: "Náhľad prvej strany", done: "PDF je pripravené",
  password_label: "Dokument je chránený heslom. Zadajte heslo:", password_submit: "Odomknúť a previesť",
  err_file_too_large: "Súbor je väčší ako limit {limit} pre toto zariadenie.",
  err_zip_bomb: "Súbor vyzerá poškodene alebo podozrivo (po rozbalení by bol príliš veľký). Prevod bol zastavený.",
  err_encrypted: "Dokument je chránený heslom.", err_wrong_password: "Heslo nie je správne.",
  err_invalid_file: "Súbor nie je dokument Word (.docx) alebo je poškodený.",
  err_out_of_memory: "Prehliadač nemá na prevod tohto dokumentu dosť pamäte. Skúste menší dokument alebo počítač s väčšou pamäťou.",
  err_engine_load: "Prevodný engine sa nepodarilo stiahnuť. Skontrolujte pripojenie a skúste to znova.",
  err_convert_failed: "Prevod sa nepodaril: {message}", err_too_many_pages: "Dokument má viac ako {limit} strán.",
  err_pdfa: "Dokument nejde uložiť ako PDF/A: {message}. Skúste prevod bez PDF/A.",
  licenses: "Licencie komponentov",
};

export const DOCX_PDF_I18N: Record<Locale, DocxPdfStrings> = { cs, en, de, es, uk, fr, sk };

export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

// ── PDF → Word ──────────────────────────────────────────────────────────

export interface PdfDocxStrings {
  dz_title: string; dz_accept: string;
  mode_label: string; mode_editable: string; mode_editable_hint: string; mode_exact: string; mode_exact_hint: string;
  opt_ocr: string; opt_ocr_hint: string;
  convert: string; download: string;
  phase_engine: string; phase_prepare: string; phase_page: string; phase_ocr_load: string; phase_ocr: string;
  warn_font_metric: string; warn_font_name: string; warn_font_uncommon: string; warn_ocr: string; warn_low: string; warn_scanned: string; warn_tagged: string;
  warn_columns: string;
  result_meta: string; preview_show: string; preview_note: string;
  err_encrypted: string; pdf_password_link: string;
}

const pcs: PdfDocxStrings = {
  dz_title: "Přetáhněte sem PDF", dz_accept: ".pdf · jeden soubor",
  mode_label: "Režim převodu", mode_editable: "Upravitelný", mode_editable_hint: "Skutečné odstavce, tabulky a styly. Pohodlné úpravy.",
  mode_exact: "Přesný", mode_exact_hint: "Každý prvek na přesném místě jako v PDF. Úpravy jsou méně pohodlné.",
  opt_ocr: "Rozpoznat text ve skenovaných stránkách (OCR)", opt_ocr_hint: "Čeština a angličtina. Při prvním použití se stáhne asi 10 MB dat.",
  convert: "Převést do Wordu", download: "Stáhnout DOCX",
  phase_engine: "Načítám PDF engine…", phase_prepare: "Otevírám PDF…", phase_page: "Zpracovávám stranu {page} z {pages}…",
  phase_ocr_load: "Načítám rozpoznávání textu (OCR)…", phase_ocr: "Rozpoznávám text na straně {page}…",
  warn_font_metric: "Font {source} je v dokumentu jako {used} (stejné šířky znaků).", warn_font_name: "Font {source} je v dokumentu jako {used}.",
  warn_font_uncommon: "Font {source} nemusí být v počítači nainstalovaný, Word ho případně nahradí jiným.",
  warn_ocr: "Text na stranách {pages} byl rozpoznán pomocí OCR. Zkontrolujte ho.", warn_low: "Strany s nízkou jistotou rozpoznání: {pages}.",
  warn_scanned: "Strany {pages} jsou sken bez textu. Pro upravitelný text zapněte OCR.", warn_tagged: "PDF má strukturu (tagy), využita pro odstavce a tabulky.", warn_columns: "U vícesloupcových skenů zkontrolujte pořadí textu (strany {pages}).",
  result_meta: "{pages} str. · {tables} tabulek · {size}", preview_show: "Zobrazit náhled výsledku", preview_note: "Náhled vykreslí převodní engine Word → PDF (asi {size}, jen poprvé).",
  err_encrypted: "PDF je chráněné heslem. Zadejte heslo níže, nebo ho odstraňte nástrojem", pdf_password_link: "Ochrana PDF heslem",
};
const pen: PdfDocxStrings = {
  dz_title: "Drop a PDF here", dz_accept: ".pdf · one file",
  mode_label: "Conversion mode", mode_editable: "Editable", mode_editable_hint: "Real paragraphs, tables and styles. Easy to edit.",
  mode_exact: "Exact", mode_exact_hint: "Every element in its exact place, like the PDF. Less convenient to edit.",
  opt_ocr: "Recognise text in scanned pages (OCR)", opt_ocr_hint: "Czech and English. The first use downloads about 10 MB of data.",
  convert: "Convert to Word", download: "Download DOCX",
  phase_engine: "Loading the PDF engine…", phase_prepare: "Opening the PDF…", phase_page: "Processing page {page} of {pages}…",
  phase_ocr_load: "Loading text recognition (OCR)…", phase_ocr: "Recognising text on page {page}…",
  warn_font_metric: "Font {source} is used as {used} (same character widths).", warn_font_name: "Font {source} is used as {used}.",
  warn_font_uncommon: "Font {source} may not be installed on your computer; Word may substitute it.",
  warn_ocr: "Text on pages {pages} was recognised with OCR. Please check it.", warn_low: "Pages with low recognition confidence: {pages}.",
  warn_scanned: "Pages {pages} are scans without text. Turn on OCR for editable text.", warn_tagged: "The PDF has structure tags; they were used for paragraphs and tables.", warn_columns: "For multi-column scans, check the reading order of the text (pages {pages}).",
  result_meta: "{pages} pages · {tables} tables · {size}", preview_show: "Show a preview of the result", preview_note: "The preview is drawn by the Word → PDF engine (about {size}, first time only).",
  err_encrypted: "The PDF is password protected. Enter the password below, or remove it with", pdf_password_link: "PDF password protection",
};
const pde: PdfDocxStrings = {
  dz_title: "PDF hierher ziehen", dz_accept: ".pdf · eine Datei",
  mode_label: "Umwandlungsmodus", mode_editable: "Bearbeitbar", mode_editable_hint: "Echte Absätze, Tabellen und Formatvorlagen. Bequem zu bearbeiten.",
  mode_exact: "Exakt", mode_exact_hint: "Jedes Element genau an seiner Stelle wie im PDF. Weniger bequem zu bearbeiten.",
  opt_ocr: "Text in gescannten Seiten erkennen (OCR)", opt_ocr_hint: "Tschechisch und Englisch. Beim ersten Mal werden etwa 10 MB Daten geladen.",
  convert: "In Word umwandeln", download: "DOCX herunterladen",
  phase_engine: "PDF-Engine wird geladen…", phase_prepare: "PDF wird geöffnet…", phase_page: "Seite {page} von {pages} wird verarbeitet…",
  phase_ocr_load: "Texterkennung (OCR) wird geladen…", phase_ocr: "Text auf Seite {page} wird erkannt…",
  warn_font_metric: "Schrift {source} wird als {used} verwendet (gleiche Zeichenbreiten).", warn_font_name: "Schrift {source} wird als {used} verwendet.",
  warn_font_uncommon: "Schrift {source} ist eventuell nicht installiert; Word ersetzt sie gegebenenfalls.",
  warn_ocr: "Der Text auf den Seiten {pages} wurde per OCR erkannt. Bitte prüfen.", warn_low: "Seiten mit geringer Erkennungssicherheit: {pages}.",
  warn_scanned: "Die Seiten {pages} sind Scans ohne Text. Für bearbeitbaren Text OCR einschalten.", warn_tagged: "Das PDF hat Struktur-Tags; sie wurden für Absätze und Tabellen genutzt.", warn_columns: "Bei mehrspaltigen Scans die Reihenfolge des Textes prüfen (Seiten {pages}).",
  result_meta: "{pages} S. · {tables} Tabellen · {size}", preview_show: "Vorschau des Ergebnisses anzeigen", preview_note: "Die Vorschau zeichnet die Word → PDF-Engine (etwa {size}, nur beim ersten Mal).",
  err_encrypted: "Das PDF ist passwortgeschützt. Geben Sie das Passwort unten ein oder entfernen Sie es mit", pdf_password_link: "PDF-Passwortschutz",
};
const pes: PdfDocxStrings = {
  dz_title: "Arrastre aquí un PDF", dz_accept: ".pdf · un archivo",
  mode_label: "Modo de conversión", mode_editable: "Editable", mode_editable_hint: "Párrafos, tablas y estilos reales. Fácil de editar.",
  mode_exact: "Exacto", mode_exact_hint: "Cada elemento en su sitio exacto, como en el PDF. Menos cómodo de editar.",
  opt_ocr: "Reconocer texto en páginas escaneadas (OCR)", opt_ocr_hint: "Checo e inglés. La primera vez se descargan unos 10 MB de datos.",
  convert: "Convertir a Word", download: "Descargar DOCX",
  phase_engine: "Cargando el motor PDF…", phase_prepare: "Abriendo el PDF…", phase_page: "Procesando la página {page} de {pages}…",
  phase_ocr_load: "Cargando el reconocimiento de texto (OCR)…", phase_ocr: "Reconociendo el texto de la página {page}…",
  warn_font_metric: "La fuente {source} se usa como {used} (mismos anchos de carácter).", warn_font_name: "La fuente {source} se usa como {used}.",
  warn_font_uncommon: "Puede que la fuente {source} no esté instalada; Word podría sustituirla.",
  warn_ocr: "El texto de las páginas {pages} se reconoció con OCR. Revíselo.", warn_low: "Páginas con baja confianza de reconocimiento: {pages}.",
  warn_scanned: "Las páginas {pages} son escaneos sin texto. Active el OCR para obtener texto editable.", warn_tagged: "El PDF tiene etiquetas de estructura; se usaron para párrafos y tablas.", warn_columns: "En escaneos de varias columnas, revise el orden del texto (páginas {pages}).",
  result_meta: "{pages} págs. · {tables} tablas · {size}", preview_show: "Mostrar vista previa del resultado", preview_note: "La vista previa la dibuja el motor Word → PDF (unos {size}, solo la primera vez).",
  err_encrypted: "El PDF está protegido con contraseña. Introdúzcala abajo o quítela con", pdf_password_link: "Protección de PDF con contraseña",
};
const puk: PdfDocxStrings = {
  dz_title: "Перетягніть сюди PDF", dz_accept: ".pdf · один файл",
  mode_label: "Режим перетворення", mode_editable: "Редагований", mode_editable_hint: "Справжні абзаци, таблиці й стилі. Зручно редагувати.",
  mode_exact: "Точний", mode_exact_hint: "Кожен елемент точно на своєму місці, як у PDF. Редагувати менш зручно.",
  opt_ocr: "Розпізнати текст на сканованих сторінках (OCR)", opt_ocr_hint: "Чеська й англійська. Під час першого використання завантажується близько 10 МБ даних.",
  convert: "Перетворити на Word", download: "Завантажити DOCX",
  phase_engine: "Завантажую рушій PDF…", phase_prepare: "Відкриваю PDF…", phase_page: "Обробляю сторінку {page} з {pages}…",
  phase_ocr_load: "Завантажую розпізнавання тексту (OCR)…", phase_ocr: "Розпізнаю текст на сторінці {page}…",
  warn_font_metric: "Шрифт {source} використано як {used} (ті самі ширини символів).", warn_font_name: "Шрифт {source} використано як {used}.",
  warn_font_uncommon: "Шрифт {source} може бути не встановлений; Word може його замінити.",
  warn_ocr: "Текст на сторінках {pages} розпізнано за допомогою OCR. Перевірте його.", warn_low: "Сторінки з низькою впевненістю розпізнавання: {pages}.",
  warn_scanned: "Сторінки {pages} — скани без тексту. Увімкніть OCR, щоб отримати редагований текст.", warn_tagged: "PDF має структурні теги; їх використано для абзаців і таблиць.", warn_columns: "У багатоколонкових сканах перевірте порядок тексту (сторінки {pages}).",
  result_meta: "{pages} стор. · {tables} таблиць · {size}", preview_show: "Показати попередній перегляд", preview_note: "Перегляд малює рушій Word → PDF (близько {size}, лише вперше).",
  err_encrypted: "PDF захищено паролем. Введіть пароль нижче або видаліть його інструментом", pdf_password_link: "Захист PDF паролем",
};
const pfr: PdfDocxStrings = {
  dz_title: "Déposez ici un PDF", dz_accept: ".pdf · un fichier",
  mode_label: "Mode de conversion", mode_editable: "Modifiable", mode_editable_hint: "Vrais paragraphes, tableaux et styles. Facile à modifier.",
  mode_exact: "Exact", mode_exact_hint: "Chaque élément à sa place exacte, comme dans le PDF. Moins pratique à modifier.",
  opt_ocr: "Reconnaître le texte des pages numérisées (OCR)", opt_ocr_hint: "Tchèque et anglais. La première utilisation télécharge environ 10 Mo de données.",
  convert: "Convertir en Word", download: "Télécharger le DOCX",
  phase_engine: "Chargement du moteur PDF…", phase_prepare: "Ouverture du PDF…", phase_page: "Traitement de la page {page} sur {pages}…",
  phase_ocr_load: "Chargement de la reconnaissance de texte (OCR)…", phase_ocr: "Reconnaissance du texte de la page {page}…",
  warn_font_metric: "La police {source} est utilisée comme {used} (mêmes largeurs de caractères).", warn_font_name: "La police {source} est utilisée comme {used}.",
  warn_font_uncommon: "La police {source} n’est peut-être pas installée ; Word pourra la remplacer.",
  warn_ocr: "Le texte des pages {pages} a été reconnu par OCR. Vérifiez-le.", warn_low: "Pages avec une faible confiance de reconnaissance : {pages}.",
  warn_scanned: "Les pages {pages} sont des numérisations sans texte. Activez l’OCR pour obtenir du texte modifiable.", warn_tagged: "Le PDF contient des balises de structure ; elles ont servi pour les paragraphes et les tableaux.", warn_columns: "Pour les numérisations sur plusieurs colonnes, vérifiez l’ordre du texte (pages {pages}).",
  result_meta: "{pages} p. · {tables} tableaux · {size}", preview_show: "Afficher un aperçu du résultat", preview_note: "L’aperçu est dessiné par le moteur Word → PDF (environ {size}, la première fois seulement).",
  err_encrypted: "Le PDF est protégé par un mot de passe. Saisissez-le ci-dessous ou supprimez-le avec", pdf_password_link: "Protection PDF par mot de passe",
};
const psk: PdfDocxStrings = {
  dz_title: "Presuňte sem PDF", dz_accept: ".pdf · jeden súbor",
  mode_label: "Režim prevodu", mode_editable: "Upraviteľný", mode_editable_hint: "Skutočné odseky, tabuľky a štýly. Pohodlné úpravy.",
  mode_exact: "Presný", mode_exact_hint: "Každý prvok na presnom mieste ako v PDF. Úpravy sú menej pohodlné.",
  opt_ocr: "Rozpoznať text v naskenovaných stranách (OCR)", opt_ocr_hint: "Čeština a angličtina. Pri prvom použití sa stiahne asi 10 MB dát.",
  convert: "Previesť do Wordu", download: "Stiahnuť DOCX",
  phase_engine: "Načítavam PDF engine…", phase_prepare: "Otváram PDF…", phase_page: "Spracúvam stranu {page} z {pages}…",
  phase_ocr_load: "Načítavam rozpoznávanie textu (OCR)…", phase_ocr: "Rozpoznávam text na strane {page}…",
  warn_font_metric: "Písmo {source} je v dokumente ako {used} (rovnaké šírky znakov).", warn_font_name: "Písmo {source} je v dokumente ako {used}.",
  warn_font_uncommon: "Písmo {source} nemusí byť v počítači nainštalované, Word ho prípadne nahradí iným.",
  warn_ocr: "Text na stranách {pages} bol rozpoznaný pomocou OCR. Skontrolujte ho.", warn_low: "Strany s nízkou istotou rozpoznania: {pages}.",
  warn_scanned: "Strany {pages} sú sken bez textu. Pre upraviteľný text zapnite OCR.", warn_tagged: "PDF má štruktúru (tagy), využitá pre odseky a tabuľky.", warn_columns: "Pri viacstĺpcových skenoch skontrolujte poradie textu (strany {pages}).",
  result_meta: "{pages} str. · {tables} tabuliek · {size}", preview_show: "Zobraziť náhľad výsledku", preview_note: "Náhľad vykreslí prevodný engine Word → PDF (asi {size}, len prvýkrát).",
  err_encrypted: "PDF je chránené heslom. Zadajte heslo nižšie alebo ho odstráňte nástrojom", pdf_password_link: "Ochrana PDF heslom",
};

export const PDF_DOCX_I18N: Record<Locale, PdfDocxStrings> = { cs: pcs, en: pen, de: pde, es: pes, uk: puk, fr: pfr, sk: psk };
