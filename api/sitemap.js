const admin = require('firebase-admin');

// Initialize Firebase Admin with Singleton pattern
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Ensure private key handles newlines correctly from environment variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY 
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
          : undefined,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

/**
 * Utility to generate a safe URL slug from a title
 * Matches the client-side logic for consistency
 */
const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

module.exports = async (req, res) => {
  try {
    const BASE_URL = 'https://cinematix.watch';
    const lastModDate = new Date().toISOString().split('T')[0];

    // 1. Define Static Routes
    const staticRoutes = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/movies', priority: '0.9', changefreq: 'daily' },
      { url: '/series', priority: '0.9', changefreq: 'daily' },
      { url: '/kids', priority: '0.8', changefreq: 'weekly' },
      { url: '/ramadan', priority: '0.8', changefreq: 'weekly' },
      { url: '/soon', priority: '0.7', changefreq: 'weekly' },
      { url: '/mylist', priority: '0.5', changefreq: 'monthly' },
      { url: '/about', priority: '0.4', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
      { url: '/copyright', priority: '0.3', changefreq: 'monthly' }
    ];

    // 2. Fetch Dynamic Content from Firestore
    // Note: The app uses a single 'content' collection with a 'type' field
    const snapshot = await db.collection('content').get();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // Add Static Routes to XML
    staticRoutes.forEach(route => {
      xml += `
  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    });

    // Add Dynamic Routes to XML
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const title = data.title || '';
      const slug = data.slug || generateSlug(title) || id;
      const type = data.type || 'movie';
      
      let updatedAt = lastModDate;
      if (data.updatedAt) {
          updatedAt = typeof data.updatedAt === 'string' 
            ? data.updatedAt.split('T')[0] 
            : data.updatedAt.toDate().toISOString().split('T')[0];
      }

      if (type === 'movie') {
        // Movie Detail / Watch URL
        xml += `
  <url>
    <loc>${BASE_URL}/watch/movie/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      } else if (type === 'series') {
        // Series Detail Page
        xml += `
  <url>
    <loc>${BASE_URL}/series/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

        // Index individual episodes for better SEO coverage
        if (data.seasons && Array.isArray(data.seasons)) {
          data.seasons.forEach((season) => {
            const sNum = season.seasonNumber;
            if (season.episodes && Array.isArray(season.episodes)) {
              season.episodes.forEach((ep, index) => {
                const eNum = index + 1;
                xml += `
  <url>
    <loc>${BASE_URL}/watch/${slug}/${sNum}/${eNum}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
              });
            }
          });
        }
      }
    });

    xml += `\n</urlset>`;

    // 3. Set Headers and Send Response
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // 1 hour edge cache
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Sitemap Generation API Error:', error);
    return res.status(500).send('Error generating sitemap');
  }
};