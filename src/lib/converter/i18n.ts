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
};

export const DOCX_PDF_I18N: Record<Locale, DocxPdfStrings> = { cs, en, de, es, uk, fr, sk };

export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
