export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Collapse spaces
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics (tashkeel)
    .replace(/[أإآ]/g, 'ا') // Unify Alef
    .replace(/ة/g, 'ه') // Unify Taa Marbuta to Haa
    .replace(/ى/g, 'ي'); // Unify Alif Maqsura to Yaa
};

export const translateToArabic = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  // If no English letters exist, it is already Arabic or non-English, so return as is
  if (!/[a-zA-Z]/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join('');
        if (translated && translated.trim()) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    console.warn("Auto-translation to Arabic failed:", err);
  }
  return trimmed;
};
