import React, { useEffect, useState } from 'react';
import type { Notification, View } from '@/types';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/firebase';
import { BellIcon } from './icons/BellIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PlayIcon } from './icons/PlayIcon';

interface NotificationsPageProps {
  userId: string;
  onSetView: (view: View, category?: string, params?: any) => void;
  onUpdateUnreadCount: (count: number) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ userId, onSetView, onUpdateUnreadCount }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const data = await getUserNotifications(userId);
    setNotifications(data);
    onUpdateUnreadCount(data.filter(n => !n.isRead).length);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      onUpdateUnreadCount(notifications.filter(n => n.id !== notif.id ? !n.isRead : false).length);
    }
    
    if (notif.targetUrl) {
      if (notif.targetUrl.startsWith('/')) {
         window.location.href = notif.targetUrl;
      } else {
        window.open(notif.targetUrl, '_blank');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    onUpdateUnreadCount(0);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);

    if (diffInHours < 1) {
      if (diffInSecs < 60) return "الآن";
      if (diffInMins === 1) return "منذ دقيقة"; 
      if (diffInMins === 2) return "منذ دقيقتين";
      if (diffInMins <= 10) return `منذ ${diffInMins} دقائق`;
      return `منذ ${diffInMins} دقيقة`;
    }

    if (diffInHours < 24) {
      if (diffInHours === 1) return "منذ ساعة";
      if (diffInHours === 2) return "منذ ساعتين";
      if (diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
      return `منذ ${diffInHours} ساعة`;
    }

    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInDays = Math.round((nowMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 1) return "أمس";

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white animate-fade-in pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-20">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => onSetView('home')} 
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90 border border-white/10"
             >
                <ChevronRightIcon className="w-5 h-5 transform rotate-180 text-white" />
             </button>
             <div>
                <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
                    الإشعارات
                    <BellIcon className="w-6 h-6 text-[var(--color-accent)]" />
                </h1>
                <p className="text-xs text-gray-500 font-bold mt-0.5">تابع أحدث أخبار وتحديثات سينماتيكس</p>
             </div>
          </div>

          {notifications.length > 0 && (
            <button 
                onClick={handleMarkAllAsRead}
                className="text-xs font-black text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-2 rounded-full hover:bg-[var(--color-accent)] hover:text-black transition-all border border-[var(--color-accent)]/20"
            >
                قراءة الكل
            </button>
          )}
        </div>

        {isLoading ? (
           <div className="space-y-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-32 bg-gray-800/20 rounded-[1.25rem] skeleton-shimmer border border-white/5"></div>
             ))}
           </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-40 text-center animate-fade-in-up">
            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                <BellIcon className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black">هدوء تام..</h2>
            <p className="text-sm mt-2 max-w-[250px]">لا توجد إشعارات جديدة حالياً. سنخبرك فور توفر أي محتوى يهمك!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`
                  relative flex flex-row items-stretch rounded-[1.25rem] border transition-all cursor-pointer group active:scale-[0.99] overflow-hidden min-h-[140px] md:min-h-[160px]
                  ${notif.isRead 
                    ? 'bg-white/[0.02] border-white/5 opacity-70' 
                    : `bg-[#1a2230]/60 border-white/15 shadow-2xl backdrop-blur-sm`}
                `}
              >
                {/* 1. TEXT CONTENT (RIGHT SIDE IN RTL) */}
                <div className="flex-1 flex flex-col p-4 md:p-6 text-right order-1 min-w-0">
                    {/* Timestamp */}
                    <div className="flex justify-start mb-1">
                        <span className="text-gray-500 font-bold text-[9px] md:text-xs">{formatTime(notif.createdAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-white group-hover:text-[var(--color-accent)] transition-colors text-lg md:text-xl leading-tight mb-2 truncate">{notif.title}</h3>
                    
                    {/* Description */}
                    <p className="text-[11px] md:text-sm text-gray-400 leading-relaxed font-medium line-clamp-2 mb-3">{notif.body}</p>
                    
                    {/* CTA Link */}
                    {notif.targetUrl && (
                        <div className="mt-auto flex items-center gap-1.5 text-[var(--color-accent)] font-black text-[11px] md:text-sm group-hover:gap-3 transition-all">
                            <span>اكتشف الآن</span>
                            <ChevronRightIcon className="w-3.5 h-3.5 transform rotate-180" />
                        </div>
                    )}
                </div>

                {/* 2. IMAGE CONTENT (LEFT SIDE IN RTL) */}
                <div className="w-28 sm:w-36 md:w-48 flex-shrink-0 order-2 relative bg-black">
                    <img 
                        src={notif.imageUrl || 'https://placehold.co/400x600/101010/white?text=Cinematix'} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-110" 
                        loading="lazy"
                    />
                    {/* Layer removed to prevent fading effect */}
                </div>

                {/* Unread Dot */}
                {!notif.isRead && (
                   <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_12px_rgba(0,167,248,1)] z-30 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">يتم حفظ الإشعارات لمدة 7 أيام فقط</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;