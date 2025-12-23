
import React, { useState, useEffect, useRef } from 'react';
import { db, saveStory, deleteStory, getStories } from '../firebase';
import type { Story, StoryMediaItem } from '../types';
import ToggleSwitch from './ToggleSwitch';
import { CloseIcon } from './icons/CloseIcon';
import { PlusIcon } from './icons/PlusIcon';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

interface ManageStoriesProps {
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ManageStories: React.FC<ManageStoriesProps> = ({ addToast }) => {
    const [stories, setStories] = useState<Story[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        thumbnailUrl: '',
    });
    
    const [mediaItems, setMediaItems] = useState<StoryMediaItem[]>([
        { url: '', mediaType: 'image', ctaText: 'شاهد الآن', targetUrl: '' }
    ]);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; story: Story | null }>({
        isOpen: false,
        story: null
    });

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        setIsLoading(true);
        try {
            const data = await getStories(false);
            setStories(data);
        } catch (e) {
            addToast('فشل تحميل الستوريات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMediaItem = () => {
        setMediaItems([...mediaItems, { url: '', mediaType: 'image', ctaText: 'شاهد الآن', targetUrl: '' }]);
    };

    const handleRemoveMediaItem = (index: number) => {
        if (mediaItems.length === 1) return;
        setMediaItems(mediaItems.filter((_, i) => i !== index));
    };

    const handleMediaItemChange = (index: number, field: keyof StoryMediaItem, value: string) => {
        const updated = [...mediaItems];
        if (updated[index]) {
            updated[index] = { ...updated[index], [field]: value };
            setMediaItems(updated);
        }
    };

    const handleEditStory = (story: Story) => {
        setEditingStoryId(story.id);
        setFormData({
            title: story.title,
            thumbnailUrl: story.thumbnailUrl,
        });
        setMediaItems(story.mediaItems && story.mediaItems.length > 0 
            ? story.mediaItems.map(item => ({
                ...item,
                ctaText: item.ctaText || 'شاهد الآن',
                targetUrl: item.targetUrl || ''
            }))
            : [{ url: '', mediaType: 'image', ctaText: 'شاهد الآن', targetUrl: '' }]
        );
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingStoryId(null);
        setFormData({ title: '', thumbnailUrl: '' });
        setMediaItems([{ url: '', mediaType: 'image', ctaText: 'شاهد الآن', targetUrl: '' }]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.thumbnailUrl.trim()) {
            addToast('الرجاء إدخال العنوان ورابط صورة الدائرة', 'info');
            return;
        }

        const validMediaItems = mediaItems.filter(item => item.url && item.url.trim() !== '');
        if (validMediaItems.length === 0) {
            addToast('الرجاء إضافة رابط ميديا واحد على الأقل للستوري', 'info');
            return;
        }

        setIsSaving(true);
        try {
            const storyData: any = {
                ...formData,
                mediaItems: validMediaItems,
                isActive: editingStoryId ? (stories.find(s => s.id === editingStoryId)?.isActive ?? true) : true,
            };

            if (editingStoryId) storyData.id = editingStoryId;

            await saveStory(storyData);
            addToast(editingStoryId ? 'تم تعديل الستوري بنجاح!' : 'تم نشر الستوري بنجاح!', 'success');
            resetForm();
            fetchStories();
        } catch (error) {
            addToast('حدث خطأ أثناء الحفظ', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (storyId: string, currentStatus: boolean) => {
        try {
            await db.collection('stories').doc(storyId).update({ isActive: !currentStatus });
            setStories(prev => prev.map(s => s.id === storyId ? { ...s, isActive: !currentStatus } : s));
            addToast('تم تحديث حالة الظهور', 'success');
        } catch (e) { addToast('فشل التحديث', 'error'); }
    };

    const executeDelete = async () => {
        if (!deleteModal.story) return;
        try {
            await deleteStory(deleteModal.story.id);
            setStories(prev => prev.filter(s => s.id !== deleteModal.story?.id));
            if (editingStoryId === deleteModal.story.id) resetForm();
            addToast('تم الحذف بنجاح', 'success');
        } catch (e) { addToast('فشل الحذف', 'error'); } finally { setDeleteModal({ isOpen: false, story: null }); }
    };

    return (
        <div className="space-y-10 animate-fade-in-up pb-12">
            <div ref={formRef} className="bg-[#1f2937] p-8 rounded-3xl border border-gray-700/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)]/5 rounded-bl-full pointer-events-none"></div>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] p-2 rounded-xl text-black">
                            {editingStoryId ? <EditIcon /> : <PlusIcon className="w-5 h-5" />}
                        </span>
                        {editingStoryId ? 'تعديل مجموعة الستوري' : 'إنشاء مجموعة ستوري جديدة'}
                    </h3>
                    {editingStoryId && (
                        <button type="button" onClick={resetForm} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">إلغاء التعديل</button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">عنوان المجموعة</label>
                            <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent)] outline-none transition-colors" placeholder="مثال: أهم أخبار الأسبوع"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">رابط صورة الدائرة (Thumbnail URL)</label>
                            <input value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} className="w-full bg-[#0f1014] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent)] outline-none dir-ltr transition-colors" placeholder="https://external.com/thumb.jpg"/>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest">محتوى الشرائح (Slides Content)</h4>
                            <button type="button" onClick={handleAddMediaItem} className="text-xs font-bold text-[var(--color-accent)] flex items-center gap-1 hover:underline"><PlusIcon className="w-4 h-4" /> إضافة شريحة أخرى</button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {mediaItems.map((item, idx) => (
                                <div key={idx} className="bg-[#0f1014] p-6 rounded-2xl border border-gray-700 flex flex-col gap-4 group relative transition-all hover:border-gray-600">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[var(--color-primary-to)] bg-[var(--color-primary-to)]/10 px-3 py-1 rounded-full shadow-inner">شريحة #{idx + 1}</span>
                                        {mediaItems.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveMediaItem(idx)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-full"><CloseIcon className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">رابط الصورة أو الفيديو</label>
                                            <input value={item.url} onChange={e => handleMediaItemChange(idx, 'url', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white dir-ltr focus:border-[var(--color-accent)] outline-none" placeholder="Media direct URL"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">النوع</label>
                                            <select value={item.mediaType} onChange={e => handleMediaItemChange(idx, 'mediaType', e.target.value as any)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-[var(--color-accent)] outline-none">
                                                <option value="image">صورة (Image)</option>
                                                <option value="video">فيديو (Video)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">نص الزر</label>
                                            <input value={item.ctaText} onChange={e => handleMediaItemChange(idx, 'ctaText', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[var(--color-accent)] outline-none" placeholder="مثال: شاهد الآن"/>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">رابط الزر (رابط خاص بهذه الشريحة)</label>
                                            <input value={item.targetUrl} onChange={e => handleMediaItemChange(idx, 'targetUrl', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white dir-ltr focus:border-[var(--color-accent)] outline-none" placeholder="Target URL per slide"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center mt-4">
                        <button type="submit" disabled={isSaving} className="w-full max-w-md bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-black py-4 rounded-2xl hover:shadow-[0_0_40px_var(--shadow-color)] transition-all transform hover:scale-[1.02] disabled:opacity-50">
                            {isSaving ? 'جاري الحفظ...' : editingStoryId ? 'حفظ التغييرات' : 'نشر مجموعة الستوري'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-[#1f2937] rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-700/50 flex justify-between items-center bg-black/20">
                    <h3 className="font-bold text-xl text-white">إدارة الستوريات ({stories.length})</h3>
                    <button onClick={fetchStories} className="text-sm text-[var(--color-accent)] font-bold hover:underline">تحديث القائمة</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-300 whitespace-nowrap">
                        <thead className="bg-[#0f1014]/50 text-xs uppercase font-bold text-gray-500 tracking-widest">
                            <tr><th className="px-8 py-5">الستوري</th><th className="px-8 py-5 text-center">عدد الشرائح</th><th className="px-8 py-5 text-center">ظهور</th><th className="px-8 py-5 text-center">إجراءات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-20 text-gray-500">جاري التحميل...</td></tr>
                            ) : stories.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-20 text-gray-500">لا يوجد ستوريات منشورة حالياً.</td></tr>
                            ) : stories.map(story => (
                                <tr key={story.id} className="hover:bg-gray-800/20 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 p-0.5 group-hover:border-[var(--color-accent)] transition-colors">
                                                <img src={story.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-full bg-gray-900" />
                                            </div>
                                            <span className="font-bold text-white group-hover:text-[var(--color-accent)] transition-colors">{story.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                                            {story.mediaItems?.length || 1} شريحة
                                        </span>
                                    </td>
                                    <td className="px-8 py-4"><div className="flex justify-center"><ToggleSwitch checked={story.isActive} onChange={() => handleToggleActive(story.id, story.isActive)} className="scale-90" /></div></td>
                                    <td className="px-8 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEditStory(story)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors"><EditIcon /></button>
                                            <button onClick={() => setDeleteModal({ isOpen: true, story })} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"><CloseIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, story: null })} onConfirm={executeDelete} title="حذف الستوري" message={`هل أنت متأكد من حذف "${deleteModal.story?.title}"؟ هذا الإجراء لا يمكن التراجع عنه.`} />
        </div>
    );
};

export default ManageStories;
