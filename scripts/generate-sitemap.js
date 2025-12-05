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
const BASE_URL = 'https://cinematix-kappa.vercel.app';

// Slugify helper
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
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const publicDir = path.resolve(__dirname, '../public');
    
    if (!fs.existsSync(publicDir)){
        fs.mkdirSync(publicDir);
    }

    // List of static pages to include regardless of DB status
    const staticPages = [
        '/',
        '/movies',
        '/series',
        '/kids',
        '/ramadan',
        '/soon',
        '/about',
        '/privacy',
        '/copyright'
    ];

    let xml = '';

    try {
        // Fetch Data
        const contentRef = collection(db, 'content');
        const snapshot = await getDocs(contentRef);
        console.log(`Fetched ${snapshot.size} items from Firestore.`);

        // --- BUILD XML ---
        // CRITICAL: Ensure NO whitespace/newlines before the declaration
        xml += '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">';

        // 1. Static Pages
        staticPages.forEach(page => {
            const url = `${BASE_URL}${page === '/' ? '' : page}`;
            xml += `<url><loc>${url}</loc><changefreq>daily</changefreq><priority>${page === '/' ? '1.0' : '0.8'}</priority></url>`;
        });

        // 2. Dynamic Content
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const title = data.title || '';
            const slug = data.slug || generateSlug(title) || id;
            const type = data.type || 'movie';
            const updatedAt = data.updatedAt ? new Date(data.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            
            // Content Detail Page
            const prefix = type === 'series' ? 'مسلسل' : 'فيلم';
            const urlPath = encodeURI(`${prefix}/${slug}`);
            
            xml += `<url><loc>${BASE_URL}/${urlPath}</loc><lastmod>${updatedAt}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;

            // Series Deep Linking
            if (type === 'series' && data.seasons) {
                data.seasons.forEach(season => {
                    const sNum = season.seasonNumber;
                    const seasonPath = encodeURI(`مسلسل/${slug}/الموسم/${sNum}`);
                    
                    xml += `<url><loc>${BASE_URL}/${seasonPath}</loc><lastmod>${updatedAt}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;

                    if (season.episodes) {
                        season.episodes.forEach((ep, index) => {
                            const eNum = index + 1;
                            const episodePath = encodeURI(`مسلسل/${slug}/الموسم/${sNum}/الحلقة/${eNum}`);
                            
                            xml += `<url><loc>${BASE_URL}/${episodePath}</loc><lastmod>${updatedAt}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
                        });
                    }
                });
            }
        });

        xml += '</urlset>';
        
        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
        console.log(`✅ Sitemap generated successfully with ${snapshot.size} dynamic items.`);

    } catch (error) {
        console.error('❌ Error generating sitemap:', error);
        
        // --- FAIL-SAFE FALLBACK ---
        // If DB fails, generate a valid XML with just static pages to prevent "Served as HTML" errors.
        console.log('⚠️ Generating FAIL-SAFE sitemap (Static pages only)...');
        
        let fallbackXml = '<?xml version="1.0" encoding="UTF-8"?>';
        fallbackXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        staticPages.forEach(page => {
            const url = `${BASE_URL}${page === '/' ? '' : page}`;
            fallbackXml += `<url><loc>${url}</loc><changefreq>daily</changefreq><priority>${page === '/' ? '1.0' : '0.8'}</priority></url>`;
        });
        fallbackXml += '</urlset>';

        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), fallbackXml);
        // Do NOT exit process(1) so build succeeds with fallback
    }
}

generateSitemap();