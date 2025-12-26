export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Collapse spaces
    .replace(/[أإآ]/g, 'ا') // Unify Alef
    .replace(/[ة]/g, 'h') // User requested 'h' for normalization
    .replace(/[ى]/g, 'ي'); // Unify Yaa
};