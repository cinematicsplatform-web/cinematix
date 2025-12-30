import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Content, Server, Season, Episode, Category, Genre } from '@/types';
import { ContentType, genres } from '@/types';
import { db, generateSlug, getPeople, savePerson } from '@/firebase'; 
import DeleteConfirmationModal from './DeleteConfirmationModal';
import ToggleSwitch from './ToggleSwitch';
import * as XLSX from 'xlsx';
import UqloadSearchModal from './UqloadSearchModal';
import { normalizeText } from '@/utils/textUtils';

// --- ICONS (Professional Custom SVGs) ---
const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);
const DashboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
);
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);
const LayersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
);
const ServerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.072 0 2.065.49 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
    </svg>
);
const ExitIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296a3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068-1.593a3.746 3.746 0 011.043 3.296a3.745 3.745 0 0121 12z" />
    </svg>
);
const AdultIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);
const CheckSmallIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" {...props}>
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
    </svg>
);
const CloudArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3.01 3.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);
const ExcelIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653z" />
    </svg>
);
const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 0-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

// --- REFINED STYLES ---
const INPUT_BG = "bg-[#161b22]"; 
const BORDER_COLOR = "border-gray-700/50";
const FOCUS_RING = "focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]";

const inputClass = `w-full ${INPUT_BG} border ${BORDER_COLOR} rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none ${FOCUS_RING} transition-all duration-300 text-sm shadow-sm`;
const labelClass = "block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide";
const sectionBoxClass = "bg-[#0f1014] p-8 rounded-2xl border border-gray-800 shadow-xl";

// --- HELPERS ---
const getRowValue = (row: any, ...candidates: string[]) => {
    const rowKeys = Object.keys(row);
    for (const candidate of candidates) {
        if (row[candidate] !== undefined && row[row[candidate]] !== null) return row[candidate];
        const foundKey = rowKeys.find(k => k.trim().toLowerCase() === candidate.trim().toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) return row[foundKey];
    }
    return null;
};

const SEARCH_CATEGORIES = [
    'مصري', 'عربي', 'تركي', 'أجنبي', 'برامج',
    'رومانسي', 'عائلي', 'كوميديا', 'دراما', 'أكشن',
    'جريمة', 'خيال علمي', 'رعب', 'تركي مدبلج', 'مسرح', 'قريباً'
];

interface MobileSimulatorProps {
    imageUrl: string;
    posX: number;
    posY: number;
    onUpdateX: (val: number) => void;
    onUpdateY: (val: number) => void;
}

const MobileSimulator: React.FC<MobileSimulatorProps> = ({ imageUrl, posX, posY, onUpdateX, onUpdateY }) => {
    return (
        <div className="mt-6 flex flex-col items-center gap-12 rounded-3xl border border-gray-800 bg-[#080a0f] p-8 md:flex-row md:items-start shadow-2xl">
            <div className="relative mx-auto flex-shrink-0 md:mx-0">
                <div 
                    className="relative overflow-hidden rounded-[3rem] border-[10px] border-[#1f2127] bg-black shadow-2xl ring-1 ring-white/10"
                    style={{ width: '300px', height: '620px' }} 
                >
                    <div 
                        className="absolute inset-0 h-full w-full bg-cover bg-no-repeat transition-all duration-100 ease-out"
                        style={{ 
                            backgroundImage: `url(${imageUrl || 'https://placehold.co/1080x1920/101010/101010/png'})`, 
                            backgroundPosition: `${posX}% ${posY}%` 
                        }}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/60 via-30% to-transparent pointer-events-none"></div>

                    <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col justify-end items-center text-center z-10 pointer-events-none">
                        <div className="w-3/4 h-12 bg-white/10 rounded-lg backdrop-blur-sm mb-3 skeleton-shimmer"></div>
                        <div className="flex gap-2 mb-3 justify-center opacity-70">
                            <div className="w-8 h-4 bg-white/20 rounded"></div>
                            <div className="w-12 h-4 bg-white/20 rounded"></div>
                            <div className="w-8 h-4 bg-white/20 rounded"></div>
                        </div>
                        <div className="flex gap-3 w-full justify-center">
                            <div className="w-full h-10 bg-[var(--color-accent)] rounded-xl shadow-lg"></div>
                            <div className="w-12 h-10 bg-white/10 rounded-xl"></div>
                        </div>
                    </div>

                    <div className="absolute top-0 left-1/2 z-30 h-7 w-36 -translate-x-1/2 rounded-b-2xl bg-[#1f2127]"></div>
                    <div className="absolute top-3 right-6 z-30 h-3 w-3 rounded-full bg-gray-600/30"></div>
                    <div className="absolute bottom-2 left-1/2 z-30 h-1 w-32 -translate-x-1/2 rounded-full bg-white/20"></div>
                </div>
                <div className="mt-6 text-center font-mono text-xs text-gray-500 uppercase tracking-[0.2em]">Mobile Preview</div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-8 pt-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">تخصيص العرض للجوال</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        تحكم دقيق في نقطة تركيز الصورة (Focal Point) لتظهر بشكل مثالي على جميع شاشات الهواتف. 
                        الصورة المعروضة في الهاتف تمثل كيف سيراها المستخدم بالضبط مع تراكب النصوص والأزرار.
                    </p>
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
                        <div className="mt-3 flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            <span>Left</span>
                            <span>Right</span>
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
                         <div className="mt-3 flex justify-between text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                            <span>Top</span>
                            <span>Bottom</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ImageGalleryModalProps {
    isOpen: boolean;
    onClose: () => void;
    tmdbId: string;
    type: ContentType; 
    targetField: 'poster' | 'backdrop' | 'logo';
    onSelect: (url: string) => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ isOpen, onClose, tmdbId, type, targetField, onSelect }) => {
    const [images, setImages] = useState<{ posters: any[], backdrops: any[], logos: any[] }>({ posters: [], backdrops: [], logos: [] });
    const [loading, setLoading] = useState(false);
    const [filterLang, setFilterLang] = useState<string>('all'); 

    const activeTab = useMemo(() => {
        if (targetField === 'poster') return 'posters';
        if (targetField === 'logo') return 'logos';
        return 'backdrops';
    }, [targetField]);

    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

    useEffect(() => {
        if (isOpen && tmdbId) {
            fetchImages();
        }
    }, [isOpen, tmdbId]);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const endpointType = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert) ? 'movie' : 'tv';
            const res = await fetch(`https://api.themoviedb.org/3/${endpointType}/${tmdbId}/images?api_key=${API_KEY}&include_image_language=ar,en,null`);
            const data = await res.json();
            setImages({
                posters: data.posters || [],
                backdrops: data.backdrops || [],
                logos: data.logos || []
            });
        } catch (error) {
            console.error("Error fetching images:", error);
        } finally {
            setLoading(false);
        }
    };

    const displayedImages = useMemo(() => {
        const list = images[activeTab] || [];
        if (filterLang === 'all') return list;
        if (filterLang === 'null') return list.filter((img: any) => img.iso_639_1 === null);
        return list.filter((img: any) => img.iso_639_1 === filterLang);
    }, [images, activeTab, filterLang]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#0f1014] shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-6 py-4">
                    <h3 className="flex items-center gap-3 text-xl font-bold text-white">
                        <PhotoIcon className="w-6 h-6 text-[var(--color-accent)]"/>
                        معرض الصور 
                        <span className="rounded bg-[var(--color-accent)]/10 px-2 py-0.5 text-xs text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                            {activeTab === 'posters' ? 'بوسترات' : activeTab === 'logos' ? 'شعارات' : 'خلفيات'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-3">
                        <select 
                            value={filterLang} 
                            onChange={(e) => setFilterLang(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-xs text-white focus:border-[var(--color-accent)] focus:outline-none"
                        >
                            <option value="all">كل اللغات</option>
                            <option value="ar">العربية (AR)</option>
                            <option value="en">الإنجليزية (EN)</option>
                            <option value="null">بدون نص (Clean)</option>
                        </select>
                        <button onClick={onClose} className="rounded-lg bg-gray-800 p-2 text-gray-400 transition-colors hover:bg-red-500 hover:text-white">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto bg-[#0a0a0a] p-6">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">جاري تحميل الصور...</div>
                    ) : displayedImages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-gray-500">لا توجد صور مطابقة للفلتر المحدد.</div>
                    ) : (
                        <div className={`grid gap-6 ${activeTab === 'posters' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3'}`}>
                            {displayedImages.map((img: any, idx: number) => (
                                <div key={idx} onClick={() => { onSelect(`https://image.tmdb.org/t/p/original${img.file_path}`); onClose(); }} className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-all hover:border-[var(--color-accent)] hover:shadow-lg hover:shadow-[var(--color-accent)]/10">
                                    <img 
                                        src={`https://image.tmdb.org/t/p/w500${img.file_path}`} 
                                        loading="lazy" 
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        alt=""
                                    />
                                    <div className="absolute top-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-md border border-white/10">
                                        {img.iso_639_1?.toUpperCase() || 'NO-TEXT'}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                                        <span className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-black shadow-lg">اختيار</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-800 bg-[#161b22] p-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white"
                    >
                        <CloseIcon className="h-4 w-4" />
                        إغلاق المعرض
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ServerManagementModalProps {
    episode: Episode;
    onClose: () => void;
    onSave: (servers: Server[]) => void;
    onOpenSearch: () => void;
}

const ServerManagementModal: React.FC<ServerManagementModalProps> = ({ episode, onClose, onSave, onOpenSearch }) => {
    const [servers, setServers] = useState<Server[]>(() => {
        const existing = [...(episode.servers || [])];
        if (existing.length === 0) {
            existing.push({ id: Date.now(), name: 'سيرفر 1', url: '', downloadUrl: '', isActive: true });
        }
        return existing;
    });

    const handleServerChange = (index: number, field: keyof Server, value: string | boolean) => {
        const updatedServers = [...servers];
        updatedServers[index] = { ...updatedServers[index], [field]: value };
        setServers(updatedServers);
    };

    const handleAddServer = () => {
        setServers([...servers, { 
            id: Date.now() + servers.length, 
            name: `سيرفر ${servers.length + 1}`, 
            url: '', 
            downloadUrl: '', 
            isActive: true 
        }]);
    };

    const handleRemoveServer = (index: number) => {
        if (servers.length <= 1) {
            handleServerChange(0, 'url', '');
            handleServerChange(0, 'downloadUrl', '');
            return;
        }
        setServers(servers.filter((_, i) => i !== index));
    };

    const handleSaveServers = () => {
        const serversToSave = servers.filter(s => (s.url && s.url.trim() !== '') || (s.downloadUrl && s.downloadUrl.trim() !== ''));
        onSave(serversToSave);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className={`w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-800 bg-[#0f1014] text-white shadow-2xl animate-fade-in-up`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-800 bg-[#161b22] px-6 py-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                         <ServerIcon className="w-5 h-5 text-[var(--color-accent)]"/>
                         إدارة السيرفرات: <span className="text-[var(--color-accent)]">{episode.title}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={onOpenSearch} className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 transition-colors hover:bg-blue-500/20 hover:border-blue-500/40">
                            <SearchIcon className="w-4 h-4"/>
                            <span>بحث Uqload</span>
                        </button>
                        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-6 space-y-4 bg-[#0a0a0a]">
                    {servers.map((server, index) => (
                          <div key={index} className="relative group/s rounded-xl border border-gray-800 bg-[#161b22] p-5 space-y-4 hover:border-gray-700 transition-colors">
                            <button 
                                onClick={() => handleRemoveServer(index)}
                                className="absolute -top-2 -left-2 z-20 rounded-full bg-red-600 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover/s:opacity-100"
                                title="حذف السيرفر"
                            >
                                <CloseIcon className="h-3 w-3" />
                            </button>

                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                              <div className="flex w-full items-center gap-3 sm:w-auto">
                                  <span className="flex h-6 w-6 items-center justify-center rounded bg-black/30 font-mono text-xs text-gray-500">{index + 1}</span>
                                  <input 
                                    value={server.name} 
                                    onChange={(e) => handleServerChange(index, 'name', e.target.value)} 
                                    placeholder="اسم السيرفر" 
                                    className={`w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:outline-none ${FOCUS_RING} sm:w-48`}
                                  />
                              </div>
                              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 bg-black px-3 py-1.5 text-sm transition-colors hover:border-[var(--color-accent)]">
                                <input type="checkbox" checked={server.isActive} onChange={(e) => handleServerChange(index, 'isActive', e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)] rounded"/> 
                                <span className={server.isActive ? "text-[var(--color-accent)] font-bold text-xs" : "text-gray-400 text-xs"}>نشط</span>
                              </label>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">رابط المشاهدة (Watch URL)</label>
                                    <input 
                                        value={server.url} 
                                        onChange={(e) => handleServerChange(index, 'url', e.target.value)} 
                                        placeholder="رابط المشاهدة (mp4, m3u8, embed...)" 
                                        className={`w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:outline-none ${FOCUS_RING} dir-ltr placeholder:text-right text-left`}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-bold text-gray-500 uppercase">رابط التحميل (Download URL)</label>
                                    <input 
                                        value={server.downloadUrl} 
                                        onChange={(e) => handleServerChange(index, 'downloadUrl', e.target.value)} 
                                        placeholder="رابط التحميل المباشر" 
                                        className={`w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:outline-none ${FOCUS_RING} dir-ltr placeholder:text-right text-left`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <button 
                        type="button"
                        onClick={handleAddServer}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 bg-[#161b22]/50 py-4 font-bold text-gray-400 transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 hover:text-[var(--color-accent)]"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>إضافة سيرفر جديد</span>
                    </button>
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-800 bg-[#161b22] p-6">
                    <button type="button" onClick={onClose} className="rounded-lg bg-gray-700 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-600">إلغاء</button>
                    <button type="button" onClick={handleSaveServers} className="rounded-lg bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] px-8 py-2 text-sm font-bold text-black shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_var(--shadow-color)]">حفظ التغييرات</button>
                </div>
            </div>
        </div>
    );
};

interface ContentEditModalProps {
    content: Content | null;
    onClose: () => void; 
    onSave: (content: Content) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ContentEditModal: React.FC<ContentEditModalProps> = ({ content, onClose, onSave, addToast }) => {
    const isNewContent = content === null;
    const [activeTab, setActiveTab] = useState('general');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const getDefaultFormData = (): Content => ({
        id: '', tmdbId: '', title: '', description: '', type: ContentType.Movie, poster: '', top10Poster: '', backdrop: '', horizontalPoster: '', mobileBackdropUrl: '',
        rating: 0, ageRating: '', categories: [], genres: [], releaseYear: new Date().getFullYear(), cast: [],
        visibility: 'general', seasons: [], servers: [], bannerNote: '', createdAt: '',
        logoUrl: '', isLogoEnabled: false, trailerUrl: '', duration: '', enableMobileCrop: false, 
        mobileCropPositionX: 50, mobileCropPositionY: 50, 
        slug: '',
        director: '', writer: '',
        ...content,
    });

    const [formData, setFormData] = useState<Content>(getDefaultFormData());
    const [editingServersForEpisode, setEditingServersForEpisode] = useState<Episode | null>(null);
    const [isManagingMovieServers, setIsManagingMovieServers] = useState<boolean>(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!content?.slug);
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
    
    const [castQuery, setCastQuery] = useState('');
    const [castResults, setCastResults] = useState<any[]>([]);
    const [isSearchingCast, setIsSearchingCast] = useState(false);

    const [galleryState, setGalleryState] = useState<{
        isOpen: boolean;
        imageType: 'poster' | 'backdrop' | 'logo';
        onSelect: (url: string) => void;
    }>({ isOpen: false, imageType: 'poster', onSelect: () => {} });

    const globalFileInputRef = useRef<HTMLInputElement>(null);
    
    const [deleteSeasonState, setDeleteSeasonState] = useState<{
        isOpen: boolean;
        seasonId: number | null;
        title: string;
    }>({ isOpen: false, seasonId: null, title: '' });

    const [deleteEpisodeState, setDeleteEpisodeState] = useState<{
        isOpen: boolean;
        seasonId: number | null;
        episodeId: number | null;
        title: string;
    }>({ isOpen: false, seasonId: null, episodeId: null, title: '' });

    const [isUqloadModalOpen, setIsUqloadModalOpen] = useState(false);

    const [tmdbIdInput, setTmdbIdInput] = useState(content?.id && !isNaN(Number(content.id)) ? content.id : '');
    const [fetchLoading, setFetchLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false); 
    const [enableAutoLinks, setEnableAutoLinks] = useState(false);
    const API_KEY = 'b8d66e320b334f4d56728d98a7e39697';

    const [tmdbSearchMode, setTmdbSearchMode] = useState<'id' | 'name'>('name');
    const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
    const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
    const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);

    const isEpisodic = formData.type === ContentType.Series || formData.type === ContentType.Program;
    const isStandalone = !isEpisodic;

    const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        const initData = getDefaultFormData();
        if (initData.mobileCropPosition !== undefined && initData.mobileCropPositionX === undefined) {
            initData.mobileCropPositionX = initData.mobileCropPosition;
        }
        
        if (!initData.tmdbId && initData.id && !isNaN(Number(initData.id))) {
            initData.tmdbId = initData.id;
        }

        setFormData(initData);
        setSlugManuallyEdited(!!content?.slug);
        setTmdbIdInput(content?.id && !isNaN(Number(content.id)) ? content.id : '');
    }, [content]);

    useEffect(() => {
        if (formData.backdrop && !formData.mobileBackdropUrl) {
            if (!timersRef.current['main']) {
                timersRef.current['main'] = setTimeout(() => {
                    setFormData(prev => {
                        if (prev.backdrop && !prev.mobileBackdropUrl) {
                            return { ...prev, mobileBackdropUrl: prev.backdrop };
                        }
                        return prev;
                    });
                    delete timersRef.current['main'];
                }, 5000);
            }
        } else if (timersRef.current['main']) {
            clearTimeout(timersRef.current['main']);
            delete timersRef.current['main'];
        }

        if (formData.seasons && isEpisodic) {
            formData.seasons.forEach(s => {
                const sId = String(s.id);
                const effectiveBackdrop = s.backdrop || formData.backdrop;
                if (expandedSeasons.has(s.id) && effectiveBackdrop && !s.mobileImageUrl) {
                    if (!timersRef.current[sId]) {
                        timersRef.current[sId] = setTimeout(() => {
                            setFormData(prev => ({
                                ...prev,
                                seasons: prev.seasons?.map(item => 
                                    (item.id === s.id && !item.mobileImageUrl) 
                                    ? { ...item, mobileImageUrl: item.backdrop || prev.backdrop } 
                                    : item
                                )
                            }));
                            delete timersRef.current[sId];
                        }, 5000);
                    }
                } else if (timersRef.current[sId]) {
                    clearTimeout(timersRef.current[sId]);
                    delete timersRef.current[sId];
                }
            });
        }

        return () => {
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, [formData.backdrop, formData.mobileBackdropUrl, formData.seasons, expandedSeasons, isEpisodic]);

    const openGallery = (type: 'poster' | 'backdrop' | 'logo', callback: (url: string) => void) => {
        const idToUse = formData.tmdbId || formData.id;
        if (!idToUse) {
            addToast("يرجى جلب بيانات المحتوى أولاً (ID مطلوب) لفتح المعرض.", "info");
            return;
        }
        setGalleryState({ isOpen: true, imageType: type, onSelect: callback });
    };

    const renderImageInput = (
        label: string, 
        value: string | undefined, 
        onChange: (val: string) => void,
        galleryType: 'poster' | 'backdrop' | 'logo',
        placeholder: string = "https://...",
        previewClass: string = "w-12 h-16"
    ) => (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="flex items-stretch gap-2">
                <input 
                    type="text" 
                    value={value || ''} 
                    onChange={(e) => onChange(e.target.value)} 
                    className={`${inputClass} flex-1 dir-ltr`} 
                    placeholder={placeholder} 
                />
                <button 
                    type="button" 
                    onClick={() => openGallery(galleryType, onChange)} 
                    className="flex items-center justify-center rounded-lg bg-gray-800 px-4 text-white shadow-md transition-all hover:bg-gray-700 hover:text-[var(--color-accent)] border border-gray-700" 
                    title="اختر من المعرض"
                >
                    <PhotoIcon className="w-5 h-5"/>
                </button>
                {value && (
                    <div className={`${previewClass} bg-black flex-shrink-0 overflow-hidden rounded-lg border border-gray-700 shadow-sm`}>
                        <img src={value} className="h-full w-full object-cover" alt="preview" />
                    </div>
                )}
            </div>
        </div>
    );

    const searchCast = async (query: string) => {
        setCastQuery(query);
        if (query.length < 2) {
            setCastResults([]);
            return;
        }
        setIsSearchingCast(true);
        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar-SA`);
            const data = await res.json();
            if (data.results) {
                setCastResults(data.results);
            }
        } catch (error) {
            console.error("Cast Search Error:", error);
        } finally {
            setIsSearchingCast(false);
        }
    };

    const addCastMember = (person: any) => {
        if (!formData.cast.includes(person.name)) {
            setFormData(prev => ({ ...prev, cast: [...prev.cast, person.name] }));
        }
        setCastQuery('');
        setCastResults([]);
    };

    const removeCastMember = (name: string) => {
        setFormData(prev => ({ ...prev, cast: prev.cast.filter(c => c !== name) }));
    };

    const generateEpisodeServers = (tmdbId: string, seasonNum: number, episodeNum: number): Server[] => {
         const epServers: Server[] = [];
         if (enableAutoLinks) {
             const vipUrl = `https://vidsrc.vip/embed/tv/${tmdbId}/${seasonNum}/${episodeNum}`;
             epServers.push({
                 id: 80000 + episodeNum,
                 name: 'Cinematix VIP (سريع)',
                 url: vipUrl,
                 downloadUrl: vipUrl,
                 isActive: true
             });
         }
         return epServers;
    };

    const generateMovieServers = (tmdbId: string): Server[] => {
        const movieServers: Server[] = [];
        if (enableAutoLinks) {
            const vipUrl = `https://vidsrc.vip/embed/movie/${tmdbId}`;
            movieServers.push({
                id: 99901,
                name: 'Cinematix VIP (سريع)',
                url: vipUrl,
                downloadUrl: vipUrl,
                isActive: true
            });
        }
        return movieServers;
    };

    const searchTMDB = async () => {
        if (!tmdbSearchQuery.trim()) return;
        setIsSearchingTMDB(true);
        setTmdbSearchResults([]);

        try {
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(tmdbSearchQuery)}&language=ar-SA&page=1&include_adult=false`);
            const data = await res.json();
            
            if (data.results) {
                const filtered = data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
                setTmdbSearchResults(filtered);
            }
        } catch (e) {
            console.error("TMDB Search Error:", e);
            addToast("حدث خطأ أثناء البحث في TMDB.", "error");
        } finally {
            setIsSearchingTMDB(false);
        }
    };

    const handleSelectSearchResult = (result: any) => {
        setTmdbIdInput(String(result.id));
        if (result.media_type === 'movie') {
            setFormData(prev => ({ ...prev, type: ContentType.Movie }));
        } else if (result.media_type === 'tv') {
            setFormData(prev => ({ ...prev, type: ContentType.Series }));
        }
        fetchFromTMDB(String(result.id), result.media_type === 'movie' ? ContentType.Movie : ContentType.Series);
        setTmdbSearchResults([]);
        setTmdbSearchQuery('');
    };

    const fetchSeasonDetails = async (tmdbId: string, seasonNumber: number) => {
        try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${API_KEY}&language=ar-SA`);
            if (res.ok) return await res.json();
            return null;
        } catch (e) {
            console.warn(`Failed to fetch season ${seasonNumber}`, e);
            return null;
        }
    };

    const fetchFromTMDB = async (overrideId?: string, overrideType?: ContentType, isUpdateMode: boolean = false) => {
        const targetId = overrideId || tmdbIdInput;
        if (!targetId) return;
        
        if (!isUpdateMode) setFetchLoading(true);
        let currentType = overrideType || formData.type;
        
        try {
            const getUrl = (type: ContentType, lang: string, path: string = '') => {
                const typePath = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert) ? 'movie' : 'tv';
                const append = (type === ContentType.Movie || type === ContentType.Play || type === ContentType.Concert)
                    ? 'credits,release_dates,videos,images' 
                    : 'content_ratings,credits,videos,images'; 
                return `https://api.themoviedb.org/3/${typePath}/${targetId}${path}?api_key=${API_KEY}&language=${lang}&append_to_response=${append}&include_image_language=${lang},en,null`;
            };

            let res = await fetch(getUrl(currentType, 'ar-SA'));
            if (!res.ok && res.status === 404 && !isUpdateMode) {
                const altType = isStandalone ? ContentType.Series : ContentType.Movie;
                const resAlt = await fetch(getUrl(altType, 'ar-SA'));
                if (resAlt.ok) {
                    res = resAlt;
                    currentType = altType; 
                }
            }

            if (!res.ok) throw new Error('لم يتم العثور على محتوى بهذا الـ ID. تأكد من صحة الرقم.');
            let details = await res.json();
            const originLang = details.original_language;
            
            let autoCategory: Category = 'افلام اجنبية'; 
            if (currentType === ContentType.Series || currentType === ContentType.Program) {
                if (originLang === 'tr') autoCategory = 'مسلسلات تركية';
                else if (originLang === 'ar') autoCategory = 'مسلسلات عربية';
                else autoCategory = 'مسلسلات اجنبية';
            } else {
                if (originLang === 'tr') autoCategory = 'افلام تركية';
                else if (originLang === 'ar') autoCategory = 'افلام عربية';
                else if (originLang === 'hi') autoCategory = 'افلام هندية';
                else autoCategory = 'افلام اجنبية';
            }

            if (originLang !== 'ar') {
                const resEn = await fetch(getUrl(currentType, 'en-US'));
                if (resEn.ok) {
                    const enDetails = await resEn.json();
                    if (!details.overview) details.overview = enDetails.overview;
                    if (enDetails.images) details.images = enDetails.images;
                    if (enDetails.videos) details.videos = enDetails.videos;
                }
            }

            const title = details.title || details.name || '';
            const description = details.overview || ''; 
            const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
            const backdrop = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
            const rating = details.vote_average ? Number((details.vote_average / 2).toFixed(1)) : 0;
            const releaseDate = details.release_date || details.first_air_date || '';
            const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
            
            let trailerUrl = '';
            if (details.videos && details.videos.results) {
                let trailer = details.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
                if (!trailer) trailer = details.videos.results.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube');
                if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
            }

            let logoUrl = '';
            if (details.images && details.images.logos && details.images.logos.length > 0) {
                let logoNode = details.images.logos.find((img: any) => img.iso_639_1 === 'ar');
                if (!logoNode) logoNode = details.images.logos.find((img: any) => img.iso_639_1 === 'en');
                if (!logoNode) logoUrl = `https://image.tmdb.org/t/p/w500${details.images.logos[0].file_path}`;
                else logoUrl = `https://image.tmdb.org/t/p/w500${logoNode.file_path}`;
            }

            let duration = '';
            if (isStandalone && details.runtime) {
                const h = Math.floor(details.runtime / 60);
                const m = details.runtime % 60;
                duration = `${h}h ${m}m`;
            }

            let ageRating = '';
            if (isStandalone) {
                 const usRelease = details.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
                 if (usRelease) ageRating = usRelease.release_dates[0]?.certification || '';
            } else {
                 const usRating = details.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US');
                 if (usRating) ageRating = usRating.rating || '';
            }

            const mappedGenres: Genre[] = details.genres?.map((g: any) => {
                if(g.name === 'Action') return 'أكشن';
                if(g.name === 'Adventure') return 'مغامرة';
                if(g.name === 'Animation') return 'أطفال';
                if(g.name === 'Comedy') return 'كوميديا';
                if(g.name === 'Crime') return 'جريمة';
                if(g.name === 'Documentary') return 'وثائقي';
                if(g.name === 'Drama') return 'دراما';
                if(g.name === 'Family') return 'عائلي';
                if(g.name === 'Fantasy') return 'فانتازيا';
                if(g.name === 'History') return 'تاريخي';
                if(g.name === 'Horror') return 'رعب';
                if(g.name === 'Music') return 'موسيقي';
                if(g.name === 'Mystery') return 'غموض';
                if(g.name === 'Romance') return 'رومانسي';
                if(g.name === 'Science Fiction') return 'خيال علمي';
                if(g.name === 'TV Movie') return 'فيلم تلفزيوني';
                if(g.name === 'Thriller') return 'إثارة';
                if(g.name === 'War') return 'حربي';
                if(g.name === 'Western') return 'ويسترن';
                return g.name; 
            }) || [];

            if (mappedGenres.includes('أطفال') && !autoCategory.includes('أنميشن')) {
                 autoCategory = 'افلام أنميشن';
            }

            const castNames: string[] = [];
            let directorName = '';
            let writerName = '';

            if (details.credits) {
                 for (const p of (details.credits.cast || []).slice(0, 10)) {
                    castNames.push(p.name);
                 }
                 const director = (details.credits.crew || []).find((c: any) => c.job === 'Director');
                 if (director) directorName = director.name;
                 
                 const writer = (details.credits.crew || []).find((c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story');
                 if (writer) writerName = writer.name;
            }

            let newSeasons: Season[] = [];
            
            if ((currentType === ContentType.Series || currentType === ContentType.Program) && details.seasons) {
                const validSeasons = details.seasons.filter((s:any) => s.season_number > 0);
                const seasonPromises = validSeasons.map((s: any) => fetchSeasonDetails(String(targetId), s.season_number));
                const detailedSeasons = await Promise.all(seasonPromises);

                newSeasons = detailedSeasons.filter(ds => ds !== null).map((ds: any) => {
                    const mappedEpisodes: Episode[] = ds.episodes?.map((ep: any) => {
                        let epDuration = '';
                        if (ep.runtime) {
                             if(ep.runtime > 60) epDuration = `${Math.floor(ep.runtime/60)}h ${ep.runtime%60}m`;
                             else epDuration = `${ep.runtime}:00`;
                        }

                        const fixedTitle = `الحلقة ${ep.episode_number}`;
                        const isGenericTitle = !ep.name || ep.name.match(/^Episode \d+$/i) || ep.name.match(/^الحلقة \d+$/i);
                        let finalDescription = ep.overview || `شاهد أحداث الحلقة ${ep.episode_number} من الموسم ${ds.season_number}. استمتع بمشاهدة تطورات الأحداث في هذه الحلقة.`;
                        
                        if (!isGenericTitle && ep.name) {
                            finalDescription = `${ep.name} : ${ep.overview || ''}`;
                        }
                        
                        return {
                            id: Date.now() + ep.episode_number + Math.random(),
                            title: fixedTitle,
                            description: finalDescription,
                            thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : backdrop, 
                            duration: epDuration,
                            progress: 0,
                            servers: generateEpisodeServers(String(targetId), ds.season_number, ep.episode_number)
                        };
                    }) || [];

                    return {
                        id: Date.now() + ds.season_number + Math.random(),
                        seasonNumber: ds.season_number,
                        title: ds.name || `الموسم ${ds.season_number}`,
                        releaseYear: ds.air_date ? new Date(ds.air_date).getFullYear() : releaseYear,
                        description: ds.overview,
                        poster: ds.poster_path ? `https://image.tmdb.org/t/p/w500${ds.poster_path}` : poster,
                        backdrop: backdrop,
                        mobileImageUrl: backdrop, 
                        logoUrl: ds.season_number === 1 ? logoUrl : '',
                        episodes: mappedEpisodes
                    };
                });
            }

            setFormData(prev => ({
                ...prev,
                id: String(targetId),
                tmdbId: String(targetId), 
                title,
                description,
                poster,
                backdrop,
                mobileBackdropUrl: backdrop, 
                logoUrl,
                isLogoEnabled: !!logoUrl,
                trailerUrl,
                rating,
                releaseYear,
                ageRating,
                type: currentType, 
                categories: [autoCategory],
                genres: [...new Set([...prev.genres, ...mappedGenres])],
                cast: castNames,
                director: directorName || prev.director,
                writer: writerName || prev.writer,
                duration: duration || prev.duration,
                seasons: (currentType === ContentType.Series || currentType === ContentType.Program) ? newSeasons : prev.seasons,
                servers: isStandalone ? generateMovieServers(String(targetId)) : [],
            }));

        } catch (e: any) {
            console.error(e);
            addToast(e.message || 'فشل جلب البيانات.', "error");
        } finally {
            setFetchLoading(false);
            setUpdateLoading(false);
        }
    };

    const handleComprehensiveUpdate = async () => {
        const idToUse = formData.tmdbId || formData.id;

        if (!idToUse) {
            addToast('يجب أن يكون للمحتوى كود TMDB للتحقق من التحديثات.', "info");
            return;
        }
        setUpdateLoading(true);

        try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${idToUse}?api_key=${API_KEY}&language=ar-SA`);
            
            if(!res.ok) {
                if (res.status === 404) throw new Error("لم يتم العثور على المسلسل في TMDB. تأكد من صحة كود TMDB.");
                throw new Error("فشل الاتصال بـ TMDB");
            }
            
            const details = await res.json();

            let hasUpdates = false;
            let currentSeasons = [...(formData.seasons || [])];
            const backdrop = formData.backdrop || '';

            const validTmdbSeasons = details.seasons.filter((s:any) => s.season_number > 0);

            for (const tmdbSeason of validTmdbSeasons) {
                let existingSeasonIndex = currentSeasons.findIndex(s => s.seasonNumber === tmdbSeason.season_number);

                if (existingSeasonIndex === -1) {
                    const sRes = await fetch(`https://api.themoviedb.org/3/tv/${idToUse}/season/${tmdbSeason.season_number}?api_key=${API_KEY}&language=ar-SA`);
                    const sData = await sRes.json();
                    
                    const mappedEpisodes: Episode[] = sData.episodes?.map((ep: any) => {
                          let epDuration = '';
                          if (ep.runtime) {
                             if(ep.runtime > 60) epDuration = `${Math.floor(ep.runtime/60)}h ${ep.runtime%60}m`;
                             else epDuration = `${ep.runtime}:00`;
                          }
                          
                          const fixedTitle = `الحلقة ${ep.episode_number}`;
                          const isGenericTitle = !ep.name || ep.name.match(/^Episode \d+$/i) || ep.name.match(/^الحلقة \d+$/i);
                          let finalDescription = ep.overview || `شاهد أحداث الحلقة ${ep.episode_number} من الموسم ${sData.season_number}.`;
                          if (!isGenericTitle && ep.name) finalDescription = `${ep.name} : ${ep.overview || ''}`;

                          return {
                             id: Date.now() + ep.episode_number + Math.random(),
                             title: fixedTitle,
                             description: finalDescription,
                             thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : backdrop, 
                             duration: epDuration,
                             progress: 0,
                             servers: generateEpisodeServers(String(idToUse), sData.season_number, ep.episode_number)
                          };
                    }) || [];

                    currentSeasons.push({
                        id: Date.now() + Math.random(),
                        seasonNumber: tmdbSeason.season_number,
                        title: sData.name || `الموسم ${tmdbSeason.season_number}`,
                        releaseYear: sData.air_date ? new Date(sData.air_date).getFullYear() : new Date().getFullYear(),
                        description: sData.overview,
                        poster: sData.poster_path ? `https://image.tmdb.org/t/p/w500${sData.poster_path}` : formData.poster,
                        backdrop: backdrop,
                        mobileImageUrl: backdrop, 
                        logoUrl: '',
                        episodes: mappedEpisodes
                    });
                    hasUpdates = true;

                } else {
                    const existingSeason = currentSeasons[existingSeasonIndex];
                    
                    if (tmdbSeason.episode_count > (existingSeason.episodes?.length || 0)) {
                        const sRes = await fetch(`https://api.themoviedb.org/3/tv/${idToUse}/season/${tmdbSeason.season_number}?api_key=${API_KEY}&language=ar-SA`);
                        const sData = await sRes.json();
                        
                        const currentCount = existingSeason.episodes?.length || 0;
                        const newEpisodesData = sData.episodes.slice(currentCount);
                        
                        if (newEpisodesData.length > 0) {
                            const newMappedEpisodes: Episode[] = newEpisodesData.map((ep: any) => {
                                let epDuration = '';
                                if (ep.runtime) {
                                     if(ep.runtime > 60) epDuration = `${Math.floor(ep.runtime/60)}h ${ep.runtime%60}m`;
                                     else epDuration = `${ep.runtime}:00`;
                                }

                                const fixedTitle = `الحلقة ${ep.episode_number}`;
                                const isGenericTitle = !ep.name || ep.name.match(/^Episode \d+$/i) || ep.name.match(/^الحلقة \d+$/i);
                                let finalDescription = ep.overview || `شاهد أحداث الحلقة ${ep.episode_number} من الموسم ${tmdbSeason.season_number}.`;
                                if (!isGenericTitle && ep.name) finalDescription = `${ep.name} : ${ep.overview || ''}`;

                                return {
                                    id: Date.now() + ep.episode_number + Math.random(),
                                    title: fixedTitle,
                                    description: finalDescription,
                                    thumbnail: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : (existingSeason.backdrop || backdrop), 
                                    duration: epDuration,
                                    progress: 0,
                                    servers: generateEpisodeServers(String(idToUse), tmdbSeason.season_number, ep.episode_number)
                                };
                            });
                            
                            currentSeasons[existingSeasonIndex] = {
                                ...existingSeason,
                                episodes: [...(existingSeason.episodes || []), ...newMappedEpisodes]
                            };
                            hasUpdates = true;
                        }
                    }
                }
            }

            if (hasUpdates) {
                currentSeasons.sort((a,b) => a.seasonNumber - b.seasonNumber);
                setFormData(prev => ({ ...prev, seasons: currentSeasons }));
                addToast("تم تحديث البيانات وإضافة الحلقات/المواسم الجديدة بنجاح!", "success");
            } else {
                addToast("لم يتم العثور على تحديثات جديدة (المحتوى مكتمل).", "info");
            }

        } catch (e: any) {
            console.error(e);
            addToast("حدث خطأ أثناء البحث عن تحديثات: " + e.message, "error");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleUpdateSpecificSeasonFromTMDB = async (seasonId: number, seasonNumber: number) => {
        const idToUse = formData.tmdbId || formData.id;
        if (!idToUse) {
            addToast('يجب توفر كود TMDB للمحتوى.', "info");
            return;
        }
        
        try {
            const sRes = await fetch(`https://api.themoviedb.org/3/tv/${idToUse}/season/${seasonNumber}?api_key=${API_KEY}&language=ar-SA`);
            if (!sRes.ok) throw new Error("فشل جلب الموسم من TMDB.");
            const sData = await sRes.json();
            
            setFormData(prev => ({
                ...prev,
                seasons: (prev.seasons || []).map(s => {
                    if (s.id !== seasonId) return s;
                    
                    const existingEps = s.episodes || [];
                    const newEpsFromTmdb = sData.episodes.filter((tep: any) => 
                        !existingEps.some(eep => parseInt(eep.title?.replace(/\D/g, '') || '0') === tep.episode_number)
                    ).map((tep: any) => {
                        let epDuration = '';
                        if (tep.runtime) {
                             if(tep.runtime > 60) epDuration = `${Math.floor(tep.runtime/60)}h ${tep.runtime%60}m`;
                             else epDuration = `${tep.runtime}:00`;
                        }
                        return {
                            id: Date.now() + tep.episode_number + Math.random(),
                            title: `الحلقة ${tep.episode_number}`,
                            description: tep.overview || `شاهد أحداث الحلقة ${tep.episode_number} من الموسم ${seasonNumber}.`,
                            /* Fix: Replaced undefined 'prev' with 'formData' */
                            thumbnail: tep.still_path ? `https://image.tmdb.org/t/p/w500${tep.still_path}` : (s.backdrop || formData.backdrop), 
                            duration: epDuration,
                            progress: 0,
                            servers: generateEpisodeServers(String(idToUse), seasonNumber, tep.episode_number)
                        };
                    });
                    
                    const merged = [...existingEps, ...newEpsFromTmdb].sort((a, b) => {
                        const numA = parseInt(a.title?.replace(/\D/g, '') || '0') || 0;
                        const numB = parseInt(b.title?.replace(/\D/g, '') || '0') || 0;
                        return numA - numB;
                    });
                    
                    return { ...s, episodes: merged };
                })
            }));
            addToast(`تم التحقق من الموسم ${seasonNumber} وإضافة الحلقات الجديدة.`, "success");
        } catch (e: any) {
            addToast(e.message, "error");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const inputElement = e.target as HTMLInputElement;
        if (inputElement.type === 'number') {
            const numericValue = value === '' ? 0 : parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
            return;
        }
        if (name === 'type') {
            const isTargetEpisodic = value === ContentType.Series || value === ContentType.Program;
            if (isTargetEpisodic && (!formData.seasons || formData.seasons.length === 0)) {
                setFormData(prev => ({
                    ...prev, 
                    type: value as ContentType, 
                    seasons: [{ id: Date.now(), seasonNumber: 1, title: 'الموسم 1', episodes: []}]
                }));
                return;
            }
        }
        if (name === 'slug') setSlugManuallyEdited(true);
        setFormData(prev => ({ ...prev, [name]: value } as Content));
    };

    const filteredCategories = useMemo<Category[]>(() => {
        const commonCats: Category[] = ['قريباً'];
        if (formData.type === ContentType.Movie) {
            return ['افلام عربية', 'افلام تركية', 'افلام اجنبية', 'افلام هندية', 'افلام أنميشن', 'افلام العيد', ...commonCats];
        } else if (formData.type === ContentType.Series) {
            return ['مسلسلات عربية', 'مسلسلات تركية', 'مسلسلات اجنبية', 'رمضان', 'حصرياً لرمضان', 'مسلسلات رمضان', ...commonCats];
        } else if (formData.type === ContentType.Program) {
            return ['برامج تلفزيونية', 'برامج رمضان', ...commonCats];
        } else if (formData.type === ContentType.Concert) {
            return ['حفلات', ...commonCats];
        } else if (formData.type === ContentType.Play) {
            return ['مسرحيات', ...commonCats];
        }
        return commonCats;
    }, [formData.type]);

    const handleCategoryChange = (category: Category) => {
        setFormData(prev => {
            const currentCats = prev.categories || [];
            const newCats = currentCats.includes(category)
                ? currentCats.filter(c => c !== category)
                : [...currentCats, category];
            return { ...prev, categories: newCats };
        });
    };
    
    const handleGenreChange = (genre: Genre) => {
        setFormData(prev => {
            const currentGenres = prev.genres || [];
            const newGenres = currentGenres.includes(genre)
                ? currentGenres.filter(g => g !== genre)
                : [...currentGenres, genre];
            return { ...prev, genres: newGenres };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) { addToast('الرجاء تعبئة حقول العنوان.', "info"); return; }
        if (formData.categories.length === 0) { addToast('الرجاء اختيار تصنيف واحد على الأقل.', "info"); return; }
        
        const backdrop = formData.backdrop;
        const mobileBackdrop = formData.mobileBackdropUrl || backdrop;
        
        const seasons = formData.seasons?.map(s => ({
            ...s,
            mobileImageUrl: s.mobileImageUrl || s.backdrop || backdrop
        }));

        const finalSlug = formData.slug?.trim() || generateSlug(formData.title);
        const contentToSave: Content = { 
            ...formData, 
            mobileBackdropUrl: mobileBackdrop,
            seasons: seasons,
            slug: finalSlug,
            id: formData.id || String(Date.now()),
            tmdbId: formData.tmdbId || formData.id, 
            createdAt: formData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onSave(contentToSave);
    };

    const toggleSeason = (id: number) => {
        setExpandedSeasons(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleAddSeason = () => {
        const newSeasonNumber = (formData.seasons?.length || 0) + 1;
        setFormData(prev => ({
            ...prev,
            seasons: [...(prev.seasons || []), { id: Date.now(), seasonNumber: newSeasonNumber, title: `الموسم ${newSeasonNumber}`, episodes: [] }]
        }));
    };

    const handleUpdateSeason = (seasonId: number, field: keyof Season, value: any) => {
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => s.id === seasonId ? { ...s, [field]: value } : s)
        }));
    };

    const requestDeleteSeason = (seasonId: number, seasonTitle: string) => { setDeleteSeasonState({ isOpen: true, seasonId, title: seasonTitle }); };
    const executeDeleteSeason = () => { if (deleteSeasonState.seasonId) setFormData(prev => ({ ...prev, seasons: (prev.seasons || []).filter(s => s.id !== deleteSeasonState.seasonId) })); setDeleteSeasonState(prev => ({ ...prev, isOpen: false })); };
    
    const handleSeasonExcelImport = async (e: React.ChangeEvent<HTMLInputElement>, seasonId: number, seasonNumber: number) => { 
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json<any>(worksheet);

                const relevantRows = rows.filter(r => {
                    const sNumRaw = getRowValue(r, 'الموسم', 'Season', 'Season_Number');
                    if (sNumRaw === null) return true; 
                    return parseInt(String(sNumRaw)) === seasonNumber;
                });

                if (relevantRows.length === 0) {
                    addToast(`لم يتم العثور على حلقات للموسم رقم ${seasonNumber} في الملف.`, "info");
                    return;
                }

                setFormData(prev => ({
                    ...prev,
                    seasons: (prev.seasons || []).map(s => {
                        if (s.id !== seasonId) return s;
                        const updatedEpisodes = [...(s.episodes || [])];

                        relevantRows.forEach((row, idx) => {
                            const eNumRaw = getRowValue(row, 'الحلقة', 'Episode', 'Episode_Number');
                            const eNum = parseInt(String(eNumRaw)) || (idx + 1);
                            
                            const epServers: Server[] = [];
                            
                            if (enableAutoLinks) {
                                const idToUse = formData.tmdbId || formData.id;
                                const vipUrl = `https://vidsrc.vip/embed/tv/${idToUse}/${seasonNumber}/${eNum}`;
                                epServers.push({ id: 99999 + Math.random(), name: 'Cinematix VIP', url: vipUrl, downloadUrl: vipUrl, isActive: true });
                            }

                            for (let i = 1; i <= 8; i++) {
                                const watchUrl = getRowValue(row, `سيرفر مشاهدة ${i}`, `Watch Server ${i}`, `سيرفر ${i}`);
                                const downloadUrl = getRowValue(row, `سيرفر تحميل ${i}`, `Download Server ${i}`, `تحميل ${i}`);

                                if ((watchUrl && String(watchUrl).trim() !== '') || (downloadUrl && String(downloadUrl).trim() !== '')) {
                                    epServers.push({
                                        id: Date.now() + i + Math.random(),
                                        name: `سيرفر ${i}`,
                                        url: String(watchUrl || '').trim(),
                                        downloadUrl: String(downloadUrl || '').trim(),
                                        isActive: true
                                    });
                                }
                            }

                            const newEpisodeData: Episode = {
                                id: Date.now() + eNum + Math.random(), 
                                title: getRowValue(row, 'العنوان', 'Title') || `الحلقة ${eNum}`,
                                duration: getRowValue(row, 'المدة', 'Duration') || '45:00',
                                /* Fix: Replaced undefined 'prev' with 'formData' */
                                thumbnail: getRowValue(row, 'صورة', 'Thumbnail') || s.backdrop || formData.backdrop,
                                description: getRowValue(row, 'الوصف', 'Description') || `شاهد أحداث الحلقة ${eNum} من الموسم ${seasonNumber}.`,
                                progress: 0,
                                servers: epServers
                            };

                            const targetIdx = updatedEpisodes.findIndex(ep => {
                                const titleNum = parseInt(ep.title?.replace(/\D/g, '') || '0');
                                return titleNum === eNum;
                            });

                            if (targetIdx !== -1) {
                                updatedEpisodes[targetIdx] = {
                                    ...updatedEpisodes[targetIdx],
                                    servers: epServers.length > 0 ? epServers : updatedEpisodes[targetIdx].servers 
                                };
                            } else {
                                updatedEpisodes.push(newEpisodeData);
                            }
                        });

                        updatedEpisodes.sort((a, b) => {
                            const numA = parseInt(a.title?.replace(/\D/g, '') || '0') || 0;
                            const numB = parseInt(b.title?.replace(/\D/g, '') || '0') || 0;
                            return numA - numB;
                        });

                        return { ...s, episodes: updatedEpisodes };
                    })
                }));
                addToast(`تم تحديث روابط ${relevantRows.length} حلقة للموسم ${seasonNumber} بنجاح!`, "success");
            } catch (err) {
                console.error(err);
                addToast('حدث خطأ أثناء استيراد الملف.', "error");
            }
        };
        reader.readAsBinaryString(file);
    };
    
    const handleAddEpisode = (seasonId: number) => { 
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => {
                if (s.id !== seasonId) return s;
                const newEpNum = (s.episodes?.length || 0) + 1;
                return {
                    ...s,
                    episodes: [...(s.episodes || []), { id: Date.now(), title: `الحلقة ${newEpNum}`, duration: '', progress: 0, servers: [] }]
                };
            })
        }));
    };
    
    const requestDeleteEpisode = (seasonId: number, episodeId: number, episodeTitle: string) => { 
        setDeleteEpisodeState({ isOpen: true, seasonId, episodeId, title: episodeTitle }); 
    };
    
    const executeDeleteEpisode = () => { 
        const { seasonId, episodeId } = deleteEpisodeState;
        if (seasonId && episodeId) {
            setFormData(prev => ({
                ...prev,
                seasons: (prev.seasons || []).map(s => {
                    if (s.id !== seasonId) return s;
                    return { ...s, episodes: s.episodes.filter(e => e.id !== episodeId) };
                })
            }));
        }
        setDeleteEpisodeState(prev => ({...prev, isOpen: false})); 
    };
    
    const handleUpdateEpisode = (seasonId: number, episodeId: number, field: keyof Episode, value: any) => { 
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => {
                if (s.id !== seasonId) return s;
                return {
                    ...s,
                    episodes: s.episodes.map(e => e.id === episodeId ? { ...e, [field]: value } : e)
                };
            })
        }));
    };
    
    const handleUpdateEpisodeServers = (newServers: Server[]) => { 
        if (!editingServersForEpisode) return;
        setFormData(prev => ({
            ...prev,
            seasons: (prev.seasons || []).map(s => ({
                ...s,
                episodes: s.episodes.map(e => e.id === editingServersForEpisode.id ? { ...e, servers: newServers } : e)
            }))
        }));
    };
    
    const handleUpdateMovieServers = (servers: Server[]) => { 
        setFormData(prev => ({ ...prev, servers })); 
    };

    const handleBulkSeriesImport = async (e: React.ChangeEvent<HTMLInputElement>) => { 
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json<any>(worksheet);

                const seasonsMap: Record<number, Episode[]> = {};
                rows.forEach((row, idx) => {
                    const sNumRaw = getRowValue(row, 'الموسم', 'Season', 'Season_Number');
                    const sNum = parseInt(String(sNumRaw)) || 1;
                    
                    const eNumRaw = getRowValue(row, 'الحلقة', 'Episode', 'Episode_Number');
                    const eNum = parseInt(String(eNumRaw)) || (idx + 1);
                    
                    if (!seasonsMap[sNum]) seasonsMap[sNum] = [];

                    const epServers: Server[] = [];
                    if (enableAutoLinks) {
                        const idToUse = formData.tmdbId || formData.id;
                        const vipUrl = `https://vidsrc.vip/embed/tv/${idToUse}/${sNum}/${eNum}`;
                        epServers.push({ id: 99999, name: 'Cinematix VIP', url: vipUrl, downloadUrl: vipUrl, isActive: true });
                    }
                    
                    for (let i = 1; i <= 8; i++) {
                        const watchUrl = getRowValue(row, `سيرفر مشاهدة ${i}`, `Watch Server ${i}`, `سيرفر ${i}`);
                        const downloadUrl = getRowValue(row, `سيرفر تحميل ${i}`, `Download Server ${i}`, `تحميل ${i}`);

                        if ((watchUrl && String(watchUrl).trim() !== '') || (downloadUrl && String(downloadUrl).trim() !== '')) {
                            epServers.push({
                                id: Date.now() + i + Math.random(),
                                name: `سيرفر ${i}`,
                                url: String(watchUrl || '').trim(),
                                downloadUrl: String(downloadUrl || '').trim(),
                                isActive: true
                            });
                        }
                    }

                    seasonsMap[sNum].push({
                        id: Date.now() + Math.random(),
                        title: getRowValue(row, 'العنوان', 'Title') || `الحلقة ${eNum}`,
                        duration: getRowValue(row, 'المدة', 'Duration') || '45:00',
                        thumbnail: getRowValue(row, 'صورة', 'Thumbnail') || formData.backdrop,
                        description: getRowValue(row, 'الوصف', 'Description') || `حلقة من الموسم ${sNum}`,
                        progress: 0,
                        servers: epServers
                    });
                });

                const newSeasons: Season[] = Object.entries(seasonsMap).map(([sNum, eps]) => ({
                    id: Date.now() + Math.random(),
                    seasonNumber: parseInt(sNum),
                    title: `الموسم ${sNum}`,
                    episodes: eps,
                    backdrop: formData.backdrop,
                    poster: formData.poster
                }));

                setFormData(prev => ({
                    ...prev,
                    seasons: newSeasons
                }));
                addToast('تم استيراد كافة المواسم بنجاح!', "success");
            } catch (err) {
                console.error(err);
                addToast('حدث خطأ أثناء الاستيراد الشامل.', "error");
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="flex h-screen w-full bg-[#090b10] text-gray-200 overflow-hidden font-sans selection:bg-[var(--color-accent)] selection:text-black" dir="rtl">
            {/* Mobile Sidebar Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 z-[90] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setIsSidebarOpen(false)} 
            />

            <aside className={`fixed inset-y-0 right-0 z-[100] w-72 bg-[#0f1014] border-l border-gray-800 flex flex-col shadow-2xl transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 border-b border-gray-800 flex flex-col items-center gap-3">
                    <div className="text-3xl font-extrabold cursor-default flex flex-row items-baseline gap-1 justify-center">
                        <span className="text-white font-['Cairo']">سينما</span>
                        <span className="gradient-text font-['Lalezar'] tracking-wide text-4xl">تيكس</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                        {isNewContent ? 'New Content' : 'Edit Mode'}
                    </span>
                </div>
                
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Main Menu</div>
                    <button 
                        onClick={() => { setActiveTab('general'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'general' ? 'bg-[#1a1f29] text-white border-r-2 border-[var(--color-accent)]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                    >
                        <DashboardIcon className="w-5 h-5"/>
                        <span>البيانات الأساسية</span>
                    </button>
                    <button 
                        onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'categories' ? 'bg-[#1a1f29] text-white border-r-2 border-[var(--color-accent)]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                    >
                        <TagIcon className="w-5 h-5"/>
                        <span>التصنيف والأنواع</span>
                    </button>
                    <button 
                        onClick={() => { setActiveTab('media'); setIsSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'media' ? 'bg-[#1a1f29] text-white border-r-2 border-[var(--color-accent)]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                    >
                        <PhotoIcon className="w-5 h-5"/>
                        <span>الصور والميديا</span>
                    </button>
                    
                    {isEpisodic && (
                        <button 
                            onClick={() => { setActiveTab('seasons'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'seasons' ? 'bg-[#1a1f29] text-white border-r-2 border-[var(--color-accent)]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                        >
                            <LayersIcon className="w-5 h-5"/>
                            <span>المواسم والحلقات</span>
                        </button>
                    )}
                    
                    {isStandalone && (
                        <button 
                            onClick={() => { setActiveTab('servers'); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'servers' ? 'bg-[#1a1f29] text-white border-r-2 border-[var(--color-accent)]' : 'text-gray-400 hover:bg-[#161b22] hover:text-white'}`}
                        >
                            <ServerIcon className="w-5 h-5"/>
                            <span>السيرفرات</span>
                        </button>
                    )}
                </nav>

                <div className="h-20 border-t border-gray-800 flex items-center px-4 bg-black/10">
                     <button onClick={onClose} className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200">
                        <ExitIcon className="w-5 h-5"/>
                        <span>خروج دون حفظ</span>
                     </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-[#090b10] relative">
                <header className="h-20 border-b border-gray-800 bg-[#0f1014]/90 backdrop-blur-md flex items-center justify-between px-6 md:px-10 z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button" 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                             <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                {isNewContent ? 'إضافة محتوى جديد' : 'تعديل المحتوى'}
                             </h2>
                             <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 mt-1">
                                 <span>المكتبة</span>
                                 <span>/</span>
                                 <span className="text-[var(--color-accent)]">{formData.title || 'بدون عنوان'}</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block px-3 py-1 bg-gray-900 rounded border border-gray-800 font-mono text-xs text-gray-400">
                             ID: {formData.id || 'NEW'}
                        </div>
                        {formData.type && (
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-[var(--color-accent)] text-black px-3 py-1 rounded">
                                {formData.type}
                            </span>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-32">
                    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-10">
                        
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-12 gap-8 animate-fade-in-up">
                                {/* LINK BOX (TMDB SECTION) */}
                                <div className="col-span-12 rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-900/10 to-transparent p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <CloudArrowDownIcon className="w-40 h-40"/>
                                    </div>
                                    <div className="relative z-10">
                                         <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                                             <CloudArrowDownIcon className="w-5 h-5"/> جلب بيانات تلقائي (TMDB)
                                         </h3>

                                         <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex rounded-lg bg-[#0f1014] p-1 border border-gray-700">
                                                <button type="button" onClick={() => setTmdbSearchMode('name')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${tmdbSearchMode === 'name' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>بحث بالاسم</button>
                                                <button type="button" onClick={() => setTmdbSearchMode('id')} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${tmdbSearchMode === 'id' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>بحث بالـ ID</button>
                                            </div>
                                            
                                            <div className="flex-1 min-w-[300px] flex gap-2">
                                                 {tmdbSearchMode === 'name' ? (
                                                    <div className="relative flex-1">
                                                        <input 
                                                            type="text" 
                                                            value={tmdbSearchQuery} 
                                                            onChange={(e) => setTmdbSearchQuery(e.target.value)} 
                                                            onKeyDown={(e) => e.key === 'Enter' && searchTMDB()} 
                                                            placeholder="اكتب اسم الفيلم أو المسلسل..." 
                                                            className={inputClass + " pr-10"} 
                                                        />
                                                        <button type="button" onClick={searchTMDB} className="absolute left-1 top-1 bottom-1 bg-blue-600 text-white px-4 rounded hover:bg-blue-500"><SearchIcon className="w-4 h-4"/></button>
                                                    </div>
                                                 ) : (
                                                    <div className="flex gap-2 flex-1">
                                                        <input type="text" value={tmdbIdInput} onChange={(e) => setTmdbIdInput(e.target.value)} placeholder="TMDB ID..." className={inputClass} />
                                                        <button type="button" onClick={() => fetchFromTMDB()} disabled={fetchLoading} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-500 whitespace-nowrap">{fetchLoading ? '...' : 'جلب'}</button>
                                                    </div>
                                                 )}
                                            </div>
                                            
                                            {isEpisodic && !isNewContent && (
                                                <button type="button" onClick={handleComprehensiveUpdate} disabled={updateLoading} className="flex items-center gap-2 bg-green-600/20 text-green-400 border border-green-600/30 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                                                    <RefreshIcon className={`w-4 h-4 ${updateLoading ? 'animate-spin' : ''}`}/> تحديث شامل
                                                </button>
                                            )}
                                         </div>

                                         {tmdbSearchMode === 'name' && tmdbSearchResults.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                                {tmdbSearchResults.map((result) => (
                                                    <div key={result.id} onClick={() => handleSelectSearchResult(result)} className="group cursor-pointer">
                                                        <div className="aspect-[2/3] rounded-lg overflow-hidden border border-gray-700 relative">
                                                            {result.poster_path ? <img src={`https://image.tmdb.org/t/p/w200${result.poster_path}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs">No Image</div>}
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded">اختر</span></div>
                                                        </div>
                                                        <div className="mt-2 text-center">
                                                            <div className="text-xs font-bold text-white truncate">{result.title || result.name}</div>
                                                            <div className="text-[10px] text-gray-500">{result.release_date?.substring(0,4) || result.first_air_date?.substring(0,4)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                         )}
                                    </div>
                                </div>

                                {/* CONTENT BOX (BASIC INFORMATION) - SPANS FULL WIDTH UNDER LINK BOX */}
                                <div className="col-span-12 space-y-6">
                                    <div className={sectionBoxClass}>
                                        <h4 className="text-sm font-bold text-[#00A7F8] mb-6 uppercase border-b border-gray-800 pb-2">البيانات الأساسية (Content Box)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-1 md:col-span-2">
                                                <label className={labelClass}>عنوان العمل</label>
                                                <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="اسم الفيلم أو المسلسل" />
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <label className={labelClass}>الوصف (القصة)</label>
                                                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className={inputClass + " resize-none"} placeholder="اكتب ملخص القصة..." />
                                            </div>
                                            <div>
                                                <label className={labelClass}>سنة الإنتاج</label>
                                                <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>التقييم (10/x)</label>
                                                <input type="number" step="0.1" name="rating" value={formData.rating} onChange={handleChange} className={inputClass + " text-yellow-400 font-bold"} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ADDITIONAL DETAILS AND CONTROLS - FULL WIDTH FLOW */}
                                <div className="col-span-12 space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        {/* Additional Details Box */}
                                        <div className="col-span-12 lg:col-span-8">
                                            <div className={sectionBoxClass + " h-full"}>
                                                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase border-b border-gray-800 pb-2">تفاصيل إضافية</h4>
                                                <div className="grid grid-cols-2 gap-6">
                                                     <div><label className={labelClass}>المخرج</label><input type="text" name="director" value={formData.director || ''} onChange={handleChange} className={inputClass} /></div>
                                                     <div><label className={labelClass}>الكاتب</label><input type="text" name="writer" value={formData.writer || ''} onChange={handleChange} className={inputClass} /></div>
                                                     <div><label className={labelClass}>التصنيف العمري</label><input type="text" name="ageRating" value={formData.ageRating} onChange={handleChange} className={inputClass} placeholder="+13" /></div>
                                                     {isStandalone && <div><label className={labelClass}>المدة</label><input type="text" name="duration" value={formData.duration || ''} onChange={handleChange} className={inputClass} placeholder="1h 30m" /></div>}
                                                     <div className="col-span-2">
                                                        <label className={labelClass}>Slug (الرابط)</label>
                                                        <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} className={inputClass + " font-mono text-xs text-blue-400"} />
                                                     </div>
                                                     {/* TMDB ID Input moved here, below Slug */}
                                                     <div className="col-span-2">
                                                        <label className={labelClass}>كود المحتوى (TMDB ID)</label>
                                                        <input 
                                                            type="text" 
                                                            name="tmdbId" 
                                                            value={formData.tmdbId || ''} 
                                                            onChange={handleChange} 
                                                            className={inputClass + " font-mono text-[var(--color-accent)]"} 
                                                            placeholder="مثال: 12345" 
                                                        />
                                                     </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sidebar Controls (Type / Visibility) */}
                                        <div className="col-span-12 lg:col-span-4 space-y-6">
                                            <div className={sectionBoxClass}>
                                                <label className={labelClass}>نوع المحتوى</label>
                                                <div className="flex flex-col gap-2">
                                                    {[ContentType.Movie, ContentType.Series, ContentType.Program, ContentType.Play, ContentType.Concert].map((type) => (
                                                        <button key={type} type="button" onClick={() => setFormData(prev => ({...prev, type: type}))} className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${formData.type === type ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] text-[var(--color-accent)] font-bold' : 'bg-[#161b22] border-transparent text-gray-400 hover:border-gray-600'}`}>
                                                            <span>{type === ContentType.Movie ? 'فيلم' : type === ContentType.Series ? 'مسلسل' : type === ContentType.Program ? 'برنامج' : type === ContentType.Play ? 'مسرحية' : 'حفلة'}</span>
                                                            {formData.type === type && <CheckSmallIcon className="w-4 h-4"/>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className={sectionBoxClass}>
                                                <label className={labelClass}>جمهور المشاهدة</label>
                                                <div className="space-y-3">
                                                    <button type="button" onClick={() => setFormData(prev => ({...prev, visibility: 'general'}))} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${formData.visibility === 'general' ? 'border-green-500/50 bg-green-500/10' : 'border-gray-800 bg-[#161b22]'}`}>
                                                        <div className={`p-2 rounded-full ${formData.visibility === 'general' ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-500'}`}><ShieldCheckIcon className="w-5 h-5"/></div>
                                                        <div className="text-right"><div className={`font-bold ${formData.visibility === 'general' ? 'text-green-400' : 'text-gray-300'}`}>عائلي (عام)</div><div className="text-[10px] text-gray-500">مناسب للجميع</div></div>
                                                    </button>
                                                    <button type="button" onClick={() => setFormData(prev => ({...prev, visibility: 'adults'}))} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${formData.visibility === 'adults' ? 'border-red-500/50 bg-red-500/10' : 'border-gray-800 bg-[#161b22]'}`}>
                                                        <div className={`p-2 rounded-full ${formData.visibility === 'adults' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-500'}`}><AdultIcon className="w-5 h-5"/></div>
                                                        <div className="text-right"><div className={`font-bold ${formData.visibility === 'adults' ? 'text-red-400' : 'text-gray-300'}`}>للكبار فقط</div><div className="text-[10px] text-gray-500">+18 محتوى مقيد</div></div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Cast Member Box - Full Width */}
                                    <div className={sectionBoxClass}>
                                         <label className={labelClass}>طاقم العمل</label>
                                         <div className="relative mb-3">
                                            <input type="text" value={castQuery} onChange={(e) => searchCast(e.target.value)} className={inputClass} placeholder="بحث عن ممثل..." />
                                            {isSearchingCast && <div className="absolute left-3 top-3"><div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"/></div>}
                                            {castResults.length > 0 && (
                                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1a1f29] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                    {castResults.map(person => (
                                                        <div key={person.id} onClick={() => addCastMember(person)} className="flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer border-b border-gray-800 last:border-0">
                                                            <img src={person.profile_path ? `https://image.tmdb.org/t/p/w45${person.profile_path}` : 'https://placehold.co/45x45'} className="w-8 h-8 rounded-full object-cover"/>
                                                            <span className="text-xs text-white">{person.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                         </div>
                                         <div className="flex flex-wrap gap-2">
                                             {formData.cast.map((c, i) => (
                                                 <span key={i} className="flex items-center gap-1 bg-gray-800 text-xs px-2 py-1 rounded-full border border-gray-700">
                                                     {c} <button type="button" onClick={() => removeCastMember(c)} className="text-gray-500 hover:text-red-400"><CloseIcon className="w-3 h-3"/></button>
                                                 </span>
                                             ))}
                                         </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className={sectionBoxClass + " animate-fade-in-up"}>
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">القوائم الرئيسية</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {filteredCategories.map((cat: Category) => (
                                                <button key={cat} type="button" onClick={() => handleCategoryChange(cat)} className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold transition-all duration-300 ${formData.categories.includes(cat) ? 'scale-105 border-transparent bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black shadow-lg shadow-[var(--color-accent)]/20' : `${INPUT_BG} border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white`}`}>
                                                    {cat}
                                                    {formData.categories.includes(cat) && <CheckSmallIcon />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">تصنيفات البحث</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {SEARCH_CATEGORIES.map((cat) => (
                                                <button key={cat} type="button" onClick={() => handleCategoryChange(cat as Category)} className={`flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold transition-all duration-300 ${formData.categories.includes(cat as Category) ? 'scale-105 border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-lg shadow-purple-500/10' : `${INPUT_BG} border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white`}`}>
                                                    {cat}
                                                    {formData.categories.includes(cat as Category) && <CheckSmallIcon />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">النوع الفني (Genres)</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {genres.map((g: Genre) => (
                                                <button key={g} type="button" onClick={() => handleGenreChange(g)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all duration-200 ${formData.genres.includes(g) ? 'bg-white text-black border-white' : `${INPUT_BG} border-gray-700 text-gray-400 hover:text-white`}`}>
                                                    {g}
                                                    {formData.genres.includes(g) && <CheckSmallIcon />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div className="flex flex-col gap-8 animate-fade-in-up">
                                {/* MAIN PHOTOS SECTION - FULL WIDTH */}
                                <div className={`w-full space-y-6 ${sectionBoxClass}`}>
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PhotoIcon className="w-5 h-5 text-[var(--color-accent)]"/> الصور الأساسية</h3>
                                    
                                    {renderImageInput("البوستر العمودي (Poster)", formData.poster, (val) => setFormData(prev => ({...prev, poster: val})), 'poster', "https://...", "w-20 h-28")}
                                    {renderImageInput("خلفية عريضة (Backdrop)", formData.backdrop, (val) => setFormData(prev => ({...prev, backdrop: val})), 'backdrop', "https://...", "w-32 h-20")}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {renderImageInput("بوستر عريض (Horizontal)", formData.horizontalPoster, (val) => setFormData(prev => ({...prev, horizontalPoster: val})), 'backdrop', "https://...", "w-24 h-14")}
                                         {renderImageInput("توب 10 (Top 10)", formData.top10Poster, (val) => setFormData(prev => ({...prev, top10Poster: val})), 'poster', "https://...", "w-16 h-20")}
                                    </div>
                                    
                                    <div className="border-t border-gray-800 pt-6 mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className={labelClass}>اللوجو (شعار شفاف)</label>
                                            <ToggleSwitch 
                                                checked={formData.isLogoEnabled || false} 
                                                onChange={(val) => setFormData(prev => ({...prev, isLogoEnabled: val}))} 
                                                label={formData.isLogoEnabled ? "مفعل" : "معطل"}
                                            />
                                        </div>
                                        {renderImageInput("", formData.logoUrl, (val) => setFormData(prev => ({...prev, logoUrl: val})), 'logo', "https://...", "hidden")}
                                        {formData.logoUrl && (
                                            <div className="mt-2 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-gray-800 p-4 rounded-lg flex justify-center">
                                                <img src={formData.logoUrl} className="h-16 object-contain"/>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                         <label className={labelClass}>رابط التريلر (YouTube)</label>
                                         <div className="flex items-center gap-2">
                                            <input type="text" value={formData.trailerUrl || ''} onChange={(e) => setFormData(prev => ({...prev, trailerUrl: e.target.value}))} className={inputClass} placeholder="https://youtube.com/..." />
                                            {formData.trailerUrl && <a href={formData.trailerUrl} target="_blank" className="p-3 bg-red-600 rounded-lg text-white hover:bg-red-500"><PlayIcon className="w-5 h-5"/></a>}
                                         </div>
                                    </div>
                                </div>

                                {/* MOBILE CUSTOMIZATION SECTION - FULL WIDTH BELOW MAIN PHOTOS */}
                                <div className={`w-full ${sectionBoxClass}`}>
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">📱 تخصيص الجوال</h3>
                                    {renderImageInput("صورة الخلفية للموبايل", formData.mobileBackdropUrl, (val) => setFormData(prev => ({...prev, mobileBackdropUrl: val})), 'poster', "https://...", "hidden")}
                                    
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-bold text-gray-400 uppercase">تفعيل القص التلقائي</span>
                                            <input type="checkbox" checked={formData.enableMobileCrop || false} onChange={(e) => setFormData(prev => ({...prev, enableMobileCrop: e.target.checked}))} className="w-5 h-5 accent-[var(--color-accent)]"/>
                                        </div>
                                        
                                        {formData.enableMobileCrop && (
                                            <MobileSimulator 
                                                imageUrl={formData.mobileBackdropUrl || formData.backdrop || ''}
                                                posX={formData.mobileCropPositionX ?? 50}
                                                posY={formData.mobileCropPositionY ?? 50}
                                                onUpdateX={(v) => setFormData(prev => ({...prev, mobileCropPositionX: v}))}
                                                onUpdateY={(v) => setFormData(prev => ({...prev, mobileCropPositionY: v}))}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'seasons' && isEpisodic && (
                            <div className="animate-fade-in-up space-y-6">
                                <div className="flex items-center justify-between bg-[#0f1014] p-4 rounded-xl border border-gray-800">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><LayersIcon className="w-6 h-6 text-[var(--color-accent)]"/> قائمة المواسم</h3>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={handleComprehensiveUpdate} 
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            <RefreshIcon className="w-4 h-4"/> تحديث كافة المواسم
                                        </button>
                                        <button type="button" onClick={() => globalFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-gray-700 text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-800 hover:text-white">
                                            <ExcelIcon className="w-4 h-4"/> استيراد Excel
                                        </button>
                                        <input type="file" className="hidden" ref={globalFileInputRef} accept=".xlsx" onChange={handleBulkSeriesImport}/>
                                        <button type="button" onClick={handleAddSeason} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-black rounded-lg text-sm font-bold hover:bg-white transition-colors">
                                            <PlusIcon className="w-4 h-4"/> إضافة موسم
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {formData.seasons?.map((season) => (
                                        <div key={season.id} className="bg-[#0f1014] border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
                                            <div className="flex items-center justify-between p-4 bg-[#161b22] cursor-pointer" onClick={() => toggleSeason(season.id)}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`transition-transform duration-300 ${expandedSeasons.has(season.id) ? 'rotate-180' : ''}`}><ChevronDownIcon className="w-5 h-5 text-gray-500"/></div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <input onClick={e => e.stopPropagation()} value={season.title} onChange={e => handleUpdateSeason(season.id, 'title', e.target.value)} className="bg-transparent text-lg font-bold text-white border-none focus:ring-0 p-0 w-32"/>
                                                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{season.episodes.length} حلقة</span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-1">ID: {season.id}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateSpecificSeasonFromTMDB(season.id, season.seasonNumber); }} 
                                                        className="flex items-center gap-1 p-2 hover:bg-blue-900/30 text-blue-400 rounded text-xs font-bold"
                                                        title="تحديث هذا الموسم فقط"
                                                    >
                                                        <RefreshIcon className="w-3 h-3"/> تحديث
                                                    </button>
                                                    <input onClick={e => e.stopPropagation()} type="file" id={`excel-${season.id}`} className="hidden" accept=".xlsx" onChange={(e) => handleSeasonExcelImport(e, season.id, season.seasonNumber)}/>
                                                    <label htmlFor={`excel-${season.id}`} className="p-2 hover:bg-green-900/30 text-green-600 rounded cursor-pointer" title="استيراد حلقات"><ExcelIcon className="w-4 h-4"/></label>
                                                    <button type="button" onClick={(e) => {e.stopPropagation(); handleAddEpisode(season.id)}} className="p-2 hover:bg-gray-800 text-blue-400 rounded"><PlusIcon className="w-4 h-4"/></button>
                                                    <button type="button" onClick={(e) => {e.stopPropagation(); requestDeleteSeason(season.id, season.title)}} className="p-2 hover:bg-red-900/20 text-red-500 rounded"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </div>

                                            {expandedSeasons.has(season.id) && (
                                                <div className="p-6 border-t border-gray-800 bg-[#0a0a0a]">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-[#13161c] rounded-2xl border border-gray-800/50">
                                                        <div className="col-span-full mb-4 border-b border-gray-800 pb-2 flex items-center justify-between">
                                                            <h4 className="text-sm font-bold text-blue-400">بيانات الموسم {season.seasonNumber}</h4>
                                                        </div>
                                                        
                                                        {renderImageInput("بوستر الموسم (Booster)", season.poster, (val) => handleUpdateSeason(season.id, 'poster', val), 'poster', "Poster URL")}
                                                        {renderImageInput("خلفية الموسم (Background)", season.backdrop, (val) => handleUpdateSeason(season.id, 'backdrop', val), 'backdrop', "Backdrop URL")}
                                                        {renderImageInput("بوستر عريض (Wide)", season.horizontalPoster, (val) => handleUpdateSeason(season.id, 'horizontalPoster', val), 'backdrop', "Horizontal Poster URL")}
                                                        {renderImageInput("شعار الموسم (Logo)", season.logoUrl, (val) => handleUpdateSeason(season.id, 'logoUrl', val), 'logo', "Logo URL")}
                                                        {renderImageInput("صورة الموبايل (Mobile)", season.mobileImageUrl, (val) => handleUpdateSeason(season.id, 'mobileImageUrl', val), 'poster', "Mobile Image URL")}
                                                        
                                                        <div>
                                                            <label className={labelClass}>رابط الإعلان (Ad Link)</label>
                                                            <input 
                                                                value={season.adLink || ''} 
                                                                onChange={(e) => handleUpdateSeason(season.id, 'adLink', e.target.value)} 
                                                                className={inputClass} 
                                                                placeholder="رابط إعلاني خاص بالموسم" 
                                                            />
                                                        </div>

                                                        <div className="col-span-full">
                                                            <label className={labelClass}>قصة الموسم</label>
                                                            <textarea value={season.description || ''} onChange={(e) => handleUpdateSeason(season.id, 'description', e.target.value)} className={inputClass} rows={2}/>
                                                        </div>
                                                        
                                                        <div className="col-span-full mt-4 p-4 border-t border-gray-800">
                                                            <div className="flex justify-between items-center mb-4"><label className={labelClass}>تخصيص الموبايل لهذا الموسم</label><input type="checkbox" checked={season.enableMobileCrop || false} onChange={(e) => handleUpdateSeason(season.id, 'enableMobileCrop', e.target.checked)} className="accent-[var(--color-accent)]"/></div>
                                                            {season.enableMobileCrop && (
                                                                <div className="mt-2">
                                                                     <MobileSimulator imageUrl={season.mobileImageUrl || season.backdrop || ''} posX={season.mobileCropPositionX ?? 50} posY={season.mobileCropPositionY ?? 50} onUpdateX={(v) => handleUpdateSeason(season.id, 'mobileCropPositionX', v)} onUpdateY={(v) => handleUpdateSeason(season.id, 'mobileCropPositionY', v)} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-widest">قائمة الحلقات</h4>
                                                        {season.episodes.map((ep, idx) => (
                                                            <div key={ep.id} className="flex flex-col gap-4 p-5 rounded-2xl border border-gray-800 bg-[#161b22] hover:border-gray-700 transition-all group">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="w-32 h-20 bg-black rounded-xl overflow-hidden border border-gray-800 flex-shrink-0 relative group/thumb">
                                                                        {ep.thumbnail ? <img src={ep.thumbnail} className="w-full h-full object-cover transition-transform group-hover/thumb:scale-110"/> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">No Image</div>}
                                                                        <button type="button" onClick={() => openGallery('backdrop', (url) => handleUpdateEpisode(season.id, ep.id, 'thumbnail', url))} className="absolute inset-0 bg-black/60 hidden group-hover/thumb:flex items-center justify-center text-white"><PhotoIcon className="w-5 h-5"/></button>
                                                                    </div>
                                                                    <div className="flex-1 space-y-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="bg-black text-gray-500 font-mono text-xs px-2 py-1 rounded-md border border-gray-800">#{idx+1}</span>
                                                                            <input value={ep.title} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'title', e.target.value)} className="bg-transparent border-b border-gray-700 text-sm font-bold text-white focus:border-[var(--color-accent)] focus:outline-none w-48 transition-colors"/>
                                                                            <input value={ep.duration} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'duration', e.target.value)} className="bg-transparent border-b border-gray-700 text-xs text-gray-400 w-16 text-center" placeholder="00:00"/>
                                                                            <label className="flex items-center gap-2 cursor-pointer ml-auto bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                                                                                <input type="checkbox" checked={ep.isLastEpisode} onChange={e => handleUpdateEpisode(season.id, ep.id, 'isLastEpisode', e.target.checked)} className="accent-red-500 h-4 w-4"/>
                                                                                {ep.isLastEpisode && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">الحلقة الأخيرة</span>}
                                                                                {!ep.isLastEpisode && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الحلقة الأخيرة؟</span>}
                                                                            </label>
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[9px] font-bold text-gray-600 mb-1 block uppercase">رابط صورة الحلقة (Thumbnail URL)</label>
                                                                            <input value={ep.thumbnail || ''} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'thumbnail', e.target.value)} className="w-full bg-black/30 border border-gray-800 rounded-lg px-3 py-1.5 text-[10px] text-gray-400 focus:border-[var(--color-accent)] focus:outline-none dir-ltr" placeholder="Episode direct image link..."/>
                                                                        </div>
                                                                        <input value={ep.description || ''} onChange={(e) => handleUpdateEpisode(season.id, ep.id, 'description', e.target.value)} className="w-full bg-transparent text-xs text-gray-500 focus:outline-none placeholder:text-gray-700" placeholder="اكتب وصفاً مختصراً لهذه الحلقة..."/>
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <button type="button" onClick={() => setEditingServersForEpisode(ep)} className={`px-4 py-2 text-[10px] font-black rounded-lg flex items-center gap-2 shadow-sm transition-all ${ep.servers?.length ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                                                                            <ServerIcon className="w-3.5 h-3.5"/> سيرفرات ({ep.servers?.length || 0})
                                                                        </button>
                                                                        <button type="button" onClick={() => requestDeleteEpisode(season.id, ep.id, ep.title || '')} className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors self-end" title="حذف الحلقة"><TrashIcon className="w-4.5 h-4.5"/></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'servers' && isStandalone && (
                             <div className={`${sectionBoxClass} animate-fade-in-up flex flex-col items-center justify-center py-20 text-center`}>
                                 <ServerIcon className="w-16 h-16 text-gray-700 mb-4"/>
                                 <h3 className="text-xl font-bold text-white mb-2">سيرفرات المشاهدة</h3>
                                 <p className="text-gray-500 text-sm mb-6 max-w-md">أضف روابط المشاهدة والتحميل لهذا الفيلم. يمكنك إضافة عدة سيرفرات لضمان التوفر.</p>
                                 <button type="button" onClick={() => setIsManagingMovieServers(true)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105">
                                     إدارة السيرفرات ({formData.servers?.length || 0})
                                 </button>
                             </div>
                        )}

                    </form>
                </div>

                <footer className="h-20 border-t border-gray-800 bg-[#0f1014]/95 backdrop-blur-xl flex items-center justify-between px-4 md:px-10 z-50 sticky bottom-0 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                     <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-none px-8 py-3 rounded-xl text-sm font-bold text-gray-400 bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:text-white transition-all shadow-sm"
                     >
                        إلغاء
                     </button>
                     <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="flex-none px-8 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-[var(--color-primary-from)] to-[var(--color-primary-to)] text-black shadow-lg shadow-[var(--color-accent)]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                     >
                        <CheckSmallIcon className="w-4 h-4" />
                        <span>حفظ ونشر المحتوى</span>
                     </button>
                </footer>
            </aside>

            {galleryState.isOpen && <ImageGalleryModal isOpen={galleryState.isOpen} onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))} tmdbId={formData.tmdbId || formData.id} type={formData.type} targetField={galleryState.imageType} onSelect={(url) => galleryState.onSelect(url)} />}
            {editingServersForEpisode && <ServerManagementModal episode={editingServersForEpisode} onClose={() => setEditingServersForEpisode(null)} onSave={handleUpdateEpisodeServers} onOpenSearch={() => setIsUqloadModalOpen(true)} />}
            {isManagingMovieServers && <ServerManagementModal episode={{id: 0, title: 'الفيلم', progress: 0, servers: formData.servers || []}} onClose={() => setIsManagingMovieServers(false)} onSave={handleUpdateMovieServers} onOpenSearch={() => setIsUqloadModalOpen(true)} />}
            <DeleteConfirmationModal isOpen={deleteSeasonState.isOpen} onClose={() => setDeleteSeasonState({ isOpen: false, seasonId: null, title: '' })} onConfirm={executeDeleteSeason} title="حذف الموسم" message={`هل أنت متأكد من حذف ${deleteSeasonState.title}؟`} />
            <DeleteConfirmationModal isOpen={deleteEpisodeState.isOpen} onClose={() => setDeleteEpisodeState({ isOpen: false, seasonId: null, episodeId: null, title: '' })} onConfirm={executeDeleteEpisode} title="حذف الحلقة" message={`هل أنت متأكد من حذف ${deleteEpisodeState.title}؟`} />
            {isUqloadModalOpen && (
                <UqloadSearchModal 
                    isOpen={isUqloadModalOpen} 
                    onClose={() => setIsUqloadModalOpen(false)} 
                    onSelect={(res) => { 
                        const newServer: Server = { id: Date.now(), name: 'Uqload', url: res.embedUrl, downloadUrl: res.downloadUrl, isActive: true };
                        if (editingServersForEpisode) { 
                            handleUpdateEpisodeServers([...(editingServersForEpisode.servers || []), newServer]); 
                        } else if (isManagingMovieServers) { 
                            handleUpdateMovieServers([...(formData.servers || []), newServer]); 
                        } 
                    }} 
                />
            )}
        </div>
    );
};

export default ContentEditModal;