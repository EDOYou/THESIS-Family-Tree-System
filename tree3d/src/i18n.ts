// Interface text. Add a language by adding a dictionary; missing keys fall
// back to English. Pick the language with ?lang=az (default: en).

const en = {
  hint: "Drag to rotate · pinch to zoom · tap a person",
  home: "Show the whole tree",
  close: "Close",
  born: "b. {year}",
  died: "d. {year}",
  bornOn: "Born",
  diedOn: "Died",
  in: "in {place}",
  livesIn: "Lives in {place}",
  livedIn: "Lived in {place}",
  achievements: "Achievements",
  noBiography: "No biography yet.",
  parents: "Parents",
  partner: "Partner",
  formerPartner: "Former partner",
  children: "Children",
};

export type StringKey = keyof typeof en;

// Draft translation; to be checked by a native speaker.
const az: Partial<Record<StringKey, string>> = {
  hint: "Fırlatmaq üçün sürüşdürün · böyütmək üçün iki barmaqla açın · şəxsə toxunun",
  home: "Bütün ağacı göstər",
  close: "Bağla",
  born: "d. {year}",
  died: "v. {year}",
  bornOn: "Doğulub",
  diedOn: "Vəfat edib",
  in: "{place}",
  livesIn: "Yaşadığı yer: {place}",
  livedIn: "Yaşadığı yer: {place}",
  achievements: "Nailiyyətlər",
  noBiography: "Hələ tərcümeyi-hal yoxdur.",
  parents: "Valideynlər",
  partner: "Həyat yoldaşı",
  formerPartner: "Keçmiş həyat yoldaşı",
  children: "Övladlar",
};

const dictionaries: Record<string, Partial<Record<StringKey, string>>> = { en, az };

function pickLanguage(): string {
  try {
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested && requested in dictionaries) return requested;
  } catch {
    // Not in a browser (tests).
  }
  return "en";
}

export const language = pickLanguage();

export function t(key: StringKey, vars: Record<string, string> = {}): string {
  const template = dictionaries[language]?.[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? "");
}
