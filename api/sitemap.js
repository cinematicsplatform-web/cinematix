const admin = require('firebase-admin');

// Initialize Firebase Admin with Singleton pattern
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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

    const staticRoutes = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/movies', priority: '0.9', changefreq: 'daily' },
      { url: '/series', priority: '0.9', changefreq: 'daily' },
      { url: '/kids', priority: '0.8', changefreq: 'weekly' },
      { url: '/ramadan', priority: '0.8', changefreq: 'weekly' },
      { url: '/soon', priority: '0.8', changefreq: 'weekly' }
    ];

    const snapshot = await db.collection('content').get();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    staticRoutes.forEach(route => {
      xml += `
  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${lastModDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    });

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
        xml += `
  <url>
    <loc>${BASE_URL}/watch/movie/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <video:video>
      <video:thumbnail_loc>${data.poster || ''}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${(data.description || title).substring(0, 200)}</video:description>
      <video:content_loc>${BASE_URL}/watch/movie/${slug}</video:content_loc>
    </video:video>
  </url>`;
      } else if (type === 'series' || type === 'program') {
        const seasons = data.seasons || [];
        seasons.forEach(season => {
             xml += `
  <url>
    <loc>${BASE_URL}/${type}/${slug}/الموسم${season.seasonNumber}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
             
             if (season.episodes) {
                 season.episodes.forEach((ep, idx) => {
                     const epNum = idx + 1;
                     xml += `
  <url>
    <loc>${BASE_URL}/watch/${slug}/الموسم${season.seasonNumber}/الحلقة${epNum}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <video:video>
      <video:thumbnail_loc>${ep.thumbnail || data.poster}</video:thumbnail_loc>
      <video:title>${title} - الموسم ${season.seasonNumber} الحلقة ${epNum}</video:title>
      <video:description>${(ep.description || data.description || title).substring(0, 200)}</video:description>
    </video:video>
  </url>`;
                 });
             }
        });
      }
    });

    xml += `\n</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); 
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    return res.status(500).send('Error generating sitemap');
  }
};