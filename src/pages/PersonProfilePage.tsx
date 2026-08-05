import React, { useMemo, useState } from 'react';
import type { Content, Person, PersonTask, View } from '@/types';
import SEO from '@/components/shared/SeoMeta';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import TMDBPersonGalleryModal from '@/components/shared/TMDBPersonGalleryModal';

export const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="7" r="5" />
    <path d="M12 13c-5 0-9 2-9 5v6h18v-6c0-3-4-5-9-5z" />
  </svg>
);

const ShareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

interface PersonProfilePageProps {
  name: string;
  allContent: Content[];
  people: Person[];
  onSelectContent: (content: Content) => void;
  onSetView: (view: View) => void;
  onGoBack: (fallbackView: View) => void;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  returnView?: View;
}

const PersonProfilePage: React.FC<PersonProfilePageProps> = ({
  name,
  allContent,
  people,
  onSelectContent,
  onSetView,
  onGoBack,
  returnView
}) => {
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series' | 'tasks'>('all');

  // Gallery Modal
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageOverride, setCurrentImageOverride] = useState<string | null>(null);

  const person = useMemo(() => people.find(p => p.name === name), [people, name]);

  const activeImage = currentImageOverride || person?.image;

  // Platform Catalog Filmography
  const filmography = useMemo(() => {
    return allContent.filter(c =>
      c.cast?.includes(name) ||
      c.director === name ||
      c.writer === name
    ).sort((a, b) => b.releaseYear - a.releaseYear);
  }, [allContent, name]);

  // Filtered Works
  const filteredWorks = useMemo(() => {
    if (activeTab === 'movies') return filmography.filter(c => c.type === 'movie');
    if (activeTab === 'series') return filmography.filter(c => c.type === 'series');
    return filmography;
  }, [filmography, activeTab]);

  const calculateAge = (birthdayStr?: string) => {
    if (!birthdayStr) return null;
    const match = birthdayStr.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      const year = parseInt(match[1], 10);
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      if (age > 0 && age < 120) {
        return `${age} عاماً`;
      }
    }
    return null;
  };

  const ageText = calculateAge(person?.birthday);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: `تصفح أعمال ومعلومات ${name} في المنصة`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2500);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const bioText = person?.biography || '';
  const BIO_LIMIT = 280;
  const needsBioTruncation = bioText.length > BIO_LIMIT;
  const displayedBio = (isBioExpanded || !needsBioTruncation)
    ? bioText
    : bioText.slice(0, BIO_LIMIT) + '...';

  const roleLabel = person?.role === 'director' ? 'مخرج' : person?.role === 'writer' ? 'كاتب' : person?.role === 'crew' ? 'طاقم عمل' : 'ممثل';

  const socialBtnClass = "flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white/10 backdrop-blur-sm cursor-pointer";

  return (
    <div className="relative min-h-screen bg-[var(--bg-body)] text-white animate-fade-in pb-24 font-['Cairo']" dir="rtl">
      <SEO title={name} description={person?.biography || `تصفح أعمال ومعلومات ${name}.`} image={activeImage} />

      {/* Ambient Backdrop Header Blur */}
      <div className="absolute top-0 left-0 w-full h-[85vh] overflow-hidden z-0 pointer-events-none select-none">
        {activeImage ? (
          <img
            src={activeImage}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-[90px] transform scale-125"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#00A7F8]/10 via-transparent to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-body)]/80 to-[var(--bg-body)]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
        
        {/* Navigation & Admin Edit Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={(e) => {
              e.preventDefault();
              onGoBack(returnView || 'home');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-gray-300 hover:text-white transition-all w-fit group cursor-pointer"
          >
            <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm">رجوع</span>
          </button>

          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            الملف الشخصي الرسمي للنجم
          </span>
        </div>

        {/* Hero Section: Avatar & Info */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start mb-14 bg-[#151922]/60 border border-white/5 backdrop-blur-2xl p-6 md:p-10 rounded-3xl shadow-2xl">
          
          {/* Avatar Photo + Gallery Trigger */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="w-56 sm:w-64 md:w-72 aspect-[2/3] rounded-3xl overflow-hidden bg-gray-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative group">
              {activeImage ? (
                <>
                  <img
                    src={activeImage}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 border border-white/20 rounded-3xl pointer-events-none mix-blend-overlay"></div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                  <UserIcon className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* Choose Other Image / Open Gallery Button */}
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="w-full bg-[#00A7F8]/10 hover:bg-[#00A7F8]/20 border border-[#00A7F8]/30 text-[#00A7F8] font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>معرض صور الفنان - اختر صورة من TMDB</span>
            </button>
          </div>

          {/* Details & Biography */}
          <div className="flex-1 text-center md:text-right flex flex-col items-center md:items-start w-full">
            
            <span className="px-3.5 py-1 bg-[#00A7F8]/10 border border-[#00A7F8]/30 rounded-full text-xs font-black text-[#00A7F8] mb-3">
              {roleLabel}
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl mb-4">
              {name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-6">
              {person?.birthday && (
                <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-300">
                  🎂 الميلاد: {person.birthday} {ageText && <span className="text-[#00FFB0]">({ageText})</span>}
                </span>
              )}
              
              {person?.placeOfBirth && (
                <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-300">
                  📍 مكان الميلاد: {person.placeOfBirth}
                </span>
              )}

              <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400">
                🎬 إجمالي الأعمال بالمنصة: {filmography.length}
              </span>
            </div>

            {/* Biography */}
            {bioText ? (
              <div className="w-full bg-gray-900/40 border border-gray-800 p-5 rounded-2xl mb-6 text-right">
                <h3 className="text-xs font-bold text-gray-400 mb-2">عن الفنان والسيرة الذاتية</h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {displayedBio}
                </p>
                {needsBioTruncation && (
                  <button
                    onClick={() => setIsBioExpanded(!isBioExpanded)}
                    className="mt-3 text-[#00A7F8] hover:text-blue-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isBioExpanded ? 'إخفاء التفاصيل' : 'قراءة المزيد من السيرة الذاتية'}</span>
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isBioExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mb-6 italic">لا تتوفر سيرة ذاتية مفصلة لهذا الفنان حالياً.</p>
            )}

            {/* Actions & Social Media */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              <button
                onClick={handleShare}
                className="w-full sm:w-auto px-7 py-3 bg-white hover:bg-gray-200 text-black font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                <ShareIcon className="w-4 h-4" />
                <span>مشاركة الملف الشخصي</span>
              </button>

              {copiedToast && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl animate-fade-in font-medium">
                  تم نسخ رابط الصفحة!
                </span>
              )}

              {/* Social Media Links */}
              {person?.socialLinks && Object.values(person.socialLinks).some(Boolean) && (
                <div className="flex items-center gap-2.5">
                  {person.socialLinks.instagram && (
                    <a href={person.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={`${socialBtnClass} hover:text-[#E1306C] hover:border-[#E1306C]/50`} title="Instagram">
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                  )}
                  {person.socialLinks.twitter && (
                    <a href={person.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={socialBtnClass} title="X / Twitter">
                      <XIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {person.socialLinks.facebook && (
                    <a href={person.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={`${socialBtnClass} hover:text-[#1877F2] hover:border-[#1877F2]/50`} title="Facebook">
                      <span className="font-bold text-sm">f</span>
                    </a>
                  )}
                  {person.socialLinks.youtube && (
                    <a href={person.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className={`${socialBtnClass} hover:text-[#FF0000] hover:border-[#FF0000]/50`} title="YouTube">
                      <span className="font-bold text-base leading-none pb-0.5">▸</span>
                    </a>
                  )}
                  {person.socialLinks.imdb && (
                    <a href={person.socialLinks.imdb} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-3 h-9 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-black hover:bg-[#F5C518] hover:border-[#F5C518] transition-all duration-300 font-black text-[11px] cursor-pointer" title="IMDb">
                      IMDb
                    </a>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Database Saved Tasks / Assigned Projects Section */}
        {person?.tasks && person.tasks.length > 0 && (
          <div className="mb-14 bg-[#151922]/80 border border-[#00FFB0]/20 rounded-3xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 bg-[#00FFB0] rounded-full shadow-[0_0_15px_#00FFB0]"></div>
                <div>
                  <h2 className="text-xl font-black text-white">مهام وأعمال الفنان الموثقة بالجدول</h2>
                  <p className="text-xs text-gray-400">جدول المشاريع والمهام الخاصة المضافة في قاعدة بيانات المنصة</p>
                </div>
              </div>
              <span className="bg-[#00FFB0]/10 text-[#00FFB0] border border-[#00FFB0]/30 text-xs font-bold px-3 py-1 rounded-full">
                {person.tasks.length} مهام مسجلة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {person.tasks.map((task: PersonTask) => (
                <div key={task.id} className="bg-[#0b0e14] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between hover:border-[#00FFB0]/50 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                        task.status === 'in_production'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : task.status === 'upcoming'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {task.status === 'in_production' ? 'جاري التصوير 🎥' : task.status === 'upcoming' ? 'قريباً ⏳' : 'مكتمل ✓'}
                      </span>

                      {task.releaseYear && (
                        <span className="text-[11px] text-gray-400 font-bold">{task.releaseYear}</span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-white text-base mb-1">{task.title}</h4>
                    {task.roleName && (
                      <p className="text-xs text-[#00A7F8] font-bold mb-2">بدور / المهمة: {task.roleName}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 mt-3 pt-2 border-t border-gray-900 block">
                    نوع العمل: {task.type === 'movie' ? 'فيلم سينمائي' : task.type === 'series' ? 'مسلسل درامي' : 'برنامج / مسرحية'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Filmography Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-[#00A7F8] rounded-full shadow-[0_0_15px_#00A7F8]"></div>
              <div>
                <h2 className="text-2xl font-black text-white">أعمال الفنان المتاحة بالمنصة</h2>
                <p className="text-xs text-gray-400">انقر على أي عمل لمشاهدته أو معرفة تفاصيله</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-900/80 p-1 rounded-2xl border border-gray-800">
              {[
                { id: 'all', label: `الكل (${filmography.length})` },
                { id: 'movies', label: `أفلام (${filmography.filter(c => c.type === 'movie').length})` },
                { id: 'series', label: `مسلسلات (${filmography.filter(c => c.type === 'series').length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#00A7F8] text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredWorks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {filteredWorks.map((content) => (
                <div
                  key={content.id}
                  onClick={() => onSelectContent(content)}
                  className="group cursor-pointer bg-[#151922] border border-gray-800/80 hover:border-[#00A7F8] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 flex flex-col"
                >
                  <div className="aspect-[2/3] bg-gray-900 relative overflow-hidden">
                    <img
                      src={content.poster || content.backdrop}
                      alt={content.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                      {content.type === 'movie' ? 'فيلم' : 'مسلسل'}
                    </div>
                    {content.releaseYear && (
                      <div className="absolute bottom-2.5 left-2.5 bg-[#00A7F8] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md">
                        {content.releaseYear}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 text-center flex-1 flex flex-col justify-center bg-gray-900/60">
                    <h3 className="font-extrabold text-white group-hover:text-[#00A7F8] truncate transition-colors text-xs sm:text-sm">
                      {content.title}
                    </h3>
                    {content.castCharacters?.[name] ? (
                      <span className="text-[11px] text-[#00FFB0] font-bold mt-1 truncate block">
                        بدور: {content.castCharacters[name]}
                      </span>
                    ) : content.director === name ? (
                      <span className="text-[11px] text-[#00A7F8] font-bold mt-1 truncate block">
                        مخرج العمل
                      </span>
                    ) : content.writer === name ? (
                      <span className="text-[11px] text-purple-400 font-bold mt-1 truncate block">
                        مؤلف العمل
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#151922]/40 border border-gray-800/60 rounded-3xl p-6">
              <p className="text-sm text-gray-400">لا توجد أعمال مضافة تحت هذه الفئة في المنصة حتى الآن.</p>
            </div>
          )}
        </div>

      </div>

      {/* TMDB Image Gallery Modal */}
      <TMDBPersonGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        personName={name}
        tmdbId={person?.tmdbId}
        currentImage={activeImage}
        onSelectImage={(imageUrl) => {
          setCurrentImageOverride(imageUrl);
        }}
      />
    </div>
  );
};

export default PersonProfilePage;
