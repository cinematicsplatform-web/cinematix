import React, { useRef, useState } from 'react';
import type { Content } from '@/types';
import { PlayIcon, StarIcon } from './ContentEditIcons';

interface MobileSimulatorProps {
    imageUrl: string;
    posX: number;
    posY: number;
    onUpdateX: (val: number) => void;
    onUpdateY: (val: number) => void;
    contentData: Content; 
    children?: React.ReactNode;
}

const MobileSimulator: React.FC<MobileSimulatorProps> = ({ imageUrl, posX, posY, onUpdateX, onUpdateY, contentData, children }) => {
    const cropClass = contentData.enableMobileCrop ? 'mobile-custom-crop' : '';
    const imgStyle: React.CSSProperties = { 
        '--mob-x': `${posX}%`, 
        '--mob-y': `${posY}%`,
        objectPosition: `${posX}% ${posY}%`
    } as React.CSSProperties;
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanning, setIsPanning] = useState(false);
    const startPosRef = useRef({ x: 0, y: 0 });
    const startPercentageRef = useRef({ x: posX, y: posY });

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsPanning(true);
        startPosRef.current = { x: e.clientX, y: e.clientY };
        startPercentageRef.current = { x: posX, y: posY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isPanning || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - startPosRef.current.x;
        const deltaY = e.clientY - startPosRef.current.y;

        const sensitivity = 0.5;
        let newX = startPercentageRef.current.x - (deltaX / rect.width) * 100 * sensitivity;
        let newY = startPercentageRef.current.y - (deltaY / rect.height) * 100 * sensitivity;

        newX = Math.max(0, Math.min(100, Math.round(newX)));
        newY = Math.max(0, Math.min(100, Math.round(newY)));

        onUpdateX(newX);
        onUpdateY(newY);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsPanning(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    return (
        <div className="mt-6 flex flex-col items-center gap-12 rounded-3xl border border-gray-800 bg-[#080a0f] p-4 md:p-8 md:flex-row md:items-start shadow-2xl">
            <div className="relative mx-auto flex-shrink-0 md:mx-0">
                <div 
                    ref={containerRef}
                    className="relative overflow-hidden rounded-[3rem] border-[10px] border-[#1f2127] bg-black shadow-2xl ring-1 ring-white/10 select-none touch-none scale-90 md:scale-100 origin-top"
                    style={{ width: '300px', height: '620px', cursor: isPanning ? 'grabbing' : 'grab' }} 
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                >
                    {children ? children : (
                        <div className="h-full bg-[#141b29] overflow-y-auto no-scrollbar scroll-smooth flex flex-col pointer-events-none">
                            <div className="relative h-[440px] w-full flex-shrink-0">
                                <img 
                                    src={imageUrl || 'https://placehold.co/1080x1920/101010/101010/png'} 
                                    className={`absolute inset-0 h-full w-full object-cover ${cropClass} object-top transition-none`}
                                    style={imgStyle}
                                    draggable={false}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#141b29] via-[#141b29]/40 via-30% to-transparent z-10"></div>
                                
                                <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 pb-8 text-white text-center pointer-events-none">
                                    {contentData.bannerNote && (
                                        <div className="mb-2 mx-auto text-[10px] font-bold bg-[#6366f1]/80 text-white border border-[#6366f1]/30 px-2 py-0.5 rounded backdrop-blur-md w-fit">
                                            {contentData.bannerNote}
                                        </div>
                                    )}
                                    <div className="mb-3">
                                        {contentData.isLogoEnabled && contentData.logoUrl ? (
                                            <img src={contentData.logoUrl} className="max-w-[160px] max-h-[100px] object-contain drop-shadow-2xl mx-auto" alt="" />
                                        ) : (
                                            <h1 className="text-2xl font-black drop-shadow-lg leading-tight">{contentData.title || 'العنوان'}</h1>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-200 mb-4 font-bold">
                                        <div className="flex items-center gap-1 text-yellow-400 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                                            <StarIcon className="w-2.5 h-2.5" />
                                            <span>{contentData.rating.toFixed(1)}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{contentData.releaseYear}</span>
                                        <span>•</span>
                                        <span className="px-1 border border-gray-500 rounded text-[8px]">{contentData.ageRating || 'G'}</span>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <div className="flex-1 bg-[var(--color-accent)] text-black h-10 rounded-full flex items-center justify-center font-black text-xs gap-2">
                                            <PlayIcon className="w-3 h-3 fill-black" />
                                            شاهد الآن
                                        </div>
                                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center font-bold text-lg">+</div>
                                    </div>
                                </div>
                                <div 
                                    className="absolute z-50 w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                                    style={{ left: `${posX}%`, top: `${posY}%` }}
                                >
                                    <div className="w-full h-full relative">
                                        <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
                                        <div className="absolute left-1/2 top-0 w-px h-full bg-white"></div>
                                        <div className="absolute inset-0 border-2 border-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="sticky top-0 z-30 bg-[#141b29]/95 backdrop-blur-md border-b border-white/5 flex gap-4 px-4 h-12 items-center flex-shrink-0">
                                <div className="text-[10px] font-black border-b-2 border-[var(--color-accent)] py-3 text-white">الحلقات</div>
                                <div className="text-[10px] font-black text-gray-500 py-3">التفاصيل</div>
                                <div className="text-[10px] font-black text-gray-500 py-3">أعمال مشابهة</div>
                            </div>
                            <div className="p-4 space-y-4 flex-1">
                                <p className="text-[11px] text-gray-400 leading-relaxed text-justify line-clamp-4">
                                    {contentData.description || 'قصة العمل تظهر هنا...'}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-right">
                                        <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">المخرج</span>
                                        <span className="text-[10px] font-bold text-gray-300 truncate block">{contentData.director || 'N/A'}</span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-right">
                                        <span className="block text-[8px] text-gray-500 font-bold uppercase mb-1">التقييم</span>
                                        <span className="text-[10px] font-bold text-yellow-400">★ {contentData.rating}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute top-0 left-1/2 z-30 h-7 w-36 -translate-x-1/2 rounded-b-2xl bg-[#1f2127] pointer-events-none"></div>
                    <div className="absolute top-3 right-6 z-30 h-3 w-3 rounded-full bg-gray-600/30 pointer-events-none"></div>
                    <div className="absolute bottom-2 left-1/2 z-30 h-1 w-32 -translate-x-1/2 rounded-full bg-white/20 pointer-events-none"></div>
                </div>
                <div className="mt-6 text-center font-mono text-xs text-gray-500 uppercase tracking-[0.2em]">Mobile Preview</div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-8 pt-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">تخصيص العرض للجوال</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            تحكم دقيق في نقطة تركيز الصورة (Focal Point) لتظهر بشكل مثالي على صفحة العرض الرسمية في الجوال. 
                        </p>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => { onUpdateX(50); onUpdateY(50); }}
                        className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-bold rounded-lg border border-gray-700 hover:bg-gray-700 transition-all shadow-sm"
                    >
                        إعادة ضبط
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-800 bg-[#161b22] p-6 shadow-lg transition-all hover:border-gray-700">
                        <label className="mb-4 flex justify-between text-sm font-bold text-gray-300">
                            <span className="flex items-center gap-2">↔️ الإزاحة الأفقية (X-Axis)</span>
                            <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-md">{posX}%</span>
                        </label>
                        <div className="relative h-6 flex items-center">
                            <input 
                                type="range" min="0" max="100" step="1"
                                value={posX}
                                onChange={(e) => onUpdateX(Number(e.target.value))}
                                className="absolute w-full h-2 rounded-lg bg-gray-700 accent-[var(--color-accent)] hover:accent-blue-400 cursor-grab active:cursor-grabbing appearance-none z-10"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-800 bg-[#161b22] p-6 shadow-lg transition-all hover:border-gray-700">
                        <label className="mb-4 flex justify-between text-sm font-bold text-gray-300">
                            <span className="flex items-center gap-2">↕️ الإزاحة العمودية (Y-Axis)</span>
                            <span className="font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-3 py-1 rounded-md">{posY}%</span>
                        </label>
                        <div className="relative h-6 flex items-center">
                            <input 
                                type="range" min="0" max="100" step="1"
                                value={posY}
                                onChange={(e) => onUpdateY(Number(e.target.value))}
                                className="absolute w-full h-2 rounded-lg bg-gray-700 accent-[var(--color-accent)] hover:accent-blue-400 cursor-grab active:cursor-grabbing appearance-none z-10"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileSimulator;
