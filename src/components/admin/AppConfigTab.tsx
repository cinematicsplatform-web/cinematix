import React, { useState } from 'react';
import { SiteSettings, AppConfig } from '../../types';
import ToggleSwitch from '../shared/ToggleSwitch';

interface AppConfigTabProps {
  settings: SiteSettings;
  onUpdate: (newSettings: SiteSettings) => void;
}

const initialAppConfig: AppConfig = {
  apkUrl: '',
  appSize: '35 MB',
  version: '1.0.0',
  heroImage: '',
  screenshots: [],
  reviews: [],
  enableDynamicColors: true
};

const AppConfigTab: React.FC<AppConfigTabProps> = ({ settings, onUpdate }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const base = settings.appConfig || initialAppConfig;
    return {
      ...initialAppConfig,
      ...base,
      enableDynamicColors: base.enableDynamicColors ?? true
    };
  });

  const handleToggleDynamicColors = (checked: boolean) => {
    const newConfig = { ...config, enableDynamicColors: checked };
    setConfig(newConfig);
    onUpdate({ ...settings, appConfig: newConfig });
  };

  const isDynamicColorsOn = config.enableDynamicColors ?? true;

  return (
    <div className="space-y-6 animate-fade-in text-right max-w-4xl mx-auto" dir="rtl">
       {/* قسم التحكم في الألوان الديناميكية الخاص بتطبيق الموبايل */}
       <div className="bg-[#1f2937] p-6 sm:p-8 rounded-2xl border border-gray-700/50 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-gray-700/60">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎨</span>
                <h3 className="text-xl font-black text-white">
                  الألوان الديناميكية للتطبيق (Dynamic Colors)
                </h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                التحكم في تفعيل أو إيقاف استخراج الألوان التكيفية من صور غلاف المحتوى لصفحة التفاصيل والنوافذ المنبثقة داخل تطبيق الأندرويد.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20 mt-1">
                <span>📱</span>
                <span>تنبيه هام: هذا الإعداد خاص بتطبيق الجوال (Android App) فقط ولا يؤثر على الموقع الإلكتروني.</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[#0f1014] p-4 rounded-xl border border-gray-700 shrink-0 self-start md:self-auto">
              <div className="flex flex-col items-end">
                <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border ${
                  isDynamicColorsOn
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                }`}>
                  {isDynamicColorsOn ? 'ON - مفعل' : 'OFF - معطل'}
                </span>
              </div>
              <ToggleSwitch 
                checked={isDynamicColorsOn}
                onChange={handleToggleDynamicColors}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className={`p-5 rounded-xl border transition-all ${
              isDynamicColorsOn 
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200 shadow-md' 
                : 'bg-gray-900/30 border-gray-800 text-gray-500 opacity-60'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isDynamicColorsOn ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}></span>
                <span className="text-base text-white">عند التفعيل (On):</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">
                يشتغل تطبيق الجوال بالألوان والتدرجات التكيفية المستخرجة تلقائياً من صور غلاف الأعمال لصفحة التفاصيل والنوافذ المنبثقة.
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${
              !isDynamicColorsOn 
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 shadow-md' 
                : 'bg-gray-900/30 border-gray-800 text-gray-500 opacity-60'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${!isDynamicColorsOn ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`}></span>
                <span className="text-base text-white">عند الإيقاف (Off):</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-300">
                يتم إيقاف الألوان الديناميكية ويشتغل تطبيق الجوال بالثيم واللون الافتراضي الثابت في صفحة التفاصيل والنوافذ المنبثقة.
              </p>
            </div>
          </div>
       </div>
    </div>
  );
};

export default AppConfigTab;