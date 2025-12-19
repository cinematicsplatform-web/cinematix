import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  poster?: string;
  banner?: string;
  url?: string;
  type?: string; // New: added optional type property to support Open Graph type meta tags
}

/**
 * Smart SEO Component
 * Manages document head metadata for search engines and social sharing.
 * Prioritizes horizontal banners for social cards, falling back to vertical posters.
 */
const SEO: React.FC<SEOProps> = ({ title, description, keywords, poster, banner, url, type }) => {
  // Use current window location as fallback if URL prop is missing
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Image Logic: Prioritize banner (landscape) -> poster (vertical) -> default
  const socialImage = banner || poster || '/android-chrome-512x512.png';
  
  // Append site branding to the title
  const fullTitle = `${title} | Cinematix`;

  return (
    <Helmet>
      {/* Standard SEO */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      {/* Fix: og:type is now dynamic via the type prop, defaulting to 'website' */}
      <meta property="og:type" content={type || 'website'} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="سينماتيكس | Cinematix" />
      <meta property="og:locale" content="ar_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={socialImage} />
    </Helmet>
  );
};

export default SEO;