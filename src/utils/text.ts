export function normalizeArabic(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[ة]/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "");
}

export function fuzzyIncludes(haystack: string, needle: string) {
  const h = normalizeArabic(haystack);
  const n = normalizeArabic(needle);
  return h.includes(n);
}
