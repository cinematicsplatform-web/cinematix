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
  currentEpisode?: EpisodeMeta;
  type?: 'movie' | 'series' | 'website';
  poster?: string;
  banner?: string;
  // Added 'image' prop to fix errors where callers used it instead of 'poster' or 'banner'
  image?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "منصتكم الأولى للترفيه العربي والتركي والأجنبي. شاهدوا أحدث الأفلام والمسلسلات بجودة عالية في أي وقت ومن أي مكان.",
  seasons = [],
  currentEpisode,
  type = 'website',
  poster,
  banner,
  // Destructure the newly added 'image' prop
  image,
  url = ''
}) => {
  const siteName = "سينماتيكس | Cinematix";
  const domain = 'https://cinematix.watch';
  const canonicalUrl = url.startsWith('http') ? url : `${domain}${url}`;
  
  // 1. Dynamic Browser Title Logic
  const generateTitle = () => {
    if (!title) return siteName;
    if (currentEpisode) {
      return `${title} - S${currentEpisode.season_number} E${currentEpisode.episode_number} | Cinematix`;
    }
    return `${title} | Cinematix`;
  };

  // 2. Smart Description Helper Logic
  const generateDescription = () => {
    if (currentEpisode) {
      const epName = currentEpisode.name || `الحلقة ${currentEpisode.episode_number}`;
      const epOverview = currentEpisode.overview || `شاهد أحداث الحلقة ${currentEpisode.episode_number} من الموسم ${currentEpisode.season_number}. استمتع بمشاهدة تطورات الأحداث.`;
      return `${epName}: ${epOverview}`;
    }
    return description;
  };

  const fullTitle = generateTitle();
  const finalDescription = generateDescription();
  
  // Updated logic to use the new 'image' prop if provided
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

    // Default Website Schema
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
      <meta property="og:site_name" content={siteName} />
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