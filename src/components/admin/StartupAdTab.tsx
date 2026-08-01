import React, { useState, useMemo } from 'react';
import type { SiteSettings, Content, StartupAd } from '../../types';
import { ContentType } from '../../types';
import ToggleSwitch from '../shared/ToggleSwitch';
import { MegaphoneIcon, FilmIcon, SearchIcon } from './AdminIcons';
import { PlusIcon } from '../icons/PlusIcon';
import { CloseIcon } from '../icons/CloseIcon';
import { CheckIcon } from '../icons/CheckIcon';

interface StartupAdTabProps {
    siteSettings: SiteSettings;
    onSetSiteSettings: (s: SiteSettings) => void;
    allContent: Content[];
    addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const StartupAdTab: React.FC<StartupAdTabProps> = ({ 
    siteSettings, 
    onSetSiteSettings, 
    allContent,
    addToast 
}) => {
    // Standardize startupAds array (supporting legacy single startupAd if present)
    const startupAds: StartupAd[] = useMemo(() => {
        if (Array.isArray(siteSettings.startupAds) && siteSettings.startupAds.length > 0) {
            return siteSettings.startupAds;
        }
        if (siteSettings.startupAd && siteSettings.startupAd.id) {
            return [siteSettings.startupAd];
        }
        return [];
    }, [siteSettings.startupAds, siteSettings.startupAd]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draftAd, setDraftAd] = useState<StartupAd>({
        id: '',
        name: '',
        imageUrlPc: '',
        imageUrlMobile: '',
        badgeText: '',
        customText: '',
        buttonText: '',
        linkType: 'none',
        targetContentId: '',
        externalUrl: '',
        isActive: true,
        updatedAt: new Date().toISOString()
    });

    // Content Search State
    const [contentSearchQuery, setContentSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

    // Regenerate draft ID handler
    const handleRegenerateDraftId = () => {
        const newId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        setDraftAd(prev => ({ ...prev, id: newId }));
        if (addToast) {
            addToast('تم تغيير معرف الإعلان في المسودة! احفظ التغييرات لإظهاره مجدداً للمستخدمين.', 'info');
        }
    };

    // Quick regenerate ID for an ad in list
    const handleQuickRegenerateId = (index: number) => {
        const updated = [...startupAds];
        const newId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        updated[index] = {
            ...updated[index],
            id: newId,
            updatedAt: new Date().toISOString()
        };
        onSetSiteSettings({
            ...siteSettings,
            startupAds: updated,
            startupAd: updated[0] || undefined
        });
        if (addToast) {
            addToast('تم تغيير معرف الإعلان بنجاح 🚀 سيظهر الإعلان مجدداً لجميع الزوار الذين أغلقوه سابقاً!', 'success');
        }
    };

    // Stats calculations
    const activeAdsCount = useMemo(() => startupAds.filter(a => a.isActive).length, [startupAds]);
    const inactiveAdsCount = startupAds.length - activeAdsCount;

    // Filtered content for the searchable selector
    const filteredContentList = useMemo(() => {
        const query = contentSearchQuery.toLowerCase().trim();
        if (!query) {
            return allContent.slice(0, 10);
        }
        return allContent.filter(item => {
            const titleMatch = (item.title || '').toLowerCase().includes(query);
            const altMatch = item.alternativeTitles?.some(alt => alt.toLowerCase().includes(query));
            const categoryMatch = item.categories?.some(cat => cat.toLowerCase().includes(query));
            const genreMatch = item.genres?.some(g => g.toLowerCase().includes(query));
            return titleMatch || altMatch || categoryMatch || genreMatch;
        }).slice(0, 20);
    }, [allContent, contentSearchQuery]);

    // Selected content details for draftAd
    const selectedContent = useMemo(() => {
        if (!draftAd.targetContentId) return null;
        return allContent.find(c => c.id === draftAd.targetContentId) || null;
    }, [allContent, draftAd.targetContentId]);

    // Open Modal for Creating New Ad
    const handleOpenCreateModal = () => {
        setEditingIndex(null);
        setDraftAd({
            id: `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: `إعلان انطلاق جديد ${startupAds.length + 1}`,
            imageUrlPc: '',
            imageUrlMobile: '',
            badgeText: '',
            customText: '',
            buttonText: '',
            linkType: 'none',
            targetContentId: '',
            externalUrl: '',
            isActive: true,
            updatedAt: new Date().toISOString()
        });
        setContentSearchQuery('');
        setIsModalOpen(true);
    };

    // Open Modal for Editing Existing Ad
    const handleOpenEditModal = (index: number) => {
        setEditingIndex(index);
        setDraftAd({
            badgeText: '',
            customText: '',
            buttonText: '',
            ...startupAds[index]
        });
        setContentSearchQuery('');
        setIsModalOpen(true);
    };

    // Save Ad (Save Button Handler)
    const handleSaveAd = () => {
        if (!draftAd.name.trim()) {
            if (addToast) addToast('يرجى إدخال اسم للإعلان', 'error');
            return;
        }

        if (!draftAd.imageUrlPc.trim() && !draftAd.imageUrlMobile.trim()) {
            if (addToast) addToast('يرجى إدخال رابط صورة واحدة على الأقل (شاشة الكمبيوتر أو الموبايل)', 'error');
            return;
        }

        const nowIso = new Date().toISOString();
        const updatedAd: StartupAd = {
            ...draftAd,
            updatedAt: nowIso
        };

        let newAdsList: StartupAd[];
        if (editingIndex === null) {
            newAdsList = [updatedAd, ...startupAds];
        } else {
            newAdsList = [...startupAds];
            newAdsList[editingIndex] = updatedAd;
        }

        onSetSiteSettings({
            ...siteSettings,
            startupAds: newAdsList,
            startupAd: newAdsList[0] || undefined // Keep legacy field synced
        });

        if (addToast) {
            addToast(editingIndex === null ? 'تمت إضافة الإعلان بنجاح!' : 'تم تحديث الإعلان بنجاح!', 'success');
        }

        setIsModalOpen(false);
    };

    // Quick Toggle Active directly from list
    const handleQuickToggleActive = (index: number, nextState: boolean) => {
        const updated = [...startupAds];
        updated[index] = {
            ...updated[index],
            isActive: nextState,
            updatedAt: new Date().toISOString()
        };

        onSetSiteSettings({
            ...siteSettings,
            startupAds: updated,
            startupAd: updated[0] || undefined
        });

        if (addToast) {
            addToast(nextState ? 'تم تفعيل الإعلان' : 'تم تعطيل الإعلان', 'info');
        }
    };

    // Delete Ad
    const handleDeleteAd = (index: number) => {
        const updated = startupAds.filter((_, i) => i !== index);
        onSetSiteSettings({
            ...siteSettings,
            startupAds: updated,
            startupAd: updated[0] || undefined
        });

        if (addToast) {
            addToast('تم حذف الإعلان بنجاح', 'success');
        }
        setDeleteConfirmIndex(null);
    };

    // Helper label for content type
    const getContentTypeLabel = (type: string) => {
        switch (type) {
            case ContentType.Movie: return 'فيلم';
            case ContentType.Series: return 'مسلسل';
            case ContentType.Program: return 'برنامج';
            case ContentType.Concert: return 'حفلة';
            case ContentType.Play: return 'مسرحية';
            default: return 'محتوى';
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header & Stats Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-[#1f2937] to-gray-900 p-6 md:p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start gap-4">
                        <div className="p-3.5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl border border-amber-500/30 text-amber-400 shadow-lg shrink-0">
                            <MegaphoneIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-2xl font-black text-white tracking-wide">إعلانات الانطلاق (Startup Ads)</h3>
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-extrabold px-3 py-1 rounded-full">
                                    تنبيهات البوب أب
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                                تظهر هذه الإعلانات للمستخدمين فور فتح الصفحة الرئيسية. يمكنك إضافة عدة إعلانات وإدارتها بسهولة.
                            </p>
                            
                            {/* Summary Badges */}
                            <div className="flex items-center gap-3 mt-4 text-xs font-bold">
                                <div className="bg-gray-800/80 border border-gray-700/80 text-gray-300 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                                    <span>إجمالي الإعلانات:</span>
                                    <span className="text-white font-black text-sm">{startupAds.length}</span>
                                </div>
                                <div className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>نشط:</span>
                                    <span className="font-black text-sm">{activeAdsCount}</span>
                                </div>
                                <div className="bg-gray-800/50 border border-gray-700/50 text-gray-400 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                                    <span>غير نشط:</span>
                                    <span className="font-black text-sm">{inactiveAdsCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-amber-500/15 hover:shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                        <PlusIcon className="w-5 h-5 text-slate-950 stroke-[3]" />
                        <span>إضافة إعلان جديد</span>
                    </button>
                </div>
            </div>

            {/* Ads Cards Grid */}
            {startupAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {startupAds.map((ad, index) => {
                        const targetContent = ad.linkType === 'content' && ad.targetContentId 
                            ? allContent.find(c => c.id === ad.targetContentId)
                            : null;

                        return (
                            <div 
                                key={ad.id || index}
                                className={`bg-[#181d26] rounded-3xl border transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between ${
                                    ad.isActive 
                                        ? 'border-gray-700 hover:border-amber-500/50' 
                                        : 'border-gray-800/80 opacity-75 grayscale-[0.2]'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="p-5 border-b border-gray-800/80 flex items-center justify-between bg-black/20 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${
                                            ad.isActive 
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                                        }`}>
                                            {ad.isActive ? 'نشط' : 'معطل'}
                                        </span>
                                        <h4 className="text-base font-bold text-white truncate flex items-center gap-2" title={ad.name}>
                                            <span>{ad.name || `إعلان بدون عنوان #${index + 1}`}</span>
                                            {ad.imageUrlMobile && !ad.imageUrlPc && (
                                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                                    📱 التطبيق فقط
                                                </span>
                                            )}
                                            {ad.imageUrlPc && !ad.imageUrlMobile && (
                                                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                                    💻 الموقع فقط
                                                </span>
                                            )}
                                            {ad.imageUrlPc && ad.imageUrlMobile && (
                                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                                    📱💻 التطبيق والموقع
                                                </span>
                                            )}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <ToggleSwitch
                                            checked={ad.isActive}
                                            onChange={(c) => handleQuickToggleActive(index, c)}
                                        />
                                    </div>
                                </div>

                                {/* Card Body & Image Previews */}
                                <div className="p-5 space-y-4 flex-1">
                                    {/* Images Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* PC Banner Preview */}
                                        <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-2.5 flex flex-col items-center justify-center min-h-[110px] text-center relative overflow-hidden group">
                                            <span className="text-[10px] font-extrabold text-gray-400 mb-1.5 self-start bg-gray-800/80 px-2 py-0.5 rounded-md">
                                                💻 الكمبيوتر (PC)
                                            </span>
                                            {ad.imageUrlPc ? (
                                                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-700/80 bg-black/50">
                                                    <img 
                                                        src={ad.imageUrlPc} 
                                                        alt="PC Banner" 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 py-4">لم يتم إضافة صورة PC</p>
                                            )}
                                        </div>

                                        {/* Mobile Banner Preview */}
                                        <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-2.5 flex flex-col items-center justify-center min-h-[110px] text-center relative overflow-hidden group">
                                            <span className="text-[10px] font-extrabold text-gray-400 mb-1.5 self-start bg-gray-800/80 px-2 py-0.5 rounded-md">
                                                📱 الموبايل (Mobile)
                                            </span>
                                            {ad.imageUrlMobile ? (
                                                <div className="relative aspect-[4/5] max-h-[85px] w-auto rounded-xl overflow-hidden border border-gray-700/80 bg-black/50 mx-auto">
                                                    <img 
                                                        src={ad.imageUrlMobile} 
                                                        alt="Mobile Banner" 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 py-4">لم يتم إضافة صورة Mobile</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Type Details & Badge Info */}
                                    <div className="space-y-2">
                                        {(ad.badgeText || ad.customText || ad.buttonText) && (
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl space-y-1">
                                                {ad.badgeText && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-gray-400 font-bold">الوسام:</span>
                                                        <span className="bg-amber-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                                                            {ad.badgeText}
                                                        </span>
                                                    </div>
                                                )}
                                                {ad.customText && (
                                                    <div className="text-xs text-gray-200 font-medium line-clamp-2 pt-0.5">
                                                        📝 <span className="italic">"{ad.customText}"</span>
                                                    </div>
                                                )}
                                                {ad.buttonText && (
                                                    <div className="text-xs text-amber-300 font-bold pt-0.5 flex items-center gap-1.5">
                                                        <span>🔘 نص الزر:</span>
                                                        <span className="bg-black/40 px-2 py-0.5 rounded-md border border-amber-500/30 font-black text-white">"{ad.buttonText}"</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="bg-gray-900/50 p-3.5 rounded-2xl border border-gray-800/80 text-xs">
                                            <span className="text-gray-400 font-bold block mb-1">نوع التفاعل عند النقر:</span>
                                            {ad.linkType === 'content' ? (
                                                targetContent ? (
                                                    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mt-1.5">
                                                        <img 
                                                            src={targetContent.poster} 
                                                            alt="" 
                                                            className="w-8 h-11 object-cover rounded-lg border border-amber-500/30 shrink-0" 
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-amber-400 font-bold truncate">{targetContent.title}</span>
                                                                <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                                                    {getContentTypeLabel(targetContent.type)}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">فتح صفحة التفاصيل مباشرة</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-amber-400/80 font-bold mt-1">🎬 توجيه لمحتوى (غير محدد أو محذوف)</p>
                                                )
                                            ) : ad.linkType === 'external' ? (
                                                <div className="flex items-center gap-2 text-cyan-400 font-medium truncate mt-1 bg-cyan-950/30 border border-cyan-800/30 p-2 rounded-xl">
                                                    <span className="shrink-0">🔗</span>
                                                    <span className="truncate" dir="ltr">{ad.externalUrl || 'رابط خارجي'}</span>
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 font-medium mt-1">🚫 بدون تفاعل (عرض الصورة فقط)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions Footer */}
                                <div className="p-4 bg-black/30 border-t border-gray-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                                        <span>التحديث: {ad.updatedAt ? new Date(ad.updatedAt).toLocaleDateString('ar-EG') : 'الآن'}</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleQuickRegenerateId(index)}
                                            title="إعادة إظهار الإعلان لجميع المستخدمين الذين أغلقوه سابقاً من خلال تغيير معرف الإعلان"
                                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-extrabold text-xs px-3 py-2 rounded-xl border border-amber-500/30 transition-all hover:border-amber-500/50 flex items-center gap-1.5"
                                        >
                                            <span>🔄</span>
                                            <span>تغيير المعرف (إعادة إظهار)</span>
                                        </button>

                                        <button
                                            onClick={() => handleOpenEditModal(index)}
                                            className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-gray-700/80 transition-all hover:border-amber-500/50 flex items-center gap-1.5"
                                        >
                                            <span>✏️</span>
                                            <span>تعديل</span>
                                        </button>

                                        {deleteConfirmIndex === index ? (
                                            <div className="flex items-center gap-1 bg-red-950/80 border border-red-800/80 p-1 rounded-xl">
                                                <button
                                                    onClick={() => handleDeleteAd(index)}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-2.5 py-1 rounded-lg transition-colors"
                                                >
                                                    تأكيد
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmIndex(null)}
                                                    className="text-gray-400 hover:text-white px-2 py-1 text-xs"
                                                >
                                                    إلغاء
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirmIndex(index)}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs px-3 py-2 rounded-xl border border-red-500/20 transition-all hover:border-red-500/40"
                                            >
                                                حذف
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center p-14 bg-[#181d26] rounded-3xl border border-dashed border-gray-800 space-y-4">
                    <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                        <MegaphoneIcon className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto">
                        <h4 className="text-lg font-bold text-white">لا توجد إعلانات انطلاق حتى الآن</h4>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            قم بإضافة أول إعلان انطلاق ليظهر كمنبثق ترحيبي/ترويجي للمستخدمين فور دخولهم التطبيق.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-amber-500/20"
                    >
                        <PlusIcon className="w-5 h-5 stroke-[3]" />
                        <span>إضافة أول إعلان</span>
                    </button>
                </div>
            )}

            {/* ================= EDIT / CREATE MODAL ================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
                    <div 
                        className="bg-[#181d26] border border-gray-700/80 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                                    <MegaphoneIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">
                                        {editingIndex === null ? 'إضافة إعلان انطلاق جديد' : 'تعديل إعلان الانطلاق'}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        قم بضبط الصورة، التفعيل، وتحديد التفاعل عند النقر.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-6 space-y-7 overflow-y-auto custom-scrollbar flex-1">
                            {/* 1. Basic Info & ID */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    1. البيانات الأساسية والمعرف
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">
                                            اسم الإعلان (للتنظيم الداخلي في اللوحة) <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.name}
                                            onChange={(e) => setDraftAd({ ...draftAd, name: e.target.value })}
                                            placeholder="مثال: إعلان مسلسلات رمضان 2026"
                                            className="w-full bg-gray-900/90 border border-gray-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">
                                            حالة الإعلان
                                        </label>
                                        <div className="flex items-center justify-between bg-gray-900/90 border border-gray-700 rounded-2xl px-4 py-2.5">
                                            <span className={`text-xs font-bold ${draftAd.isActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                {draftAd.isActive ? 'مفعل (نشط)' : 'معطل'}
                                            </span>
                                            <ToggleSwitch
                                                checked={draftAd.isActive}
                                                onChange={(c) => setDraftAd({ ...draftAd, isActive: c })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ID Change / Regeneration Block */}
                                <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-300">معرف الإعلان (Ad ID):</span>
                                            <code className="text-amber-400 font-mono bg-black/50 px-2.5 py-0.5 rounded-lg text-xs border border-amber-500/20">
                                                {draftAd.id || 'غير محدد'}
                                            </code>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            💡 <strong>تلميح الإعادة:</strong> الضغط على "تغيير المعرف" يُولد كوداً جديداً للإعلان لكي يظهر مجدداً لجميع الزوار الذين قاموا بإغلاقه سابقاً.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleRegenerateDraftId}
                                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2 shrink-0 shadow-lg"
                                    >
                                        <span>🔄</span>
                                        <span>تغيير المعرف (إعادة إظهار للجميع)</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Badge, Custom Text & Button Text */}
                            <div className="space-y-4 pt-2 border-t border-gray-800/80">
                                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    2. الوسام، النص التوضيحي، ونص الزر (اختياري)
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">
                                            وسام الإعلان (Badge / Tag)
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.badgeText || ''}
                                            onChange={(e) => setDraftAd({ ...draftAd, badgeText: e.target.value })}
                                            placeholder="مثال: جديد، حصرياً، عرض رمضان..."
                                            className="w-full bg-gray-900/90 border border-gray-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            شارة ملونة تظهر في الزاوية العلوية للإعلان للجذب والملاحظة.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">
                                            نص أو وصف الإعلان الإضافي
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.customText || ''}
                                            onChange={(e) => setDraftAd({ ...draftAd, customText: e.target.value })}
                                            placeholder="مثال: شاهد الموسم الجديد الآن مجاناً قبل الجميع!"
                                            className="w-full bg-gray-900/90 border border-gray-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            نص توضيحي يظهر في أسفل الإعلان فوق زر التوجيه.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-300 mb-1.5">
                                            نص الزر (Button Text)
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.buttonText || ''}
                                            onChange={(e) => setDraftAd({ ...draftAd, buttonText: e.target.value })}
                                            placeholder="مثال: انضم للقناة، زيارة الرابط، شاهد الآن..."
                                            className="w-full bg-gray-900/90 border border-amber-500/50 focus:border-amber-400 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-colors"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            النص الظاهر على الزر التفاعلي للإعلان.
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Presets for Button Text */}
                                <div className="bg-gray-900/50 p-3 rounded-2xl border border-gray-800 space-y-2">
                                    <span className="text-[11px] font-extrabold text-amber-400 block">
                                        💡 خيارات سريعة لنص الزر (انقر للاختيار):
                                    </span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {['شاهد الآن', 'انضم لقناة التليجرام', 'زيارة الصفحة', 'انضم للجروب', 'حمل التطبيق', 'زيارة الرابط', 'اشترك الآن'].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setDraftAd({ ...draftAd, buttonText: preset })}
                                                className={`text-[11px] px-3 py-1.5 rounded-xl border font-bold transition-all ${
                                                    draftAd.buttonText === preset
                                                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                                                        : 'bg-gray-800/80 text-gray-300 border-gray-700 hover:border-amber-500/50 hover:text-white'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Banner Images (PC & Mobile) */}
                            <div className="space-y-4 pt-2 border-t border-gray-800/80">
                                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    2. صور الإعلان (روابط الميديا)
                                </h4>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-xs text-blue-300 font-medium space-y-1">
                                    <p className="font-bold text-blue-400">💡 توجيه ذكي بحسب الصورتين:</p>
                                    <p>• عند إضافة <strong>صورة الموبايل فقط</strong> بدون صورة PC: يظهر الإعلان في <strong>تطبيق/شاشة الموبايل فقط</strong>.</p>
                                    <p>• عند إضافة <strong>الصورتين معاً</strong> (PC والموبايل): يظهر الإعلان في <strong>الموقع على الكمبيوتر والتطبيق على الموبايل</strong> بالصورتين المناسبتين لكل شاشة.</p>
                                    <p>• عند إضافة <strong>صورة PC فقط</strong>: يظهر الإعلان على شاشات الكمبيوتر/الموقع فقط.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* PC Image */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-300">
                                            رابط صورة شاشة الكمبيوتر (PC Banner - 16:9)
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.imageUrlPc}
                                            onChange={(e) => setDraftAd({ ...draftAd, imageUrlPc: e.target.value })}
                                            placeholder="https://example.com/banner-pc.jpg"
                                            className="w-full bg-gray-900/90 border border-gray-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                                            dir="ltr"
                                        />
                                        
                                        {/* Live Preview PC */}
                                        <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-3 text-center min-h-[120px] flex flex-col justify-center items-center">
                                            {draftAd.imageUrlPc ? (
                                                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-gray-700 bg-black/60">
                                                    <img 
                                                        src={draftAd.imageUrlPc} 
                                                        alt="معاينة PC" 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500">معاينة صورة الكمبيوتر تظهر هنا</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile Image */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-300">
                                            رابط صورة شاشة الموبايل (Mobile Banner - 4:5 أو 9:16)
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.imageUrlMobile}
                                            onChange={(e) => setDraftAd({ ...draftAd, imageUrlMobile: e.target.value })}
                                            placeholder="https://example.com/banner-mobile.jpg"
                                            className="w-full bg-gray-900/90 border border-gray-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                                            dir="ltr"
                                        />
                                        
                                        {/* Live Preview Mobile */}
                                        <div className="bg-gray-900/60 rounded-2xl border border-gray-800 p-3 text-center min-h-[120px] flex flex-col justify-center items-center">
                                            {draftAd.imageUrlMobile ? (
                                                <div className="relative aspect-[4/5] h-28 w-auto rounded-xl overflow-hidden border border-gray-700 bg-black/60 mx-auto">
                                                    <img 
                                                        src={draftAd.imageUrlMobile} 
                                                        alt="معاينة Mobile" 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500">معاينة صورة الموبايل تظهر هنا</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Interaction & Link Target (Searchable Content) */}
                            <div className="space-y-4 pt-2 border-t border-gray-800/80">
                                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    3. التفاعل والتوجيه عند النقر
                                </h4>

                                {/* Link Type Selector Segmented Control */}
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDraftAd({ ...draftAd, linkType: 'none', targetContentId: '', externalUrl: '' })}
                                        className={`p-3.5 rounded-2xl border text-center transition-all text-xs font-bold flex flex-col items-center gap-2 ${
                                            draftAd.linkType === 'none'
                                                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                                                : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                                        }`}
                                    >
                                        <span className="text-lg">🚫</span>
                                        <span>بدون تفاعل</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDraftAd({ ...draftAd, linkType: 'content', externalUrl: '' })}
                                        className={`p-3.5 rounded-2xl border text-center transition-all text-xs font-bold flex flex-col items-center gap-2 ${
                                            draftAd.linkType === 'content'
                                                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                                                : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                                        }`}
                                    >
                                        <span className="text-lg">🎬</span>
                                        <span>فتح محتوى بالتطبيق</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDraftAd({ ...draftAd, linkType: 'external', targetContentId: '' })}
                                        className={`p-3.5 rounded-2xl border text-center transition-all text-xs font-bold flex flex-col items-center gap-2 ${
                                            draftAd.linkType === 'external'
                                                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                                                : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                                        }`}
                                    >
                                        <span className="text-lg">🔗</span>
                                        <span>رابط خارجي</span>
                                    </button>
                                </div>

                                {/* IF CONTENT SELECTED: Searchable Content Input */}
                                {draftAd.linkType === 'content' && (
                                    <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 space-y-4">
                                        <label className="block text-xs font-bold text-gray-200">
                                            اختر المحتوى المطلوب التوجيه إليه عند الضغط
                                        </label>

                                        {/* Display Selected Content Card if already chosen */}
                                        {selectedContent ? (
                                            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <img 
                                                        src={selectedContent.poster} 
                                                        alt="" 
                                                        className="w-12 h-16 object-cover rounded-xl border border-amber-500/30 shadow-md shrink-0" 
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h5 className="text-sm font-black text-white truncate">{selectedContent.title}</h5>
                                                            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-extrabold shrink-0">
                                                                {getContentTypeLabel(selectedContent.type)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-1 truncate">
                                                            سنة الإصدار: {selectedContent.releaseYear || 'غير محددة'} | {selectedContent.categories?.join(', ') || 'عام'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setDraftAd({ ...draftAd, targetContentId: '' })}
                                                    className="bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-xs px-3.5 py-2 rounded-xl border border-amber-500/20 transition-colors shrink-0"
                                                >
                                                    تغيير المحتوى
                                                </button>
                                            </div>
                                        ) : null}

                                        {/* Search Input Box */}
                                        <div className="relative">
                                            <div className="relative">
                                                <SearchIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    value={contentSearchQuery}
                                                    onChange={(e) => setContentSearchQuery(e.target.value)}
                                                    onFocus={() => setIsSearchFocused(true)}
                                                    placeholder="ابحث باسم الفيلم أو المسلسل..."
                                                    className="w-full bg-black/60 border border-gray-700 focus:border-amber-500 rounded-2xl pr-12 pl-10 py-3 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                                                />
                                                {contentSearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setContentSearchQuery('')}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                    >
                                                        <CloseIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Results Dropdown */}
                                            {isSearchFocused && (
                                                <div className="mt-2 bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-800 custom-scrollbar">
                                                    {filteredContentList.length > 0 ? (
                                                        filteredContentList.map(item => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setDraftAd({ ...draftAd, targetContentId: item.id });
                                                                    setIsSearchFocused(false);
                                                                    setContentSearchQuery('');
                                                                }}
                                                                className={`w-full p-3 flex items-center gap-3 hover:bg-amber-500/10 transition-colors text-right ${
                                                                    draftAd.targetContentId === item.id ? 'bg-amber-500/20 text-amber-300' : 'text-gray-200'
                                                                }`}
                                                            >
                                                                <img 
                                                                    src={item.poster} 
                                                                    alt="" 
                                                                    className="w-9 h-12 object-cover rounded-lg border border-gray-700 shrink-0 bg-gray-800" 
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-xs truncate">{item.title}</span>
                                                                        <span className="bg-gray-800 text-gray-300 text-[9px] px-1.5 py-0.5 rounded font-extrabold shrink-0">
                                                                            {getContentTypeLabel(item.type)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                                        {item.releaseYear ? `${item.releaseYear} • ` : ''}{item.categories?.slice(0, 2).join(', ')}
                                                                    </p>
                                                                </div>

                                                                {draftAd.targetContentId === item.id && (
                                                                    <CheckIcon className="w-5 h-5 text-amber-400 shrink-0" />
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-xs text-gray-400">
                                                            لم يتم العثور على أي محتوى يطابق البحث
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* IF EXTERNAL SELECTED: URL Input */}
                                {draftAd.linkType === 'external' && (
                                    <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 space-y-2">
                                        <label className="block text-xs font-bold text-gray-200">
                                            الرابط الخارجي المطلوبة التوجه إليه
                                        </label>
                                        <input
                                            type="text"
                                            value={draftAd.externalUrl || ''}
                                            onChange={(e) => setDraftAd({ ...draftAd, externalUrl: e.target.value })}
                                            placeholder="https://google.com"
                                            className="w-full bg-black/60 border border-gray-700 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                                            dir="ltr"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer (Save Button) */}
                        <div className="p-5 border-t border-gray-800 bg-gray-900/90 flex items-center justify-between gap-4 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-colors"
                            >
                                إلغاء
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveAd}
                                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <CheckIcon className="w-5 h-5 stroke-[3]" />
                                <span>حفظ الإعلان</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StartupAdTab;
