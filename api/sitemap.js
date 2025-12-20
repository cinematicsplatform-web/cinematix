
const admin = require('firebase-admin');

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
    console.error('Firebase Admin init error:', error);
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

    const snapshot = await db.collection('content').get();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url><loc>${BASE_URL}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>${BASE_URL}/movies</loc><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/series</loc><priority>0.9</priority></url>
  <url><loc>${BASE_URL}/kids</loc><priority>0.8</priority></url>
  <url><loc>${BASE_URL}/ramadan</loc><priority>0.8</priority></url>
`;

    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const slug = data.slug || generateSlug(data.title) || id;
      const type = data.type || 'movie';
      let updatedAt = lastModDate;
      
      if (data.updatedAt) {
          updatedAt = typeof data.updatedAt === 'string' 
            ? data.updatedAt.split('T')[0] 
            : data.updatedAt.toDate().toISOString().split('T')[0];
      }

      if (type === 'movie') {
        xml += `  <url>
    <loc>${BASE_URL}/watch/movie/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      } else {
        xml += `  <url>
    <loc>${BASE_URL}/series/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;

        if (data.seasons && Array.isArray(data.seasons)) {
          data.seasons.forEach((season) => {
            const sNum = season.seasonNumber;
            if (season.episodes && Array.isArray(season.episodes)) {
              season.episodes.forEach((ep, index) => {
                const eNum = index + 1;
                xml += `  <url>
    <loc>${BASE_URL}/watch/${slug}/${sNum}/${eNum}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
              });
            }
          });
        }
      }
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).send(xml);

  } catch (error) {
    console.error('Sitemap API Error:', error);
    return res.status(500).send('Error generating sitemap');
  }
};
