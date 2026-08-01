import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StartupAd, Content } from '../../types';
import { CloseIcon } from '../icons/CloseIcon';

interface StartupAdModalProps {
    adConfig: StartupAd;
    allContent: Content[];
    onClose: () => void;
    onSelectContent: (content: Content) => void;
}

const StartupAdModal: React.FC<StartupAdModalProps> = ({ adConfig, allContent, onClose, onSelectContent }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [logoFailed, setLogoFailed] = useState(false);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to finish
    };

    const handleClick = () => {
        if (adConfig.linkType === 'content' && adConfig.targetContentId) {
            const content = allContent.find(c => c.id === adConfig.targetContentId);
            if (content) {
                onSelectContent(content);
            }
        } else if (adConfig.linkType === 'external' && adConfig.externalUrl) {
            window.open(adConfig.externalUrl, '_blank');
        }
        handleClose();
    };

    // Linked content object if linkType === 'content'
    const targetContent = adConfig.linkType === 'content' && adConfig.targetContentId 
        ? allContent.find(c => c.id === adConfig.targetContentId) 
        : null;

    // Determine main image URL
    const imageUrl = adConfig.imageUrlPc || adConfig.imageUrlMobile || targetContent?.backdrop || targetContent?.poster;

    // Determine button text
    const buttonLabel = adConfig.buttonText && adConfig.buttonText.trim() !== ''
        ? adConfig.buttonText
        : (adConfig.linkType === 'external' ? 'زيارة الرابط' : 'شاهد الآن');

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 dir-rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-2xl md:max-w-3xl overflow-hidden rounded-3xl shadow-2xl border border-amber-500/20 bg-zinc-950 group cursor-pointer"
                        onClick={handleClick}
                    >
                        {/* Close button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-amber-500 hover:text-black backdrop-blur-md transition-all border border-white/20 shadow-xl"
                            title="إغلاق"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>

                        {/* Badge / Tag */}
                        {adConfig.badgeText && adConfig.badgeText.trim() && (
                            <div className="absolute top-4 left-4 z-30 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs md:text-sm px-4 py-1.5 rounded-full shadow-2xl border border-amber-300/50 flex items-center gap-1.5 animate-bounce-subtle pointer-events-none">
                                <span className="w-2 h-2 rounded-full bg-black/50 animate-ping" />
                                <span>{adConfig.badgeText}</span>
                            </div>
                        )}

                        {/* Image Container - Displays complete uncropped image */}
                        <div className="relative w-full max-h-[75vh] md:max-h-[80vh] flex items-center justify-center bg-zinc-950 overflow-hidden min-h-[320px]">
                            {/* Blurred ambient background image */}
                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35 pointer-events-none"
                                />
                            )}

                            {/* Main Uncropped Image */}
                            <picture className="relative z-0 w-full h-full max-h-[75vh] md:max-h-[80vh] flex items-center justify-center">
                                {adConfig.imageUrlPc && adConfig.imageUrlMobile ? (
                                    <>
                                        <source media="(min-width: 768px)" srcSet={adConfig.imageUrlPc} />
                                        <source media="(max-width: 767px)" srcSet={adConfig.imageUrlMobile} />
                                    </>
                                ) : adConfig.imageUrlPc ? (
                                    <source media="(min-width: 0px)" srcSet={adConfig.imageUrlPc} />
                                ) : adConfig.imageUrlMobile ? (
                                    <source media="(min-width: 0px)" srcSet={adConfig.imageUrlMobile} />
                                ) : null}
                                <img
                                    src={imageUrl}
                                    alt={adConfig.name || "إعلان"}
                                    className="w-full h-auto max-h-[75vh] md:max-h-[80vh] object-contain block mx-auto transition-transform duration-700 group-hover:scale-[1.02]"
                                />
                            </picture>

                            {/* Bottom Dark Gradient Overlay for Text & Action Controls */}
                            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/90 via-60% to-transparent pt-20 pb-6 px-5 md:px-8 flex flex-col items-center justify-end text-center gap-2.5 pointer-events-none">
                                
                                {/* 1. Content Logo or Title */}
                                {targetContent ? (
                                    <>
                                        {targetContent.logoUrl && !logoFailed ? (
                                            <img
                                                src={targetContent.logoUrl}
                                                alt={targetContent.title}
                                                onError={() => setLogoFailed(true)}
                                                className="max-h-12 md:max-h-16 w-auto max-w-[240px] md:max-w-[300px] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] filter my-1"
                                            />
                                        ) : (
                                            <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-md tracking-wide">
                                                {targetContent.title}
                                            </h3>
                                        )}

                                        {/* 2. Short 2-line story summary */}
                                        {targetContent.description && (
                                            <p className="text-xs md:text-sm text-gray-200/90 font-medium max-w-xl mx-auto line-clamp-2 leading-relaxed text-center drop-shadow-md">
                                                {targetContent.description}
                                            </p>
                                        )}

                                        {/* 3. Genres / Categories Tags */}
                                        {((targetContent.genres && targetContent.genres.length > 0) || (targetContent.categories && targetContent.categories.length > 0)) && (
                                            <div className="flex flex-wrap items-center justify-center gap-1.5 my-1">
                                                {targetContent.genres?.slice(0, 3).map((genre) => (
                                                    <span
                                                        key={genre}
                                                        className="text-[11px] bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-bold px-3 py-0.5 rounded-full shadow-sm"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                                {targetContent.categories?.slice(0, 2).map((cat) => (
                                                    <span
                                                        key={cat}
                                                        className="text-[11px] bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-200 font-bold px-3 py-0.5 rounded-full shadow-sm"
                                                    >
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* If not linked to content, show custom text if present */
                                    adConfig.customText && adConfig.customText.trim() ? (
                                        <div className="bg-black/80 backdrop-blur-md text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded-2xl border border-amber-500/40 text-center shadow-2xl max-w-lg leading-relaxed">
                                            {adConfig.customText}
                                        </div>
                                    ) : null
                                )}

                                {/* 4. Action Button */}
                                {(adConfig.linkType === 'content' || adConfig.linkType === 'external' || adConfig.buttonText) && (
                                    <div className="mt-2 flex justify-center">
                                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 text-black px-8 py-3 rounded-full font-black text-xs md:text-sm shadow-2xl shadow-amber-500/40 group-hover:scale-105 transition-all flex items-center gap-2 border border-amber-300/40">
                                            <span>{buttonLabel}</span>
                                            <span className="text-base font-bold">←</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default StartupAdModal;

