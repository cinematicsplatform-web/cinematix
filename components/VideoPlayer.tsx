
import React, { useMemo } from 'react';

interface VideoPlayerProps {
  poster: string;
  src?: string; // الرابط اللي بيجي من السيرفر المختار
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ poster, src }) => {

  // 1. تحديد نوع المشغل المطلوب (فيديو مباشر أو iframe)
  const isDirectVideo = useMemo(() => {
    if (!src) return false;
    // قائمة الامتدادات اللي بتخلينا نستخدم مشغل HTML5 العادي
    const videoExtensions = ['.mp4', '.m3u8', '.ogg', '.webm', '.ts']; 
    // نفترض أنه فيديو مباشر إذا كان ينتهي بأي من هذه الامتدادات
    return videoExtensions.some(ext => src.toLowerCase().endsWith(ext));
  }, [src]);


  if (!src) {
    return (
      <div className="aspect-video w-full bg-[var(--bg-body)] rounded-xl overflow-hidden relative group flex items-center justify-center p-4">
        <img src={poster} alt="Video poster" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="bg-black/60 backdrop-blur-sm p-6 rounded-2xl">
                <h3 className="text-xl md:text-2xl font-bold text-white">الرجاء اختيار سيرفر للمشاهدة</h3>
                <p className="text-gray-300 mt-2">المشغل ينتظر رابط السيرفر.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full bg-[var(--bg-body)] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,167,248,0.3)] relative">
      
      {/* 2. منطق اختيار المشغل بناءً على نوع الرابط */}
      {isDirectVideo ? (
        // --- مشغل الفيديو المباشر (وسم video) ---
        <video
          key={src} 
          controls
          autoPlay
          poster={poster}
          className="w-full h-full"
        >
          <source src={src} type={src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'} />
          عفواً، متصفحك لا يدعم تشغيل الفيديوهات.
        </video>
      ) : (
        // --- مشغل الإطار الخارجي (وسم iframe) ---
        <iframe
          key={src} 
          src={src}
          allowFullScreen
          // إضافة referrerpolicy لتجنب مشاكل CORS الشائعة في الـ iframes
          referrerPolicy="no-referrer" 
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          className="w-full h-full border-none"
          title="مشغل الفيديو الخارجي"
        />
      )}
    </div>
  );
};

export default VideoPlayer;
