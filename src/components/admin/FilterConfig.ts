import type { Content } from '../../types';

// ==========================================
// 1. القائمة الشاملة للتصنيفات (SYSTEM CATEGORIES)
// ==========================================
export const SYSTEM_CATEGORIES = [
  'مسلسلات عربية',
  'مسلسلات تركية',
  'مسلسلات اجنبية',
  'افلام عربية',
  'افلام تركية',
  'افلام اجنبية',
  'افلام هندية',
  'أفلام أنيميشن',
  'مسلسلات أنيميشن',
  'برامج تلفزيونية',
  'رمضان',
  'قريباً',
  'حصرياً لرمضان',
  'برامج رمضان',
  'افلام العيد',
  'مسلسلات رمضان',
  'حفلات',
  'مسرحيات',
  'وثائقيات',
  'عروض مصارعة',
  'حصري للمشتركين'
] as const;

export type SystemCategory = typeof SYSTEM_CATEGORIES[number];

// ==========================================
// 2. واجهات النظام (INTERFACES & TYPES)
// ==========================================
export interface FilterContext {
  content: Content;
  hasWatch: boolean;
  hasDownload: boolean;
  hasPoster: boolean;
  isPublished: boolean;
}

export type FilterGroupType = 'all' | 'type' | 'ramadan' | 'technical' | 'status';

export interface FilterItem {
  key: string;
  label: string;
  icon: string;
  group: FilterGroupType;
  match: (ctx: FilterContext) => boolean;
}

// ==========================================
// 3. عناصر الفلترة الذكية (بالمسميات المحدثة وحماية ضد الانهيار)
// ==========================================
export const FILTER_ITEMS: FilterItem[] = [
  // --- المجموعة العامة ---
  { 
    key: 'all', 
    label: 'كل المحتوى', 
    icon: '📁',
    group: 'all',
    match: () => true 
  },

  // --- مجموعة التصنيفات الأساسية ---
  { 
    key: 'arabic-series', 
    label: 'مسلسلات عربية', 
    icon: '📺',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('مسلسلات عربية')
  },
  { 
    key: 'arabic-movies', 
    label: 'أفلام عربية', 
    icon: '🎬',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('افلام عربية')
  },
  { 
    key: 'foreign-series', 
    label: 'مسلسلات أجنبية', 
    icon: '🌍',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('مسلسلات اجنبية')
  },
  { 
    key: 'foreign-movies', 
    label: 'أفلام أجنبية', 
    icon: '🎥',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('افلام اجنبية')
  },
  { 
    key: 'turkish-series', 
    label: 'مسلسلات تركية', 
    icon: '🇹🇷',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('مسلسلات تركية')
  },
  { 
    key: 'turkish-movies', 
    label: 'أفلام تركية', 
    icon: '🎬',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('افلام تركية')
  },
  { 
    key: 'indian-movies', 
    label: 'أفلام هندية', 
    icon: '🇮🇳',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('افلام هندية')
  },
  { 
    key: 'animation-all', 
    label: 'الأنيميشن والكرتون', 
    icon: '🦄',
    group: 'type',
    match: ({ content }) => !!(
      content?.categories?.includes('أفلام أنيميشن') || 
      content?.categories?.includes('مسلسلات أنيميشن')
    )
  },
  { 
    key: 'tv-programs', 
    label: 'برامج تلفزيونية', 
    icon: '🎙️',
    group: 'type',
    match: ({ content }) => !!content?.categories?.includes('برامج تلفزيونية')
  },

  // --- مجموعة رمضان والمناسبات ---
  { 
    key: 'ramadan-series', 
    label: 'مسلسلات رمضان', 
    icon: '🌙',
    group: 'ramadan',
    match: ({ content }) => !!content?.categories?.includes('مسلسلات رمضان')
  },
  { 
    key: 'ramadan-exclusive', 
    label: 'حصرياً لرمضان', 
    icon: '⭐',
    group: 'ramadan',
    match: ({ content }) => !!content?.categories?.includes('حصرياً لرمضان')
  },
  { 
    key: 'ramadan-programs', 
    label: 'برامج رمضان', 
    icon: '📿',
    group: 'ramadan',
    match: ({ content }) => !!content?.categories?.includes('برامج رمضان')
  },
  { 
    key: 'eid-movies', 
    label: 'أفلام العيد', 
    icon: '🎉',
    group: 'ramadan',
    match: ({ content }) => !!content?.categories?.includes('افلام العيد')
  },
  { 
    key: 'theater-concerts', 
    label: 'مسرحيات وحفلات', 
    icon: '🎭',
    group: 'ramadan',
    match: ({ content }) => !!(
      content?.categories?.includes('مسرحيات') || 
      content?.categories?.includes('حفلات')
    )
  },

  // --- مجموعة التشخيص الفني (بالمسميات المحدثة بالضبط حسب طلبك) ---
  { 
    key: 'watch-only', 
    label: 'بدون تحميل', 
    icon: '🍿',
    group: 'technical',
    match: ({ hasDownload }) => !hasDownload
  },
  { 
    key: 'download-only', 
    label: 'بدون مشاهدة', 
    icon: '📥',
    group: 'technical',
    match: ({ hasWatch }) => !hasWatch
  },
  { 
    key: 'missing-poster', 
    label: 'بدون بوسترات', 
    icon: '🖼️',
    group: 'technical',
    match: ({ hasPoster }) => !hasPoster
  },

  // --- مجموعة حالة النشر ---
  { 
    key: 'published', 
    label: 'منشور وحي', 
    icon: '🟢',
    group: 'status',
    match: ({ isPublished }) => isPublished === true
  }
];

// ==========================================
// 4. تسميات المجموعات لتنظيم العرض في اللوحة
// ==========================================
export const FILTER_GROUPS: Record<FilterGroupType, string> = {
  all: 'الرئيسية',
  type: 'حسب التصنيف',
  ramadan: 'الرمضانيات والمناسبات',
  technical: 'التشخيص والفحص الفني',
  status: 'حالة النشر'
};