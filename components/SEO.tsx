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
  seasons?: SeasonMeta[];
  currentEpisode?: EpisodeMeta; // Legacy/Object support
  seasonNumber?: number; // New: Explicit season number
  episodeNumber?: number; // New: Explicit episode number
  type?: 'movie' | 'series' | 'website';
  poster?: string;
  banner?: string;
  image?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "منصتكم الأولى للترفيه العربي والتركي والأجنبي. شاهدوا أحدث الأفلام والمسلسلات بجودة عالية في أي وقت ومن أي مكان.",
  seasons = [],
  currentEpisode,
  seasonNumber,
  episodeNumber,
  type = 'website',
  poster,
  banner,
  image,
  url = ''
}) => {
  const siteName = "سينماتيكس";
  const domain = 'https://cinematix.watch';
  const canonicalUrl = url.startsWith('http') ? url : `${domain}${url}`;
  
  // 1. Dynamic Title Construction Logic
  const generateFullTitle = () => {
    if (!title) return "سينماتيكس | Cinematix";

    let displayTitle = title;
    
    // Add Type Prefix if not already present (e.g., "فيلم " or "مسلسل ")
    const moviePrefix = "فيلم ";
    const seriesPrefix = "مسلسل ";
    
    if (type === 'movie' && !displayTitle.startsWith(moviePrefix)) {
        displayTitle = moviePrefix + displayTitle;
    } else if (type === 'series' && !displayTitle.startsWith(seriesPrefix)) {
        displayTitle = seriesPrefix + displayTitle;
    }

    // Determine Season/Episode context from explicit props or legacy currentEpisode object
    const sNum = seasonNumber || currentEpisode?.season_number;
    const eNum = episodeNumber || currentEpisode?.episode_number;

    if (sNum) {
      displayTitle += ` - الموسم ${sNum}`;
    }

    if (eNum) {
      displayTitle += ` الحلقة ${eNum}`;
    }

    return `${displayTitle} | ${siteName}`;
  };

  const fullTitle = generateFullTitle();

  // 2. Smart Description Helper Logic
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
  const absoluteImageUrl = seoImage.startsWith('http') 
    ? seoImage 
    : `${domain}${seoImage}`;

  // 3. Structured Data (JSON-LD) Generation
  const generateSchema = () => {
    if (type === 'movie') {
      return {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": title,
        "description": finalDescription,
        "image": absoluteImageUrl,
        "url": canonicalUrl
      };
    }

    if (type === 'series') {
      const seriesId = title ? encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-')) : 'series';
      
      return {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": title,
        "description": description,
        "image": absoluteImageUrl,
        "containsSeason": seasons.map(season => ({
          "@type": "TVSeason",
          "seasonNumber": season.season_number,
          "name": `الموسم ${season.season_number}`,
          "episode": season.episodes.map(ep => ({
            "@type": "TVEpisode",
            "episodeNumber": ep.episode_number,
            "name": ep.name || `الحلقة ${ep.episode_number}`,
            "description": ep.overview || `الحلقة ${ep.episode_number} من الموسم ${season.season_number}`,
            "url": `${domain}/مشاهدة/${seriesId}/الموسم/${season.season_number}/الحلقة/${ep.episode_number}`
          }))
        }))
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

  const schemaData = generateSchema();

  return (
    <Helmet>
      <html lang="ar" dir="rtl" />
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'series' ? 'video.tv_show' : type === 'movie' ? 'video.movie' : 'website'} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:site_name" content="سينماتيكس | Cinematix" />
      <meta property="og:locale" content="ar_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteImageUrl} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default SEO;