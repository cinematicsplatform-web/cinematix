
import React, { useState, useEffect, useMemo } from 'react';

interface VideoPlayerProps {
  poster: string;
  manualSrc?: string; // الرابط اليدوي القادم من لوحة التحكم
  tmdbId?: string;    // معرف TMDB
  type?: string;      // نوع المحتوى (فيلم/مسلسل)
  season?: number;    // رقم الموسم
  episode?: number;   // رقم الحلقة
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ poster, manualSrc, tmdbId, type, season, episode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<string | undefined>(undefined);

  // تحديث مصدر الفيديو: إما يدوي (مباشر) أو تلقائي (عبر العزل)
  useEffect(() => {
    let finalUrl = manualSrc;
    let shouldUseIsolation = false;

    // الخطوة 1: التحقق من وجود رابط يدوي (الأولوية للرابط اليدوي)
    if (!finalUrl || finalUrl.trim() === '') {
        // الخطوة 2: توليد رابط تلقائي إذا وجد TMDB ID
        if (tmdbId) {
            // توليد روابط VidSrc Pro
            if (type === 'movie' || type === 'video.movie') {
                finalUrl = `https://vidsrc.to/embed/movie/${tmdbId}`;
            } else {
                // افتراضياً مسلسل
                finalUrl = `https://vidsrc.to/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
            }
            // تفعيل العزل للروابط التلقائية فقط لأنها تحتاج Referrer Hiding + AdBlock
            shouldUseIsolation = true;
        }
    }

    if (finalUrl && finalUrl.trim() !== '') {
        setIsLoading(true);
        
        if (shouldUseIsolation) {
            // الخطوة 3: تمرير الرابط عبر صفحة العزل
            const encodedUrl = encodeURIComponent(finalUrl);
            setActiveSource(`/embed.html?url=${encodedUrl}`);
        } else {
            // الروابط اليدوية (مثل ملفات mp4 المباشرة أو روابط خاصة) تعمل مباشرة
            setActiveSource(finalUrl);
        }
    } else {
        setActiveSource(undefined);
        setIsLoading(false);
    }
  }, [manualSrc, tmdbId, type, season, episode]);

  const isDirectVideo = useMemo(() => {
    if (!activeSource) return false;
    // التحقق مما إذا كان الرابط ملف فيديو مباشر لتشغيله عبر مشغل HTML5
    // ملاحظة: روابط العزل (/embed.html) ليست ملفات فيديو مباشرة، لذا ستعمل عبر iframe
    const cleanUrl = activeSource.split('?')[0].toLowerCase();
    const videoExtensions = ['.mp4', '.m3u8', '.ogg', '.webm', '.ts', '.mov']; 
    return videoExtensions.some(ext => cleanUrl.endsWith(ext));
  }, [activeSource]);

  // Loading Overlay Component
  const LoadingOverlay = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black transition-opacity duration-500">
        {/* Background Poster with Blur */}
        <div className="absolute inset-0 z-0">
            <img src={poster} alt="Loading" className="w-full h-full object-cover opacity-30 blur-md scale-110" />
        </div>
        
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
             <div className="dots-container scale-125">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
             </div>
             <p className="text-white font-bold text-lg tracking-wide animate-pulse drop-shadow-lg">جاري تجهيز السيرفر...</p>
        </div>
    </div>
  );

  if (!activeSource) {
    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative group flex items-center justify-center p-4 border border-gray-800">
        {/* Background Poster for Empty State (Blurred) */}
        <div className="absolute inset-0 z-0">
            <img src={poster} alt="Poster" className="w-full h-full object-cover opacity-40 blur-md" />
        </div>
        
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        <div className="relative z-20 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-gray-800 text-center animate-fade-in-up">
            <h3 className="text-xl md:text-2xl font-bold text-white">جاري البحث عن مصادر...</h3>
            <p className="text-gray-300 mt-2 text-sm">إذا تأخر التشغيل، يرجى اختيار سيرفر آخر من القائمة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] relative video-player-wrapper group border border-gray-800">
      
      {isLoading && <LoadingOverlay />}

      {/* LAYER 2: The Player */}
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
                key={activeSource} // Force re-render on source change
                src={activeSource}
                allowFullScreen
                loading="eager" 
                referrerPolicy="no-referrer" 
                sandbox="allow-scripts allow-same-origin allow-presentation allow-pointer-lock allow-forms"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                className="w-full h-full border-none" 
                title="مشغل الفيديو"
                onLoad={() => setIsLoading(false)}
            />
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
