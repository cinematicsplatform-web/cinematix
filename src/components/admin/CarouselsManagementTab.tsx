import React, { useState, useEffect, useMemo } from 'react';
import type { Content, HomeSection, SectionDisplayType, SectionContentType, SectionPageLocation, SectionSourceType } from '@/types';
import { categories, genres, ContentType } from '@/types';
import { getHomeSections, saveHomeSection, deleteHomeSection } from '@/firebase';
import { PlusIcon } from '../icons/PlusIcon';
import { SearchIcon } from '../icons/SearchIcon';
import { CloseIcon } from '../icons/CloseIcon';
import DeleteConfirmationModal from '../shared/DeleteConfirmationModal';

interface CarouselsManagementTabProps {
  allContent: Content[];
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onSectionsChanged?: () => void;
}

const PAGE_LABELS: Record<SectionPageLocation, string> = {
  home: 'الصفحة الرئيسية',
  movies: 'الأفلام',
  series: 'المسلسلات',
  kids: 'الأطفال',
  ramadan: 'رمضان',
  soon: 'قريباً',
};

const DISPLAY_TYPE_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  vertical_poster: {
    label: 'البوستر العمودي (تقليدي)',
    desc: 'العرض القياسي لبوسترات الأفلام والمسلسلات',
    icon: '📱',
  },
  horizontal_card: {
    label: 'بطاقات أفقية (16:9)',
    desc: 'عرض صور الخلفية بالعرض مع معلومات مبسطة',
    icon: '🖼️',
  },
  hybrid: {
    label: 'الهجين (توسع عند التحويم)',
    desc: 'بطاقات تتوسع وتكشف عن فيديو العرض والترقية عند اللمس',
    icon: '✨',
  },
  top10_ranking: {
    label: 'قائمة التوب 10 بالأرقام',
    desc: 'أرقام ترتيب مميزة مع بطاقات مائلة',
    icon: '🏆',
  },
  hero_showcase: {
    label: 'العرض العريض (Showcase)',
    desc: 'عرض بانورامي كبير للأعمال المختارة',
    icon: '🎬',
  },
};

export const CarouselsManagementTab: React.FC<CarouselsManagementTabProps> = ({
  allContent,
  addToast,
  onSectionsChanged,
}) => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePageFilter, setActivePageFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<Partial<HomeSection> | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  // Manual selection state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const data = await getHomeSections();
      setSections(data);
    } catch (e) {
      addToast('حدث خطأ أثناء جلب الكاروسيلات.', 'error');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const filteredSections = useMemo(() => {
    if (activePageFilter === 'all') return sections;
    return sections.filter((s) => s.pageLocation === activePageFilter);
  }, [sections, activePageFilter]);

  const openNewModal = () => {
    setEditingSection({
      title: '',
      pageLocation: (activePageFilter !== 'all' ? activePageFilter : 'home') as SectionPageLocation,
      positionIndex: sections.length + 1,
      displayType: 'hybrid',
      contentType: 'automatic',
      sourceType: 'latest',
      itemLimit: 12,
      selectedContentIds: [],
      filterGenre: [],
      filterCategory: [],
      filterType: '',
      isVisible: true,
      isNew: false,
    });
    setSelectedIds([]);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const openEditModal = (sec: HomeSection) => {
    setEditingSection({ ...sec });
    setSelectedIds(sec.selectedContentIds || []);
    setSearchQuery('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingSection?.title || editingSection.title.trim() === '') {
      addToast('يرجى كتابة عنوان الكاروسيل.', 'error');
      return;
    }

    const payload: Partial<HomeSection> = {
      ...editingSection,
      selectedContentIds: selectedIds,
    };

    try {
      await saveHomeSection(payload);
      addToast('تم حفظ الكاروسيل بنجاح!', 'success');
      setIsModalOpen(false);
      setEditingSection(null);
      fetchSections();
      if (onSectionsChanged) onSectionsChanged();
    } catch (e) {
      addToast('فشل حفظ الكاروسيل.', 'error');
    }
  };

  const requestDelete = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      await deleteHomeSection(deleteModal.id);
      addToast('تم حذف الكاروسيل بنجاح.', 'success');
      setDeleteModal({ isOpen: false, id: '', title: '' });
      fetchSections();
      if (onSectionsChanged) onSectionsChanged();
    } catch (e) {
      addToast('فشل حذف الكاروسيل.', 'error');
    }
  };

  const handleToggleVisible = async (sec: HomeSection) => {
    try {
      await saveHomeSection({ id: sec.id, isVisible: !sec.isVisible });
      addToast(`تم ${!sec.isVisible ? 'تفعيل' : 'إخفاء'} الكاروسيل.`, 'info');
      fetchSections();
      if (onSectionsChanged) onSectionsChanged();
    } catch (e) {
      addToast('حدث خطأ أثناء تعديل الحالة.', 'error');
    }
  };

  // Content search results for manual selection
  const manualSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return allContent.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return allContent.filter(
      (c) => c.title.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q)
    );
  }, [allContent, searchQuery]);

  const toggleSelectContentId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const moveSelectedId = (index: number, direction: 'up' | 'down') => {
    const nextIds = [...selectedIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextIds.length) return;
    const temp = nextIds[index];
    nextIds[index] = nextIds[targetIdx];
    nextIds[targetIdx] = temp;
    setSelectedIds(nextIds);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121620] p-6 rounded-2xl border border-gray-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <span>🎭 إدارة الكاروسيلات والأقسام</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            إضافة وتخصيص الكاروسيلات وأشكال العرض التفاعلية لكل صفحات الموقع بكل مرونة
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-6 py-3 bg-[#00A7F8] hover:bg-[#0091d9] text-white font-extrabold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          <span>إضافة كاروسيل جديد</span>
        </button>
      </div>

      {/* Page Location Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActivePageFilter('all')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activePageFilter === 'all'
              ? 'bg-[#00A7F8] text-white shadow-md'
              : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
          }`}
        >
          الكل ({sections.length})
        </button>
        {Object.entries(PAGE_LABELS).map(([key, label]) => {
          const count = sections.filter((s) => s.pageLocation === key).length;
          return (
            <button
              key={key}
              onClick={() => setActivePageFilter(key)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activePageFilter === key
                  ? 'bg-[#00A7F8] text-white shadow-md'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Section List */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-400 font-bold">جاري تحميل الكاروسيلات...</div>
      ) : filteredSections.length === 0 ? (
        <div className="bg-[#121620] p-12 rounded-2xl border border-gray-800 text-center space-y-4">
          <p className="text-gray-400 text-lg font-bold">
            لا يوجد كاروسيلات مخصصة مضافة لهذه الصفحة حتى الآن.
          </p>
          <p className="text-gray-500 text-xs">
            الجميع يعتمد حالياً على الكاروسيلات الأساسية للموقع. يمكنك إضافة كاروسيل مخصص جديد وتحديده في أي موضع!
          </p>
          <button
            onClick={openNewModal}
            className="px-6 py-2.5 bg-[#00A7F8] text-white font-bold rounded-xl hover:bg-[#0091d9] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>إضافة الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((sec) => {
            const displayInfo = DISPLAY_TYPE_LABELS[sec.displayType] || DISPLAY_TYPE_LABELS.hybrid || DISPLAY_TYPE_LABELS.vertical_poster;
            return (
              <div
                key={sec.id}
                className={`bg-[#121620] border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-gray-600 ${
                  sec.isVisible ? 'border-gray-800' : 'border-red-900/40 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-gray-800 text-[#00A7F8] border border-gray-700">
                        {PAGE_LABELS[sec.pageLocation]} • ترتيب {sec.positionIndex}
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-2 leading-tight">
                        {sec.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleVisible(sec)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                        sec.isVisible
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {sec.isVisible ? 'نشط' : 'معطل'}
                    </button>
                  </div>

                  <div className="bg-[#0b0e14] p-3 rounded-xl border border-gray-800/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <span>{displayInfo.icon}</span>
                      <span>{displayInfo.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">{displayInfo.desc}</p>
                  </div>

                  <div className="text-xs text-gray-400 space-y-1">
                    <div>
                      <strong>نوع المحتوى:</strong>{' '}
                      {sec.contentType === 'manual'
                        ? `تحديد يدوي (${sec.selectedContentIds?.length || 0} عمل)`
                        : `تلقائي (${sec.sourceType === 'latest' ? 'الأحدث' : sec.sourceType === 'most_viewed' ? 'الأكثر مشاهدة' : 'حسب التصنيف'})`}
                    </div>
                    {sec.contentType === 'automatic' && (
                      <div className="text-[11px] text-gray-500">
                        {sec.filterCategory?.length ? `الفئة: ${sec.filterCategory.join(', ')} | ` : ''}
                        {sec.filterGenre?.length ? `النوع: ${sec.filterGenre.join(', ')} | ` : ''}
                        الحد: {sec.itemLimit || 12}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(sec)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => requestDelete(sec.id, sec.title)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && editingSection && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121620] border border-gray-800 rounded-3xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#0b0e14]">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span>{editingSection.id ? 'تعديل الكاروسيل' : 'إضافة كاروسيل جديد'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 text-right" dir="rtl">
              {/* Title & Page Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-300 mb-2">
                    عنوان الكاروسيل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingSection.title || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                    placeholder="مثال: كوميديا على طول الخط / أحدث المسلسلات العربية"
                    className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00A7F8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-300 mb-2">
                    الصفحة المستهدفة
                  </label>
                  <select
                    value={editingSection.pageLocation || 'home'}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        pageLocation: e.target.value as SectionPageLocation,
                      })
                    }
                    className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00A7F8] focus:outline-none"
                  >
                    {Object.entries(PAGE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order & Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-300 mb-2">
                    ترتيب الظهور في الصفحة
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingSection.positionIndex ?? 1}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        positionIndex: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-[#0b0e14] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00A7F8] focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    (1 = أول كاروسيل في الصفحة، 2 = الثاني، وهكذا)
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.isNew || false}
                      onChange={(e) => setEditingSection({ ...editingSection, isNew: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-300">شارة "جديد"</span>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.isVisible !== false}
                      onChange={(e) => setEditingSection({ ...editingSection, isVisible: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-300">تفعيل الكاروسيل</span>
                </div>
              </div>

              {/* Display Type Picker */}
              <div>
                <label className="block text-xs font-extrabold text-gray-300 mb-2">
                  شكل الكاروسيل والتصميم
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(DISPLAY_TYPE_LABELS).map(([typeKey, info]) => {
                    const isSelected = editingSection.displayType === typeKey;
                    return (
                      <div
                        key={typeKey}
                        onClick={() =>
                          setEditingSection({
                            ...editingSection,
                            displayType: typeKey as SectionDisplayType,
                          })
                        }
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#00A7F8]/10 border-[#00A7F8] text-white shadow-lg'
                            : 'bg-[#0b0e14] border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-extrabold text-sm text-white">
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">{info.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content Strategy (Automatic vs Manual) */}
              <div>
                <label className="block text-xs font-extrabold text-gray-300 mb-2">
                  طريقة اختيار المحتوى
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setEditingSection({ ...editingSection, contentType: 'automatic' })}
                    className={`p-3 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                      editingSection.contentType === 'automatic'
                        ? 'bg-[#00A7F8] text-white border-[#00A7F8]'
                        : 'bg-[#0b0e14] text-gray-400 border-gray-800'
                    }`}
                  >
                    ⚡ تلقائي (تصفية حسب التصنيف والنوع)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSection({ ...editingSection, contentType: 'manual' })}
                    className={`p-3 rounded-xl font-bold text-xs cursor-pointer border transition-all ${
                      editingSection.contentType === 'manual'
                        ? 'bg-[#00A7F8] text-white border-[#00A7F8]'
                        : 'bg-[#0b0e14] text-gray-400 border-gray-800'
                    }`}
                  >
                    🎯 يدوي (اختيار أعمال محددة بنفسك)
                  </button>
                </div>

                {/* Automatic Config */}
                {editingSection.contentType === 'automatic' && (
                  <div className="bg-[#0b0e14] p-4 rounded-2xl border border-gray-800 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          نوع العمل
                        </label>
                        <select
                          value={editingSection.filterType || ''}
                          onChange={(e) =>
                            setEditingSection({ ...editingSection, filterType: e.target.value })
                          }
                          className="w-full bg-[#121620] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="">الكل (أفلام ومسلسلات)</option>
                          <option value={ContentType.Movie}>أفلام فقط</option>
                          <option value={ContentType.Series}>مسلسلات فقط</option>
                          <option value={ContentType.Program}>برامج تلفزيونية</option>
                          <option value={ContentType.Play}>مسرحيات</option>
                          <option value={ContentType.Concert}>حفلات</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          نوع الترتيب
                        </label>
                        <select
                          value={editingSection.sourceType || 'latest'}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              sourceType: e.target.value as SectionSourceType,
                            })
                          }
                          className="w-full bg-[#121620] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="latest">الأحدث إضافة</option>
                          <option value="most_viewed">الأكثر مشاهدة</option>
                          <option value="top_rated">الأعلى تقييماً</option>
                          <option value="by_category">حسب الفئة</option>
                          <option value="by_genre">حسب النوع</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-1">
                          العدد الأقصى للأعمال
                        </label>
                        <input
                          type="number"
                          value={editingSection.itemLimit || 12}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              itemLimit: parseInt(e.target.value, 10) || 12,
                            })
                          }
                          className="w-full bg-[#121620] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        تصفية حسب الفئة
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-2 bg-[#121620] rounded-xl border border-gray-800">
                        {categories.map((cat) => {
                          const isSel = editingSection.filterCategory?.includes(cat);
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                const prevCats = editingSection.filterCategory || [];
                                const nextCats = isSel
                                  ? prevCats.filter((c) => c !== cat)
                                  : [...prevCats, cat];
                                setEditingSection({ ...editingSection, filterCategory: nextCats });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-[#00A7F8] text-white'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Genre Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        تصفية حسب النوع
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-2 bg-[#121620] rounded-xl border border-gray-800">
                        {genres.map((gn) => {
                          const isSel = editingSection.filterGenre?.includes(gn);
                          return (
                            <button
                              key={gn}
                              type="button"
                              onClick={() => {
                                const prevGns = editingSection.filterGenre || [];
                                const nextGns = isSel
                                  ? prevGns.filter((g) => g !== gn)
                                  : [...prevGns, gn];
                                setEditingSection({ ...editingSection, filterGenre: nextGns });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-[#00A7F8] text-white'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              {gn}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual Config Picker */}
                {editingSection.contentType === 'manual' && (
                  <div className="bg-[#0b0e14] p-4 rounded-2xl border border-gray-800 space-y-4">
                    {/* Selected List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-white">
                          الأعمال المختارة ({selectedIds.length})
                        </span>
                        {selectedIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="text-[11px] text-red-400 hover:underline cursor-pointer"
                          >
                            مسح الكل
                          </button>
                        )}
                      </div>

                      {selectedIds.length === 0 ? (
                        <p className="text-xs text-gray-500 py-3 text-center border border-dashed border-gray-800 rounded-xl">
                          لم تقم باختيار أي أعمال بعد. ابحث بالأسفل وانقر لإضافتها!
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {selectedIds.map((id, index) => {
                            const item = allContent.find((c) => c.id === id);
                            if (!item) return null;
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between bg-[#121620] p-2 rounded-xl border border-gray-800 text-xs text-white"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center font-bold text-[10px]">
                                    {index + 1}
                                  </span>
                                  <img
                                    src={item.poster}
                                    alt={item.title}
                                    className="w-7 h-10 object-cover rounded"
                                  />
                                  <span className="font-bold">{item.title}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveSelectedId(index, 'up')}
                                    disabled={index === 0}
                                    className="w-6 h-6 rounded bg-gray-800 disabled:opacity-30 text-gray-300 cursor-pointer"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSelectedId(index, 'down')}
                                    disabled={index === selectedIds.length - 1}
                                    className="w-6 h-6 rounded bg-gray-800 disabled:opacity-30 text-gray-300 cursor-pointer"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectContentId(id)}
                                    className="w-6 h-6 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Search & Pick */}
                    <div className="pt-2 border-t border-gray-800">
                      <div className="relative mb-3">
                        <SearchIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ابحث عن فيلم أو مسلسل لإضافته..."
                          className="w-full bg-[#121620] border border-gray-700 rounded-xl pr-9 pl-3 py-2 text-white text-xs focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto custom-scrollbar p-1">
                        {manualSearchResults.map((item) => {
                          const isSel = selectedIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleSelectContentId(item.id)}
                              className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-[#00A7F8]/20 border-[#00A7F8] text-white'
                                  : 'bg-[#121620] border-gray-800 text-gray-300 hover:border-gray-700'
                              }`}
                            >
                              <img
                                src={item.poster}
                                alt={item.title}
                                className="w-8 h-11 object-cover rounded"
                              />
                              <div className="overflow-hidden">
                                <p className="font-bold text-[11px] truncate">{item.title}</p>
                                <p className="text-[10px] text-gray-400">{item.releaseYear}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-800 flex items-center justify-end gap-3 bg-[#0b0e14]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all cursor-pointer text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-8 py-2.5 bg-[#00A7F8] hover:bg-[#0091d9] text-white font-extrabold rounded-xl transition-all cursor-pointer text-sm shadow-lg"
              >
                حفظ الكاروسيل
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
        onConfirm={confirmDelete}
        title="حذف الكاروسيل"
        message={`هل أنت متأكد من حذف الكاروسيل "${deleteModal.title}"؟`}
      />
    </div>
  );
};

export default CarouselsManagementTab;
