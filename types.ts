
export const ContentType = {
  Movie: 'movie',
  Series: 'series',
} as const;

export type ContentType = typeof ContentType[keyof typeof ContentType];

export const categories = [
  'مسلسلات عربية',
  'مسلسلات تركية',
  'مسلسلات اجنبية',
  'افلام عربية',
  'افلام تركية',
  'افلام اجنبية',
  'افلام هندية',
  'افلام أنميشن',
  'برامج تلفزيونية',
  'رمضان',
  'قريباً',
  'حصرياً لرمضان',
  'برامج رمضان',
  'افلام العيد',
  'مسلسلات رمضان',
] as const;

export type Category = typeof categories[number];

export const genres = [
    'أكشن', 'مغامرة', 'تشويق', 'جريمة', 'غموض', 'إثارة', 'دراما', 'اجتماعي', 'رومانسي', 
    'كوميديا', 'رعب', 'خيال علمي', 'فانتازيا', 'تاريخي', 'سيرة ذاتية', 'حربي', 
    'عائلي', 'أطفال', 'وثائقي',
] as const;

export type Genre = typeof genres[number];

export type View = 'home' | 'movies' | 'series' | 'kids' | 'ramadan' | 'soon' | 'detail' | 'admin' | 'login' | 'register' | 'profileSelector' | 'accountSettings' | 'privacy' | 'copyright' | 'about' | 'myList' | 'category' | 'profileHub' | 'maintenance';

export type LoginError = 'none' | 'userNotFound' | 'wrongPassword';

export interface Server {
  id: number;
  name: string;
  url: string;
  downloadUrl: string;
  isActive: boolean;
}

export interface Episode {
  id: number;
  title?: string;
  thumbnail: string;
  duration: number; // in minutes
  progress: number; // percentage
  servers: Server[];
}

export interface Season {
  id: number;
  seasonNumber: number;
  title?: string;
  episodes: Episode[];
  poster?: string; // New: Season specific poster
  backdrop?: string; // New: Season specific backdrop
  logoUrl?: string; // New: Season specific logo (transparent)
  releaseYear?: number; // New: Optional release year for the season
  description?: string; // New: Optional description/plot for the season
  cast?: string[]; // New: Optional cast specific to the season
}

export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  poster: string;
  backdrop: string;
  rating: number; // out of 5
  ageRating: string;
  categories: Category[];
  genres: Genre[];
  releaseYear: number;
  cast: string[];
  bannerNote?: string;
  seasons?: Season[];
  servers?: Server[]; // For movies
  releaseDate?: string; // For upcoming content, e.g., '2026-03-01'
  visibility: 'general' | 'adults' | 'kids'; // Replaces isKidsSafe
  createdAt: string;
  updatedAt?: string;
  logoUrl?: string; // New: URL for the title logo image
  isLogoEnabled?: boolean; // New: Toggle to show logo instead of text
  duration?: string; // New: Movie duration (e.g., "1h 30m")
  enableMobileCrop?: boolean; // New: Toggle for mobile image cropping
  mobileCropPosition?: number; // New: Percentage (0-100) for object-position-x on mobile
  slug?: string; // New: SEO friendly URL slug
}

export interface PinnedItem {
  contentId: string;
  bannerNote?: string;
}

export type PageKey = 'home' | 'movies' | 'series' | 'kids' | 'ramadan' | 'soon';

export type PinnedContentState = Record<PageKey, PinnedItem[]>;

export interface CarouselRow {
  id: string;
  title: string;
  contentIds: string[];
  isNew?: boolean; // To identify the "أحدث الإضافات" carousel
  showRanking?: boolean; // New: Flag to show ranking badges
}

export interface WatchHistoryItem {
  contentId: string;
  seasonId?: number;
  episodeId?: number;
  watchedAt: string; // ISO String
}

export const UserRole = {
  Guest: 'guest',
  User: 'user',
  Admin: 'admin'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface Profile {
  id: number;
  name: string;
  avatar: string;
  watchHistory: WatchHistoryItem[];
  myList: string[]; // Array of content IDs
  isKid: boolean;
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string; // In a real app, this would be a hash
  role: UserRole;
  profiles: Profile[];
}

// FIX: Added granular placement controls
export const adPlacements = [
  'home-top',
  'home-below-hero', // New: Below Hero Section
  'home-middle',
  'home-carousel-3-4', // New: Between Carousel 3 & 4
  'watch-top',
  'watch-bottom',
  'watch-sidebar', // New: Sidebar in Detail Page
  'watch-preroll', // New: Before Video Starts
  'movies-page',
  'series-page',
  'ramadan-page',
  'soon-page',
  'kids-top',
  'kids-bottom',
  'ramadan-top',
  'ramadan-bottom',
  'soon-page-top',
  'soon-page-bottom',
] as const;

export type AdPlacement = typeof adPlacements[number];

export const adPlacementLabels: Record<AdPlacement, string> = {
    'home-top': 'الرئيسية - أعلى القائمة',
    'home-below-hero': 'الرئيسية - أسفل الهيرو (Hero)',
    'home-middle': 'الرئيسية - منتصف (افتراضي)',
    'home-carousel-3-4': 'الرئيسية - بين القسم 3 و 4',
    'watch-top': 'المشاهدة - أعلى المشغل',
    'watch-bottom': 'المشاهدة - أسفل المشغل',
    'watch-sidebar': 'المشاهدة - الشريط الجانبي',
    'watch-preroll': 'المشاهدة - قبل الفيديو (Pre-roll)',
    'movies-page': 'صفحة الأفلام',
    'series-page': 'صفحة المسلسلات',
    'ramadan-page': 'صفحة رمضان',
    'soon-page': 'صفحة قريباً',
    'kids-top': 'صفحة الأطفال - أعلى',
    'kids-bottom': 'صفحة الأطفال - أسفل',
    'ramadan-top': 'صفحة رمضان - أعلى',
    'ramadan-bottom': 'صفحة رمضان - أسفل',
    'soon-page-top': 'صفحة قريباً - أعلى',
    'soon-page-bottom': 'صفحة قريباً - أسفل',
};


export interface Ad {
  id: string;
  title: string;
  code: string; // HTML/JS code
  placement: AdPlacement;
  status: 'active' | 'disabled';
  updatedAt: string; // ISO String
}


export interface ShoutBar {
  text: string;
  isVisible: boolean;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  facebookGroup: string;
  contactUs: string;
}

export type ThemeType = 'default' | 'ramadan' | 'ios' | 'night-city' | 'nature' | 'eid' | 'cosmic-teal' | 'netflix-red';

export interface SiteSettings {
    shoutBar: ShoutBar;
    socialLinks: SocialLinks;
    countdownDate: string;
    adsEnabled: boolean;
    privacyPolicy: string;
    copyrightPolicy: string; // New: Copyright Policy Text
    isCountdownVisible: boolean;
    isRamadanModeEnabled: boolean; // Kept for backward compatibility, synced with activeTheme
    activeTheme: ThemeType; // New: Theme Switcher
    isShowRamadanCarousel: boolean; 
    is_maintenance_mode_enabled: boolean;
    // Top 10 Toggles
    showTop10Home: boolean;
    showTop10Movies: boolean;
    showTop10Series: boolean;
}
