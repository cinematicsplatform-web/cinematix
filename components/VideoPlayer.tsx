
import React, { useState, useEffect, useMemo } from 'react';

interface VideoPlayerProps {
  poster: string;
  src?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ poster, src }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Reset loading state when source changes
  useEffect(() => {
    if (src) {
        setIsLoading(true);
    }
  }, [src]);

  const isDirectVideo = useMemo(() => {
    if (!src) return false;
    const videoExtensions = ['.mp4', '.m3u8', '.ogg', '.webm', '.ts']; 
    return videoExtensions.some(ext => src.toLowerCase().endsWith(ext));
  }, [src]);

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
             {/* Reusing Global CSS Classes for Dots from index.html */}
             <div className="dots-container scale-125">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
             </div>
             <p className="text-white font-bold text-lg tracking-wide animate-pulse drop-shadow-lg">جاري تحميل السيرفر...</p>
        </div>
    </div>
  );

  if (!src) {
    return (
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative group flex items-center justify-center p-4 border border-gray-800">
        {/* Background Poster for Empty State */}
        <div className="absolute inset-0 z-0">
            <img src={poster} alt="Poster" className="w-full h-full object-cover opacity-40 blur-sm" />
        </div>
        
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative z-20 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-gray-800 text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white">الرجاء اختيار سيرفر للمشاهدة</h3>
            <p className="text-gray-300 mt-2 text-sm">اختر أحد السيرفرات من القائمة أعلاه لبدء العرض</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] relative video-player-wrapper group border border-gray-800">
      
      {isLoading && <LoadingOverlay />}

      {/* LAYER 2: The Player (Sits on top/bottom depending on z-index logic, but iframe needs to be there to load) */}
      <div className="absolute inset-0 z-10">
        {isDirectVideo ? (
            <video
                key={src} 
                controls
                autoPlay
                poster={poster}
                className="w-full h-full bg-black"
                onLoadedData={() => setIsLoading(false)}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
            >
                <source src={src} type={src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
                عفواً، متصفحك لا يدعم تشغيل الفيديوهات.
            </video>
        ) : (
            <iframe
                src={src}
                allowFullScreen
                loading="eager" 
                referrerPolicy="no-referrer" 
                sandbox="allow-scripts allow-same-origin allow-presentation allow-pointer-lock"
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
