import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Písma z repozitáře (public/assets/fonts), jen latin + latin-ext podmnožiny.
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

const FACES: [family: string, file: string, weight: string, range: string][] = [
  ["Bricolage Grotesque", "bricolage-latin.woff2", "400 800", LATIN],
  ["Bricolage Grotesque", "bricolage-latin-ext.woff2", "400 800", LATIN_EXT],
  ["Geist", "geist-latin.woff2", "400 700", LATIN],
  ["Geist", "geist-latin-ext.woff2", "400 700", LATIN_EXT],
  ["Geist Mono", "geist-mono-latin.woff2", "400 600", LATIN],
  ["Geist Mono", "geist-mono-latin-ext.woff2", "400 600", LATIN_EXT],
];

let loaded: Promise<unknown> | null = null;

export function loadBrandFonts(): Promise<unknown> {
  loaded ??= Promise.all(
    FACES.map(([family, file, weight, unicodeRange]) =>
      loadFont({ family, url: staticFile(`fonts/${file}`), weight, unicodeRange, format: "woff2" }),
    ),
  );
  return loaded;
}
