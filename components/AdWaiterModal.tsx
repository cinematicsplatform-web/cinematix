
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Ad } from '../types';
import { CloseIcon } from './icons/CloseIcon';

interface AdWaiterModalProps {
    isOpen: boolean;
    ad: Ad;
    onComplete: () => void;
    onClose: () => void;
}

const AdWaiterModal: React.FC<AdWaiterModalProps> = ({ isOpen, ad, onComplete, onClose }) => {
    const [timeLeft, setTimeLeft] = useState<number>(ad.timerDuration || 0);
    const [canSkip, setCanSkip] = useState<boolean>(false);
    const adContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            const duration = ad.timerDuration && ad.timerDuration > 0 ? ad.timerDuration : 0;
            setTimeLeft(duration);
            setCanSkip(duration === 0);
            
            // Prevent scrolling
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, ad]);

    // Timer Logic
    useEffect(() => {
        if (!isOpen || timeLeft <= 0) {
            if (isOpen && timeLeft === 0) setCanSkip(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCanSkip(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, timeLeft]);

    // Script Injection Logic (for 'code' type ads)
    useEffect(() => {
        if (isOpen && adContainerRef.current) {
            adContainerRef.current.innerHTML = ''; // Clear previous

            if (ad.type === 'banner' && ad.imageUrl) {
                // Banners are rendered via JSX below, so skip here
            } else {
                // Render Code/Script
                try {
                    const range = document.createRange();
                    range.selectNode(adContainerRef.current);
                    // Use 'code' or 'scriptCode' depending on what's saved
                    const codeContent = ad.code || ad.scriptCode || '';
                    const fragment = range.createContextualFragment(codeContent);
                    adContainerRef.current.appendChild(fragment);
                } catch (e) {
                    console.error("AdWaiter Script Error:", e);
                }
            }
        }
    }, [isOpen, ad]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in-up p-4">
            <div className="relative w-full max-w-4xl flex flex-col items-center justify-center h-full max-h-screen">
                
                {/* Header / Timer Status */}
                <div className="absolute top-4 right-4 md:right-0 z-50">
                     {!canSkip ? (
                        <div className="bg-black/60 border border-gray-500 rounded-full px-6 py-2 flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                            <span className="text-white font-bold text-sm">يرجى الانتظار... {timeLeft} ثانية</span>
                        </div>
                     ) : (
                        <button 
                            onClick={onComplete}
                            className="bg-green-600 hover:bg-green-500 text-white border border-green-400 rounded-full px-6 py-3 flex items-center gap-2 font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all hover:scale-105"
                        >
                            <span>تخطي الإعلان والمتابعة</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                     )}
                </div>
                
                {/* Ad Content Container */}
                <div className="w-full h-full flex items-center justify-center p-4 md:p-10 overflow-hidden">
                    {ad.type === 'banner' && ad.imageUrl ? (
                         <a href={ad.destinationUrl || '#'} target="_blank" rel="noopener noreferrer" className="max-w-full max-h-full">
                             <img 
                                src={ad.imageUrl} 
                                alt={ad.title} 
                                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-gray-800"
                             />
                         </a>
                    ) : (
                        <div 
                            ref={adContainerRef} 
                            className="w-full h-full flex items-center justify-center overflow-auto"
                        />
                    )}
                </div>
                
                {/* Footer info */}
                <div className="absolute bottom-6 text-gray-500 text-xs">
                    إعلان ممول - {ad.title}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AdWaiterModal;
