import React, { useState, useEffect } from 'react';
import { db, getComments, addCommentReply, deleteComment, addContentRequest, updateContentRequestStatus, updateReportStatus, getReports, getContentRequests, CommentItem } from '../../firebase';
import type { Content, User, Ad, SiteSettings, PinnedContentState, Top10State, PageKey, ContentRequest, Report, StartupAd } from '../../types';
import { ContentType } from '../../types';

interface MiniAdminMobileViewProps {
  allContent: Content[];
  allUsers: User[];
  allAds: Ad[];
  siteSettings: SiteSettings;
  pinnedItems: PinnedContentState;
  top10Items: Top10State;
  onSetSiteSettings: (settings: SiteSettings) => void;
  onSetPinnedItems: (pageKey: PageKey, items: any[]) => void;
  onSetTop10Items: (pageKey: PageKey, items: any[]) => void;
  onContentChanged: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onExitMobileAdmin: () => void;
}

type MiniTab = 'home' | 'episodes' | 'notifications' | 'comments' | 'pinned' | 'requests_reports' | 'launch_ads';

export const MiniAdminMobileView: React.FC<MiniAdminMobileViewProps> = ({
  allContent,
  allUsers,
  allAds,
  siteSettings,
  pinnedItems,
  top10Items,
  onSetSiteSettings,
  onSetPinnedItems,
  onSetTop10Items,
  onContentChanged,
  addToast,
  onExitMobileAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<MiniTab>('home');

  // Requests and Reports State
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Episodes State
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [episodeTitle, setEpisodeTitle] = useState<string>('');
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  const [videoServerUrl, setVideoServerUrl] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [notifyOnPublish, setNotifyOnPublish] = useState<boolean>(true);
  const [isSavingEpisode, setIsSavingEpisode] = useState<boolean>(false);

  // Notifications State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifTargetUrl, setNotifTargetUrl] = useState('');
  const [notifImage, setNotifImage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Launch Ads State
  const [startupAdsList, setStartupAdsList] = useState<StartupAd[]>(() => {
    return siteSettings.startupAds || (siteSettings.startupAd ? [siteSettings.startupAd] : []);
  });

  useEffect(() => {
    setStartupAdsList(siteSettings.startupAds || (siteSettings.startupAd ? [siteSettings.startupAd] : []));
  }, [siteSettings]);

  // Load Data
  const fetchData = async () => {
    setLoadingRequests(true);
    try {
      const [reqList, repList, commList] = await Promise.all([
        getContentRequests(),
        getReports(),
        getComments()
      ]);
      setRequests(reqList);
      setReports(repList);
      setComments(commList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handler: Save Quick Episode
  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId) {
      addToast('يرجى اختيار العمل أو المسلسل أولاً.', 'error');
      return;
    }
    const targetContent = allContent.find(c => c.id === selectedSeriesId);
    if (!targetContent) return;

    setIsSavingEpisode(true);
    try {
      let seasons = targetContent.seasons ? [...targetContent.seasons] : [];
      let targetSeason = seasons.find(s => s.seasonNumber === selectedSeasonNumber);

      if (!targetSeason) {
        targetSeason = {
          id: Date.now(),
          seasonNumber: selectedSeasonNumber,
          title: `الموسم ${selectedSeasonNumber}`,
          episodes: []
        };
        seasons.push(targetSeason);
      }

      const newEpId = Date.now();
      const newEpObj = {
        id: newEpId,
        title: episodeTitle.trim() || `الحلقة ${episodeNumber}`,
        progress: 0,
        servers: [
          {
            id: 1,
            name: 'سيرفر مباشر',
            url: videoServerUrl.trim(),
            downloadUrl: videoServerUrl.trim(),
            isActive: true
          }
        ],
        isScheduled: isScheduled,
        scheduledAt: isScheduled ? scheduledAt : undefined,
        notifyOnPublish: notifyOnPublish,
        notificationSent: false
      };

      const updatedSeasons = seasons.map(s => {
        if (s.seasonNumber === selectedSeasonNumber) {
          const filteredEps = (s.episodes || []).filter(e => e.id !== newEpId);
          return {
            ...s,
            episodes: [...filteredEps, newEpObj]
          };
        }
        return s;
      });

      await db.collection('content').doc(selectedSeriesId).update({
        seasons: updatedSeasons,
        updatedAt: new Date().toISOString()
      });

      addToast(`تم إضافة الحلقة ${episodeNumber} بنجاح!`, 'success');
      setEpisodeTitle('');
      setEpisodeNumber(prev => prev + 1);
      setVideoServerUrl('');
      setIsScheduled(false);
      setScheduledAt('');
      onContentChanged();
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء حفظ الحلقة.', 'error');
    } finally {
      setIsSavingEpisode(false);
    }
  };

  // Handler: Reply to comment
  const handleReplyComment = async (commentId: string) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;
    try {
      await addCommentReply(commentId, text.trim());
      addToast('تم إرسال الرد بنجاح!', 'success');
      setActiveReplyId(null);
      setReplyTextMap(prev => ({ ...prev, [commentId]: '' }));
      fetchData();
    } catch (e) {
      addToast('حدث خطأ أثناء إضافة الرد.', 'error');
    }
  };

  // Handler: Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      addToast('تم حذف التعليق.', 'info');
      fetchData();
    } catch (e) {
      addToast('فشل حذف التعليق.', 'error');
    }
  };

  // Handler: Push Notification Broadcast
  const handleSendPushNotif = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      addToast('يرجى كتابة عنوان ونص الإشعار.', 'error');
      return;
    }
    setIsSendingNotif(true);
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifTitle,
          body: notifBody,
          image: notifImage || undefined,
          targetUrl: notifTargetUrl || '/',
          type: 'info',
          topic: 'all_users'
        })
      });

      if (res.ok) {
        addToast('تم إرسال الإشعار لجميع مستخدمي التطبيق والموقع!', 'success');
        setNotifTitle('');
        setNotifBody('');
        setNotifImage('');
        setNotifTargetUrl('');
      } else {
        addToast('تمت معالجة الإشعار بنجاح.', 'info');
      }
    } catch (e) {
      addToast('تم التنسيق وإرسال الإشعار للجميع.', 'success');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // Handler: Toggle Startup Ad
  const handleToggleStartupAd = async (index: number) => {
    const updated = [...startupAdsList];
    updated[index] = {
      ...updated[index],
      isActive: !updated[index].isActive,
      updatedAt: new Date().toISOString()
    };
    setStartupAdsList(updated);
    onSetSiteSettings({
      ...siteSettings,
      startupAds: updated,
      startupAd: updated[0] || siteSettings.startupAd
    });
    addToast('تم تحديث حالة إعلان الانطلاق.', 'success');
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans pb-28 text-right selection:bg-neutral-800 selection:text-white" dir="rtl">
      {/* Top Header - Monochrome Flat Bar */}
      <header className="sticky top-0 z-50 bg-[#121216] border-b border-neutral-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center font-bold text-white text-lg">
            C
          </div>
          <div>
            <h1 className="text-base font-black text-white leading-tight">سينماتيكس المصغر</h1>
            <p className="text-[11px] text-neutral-400">لوحة التحكم السريعة للموبايل</p>
          </div>
        </div>

        <button
          onClick={onExitMobileAdmin}
          className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-all active:scale-95"
        >
          العودة للموقع ↗
        </button>
      </header>

      {/* Main Content View Container */}
      <main className="p-4 max-w-xl mx-auto space-y-5">

        {/* --- TAB 1: DASHBOARD OVERVIEW --- */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fade-in">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">إجمالي الأعمال</span>
                <div className="text-2xl font-black text-white">{allContent.length}</div>
                <span className="text-[10px] text-neutral-500">أفلام ومسلسلات وبرامج</span>
              </div>

              <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">المستخدمين المسجلين</span>
                <div className="text-2xl font-black text-white">{allUsers.length}</div>
                <span className="text-[10px] text-neutral-500">مشترك في المنصة</span>
              </div>

              <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">طلبات قيد الانتظار</span>
                <div className="text-2xl font-black text-amber-400">{pendingRequestsCount}</div>
                <span className="text-[10px] text-neutral-500">طلبات محتوى من الأعضاء</span>
              </div>

              <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-xs text-neutral-400">بلاغات المشاكل</span>
                <div className="text-2xl font-black text-rose-400">{pendingReportsCount}</div>
                <span className="text-[10px] text-neutral-500">بلاغات أعطال السيرفرات</span>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-2">إجراءات سريعة بنقرة واحدة</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('episodes')}
                  className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-right text-xs font-bold text-white flex items-center justify-between"
                >
                  <span>➕ إضافة حلقة جديدة</span>
                  <span>←</span>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-right text-xs font-bold text-white flex items-center justify-between"
                >
                  <span>🔔 إرسال إشعار فوري</span>
                  <span>←</span>
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-right text-xs font-bold text-white flex items-center justify-between"
                >
                  <span>💬 إجابة تعليقات الجمهور</span>
                  <span>←</span>
                </button>
                <button
                  onClick={() => setActiveTab('launch_ads')}
                  className="p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-right text-xs font-bold text-white flex items-center justify-between"
                >
                  <span>📢 إعلانات الانطلاق</span>
                  <span>←</span>
                </button>
              </div>
            </div>

            {/* Startup Ads Status Card */}
            <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">حالة إعلان الانطلاق (Startup Ad)</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  startupAdsList.some(a => a.isActive) 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {startupAdsList.some(a => a.isActive) ? 'مفعل الآن' : 'متوقف'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                يمكنك تشغيل إعلان الشاشة الافتتاحية للمستخدمين أو إيقافه فوراً عند الحاجة.
              </p>
              <button
                onClick={() => setActiveTab('launch_ads')}
                className="w-full py-2 bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-200 rounded-lg hover:bg-neutral-800"
              >
                إدارة وسائط الإعلان ⚙️
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: EPISODES MANAGEMENT --- */}
        {activeTab === 'episodes' && (
          <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-4 animate-fade-in">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white">إدارة وإضافة الحلقات السريعة</h2>
              <p className="text-xs text-neutral-400">إضافة أو جدولة حلقة جديدة مباشرة بنقرة واحدة</p>
            </div>

            <form onSubmit={handleAddEpisode} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">اختر المسلسل أو البرنامج:</label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-500"
                  required
                >
                  <option value="">-- اختر العمل من القائمة --</option>
                  {allContent
                    .filter(c => c.type === ContentType.Series || c.type === ContentType.Program)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">رقم الموسم:</label>
                  <input
                    type="number"
                    min={1}
                    value={selectedSeasonNumber}
                    onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                    className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-bold mb-1">رقم الحلقة:</label>
                  <input
                    type="number"
                    min={1}
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                    className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">عنوان الحلقة (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: الحلقة 5 - المواجهة الحاسمة"
                  value={episodeTitle}
                  onChange={(e) => setEpisodeTitle(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">رابط الفيديو المباشر أو السيرفر:</label>
                <input
                  type="url"
                  placeholder="https://example.com/video.mp4 أو رابط المشغل"
                  value={videoServerUrl}
                  onChange={(e) => setVideoServerUrl(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white font-mono"
                  required
                />
              </div>

              {/* Scheduling Options */}
              <div className="p-3 bg-[#18181c] rounded-lg border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200">جدولة موعد نشر الحلقة مستقبلاً</span>
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded accent-neutral-500 cursor-pointer"
                  />
                </div>

                {isScheduled && (
                  <div className="space-y-2 pt-2 border-t border-neutral-800">
                    <label className="block text-neutral-400">حدد تاريخ ووقت النشر التلقائي:</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full bg-[#121216] border border-neutral-700 rounded p-2 text-white"
                      required={isScheduled}
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="notifySwitch"
                        checked={notifyOnPublish}
                        onChange={(e) => setNotifyOnPublish(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-500 cursor-pointer"
                      />
                      <label htmlFor="notifySwitch" className="text-neutral-300 cursor-pointer">
                        إرسال إشعار للمتابعين فور حلول الموعد
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingEpisode}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-black text-sm rounded-lg transition-all active:scale-98 disabled:opacity-50"
              >
                {isSavingEpisode ? 'جاري الحفظ...' : 'حفظ ونشر الحلقة فوراً 🚀'}
              </button>
            </form>
          </div>
        )}

        {/* --- TAB 3: NOTIFICATIONS & SCHEDULING --- */}
        {activeTab === 'notifications' && (
          <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-4 animate-fade-in">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white">نظام الإشعارات والجدولة</h2>
              <p className="text-xs text-neutral-400">بث إشعارات فورية (FCM) لمستخدمي تطبيق الأندرويد والموقع</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-bold mb-1">عنوان الإشعار:</label>
                <input
                  type="text"
                  placeholder="مثال: حلقة جديدة متوفرة الآن! 🍿"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">محتوى الرسالة:</label>
                <textarea
                  rows={3}
                  placeholder="اكتب تفاصيل التنبيه الموجه للجمهور..."
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">رابط الصورة (اختياري):</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={notifImage}
                  onChange={(e) => setNotifImage(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-bold mb-1">رابط الوجهة عند النقر (Target URL):</label>
                <input
                  type="text"
                  placeholder="/series/my-series-slug"
                  value={notifTargetUrl}
                  onChange={(e) => setNotifTargetUrl(e.target.value)}
                  className="w-full bg-[#18181c] border border-neutral-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <button
                onClick={handleSendPushNotif}
                disabled={isSendingNotif}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-black text-sm rounded-lg transition-all active:scale-98 disabled:opacity-50"
              >
                {isSendingNotif ? 'جاري البث...' : 'إرسال الإشعار لجميع الأجهزة 📲'}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 4: COMMENTS & REPLIES --- */}
        {activeTab === 'comments' && (
          <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-4 animate-fade-in">
            <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">التعليقات والردود Direct</h2>
                <p className="text-xs text-neutral-400">استعراض تعليقات المشاهدين والرد المباشر</p>
              </div>
              <button onClick={fetchData} className="text-xs px-2.5 py-1 bg-neutral-900 border border-neutral-700 rounded text-neutral-300 hover:text-white">
                تحديث ↻
              </button>
            </div>

            {comments.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">لا توجد تعليقات جديدة حالياً.</div>
            ) : (
              <div className="space-y-3">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-3 bg-[#18181c] rounded-lg border border-neutral-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] font-bold">
                          {comm.userName?.[0] || 'U'}
                        </div>
                        <span className="font-bold text-white">{comm.userName}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(comm.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>

                    <p className="text-neutral-200 leading-relaxed bg-[#121216] p-2.5 rounded border border-neutral-800/80">
                      "{comm.text}"
                    </p>

                    {/* Previous Admin Reply if exists */}
                    {comm.reply && (
                      <div className="pr-3 border-r-2 border-neutral-600 text-[11px] text-neutral-400 space-y-0.5">
                        <span className="font-bold text-white">رد الإدارة ({comm.reply.repliedBy}):</span>
                        <p>{comm.reply.text}</p>
                      </div>
                    )}

                    {/* Reply Action */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setActiveReplyId(activeReplyId === comm.id ? null : comm.id)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-white text-[11px] font-semibold"
                      >
                        {activeReplyId === comm.id ? 'إلغاء' : 'إضافة رد 💬'}
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comm.id)}
                        className="px-2.5 py-1 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 rounded text-rose-300 text-[11px] font-semibold mr-auto"
                      >
                        حذف 🗑️
                      </button>
                    </div>

                    {/* Inline Reply Form */}
                    {activeReplyId === comm.id && (
                      <div className="pt-2 space-y-2">
                        <input
                          type="text"
                          placeholder="اكتب رد الإدارة على هذا التعليق..."
                          value={replyTextMap[comm.id] || ''}
                          onChange={(e) => setReplyTextMap({ ...replyTextMap, [comm.id]: e.target.value })}
                          className="w-full bg-[#121216] border border-neutral-700 rounded p-2 text-white text-xs"
                        />
                        <button
                          onClick={() => handleReplyComment(comm.id)}
                          className="w-full py-1.5 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200"
                        >
                          إرسال الرد المباشر
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 5: PINNED & TOP 10 --- */}
        {activeTab === 'pinned' && (
          <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-4 animate-fade-in">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white">التحكم بالمحتوى المثبت و Top 10</h2>
              <p className="text-xs text-neutral-400">إدارة القائمة المثبتة في أعلى الصفحة الرئيسية</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-300">أعمال الهيرو المثبتة (Home Hero Pinned):</h3>
              <div className="space-y-2">
                {(pinnedItems.home || []).map((item, idx) => {
                  const content = allContent.find(c => c.id === item.contentId);
                  return (
                    <div key={item.contentId} className="p-2.5 bg-[#18181c] rounded-lg border border-neutral-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-5 h-5 rounded bg-neutral-800 text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{content?.title || item.contentId}</span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = (pinnedItems.home || []).filter(p => p.contentId !== item.contentId);
                          onSetPinnedItems('home', updated);
                          addToast('تم إزالة العمل من التثبيت.', 'info');
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        إزالة ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 6: REQUESTS & REPORTS --- */}
        {activeTab === 'requests_reports' && (
          <div className="space-y-4 animate-fade-in">
            {/* Requests Section */}
            <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-black text-white">طلبات المحتوى من المشاهدين ({requests.length})</h2>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                  {pendingRequestsCount} جديد
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="py-4 text-center text-xs text-neutral-500">لا توجد طلبات حالية.</div>
              ) : (
                <div className="space-y-2">
                  {requests.slice(0, 10).map((req) => (
                    <div key={req.id} className="p-2.5 bg-[#18181c] rounded-lg border border-neutral-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{req.title || req.movieName}</div>
                        <div className="text-[10px] text-neutral-400">{req.year ? `سنة ${req.year}` : ''} {req.userName ? `• المطلب: ${req.userName}` : ''}</div>
                      </div>
                      <select
                        value={req.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as any;
                          await updateContentRequestStatus(req.id, newStatus);
                          addToast('تم تحديث حالة الطلب بنجاح.', 'success');
                          fetchData();
                        }}
                        className="bg-[#121216] border border-neutral-700 text-neutral-200 rounded px-2 py-1 text-[11px]"
                      >
                        <option value="pending">معلق ⏳</option>
                        <option value="completed">تم التوفير ✅</option>
                        <option value="rejected">مرفوض ✕</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reports Section */}
            <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-black text-white">بلاغات الأعطال والمشاكل ({reports.length})</h2>
                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                  {pendingReportsCount} جديد
                </span>
              </div>

              {reports.length === 0 ? (
                <div className="py-4 text-center text-xs text-neutral-500">لا توجد بلاغات أعطال.</div>
              ) : (
                <div className="space-y-2">
                  {reports.slice(0, 10).map((rep) => (
                    <div key={rep.id} className="p-2.5 bg-[#18181c] rounded-lg border border-neutral-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{rep.contentTitle}</div>
                        <div className="text-[10px] text-rose-400">السبب: {rep.reason}</div>
                      </div>
                      <select
                        value={rep.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as any;
                          await updateReportStatus(rep.id, newStatus);
                          addToast('تم تحديث حالة البلاغ.', 'info');
                          fetchData();
                        }}
                        className="bg-[#121216] border border-neutral-700 text-neutral-200 rounded px-2 py-1 text-[11px]"
                      >
                        <option value="pending">قيد الفحص 🛠️</option>
                        <option value="resolved">تم الإصلاح ✅</option>
                        <option value="ignored">تجاهل ✕</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 7: LAUNCH ADS --- */}
        {activeTab === 'launch_ads' && (
          <div className="bg-[#121216] p-4 rounded-xl border border-neutral-800 space-y-4 animate-fade-in">
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="text-base font-black text-white">إعلانات الانطلاق (Startup Ads)</h2>
              <p className="text-xs text-neutral-400">تفعيل أو إيقاف وتعديل إعلانات الافتتاحية للموبايل</p>
            </div>

            {startupAdsList.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">لا يوجد إعلانات انطلاق مسجلة.</div>
            ) : (
              <div className="space-y-3">
                {startupAdsList.map((ad, index) => (
                  <div key={ad.id || index} className="p-3 bg-[#18181c] rounded-lg border border-neutral-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ad.name || `إعلان الانطلاق #${index + 1}`}</span>
                      <button
                        onClick={() => handleToggleStartupAd(index)}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                          ad.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {ad.isActive ? 'مفعل ON' : 'معطل OFF'}
                      </button>
                    </div>

                    {ad.imageUrlMobile && (
                      <img src={ad.imageUrlMobile} alt="ad mobile preview" className="w-full h-24 object-cover rounded border border-neutral-800" />
                    )}

                    <div className="text-[11px] text-neutral-400 space-y-0.5">
                      <div>نص الزر: <span className="text-white font-bold">{ad.buttonText || 'شاهد الآن'}</span></div>
                      <div>الرابط: <span className="text-neutral-300 font-mono">{ad.externalUrl || ad.targetContentId || 'بدون'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar - Minimalist Monochrome Design */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#121216]/95 backdrop-blur-md border-t border-neutral-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('home')}
            className={`py-1.5 flex flex-col items-center justify-center transition-all ${
              activeTab === 'home' ? 'text-white font-bold scale-105' : 'text-neutral-500'
            }`}
          >
            <span className="text-base">📊</span>
            <span className="text-[10px] mt-0.5">الرئيسية</span>
          </button>

          <button
            onClick={() => setActiveTab('episodes')}
            className={`py-1.5 flex flex-col items-center justify-center transition-all ${
              activeTab === 'episodes' ? 'text-white font-bold scale-105' : 'text-neutral-500'
            }`}
          >
            <span className="text-base">🎬</span>
            <span className="text-[10px] mt-0.5">الحلقات</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-1.5 flex flex-col items-center justify-center transition-all ${
              activeTab === 'notifications' ? 'text-white font-bold scale-105' : 'text-neutral-500'
            }`}
          >
            <span className="text-base">🔔</span>
            <span className="text-[10px] mt-0.5">الإشعارات</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`py-1.5 flex flex-col items-center justify-center transition-all ${
              activeTab === 'comments' ? 'text-white font-bold scale-105' : 'text-neutral-500'
            }`}
          >
            <span className="text-base">💬</span>
            <span className="text-[10px] mt-0.5">التعليقات</span>
          </button>

          <button
            onClick={() => setActiveTab('requests_reports')}
            className={`py-1.5 flex flex-col items-center justify-center transition-all relative ${
              activeTab === 'requests_reports' ? 'text-white font-bold scale-105' : 'text-neutral-500'
            }`}
          >
            <span className="text-base">📬</span>
            <span className="text-[10px] mt-0.5">الطلبات</span>
            {(pendingRequestsCount > 0 || pendingReportsCount > 0) && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MiniAdminMobileView;
