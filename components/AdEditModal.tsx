
import React, { useState, useEffect } from 'react';
import type { Ad, AdPlacement, DeviceTarget, TriggerTarget, AdType } from '../types';
import { adPlacements, adPlacementLabels, triggerTargetLabels } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import ToggleSwitch from './ToggleSwitch';

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
        type: 'code', // Default type
        imageUrl: '',
        destinationUrl: '',
        placement: 'home-top',
        status: 'active',
        targetDevice: 'all',
        triggerTarget: 'all',
        timerDuration: 0, 
        updatedAt: new Date().toISOString(),
    });
    
    const [formData, setFormData] = useState<Ad>(isNew ? getInitialFormData() : { 
        targetDevice: 'all', 
        triggerTarget: 'all', 
        timerDuration: 0, 
        type: 'code', // Fallback for old ads
        ...ad! 
    });
    
    useEffect(() => {
        setFormData(isNew ? getInitialFormData() : { 
            targetDevice: 'all', 
            triggerTarget: 'all', 
            timerDuration: 0, 
            type: 'code',
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
        
        // Basic validation
        if (!formData.title.trim()) {
            alert('الرجاء إدخال عنوان للإعلان.');
            return;
        }

        // Type-specific validation
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

    // Logic for visibility
    const isPopunder = formData.placement === 'global-popunder';
    const isActionAd = ['action_download', 'action_next_episode'].includes(formData.placement);

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl text-white animate-fade-in-up border border-gray-700" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{isNew ? 'إضافة إعلان جديد' : 'تعديل الإعلان'}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon/></button>
                    </div>
                    
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        
                        {/* Common Fields */}
                        <div>
                           <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">عنوان الإعلان</label>
                            <input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="مثال: بانر الصفحة الرئيسية" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none" required />
                        </div>
                        
                        {/* Ad Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">نوع الإعلان</label>
                            <div className="flex gap-3 bg-gray-700/50 p-1 rounded-lg border border-gray-600 w-fit">
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, type: 'code'}))}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${formData.type === 'code' || !formData.type ? 'bg-[var(--color-accent)] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Code / Script
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setFormData(prev => ({...prev, type: 'banner'}))}
                                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${formData.type === 'banner' ? 'bg-[var(--color-accent)] text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Image Banner
                                </button>
                            </div>
                        </div>

                        {/* Conditional Fields */}
                        {formData.type === 'banner' ? (
                             <div className="space-y-4 bg-gray-900/50 p-4 rounded-xl border border-gray-600">
                                <div>
                                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-1">رابط الصورة (Image URL)</label>
                                    <input id="imageUrl" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} placeholder="https://example.com/banner.jpg" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none text-left dir-ltr" />
                                </div>
                                <div>
                                    <label htmlFor="destinationUrl" className="block text-sm font-medium text-gray-300 mb-1">رابط التوجيه (Link URL)</label>
                                    <input id="destinationUrl" name="destinationUrl" value={formData.destinationUrl || ''} onChange={handleChange} placeholder="https://google.com" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none text-left dir-ltr" />
                                </div>
                                {formData.imageUrl && (
                                    <div className="mt-2">
                                        <span className="text-xs text-gray-500 mb-1 block">معاينة:</span>
                                        <img src={formData.imageUrl} alt="Preview" className="max-h-32 rounded border border-gray-600" />
                                    </div>
                                )}
                             </div>
                        ) : (
                            <div>
                               <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">كود الإعلان (HTML / JS)</label>
                                <textarea id="code" name="code" value={formData.code} onChange={handleChange} placeholder="<script>...</script>" className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono text-sm focus:border-[var(--color-accent)] focus:outline-none dir-ltr" />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                               <label htmlFor="placement" className="block text-sm font-medium text-gray-300 mb-1">مكان العرض</label>
                               <select id="placement" name="placement" value={formData.placement} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none">
                                   {adPlacements.map(key => (
                                     <option key={key} value={key}>{adPlacementLabels[key]}</option>
                                   ))}
                               </select>
                            </div>

                            <div>
                               <label htmlFor="targetDevice" className="block text-sm font-medium text-gray-300 mb-1">الجهاز المستهدف</label>
                               <select id="targetDevice" name="targetDevice" value={formData.targetDevice} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:border-[var(--color-accent)] focus:outline-none">
                                   <option value="all">جميع الأجهزة</option>
                                   <option value="mobile">موبايل فقط</option>
                                   <option value="desktop">كمبيوتر فقط</option>
                               </select>
                            </div>
                        </div>

                        {/* TIMER SETTINGS - Only for Action Ads */}
                        {isActionAd && (
                             <div className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-500/30 animate-fade-in-up">
                                <label htmlFor="timerDuration" className="block text-sm font-bold text-yellow-400 mb-1">⏱️ مدة الانتظار (ثانية)</label>
                                <p className="text-xs text-gray-400 mb-2">كم ثانية يجب على المستخدم الانتظار قبل تنفيذ الإجراء؟ (ضع 0 للإلغاء).</p>
                                <input 
                                    type="number" 
                                    id="timerDuration" 
                                    name="timerDuration" 
                                    value={formData.timerDuration || 0} 
                                    onChange={handleChange} 
                                    className="w-full bg-gray-900 border border-yellow-500/50 rounded-lg px-4 py-2 focus:border-yellow-400 focus:outline-none"
                                    min="0"
                                    max="60"
                                />
                            </div>
                        )}

                        {/* TRIGGER TARGET - Only for Popunders */}
                        {isPopunder && (
                            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 animate-fade-in-up">
                                <label htmlFor="triggerTarget" className="block text-sm font-bold text-blue-300 mb-1">🎯 مكان التفعيل (Trigger Target)</label>
                                <p className="text-xs text-gray-400 mb-2">اختر العنصر الذي سيقوم بتفعيل الإعلان المنبثق عند الضغط عليه.</p>
                                <select id="triggerTarget" name="triggerTarget" value={formData.triggerTarget || 'all'} onChange={handleChange} className="w-full bg-gray-900 border border-blue-500/50 rounded-lg px-4 py-2 focus:border-blue-400 focus:outline-none">
                                    {Object.entries(triggerTargetLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                         <div className="pt-4">
                            <ToggleSwitch 
                                checked={formData.status === 'active'}
                                onChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'disabled' }))}
                                label={`الحالة: ${formData.status === 'active' ? 'مفعل' : 'غير مفعل'}`}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-700 gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            إلغاء
                        </button>
                        <button type="submit" className="bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black font-bold py-2 px-6 rounded-lg hover:bg-white transition-colors">
                            حفظ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdEditModal;
