/**
 * A robust, fault-tolerant fetch function for TMDB API.
 * If the primary request fails or returns HTML (e.g. due to ISP blocking/redirection in countries like Egypt),
 * it will automatically try alternative proxy/mirror domains to ensure the request succeeds with valid JSON.
 */
export async function fetchTMDB(url: string, options?: RequestInit): Promise<Response> {
  const tryFetch = async (targetUrl: string): Promise<Response> => {
    const response = await fetch(targetUrl, options);
    
    // Check if the response status is not successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if the response is HTML (indicates ISP blockpage or Cloudflare interception)
    const clone = response.clone();
    const text = await clone.text();
    const trimmed = text.trim();
    if (trimmed.startsWith('<html') || trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<!doctype html') || trimmed.includes('<body') || trimmed.includes('<div id="cf-')) {
      throw new Error("HTML response received instead of valid JSON. This is usually caused by an ISP blocking page or firewalls.");
    }
    
    return response;
  };

  try {
    return await tryFetch(url);
  } catch (err) {
    console.warn(`Primary TMDB fetch failed for URL: ${url}. Error:`, err);

    // List of reliable alternative domains
    const alternativeBases = [
      'https://api.tmdb.org',
      'https://tmdb-api.reorx.workers.dev',
      'https://cf-tmdb.v98765.workers.dev'
    ];

    try {
      const parsedUrl = new URL(url);
      const originalHost = parsedUrl.origin; // e.g., "https://api.themoviedb.org" or "https://api.tmdb.org"
      const pathAndQuery = parsedUrl.pathname + parsedUrl.search;

      for (const altBase of alternativeBases) {
        if (altBase === originalHost) continue; // Skip if it matches the failed original host

        const altUrl = `${altBase}${pathAndQuery}`;
        try {
          console.log(`Trying alternative TMDB mirror: ${altUrl}`);
          return await tryFetch(altUrl);
        } catch (altErr) {
          console.warn(`TMDB mirror failed: ${altBase}. Error:`, altErr);
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse URL for TMDB proxying:", parseErr);
    }

    // If all alternatives fail, throw the original error
    throw err;
  }
}

/**
 * Checks if a given text contains Arabic characters.
 */
export function isTextArabic(text: string): boolean {
  if (!text || !text.trim()) return false;
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Strips any translation indicators, prefixes, suffixes, or tags (e.g. '🪄 ترجمة للعربية', 'مترجم للعربية', 'مترجم', etc.)
 * to ensure pure, clean Arabic text is saved and displayed.
 */
export function cleanArabicDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:🪄\s*)?(?:ترجمة للعربية|مترجم للعربية|مترجم|الترجمة|ترجمة)\s*[:：\-–—]?\s*/gi, '')
    .replace(/\s*[\(\[]\s*(?:مترجم للعربية|ترجمة للعربية|مترجم|ترجمة)\s*[\)\]]$/gi, '')
    .trim();
}

/**
 * Unofficial Google Translate API / Scraper function to translate English/other text to Arabic.
 */
export async function translateToArabic(text: string): Promise<string> {
  if (!text || !text.trim()) return '';

  const trimmed = text.trim();
  // If already purely Arabic without English characters, return as is
  if (isTextArabic(trimmed) && !/[a-zA-Z]/.test(trimmed)) {
    return cleanArabicDescription(trimmed);
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).filter(Boolean).join('');
        if (translated && translated.trim()) {
          return cleanArabicDescription(translated.trim());
        }
      }
    }
  } catch (err) {
    console.warn("Primary Google Translate endpoint failed:", err);
    try {
      const altUrl = `https://translate.google.com/translate_a/single?client=at&sl=auto&tl=ar&dt=t&q=${encodeURIComponent(trimmed)}`;
      const altResponse = await fetch(altUrl);
      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData && altData[0] && Array.isArray(altData[0])) {
          const translated = altData[0].map((item: any) => item[0]).filter(Boolean).join('');
          if (translated && translated.trim()) {
            return cleanArabicDescription(translated.trim());
          }
        }
      }
    } catch (altErr) {
      console.warn("Alternative Google Translate endpoint failed:", altErr);
    }
  }

  return cleanArabicDescription(trimmed);
}

/**
 * Resolves TMDB overview with:
 * 1. Priority 1 (Direct Arabic Fetch): Checks if Arabic overview is available on TMDB. If present, returns it directly as clean text without modification.
 * 2. Priority 2 (Automatic Translation): If no Arabic overview is available on TMDB (e.g. English or other language available), automatically translates it to Arabic.
 * 3. Removes any translation flags/indicators (e.g. "🪄 ترجمة للعربية" or "[مترجم]") ensuring clean, pure Arabic text.
 */
export async function resolveTMDBOverview(
  arOverview?: string | null,
  enOverview?: string | null,
  fallbackOverview?: string | null
): Promise<string> {
  const cleanAr = (arOverview || '').trim();
  const cleanEn = (enOverview || '').trim();
  const cleanFallback = (fallbackOverview || '').trim();

  // Priority 1: Direct fetch in Arabic from TMDB
  if (cleanAr && isTextArabic(cleanAr)) {
    return cleanArabicDescription(cleanAr);
  }

  // Priority 2: Automatic translation when Arabic is not available
  if (cleanEn) {
    const translated = await translateToArabic(cleanEn);
    return cleanArabicDescription(translated);
  }

  if (cleanAr) {
    const translated = await translateToArabic(cleanAr);
    return cleanArabicDescription(translated);
  }

  if (cleanFallback) {
    if (isTextArabic(cleanFallback)) {
      return cleanArabicDescription(cleanFallback);
    }
    const translated = await translateToArabic(cleanFallback);
    return cleanArabicDescription(translated);
  }

  return '';
}

import { TrailerItem } from '@/types';

/**
 * Fetches TMDB season data in Arabic (ar-SA), English (en-US), and default/raw language, including season videos/trailers.
 */
export async function fetchTMDBSeasonData(
  tvId: string | number,
  seasonNumber: number,
  apiKey: string
): Promise<{ sDataAr: any; sDataEn: any; sDataDefault?: any }> {
  const arUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&language=ar-SA&append_to_response=videos`;
  const enUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&language=en-US&append_to_response=videos`;
  const defUrl = `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&append_to_response=videos`;

  const [arResult, enResult, defResult] = await Promise.allSettled([
    fetchTMDB(arUrl),
    fetchTMDB(enUrl),
    fetchTMDB(defUrl)
  ]);

  let sDataAr: any = null;
  let sDataEn: any = null;
  let sDataDefault: any = null;

  if (arResult.status === 'fulfilled' && arResult.value.ok) {
    try { sDataAr = await arResult.value.json(); } catch (e) {}
  }
  if (enResult.status === 'fulfilled' && enResult.value.ok) {
    try { sDataEn = await enResult.value.json(); } catch (e) {}
  }
  if (defResult.status === 'fulfilled' && defResult.value.ok) {
    try { sDataDefault = await defResult.value.json(); } catch (e) {}
  }

  return { sDataAr, sDataEn, sDataDefault };
}

/**
 * Extracts and prioritizes official season trailers/promos from TMDB season data.
 */
export function processSeasonTrailers(
  sDataAr: any,
  sDataEn: any,
  seasonNumber: number
): TrailerItem[] {
  const rawVideoList: any[] = [];
  const seenVideoKeys = new Set<string>();

  const isFanOrUnofficialVideo = (v: any) => {
    if (!v) return true;
    const nameLower = (v.name || '').toLowerCase();
    
    const fanKeywords = [
      'concept', 'fan made', 'fanmade', 'fan-made', 'fan trailer', 
      'teaser concept', 'mockup', 'fan edit', 'fanedit', 'parody', 
      'trailer concept', 'fan concept', 'fan-concept', 'fake', 'speculation',
      'fan-teaser', 'fanteaser', 'made by fan', 'fan movie', 'concept teaser',
      'fan version', 'concept version'
    ];
    
    for (const kw of fanKeywords) {
      if (nameLower.includes(kw)) {
        return true;
      }
    }

    if (v.official === false) {
      if (nameLower.includes('مترجم') || nameLower.includes('subtitled') || nameLower.includes('إعلان مترجم') || nameLower.includes('تريلر مترجم')) {
        return true;
      }
    }

    return false;
  };

  const addVideoCandidates = (videoContainer: any) => {
    if (videoContainer && Array.isArray(videoContainer.results)) {
      for (const v of videoContainer.results) {
        if (v && v.site === 'YouTube' && v.key && !seenVideoKeys.has(v.key)) {
          if (isFanOrUnofficialVideo(v)) continue;
          if (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Promo' || v.type === 'Clip' || v.type === 'Featurette') {
            seenVideoKeys.add(v.key);
            rawVideoList.push(v);
          }
        }
      }
    }
  };

  if (sDataAr?.videos) addVideoCandidates(sDataAr.videos);
  if (sDataEn?.videos) addVideoCandidates(sDataEn.videos);

  // Fallback: If no Trailer/Teaser/Promo was found, add any YouTube video candidate
  if (rawVideoList.length === 0) {
    const addAnyVideoCandidates = (videoContainer: any) => {
      if (videoContainer && Array.isArray(videoContainer.results)) {
        for (const v of videoContainer.results) {
          if (v && v.site === 'YouTube' && v.key && !seenVideoKeys.has(v.key)) {
            if (isFanOrUnofficialVideo(v)) continue;
            seenVideoKeys.add(v.key);
            rawVideoList.push(v);
          }
        }
      }
    };
    if (sDataAr?.videos) addAnyVideoCandidates(sDataAr.videos);
    if (sDataEn?.videos) addAnyVideoCandidates(sDataEn.videos);
  }

  if (rawVideoList.length === 0) {
    return [];
  }

  const officialVideos = rawVideoList.filter((v: any) => v.official === true);
  const candidatesPool = officialVideos.length > 0 ? officialVideos : rawVideoList;

  candidatesPool.sort((a: any, b: any) => {
    const getScore = (v: any) => {
      let score = 0;
      if (v.official === true) score += 10000;
      if (v.type === 'Trailer') score += 1000;
      else if (v.type === 'Teaser') score += 500;
      else if (v.type === 'Promo') score += 300;

      if (v.iso_639_1 === 'ar') score += 300;
      else if (v.iso_639_1 === 'en') score += 100;

      const nameLower = (v.name || '').toLowerCase();
      if (nameLower.includes('official trailer') || nameLower.includes('الاعلان الرسمي') || nameLower.includes('تريلر رسمي') || nameLower.includes('إعلان')) score += 50;

      return score;
    };
    return getScore(b) - getScore(a);
  });

  const top3Videos = candidatesPool.slice(0, 3);

  return top3Videos.map((v: any, idx: number) => {
    let title = (v.name && v.name.trim()) ? v.name.trim() : `إعلان الموسم ${seasonNumber}`;
    if (title.toLowerCase() === 'trailer' || title.toLowerCase() === 'official trailer') {
      title = `تريلر الموسم ${seasonNumber}`;
    } else if (title.toLowerCase() === 'teaser' || title.toLowerCase() === 'official teaser') {
      title = `إعلان تشويقي للموسم ${seasonNumber}`;
    }

    return {
      id: String(v.id || idx + 1),
      title: title,
      url: `https://www.youtube.com/watch?v=${v.key}`,
      thumbnail: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg`,
      duration: ''
    };
  });
}

/**
 * Helper to process episode data with fallback Google Translate scraper.
 * Title field is set to `الحلقة ${epNum}` (episode order/number).
 * Description field is set to: `عنوان الحلقة المترجم : وصف الحلقة المترجم`
 * (or only description if no title, or only title if no description).
 */
export async function processTMDBEpisode(
  arEp: any,
  enEp: any,
  seasonNumber: number,
  defEp?: any
): Promise<{
  fixedTitle: string;
  finalDescription: string;
  epDuration: string;
  thumbnail: string;
  publishDate: string;
}> {
  const epNum = arEp?.episode_number || enEp?.episode_number || defEp?.episode_number || 1;
  const fixedTitle = `الحلقة ${epNum}`;

  let epDuration = '';
  const runtime = arEp?.runtime || enEp?.runtime || defEp?.runtime;
  if (runtime) {
    if (runtime > 60) epDuration = `${Math.floor(runtime / 60)}h ${runtime % 60}m`;
    else epDuration = `${runtime}:00`;
  }

  const rawArName = (arEp?.name || '').trim();
  const rawArOverview = (arEp?.overview || '').trim();
  const rawEnName = (enEp?.name || '').trim();
  const rawEnOverview = (enEp?.overview || '').trim();
  const rawDefName = (defEp?.name || '').trim();
  const rawDefOverview = (defEp?.overview || '').trim();

  const isGeneric = (name: string) => {
    if (!name) return true;
    const trimmed = name.trim();
    return /^Episode\s*\d+$/i.test(trimmed) || /^الحلقة\s*\d+$/i.test(trimmed) || /^Chapter\s*\d+$/i.test(trimmed);
  };

  const arOverviewIsArabic = isTextArabic(rawArOverview);
  const arNameIsArabic = isTextArabic(rawArName) && !isGeneric(rawArName);

  let titlePart = '';
  let overviewPart = '';

  // 1. Title Part logic
  if (arNameIsArabic) {
    titlePart = rawArName;
  } else if (rawEnName && !isGeneric(rawEnName)) {
    titlePart = await translateToArabic(rawEnName);
  } else if (rawArName && !isGeneric(rawArName)) {
    titlePart = await translateToArabic(rawArName);
  } else if (rawDefName && !isGeneric(rawDefName)) {
    titlePart = await translateToArabic(rawDefName);
  }

  // If titlePart turned out to be generic like "Episode 1" or "الحلقة 1", clear it
  if (isGeneric(titlePart)) {
    titlePart = '';
  }

  // 2. Overview Part logic
  if (arOverviewIsArabic) {
    overviewPart = rawArOverview;
  } else if (rawEnOverview) {
    overviewPart = await translateToArabic(rawEnOverview);
  } else if (rawArOverview) {
    overviewPart = await translateToArabic(rawArOverview);
  } else if (rawDefOverview) {
    overviewPart = await translateToArabic(rawDefOverview);
  }

  // 3. Assemble description: "عنوان الحلقة المترجم : وصف الحلقة المترجم"
  let finalDescription = '';
  if (titlePart && overviewPart) {
    finalDescription = `${titlePart} : ${overviewPart}`;
  } else if (titlePart) {
    finalDescription = titlePart;
  } else if (overviewPart) {
    finalDescription = overviewPart;
  } else {
    finalDescription = `شاهد أحداث الحلقة ${epNum} من الموسم ${seasonNumber}.`;
  }

  const stillPath = arEp?.still_path || enEp?.still_path || defEp?.still_path;
  const thumbnail = stillPath ? `https://image.tmdb.org/t/p/w500${stillPath}` : '';
  const publishDate = arEp?.air_date || enEp?.air_date || defEp?.air_date || '';

  return {
    fixedTitle,
    finalDescription,
    epDuration,
    thumbnail,
    publishDate
  };
}

/**
 * Normalizes any raw certification / age rating string (e.g., "TV-MA", "R", "PG-13", "18", "16+", "TV-14")
 * into a standardized numeric display format like "+18", "+16", "+14", "+12", "+7", or "جميع الأعمار".
 */
export function normalizeAgeRating(rawRating: string): string {
  if (!rawRating) return '';
  const clean = rawRating.trim().toUpperCase();

  if (['TV-MA', 'R', 'NC-17', 'R-18', 'R18', '18+', '18', '+18', '21', '+21'].includes(clean)) return '+18';
  if (['16', '16+', '+16', 'TV-16'].includes(clean)) return '+16';
  if (['15', '15+', '+15'].includes(clean)) return '+15';
  if (['TV-14', '14', '14+', '+14'].includes(clean)) return '+14';
  if (['PG-13', '13', '13+', '+13'].includes(clean)) return '+13';
  if (['12', '12+', '+12', 'TV-12'].includes(clean)) return '+12';
  if (['PG', 'TV-PG'].includes(clean)) return '+12';
  if (['10', '10+', '+10'].includes(clean)) return '+10';
  if (['TV-Y7', '7', '7+', '+7', '6', '6+'].includes(clean)) return '+7';
  if (['G', 'TV-G', 'TV-Y', '0', '0+', 'U', 'AL', 'ALL', 'GENERAL', 'جميع الأعمار'].includes(clean)) return 'جميع الأعمار';

  const match = clean.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 18) return '+18';
    if (num >= 16) return '+16';
    if (num >= 15) return '+15';
    if (num >= 14) return '+14';
    if (num >= 13) return '+13';
    if (num >= 12) return '+12';
    if (num >= 10) return '+10';
    if (num >= 7) return '+7';
    if (num > 0) return `+${num}`;
  }

  if (clean.includes('MA') || clean.includes('ADULT') || clean.includes('18')) return '+18';
  if (clean.includes('16')) return '+16';
  if (clean.includes('14')) return '+14';
  if (clean.includes('13')) return '+13';
  if (clean.includes('12')) return '+12';

  if (clean.startsWith('+')) return clean;
  return clean;
}

/**
 * Extracts age rating / content classification if available from TMDB details response (movie release_dates or TV content_ratings).
 */
export function extractAgeRatingFromTMDBDetails(details: any, enDetailsObj?: any): string {
  const sources = [details, enDetailsObj].filter(Boolean);

  // Preferred list of country codes to check first for high-quality certification/rating
  const preferredCountries = ['US', 'EG', 'SA', 'TR', 'KR', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP', 'BR', 'IT', 'ES'];

  for (const src of sources) {
    // 1. Check release_dates (used by Movie endpoint)
    if (src.release_dates?.results && Array.isArray(src.release_dates.results)) {
      const results = src.release_dates.results;

      // Try preferred countries first
      for (const countryCode of preferredCountries) {
        const countryObj = results.find((r: any) => r.iso_3166_1 === countryCode);
        if (countryObj && Array.isArray(countryObj.release_dates)) {
          for (const rd of countryObj.release_dates) {
            if (rd.certification && typeof rd.certification === 'string' && rd.certification.trim()) {
              return normalizeAgeRating(rd.certification.trim());
            }
          }
        }
      }

      // Fallback to any country
      for (const countryObj of results) {
        if (countryObj && Array.isArray(countryObj.release_dates)) {
          for (const rd of countryObj.release_dates) {
            if (rd.certification && typeof rd.certification === 'string' && rd.certification.trim()) {
              return normalizeAgeRating(rd.certification.trim());
            }
          }
        }
      }
    }

    // 2. Check content_ratings (used by TV Series endpoint)
    if (src.content_ratings?.results && Array.isArray(src.content_ratings.results)) {
      const results = src.content_ratings.results;

      // Try preferred countries first
      for (const countryCode of preferredCountries) {
        const countryObj = results.find((r: any) => r.iso_3166_1 === countryCode);
        if (countryObj && countryObj.rating && typeof countryObj.rating === 'string' && countryObj.rating.trim()) {
          return normalizeAgeRating(countryObj.rating.trim());
        }
      }

      // Fallback to any country
      for (const countryObj of results) {
        if (countryObj && countryObj.rating && typeof countryObj.rating === 'string' && countryObj.rating.trim()) {
          return normalizeAgeRating(countryObj.rating.trim());
        }
      }
    }
  }

  return '';
}

/**
 * Common ISO-3166-1 alpha-2 codes mapped to clean Arabic country names.
 */
export const ISO_TO_ARABIC_COUNTRY: Record<string, string> = {
  EG: 'مصر',
  US: 'الولايات المتحدة',
  GB: 'المملكة المتحدة',
  UK: 'المملكة المتحدة',
  TR: 'تركيا',
  KR: 'كوريا الجنوبية',
  JP: 'اليابان',
  SA: 'السعودية',
  SY: 'سوريا',
  LB: 'لبنان',
  KW: 'الكويت',
  AE: 'الإمارات',
  QA: 'قطر',
  BH: 'البحرين',
  OM: 'عمان',
  JO: 'الأردن',
  IQ: 'العراق',
  MA: 'المغرب',
  DZ: 'الجزائر',
  TN: 'تونس',
  PS: 'فلسطين',
  YE: 'اليمن',
  SD: 'السودان',
  LY: 'ليبيا',
  IN: 'الهند',
  FR: 'فرنسا',
  ES: 'إسبانيا',
  DE: 'ألمانيا',
  IT: 'إيطاليا',
  CA: 'كندا',
  AU: 'أستراليا',
  CN: 'الصين',
  HK: 'هونغ كونغ',
  TW: 'تايوان',
  TH: 'تايلاند',
  ID: 'إندونيسيا',
  PH: 'الفلبين',
  MY: 'ماليزيا',
  MX: 'المكسيك',
  BR: 'البرازيل',
  AR: 'الأرجنتين',
  CO: 'كولومبيا',
  RU: 'روسيا',
  SE: 'السويد',
  NO: 'النرويج',
  DK: 'الدنمارك',
  FI: 'فنلندا',
  NL: 'هولندا',
  BE: 'بلجيكا',
  PL: 'بولندا',
  IE: 'أيرلندا',
  NZ: 'نيوزيلندا',
  ZA: 'جنوب أفريقيا',
  IR: 'إيران',
  PK: 'باكستان'
};

const ENGLISH_COUNTRY_TO_ARABIC: Record<string, string> = {
  'united states': 'الولايات المتحدة',
  'united states of america': 'الولايات المتحدة',
  'usa': 'الولايات المتحدة',
  'egypt': 'مصر',
  'turkey': 'تركيا',
  'türkiye': 'تركيا',
  'south korea': 'كوريا الجنوبية',
  'korea': 'كوريا الجنوبية',
  'republic of korea': 'كوريا الجنوبية',
  'japan': 'اليابان',
  'united kingdom': 'المملكة المتحدة',
  'uk': 'المملكة المتحدة',
  'great britain': 'المملكة المتحدة',
  'saudi arabia': 'السعودية',
  'syria': 'سوريا',
  'syrian arab republic': 'سوريا',
  'lebanon': 'لبنان',
  'kuwait': 'الكويت',
  'united arab emirates': 'الإمارات',
  'uae': 'الإمارات',
  'qatar': 'قطر',
  'bahrain': 'البحرين',
  'oman': 'عمان',
  'jordan': 'الأردن',
  'iraq': 'العراق',
  'morocco': 'المغرب',
  'algeria': 'الجزائر',
  'tunisia': 'تونس',
  'palestine': 'فلسطين',
  'yemen': 'اليمن',
  'sudan': 'السودان',
  'libya': 'ليبيا',
  'india': 'الهند',
  'france': 'فرنسا',
  'spain': 'إسبانيا',
  'germany': 'ألمانيا',
  'italy': 'إيطاليا',
  'canada': 'كندا',
  'australia': 'أستراليا',
  'china': 'الصين',
  'hong kong': 'هونغ كونغ',
  'taiwan': 'تايوان',
  'thailand': 'تايلاند',
  'indonesia': 'إندونيسيا',
  'philippines': 'الفلبين',
  'malaysia': 'ماليزيا',
  'mexico': 'المكسيك',
  'brazil': 'البرازيل',
  'argentina': 'الأرجنتين',
  'colombia': 'كولومبيا',
  'russia': 'روسيا',
  'russian federation': 'روسيا',
  'sweden': 'السويد',
  'norway': 'النرويج',
  'denmark': 'الدنمارك',
  'finland': 'فنلندا',
  'netherlands': 'هولندا',
  'belgium': 'بلجيكا',
  'poland': 'بولندا',
  'ireland': 'أيرلندا',
  'new zealand': 'نيوزيلندا',
  'south africa': 'جنوب أفريقيا',
  'iran': 'إيران',
  'pakistan': 'باكستان'
};

/**
 * Extracts and translates the primary production/origin country from TMDB response.
 */
export function extractCountryFromTMDBDetails(details: any, enDetailsObj?: any): string {
  if (!details && !enDetailsObj) return '';

  // 1. Check production_countries from primary Arabic details
  if (Array.isArray(details?.production_countries) && details.production_countries.length > 0) {
    for (const item of details.production_countries) {
      const iso = (item.iso_3166_1 || '').toUpperCase();
      const rawName = (item.name || '').trim();

      if (iso && ISO_TO_ARABIC_COUNTRY[iso]) {
        return ISO_TO_ARABIC_COUNTRY[iso];
      }

      if (rawName && isTextArabic(rawName)) {
        return rawName;
      }

      const lowerName = rawName.toLowerCase();
      if (lowerName && ENGLISH_COUNTRY_TO_ARABIC[lowerName]) {
        return ENGLISH_COUNTRY_TO_ARABIC[lowerName];
      }
    }
  }

  // 2. Check origin_country from details (e.g. TV Series origin_country)
  if (Array.isArray(details?.origin_country) && details.origin_country.length > 0) {
    for (const iso of details.origin_country) {
      const code = String(iso || '').toUpperCase();
      if (code && ISO_TO_ARABIC_COUNTRY[code]) {
        return ISO_TO_ARABIC_COUNTRY[code];
      }
    }
  }

  // 3. Check enDetailsObj production_countries
  if (Array.isArray(enDetailsObj?.production_countries) && enDetailsObj.production_countries.length > 0) {
    for (const item of enDetailsObj.production_countries) {
      const iso = (item.iso_3166_1 || '').toUpperCase();
      const rawName = (item.name || '').trim();

      if (iso && ISO_TO_ARABIC_COUNTRY[iso]) {
        return ISO_TO_ARABIC_COUNTRY[iso];
      }

      const lowerName = rawName.toLowerCase();
      if (lowerName && ENGLISH_COUNTRY_TO_ARABIC[lowerName]) {
        return ENGLISH_COUNTRY_TO_ARABIC[lowerName];
      }
    }
  }

  // 4. Check enDetailsObj origin_country
  if (Array.isArray(enDetailsObj?.origin_country) && enDetailsObj.origin_country.length > 0) {
    for (const iso of enDetailsObj.origin_country) {
      const code = String(iso || '').toUpperCase();
      if (code && ISO_TO_ARABIC_COUNTRY[code]) {
        return ISO_TO_ARABIC_COUNTRY[code];
      }
    }
  }

  // 5. Fallback: if there was a raw country name in production_countries, return it
  if (details?.production_countries?.[0]?.name) {
    return details.production_countries[0].name;
  }
  if (enDetailsObj?.production_countries?.[0]?.name) {
    return enDetailsObj.production_countries[0].name;
  }

  return '';
}
