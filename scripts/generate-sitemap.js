import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Use same config as frontend - accessible in public build context
const firebaseConfig = {
  apiKey: "AIzaSyBVK0Zla5VD05Hgf4QqExAWUuXX64odyes",
  authDomain: "cinematic-d3697.firebaseapp.com",
  projectId: "cinematic-d3697",
  storageBucket: "cinematic-d3697.firebasestorage.app",
  messagingSenderId: "247576999692",
  appId: "1:247576999692:web:309f001a211dc1b150fb29",
};

// Initialize Lite version for script performance
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const BASE_URL = 'https://cinematix.watch';

// Slugify helper (replicated from codebase to avoid TS import issues in JS script)
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

async function generateSitemap() {
    console.log('Generating sitemap...');
    
    try {
        const contentRef = collection(db, 'content');
        const snapshot = await getDocs(contentRef);
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/movies</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/series</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/kids</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/ramadan</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const title = data.title || '';
            const slug = data.slug || generateSlug(title) || id;
            const type = data.type || 'movie';
            const updatedAt = data.updatedAt ? new Date(data.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            
            // 1. Content Detail Page
            const prefix = type === 'series' ? 'مسلسل' : 'فيلم';
            // Proper encoding of Arabic characters in URL
            const urlPath = encodeURI(`${prefix}/${slug}`);
            
            xml += `  <url>
    <loc>${BASE_URL}/${urlPath}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;

            // 2. Series Deep Linking (Seasons & Episodes)
            if (type === 'series' && data.seasons) {
                data.seasons.forEach(season => {
                    const sNum = season.seasonNumber;
                    const seasonPath = encodeURI(`مسلسل/${slug}/الموسم/${sNum}`);
                    
                    xml += `  <url>
    <loc>${BASE_URL}/${seasonPath}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

                    if (season.episodes) {
                        season.episodes.forEach((ep, index) => {
                            const eNum = index + 1;
                            const episodePath = encodeURI(`مسلسل/${slug}/الموسم/${sNum}/الحلقة/${eNum}`);
                            
                            xml += `  <url>
    <loc>${BASE_URL}/${episodePath}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
                        });
                    }
                });
            }
        });

        xml += `</urlset>`;
        
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const publicDir = path.resolve(__dirname, '../public');
        
        if (!fs.existsSync(publicDir)){
            fs.mkdirSync(publicDir);
        }

        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
        console.log(`✅ Sitemap generated successfully with ${snapshot.size} items.`);

    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
        process.exit(1);
    }
}

generateSitemap();