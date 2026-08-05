import React, { useState, useEffect } from 'react';
import { fetchTMDB } from '../../utils/tmdbService';
import { CloseIcon } from '../icons/CloseIcon';
import { SearchIcon } from '../icons/SearchIcon';

const TMDB_API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

interface TMDBPersonGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  tmdbId?: string;
  currentImage?: string;
  onSelectImage: (imageUrl: string) => void;
}

interface ImageItem {
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  type: 'profile' | 'tagged';
}

export const TMDBPersonGalleryModal: React.FC<TMDBPersonGalleryModalProps> = ({
  isOpen,
  onClose,
  personName,
  tmdbId,
  currentImage,
  onSelectImage,
}) => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'profiles' | 'tagged'>('all');
  const [searchQuery, setSearchQuery] = useState(personName || '');
  const [customUrl, setCustomUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(personName || '');
      loadGallery(tmdbId, personName);
    }
  }, [isOpen, tmdbId, personName]);

  const loadGallery = async (id?: string, name?: string) => {
    setLoading(true);
    setErrorMsg('');
    setImages([]);

    try {
      let resolvedTmdbId = id;

      // If TMDB ID is not provided or empty, search by name first
      if (!resolvedTmdbId && name) {
        const searchRes = await fetchTMDB(
          `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            name
          )}&language=ar-SA`
        );
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          resolvedTmdbId = String(searchData.results[0].id);
        }
      }

      if (!resolvedTmdbId) {
        setErrorMsg('لم يتم العثور على رمز TMDB لهذا الفنان. يمكنك البحث باسم آخر أعلاه.');
        setLoading(false);
        return;
      }

      const imgList: ImageItem[] = [];

      // Fetch person profiles
      try {
        const resProfiles = await fetchTMDB(
          `https://api.themoviedb.org/3/person/${resolvedTmdbId}/images?api_key=${TMDB_API_KEY}`
        );
        const dataProfiles = await resProfiles.json();
        if (dataProfiles.profiles && dataProfiles.profiles.length > 0) {
          dataProfiles.profiles.forEach((p: any) => {
            imgList.push({
              url: `https://image.tmdb.org/t/p/w500${p.file_path}`,
              width: p.width,
              height: p.height,
              aspectRatio: p.aspect_ratio,
              type: 'profile',
            });
          });
        }
      } catch (errProfiles) {
        console.warn('Profiles fetch error:', errProfiles);
      }

      // Fetch tagged images (scenes/stills)
      try {
        const resTagged = await fetchTMDB(
          `https://api.themoviedb.org/3/person/${resolvedTmdbId}/tagged_images?api_key=${TMDB_API_KEY}`
        );
        const dataTagged = await resTagged.json();
        if (dataTagged.results && dataTagged.results.length > 0) {
          dataTagged.results.forEach((t: any) => {
            if (t.file_path) {
              imgList.push({
                url: `https://image.tmdb.org/t/p/w780${t.file_path}`,
                width: t.width,
                height: t.height,
                aspectRatio: t.aspect_ratio,
                type: 'tagged',
              });
            }
          });
        }
      } catch (errTagged) {
        console.warn('Tagged images fetch error:', errTagged);
      }

      setImages(imgList);
      if (imgList.length === 0) {
        setErrorMsg('لم يتم العثور على صور في معرض TMDB لهذا الفنان.');
      }
    } catch (err) {
      console.error('TMDB Gallery Error:', err);
      setErrorMsg('حدث خطأ أثناء تحميل معرض الصور من TMDB.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    loadGallery(undefined, searchQuery.trim());
  };

  const filteredImages = images.filter((img) => {
    if (activeTab === 'profiles') return img.type === 'profile';
    if (activeTab === 'tagged') return img.type === 'tagged';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-[#151922] border border-gray-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-[#151922]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A7F8]/10 border border-[#00A7F8]/30 flex items-center justify-center text-[#00A7F8]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">معرض صور الفنان - TMDB</h3>
              <p className="text-xs text-gray-400">اختر صورة عالية الجودة للفنان مباشرة دون الحاجة للبحث في جوجل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Custom URL Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-800/80 bg-gray-900/60 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ابحث باسم الفنان في TMDB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0d14] border border-gray-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white focus:border-[#00A7F8] outline-none transition-all"
              />
              <SearchIcon className="absolute right-3.5 top-3 text-gray-500 w-4 h-4" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#00A7F8] hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري البحث...' : 'بحث في TMDB'}
            </button>
          </form>

          {/* Custom URL Input */}
          <div className="flex gap-2 items-center pt-1">
            <span className="text-xs text-gray-400 whitespace-nowrap font-medium">أو أضف رابط صورة مباشر:</span>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 bg-[#0a0d14] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-[#00A7F8] outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (customUrl.trim()) {
                  onSelectImage(customUrl.trim());
                  onClose();
                }
              }}
              disabled={!customUrl.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40"
            >
              استخدام الرابط
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-gray-800/60 bg-[#121620]">
          <div className="flex gap-2">
            {[
              { id: 'all', label: `كل الصور (${images.length})` },
              { id: 'profiles', label: `صور شخصية (${images.filter((i) => i.type === 'profile').length})` },
              { id: 'tagged', label: `الكواليس والمشاهد (${images.filter((i) => i.type === 'tagged').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#00A7F8] text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-gray-400 hidden sm:inline">انقر على أي صورة لاختيارها فوراً</span>
        </div>

        {/* Gallery Content */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar min-h-[250px]">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-[#00A7F8] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-gray-300">جاري الاتصال بـ TMDB وجلب الصور المتاحة...</p>
            </div>
          ) : errorMsg ? (
            <div className="py-16 text-center text-gray-400 bg-gray-900/40 rounded-2xl border border-gray-800 p-8 space-y-3">
              <p className="text-sm">{errorMsg}</p>
              <p className="text-xs text-gray-500">يمكنك كتابة اسم الفنان بالأعلى والضغط على "بحث في TMDB" لإعادة المحاولة.</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="py-16 text-center text-gray-500">لا توجد صور ضمن هذه الفئة</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredImages.map((img, idx) => {
                const isSelected = currentImage === img.url;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectImage(img.url);
                      onClose();
                    }}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 bg-gray-900 hover:-translate-y-1 hover:shadow-xl ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-[1.02]'
                        : 'border-gray-800 hover:border-[#00A7F8]'
                    } ${img.type === 'tagged' ? 'aspect-video' : 'aspect-[2/3]'}`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                      <span className="bg-[#00A7F8] text-black text-[10px] font-black px-2 py-1 rounded-md text-center shadow-md">
                        {isSelected ? 'الصورة الحالية ✓' : 'اختيار هذه الصورة'}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            تم الجلب من TMDB Official Media Server
          </span>
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-6 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default TMDBPersonGalleryModal;
