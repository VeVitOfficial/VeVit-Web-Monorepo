# Převodník Word ⇄ PDF — měření

> **2. kolo (2026-11-07):** nová srovnávací tabulka s pdf2docx, paměť v prohlížeči a komprese na
> preview deploymentu jsou v sekci „2. kolo“ na začátku. Starší sekce popisují stav 1. kola.

> **Platnost (4. kolo):** všechna vizuální měření DOCX výstupu v tomto souboru (SSIM, strany, QR z
> renderu) vznikla renderem DOCX přes LibreOffice a platí jen pro LibreOffice, ne pro Word / Word pro
> web (D25, D26).

## 4. kolo — přesný režim v textových polích DrawingML (D25)

Node + LibreOffice render, přesný režim, před → po (tolerantní SSIM / textová shoda):

| Dokument | před | po |
|---|---|---|
| diakritika-fonty | 0,926 / 1,000 | 0,926 / 0,978 |
| dva-sloupce | 0,818 / 0,792 | 0,818 / 0,783 |
| faktura-2026001 | 0,909 / 0,600 | 0,909 / 0,600 |
| faktura | 0,967 / 0,600 | 0,967 / 0,600 |
| landscape | 0,974 / 1,000 | 0,974 / 1,000 |
| obrazky | 0,977 / 1,000 | **0,989** / 1,000 |
| seznamy | 0,840 / 1,000 | 0,840 / 0,924 |
| sken | 0,810 / 0,774 | 0,810 / 0,774 |
| sloucene-bunky | 0,977 / 0,949 | 0,977 / 0,949 |
| tabulka-vicestrankova | 0,735 / 0,884 | 0,736 / 0,884 |
| vlozeny-font | 0,781 / 1,000 | 0,781 / 0,941 |
| zahlavi-zapati | 0,888 / 0,976 | 0,889 / 0,976 |

Nižší textová shoda = jiné pořadí běhů v PDF exportu LibreOffice (odrážka u položky), ne chybějící text (0 chybějících znaků u všech kromě skenu).

## 3. kolo — dvousloupcový sken (D24)

E2E proti produkčnímu buildu (`next start`), PDF → Word + odolnost: **90/90** v Chromiu, Firefoxu
i WebKitu (`tests/converter/out/r3`). Změněné řádky oproti 2. kolu, ve všech třech prohlížečích shodně:

| režim | dokument | text | tolerantní SSIM | chybí znaků |
|---|---|---|---|---|
| upravitelný | sken | 0.292 → **0.804** | 0.540 → 0.357 | 12 → 12 |
| přesný | sken | 0.267 → **0.787** | 0.834 → 0.794 | 64 → **12** |
| přesný | dva-sloupce | 0.292 → **0.792** | 0.818 → 0.818 | 0 → 0 |

Ostatní dokumenty: rozdíl < 0,005 ve všech metrikách. Srovnání s pdf2docx níže (Node, tesseract CLI)
pro sken platí dál: tolerantní SSIM pdf2docx 0,645 (obrázek bez textu, textová shoda 0) vs. VeVit
0,357 s textovou shodou 0,804.

## 2. kolo

### PDF → DOCX: VeVit vs. pdf2docx (tolerantní SSIM, LibreOffice render, stejný korpus)

| dokument | pdf2docx | VeVit upravitelný (1. kolo) | **VeVit upravitelný (2. kolo)** | VeVit přesný | text pdf2docx | text VeVit upr. | stran pdf2docx | stran VeVit |
|---|---|---|---|---|---|---|---|---|
| diakritika-fonty | 0.835 | 0.793 | **0.918** ✓ | 0.926 | 1.000 | 1.000 | 2/2 | 2/2 |
| dva-sloupce | 0.051 | 0.607 | **0.607** ✓ | 0.818 | 0.478 | 0.901 | 1/5 | 1/1 |
| faktura | 0.167 | 0.412 | **0.705** ✓ | 0.967 | 0.468 | 1.000 | 1/2 | 1/1 |
| faktura-2026001 | 0.264 | 0.781 | **0.765** ✓ | 0.909 | 0.686 | 1.000 | 1/2 | 1/1 |
| landscape | 0.339 | 0.653 | **0.724** ✓ | 0.974 | 0.981 | 1.000 | 1/1 | 1/1 |
| obrazky | 0.628 | 0.995 | **0.995** ✓ | 0.977 | 0.989 | 1.000 | 2/2 | 2/2 |
| seznamy | 0.711 | 0.924 | **0.924** ✓ | 0.840 | 0.911 | 1.000 | 1/1 | 1/1 |
| sken | 0.645 | 0.380 | **0.380** ✗ | 0.847 | 0.000 | 0.774 | 1/1 | 1/1 |
| sloucene-bunky | 0.538 | 0.510 | **0.734** ✓ | 0.977 | 1.000 | 1.000 | 1/1 | 1/1 |
| tabulka-vicestrankova | 0.643 | 0.508 | **0.757** ✓ | 0.735 | 0.942 | 1.000 | 4/4 | 4/4 |
| vlozeny-font | 0.626 | 0.886 | **0.886** ✓ | 0.781 | 1.000 | 1.000 | 1/1 | 1/1 |
| zahlavi-zapati | 0.739 | 0.353 | **0.853** ✓ | 0.888 | 0.976 | 1.000 | 2/2 | 2/2 |
| **průměr** | 0.515 | 0.650 | **0.771** | 0.887 | 0.786 | 0.973 | | |

VeVit upravitelný ≥ pdf2docx: 11/12 dokumentů.

pdf2docx je lepší jen u skenu, a to proto, že nechá obrázek stránky bez textu (textová shoda 0);
VeVit text rozpozná OCR (0,774) a u vícesloupcového skenu varuje uživatele.

### E2E — finální běh 2. kola (produkční `next start`, Chromium, Firefox, WebKit)

128 testů prošlo, 0 selhalo, 16 přeskočeno (výkonové testy jen v Chromiu). Soukromí: 0 porušení.

| profil | nástroj | dokument | studený ms | teplý ms | špička paměti MB |
|---|---|---|---|---|---|
| desktop | pdf-to-word | faktura-2026001.pdf | 871 | 246 | 14 |
| desktop | pdf-to-word | tabulka-vicestrankova.pdf | 839 | 245 | 14 |
| desktop | word-to-pdf | faktura.docx | 1855 | 261 | 23 |
| desktop | word-to-pdf | tabulka-vicestrankova.docx | 1881 | 356 | 30 |
| mobile | pdf-to-word | faktura-2026001.pdf | 4074 | 282 | 14 |
| mobile | pdf-to-word | tabulka-vicestrankova.pdf | 4144 | 248 | 14 |
| mobile | word-to-pdf | faktura.docx | 29968 | 502 | 28 |
| mobile | word-to-pdf | tabulka-vicestrankova.docx | 32013 | 478 | 28 |

### DOCX → PDF (final2, reference: LibreOffice desktop)

| prohlížeč | dokument | stran ref/výst | SSIM | SSIM tolerantní | text | chybí | navíc | ms | QR | soukromí |
|---|---|---|---|---|---|---|---|---|---|---|
| chromium | diakritika-fonty | 2/2 | 0.209 | 0.371 | 1.000 | 0 | 0 | 1940 |  | ok |
| chromium | dva-sloupce | 1/1 | 0.958 | 0.994 | 0.992 | 0 | 0 | 1887 |  | ok |
| chromium | faktura | 1/1 | 0.666 | 0.913 | 1.000 | 0 | 0 | 1882 | ano | ok |
| chromium | landscape | 1/1 | 0.733 | 0.977 | 1.000 | 0 | 0 | 1875 |  | ok |
| chromium | obrazky | 2/2 | 0.912 | 0.977 | 1.000 | 0 | 0 | 1892 |  | ok |
| chromium | seznamy | 1/1 | 0.889 | 0.985 | 1.000 | 0 | 0 | 1901 |  | ok |
| chromium | sloucene-bunky | 1/1 | 0.742 | 0.938 | 1.000 | 0 | 0 | 1896 |  | ok |
| chromium | tabulka-vicestrankova | 4/4 | 0.808 | 0.966 | 1.000 | 0 | 0 | 1900 |  | ok |
| chromium | vlozeny-font | 1/1 | 0.718 | 0.950 | 1.000 | 0 | 0 | 1878 |  | ok |
| chromium | zahlavi-zapati | 2/2 | 0.631 | 0.938 | 1.000 | 0 | 0 | 1887 |  | ok |
| firefox | diakritika-fonty | 2/2 | 0.209 | 0.371 | 1.000 | 0 | 0 | 2105 |  | ok |
| firefox | dva-sloupce | 1/1 | 0.958 | 0.994 | 0.992 | 0 | 0 | 1508 |  | ok |
| firefox | faktura | 1/1 | 0.666 | 0.913 | 1.000 | 0 | 0 | 1503 | ano | ok |
| firefox | landscape | 1/1 | 0.733 | 0.977 | 1.000 | 0 | 0 | 1536 |  | ok |
| firefox | obrazky | 2/2 | 0.912 | 0.977 | 1.000 | 0 | 0 | 2039 |  | ok |
| firefox | seznamy | 1/1 | 0.889 | 0.985 | 1.000 | 0 | 0 | 2037 |  | ok |
| firefox | sloucene-bunky | 1/1 | 0.742 | 0.938 | 1.000 | 0 | 0 | 2021 |  | ok |
| firefox | tabulka-vicestrankova | 4/4 | 0.808 | 0.966 | 1.000 | 0 | 0 | 2020 |  | ok |
| firefox | vlozeny-font | 1/1 | 0.718 | 0.950 | 1.000 | 0 | 0 | 2049 |  | ok |
| firefox | zahlavi-zapati | 2/2 | 0.631 | 0.938 | 1.000 | 0 | 0 | 2067 |  | ok |
| webkit | diakritika-fonty | 2/2 | 0.209 | 0.371 | 1.000 | 0 | 0 | 2667 |  | ok |
| webkit | dva-sloupce | 1/1 | 0.958 | 0.994 | 0.992 | 0 | 0 | 2028 |  | ok |
| webkit | faktura | 1/1 | 0.666 | 0.913 | 1.000 | 0 | 0 | 1999 | ano | ok |
| webkit | landscape | 1/1 | 0.733 | 0.977 | 1.000 | 0 | 0 | 2007 |  | ok |
| webkit | obrazky | 2/2 | 0.912 | 0.977 | 1.000 | 0 | 0 | 2477 |  | ok |
| webkit | seznamy | 1/1 | 0.889 | 0.985 | 1.000 | 0 | 0 | 2030 |  | ok |
| webkit | sloucene-bunky | 1/1 | 0.742 | 0.938 | 1.000 | 0 | 0 | 1966 |  | ok |
| webkit | tabulka-vicestrankova | 4/4 | 0.808 | 0.966 | 1.000 | 0 | 0 | 2552 |  | ok |
| webkit | vlozeny-font | 1/1 | 0.718 | 0.950 | 1.000 | 0 | 0 | 1964 |  | ok |
| webkit | zahlavi-zapati | 2/2 | 0.631 | 0.938 | 1.000 | 0 | 0 | 2001 |  | ok |

### PDF → DOCX (final2, DOCX vykreslené LibreOffice vs. původní PDF)

| prohlížeč | režim | dokument | stran | SSIM | SSIM tolerantní | text | chybí | tabulky | textová pole | ms | faktura buňky | QR | soukromí |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chromium | editable | diakritika-fonty | 2/2 | 0.591 | 0.918 | 1.000 | 0 |  | 0 | 874 |  |  | ok |
| chromium | editable | dva-sloupce | 1/1 | 0.151 | 0.607 | 0.901 | 0 |  | 0 | 859 |  |  | ok |
| chromium | editable | faktura | 1/1 | 0.381 | 0.705 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 875 | ano | ano | ok |
| chromium | editable | faktura-2026001 | 1/1 | 0.327 | 0.765 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 881 | ano | ano | ok |
| chromium | editable | landscape | 1/1 | 0.268 | 0.724 | 1.000 | 0 | 6×13 | 0 | 861 |  |  | ok |
| chromium | editable | obrazky | 2/2 | 0.968 | 0.995 | 1.000 | 0 |  | 0 | 856 |  |  | ok |
| chromium | editable | seznamy | 1/1 | 0.830 | 0.924 | 1.000 | 0 |  | 0 | 352 |  |  | ok |
| chromium | editable | sken | 1/1 | 0.359 | 0.540 | 0.292 | 12 | 34×3 | 0 | 6436 |  |  | ok |
| chromium | editable | sloucene-bunky | 1/1 | 0.396 | 0.734 | 1.000 | 0 | 6×5,4×3 | 0 | 354 |  |  | ok |
| chromium | editable | tabulka-vicestrankova | 4/4 | 0.487 | 0.757 | 1.000 | 0 | 91×6h | 0 | 871 |  |  | ok |
| chromium | editable | vlozeny-font | 1/1 | 0.587 | 0.886 | 1.000 | 0 |  | 0 | 401 |  |  | ok |
| chromium | editable | zahlavi-zapati | 2/2 | 0.481 | 0.853 | 1.000 | 0 |  | 0 | 853 |  |  | ok |
| chromium | exact | diakritika-fonty | 2/2 | 0.679 | 0.926 | 1.000 | 0 |  | 115 | 852 |  |  | ok |
| chromium | exact | dva-sloupce | 1/1 | 0.553 | 0.818 | 0.292 | 0 |  | 195 | 862 |  |  | ok |
| chromium | exact | faktura | 1/1 | 0.900 | 0.967 | 0.600 | 0 |  | 38 | 854 | — | ano | ok |
| chromium | exact | faktura-2026001 | 1/1 | 0.688 | 0.909 | 0.600 | 0 |  | 38 | 856 | — | ano | ok |
| chromium | exact | landscape | 1/1 | 0.860 | 0.974 | 1.000 | 0 |  | 80 | 365 |  |  | ok |
| chromium | exact | obrazky | 2/2 | 0.865 | 0.977 | 1.000 | 0 |  | 13 | 853 |  |  | ok |
| chromium | exact | seznamy | 1/1 | 0.551 | 0.840 | 1.000 | 0 |  | 29 | 353 |  |  | ok |
| chromium | exact | sken | 1/1 | 0.702 | 0.834 | 0.267 | 64 |  | 260 | 7449 |  |  | ok |
| chromium | exact | sloucene-bunky | 1/1 | 0.895 | 0.977 | 0.949 | 0 |  | 39 | 352 |  |  | ok |
| chromium | exact | tabulka-vicestrankova | 4/4 | 0.653 | 0.735 | 0.884 | 0 |  | 294 | 857 |  |  | ok |
| chromium | exact | vlozeny-font | 1/1 | 0.509 | 0.781 | 1.000 | 0 |  | 43 | 354 |  |  | ok |
| chromium | exact | zahlavi-zapati | 2/2 | 0.609 | 0.888 | 0.976 | 0 |  | 247 | 854 |  |  | ok |
| firefox | editable | diakritika-fonty | 2/2 | 0.591 | 0.918 | 1.000 | 0 |  | 0 | 992 |  |  | ok |
| firefox | editable | dva-sloupce | 1/1 | 0.151 | 0.607 | 0.901 | 0 |  | 0 | 972 |  |  | ok |
| firefox | editable | faktura | 1/1 | 0.381 | 0.705 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 979 | ano | ano | ok |
| firefox | editable | faktura-2026001 | 1/1 | 0.327 | 0.765 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 976 | ano | ano | ok |
| firefox | editable | landscape | 1/1 | 0.268 | 0.724 | 1.000 | 0 | 6×13 | 0 | 975 |  |  | ok |
| firefox | editable | obrazky | 2/2 | 0.968 | 0.995 | 1.000 | 0 |  | 0 | 969 |  |  | ok |
| firefox | editable | seznamy | 1/1 | 0.830 | 0.924 | 1.000 | 0 |  | 0 | 474 |  |  | ok |
| firefox | editable | sken | 1/1 | 0.359 | 0.540 | 0.292 | 12 | 34×3 | 0 | 6700 |  |  | ok |
| firefox | editable | sloucene-bunky | 1/1 | 0.396 | 0.734 | 1.000 | 0 | 6×5,4×3 | 0 | 971 |  |  | ok |
| firefox | editable | tabulka-vicestrankova | 4/4 | 0.487 | 0.757 | 1.000 | 0 | 91×6h | 0 | 992 |  |  | ok |
| firefox | editable | vlozeny-font | 1/1 | 0.587 | 0.886 | 1.000 | 0 |  | 0 | 467 |  |  | ok |
| firefox | editable | zahlavi-zapati | 2/2 | 0.481 | 0.853 | 1.000 | 0 |  | 0 | 975 |  |  | ok |
| firefox | exact | diakritika-fonty | 2/2 | 0.679 | 0.926 | 1.000 | 0 |  | 115 | 982 |  |  | ok |
| firefox | exact | dva-sloupce | 1/1 | 0.553 | 0.818 | 0.292 | 0 |  | 195 | 978 |  |  | ok |
| firefox | exact | faktura | 1/1 | 0.900 | 0.967 | 0.600 | 0 |  | 38 | 1201 | — | ano | ok |
| firefox | exact | faktura-2026001 | 1/1 | 0.688 | 0.909 | 0.600 | 0 |  | 38 | 977 | — | ano | ok |
| firefox | exact | landscape | 1/1 | 0.860 | 0.974 | 1.000 | 0 |  | 80 | 980 |  |  | ok |
| firefox | exact | obrazky | 2/2 | 0.865 | 0.977 | 1.000 | 0 |  | 13 | 979 |  |  | ok |
| firefox | exact | seznamy | 1/1 | 0.551 | 0.840 | 1.000 | 0 |  | 29 | 464 |  |  | ok |
| firefox | exact | sken | 1/1 | 0.702 | 0.834 | 0.267 | 64 |  | 260 | 7692 |  |  | ok |
| firefox | exact | sloucene-bunky | 1/1 | 0.895 | 0.977 | 0.949 | 0 |  | 39 | 973 |  |  | ok |
| firefox | exact | tabulka-vicestrankova | 4/4 | 0.653 | 0.735 | 0.884 | 0 |  | 294 | 976 |  |  | ok |
| firefox | exact | vlozeny-font | 1/1 | 0.509 | 0.781 | 1.000 | 0 |  | 43 | 457 |  |  | ok |
| firefox | exact | zahlavi-zapati | 2/2 | 0.609 | 0.888 | 0.976 | 0 |  | 247 | 973 |  |  | ok |
| webkit | editable | diakritika-fonty | 2/2 | 0.591 | 0.918 | 1.000 | 0 |  | 0 | 886 |  |  | ok |
| webkit | editable | dva-sloupce | 1/1 | 0.151 | 0.607 | 0.901 | 0 |  | 0 | 895 |  |  | ok |
| webkit | editable | faktura | 1/1 | 0.381 | 0.705 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 899 | ano | ano | ok |
| webkit | editable | faktura-2026001 | 1/1 | 0.327 | 0.765 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 883 | ano | ano | ok |
| webkit | editable | landscape | 1/1 | 0.268 | 0.724 | 1.000 | 0 | 6×13 | 0 | 889 |  |  | ok |
| webkit | editable | obrazky | 2/2 | 0.968 | 0.995 | 1.000 | 0 |  | 0 | 912 |  |  | ok |
| webkit | editable | seznamy | 1/1 | 0.830 | 0.924 | 1.000 | 0 |  | 0 | 876 |  |  | ok |
| webkit | editable | sken | 1/1 | 0.359 | 0.540 | 0.292 | 12 | 34×3 | 0 | 6835 |  |  | ok |
| webkit | editable | sloucene-bunky | 1/1 | 0.396 | 0.734 | 1.000 | 0 | 6×5,4×3 | 0 | 865 |  |  | ok |
| webkit | editable | tabulka-vicestrankova | 4/4 | 0.487 | 0.757 | 1.000 | 0 | 91×6h | 0 | 875 |  |  | ok |
| webkit | editable | vlozeny-font | 1/1 | 0.587 | 0.886 | 1.000 | 0 |  | 0 | 883 |  |  | ok |
| webkit | editable | zahlavi-zapati | 2/2 | 0.481 | 0.853 | 1.000 | 0 |  | 0 | 874 |  |  | ok |
| webkit | exact | diakritika-fonty | 2/2 | 0.679 | 0.926 | 1.000 | 0 |  | 115 | 876 |  |  | ok |
| webkit | exact | dva-sloupce | 1/1 | 0.553 | 0.818 | 0.292 | 0 |  | 195 | 890 |  |  | ok |
| webkit | exact | faktura | 1/1 | 0.900 | 0.967 | 0.600 | 0 |  | 38 | 883 | — | ano | ok |
| webkit | exact | faktura-2026001 | 1/1 | 0.688 | 0.909 | 0.600 | 0 |  | 38 | 873 | — | ano | ok |
| webkit | exact | landscape | 1/1 | 0.860 | 0.974 | 1.000 | 0 |  | 80 | 891 |  |  | ok |
| webkit | exact | obrazky | 2/2 | 0.865 | 0.977 | 1.000 | 0 |  | 13 | 875 |  |  | ok |
| webkit | exact | seznamy | 1/1 | 0.551 | 0.840 | 1.000 | 0 |  | 29 | 382 |  |  | ok |
| webkit | exact | sken | 1/1 | 0.702 | 0.834 | 0.267 | 64 |  | 260 | 7888 |  |  | ok |
| webkit | exact | sloucene-bunky | 1/1 | 0.895 | 0.977 | 0.949 | 0 |  | 39 | 900 |  |  | ok |
| webkit | exact | tabulka-vicestrankova | 4/4 | 0.653 | 0.735 | 0.884 | 0 |  | 294 | 865 |  |  | ok |
| webkit | exact | vlozeny-font | 1/1 | 0.509 | 0.781 | 1.000 | 0 |  | 43 | 396 |  |  | ok |
| webkit | exact | zahlavi-zapati | 2/2 | 0.609 | 0.888 | 0.976 | 0 |  | 247 | 901 |  |  | ok |

### Paměť v prohlížeči (Chromium, `performance.measureUserAgentSpecificMemory`, D22)

Celá stránka včetně workerů, vzorkováno po 150 ms během převodu (krátké špičky mezi vzorky se
mohou minout), dev server.

| nástroj | dokument | před převodem MB | špička MB | z toho workery MB |
|---|---|---|---|---|
| word-to-pdf | faktura.docx | 24.8 | 39.3 | 11.5 |
| word-to-pdf | tabulka-vicestrankova.docx | 24.9 | 50.8 | 21.7 |
| word-to-pdf | obrazky.docx | 25.0 | 58.9 | 30.5 |
| pdf-to-word | faktura-2026001.pdf | 7.1 | 33.9 | 8.4 |
| pdf-to-word | tabulka-vicestrankova.pdf | 24.5 | 34.1 | 8.6 |
| pdf-to-word | obrazky.pdf | 24.5 | 34.0 | 8.5 |
| pdf-to-word | sken.pdf | 24.4 | 156.9 | 102.1 |

Výkonový e2e test (`perf.spec.ts`) hlásí špičku 45–49 MB pro Word → PDF a 34–35 MB pro PDF → Word
(desktop i mobilní profil).

### Komprese na Vercel preview (`ve-vit-web-monorepo-5t9sm0qp9-vevit.vercel.app`)

| soubor | HTTP | content-encoding | přeneseno |
|---|---|---|---|
| `converter/docx-pdf/vevit_docx_pdf_bg.wasm` | 200 | **br** | 4,52 MB (raw 10,8 MB; lokální `brotli -11` by dalo 3,4 MB) |
| `converter/pdfjs/pdf.worker.min.mjs` | 200 | br | 0,39 MB |
| `tesseract/tesseract-core-simd-lstm.wasm` | 200 | br | 1,06 MB |
| `tesseract/ces.traineddata.gz` | 200 | (soubor gzip) | 1,73 MB — dřív `308` na `/cs/…` a 3,8 MB nekomprimovaně (D21) |
| `converter/fonts/Carlito-Regular.woff2` | 200 | (WOFF2) | 0,19 MB |

Vercel komprimuje brotli nižší úrovní než lokální `brotli -11`; předkomprimovaný soubor by ušetřil
~1,1 MB, ale statický soubor z `public/` s vlastním `content-encoding` Next/Vercel neservíruje —
ponecháno.


Stav 2026-11-07. Prostředí: Linux x86_64 (Omarchy), Node 26, LibreOffice 26.8 (reference a neutrální
render), Playwright 1.63 (Chromium, Firefox, WebKit v kontejneru `mcr.microsoft.com/playwright:v1.63.0-noble`).
Reference DOCX → PDF = **LibreOffice desktop**, ne Word (D3) — po dodání PDF z Wordu přepočítat.

## Velikost stahování

Měřeno lokálně (`gzip -9`, `brotli -11`). Co uživatel skutečně stáhne, závisí na kompresi serveru:
`next start` posílá `.wasm` nekomprimovaně, Vercel komprimuje statické soubory podle typu — ověřit po
nasazení (čeká na Víta). Vše se stahuje až při prvním převodu a ukládá do Cache API (D12).

| soubor | raw | gzip -9 | brotli -11 | kdy se stahuje |
|---|---|---|---|---|
| `converter/docx-pdf/vevit_docx_pdf_bg.wasm` | 11MB | 4.8MB | 3.4MB | |
| `converter/docx-pdf/vevit_docx_pdf.js` | 13KB | 3.2KB | 2.8KB | |
| `converter/pdfjs/pdf.min.mjs` | 449KB | 129KB | 107KB | |
| `converter/pdfjs/pdf.worker.min.mjs` | 1.3MB | 366KB | 301KB | |
| `converter/pdfjs/wasm/openjpeg.wasm` | 246KB | 80KB | 66KB | |
| `converter/pdfjs/wasm/jbig2.wasm` | 102KB | 41KB | 33KB | |
| `converter/pdfjs/wasm/qcms_bg.wasm` | 95KB | 35KB | 29KB | |
| `tesseract/tesseract.min.js` | 66KB | 11KB | 8.4KB | |
| `tesseract/worker.min.js` | 121KB | 35KB | 28KB | |
| `tesseract/tesseract-core-simd-lstm.js` | 122KB | 28KB | 24KB | |
| `tesseract/tesseract-core-simd-lstm.wasm` | 2.8MB | 1.1MB | 805KB | |
| `tesseract/ces.traineddata` | 3.7MB | 1.7MB | 1.4MB | |
| `tesseract/eng.traineddata` | 4.0MB | 1.9MB | 1.6MB | |
| `converter/fonts/*.woff2` (20 řezů) | 2.5MB | (WOFF2) | (WOFF2) | jen potřebné rodiny |
|  – Carlito (4 řezy) | 778KB | | | |
|  – Caladea (4 řezy) | 127KB | | | |
|  – LiberationSans (4 řezy) | 586KB | | | |

| Scénář | stáhne se (brotli, odhad) |
|---|---|
| Word → PDF, dokument v Calibri (běžný Word) | engine 3,4 MB + Carlito ~0,2–0,8 MB (jen použité řezy) ≈ **3,6–4,2 MB** |
| Word → PDF, faktura v Arialu | engine 3,4 MB + Liberation Sans 2 řezy ~0,3 MB ≈ **3,7 MB** |
| PDF → Word (textové PDF) | pdf.js 0,41 MB (+ wasm dekodéry jen u JPX/JBIG2) ≈ **0,4 MB** |
| PDF → Word se skenem (OCR ces+eng) | + tesseract 0,9 MB + data 3,0 MB ≈ **4,3 MB** |
| Náhled výsledku PDF → Word | + engine Word → PDF 3,4 MB (jen na tlačítko, pokud není v cache) |

Engine DOCX → PDF obsahuje 4,2 MB raw zakompilovaných OFL fontů vetextu (Source Sans 3, Source Serif 4,
Inter, JetBrains Mono, ≈ 2 MB brotli). Odstranit je jde jen úpravou `vetext-fonts` (path závislost
všech crate; patch přes Cargo nejde) — příležitost na úsporu ~55 % enginu (PROGRESS, „další krok“).

## Volba enginu DOCX → PDF

| | vetext (zvoleno, D6) | LibreOffice WASM (ZetaOffice) |
|---|---|---|
| stažení (brotli) | 3,4 MB | 52,2 MB (`soffice.wasm` 36,3 MB + `soffice.data` 15,9 MB, hlavičky CDN 2026-11-06) |
| SharedArrayBuffer | ne (běží i v Safari bez `require-corp`) | ano (vlákna) |
| převod korpusu (Node, WASM) | 10–163 ms / dokument | neměřeno (viz níže) |
| převod v prohlížeči (e2e, studená cache, localhost) | 1,9–4,5 s vč. stažení a kompilace | neměřeno |
| licence | MIT/Apache-2.0 | MPL-2.0 + třetí strany buildu |

Čas načtení a převodu ZetaOffice v prohlížeči **nebyl změřen**: vyžaduje vlastní integraci UNO API
(zetajs), která nebyla v README; rozhodnutí stojí na 15× větším stažení a nutnosti SAB. Otevřený bod.

## Extrakce PDF: pdf.js vs PDFium (D13)

`tests/converter/tools/bench-extract.ts`, pravda = text zdrojových DOCX. „chybí/navíc“ = znaky (bez
ohledu na pořadí); „text“ = shoda slov v pořadí surového výstupu (pořadí řeší až rekonstrukce).

| dokument | pdf.js: text | chybí | navíc | ms | PDFium: text | chybí | navíc | ms |
|---|---|---|---|---|---|---|---|---|
| diakritika-fonty | 0.946 | 0 | 0 | 207 | 0.946 | 0 | 0 | 30 |
| dva-sloupce | 0.247 | 0 | 0 | 32 | 1.000 | 0 | 0 | 9 |
| faktura | 0.600 | 0 | 0 | 37 | 0.540 | 0 | 0 | 4 |
| landscape | 1.000 | 0 | 0 | 27 | 1.000 | 0 | 0 | 3 |
| obrazky | 1.000 | 0 | 0 | 102 | 1.000 | 0 | 0 | 3 |
| seznamy | 0.861 | 0 | 19 | 15 | 0.861 | 0 | 19 | 3 |
| sloucene-bunky | 0.949 | 0 | 0 | 19 | 1.000 | 0 | 0 | 3 |
| tabulka-vicestrankova | 0.867 | 0 | 123 | 82 | 0.983 | 0 | 123 | 15 |
| vlozeny-font | 1.000 | 0 | 0 | 30 | 1.000 | 0 | 0 | 2 |
| zahlavi-zapati | 0.963 | 1 | 44 | 19 | 0.954 | 1 | 44 | 6 |

## PDF → DOCX: VeVit vs. pdf2docx (benchmark, AGPL, jen lokálně)

Node + LibreOffice render výsledného DOCX, stejný korpus (`tools/score-docx.ts`). pdf2docx 0.5.8.

| dokument | pdf2docx tolerantní SSIM | VeVit upravitelný | VeVit přesný | pdf2docx text | VeVit upravitelný text | pdf2docx stran | VeVit stran | pdf2docx faktura/QR | VeVit faktura/QR |
|---|---|---|---|---|---|---|---|---|---|
| diakritika-fonty | 0.835 | 0.793 | 0.926 | 1 | 1 | 2/2 | 2/2 |  |  |
| dva-sloupce | 0.051 | 0.607 | 0.818 | 0.478 | 0.901 | 1/5 | 1/1 |  |  |
| faktura | 0.167 | 0.412 | 0.967 | 0.468 | 1 | 1/2 | 1/1 | buňky ok, QR ok | buňky ok, QR ok |
| faktura-2026001 | 0.264 | 0.781 | 0.909 | 0.686 | 1 | 1/2 | 1/1 | buňky ok, QR ne | buňky ne, QR ok |
| landscape | 0.339 | 0.653 | 0.974 | 0.981 | 1 | 1/1 | 1/1 |  |  |
| obrazky | 0.628 | 0.995 | 0.977 | 0.989 | 1 | 2/2 | 2/2 |  |  |
| seznamy | 0.711 | 0.924 | 0.84 | 0.911 | 1 | 1/1 | 1/1 |  |  |
| sken | 0.645 | 0.38 | 0.847 | 0 | 0.774 | 1/1 | 1/1 |  |  |
| sloucene-bunky | 0.538 | 0.51 | 0.977 | 1 | 1 | 1/1 | 1/1 |  |  |
| tabulka-vicestrankova | 0.643 | 0.508 | 0.735 | 0.942 | 0.966 | 4/4 | 4/4 |  |  |
| vlozeny-font | 0.626 | 0.886 | 0.781 | 1 | 1 | 1/1 | 1/1 |  |  |
| zahlavi-zapati | 0.739 | 0.353 | 0.888 | 0.976 | 1 | 2/2 | 2/2 |  |  |
| **průměr pdf2docx** | tolerantní SSIM 0.515 | text 0.786 | | | | | | | |
| **průměr VeVit upravitelný** | tolerantní SSIM 0.650 | text 0.970 | | | | | | | |
| **průměr VeVit přesný** | tolerantní SSIM 0.887 | text 0.797 | | | | | | | |

## Výkon (Chromium, produkční `next start`, localhost)

„Studený“ = prázdné Cache API a nový worker (stažení + kompilace + převod), „teplý“ = druhý převod na
stejné stránce. Mobilní profil: CPU 4× zpomalené (CDP), síť ~1,6 Mb/s, 150 ms RTT. `next start` posílá
WASM nekomprimovaně (11 MB) — mobilní studený start Word → PDF je proto horní odhad; s brotli (3,4 MB)
by byl řádově o 60 % kratší (neověřeno, čeká na Vercel).

| profil | nástroj | dokument | studený ms | teplý ms |
|---|---|---|---|---|
| desktop | pdf-to-word | faktura-2026001.pdf | 876 | 249 |
| desktop | pdf-to-word | tabulka-vicestrankova.pdf | 859 | 248 |
| desktop | word-to-pdf | faktura.docx | 1905 | 353 |
| desktop | word-to-pdf | tabulka-vicestrankova.docx | 1892 | 357 |
| mobile | pdf-to-word | faktura-2026001.pdf | 4093 | 223 |
| mobile | pdf-to-word | tabulka-vicestrankova.pdf | 4104 | 248 |
| mobile | word-to-pdf | faktura.docx | 30251 | 524 |
| mobile | word-to-pdf | tabulka-vicestrankova.docx | 32452 | 494 |

Paměť: lineární paměť WASM enginu Word → PDF v Node 15,4 MB po načtení všech 20 řezů fontů, 16,5 MB
(faktura), 19,7 MB (vícestránková tabulka), 26,1 MB (dokument s obrázkem 1200×800). V prohlížeči
nezměřeno (`measureUserAgentSpecificMemory` není v testovacím Chromiu k dispozici).

## E2E — finální běh proti produkčnímu buildu

Chromium, Firefox, WebKit; 127 + 36 testů (PDF → DOCX upravitelný režim přeměřen po D16): všechny
prošly kromě jednoho, které běželo na buildu bez D16 a po přestavbě prošlo. Soukromí: 0 porušení.

### DOCX → PDF (final, reference: LibreOffice desktop)

| prohlížeč | dokument | stran ref/výst | SSIM | SSIM tolerantní | text | chybí | navíc | ms | QR | soukromí |
|---|---|---|---|---|---|---|---|---|---|---|
| chromium | diakritika-fonty | 2/2 | 0.209 | 0.371 | 1.000 | 0 | 0 | 1906 |  | ok |
| chromium | dva-sloupce | 1/1 | 0.958 | 0.994 | 0.992 | 0 | 0 | 1904 |  | ok |
| chromium | faktura | 1/1 | 0.666 | 0.913 | 1.000 | 0 | 0 | 1887 | ano | ok |
| chromium | landscape | 1/1 | 0.733 | 0.977 | 1.000 | 0 | 0 | 1874 |  | ok |
| chromium | obrazky | 2/2 | 0.912 | 0.977 | 1.000 | 0 | 0 | 1870 |  | ok |
| chromium | seznamy | 1/1 | 0.889 | 0.985 | 1.000 | 0 | 0 | 1903 |  | ok |
| chromium | sloucene-bunky | 1/1 | 0.742 | 0.938 | 1.000 | 0 | 0 | 1374 |  | ok |
| chromium | tabulka-vicestrankova | 4/4 | 0.808 | 0.966 | 1.000 | 0 | 0 | 1883 |  | ok |
| chromium | vlozeny-font | 1/1 | 0.718 | 0.950 | 1.000 | 0 | 0 | 1886 |  | ok |
| chromium | zahlavi-zapati | 2/2 | 0.631 | 0.938 | 1.000 | 0 | 0 | 1898 |  | ok |
| firefox | diakritika-fonty | 2/2 | 0.209 | 0.371 | 1.000 | 0 | 0 | 2091 |  | ok |
| firefox | dva-sloupce | 1/1 | 0.958 | 0.994 | 0.992 | 0 | 0 | 1488 |  | ok |
| firefox | faktura | 1/1 | 0.666 | 0.913 | 1.000 | 0 | 0 | 2025 | ano | ok |
| firefox | landscape | 1/1 | 0.733 | 0.977 | 1.000 | 0 | 0 | 2072 |  | ok |
| firefox | obrazky | 2/2 | 0.912 | 0.977 | 1.000 | 0 | 0 | 2021 |  | ok |
| firefox | seznamy | 1/1 | 0.889 | 0.985 | 1.000 | 0 | 0 | 2027 |  | ok |
| firefox | sloucene-bunky | 1/1 | 0.742 | 0.938 | 1.000 | 0 | 0 | 2075 |  | ok |
| firefox | tabulka-vicestrankova | 4/4 | 0.808 | 0.966 | 1.000 | 0 | 0 | 2014 |  | ok |
| firefox | vlozeny-font | 1/1 | 0.718 | 0.950 | 1.000 | 0 | 0 | 2032 |  | ok |
| firefox | zahlavi-zapati | 2/2 | 0.631 | 0.938 | 1.000 | 0 | 0 | 2803 |  | ok |
| webkit | diakritika-fonty | 2/2 | 0.209 | 0.371 | 1.000 | 0 | 0 | 2550 |  | ok |
| webkit | dva-sloupce | 1/1 | 0.958 | 0.994 | 0.992 | 0 | 0 | 2527 |  | ok |
| webkit | faktura | 1/1 | 0.666 | 0.913 | 1.000 | 0 | 0 | 1956 | ano | ok |
| webkit | landscape | 1/1 | 0.733 | 0.977 | 1.000 | 0 | 0 | 1967 |  | ok |
| webkit | obrazky | 2/2 | 0.912 | 0.977 | 1.000 | 0 | 0 | 2485 |  | ok |
| webkit | seznamy | 1/1 | 0.889 | 0.985 | 1.000 | 0 | 0 | 2473 |  | ok |
| webkit | sloucene-bunky | 1/1 | 0.742 | 0.938 | 1.000 | 0 | 0 | 1953 |  | ok |
| webkit | tabulka-vicestrankova | 4/4 | 0.808 | 0.966 | 1.000 | 0 | 0 | 2493 |  | ok |
| webkit | vlozeny-font | 1/1 | 0.718 | 0.950 | 1.000 | 0 | 0 | 2537 |  | ok |
| webkit | zahlavi-zapati | 2/2 | 0.631 | 0.938 | 1.000 | 0 | 0 | 1967 |  | ok |

### PDF → DOCX (final, DOCX vykreslené LibreOffice vs. původní PDF)

| prohlížeč | režim | dokument | stran | SSIM | SSIM tolerantní | text | chybí | tabulky | textová pole | ms | faktura buňky | QR | soukromí |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chromium | editable | diakritika-fonty | 2/2 | 0.395 | 0.793 | 1.000 | 0 |  | 0 | 888 |  |  | ok |
| chromium | editable | dva-sloupce | 1/1 | 0.151 | 0.607 | 0.901 | 0 |  | 0 | 345 |  |  | ok |
| chromium | editable | faktura | 1/1 | 0.179 | 0.412 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 859 | ano | ano | ok |
| chromium | editable | faktura-2026001 | 1/1 | 0.351 | 0.781 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 854 | ano | ano | ok |
| chromium | editable | landscape | 1/1 | 0.320 | 0.653 | 1.000 | 0 | 6×13 | 0 | 351 |  |  | ok |
| chromium | editable | obrazky | 2/2 | 0.968 | 0.995 | 1.000 | 0 |  | 0 | 874 |  |  | ok |
| chromium | editable | seznamy | 1/1 | 0.830 | 0.924 | 1.000 | 0 |  | 0 | 347 |  |  | ok |
| chromium | editable | sken | 1/1 | 0.357 | 0.534 | 0.292 | 12 | 34×3 | 0 | 5920 |  |  | ok |
| chromium | editable | sloucene-bunky | 1/1 | 0.382 | 0.510 | 1.000 | 0 | 6×5,4×3 | 0 | 342 |  |  | ok |
| chromium | editable | tabulka-vicestrankova | 4/4 | 0.384 | 0.508 | 0.966 | 0 | 91×6h | 0 | 857 |  |  | ok |
| chromium | editable | vlozeny-font | 1/1 | 0.587 | 0.886 | 1.000 | 0 |  | 0 | 340 |  |  | ok |
| chromium | editable | zahlavi-zapati | 2/2 | 0.112 | 0.353 | 1.000 | 0 |  | 0 | 345 |  |  | ok |
| chromium | exact | diakritika-fonty | 2/2 | 0.679 | 0.926 | 1.000 | 0 |  | 115 | 849 |  |  | ok |
| chromium | exact | dva-sloupce | 1/1 | 0.553 | 0.818 | 0.292 | 0 |  | 195 | 354 |  |  | ok |
| chromium | exact | faktura | 1/1 | 0.900 | 0.967 | 0.600 | 0 |  | 38 | 850 | — | ano | ok |
| chromium | exact | faktura-2026001 | 1/1 | 0.688 | 0.909 | 0.600 | 0 |  | 38 | 845 | — | ano | ok |
| chromium | exact | landscape | 1/1 | 0.860 | 0.974 | 1.000 | 0 |  | 80 | 344 |  |  | ok |
| chromium | exact | obrazky | 2/2 | 0.865 | 0.977 | 1.000 | 0 |  | 13 | 848 |  |  | ok |
| chromium | exact | seznamy | 1/1 | 0.551 | 0.840 | 1.000 | 0 |  | 29 | 342 |  |  | ok |
| chromium | exact | sken | 1/1 | 0.702 | 0.834 | 0.267 | 64 |  | 260 | 7448 |  |  | ok |
| chromium | exact | sloucene-bunky | 1/1 | 0.895 | 0.977 | 0.949 | 0 |  | 39 | 857 |  |  | ok |
| chromium | exact | tabulka-vicestrankova | 4/4 | 0.653 | 0.735 | 0.884 | 0 |  | 294 | 854 |  |  | ok |
| chromium | exact | vlozeny-font | 1/1 | 0.509 | 0.781 | 1.000 | 0 |  | 43 | 933 |  |  | ok |
| chromium | exact | zahlavi-zapati | 2/2 | 0.609 | 0.888 | 0.976 | 0 |  | 247 | 858 |  |  | ok |
| firefox | editable | diakritika-fonty | 2/2 | 0.395 | 0.793 | 1.000 | 0 |  | 0 | 992 |  |  | ok |
| firefox | editable | dva-sloupce | 1/1 | 0.151 | 0.607 | 0.901 | 0 |  | 0 | 970 |  |  | ok |
| firefox | editable | faktura | 1/1 | 0.179 | 0.412 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 973 | ano | ano | ok |
| firefox | editable | faktura-2026001 | 1/1 | 0.351 | 0.781 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 964 | ano | ano | ok |
| firefox | editable | landscape | 1/1 | 0.320 | 0.653 | 1.000 | 0 | 6×13 | 0 | 973 |  |  | ok |
| firefox | editable | obrazky | 2/2 | 0.968 | 0.995 | 1.000 | 0 |  | 0 | 955 |  |  | ok |
| firefox | editable | seznamy | 1/1 | 0.830 | 0.924 | 1.000 | 0 |  | 0 | 450 |  |  | ok |
| firefox | editable | sken | 1/1 | 0.357 | 0.534 | 0.292 | 12 | 34×3 | 0 | 6133 |  |  | ok |
| firefox | editable | sloucene-bunky | 1/1 | 0.382 | 0.510 | 1.000 | 0 | 6×5,4×3 | 0 | 961 |  |  | ok |
| firefox | editable | tabulka-vicestrankova | 4/4 | 0.384 | 0.508 | 0.966 | 0 | 91×6h | 0 | 973 |  |  | ok |
| firefox | editable | vlozeny-font | 1/1 | 0.587 | 0.886 | 1.000 | 0 |  | 0 | 473 |  |  | ok |
| firefox | editable | zahlavi-zapati | 2/2 | 0.112 | 0.353 | 1.000 | 0 |  | 0 | 964 |  |  | ok |
| firefox | exact | diakritika-fonty | 2/2 | 0.679 | 0.926 | 1.000 | 0 |  | 115 | 963 |  |  | ok |
| firefox | exact | dva-sloupce | 1/1 | 0.553 | 0.818 | 0.292 | 0 |  | 195 | 968 |  |  | ok |
| firefox | exact | faktura | 1/1 | 0.900 | 0.967 | 0.600 | 0 |  | 38 | 962 | — | ano | ok |
| firefox | exact | faktura-2026001 | 1/1 | 0.688 | 0.909 | 0.600 | 0 |  | 38 | 957 | — | ano | ok |
| firefox | exact | landscape | 1/1 | 0.860 | 0.974 | 1.000 | 0 |  | 80 | 449 |  |  | ok |
| firefox | exact | obrazky | 2/2 | 0.865 | 0.977 | 1.000 | 0 |  | 13 | 959 |  |  | ok |
| firefox | exact | seznamy | 1/1 | 0.551 | 0.840 | 1.000 | 0 |  | 29 | 444 |  |  | ok |
| firefox | exact | sken | 1/1 | 0.702 | 0.834 | 0.267 | 64 |  | 260 | 7165 |  |  | ok |
| firefox | exact | sloucene-bunky | 1/1 | 0.895 | 0.977 | 0.949 | 0 |  | 39 | 986 |  |  | ok |
| firefox | exact | tabulka-vicestrankova | 4/4 | 0.653 | 0.735 | 0.884 | 0 |  | 294 | 992 |  |  | ok |
| firefox | exact | vlozeny-font | 1/1 | 0.509 | 0.781 | 1.000 | 0 |  | 43 | 960 |  |  | ok |
| firefox | exact | zahlavi-zapati | 2/2 | 0.609 | 0.888 | 0.976 | 0 |  | 247 | 973 |  |  | ok |
| webkit | editable | diakritika-fonty | 2/2 | 0.395 | 0.793 | 1.000 | 0 |  | 0 | 891 |  |  | ok |
| webkit | editable | dva-sloupce | 1/1 | 0.151 | 0.607 | 0.901 | 0 |  | 0 | 898 |  |  | ok |
| webkit | editable | faktura | 1/1 | 0.179 | 0.412 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 868 | ano | ano | ok |
| webkit | editable | faktura-2026001 | 1/1 | 0.351 | 0.781 | 1.000 | 0 | 1×2,1×2,3×4,1×2 | 0 | 886 | ano | ano | ok |
| webkit | editable | landscape | 1/1 | 0.320 | 0.653 | 1.000 | 0 | 6×13 | 0 | 884 |  |  | ok |
| webkit | editable | obrazky | 2/2 | 0.968 | 0.995 | 1.000 | 0 |  | 0 | 881 |  |  | ok |
| webkit | editable | seznamy | 1/1 | 0.830 | 0.924 | 1.000 | 0 |  | 0 | 891 |  |  | ok |
| webkit | editable | sken | 1/1 | 0.357 | 0.534 | 0.292 | 12 | 34×3 | 0 | 6634 |  |  | ok |
| webkit | editable | sloucene-bunky | 1/1 | 0.382 | 0.510 | 1.000 | 0 | 6×5,4×3 | 0 | 881 |  |  | ok |
| webkit | editable | tabulka-vicestrankova | 4/4 | 0.384 | 0.508 | 0.966 | 0 | 91×6h | 0 | 882 |  |  | ok |
| webkit | editable | vlozeny-font | 1/1 | 0.587 | 0.886 | 1.000 | 0 |  | 0 | 379 |  |  | ok |
| webkit | editable | zahlavi-zapati | 2/2 | 0.112 | 0.353 | 1.000 | 0 |  | 0 | 883 |  |  | ok |
| webkit | exact | diakritika-fonty | 2/2 | 0.679 | 0.926 | 1.000 | 0 |  | 115 | 890 |  |  | ok |
| webkit | exact | dva-sloupce | 1/1 | 0.553 | 0.818 | 0.292 | 0 |  | 195 | 878 |  |  | ok |
| webkit | exact | faktura | 1/1 | 0.900 | 0.967 | 0.600 | 0 |  | 38 | 885 | — | ano | ok |
| webkit | exact | faktura-2026001 | 1/1 | 0.688 | 0.909 | 0.600 | 0 |  | 38 | 905 | — | ano | ok |
| webkit | exact | landscape | 1/1 | 0.860 | 0.974 | 1.000 | 0 |  | 80 | 884 |  |  | ok |
| webkit | exact | obrazky | 2/2 | 0.865 | 0.977 | 1.000 | 0 |  | 13 | 871 |  |  | ok |
| webkit | exact | seznamy | 1/1 | 0.551 | 0.840 | 1.000 | 0 |  | 29 | 375 |  |  | ok |
| webkit | exact | sken | 1/1 | 0.702 | 0.834 | 0.267 | 64 |  | 260 | 7126 |  |  | ok |
| webkit | exact | sloucene-bunky | 1/1 | 0.895 | 0.977 | 0.949 | 0 |  | 39 | 869 |  |  | ok |
| webkit | exact | tabulka-vicestrankova | 4/4 | 0.653 | 0.735 | 0.884 | 0 |  | 294 | 881 |  |  | ok |
| webkit | exact | vlozeny-font | 1/1 | 0.509 | 0.781 | 1.000 | 0 |  | 43 | 378 |  |  | ok |
| webkit | exact | zahlavi-zapati | 2/2 | 0.609 | 0.888 | 0.976 | 0 |  | 247 | 882 |  |  | ok |
