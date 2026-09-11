/**
 * Utility for robustly detecting and stripping Basmala (Bismillah) prefix from Quranic verses.
 * Accurately handles all Uthmani diacritics, wasla, dagger alif, zero-width characters, and ligatures.
 */

export function stripBismillah(text: string): string {
  if (!text) return '';

  // Ligature check ﷽ (\uFDFD)
  if (/^[\uFEFF\u200B-\u200F\u061C\s]*\uFDFD/u.test(text)) {
    return text.replace(/^[\uFEFF\u200B-\u200F\u061C\s]*\uFDFD\s*/u, '').trim();
  }

  // Set of diacritics / combining marks / non-spacing marks in Arabic & Unicode BOMs
  const isDiacritic = (ch: string) =>
    /[\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF\u200B-\u200F\u061C]/.test(ch);

  let norm = '';
  const originalIndexMap: number[] = [];

  for (let i = 0; i < text.length; i++) {
    if (!isDiacritic(text[i])) {
      norm += text[i];
      originalIndexMap.push(i);
    }
  }

  // Matches "بسم الله الرحمن الرحيم " with any alif/alif wasla variations
  const match = norm.match(/^[\s]*(?:﷽|بسم\s+[ٱا]?ل+ه\s+[ٱا]?لرحم[اٰ]?ن\s+[ٱا]?لرحيم)\s*/u);
  if (!match) return text.trim();

  const matchNormEnd = match[0].length;
  if (matchNormEnd <= originalIndexMap.length) {
    let origCutIndex = originalIndexMap[matchNormEnd - 1] + 1;
    // Consume any trailing diacritics on the last letter (kasra, etc.) and whitespace
    while (
      origCutIndex < text.length &&
      (isDiacritic(text[origCutIndex]) || /\s/.test(text[origCutIndex]))
    ) {
      origCutIndex++;
    }
    return text.slice(origCutIndex).trim();
  }

  return '';
}

export function hasBismillahPrefix(text: string): boolean {
  if (!text) return false;
  if (/^[\uFEFF\u200B-\u200F\u061C\s]*\uFDFD/u.test(text)) return true;
  const isDiacritic = (ch: string) =>
    /[\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF\u200B-\u200F\u061C]/.test(ch);
  let norm = '';
  for (let i = 0; i < text.length; i++) {
    if (!isDiacritic(text[i])) norm += text[i];
  }
  return /^[\s]*(?:﷽|بسم\s+[ٱا]?ل+ه\s+[ٱا]?لرحم[اٰ]?ن\s+[ٱا]?لرحيم)\s*/u.test(norm);
}
