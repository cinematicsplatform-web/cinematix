
import React, { useState, useEffect } from 'react';
import type { Ad, AdPlacement, DeviceTarget, TriggerTarget, AdType } from '@/types';
import { adPlacements, adPlacementLabels, triggerTargetLabels } from '@/types';
import { CloseIcon } from '../icons/CloseIcon';
import ToggleSwitch from '../shared/ToggleSwitch';

interface AdEditModalProps {
    ad: Ad | null;
    onClose: () => void;
    onSave: (ad: Ad) => void;
}

const AdEditModal: React.FC<AdEditModalProps> = ({ ad, onClose, onSave }) => {
    const isNew = ad === null;

    const getInitialFormData = (): Ad => ({
        id: '', 
        title: '',
        code: '',
        type: 'code', 
        imageUrl: '',
        destinationUrl: '',
        placement: 'home-top',
        status: 'active',
        targetDevice: 'all',
        triggerTarget: 'all',
        timerDuration: 0, 
        updatedAt: new Date().toISOString(),
        isGlobal: false
    });
    
    const [formData, setFormData] = useState<Ad>(isNew ? getInitialFormData() : { 
        targetDevice: 'all', 
        triggerTarget: 'all', 
        timerDuration: 0, 
        type: 'code',
        isGlobal: false,
        ...ad! 
    });
    
    useEffect(() => {
        setFormData(isNew ? getInitialFormData() : { 
            targetDevice: 'all', 
            triggerTarget: 'all', 
            timerDuration: 0, 
            type: 'code',
            isGlobal: false,
            ...ad! 
        });
    }, [ad, isNew]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'timerDuration') {
             setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
             setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            alert('الرجاء إدخال عنوان للإعلان.');
            return;
        }

        if (formData.type === 'code' && (!formData.code || !formData.code.trim())) {
             alert('الرجاء إدخال كود الإعلان (Script/HTML).');
             return;
        }

        if (formData.type === 'banner' && (!formData.imageUrl || !formData.imageUrl.trim())) {
             alert('الرجاء إدخال رابط الصورة للإعلان.');
             return;
        }

        onSave(formData);
        onClose();
    };

    const isPopunder = formData.placement === 'global-popunder';
    const isActionAd = ['action_download', 'action_next_episode', 'watch-preroll'].includes(formData.placement);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-2xl text-white animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{isNew ? 'إضافة إعلان جديد' : 'تعديل الإعلان'}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full transition-colors"><CloseIcon/></button>
                    </div>
                    
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        
                        <div>
                           <label htmlFor="title" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">عنوان الإعلان</label>
                            <input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="مثال: بانر الصفحة الرئيسية" className="w-full bg-[#161b22] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-[var(--color-accent)] outline-none transition-all" required />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">نوع الإعلان</label>
                            <div className="flex gap-3 bg-[#161b22] p-1.5 rounded-xl border border-gray-700 w-fit">
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, type: 'code'}))}
                                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${formData.type === 'code' || !formData.type ? 'bg-[var(--color-accent)] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Code / Script
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, type: 'banner'}))}
                                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${formData.type === 'banner' ? 'bg-[var(--color-accent)] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Image Banner
                                </button>
                            </div>
                        </div>

                        {formData.type === 'banner' ? (
                             <div className="space-y-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-700 shadow-inner">
                                <div>
                                    <label htmlFor="imageUrl" className="block text-xs font-bold text-gray-500 mb-2 uppercase">رابط الصورة (Image URL)</label>
                                    <input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://example.com/banner.jpg" className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2 focus:border-[var(--color-accent)] outline-none text-left dir-ltr font-mono text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="destinationUrl" className="block text-xs font-bold text-gray-500 mb-2 uppercase">رابط التوجيه (Destination URL)</label>
                                    <input id="destinationUrl" name="destinationUrl" value={formData.destinationUrl || ''} onChange={handleChange} placeholder="https://google.com" className="w-full bg-black border border-gray-700 rounded-xl px-4 py-2 focus:border-[var(--color-accent)] outline-none text-left dir-ltr font-mono text-sm" />
                                </div>
                                {formData.imageUrl && (
                                    <div className="mt-4 p-4 bg-black rounded-xl border border-white/5 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-gray-600 mb-2 uppercase tracking-tighter self-start">معاينة البانر:</span>
                                        <img src={formData.imageUrl} alt="Preview" className="max-h-32 rounded-lg shadow-2xl border border-white/10" />
                                    </div>
                                )}
                             </div>
                        ) : (
                            <div>
                               <label htmlFor="code" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">كود الإعلان (HTML / JS)</label>
                                <textarea id="code" name="code" value={formData.code} onChange={handleChange} placeholder="<script>...</script>" className="w-full h-48 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 font-mono text-xs focus:border-[var(--color-accent)] outline-none text-left dir-ltr shadow-inner" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                               <label htmlFor="placement" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">مكان العرض المخصص</label>
                               <select id="placement" name="placement" value={formData.placement} onChange={handleChange} className="w-full bg-[#161b22] border border-gray-700 rounded-xl px-4 py-3 text-white font-bold focus:border-[var(--color-accent)] outline-none">
                                   {adPlacements.map(key => (
                                     <option key={key} value={key}>{adPlacementLabels[key]}</option>
                                   ))}
                               </select>
                            </div>

                            <div>
                               <label htmlFor="targetDevice" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">الجهاز المستهدف</label>
                               <select id="targetDevice" name="targetDevice" value={formData.targetDevice} onChange={handleChange} className="w-full bg-[#161b22] border border-gray-700 rounded-xl px-4 py-3 text-white font-bold focus:border-[var(--color-accent)] outline-none">
                                   <option value="all">جميع الأجهزة</option>
                                   <option value="mobile">موبايل فقط</option>
                                   <option value="desktop">كمبيوتر فقط</option>
                               </select>
                            </div>
                        </div>

                        {/* GLOBAL FALLBACK TOGGLE */}
                        <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-2xl animate-fade-in-up">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-[#00A7F8] text-sm">تفعيل كإعلان عالمي (Global Ad)</span>
                                    <p className="text-[10px] text-gray-500 font-bold max-w-sm">سيظهر هذا الإعلان في كافة أماكن العرض الفارغة التي لا تملك إعلاناً مخصصاً لها.</p>
                                </div>
                                <ToggleSwitch 
                                    checked={formData.isGlobal || false}
                                    onChange={(checked) => setFormData(prev => ({ ...prev, isGlobal: checked }))}
                                />
                            </div>
                        </div>

                        {isActionAd && (
                             <div className="bg-yellow-900/10 p-6 rounded-2xl border border-yellow-500/20 animate-fade-in-up">
                                <label htmlFor="timerDuration" className="block text-sm font-black text-yellow-500 mb-1 uppercase">⏱️ مدة الانتظار (ثانية)</label>
                                <p className="text-[10px] text-gray-500 mb-4 font-bold">عدد الثواني التي يجب على المستخدم انتظارها قبل المتابعة.</p>
                                <input 
                                    type="number" 
                                    id="timerDuration" 
                                    name="timerDuration" 
                                    value={formData.timerDuration || 0} 
                                    onChange={handleChange} 
                                    className="w-full bg-black border border-yellow-500/30 rounded-xl px-4 py-2 focus:border-yellow-500 outline-none text-white font-mono"
                                    min="0"
                                    max="60"
                                />
                            </div>
                        )}

                        {isPopunder && (
                            <div className="bg-purple-900/10 p-6 rounded-2xl border border-purple-500/20 animate-fade-in-up">
                                <label htmlFor="triggerTarget" className="block text-sm font-black text-purple-400 mb-1 uppercase">🎯 هدف التفعيل (Trigger Target)</label>
                                <p className="text-[10px] text-gray-500 mb-4 font-bold">اختر العنصر الذي سيقوم بتفعيل النافذة المنبثقة عند الضغط عليه.</p>
                                <select id="triggerTarget" name="triggerTarget" value={formData.triggerTarget || 'all'} onChange={handleChange} className="w-full bg-black border border-purple-500/30 rounded-xl px-4 py-2 focus:border-purple-400 outline-none text-white">
                                    {Object.entries(triggerTargetLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                         <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
                            <ToggleSwitch 
                                checked={formData.status === 'active'}
                                onChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'disabled' }))}
                                label={`حالة الإعلان: ${formData.status === 'active' ? 'نشط' : 'معطل'}`}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-700 gap-4">
                        <button type="button" onClick={onClose} className="px-8 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            إلغاء
                        </button>
                        <button type="submit" className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-black px-12 py-3 rounded-xl hover:shadow-[0_0_20px_var(--shadow-color)] transition-all transform active:scale-95 shadow-lg">
                            حفظ الإعلان
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdEditModal;
