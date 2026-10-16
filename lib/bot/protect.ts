// Translation must never change a fact. Before a reply goes to a translator we swap every price,
// link, order number and product name for a neutral marker, then put the originals back afterwards.
// If any marker is missing or changed in the translation, the caller discards the translation and
// sends the original English reply instead. No imports, so it is easy to test.

const PATTERNS: RegExp[] = [
  /https?:\/\/\S+/g, // links
  /ORD-\d+/g, // order numbers
  /\*[^*\n]+\*/g, // *bold product names / order labels*
  /(?:[₹$€£]|Rs\.?)\s?\d[\d,]*(?:\.\d+)?/g, // prices
  /\+\d{8,15}/g, // phone numbers
];

export type Protected = { text: string; tokens: string[] };

export function protect(input: string): Protected {
  const tokens: string[] = [];
  let text = input;
  for (const re of PATTERNS) {
    text = text.replace(re, (m) => {
      tokens.push(m);
      return ` QQ${tokens.length - 1}QQ `;
    });
  }
  return { text, tokens };
}

/** Returns the restored text, or null if the translator damaged any marker (so the caller must not use it). */
export function restore(translated: string, tokens: string[]): string | null {
  let out = translated;
  for (let i = 0; i < tokens.length; i++) {
    const marker = new RegExp(`\\s*QQ${i}QQ\\s*`, "g");
    if ((out.match(marker) ?? []).length !== 1) return null;
    out = out.replace(marker, () => ` ${tokens[i]} `);
  }
  if (/QQ\d+QQ/.test(out)) return null;
  return out.replace(/[ \t]{2,}/g, " ").trim();
}
