import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show';
  url?: string;
  schema?: Record<string, any>; // JSON-LD Schema
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "منصتكم الأولى للترفيه العربي والتركي والأجنبي. شاهدوا أحدث الأفلام والمسلسلات بجودة عالية في أي وقت ومن أي مكان.",
  image = "https://images.unsplash.com/photo-1574267432553-4b4628081c31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  type = 'website',
  url = window.location.href,
  schema
}) => {
  const siteName = "سينماتيكس | Cinematix";
  // Updated: Use exact title if provided to allow specific formats like "Movie Name (2025) - Cinematix"
  const fullTitle = title || "سينماتيكس | Cinematix - مشاهدة أفلام ومسلسلات اون لاين";

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;