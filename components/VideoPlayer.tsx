
import React, { useState, useEffect } from 'react';

interface VideoPlayerProps {
  tmdbId?: string;
  season?: number;
  episode?: number;
  type: 'movie' | 'series';
  manualSrc?: string; // الرابط اليدوي القادم من لوحة التحكم
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ tmdbId, season, episode, type, manualSrc, poster }) => {
  const [activeSource, setActiveSource] = useState<string>('server1');
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    // 1. الأولوية القصوى: السيرفر اليدوي (إذا اختاره الأدمن)
    if (manualSrc) {
      setCurrentUrl(manualSrc);
      return;
    }

    if (!tmdbId) return;

    // 2. السيرفرات التلقائية (يجب تمريرها عبر صفحة الوسيط لكسر الحماية)
    // نستخدم encodeURIComponent لضمان سلامة الرابط
    const proxyBase = '/embed.html?url=';

    // روابط المصادر الأصلية (Raw URLs)
    // تم تغيير الترتيب لجعل 2Embed هو الأول لتقليل الإعلانات
    const rawSources: Record<string, string> = {
      'server1': type === 'movie'
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
      
      'server2': type === 'movie' 
        ? `https://vidsrc.xyz/embed/movie/${tmdbId}` // .xyz بديل قوي
        : `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`,
        
      'server3': type === 'movie'
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`
    };

    // تغليف الرابط بصفحة الوسيط
    const targetRawUrl = rawSources[activeSource];
    const proxiedUrl = `${proxyBase}${encodeURIComponent(targetRawUrl)}`;

    setCurrentUrl(proxiedUrl);

  }, [tmdbId, season, episode, type, manualSrc, activeSource]);

  if (!currentUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex flex-col items-center justify-center text-gray-500 rounded-xl border border-gray-800">
        <p>جاري تحميل المشغل...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <iframe
          key={currentUrl}
          src={currentUrl}
          title="Video Player"
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          // خصائص هامة للسماح بالتشغيل
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          // تطبيق Sandbox لمنع النوافذ المنبثقة (Popups)
          // تم إزالة allow-popups و allow-popups-to-escape-sandbox
          sandbox="allow-forms allow-header-enrichment allow-presentation allow-same-origin allow-scripts allow-top-navigation"
        />
      </div>

      {/* أزرار التبديل تظهر فقط في الوضع التلقائي */}
      {!manualSrc && (
        <div className="flex flex-wrap gap-2 justify-center bg-gray-900/50 p-3 rounded-lg border border-white/5 animate-fade-in-up">
          <span className="text-xs text-gray-400 self-center ml-2 font-bold">سيرفرات تلقائية (Auto):</span>
          
          <button 
            onClick={() => setActiveSource('server1')}
            className={`px-4 py-1.5 text-xs rounded-full transition-all font-bold ${activeSource === 'server1' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            2Embed (CC)
          </button>
          
          <button 
            onClick={() => setActiveSource('server2')}
            className={`px-4 py-1.5 text-xs rounded-full transition-all font-bold ${activeSource === 'server2' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            VidSrc (XYZ)
          </button>
          
           <button 
            onClick={() => setActiveSource('server3')}
            className={`px-4 py-1.5 text-xs rounded-full transition-all font-bold ${activeSource === 'server3' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            VidSrc (TO)
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
