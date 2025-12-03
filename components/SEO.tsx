import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'video.episode';
  url?: string;
  schema?: Record<string, any>; // JSON-LD Schema
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "منصتكم الأولى للترفيه العربي والتركي والأجنبي. شاهدوا أحدث الأفلام والمسلسلات بجودة عالية في أي وقت ومن أي مكان.",
  image = "https://cinematix-kappa.vercel.app/icon-512.png",
  type = 'website',
  url = typeof window !== 'undefined' ? window.location.href : '',
  schema,
  noIndex = false
}) => {
  const siteName = "سينماتيكس | Cinematix";
  
  // Clean Title Logic
  const baseTitle = title ? title : "مشاهدة أفلام ومسلسلات اون لاين";
  const fullTitle = title?.includes('|') ? title : `${baseTitle} | سينماتيكس`;

  // Ensure Canonical URL is absolute, clean, and avoids query params
  // NOTE: In Vercel deployments, ensure your domain is set correctly
  const domain = 'https://cinematix-kappa.vercel.app';
  
  // Construct canonical URL: Domain + Pathname (No Query Params)
  let path = '';
  if (typeof window !== 'undefined') {
      path = window.location.pathname;
  }
  const canonicalUrl = `${domain}${path}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <html lang="ar" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots Control */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ar_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) for Rich Snippets */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;