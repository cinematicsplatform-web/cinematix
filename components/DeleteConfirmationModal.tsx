
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "تأكيد الحذف", 
    message = "هل أنت متأكد من حذف المحتوى؟" 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {/* Backdrop with blur and dim */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
                onClick={(e) => {
                    e.stopPropagation(); // Prevent closing parent modal
                    onClose();
                }}
            ></div>

            {/* Modal Content */}
            <div 
                className="relative bg-[#1f2937] border border-gray-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] w-full max-w-md transform transition-all animate-fade-in-up overflow-hidden"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing parent
            >
                
                {/* Header / Icon Area */}
                <div className="flex flex-col items-center pt-8 px-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="p-8 mt-2">
                    <div className="flex items-center justify-center gap-4">
                        {/* Yes Button (Right) - Red Capsule */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onConfirm();
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-600/30 transform hover:scale-105"
                        >
                            نعم، حذف
                        </button>

                        {/* Cancel Button (Left) - Outline Capsule */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="flex-1 bg-transparent border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 hover:bg-gray-800 font-bold py-3 px-6 rounded-full transition-all duration-300"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>

                {/* Close X Top Right */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
