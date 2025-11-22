
import React, { useState, useEffect } from 'react';
import type { Ad, AdPlacement } from '../types';
import { adPlacements, adPlacementLabels } from '../types';
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
        placement: 'home-top',
        status: 'active',
        updatedAt: new Date().toISOString(),
    });
    
    const [formData, setFormData] = useState<Ad>(isNew ? getInitialFormData() : { ...ad! });
    
    useEffect(() => {
        setFormData(isNew ? getInitialFormData() : { ...ad! });
    }, [ad, isNew]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.code.trim()) {
            alert('الرجاء تعبئة حقول العنوان وكود الإعلان.');
            return;
        }
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl text-white animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{isNew ? 'إضافة إعلان جديد' : 'تعديل الإعلان'}</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon/></button>
                    </div>
                    
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div>
                           <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">عنوان الإعلان</label>
                            <input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="مثال: بانر الصفحة الرئيسية" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2" required />
                        </div>
                        
                        <div>
                           <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">كود الإعلان (HTML / JS)</label>
                            <textarea id="code" name="code" value={formData.code} onChange={handleChange} placeholder="<a href='...'><img src='...'/></a>" className="w-full h-40 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 font-mono text-sm" required />
                        </div>

                         <div>
                           <label htmlFor="placement" className="block text-sm font-medium text-gray-300 mb-1">اختيار مكان العرض</label>
                           <select id="placement" name="placement" value={formData.placement} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2">
                               {adPlacements.map(key => (
                                 <option key={key} value={key}>{adPlacementLabels[key]}</option>
                               ))}
                           </select>
                        </div>

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
