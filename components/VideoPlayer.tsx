import React, { useState, useEffect, useMemo } from 'react';

interface VideoPlayerProps {
  poster: string;
  manualSrc?: string; 
  tmdbId?: string;    
  type?: string;      
  season?: number;    
  episode?: number;   
  ads?: any[];
  adsEnabled?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ poster, manualSrc, tmdbId, type, season, episode }) => {
  const [isLoading, setIsLoading] = useState(false);
  // إضافة حالة للتحكم في السيرفر المختار (xyz, vip, 2embed)
  const [activeServerType, setActiveServerType] = useState<string>('server1'); 
  const [activeSource, setActiveSource] = useState<string | undefined>(undefined);

  useEffect(() => {
    let finalUrl = manualSrc;
    let shouldUseIsolation = false;

    // Reset active source momentarily to trigger reload if source changes
    setActiveSource(undefined);

    // 1. الأولوية للرابط اليدوي
    if (!finalUrl || finalUrl.trim() === '') {
        // 2. إذا لم يوجد، نستخدم التلقائي
        // Fallback to Automatic System if no manual URL provided
        if (tmdbId) {
            // تحديد الرابط بناءً على السيرفر المختار من الأزرار
            let domain = 'https://vidsrc.xyz/embed'; // الافتراضي (الأكثر استقراراً)

            if (activeServerType === 'server2') domain = 'https://vidsrc.vip/embed';
            if (activeServerType === 'server3') domain = 'https://www.2embed.cc/embed';

            if (activeServerType === 'server3') {
                 // 2Embed له هيكلية مختلفة قليلاً
                 finalUrl = (type === 'movie' || type === 'video.movie')
                    ? `https://www.2embed.cc/embed/${tmdbId}`
                    : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season || 1}&e=${episode || 1}`;
            } else {
                // VidSrc (XYZ & VIP)
                finalUrl = (type === 'movie' || type === 'video.movie')
                    ? `${domain}/movie/${tmdbId}`
                    : `${domain}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
            }

            shouldUseIsolation = true;
        }
    }

    if (finalUrl && finalUrl.trim() !== '') {
        setIsLoading(true);
        
        if (shouldUseIsolation) {
            // تمرير الرابط لصفحة العزل لكسر الحماية
            const encodedUrl = encodeURIComponent(finalUrl);
            // Slight delay to ensure UI updates
            setTimeout(() => setActiveSource(`/embed.html?url=${encodedUrl}`), 50);
        } else {
            // اليدوي يعمل مباشرة
            setTimeout(() => setActiveSource(finalUrl), 50);
        }
    } else {
        setActiveSource(undefined);
        setIsLoading(false);
    }
  }, [manualSrc, tmdbId, type, season, episode, activeServerType]); // أضفنا activeServerType للمراقبة

  const isDirectVideo = useMemo(() => {
    if (!activeSource) return false;
    const cleanUrl = activeSource.split('?')[0].toLowerCase();
    const videoExtensions = ['.mp4', '.m3u8', '.ogg', '.webm', '.ts', '.mov']; 
    return videoExtensions.some(ext => cleanUrl.endsWith(ext));
  }, [activeSource]);

  // --- مكون شاشة التحميل (معدل لاستخدام النقاط الثلاث القافزة) ---
  const LoadingOverlay = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
        <div className="absolute inset-0 z-0">
            <img 
                src={poster || 'https://placehold.co/1920x1080/101010/101010/png'} 
                onError={(e) => { 
                    const target = e.currentTarget;
                    const fallback = 'https://placehold.co/1920x1080/000000/000000/png';
                    if (target.src !== fallback) {
                        target.src = fallback;
                    }
                }}
                alt="Loading" 
                className="w-full h-full object-cover opacity-30 blur-md scale-110" 
            />
        </div>
        
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-6">
             {/* أنيميشن النقاط الثلاث القافزة (Middle Up, Sides Down) */}
             <div className="flex gap-2.5 scale-125">
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full dot-bounce-down shadow-lg"></div>
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full dot-bounce-up shadow-lg"></div>
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full dot-bounce-down shadow-lg"></div>
             </div>
             <p className="text-white font-bold text-lg tracking-wide animate-pulse drop-shadow-lg mt-4">جاري تحميل السيرفر يرجي الانتظار</p>
        </div>
    </div>
  );

  // --- حالة عدم وجود سيرفر ---
  if (!activeSource && !isLoading) {
    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative group flex items-center justify-center p-4 border border-gray-700">
        <div className="absolute inset-0 z-0">
            <img 
                src={poster || 'https://placehold.co/1920x1080/101010/101010/png'} 
                onError={(e) => { 
                    const target = e.currentTarget;
                    const fallback = 'https://placehold.co/1920x1080/000000/000000/png';
                    if (target.src !== fallback) {
                        target.src = fallback;
                    }
                }}
                alt="Poster" 
                className="w-full h-full object-cover opacity-40 blur-md" 
            />
        </div>
        
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        <div className="relative z-20 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-gray-800 text-center animate-fade-in-up">
            <h3 className="text-xl md:text-2xl font-bold text-white">الرجاء اختيار سيرفر للمشاهدة</h3>
            <p className="text-gray-300 mt-2 text-sm">اختر أحد السيرفرات من القائمة أعلاه لبدء العرض</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] relative video-player-wrapper group border border-gray-800">
        
        {isLoading && <LoadingOverlay />}

        {activeSource && (
            <div className="absolute inset-0 z-10">
                {isDirectVideo ? (
                    <video
                        key={activeSource} 
                        controls
                        autoPlay
                        poster={poster}
                        className="w-full h-full bg-black"
                        onLoadedData={() => setIsLoading(false)}
                        onWaiting={() => setIsLoading(true)}
                        onPlaying={() => setIsLoading(false)}
                        playsInline
                    >
                        <source src={activeSource} type={activeSource.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
                        عفواً، متصفحك لا يدعم تشغيل الفيديوهات.
                    </video>
                ) : (
                    <iframe
                        key={activeSource}
                        src={activeSource}
                        allowFullScreen
                        loading="eager" 
                        referrerPolicy="no-referrer" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        className="w-full h-full border-none" 
                        title="Cinematix Player"
                        onLoad={() => setIsLoading(false)}
                    />
                )}
            </div>
        )}
      </div>

      {/* أزرار التبديل (تظهر فقط إذا لم يكن هناك رابط يدوي - النظام التلقائي) */}
      {!manualSrc && tmdbId && (
        <div className="flex flex-wrap gap-2 justify-center bg-gray-900/50 p-3 rounded-lg border border-white/5 animate-fade-in-up">
          <span className="text-xs text-gray-400 self-center ml-2 font-bold">سيرفرات تلقائية:</span>
          
          <button 
            onClick={() => setActiveServerType('server1')}
            className={`px-4 py-1.5 text-xs rounded-full transition-all font-bold ${activeServerType === 'server1' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            VidSrc (XYZ)
          </button>
          
          <button 
            onClick={() => setActiveServerType('server2')}
            className={`px-4 py-1.5 text-xs rounded-full transition-all font-bold ${activeServerType === 'server2' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Cinematix VIP
          </button>
          
           <button 
            onClick={() => setActiveServerType('server3')}
            className={`px-4 py-1.5 text-xs rounded-full transition-all font-bold ${activeServerType === 'server3' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            2Embed (Backup)
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;