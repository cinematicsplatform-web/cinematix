import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'video.episode';
  url?: string;
  schema?: Record<string, any>;
  noIndex?: boolean;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "منصتكم الأولى للترفيه العربي والتركي والأجنبي. شاهدوا أحدث الأفلام والمسلسلات بجودة عالية في أي وقت ومن أي مكان.",
  image = "/android-chrome-512x512.png", 
  type = 'website',
  url = typeof window !== 'undefined' ? window.location.pathname : '',
  schema,
  noIndex = false
}) => {
  const siteName = "سينماتيكس | Cinematix";
  const baseTitle = title ? title : "مشاهدة أفلام ومسلسلات اون لاين";
  const fullTitle = title?.includes('|') ? title : `${baseTitle} | سينماتيكس`;
  const domain = 'https://cinematix-kappa.vercel.app';
  const canonicalUrl = url.startsWith('http') ? url : `${domain}${url}`;
  
  // Ensure image is an absolute URL
  const absoluteImageUrl = image.startsWith('http') ? image : `${domain}${image}`;
  const absoluteLogoUrl = `${domain}/android-chrome-512x512.png`;

  // Organization Schema for Brand Search Results
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Cinematix",
    "alternateName": "سينماتيكس",
    "url": domain,
    "logo": absoluteLogoUrl,
    "image": absoluteLogoUrl,
    "description": description,
    "sameAs": [
      "https://facebook.com",
      "https://instagram.com",
      "https://twitter.com"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "سينماتيكس",
    "url": domain,
    "image": absoluteLogoUrl
  };

  return (
    <Helmet>
      <html lang="ar" dir="rtl" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Favicons & Brand Icons for Search Engines */}
      <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
      <link rel="shortcut icon" href="/android-chrome-192x192.png" />
      <link rel="apple-touch-icon" href="/android-chrome-192x192.png" />
      <link rel="apple-touch-icon-precomposed" href="/android-chrome-192x192.png" />

      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteLogoUrl} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ar_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteLogoUrl} />

      {/* Default Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;