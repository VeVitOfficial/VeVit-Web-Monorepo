# 07 · Průběh, XP a drahokamy

## Kde se průběh ukládá

Jen v prohlížeči, v `localStorage` pod klíčem **`vevit.edu.aifb.progress.v1`**. Bez účtu, bez serveru, bez jmen a e-mailů. Na jiném zařízení nebo v jiném prohlížeči průběh není, dokud ho uživatel nepřenese souborem.

Tvar:

```json
{
  "version": 1,
  "lessons": {
    "zs1-blok-a-teorie": { "status": "done", "at": "2026-10-23T10:00:00.000Z" },
    "kurz-m1-cv1":       { "status": "started", "at": "2026-10-23T10:05:00.000Z" }
  }
}
```

- Stav lekce: `todo` (není v záznamu), `started` (rozpracováno), `done` (hotovo). V rozhraní vždy jako text („Nezačato“, „Rozpracováno“, „Hotovo“), ne jen barvou.
- Otevření teorie nebo lekce ji automaticky označí jako rozpracovanou. Hotovou lekci tím nepřepíše (chyba z hydratace, kterou odhalil E2E test, je opravená přes `getProgressNow()`).
- Tlačítko „Označit jako hotové“ / „Označit jako nehotové“ u každé teorie a lekce.
- Když úložiště nejde použít (soukromé okno, zablokovaná data), průběh platí do obnovení stránky a nic se nerozbije.
- Změna v jedné záložce se projeví i v ostatních (událost `storage`).

Kód: `src/lib/edu/aifb/progress.ts` (čisté funkce), `src/components/edu/aifb/use-progress.ts` (úložiště, `useSyncExternalStore`), `lesson-progress.tsx`, `level-progress.tsx`, `progress-transfer.tsx`.

## Kde se průběh zobrazuje

- **Blok / level / modul:** ukazatel „0 / 6“ (teorie + 5 lekcí; v kurzu teorie + 4 lekce) a stav u karty teorie a u každé lekce.
- **Přehled kurzu:** celkový ukazatel (30 položek) a ukazatel u každého modulu.
- **Hub, sekce „Můj průběh“:** hotovo z celkového počtu, XP, drahokamy a tlačítka:
  - **Uložit do souboru** – stáhne `aifb-prubeh.json`,
  - **Načíst ze souboru** – po potvrzení nahradí průběh v prohlížeči,
  - **Smazat průběh** – po potvrzení vymaže vše.

## XP

Odvozuje se vždy z hotových lekcí, nikdy se neukládá (`src/lib/edu/aifb/xp.ts`):

| Za co | XP |
|---|---|
| hotová teorie | 25 |
| hotová lekce | 40 |
| bonus za celý blok / level / modul hotový | 60 |
| drahokam | 1 za každých 10 XP |

Blok s teorií a 5 lekcemi dá nejvýš 25 + 5 × 40 + 60 = **285 XP**, modul kurzu 25 + 4 × 40 + 60 = **245 XP**. Do XP účtu VeVit se nic nezapisuje (to by vyžadovalo výslovný pokyn vlastníka).

## Import: co se přijme

`parseProgress` přijme jen soubor do 200 kB s `version: 1` a nejvýš 500 záznamy. Id lekce musí odpovídat tvaru `zs1|zs2|ss|kurz-…-teorie|cv1…cv5`, stav `started` / `done` a platné datum. Cokoli jiného (neznámá pole, jiná id, jména) se zahodí.
