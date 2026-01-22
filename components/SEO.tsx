import React from 'react';
import { Helmet } from 'react-helmet-async';

interface EpisodeMeta {
  episode_number: number;
  season_number: number;
  name?: string;
  overview?: string;
  still_path?: string;
}

interface SeasonMeta {
  season_number: number;
  episodes: EpisodeMeta[];
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string; 
  seasons?: SeasonMeta[];
  currentEpisode?: EpisodeMeta; 
  seasonNumber?: number; 
  episodeNumber?: number; 
  type?: 'movie' | 'series' | 'website';
  poster?: string;
  banner?: string;
  image?: string;
  url?: string; 
  noIndex?: boolean; 
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "منصتكم الأولى للترفيه العربي والتركي والأجنبي. شاهدوا أحدث الأفلام والمسلسلات بجودة عالية في أي وقت ومن أي مكان.",
  keywords,
  seasons = [],
  currentEpisode,
  seasonNumber,
  episodeNumber,
  type = 'website',
  poster,
  banner,
  image,
  url = '',
  noIndex = false
}) => {
  const siteName = "سينماتيكس";
  const domain = 'https://cinematix.watch';
  
  const path = url || (typeof window !== 'undefined' ? window.location.pathname : '');
  const canonicalUrl = path.startsWith('http') ? path : `${domain}${path}`;
  
  const generateFullTitle = () => {
    if (!title) return "سينماتيكس | Cinematix - مشاهدة أفلام ومسلسلات اون لاين";
    let displayTitle = title;
    if (displayTitle.includes('|')) return displayTitle;

    const moviePrefix = "فيلم ";
    const seriesPrefix = "مسلسل ";
    
    if (type === 'movie' && !displayTitle.startsWith(moviePrefix)) {
        displayTitle = moviePrefix + displayTitle;
    } else if (type === 'series' && !displayTitle.startsWith(seriesPrefix)) {
        displayTitle = seriesPrefix + displayTitle;
    }

    const sNum = seasonNumber || currentEpisode?.season_number;
    const eNum = episodeNumber || currentEpisode?.episode_number;

    if (sNum) displayTitle += ` - الموسم ${sNum}`;
    if (eNum) displayTitle += ` الحلقة ${eNum}`;

    return `${displayTitle} | ${siteName}`;
  };

  const fullTitle = generateFullTitle();

  const generateDescription = () => {
    const eNum = episodeNumber || currentEpisode?.episode_number;
    const sNum = seasonNumber || currentEpisode?.season_number;

    if (eNum && sNum) {
      const epName = currentEpisode?.name || `الحلقة ${eNum}`;
      return `${epName}: شاهد أحداث الحلقة ${eNum} من الموسم ${sNum} لمسلسل ${title}. استمتع بمشاهدة تطورات الأحداث بجودة عالية على سينماتيكس.`;
    }
    return description;
  };

  const finalDescription = generateDescription();
  const seoImage = image || banner || poster || "/android-chrome-512x512.png";
  const absoluteImageUrl = seoImage.startsWith('http') ? seoImage : `${domain}${seoImage}`;

  const generateSchema = () => {
    // تم إزالة خاصية "image" من الـ Schema لضمان عدم ظهور بوستر العمل في نتائج بحث جوجل (Google SERP)
    // مع الحفاظ على مظهر نصي نظيف للموقع.
    if (type === 'movie') {
      return {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": title,
        "description": finalDescription,
        "url": canonicalUrl
      };
    }
    if (type === 'series') {
      return {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": title,
        "description": description
      };
    }
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "سينماتيكس",
      "url": domain,
      "description": finalDescription
    };
  };

  return (
    <Helmet>
      <html lang="ar" dir="rtl" />
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* تقييد ظهور الصور في مقتطفات جوجل (SERP Snippets) لعرض نتائج نصية فقط */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:none"} />
      <meta name="googlebot" content="index, follow, max-image-preview:none" />
      
      {/* Open Graph / Facebook - الصور تظهر هنا بشكل طبيعي عند المشاركة */}
      <meta property="og:type" content={type === 'series' ? 'video.tv_show' : type === 'movie' ? 'video.movie' : 'website'} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="سينماتيكس | Cinematix" />
      <meta property="og:locale" content="ar_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteImageUrl} />

      {/* Structured Data */}
      {!noIndex && (
        <script type="application/ld+json">
          {JSON.stringify(generateSchema())}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;