import type { Content, HomeSection, SectionPageLocation } from '../types';

const normalizeArabic = (str: string): string => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, ' ');
};

const normalizeLocation = (loc: string | undefined): string => {
  if (!loc) return 'home';
  const clean = String(loc).toLowerCase().trim();
  if (['home', 'main', 'الرئيسية', 'رئيسية', 'index', 'homepage'].includes(clean)) return 'home';
  if (['movies', 'movie', 'افلام', 'الأفلام', 'أفلام'].includes(clean)) return 'movies';
  if (['series', ' مسلسلات', 'المسلسلات', 'مسلسلات'].includes(clean)) return 'series';
  if (['kids', 'اطفال', 'الأطفال', 'أطفال'].includes(clean)) return 'kids';
  if (['ramadan', 'رمضان'].includes(clean)) return 'ramadan';
  if (['soon', 'قريبا', 'قريباً'].includes(clean)) return 'soon';
  if (['programs', 'برامج', 'البرامج'].includes(clean)) return 'programs';
  if (['all', 'الكل', 'all_pages'].includes(clean)) return 'all';
  return clean;
};

const extractIdString = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val).trim();
  if (typeof val === 'object') {
    return String(val.id || val.contentId || val.slug || val.tmdbId || '').trim();
  }
  return '';
};

export const resolveSectionItems = (
  sec: HomeSection,
  allContent: Content[],
  ignoreLimit: boolean = false
): Content[] => {
  let resolvedItems: Content[] = [];

  const mapById = new Map<string, Content>();
  const mapBySlug = new Map<string, Content>();
  const mapByTmdb = new Map<string, Content>();

  allContent.forEach((item) => {
    if (item.id !== undefined && item.id !== null) {
      const idStr = String(item.id).trim();
      mapById.set(idStr, item);
      mapById.set(idStr.toLowerCase(), item);
    }
    if (item.slug) {
      const slugStr = String(item.slug).trim();
      mapBySlug.set(slugStr, item);
      mapBySlug.set(slugStr.toLowerCase(), item);
    }
    if (item.tmdbId !== undefined && item.tmdbId !== null) {
      const tmdbStr = String(item.tmdbId).trim();
      mapByTmdb.set(tmdbStr, item);
    }
  });

  const rawManualIds = 
    sec.selectedContentIds || 
    (sec as any).contentIds || 
    (sec as any).selectedIds || 
    (sec as any).items || 
    (sec as any).content_ids;

  const isManualType = sec.contentType === 'manual' || (sec as any).contentType === 'manual_selection' || (sec as any).contentType === 'custom';

  if ((isManualType || (rawManualIds && Array.isArray(rawManualIds) && rawManualIds.length > 0)) && Array.isArray(rawManualIds) && rawManualIds.length > 0) {
    resolvedItems = rawManualIds
      .map((idVal) => {
        const strId = extractIdString(idVal);
        if (!strId) return undefined;
        return mapById.get(strId) || mapById.get(strId.toLowerCase()) || mapBySlug.get(strId.toLowerCase()) || mapByTmdb.get(strId) || allContent.find(c => String(c.id) === strId || String(c.slug) === strId || String(c.tmdbId) === strId);
      })
      .filter((item): item is Content => item !== undefined);
  } else {
    let filtered = [...allContent];

    if (sec.filterType && sec.filterType !== 'all' && sec.filterType !== 'الكل') {
      const targetType = String(sec.filterType).toLowerCase().trim();
      filtered = filtered.filter((c) => {
        const cType = String(c.type).toLowerCase().trim();
        if (cType === targetType) return true;
        if ((targetType === 'movie' || targetType === 'movies') && (cType === 'movie' || cType === 'افلام' || cType === 'فيلم')) return true;
        if ((targetType === 'series' || targetType === 'tv') && (cType === 'series' || cType === 'مسلسلات' || cType === 'مسلسل')) return true;
        return false;
      });
    }

    const rawCatArray = Array.isArray(sec.filterCategory)
      ? sec.filterCategory
      : typeof sec.filterCategory === 'string' && (sec.filterCategory as string).trim()
        ? [(sec.filterCategory as string).trim()]
        : [];

    if (rawCatArray.length > 0) {
      const normCatArray = rawCatArray.map(normalizeArabic);
      filtered = filtered.filter((c) => {
        const itemCats = Array.isArray(c.categories)
          ? c.categories.map(normalizeArabic)
          : typeof c.categories === 'string'
            ? [normalizeArabic(c.categories as any)]
            : [];
        return itemCats.some((cat) =>
          normCatArray.some((fc) => fc === cat || cat.includes(fc) || fc.includes(cat))
        );
      });
    }

    const rawGenreArray = Array.isArray(sec.filterGenre)
      ? sec.filterGenre
      : typeof sec.filterGenre === 'string' && (sec.filterGenre as string).trim()
        ? [(sec.filterGenre as string).trim()]
        : [];

    if (rawGenreArray.length > 0) {
      const normGenreArray = rawGenreArray.map(normalizeArabic);
      filtered = filtered.filter((c) => {
        const itemGenres = Array.isArray(c.genres)
          ? c.genres.map(normalizeArabic)
          : typeof c.genres === 'string'
            ? [normalizeArabic(c.genres as any)]
            : [];
        return itemGenres.some((gn) =>
          normGenreArray.some((fg) => fg === gn || gn.includes(fg) || fg.includes(gn))
        );
      });
    }

    if (sec.sourceType === 'most_viewed') {
      filtered.sort((a, b) => (b.views || (b as any).viewsCount || 0) - (a.views || (a as any).viewsCount || 0));
    } else if (sec.sourceType === 'top_rated') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    }

    if (ignoreLimit) {
      resolvedItems = filtered;
    } else {
      const limit = Number(sec.itemLimit) > 0 ? Number(sec.itemLimit) : 12;
      resolvedItems = filtered.slice(0, limit);
    }
  }

  return resolvedItems;
};

export const resolveDynamicCarousels = (
  pageLocation: SectionPageLocation,
  customSections: HomeSection[] | undefined,
  allContent: Content[],
  baseCarousels: any[]
): any[] => {
  if (!customSections || customSections.length === 0) {
    return baseCarousels;
  }

  const targetNormalizedLocation = normalizeLocation(pageLocation);

  const pageSections = customSections.filter((s) => {
    // Check visibility
    const isVisible = s.isVisible !== false && (s as any).isVisible !== 'false' && (s as any).isVisible !== 0;
    if (!isVisible) return false;

    // Check page location match
    const sectionLoc = normalizeLocation(s.pageLocation);
    const isMatch = sectionLoc === targetNormalizedLocation || sectionLoc === 'all';
    return isMatch;
  });

  if (pageSections.length === 0) {
    return baseCarousels;
  }

  const customCarouselsMapped = pageSections
    .map((sec, idx) => {
      const resolvedItems = resolveSectionItems(sec, allContent, false);
      const sectionCategoryKey = sec.id ? `section:${sec.id}` : (sec.title || 'custom_section');

      return {
        id: sec.id || `custom_${idx}_${Date.now()}`,
        title: sec.title || 'قسم مخصص',
        contents: resolvedItems,
        displayType: sec.displayType || 'hybrid',
        isNew: Boolean(sec.isNew),
        showRanking: sec.displayType === 'top10_ranking' || Boolean(sec.showRanking),
        positionIndex: Number(sec.positionIndex) || 1,
        targetCarouselId: sec.targetCarouselId,
        isCustom: true,
        categoryKey: sectionCategoryKey,
        sectionId: sec.id,
      };
    })
    .filter((c) => c.contents.length > 0);

  if (customCarouselsMapped.length === 0) {
    return baseCarousels;
  }

  // Sort custom carousels by target positionIndex ascending
  const sortedCustom = [...customCarouselsMapped].sort(
    (a, b) => (a.positionIndex ?? 1) - (b.positionIndex ?? 1)
  );

  // Start with a copy of base carousels
  const result = [...baseCarousels];

  sortedCustom.forEach((custom) => {
    // Check if replacing a target carousel by ID
    if (custom.targetCarouselId) {
      const existingIdx = result.findIndex((c) => c.id === custom.targetCarouselId);
      if (existingIdx !== -1) {
        result[existingIdx] = custom;
        return;
      }
    }

    const targetPos = Math.max(1, custom.positionIndex ?? 1);
    const insertIdx = targetPos - 1; // 1-based to 0-based index

    if (insertIdx >= result.length) {
      result.push(custom);
    } else {
      result.splice(insertIdx, 0, custom);
    }
  });

  return result;
};


