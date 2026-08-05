import React, { useState, useEffect, useMemo } from 'react';
import { getPeople, savePerson, deletePerson } from '../../firebase';
import type { Content, Person } from '../../types';
import { normalizeText } from '../../utils/textUtils';
import { fetchTMDB } from '../../utils/tmdbService';
import DeleteConfirmationModal from '../shared/DeleteConfirmationModal';
import TMDBPersonGalleryModal from '../shared/TMDBPersonGalleryModal';

// الأيقونات 
export const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

export const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);

interface PeopleManagerTabProps {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSetView?: (view: any) => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  allContent?: Content[];
}

const TMDB_API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

export const PeopleManagerTab: React.FC<PeopleManagerTabProps> = ({ 
  addToast, 
  onSetView, 
  isSidebarCollapsed = false, 
  onToggleSidebar,
  allContent = []
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditingPage, setIsEditingPage] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; person: Person | null }>({ isOpen: false, person: null });

  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // حساب أعمال الفنان
  const personCatalogWorks = useMemo(() => {
    if (!editingPerson?.name || !allContent) return [];
    const nameToMatch = editingPerson.name.trim();
    const normMatch = normalizeText(nameToMatch);

    return allContent.filter(item => {
      const isCast = item.cast?.some(c => c.trim() === nameToMatch || normalizeText(c) === normMatch);
      const isDir = item.director?.trim() === nameToMatch || (item.director && normalizeText(item.director) === normMatch);
      const isWrit = item.writer?.trim() === nameToMatch || (item.writer && normalizeText(item.writer) === normMatch);
      return isCast || isDir || isWrit;
    }).sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
  }, [allContent, editingPerson?.name]);

  useEffect(() => { fetchPeople(); }, []);

  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      const data = await getPeople();
      setPeople(data);
    } catch (e) {
      addToast('فشل تحميل القائمة', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPeople = useMemo(() => {
    if (!searchTerm.trim()) return people;
    return people.filter(p => p.normalizedName.includes(normalizeText(searchTerm)));
  }, [people, searchTerm]);

  const handleOpenEditPage = (person: Person | null) => {
    if (person) {
      setEditingPerson({
        ...person,
        socialLinks: person.socialLinks || { instagram: '', facebook: '', twitter: '', imdb: '', tiktok: '', youtube: '' },
        tasks: person.tasks || []
      });
    } else {
      setEditingPerson({
        id: '', name: '', normalizedName: '', tmdbId: '', image: '', characterName: '', biography: '', role: 'actor', birthday: '', placeOfBirth: '',
        socialLinks: { instagram: '', facebook: '', twitter: '', imdb: '', tiktok: '', youtube: '' }, tasks: [], updatedAt: new Date().toISOString()
      });
    }
    setTmdbResults([]);
    setTmdbSearchQuery('');
    setIsEditingPage(true);
    
    // تم إزالة السطر الخاص بإخفاء القائمة الجانبية هنا لكي تظل ظاهرة
  };

  const searchTMDB = async () => {
    const query = tmdbSearchQuery.trim() || editingPerson?.name.trim();
    if (!query) { addToast('يرجى كتابة الاسم للبحث في TMDB', 'info'); return; }
    setIsSearchingTMDB(true);
    try {
      const res = await fetchTMDB(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ar-SA`);
      const data = await res.json();
      setTmdbResults(data.results || []);
      if ((data.results || []).length === 0) addToast('لم يتم العثور على نتائج', 'info');
    } catch (e) { addToast('خطأ في الاتصال بـ TMDB', 'error'); } 
    finally { setIsSearchingTMDB(false); }
  };

  const fetchPersonDetails = async (tmdbId: number) => {
    setIsSyncing(true);
    try {
      const res = await fetchTMDB(`https://api.themoviedb.org/3/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=ar-SA`);
      const data = await res.json();
      
      let bio = data.biography;
      if (!bio) {
        const resEn = await fetchTMDB(`https://api.themoviedb.org/3/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`);
        bio = (await resEn.json()).biography;
      }

      let socialLinks = editingPerson?.socialLinks || {};
      try {
        const extRes = await fetchTMDB(`https://api.themoviedb.org/3/person/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
        const extData = await extRes.json();
        socialLinks = {
          instagram: extData.instagram_id ? `https://instagram.com/${extData.instagram_id}` : socialLinks.instagram || '',
          facebook: extData.facebook_id ? `https://facebook.com/${extData.facebook_id}` : socialLinks.facebook || '',
          twitter: extData.twitter_id ? `https://x.com/${extData.twitter_id}` : socialLinks.twitter || '',
          imdb: extData.imdb_id ? `https://www.imdb.com/name/${extData.imdb_id}` : socialLinks.imdb || '',
          tiktok: extData.tiktok_id ? `https://tiktok.com/@${extData.tiktok_id}` : socialLinks.tiktok || '',
          youtube: extData.youtube_id ? `https://youtube.com/${extData.youtube_id}` : socialLinks.youtube || '',
        };
      } catch (extErr) {}

      setEditingPerson(prev => ({
        ...prev!, name: data.name || prev?.name || '', normalizedName: normalizeText(data.name || prev?.name || ''), tmdbId: String(data.id),
        image: (prev?.image && prev.image.trim()) ? prev.image : (data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : prev?.image || ''),
        biography: bio || prev?.biography || '', role: prev?.role || (data.known_for_department === 'Directing' ? 'director' : data.known_for_department === 'Writing' ? 'writer' : 'actor'),
        birthday: data.birthday || prev?.birthday || '', placeOfBirth: data.place_of_birth || prev?.placeOfBirth || '', socialLinks, updatedAt: new Date().toISOString()
      }));
      setTmdbResults([]);
      addToast('تم جلب البيانات وتحديثها بنجاح!', 'success');
    } catch (e) { addToast('فشل جلب تفاصيل الفنان من TMDB', 'error'); } 
    finally { setIsSyncing(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson?.name) { addToast('يرجى كتابة اسم الفنان', 'info'); return; }
    try {
      await savePerson({ ...editingPerson, normalizedName: normalizeText(editingPerson.name) });
      addToast('تم حفظ البيانات بنجاح', 'success');
      setIsEditingPage(false); setEditingPerson(null); fetchPeople();
    } catch (e) { addToast('حدث خطأ أثناء الحفظ', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteModal.person) return;
    try {
      await deletePerson(deleteModal.person.id);
      addToast('تم الحذف بنجاح', 'success');
      setDeleteModal({ isOpen: false, person: null }); fetchPeople();
    } catch (e) { addToast('فشل الحذف', 'error'); }
  };

  // =========================================================================
  // 1. صفحة التعديل والإضافة - (الألوان الأصلية الداكنة)
  // =========================================================================
  if (isEditingPage) {
    return (
      <div className="space-y-6 animate-fade-in text-white pb-28 relative" dir="rtl">
        
        {/* Header Bar */}
        <div className="bg-[#0f141e]/95 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-gray-700/80 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingPage(false)}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white px-3.5 py-2.5 rounded-xl border border-gray-700 font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span>الرجوع للقائمة</span>
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {editingPerson?.id ? `تعديل ملف الفنان: ${editingPerson.name}` : 'إضافة نجم / صانع عمل جديد'}
              </h2>
            </div>
          </div>
        </div>

        {/* 1. قسم البحث والمزامنة TMDB في أعلى الصفحة */}
        <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 p-5 rounded-2xl shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-extrabold text-blue-400">استيراد ومزامنة تلقائية من TMDB</label>
            <p className="text-[11px] text-gray-400">ابحث باسم النجم لجلب كافة بياناته بضغطة زر</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="ابحث باسم الفنان..." 
              value={tmdbSearchQuery}
              onChange={e => setTmdbSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchTMDB()}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs text-white focus:border-[#00A7F8] outline-none"
            />
            <button 
              onClick={searchTMDB} 
              disabled={isSearchingTMDB} 
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 rounded-xl text-xs font-bold border border-gray-700 transition-all cursor-pointer"
            >
              {isSearchingTMDB ? 'جاري البحث...' : 'بحث TMDB'}
            </button>
          </div>

          {tmdbResults.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {tmdbResults.slice(0, 6).map(res => (
                <button 
                  key={res.id} 
                  onClick={() => fetchPersonDetails(res.id)} 
                  className="flex-shrink-0 cursor-pointer bg-gray-900/90 rounded-xl p-2.5 flex items-center gap-3 hover:bg-blue-600/30 border border-gray-700 hover:border-blue-500 transition-colors w-48 text-right"
                >
                  {res.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w200${res.profile_path}`} className="w-10 h-10 rounded-full object-cover border border-gray-600" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400"><UserIcon className="w-5 h-5"/></div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <span className="text-xs font-bold text-white block truncate">{res.name}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{res.known_for_department === 'Acting' ? 'تمثيل' : res.known_for_department}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Editor Body */}
        <div className="bg-[#151922] border border-gray-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* العمود الأيمن: الصورة الدائرية */}
          <div className="lg:col-span-4 space-y-6 flex flex-col items-center">
            
            {/* الدائرة الاحترافية للبروفايل */}
            <div 
              onClick={() => setIsGalleryOpen(true)}
              className="w-48 h-48 rounded-full border-4 border-[#0f1014] bg-gray-900 flex items-center justify-center overflow-hidden relative group shadow-[0_0_30px_rgba(0,167,248,0.15)] cursor-pointer"
            >
              {editingPerson?.image ? (
                <img src={editingPerson.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="" />
              ) : (
                <UserIcon className="w-20 h-20 text-gray-700/50" />
              )}
              
              {/* Overlay تغيير الصورة */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-xs font-bold text-white">تغيير الصورة</span>
              </div>
            </div>

            <div className="w-full mt-4">
              <label className="block text-xs font-bold text-gray-400 mb-1.5 text-center">رابط الصورة المباشر</label>
              <input 
                type="text" 
                placeholder="https://image.tmdb.org/t/p/w500/..." 
                value={editingPerson?.image || ''}
                onChange={e => setEditingPerson(prev => ({...prev!, image: e.target.value}))}
                className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-xs text-white focus:border-[#00A7F8] outline-none"
              />
            </div>
          </div>

          {/* العمود الأيسر: البيانات الأساسية */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">الاسم الكامل / الفني</label>
                <input 
                  type="text" 
                  value={editingPerson?.name || ''}
                  onChange={e => setEditingPerson(prev => ({...prev!, name: e.target.value}))}
                  className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">الدور الأساسي</label>
                <select 
                  value={editingPerson?.role || 'actor'}
                  onChange={e => setEditingPerson(prev => ({...prev!, role: e.target.value as any}))}
                  className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none text-xs"
                >
                  <option value="actor">ممثل (Actor)</option>
                  <option value="director">مخرج (Director)</option>
                  <option value="writer">كاتب / مؤلف (Writer)</option>
                  <option value="crew">طاقم عمل (Crew)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">رقم TMDB ID</label>
                <input 
                  type="text" 
                  value={editingPerson?.tmdbId || ''}
                  onChange={e => setEditingPerson(prev => ({...prev!, tmdbId: e.target.value}))}
                  className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">تاريخ الميلاد</label>
                <input 
                  type="date" 
                  value={editingPerson?.birthday || ''}
                  onChange={e => setEditingPerson(prev => ({...prev!, birthday: e.target.value}))}
                  className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">السيرة الذاتية (Biography)</label>
              <textarea 
                value={editingPerson?.biography || ''}
                onChange={e => setEditingPerson(prev => ({...prev!, biography: e.target.value}))}
                rows={5}
                className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[#00A7F8] outline-none resize-none text-xs leading-relaxed"
              />
            </div>

            {/* السوشيال ميديا */}
            <div className="border-t border-gray-800 pt-5 space-y-4">
              <label className="block text-xs font-bold text-[#00A7F8]">حسابات التواصل الاجتماعي الرسمية</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['instagram', 'twitter', 'facebook', 'imdb'].map(platform => (
                  <div key={platform}>
                    <span className="block text-[11px] uppercase text-gray-400 mb-1.5">{platform}</span>
                    <input 
                      type="url" 
                      value={(editingPerson?.socialLinks as any)?.[platform] || ''}
                      onChange={e => setEditingPerson(prev => ({...prev!, socialLinks: {...prev?.socialLinks, [platform]: e.target.value}}))}
                      className="w-full bg-[#0f1014] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-[#00A7F8]"
                      placeholder={`رابط ${platform}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* الأعمال المربوطة */}
            {personCatalogWorks.length > 0 && (
              <div className="border-t border-gray-800 pt-5 space-y-4">
                <h4 className="text-sm font-extrabold text-[#00FFB0]">أعماله في المنصة ({personCatalogWorks.length})</h4>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {personCatalogWorks.map(work => (
                    <div key={work.id} className="flex-none w-28 bg-[#0b0e14] border border-gray-800 rounded-xl p-2 group">
                      <div className="aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden mb-2">
                        <img src={work.poster || work.backdrop} alt={work.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <h5 className="font-bold text-[10px] text-white truncate text-center">{work.title}</h5>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ================================================== */}
        {/* شريط الإجراءات السفلي الثابت (Sticky Bottom Bar) */}
        {/* ================================================== */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f141e]/95 backdrop-blur-2xl border-t border-gray-700/80 p-4 shadow-2xl flex items-center">
          <div className="flex items-center gap-3 w-full px-4 justify-end">
            <button
              onClick={() => setIsEditingPage(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-xl border border-gray-700 text-xs transition-all cursor-pointer shadow-md"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-gradient-to-r from-[#00A7F8] via-[#00d4bd] to-[#00FFB0] text-black font-black py-3 px-8 rounded-xl shadow-[0_0_20px_rgba(0,167,248,0.3)] hover:shadow-[0_0_30px_rgba(0,167,248,0.5)] text-xs transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              <span>حفظ البيانات بنجاح</span>
            </button>
          </div>
        </div>

        <TMDBPersonGalleryModal
          isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} personName={editingPerson?.name || ''} tmdbId={editingPerson?.tmdbId} currentImage={editingPerson?.image}
          onSelectImage={(imageUrl) => { setEditingPerson(prev => ({ ...prev!, image: imageUrl })); addToast('تم تغيير الصورة', 'success'); }}
        />
      </div>
    );
  }

  // =========================================================================
  // 2. الواجهة الرئيسية (List View) - ألوان أصلية + بطاقات دائرية
  // =========================================================================
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      
      {/* Top Search & Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#1f2937] p-5 rounded-2xl border border-gray-700/50 shadow-lg">
        <div className="relative flex-1 w-full max-w-md">
          <input 
            type="text" 
            placeholder="ابحث باسم النجم أو صانع العمل..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-12 py-3 focus:border-[#00A7F8] outline-none text-white transition-all text-xs"
          />
          <SearchIcon className="absolute right-4 top-3.5 text-gray-500 w-5 h-5" />
        </div>

        <button 
          onClick={() => handleOpenEditPage(null)}
          className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(0,167,248,0.3)] hover:shadow-[0_0_30px_rgba(0,167,248,0.5)] transition-all cursor-pointer text-xs"
        >
          + إضافة نجم جديد
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-gray-500 font-bold">جاري تحميل البيانات...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredPeople.map(person => (
            <div 
              key={person.id} 
              className="bg-[#1f2937] border border-gray-700/50 rounded-2xl p-5 flex flex-col items-center text-center hover:border-[#00A7F8]/50 transition-colors group relative cursor-pointer"
              onClick={() => handleOpenEditPage(person)}
            >
              {/* === الصورة الدائرية في الشبكة أيضاً === */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-900 border-4 border-[#151922] shadow-xl overflow-hidden mb-4 relative group-hover:border-[#00A7F8] transition-colors">
                {person.image ? (
                  <img src={person.image} alt={person.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-50"><UserIcon className="w-12 h-12 text-gray-400" /></div>
                )}
              </div>
              
              <h4 className="font-bold text-white text-sm w-full truncate">{person.name}</h4>
              <span className="text-xs text-[#00FFB0] mt-1 capitalize font-bold">
                {person.role === 'director' ? 'مخرج' : person.role === 'writer' ? 'مؤلف' : 'ممثل'}
              </span>

              {/* أزرار الحذف والتعديل (تظهر عند وضع الماوس) */}
              <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, person }); }}
                  className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors border border-red-500/30"
                  title="حذف"
                >
                  <TrashIcon />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenEditPage(person); }}
                  className="w-8 h-8 rounded-full bg-[#00A7F8]/20 text-[#00A7F8] hover:bg-[#00A7F8] hover:text-white flex items-center justify-center transition-colors border border-[#00A7F8]/30"
                  title="تعديل"
                >
                  <EditIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, person: null })} onConfirm={handleDelete}
        title="تأكيد الحذف" message={`هل أنت متأكد من حذف "${deleteModal.person?.name}" من القاعدة بالكامل؟`}
      />
    </div>
  );
};

export default PeopleManagerTab;