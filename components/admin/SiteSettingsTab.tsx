import React from 'react';
import type { SiteSettings, Content } from '../../types';
import ToggleSwitch from '../ToggleSwitch';
import { DocumentArrowDownIcon, TrophyIcon } from './AdminIcons';

const SiteSettingsTab: React.FC<{
    siteSettings: SiteSettings;
    onSetSiteSettings: (s: SiteSettings) => void;
    allContent: Content[];
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ siteSettings, onSetSiteSettings, allContent, addToast }) => {
    
    const handleChange = (field: keyof SiteSettings, value: any) => { onSetSiteSettings({ ...siteSettings, [field]: value }); };
    const handleNestedChange = (parent: keyof SiteSettings, child: string, value: any) => { onSetSiteSettings({ ...siteSettings, [parent]: { ...(siteSettings[parent] as any), [child]: value } }); };
    
    const generateSpecificSitemap = (type: 'index' | 'movies' | 'series' | 'seasons' | 'episodes') => {
        const baseUrl = 'https://cinematix.watch';
        const date = new Date().toISOString().split('T')[0];
        const escapeXml = (unsafe: string) => {
            return unsafe.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                    default: return c;
                }
            });
        };
        let xmlContent = '';
        let fileName = '';
        if (type === 'index') {
            fileName = 'sitemap-index.xml';
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/movie-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/series-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/season-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n  <sitemap>\n    <loc>${escapeXml(`${baseUrl}/episode-sitemap.xml`)}</loc>\n    <lastmod>${date}</lastmod>\n  </sitemap>\n</sitemapindex>`;
        } else {
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;
            if (type === 'movies') {
                fileName = 'movie-sitemap.xml';
                allContent.filter(c => c.type === 'movie').forEach(item => {
                    const slug = item.slug || item.id;
                    xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/فيلم/${slug}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n    <video:video>\n      <video:thumbnail_loc>${escapeXml(item.poster || '')}</video:thumbnail_loc>\n      <video:title>${escapeXml(item.title)}</video:title>\n      <video:description>${escapeXml(item.description || item.title).substring(0, 1000)}</video:description>\n      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n    </video:video>\n  </url>\n`;
                });
            } else if (type === 'series') {
                fileName = 'series-sitemap.xml';
                allContent.filter(c => c.type === 'series').forEach(item => {
                    xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/مسلسل/${item.slug || item.id}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
                });
            } else if (type === 'seasons') {
                fileName = 'season-sitemap.xml';
                allContent.filter(c => c.type === 'series').forEach(item => {
                    item.seasons?.forEach(season => {
                        xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/مسلسل/${item.slug || item.id}/الموسم/${season.seasonNumber}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
                    });
                });
            } else if (type === 'episodes') {
                fileName = 'episode-sitemap.xml';
                allContent.filter(c => c.type === 'series').forEach(item => {
                    item.seasons?.forEach(season => {
                        season.episodes.forEach((ep, index) => {
                            const epNum = index + 1;
                            xmlContent += `  <url>\n    <loc>${escapeXml(`${baseUrl}/مسلسل/${item.slug || item.id}/الموسم/${season.seasonNumber}/الحلقة/${epNum}`)}</loc>\n    <lastmod>${item.updatedAt ? item.updatedAt.split('T')[0] : date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n    <video:video>\n      <video:thumbnail_loc>${escapeXml(ep.thumbnail || item.poster || '')}</video:thumbnail_loc>\n      <video:title>${escapeXml(`${item.title} - الموسم ${season.seasonNumber} الحلقة ${epNum}`)}</video:title>\n      <video:description>${escapeXml(item.description || item.title).substring(0, 1000)}</video:description>\n      <video:publication_date>${item.releaseYear}-01-01T00:00:00+00:00</video:publication_date>\n    </video:video>\n  </url>\n`;
                        });
                    });
                });
            }
            xmlContent += `</urlset>`;
        }
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = blobUrl; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-bold text-[#00A7F8] mb-6">تحسين محركات البحث (SEO)</h3>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50 mb-4">
                    <h4 className="font-bold text-white mb-2">مولد خرائط الموقع (Split Sitemaps)</h4>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">قم بتنزيل الملفات التالية ورفعها إلى مجلد `public` في مشروعك لضمان الفهرسة الكاملة في جوجل.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <button onClick={() => generateSpecificSitemap('index')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"><DocumentArrowDownIcon /> 1. Sitemap Index</button>
                        <button onClick={() => generateSpecificSitemap('movies')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 2. Movies XML</button>
                        <button onClick={() => generateSpecificSitemap('series')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 3. Series XML</button>
                        <button onClick={() => generateSpecificSitemap('seasons')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 4. Seasons XML</button>
                        <button onClick={() => generateSpecificSitemap('episodes')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-gray-600"><DocumentArrowDownIcon /> 5. Episodes XML</button>
                    </div>
                </div>
            </div>

            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-[#FFD700] mb-2 flex items-center gap-2">
                        <TrophyIcon className="w-6 h-6" /> إعدادات قوائم التوب 10 (الأساسية)
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">تحكم في ظهور أهم 4 قوائم توب 10 في صفحات الموقع.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-[#00A7F8]/20 hover:border-[#00A7F8]/50 transition-colors shadow-inner">
                            <span className="text-sm font-black text-white">توب 10 الصفحة الرئيسية</span>
                            <ToggleSwitch checked={siteSettings.showTop10Home} onChange={(c) => handleChange('showTop10Home', c)} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-[#00A7F8]/20 hover:border-[#00A7F8]/50 transition-colors shadow-inner">
                            <span className="text-sm font-black text-white">توب 10 المسلسلات</span>
                            <ToggleSwitch checked={siteSettings.showTop10Series} onChange={(c) => handleChange('showTop10Series', c)} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-[#00A7F8]/20 hover:border-[#00A7F8]/50 transition-colors shadow-inner">
                            <span className="text-sm font-black text-white">توب 10 الأفلام</span>
                            <ToggleSwitch checked={siteSettings.showTop10Movies} onChange={(c) => handleChange('showTop10Movies', c)} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-amber-500/20 hover:border-amber-500/50 transition-colors shadow-inner">
                            <span className="text-sm font-black text-white">توب 10 رمضان</span>
                            <ToggleSwitch checked={siteSettings.showTop10Ramadan} onChange={(c) => handleChange('showTop10Ramadan', c)} />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
                    <span>🌙</span> إعدادات شهر رمضان (العد التنازلي)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">تاريخ ووقت انتهاء العد التنازلي</label>
                        <input 
                            type="datetime-local" 
                            value={siteSettings.countdownDate ? siteSettings.countdownDate.substring(0, 16) : ''} 
                            onChange={(e) => handleChange('countdownDate', e.target.value)} 
                            className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-300"
                        />
                        <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">حدد الموعد الذي سيختفي عنده العداد تلقائياً (بداية رمضان).</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">تفعيل العداد التنازلي</span>
                                <span className="text-[10px] text-gray-500">إظهار أو إخفاء (إيقاف) العداد في صفحة رمضان.</span>
                            </div>
                            <ToggleSwitch checked={siteSettings.isCountdownVisible} onChange={(c) => handleChange('isCountdownVisible', c)} />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">عرض كاروسيل رمضان في الرئيسية</span>
                                <span className="text-[10px] text-gray-500">تفعيل القسم الخاص بأعمال رمضان في الصفحة الرئيسية.</span>
                            </div>
                            <ToggleSwitch checked={siteSettings.isShowRamadanCarousel} onChange={(c) => handleChange('isShowRamadanCarousel', c)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-[#00A7F8] mb-4">أوضاع الموقع</h3>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <span>وضع الصيانة (يغلق الموقع للزوار)</span>
                    <ToggleSwitch checked={siteSettings.is_maintenance_mode_enabled} onChange={(c) => handleChange('is_maintenance_mode_enabled', c)} />
                </div>
            </div>

            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl space-y-6">
                <h3 className="text-xl font-bold text-[#00A7F8] mb-4">إعدادات الإعلانات</h3>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">تفعيل الإعلانات في الموقع</span>
                        <span className="text-[10px] text-gray-500">تشغيل أو إيقاف ظهور كافة الإعلانات للزوار.</span>
                    </div>
                    <ToggleSwitch checked={siteSettings.adsEnabled} onChange={(c) => handleChange('adsEnabled', c)} />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">بوابة الإعلانات (Ads Gate)</span>
                        <span className="text-[10px] text-gray-500">تفعيل البوابة الإعلانية عند الانتقال لصفحة التفاصيل (شاهد الآن/البوستر).</span>
                    </div>
                    <ToggleSwitch 
                        checked={siteSettings.isAdsGateEnabled ?? false} 
                        onChange={(c) => handleChange('isAdsGateEnabled', c)} 
                    />
                </div>
            </div>

            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-[#00A7F8]">شريط الإعلانات العلوي (ShoutBar)</h3><ToggleSwitch checked={siteSettings.shoutBar.isVisible} onChange={(c) => handleNestedChange('shoutBar', 'isVisible', c)} /></div><input value={siteSettings.shoutBar.text} onChange={(e) => handleNestedChange('shoutBar', 'text', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-[#00A7F8]" placeholder="نص الشريط المتحرك..."/></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">روابط التواصل الاجتماعي</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Object.keys(siteSettings.socialLinks).map((key) => (<div key={key}><label className="block text-xs font-bold text-gray-400 mb-2 capitalize">{key}</label><input value={(siteSettings.socialLinks as any)[key]} onChange={(e) => handleNestedChange('socialLinks', key, e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00A7F8] text-white dir-ltr"/></div>))}</div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">إعدادات الإشعارات (Firebase Cloud Messaging)</h3><div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50"><label className="block text-xs font-bold text-gray-300 mb-3">Service Account JSON (مطلوب لـ FCM HTTP v1)</label><textarea value={siteSettings.serviceAccountJson || ''} onChange={(e) => handleChange('serviceAccountJson', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-xs focus:border-[#00A7F8] focus:outline-none h-48 dir-ltr" placeholder='{ "type": "service_account", "project_id": "...", ... }'/><p className="text-[10px] text-gray-400 mt-3 leading-relaxed">انسخ محتوى ملف JSON الخاص بـ Service Account هنا. هذا مطلوب لإرسال الإشعارات عبر API v1 الجديد.</p></div></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-6">سياسة الخصوصية</h3><textarea value={siteSettings.privacyPolicy} onChange={(e) => handleChange('privacyPolicy', e.target.value)} className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00A7F8]"/></div>
            <div className="bg-[#1f2937] p-8 rounded-2xl border border-gray-700/50 shadow-xl"><h3 className="text-xl font-bold text-[#00A7F8] mb-4">سياسة حقوق الملكية</h3><textarea value={siteSettings.copyrightPolicy || ''} onChange={(e) => handleChange('copyrightPolicy', e.target.value)} className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00A7F8]" placeholder="أدخل نص سياسة حقوق الملكية هنا..."/></div>
        </div>
    );
};

export default SiteSettingsTab;
