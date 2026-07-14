import React, { useState } from 'react';
import type { View, SiteSettings } from '../../types';
import { ChevronRightIcon } from '../icons/ChevronRight';
import SEO from '../shared/SeoMeta';

interface ShortcutsPageProps {
  onSetView?: (view: View) => void;
  onGoBack?: (fallbackView: View) => void;
  returnView?: View;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  siteSettings: SiteSettings;
  onSetSiteSettings: (settings: SiteSettings) => void | Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isNestedInAdmin?: boolean;
}

const ShortcutsPage: React.FC<ShortcutsPageProps> = ({
  onSetView,
  onGoBack,
  returnView,
  isRamadanTheme,
  isEidTheme,
  isCosmicTealTheme,
  isNetflixRedTheme,
  siteSettings,
  onSetSiteSettings,
  addToast,
  isNestedInAdmin = false,
}) => {
  const accentColor = isRamadanTheme ? 'text-amber-500' : isEidTheme ? 'text-purple-500' : isCosmicTealTheme ? 'text-[#35F18B]' : isNetflixRedTheme ? 'text-[#E50914]' : 'text-[#00A7F8]';
  const bgAccent = isRamadanTheme ? 'bg-amber-500 hover:bg-amber-600' : isEidTheme ? 'bg-purple-500 hover:bg-purple-600' : isCosmicTealTheme ? 'bg-[#35F18B] hover:bg-[#2ed67a]' : isNetflixRedTheme ? 'bg-[#E50914] hover:bg-[#b80710]' : 'bg-[#00A7F8] hover:bg-[#008ecd]';
  const bgAccentFocus = isRamadanTheme ? 'focus:ring-amber-500' : isEidTheme ? 'focus:ring-purple-500' : isCosmicTealTheme ? 'focus:ring-[#35F18B]' : isNetflixRedTheme ? 'focus:ring-[#E50914]' : 'focus:ring-[#00A7F8]';

  const currentVersion = siteSettings.appConfig?.version || '1.0.0';
  const [versionInput, setVersionInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionInput.trim()) {
      addToast('يرجى إدخال رقم الإصدار أولاً', 'error');
      return;
    }

    if (!versionInput.toUpperCase().startsWith('V')) {
      addToast('يجب إدخال حرف "V" متبوعًا برقم الإصدار، مثال: V1.5.0', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      // Clean up the input version if wanted, but keeping V or allowing both. 
      // The prompt says: يمكنك إدخال "V" متبوعًا برقم الإصدار.
      // Let's store the version as entered (e.g. V1.5.0 or 1.5.0 depending on how they want, let's keep it as is).
      const finalVersion = versionInput;

      const appConfig = siteSettings.appConfig || { apkUrl: '', appSize: '', version: '1.0.0', screenshots: [], reviews: [] };
      const updatedConfig = { ...appConfig, version: finalVersion };
      const updatedSettings = { ...siteSettings, appConfig: updatedConfig };

      await onSetSiteSettings(updatedSettings);
      addToast(`تم تحديث إصدار التطبيق بنجاح إلى ${finalVersion}!`, 'success');
      setVersionInput('');
    } catch (err) {
      console.error(err);
      addToast('فشل تحديث رقم الإصدار', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const shortcuts = [
    { key: 'Ctrl + N', action: 'إضافة محتوى جديد (فتح نافذة إضافة فيلم أو مسلسل جديد مباشرة من أي مكان)' },
    { key: 'Ctrl + B', action: 'طي / إظهار القائمة الجانبية (Sidebar) للحصول على مساحة أكبر للعمل' },
    { key: 'F2', action: 'حفظ ونشر المحتوى الحالي مباشرة' },
    { key: 'F5', action: 'فتح تبويب الفئات والأنواع والتحكم بها' },
    { key: 'F6', action: 'فتح تبويب الصور والوسائط والميديا' },
    { key: 'F7', action: 'فتح تبويب المواسم والحلقات للمسلسلات، أو السيرفرات للأفلام' },
    { key: 'F10', action: 'المعاينة المباشرة للمحتوى قبل النشر' },
    { key: 'F12', action: 'إضافة حلقة ذكية للموسم الأخير تلقائيًا' },
    { key: 'Ctrl + I', action: 'تحديث صور ووصف حلقات الموسم الأخير وجلبها فوراً من موقع TMDB' },
  ];

  if (isNestedInAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in text-white">
        {/* Input area at the top */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-10 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
            ⚙️ تحديث إصدار التطبيق (Mobile App Version)
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            الإصدار الحالي المثبت للتطبيق: <span className="font-mono text-white bg-white/10 px-2 py-1 rounded ml-1 font-bold">{currentVersion}</span>
          </p>
          <form onSubmit={handleUpdateVersion} className="flex flex-col sm:flex-row gap-4 items-stretch">
            <div className="flex-1">
              <input 
                type="text" 
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                placeholder='مثال: V1.5.0'
                className="w-full bg-[#16181f] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right placeholder-gray-500 font-mono"
              />
              <span className="text-xs text-gray-500 mt-2 block pr-1">
                أدخل حرف <strong className="text-blue-400">"V"</strong> متبوعًا برقم الإصدار لتغييره.
              </span>
            </div>
            <button 
              type="submit" 
              disabled={isUpdating}
              className={`${bgAccent} text-black font-black px-8 py-3 rounded-xl transition-all shadow-lg self-start sm:self-auto`}
            >
              {isUpdating ? 'جاري التحديث...' : 'تحديث رقم الإصدار'}
            </button>
          </form>
        </div>

        {/* Shortcuts List Content */}
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl">
          <div className="mb-8 text-right border-b border-white/10 pb-6">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 justify-start mb-2">
              ⌨️ اختصارات لوحة المفاتيح الذكية
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              تتضمن صفحة الاختصارات اختصارات لوحة المفاتيح التي يمكن استخدامها عند فتح لوحة التحكم لتسهيل وتسريع إدارة وإضافة المحتويات.
            </p>
          </div>

          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <p className="text-gray-200 text-sm md:text-base font-bold">{shortcut.action}</p>
                </div>
                <div className="flex justify-end">
                  <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-white font-mono text-xs md:text-sm font-black rounded-lg shadow-[0_2px_0_rgba(255,255,255,0.15)] select-none">
                    {shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white animate-fade-in relative overflow-x-hidden">
      <SEO title="اختصارات لوحة التحكم - سينماتيكس" description="اختصارات لوحة المفاتيح لإدارة لوحة التحكم وتحديث إصدار التطبيق." />

      {/* Background Container - Beautiful shadow and background image */}
      <div className="fixed inset-0 z-0 h-screen w-full">
        <img 
          src="https://shahid.mbc.net/mediaObject/436ea116-cdae-4007-ace6-3c755df16856?width=1920&type=avif&q=80" 
          className="w-full h-full object-cover opacity-30"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-body)] via-[var(--bg-body)]/80 to-[var(--bg-body)]/45 z-10"></div>
      </div>

      <div className="relative z-20 max-w-4xl mx-auto px-4 pt-24 pb-24">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => onGoBack && onGoBack(returnView || 'home')} 
            className="p-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-all border border-white/10 shadow-lg group"
            title="رجوع"
          >
            <ChevronRightIcon className="w-6 h-6 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h1 className="text-2xl md:text-4xl font-black drop-shadow-2xl">اختصارات لوحة التحكم</h1>
          <div className="w-12"></div>
        </div>

        {/* Input area at the top */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 mb-10 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
            ⚙️ تحديث إصدار التطبيق (Mobile App Version)
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            الإصدار الحالي المثبت للتطبيق: <span className="font-mono text-white bg-white/10 px-2 py-1 rounded ml-1 font-bold">{currentVersion}</span>
          </p>
          <form onSubmit={handleUpdateVersion} className="flex flex-col sm:flex-row gap-4 items-stretch">
            <div className="flex-1">
              <input 
                type="text" 
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value)}
                placeholder='مثال: V1.5.0'
                className="w-full bg-[#16181f] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-right placeholder-gray-500 font-mono"
              />
              <span className="text-xs text-gray-500 mt-2 block pr-1">
                أدخل حرف <strong className="text-blue-400">"V"</strong> متبوعًا برقم الإصدار لتغييره.
              </span>
            </div>
            <button 
              type="submit" 
              disabled={isUpdating}
              className={`${bgAccent} text-black font-black px-8 py-3 rounded-xl transition-all shadow-lg self-start sm:self-auto`}
            >
              {isUpdating ? 'جاري التحديث...' : 'تحديث رقم الإصدار'}
            </button>
          </form>
        </div>

        {/* Shortcuts List Content */}
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl animate-fade-in-up">
          <div className="mb-8 text-right border-b border-white/10 pb-6">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 justify-start mb-2">
              ⌨️ اختصارات لوحة المفاتيح الذكية
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              تتضمن صفحة الاختصارات اختصارات لوحة المفاتيح التي يمكن استخدامها عند فتح لوحة التحكم لتسهيل وتسريع إدارة وإضافة المحتويات.
            </p>
          </div>

          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <p className="text-gray-200 text-sm md:text-base font-bold">{shortcut.action}</p>
                </div>
                <div className="flex justify-end">
                  <kbd className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-white font-mono text-xs md:text-sm font-black rounded-lg shadow-[0_2px_0_rgba(255,255,255,0.15)] select-none">
                    {shortcut.key}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button underneath */}
        <div className="text-center mt-12">
          <button
            onClick={() => onGoBack && onGoBack(returnView || 'home')}
            className={`${bgAccent} text-black font-black px-10 py-4 rounded-full text-lg hover:scale-105 active:scale-95 transition-all shadow-lg`}
          >
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsPage;
