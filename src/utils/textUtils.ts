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

export const cleanArabicDescription = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^(?:🪄\s*)?(?:ترجمة للعربية|مترجم للعربية|مترجم|الترجمة|ترجمة)\s*[:：\-–—]?\s*/gi, '')
    .replace(/\s*[\(\[]\s*(?:مترجم للعربية|ترجمة للعربية|مترجم|ترجمة)\s*[\)\]]$/gi, '')
    .trim();
};

export const translateToArabic = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();
  // If already purely Arabic (contains Arabic and no Latin letters), return as is
  if (/[\u0600-\u06FF]/.test(trimmed) && !/[a-zA-Z]/.test(trimmed)) {
    return cleanArabicDescription(trimmed);
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item && item[0]).filter(Boolean).join('');
        if (translated && translated.trim()) {
          return cleanArabicDescription(translated.trim());
        }
      }
    }
  } catch (err) {
    console.warn("Auto-translation to Arabic failed on primary endpoint:", err);
    try {
      const altUrl = `https://translate.google.com/translate_a/single?client=at&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(trimmed)}`;
      const altRes = await fetch(altUrl);
      if (altRes.ok) {
        const altData = await altRes.json();
        if (Array.isArray(altData) && Array.isArray(altData[0])) {
          const translated = altData[0].map((item: any) => item && item[0]).filter(Boolean).join('');
          if (translated && translated.trim()) {
            return cleanArabicDescription(translated.trim());
          }
        }
      }
    } catch (altErr) {
      console.warn("Auto-translation failed on secondary endpoint:", altErr);
    }
  }
  return cleanArabicDescription(trimmed);
};
