import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Cinematix Sitemap Generator (Slug-Based Strategy)
 * Target URLs:
 * - Series: /series/${slug}
 * - Movies: /watch/movie/${slug}
 * - Episodes: /watch/${series_slug}/${season_num}/${episode_num}
 */

const firebaseConfig = {
  apiKey: "AIzaSyBVK0Zla5VD05Hgf4QqExAWUuXX64odyes",
  authDomain: "cinematic-d3697.firebaseapp.com",
  projectId: "cinematic-d3697",
  storageBucket: "cinematic-d3697.firebasestorage.app",
  messagingSenderId: "247576999692",
  appId: "1:247576999692:web:309f001a211dc1b150fb29",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const BASE_URL = 'https://cinematix.watch';

// Utility to generate a slug if the manual slug field is missing
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
    console.log('🚀 Generating Dynamic Slug-Based Sitemap...');
    
    try {
        const contentRef = collection(db, 'content');
        const snapshot = await getDocs(contentRef);
        const lastModDate = new Date().toISOString().split('T')[0];
        
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
`;

        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const title = data.title || '';
            // Use manual slug field, fallback to ID or title-generated slug
            const slug = data.slug || generateSlug(title) || id;
            const type = data.type || 'movie';
            const updatedAt = data.updatedAt ? new Date(data.updatedAt).toISOString().split('T')[0] : lastModDate;
            
            if (type === 'movie') {
                // Rule: Movies land on the watch-ready detail page
                xml += `  <url>
    <loc>${BASE_URL}/watch/movie/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
            } else {
                // Rule A: Series Main Landing (Details Page)
                xml += `  <url>
    <loc>${BASE_URL}/series/${slug}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;

                // Rule B Shortcut: Index individual episodes for Google
                if (data.seasons) {
                    data.seasons.forEach(season => {
                        const sNum = season.seasonNumber;
                        if (season.episodes) {
                            season.episodes.forEach((ep, index) => {
                                const eNum = index + 1;
                                // Path: /watch/${series_slug}/${season_num}/${episode_num}
                                xml += `  <url>
    <loc>${BASE_URL}/watch/${slug}/${sNum}/${eNum}</loc>
    <lastmod>${updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
                            });
                        }
                    });
                }
            }
        });

        xml += `</urlset>`;
        
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const publicDir = path.resolve(__dirname, '../public');
        
        if (!fs.existsSync(publicDir)){
            fs.mkdirSync(publicDir);
        }

        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
        console.log(`✅ Success! Generated sitemap.xml to /public folder using SEO Slugs.`);

    } catch (error) {
        console.error('❌ Generator Failed:', error);
        process.exit(1);
    }
}

generateSitemap();