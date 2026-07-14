import React, { useState, useEffect, useMemo } from 'react';
import type { GlobalServer, AutoLinkConfig, Server } from '@/types';
import { getServers, addServer } from '@/firebase';
import ToggleSwitch from '../shared/ToggleSwitch';
import { 
    Link as LinkIcon, 
    X as CloseIcon, 
    Plus as PlusIcon, 
    Server as ServerIcon, 
    Check as CheckIcon, 
    ArrowRight as ArrowRightIcon,
    AlertTriangle as AlertIcon,
    Sparkles as SparklesIcon,
    Settings2 as SettingsIcon,
    Eye as EyeIcon,
    FolderGit2 as FolderIcon,
    Hash as HashIcon,
    Activity as ActivityIcon
} from 'lucide-react';

const getCleanedSlug = (slug: string): string => {
    if (!slug) return '';
    if (slug.endsWith('/')) return slug;
    
    const pattern = /[._\-\s/]([Ee]|[Ee][Pp]|[Hh])$/;
    const endsWithSeparator = /[._\-]$/;
    
    if (pattern.test(slug) || endsWithSeparator.test(slug)) {
        return slug;
    }
    return slug + '/';
};

interface AutoLinkPageProps {
    seasonId: number;
    seasonTitle: string;
    seasonNumber: number;
    initialConfig?: AutoLinkConfig;
    globalServers: GlobalServer[];
    onRefreshGlobalServers: () => Promise<void>;
    onSave: (
        config: {
            serverId: string;
            seriesSlug: string;
            suffix: string;
            padZero: boolean;
            padTwoZeros: boolean;
            selectedQualities: string[];
        },
        startNum: number | '',
        endNum: number | ''
    ) => void;
    onCancel: () => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Design System Constants
const INPUT_BG = "bg-[#0c0f17]/90"; 
const BORDER_COLOR = "border-gray-800 hover:border-gray-700/80";
const FOCUS_RING = "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-[#111622]";

const inputClass = `w-full ${INPUT_BG} border ${BORDER_COLOR} rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none ${FOCUS_RING} transition-all duration-200 text-sm shadow-inner`;
const labelClass = "block text-xs font-bold text-gray-300 mb-2 tracking-wide flex items-center gap-1.5";

export default function AutoLinkPage({
    seasonTitle,
    seasonNumber,
    initialConfig,
    globalServers: initialGlobalServers,
    onRefreshGlobalServers,
    onSave,
    onCancel,
    addToast
}: AutoLinkPageProps) {
    const [globalServers, setGlobalServers] = useState<GlobalServer[]>(initialGlobalServers);

    const [serverId, setServerId] = useState(initialConfig?.serverId || '');
    const [seriesSlug, setSeriesSlug] = useState(initialConfig?.seriesSlug || '');
    const [suffix, setSuffix] = useState(initialConfig?.suffix || '.mp4');
    const [startNum, setStartNum] = useState<number | ''>('');
    const [endNum, setEndNum] = useState<number | ''>('');
    const [padZero, setPadZero] = useState(initialConfig ? initialConfig.padZero : true);
    const [padTwoZeros, setPadTwoZeros] = useState(initialConfig ? initialConfig.padTwoZeros : false);
    const [selectedQualities, setSelectedQualities] = useState<string[]>(initialConfig?.selectedQualities || []);

    // New Server Quick-Add States
    const [autoLinkNewServerOpen, setAutoLinkNewServerOpen] = useState(false);
    const [autoLinkNewServerName, setAutoLinkNewServerName] = useState('');
    const [autoLinkNewServerDomain, setAutoLinkNewServerDomain] = useState('');
    const [autoLinkNewServerSaving, setAutoLinkNewServerSaving] = useState(false);

    // Smart Analyzer States
    const [smartPastedUrl, setSmartPastedUrl] = useState('');

    const handleSmartLinkProcess = (pastedUrl: string) => {
        if (!pastedUrl.trim()) {
            addToast("يرجى إدخال الرابط أولاً.", "error");
            return;
        }

        try {
            let urlToParse = pastedUrl.trim();
            // Clean query parameters and hashes
            try {
                const u = new URL(urlToParse.startsWith('http') ? urlToParse : 'https://' + urlToParse);
                urlToParse = u.origin + u.pathname;
            } catch (e) {
                // Fallback if not a strict URL
            }

            const urlObj = new URL(urlToParse.startsWith('http') ? urlToParse : 'https://' + urlToParse);
            const domainOnly = `${urlObj.protocol}//${urlObj.host}/`;
            
            // Now let's work on the pathname
            let pathname = urlObj.pathname;
            if (pathname.startsWith('/')) {
                pathname = pathname.substring(1);
            }

            // Extract extension/suffix (e.g. .mp4, .m3u8, etc.)
            let ext = '.mp4';
            const dotIndex = pathname.lastIndexOf('.');
            if (dotIndex !== -1) {
                ext = pathname.substring(dotIndex);
                pathname = pathname.substring(0, dotIndex);
            }

            // Extract Quality
            let detectedQuality = '';
            const qualities = ['1080p', '720p', '480p', '360p', '240p'];
            for (const q of qualities) {
                const regex = new RegExp(`[-_]?${q}`, 'i');
                if (regex.test(pathname)) {
                    detectedQuality = q;
                    pathname = pathname.replace(regex, '');
                    break;
                }
            }

            // Clean trailing separators if any
            if (pathname.endsWith('-') || pathname.endsWith('_')) {
                pathname = pathname.substring(0, pathname.length - 1);
            }

            // Now we find the last sequence of digits in pathname
            const match = pathname.match(/^(.*?)([0-9]+)$/);
            let slug = pathname;
            let epNum: number | '' = '';
            let shouldPadZero = false;
            let shouldPadTwoZeros = false;

            if (match) {
                slug = match[1];
                const epStr = match[2];
                epNum = parseInt(epStr, 10);

                // Determine padding based on the digits length and value
                const len = epStr.length;
                if (epNum < 10) {
                    if (len === 3) {
                        shouldPadTwoZeros = true;
                        shouldPadZero = false;
                    } else if (len === 2) {
                        shouldPadZero = true;
                        shouldPadTwoZeros = false;
                    } else {
                        shouldPadZero = false;
                        shouldPadTwoZeros = false;
                    }
                } else if (epNum < 100) {
                    if (len === 3) {
                        shouldPadTwoZeros = true;
                        shouldPadZero = false;
                    } else if (len === 2) {
                        shouldPadZero = true;
                        shouldPadTwoZeros = false;
                    } else {
                        shouldPadZero = false;
                        shouldPadTwoZeros = false;
                    }
                } else {
                    // 100+
                    if (len > 3) {
                        shouldPadTwoZeros = true;
                        shouldPadZero = false;
                    } else {
                        shouldPadZero = false;
                        shouldPadTwoZeros = false;
                    }
                }
            }

            // Update states!
            // 1. Suffix
            setSuffix(ext);

            // 2. Quality
            if (detectedQuality) {
                setSelectedQualities([detectedQuality]);
            } else {
                setSelectedQualities([]);
            }

            // 3. Episode Numbers
            if (epNum !== '') {
                setStartNum(epNum);
                setEndNum(epNum);
            }

            // 4. Zero Padding toggles
            setPadZero(shouldPadZero);
            setPadTwoZeros(shouldPadTwoZeros);

            // 5. Series Slug
            setSeriesSlug(slug);

            // 6. Look for matching server in globalServers
            const matchedServer = globalServers.find(gs => {
                try {
                    const gsUrl = new URL(gs.baseDomain.startsWith('http') ? gs.baseDomain : 'https://' + gs.baseDomain);
                    return gsUrl.hostname.replace('www.', '').toLowerCase() === urlObj.hostname.replace('www.', '').toLowerCase();
                } catch {
                    return false;
                }
            });

            if (matchedServer) {
                setServerId(matchedServer.id);
                addToast(`تم التعرف على السيرفر "${matchedServer.name}" بنجاح وتعبئة جميع الحقول بذكاء!`, "success");
            } else {
                setAutoLinkNewServerOpen(true);
                setAutoLinkNewServerDomain(domainOnly);
                const host = urlObj.hostname.replace('www.', '');
                const rawName = host.split('.')[0];
                const serverNameDefault = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                setAutoLinkNewServerName(serverNameDefault);
                
                addToast("تمت معالجة الرابط وتعبئة البيانات! يرجى حفظ السيرفر الجديد بالأسفل لاعتماد النطاق.", "info");
            }

        } catch (error) {
            console.error(error);
            addToast("فشلت معالجة الرابط. تأكد من صحة الرابط المدخل.", "error");
        }
    };

    useEffect(() => {
        getServers().then(setGlobalServers).catch(err => {
            console.error("Failed to load global servers in AutoLinkPage:", err);
        });
    }, []);

    const handleSave = () => {
        if (!serverId) {
            addToast("يرجى اختيار سيرفر البث.", "error");
            return;
        }
        if (!seriesSlug.trim()) {
            addToast("مسار / اسم السلسلة مطلوب.", "error");
            return;
        }
        if (startNum === '' || endNum === '') {
            addToast("يرجى إدخال نطاق ترقيم الحلقات (من وإلى).", "error");
            return;
        }
        if (endNum < startNum) {
            addToast("رقم البداية يجب أن يكون أصغر من أو يساوي رقم النهاية.", "error");
            return;
        }

        onSave({
            serverId,
            seriesSlug,
            suffix,
            padZero,
            padTwoZeros,
            selectedQualities
        }, startNum, endNum);
    };

    // --- Computed Logic & Helpers ---
    const extractedServerDomainInfo = useMemo(() => {
        const urlVal = autoLinkNewServerDomain.trim();
        const isFullUrl = urlVal && (urlVal.includes('.mp4') || urlVal.includes('.m3u8') || urlVal.includes('?') || (urlVal.match(/\//g) || []).length > 3);
        if (!isFullUrl) return null;
        
        try {
            const urlObj = new URL(urlVal.startsWith('http') ? urlVal : 'https://' + urlVal);
            const host = urlObj.hostname.replace('www.', '');
            const domainOnly = `${urlObj.protocol}//${urlObj.host}/`;
            const rawName = host.split('.')[0];
            const serverNameDefault = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            return { domainOnly, serverNameDefault };
        } catch {
            return null;
        }
    }, [autoLinkNewServerDomain]);

    const matchedExistingServer = useMemo(() => {
        if (!autoLinkNewServerName.trim() && !autoLinkNewServerDomain.trim()) return null;
        const normalized = autoLinkNewServerName.trim().toLowerCase();
        let checkDomain = autoLinkNewServerDomain.trim();
        if (checkDomain) {
            if (!checkDomain.startsWith('http://') && !checkDomain.startsWith('https://')) {
                checkDomain = 'https://' + checkDomain;
            }
            if (!checkDomain.endsWith('/')) {
                checkDomain += '/';
            }
        }
        const checkClean = checkDomain ? checkDomain.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase() : '';

        return globalServers.find(gs => {
            const isNameMatch = normalized ? gs.name.trim().toLowerCase() === normalized : false;
            const gsClean = gs.baseDomain.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
            const isDomainMatch = checkClean ? gsClean === checkClean : false;
            return isNameMatch || isDomainMatch;
        });
    }, [autoLinkNewServerName, autoLinkNewServerDomain, globalServers]);

    const extractedSlugInfo = useMemo(() => {
        const val = seriesSlug || '';
        const isUrl = val.startsWith('http://') || val.startsWith('https://') || val.includes('://');
        if (!isUrl) return null;

        try {
            const urlObj = new URL(val.startsWith('http') ? val : 'https://' + val);
            const hostname = urlObj.hostname;
            const pathname = urlObj.pathname;
            const segments = pathname.split('/').filter(Boolean);
            
            let extractedSlug = '';
            let extractedSuffix = '.mp4';
            let hasFileSegment = false;
            let detectedServerId = '';
            let detectedServerName = '';

            if (segments.length > 0) {
                const lastSegment = segments[segments.length - 1];
                const dotIndex = lastSegment.lastIndexOf('.');
                if (dotIndex !== -1) {
                    hasFileSegment = true;
                    extractedSuffix = lastSegment.substring(dotIndex);
                    const slugSegments = segments.slice(0, -1);
                    extractedSlug = slugSegments.join('/') + '/';
                } else {
                    extractedSlug = segments.join('/') + '/';
                }
            }

            if (extractedSlug && !extractedSlug.endsWith('/')) {
                extractedSlug += '/';
            }

            const matchedServer = globalServers.find(gs => {
                try {
                    const gsUrl = new URL(gs.baseDomain.startsWith('http') ? gs.baseDomain : 'https://' + gs.baseDomain);
                    return gsUrl.hostname.replace('www.', '').toLowerCase() === hostname.replace('www.', '').toLowerCase();
                } catch {
                    return false;
                }
            });

            if (matchedServer) {
                detectedServerId = matchedServer.id;
                detectedServerName = matchedServer.name;
            }

            return { extractedSlug, extractedSuffix, hasFileSegment, detectedServerId, detectedServerName };
        } catch {
            return null;
        }
    }, [seriesSlug, globalServers]);

    const previewLinks = useMemo(() => {
        const matchedServer = globalServers.find(s => s.id === serverId);
        const base = matchedServer ? matchedServer.baseDomain : 'https://[SERVER_DOMAIN]/';
        const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
        const slug = seriesSlug || '[SERIES_SLUG]/';
        const cleanSlug = getCleanedSlug(slug);
        
        const num = startNum || 1;
        let numStr = `${num}`;
        if (padTwoZeros) {
            numStr = num < 10 ? `00${num}` : (num < 100 ? `0${num}` : `${num}`);
        } else if (padZero) {
            numStr = num < 10 ? `0${num}` : `${num}`;
        }
        
        const qualityOrder = ['1080p', '720p', '480p', '360p', '240p'];
        const sortedSelectedQualities = [...selectedQualities].sort((a, b) => {
            const idxA = qualityOrder.indexOf(a);
            const idxB = qualityOrder.indexOf(b);
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });

        if (sortedSelectedQualities.length > 0) {
            return sortedSelectedQualities.map(q => ({
                quality: q,
                url: `${cleanBase}/${cleanSlug}${numStr}-${q}${suffix || '.mp4'}`
            }));
        }
        
        return [{ quality: null, url: `${cleanBase}/${cleanSlug}${numStr}${suffix || '.mp4'}` }];
    }, [serverId, seriesSlug, startNum, padZero, padTwoZeros, selectedQualities, suffix, globalServers]);

    const handleSaveNewServer = async () => {
        if (!autoLinkNewServerName.trim()) {
            addToast("يرجى إدخال اسم السيرفر.", "error");
            return;
        }

        let domain = autoLinkNewServerDomain.trim();
        if (!domain) {
            domain = "https://";
        } else {
            if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
                domain = 'https://' + domain;
            }
            if (!domain.endsWith('/')) {
                domain += '/';
            }
        }

        if (matchedExistingServer) {
            setServerId(matchedExistingServer.id);
            setAutoLinkNewServerName('');
            setAutoLinkNewServerDomain('');
            setAutoLinkNewServerOpen(false);
            addToast(`هذا السيرفر مضاف مسبقاً باسم "${matchedExistingServer.name}". تم اختياره تلقائياً!`, "info");
            return;
        }

        setAutoLinkNewServerSaving(true);
        try {
            await addServer({
                name: autoLinkNewServerName.trim(),
                baseDomain: domain
            });
            if (onRefreshGlobalServers) {
                await onRefreshGlobalServers();
            }
            const serversData = await getServers();
            setGlobalServers(serversData);

            const newlyAdded = serversData.find(s => s.name.trim().toLowerCase() === autoLinkNewServerName.trim().toLowerCase());
            if (newlyAdded) {
                setServerId(newlyAdded.id);
            }

            addToast(`تم إضافة خادم البث "${autoLinkNewServerName}" بنجاح واختياره!`, "success");
            setAutoLinkNewServerName('');
            setAutoLinkNewServerDomain('');
            setAutoLinkNewServerOpen(false);
        } catch (err) {
            addToast("حدث خطأ أثناء إضافة خادم البث الجديد.", "error");
        } finally {
            setAutoLinkNewServerSaving(false);
        }
    };

    return (
        /* 
           تعديل جوهري هنا: تم استخدام w-full h-full max-h-screen overflow-y-auto 
           لإجبار المتصفح على إظهار شريط التمرير (Scroll) مهما كانت قيود الملف الأب!
        */
        <div className="w-full h-full min-h-screen max-h-screen overflow-y-auto bg-[#090b10] text-gray-200 font-['Cairo'] flex flex-col justify-between relative" dir="rtl">
            
            {/* Sticky Header - معلق في أعلى الشاشة ومريح جداً في التمرير */}
            <header className="sticky top-0 z-40 w-full bg-[#0e121b]/95 backdrop-blur-md border-b border-gray-800/80 px-4 md:px-8 py-4 shadow-lg shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button" 
                            onClick={onCancel} 
                            className="text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-800 p-2.5 rounded-2xl transition-all duration-200 border border-gray-700/50 cursor-pointer"
                            title="رجوع"
                        >
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0 shadow-sm">
                                <LinkIcon className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg md:text-xl font-black text-white tracking-tight">توليد روابط الحلقات تلقائياً</h1>
                                <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5 font-medium">
                                    <span>الموسم الحالي:</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{seasonTitle}</span>
                                    <span className="text-gray-500 font-mono">(موسم {seasonNumber})</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center w-full sm:w-auto">
                        <button 
                            onClick={onCancel} 
                            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gray-800/80 text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-700/50 transition-all duration-200 cursor-pointer"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={handleSave} 
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-black"
                        >
                            <LinkIcon className="w-4 h-4 stroke-[2.5]" />
                            <span>اعتماد الروابط</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area - مساحة مفتوحة وتمرير طبيعي بدون قيود */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in my-auto">
                
                {/* ⚡ بطاقة المعالجة الذكية والتحليل السريع للروابط */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-[#10141f] to-[#10141f] border border-emerald-500/30 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-full pointer-events-none blur-3xl"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                                <SparklesIcon className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-base font-black text-white">المعالج الذكي للروابط (ملء تلقائي فوري)</h2>
                                <p className="text-gray-400 text-xs mt-0.5">الصق رابط فيديو كامل لأي حلقة وسيتولى النظام تفكيكه وملء جميع حقول الصفحة بذكاء خارق!</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    value={smartPastedUrl}
                                    onChange={e => setSmartPastedUrl(e.target.value)}
                                    placeholder="الصق الرابط الكامل هنا (مثال: https://b2.shahidtv.net/files/TR/Daha-17/Daha-17-S01-EP001-1080p.mp4)"
                                    className={`${inputClass} font-mono text-left pl-10 pr-4 text-white font-bold`}
                                    dir="ltr"
                                />
                                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-500">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSmartLinkProcess(smartPastedUrl)}
                                className="px-6 py-3.5 rounded-xl text-xs md:text-sm font-black text-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span>معالجة الرابط وتحليل البيانات ⚡</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Right Column: Server and Path options (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-[#10141f] border border-gray-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl relative">
                            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
                                <div className="flex items-center gap-2.5 text-base font-black text-white">
                                    <ServerIcon className="w-5 h-5 text-emerald-400" />
                                    <span>بيانات الخادم والمسار الأساسي</span>
                                </div>
                                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">الخطوة 1</span>
                            </div>
                            
                            {/* Server Selection */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className={labelClass}>
                                        <span>سيرفر البث (الدومين النشط)</span>
                                    </label>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setAutoLinkNewServerOpen(!autoLinkNewServerOpen);
                                            setAutoLinkNewServerName('');
                                            setAutoLinkNewServerDomain('');
                                        }}
                                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 select-none bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 cursor-pointer"
                                    >
                                        {autoLinkNewServerOpen ? (
                                            <span className="flex items-center gap-1"><CloseIcon className="w-3.5 h-3.5"/> إغلاق الإضافة</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><PlusIcon className="w-3.5 h-3.5"/> إضافة خادم سريعاً</span>
                                        )}
                                    </button>
                                </div>
                                
                                <div className="relative">
                                    <select
                                        value={serverId}
                                        onChange={e => setServerId(e.target.value)}
                                        className={`${inputClass} font-medium text-sm appearance-none cursor-pointer pr-4 pl-10 text-emerald-400 font-bold`}
                                    >
                                        <option value="" className="bg-[#10141f] text-gray-400 font-normal">-- اختر السيرفر المناسب من القائمة --</option>
                                        {globalServers.map(server => (
                                            <option key={server.id} value={server.id} className="bg-[#10141f] text-white py-2">
                                                {server.name} ({server.baseDomain})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>

                                {globalServers.length === 0 && (
                                    <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold mt-2">
                                        <AlertIcon className="w-4 h-4 shrink-0" />
                                        <span>لا توجد سيرفرات بث مسجلة! يرجى إضافة سيرفر عبر الزر بالأعلى.</span>
                                    </div>
                                )}
                            </div>

                            {/* Quick addition of new server */}
                            {autoLinkNewServerOpen && (
                                <div className="bg-[#141927] border-2 border-emerald-500/30 p-5 rounded-2xl space-y-4 shadow-lg transition-all animate-fade-in">
                                    <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                                        <div className="flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-black text-white">تسجيل خادم بث رسمي جديد</span>
                                        </div>
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">إضافة سريعة</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold text-gray-300">اسم السيرفر الجديد</label>
                                            <input 
                                                type="text" 
                                                value={autoLinkNewServerName} 
                                                onChange={e => setAutoLinkNewServerName(e.target.value)} 
                                                placeholder="مثال: Uqload" 
                                                className="w-full rounded-xl border border-gray-800 bg-[#0c0f17] px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-xs font-bold text-gray-300">رابط / دومين السيرفر</label>
                                            <input 
                                                type="text" 
                                                value={autoLinkNewServerDomain} 
                                                onChange={e => setAutoLinkNewServerDomain(e.target.value)} 
                                                placeholder="الصق الرابط الكامل أو الدومين..." 
                                                className="w-full rounded-xl border border-gray-800 bg-[#0c0f17] px-3.5 py-2.5 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold transition-all"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    {extractedServerDomainInfo && (
                                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-bold animate-pulse">
                                            <div className="flex items-center gap-2">
                                                <SparklesIcon className="w-4 h-4 text-amber-400 shrink-0" />
                                                <span>تم كشف رابط فيديو كامل! هل تريد استخراج الدومين؟</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setAutoLinkNewServerDomain(extractedServerDomainInfo.domainOnly);
                                                    if (!autoLinkNewServerName.trim()) {
                                                        setAutoLinkNewServerName(extractedServerDomainInfo.serverNameDefault);
                                                    }
                                                    addToast(`تم استخراج رابط الخادم: ${extractedServerDomainInfo.domainOnly}`, "info");
                                                }}
                                                className="px-3 py-1.5 bg-amber-500 text-black font-black hover:bg-amber-400 rounded-lg text-xs shadow transition-colors shrink-0 cursor-pointer"
                                            >
                                                استخراج الدومين ⚡
                                            </button>
                                        </div>
                                    )}

                                    {matchedExistingServer && (
                                        <div className="bg-[#201815] border border-amber-500/40 text-amber-300 p-4 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-bold">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-amber-400">
                                                    <AlertIcon className="w-4 h-4 shrink-0" />
                                                    <span>هذا الخادم مضاف مسبقاً بقاعدة البيانات!</span>
                                                </div>
                                                <p className="text-[11px] text-gray-300 font-normal">
                                                    موجود باسم: <span className="text-white font-bold">"{matchedExistingServer.name}"</span> ودومين: <code className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded" dir="ltr">{matchedExistingServer.baseDomain}</code>
                                                </p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setServerId(matchedExistingServer.id);
                                                    setAutoLinkNewServerName('');
                                                    setAutoLinkNewServerDomain('');
                                                    setAutoLinkNewServerOpen(false);
                                                    addToast(`تم اختيار السيرفر "${matchedExistingServer.name}" وتحديده بنجاح!`, "info");
                                                }}
                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-xs shadow transition-colors shrink-0 cursor-pointer"
                                            >
                                                اعتماده مباشرة 🔗
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-800/80">
                                        <button 
                                            type="button" 
                                            onClick={() => setAutoLinkNewServerOpen(false)}
                                            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
                                        >
                                            إلغاء
                                        </button>
                                        <button 
                                            type="button" 
                                            disabled={autoLinkNewServerSaving}
                                            onClick={handleSaveNewServer}
                                            className="px-4 py-2 text-xs font-black text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                                        >
                                            {autoLinkNewServerSaving ? 'جاري الإضافة...' : '➕ حفظ وتحديد الخادم'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Series Slug */}
                            <div className="space-y-2">
                                <label className={labelClass}>
                                    <FolderIcon className="w-4 h-4 text-gray-400" />
                                    <span>مسار / اسم السلسلة (Series Slug)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={seriesSlug} 
                                    onChange={e => setSeriesSlug(e.target.value)} 
                                    className={`${inputClass} font-mono text-left text-white font-bold text-base`}
                                    dir="ltr"
                                    placeholder="مثال: Baba-w-Mama-Giran/ أو الصق رابط حلقة كامل هنا..." 
                                />
                                
                                {extractedSlugInfo && (
                                    <div className="bg-[#141927] border border-amber-500/30 p-5 rounded-2xl text-xs flex flex-col gap-3 mt-3 font-bold shadow-lg">
                                        <div className="flex items-center gap-2 text-amber-400 border-b border-gray-800/80 pb-2">
                                            <SparklesIcon className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span>ذكاء المحرك: تم كشف رابط فيديو كامل في مسار السلسلة!</span>
                                        </div>
                                        <div className="text-xs text-gray-300 space-y-2 font-normal text-right">
                                            {extractedSlugInfo.extractedSlug && (
                                                <div className="flex items-center justify-between bg-black/40 px-3.5 py-2 rounded-xl border border-gray-800">
                                                    <span className="text-gray-400">المسار المستخلص:</span>
                                                    <span className="text-amber-400 font-mono font-bold" dir="ltr">{extractedSlugInfo.extractedSlug}</span>
                                                </div>
                                            )}
                                            {extractedSlugInfo.hasFileSegment && (
                                                <div className="flex items-center justify-between bg-black/40 px-3.5 py-2 rounded-xl border border-gray-800">
                                                    <span className="text-gray-400">الامتداد المستخلص:</span>
                                                    <span className="text-amber-400 font-mono font-bold" dir="ltr">{extractedSlugInfo.extractedSuffix}</span>
                                                </div>
                                            )}
                                            {extractedSlugInfo.detectedServerName && (
                                                <div className="flex items-center justify-between bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 text-emerald-400">
                                                    <span>السيرفر المطابق بقاعدة البيانات:</span>
                                                    <span className="font-bold">{extractedSlugInfo.detectedServerName}</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (extractedSlugInfo.extractedSlug) setSeriesSlug(extractedSlugInfo.extractedSlug);
                                                if (extractedSlugInfo.hasFileSegment) setSuffix(extractedSlugInfo.extractedSuffix);
                                                if (extractedSlugInfo.detectedServerId) setServerId(extractedSlugInfo.detectedServerId);
                                                addToast("تم استخراج المسار والامتداد (وتحديد السيرفر إن وجد) بنجاح 🚀", "success");
                                            }}
                                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
                                        >
                                            <span>تطبيق البيانات المستخرجة تلقائياً ⚡</span>
                                        </button>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 font-medium pt-1">تلميح: اسم المجلد على السيرفر متبوعاً بشرطة مائلة (مثال: <code className="text-gray-400 font-mono bg-gray-800/60 px-1.5 py-0.5 rounded">Baba-w-Mama-Giran/</code>)</p>
                            </div>
                            
                            {/* Suffix */}
                            <div className="space-y-2">
                                <label className={labelClass}>
                                    <HashIcon className="w-4 h-4 text-gray-400" />
                                    <span>صيغة / امتداد الفيديو (Suffix)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={suffix} 
                                    onChange={e => setSuffix(e.target.value)} 
                                    className={`${inputClass} font-mono text-left font-bold text-white`} 
                                    placeholder="مثال: .mp4" 
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Numbering Options & Quality (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#10141f] border border-gray-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
                            <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
                                <div className="flex items-center gap-2.5 text-base font-black text-white">
                                    <SettingsIcon className="w-5 h-5 text-emerald-400" />
                                    <span>خيارات الترقيم والجودة</span>
                                </div>
                                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">الخطوة 2</span>
                            </div>
                            
                            {/* Episodes Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>من الحلقة</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={startNum} 
                                        onChange={e => setStartNum(e.target.value === '' ? '' : parseInt(e.target.value))} 
                                        className={`${inputClass} font-black text-center text-white text-2xl py-3`} 
                                        placeholder="1" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>إلى الحلقة</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={endNum} 
                                        onChange={e => setEndNum(e.target.value === '' ? '' : parseInt(e.target.value))} 
                                        className={`${inputClass} font-black text-center text-white text-2xl py-3`} 
                                        placeholder="30" 
                                    />
                                </div>
                            </div>

                            {/* Zero Padding Toggles */}
                            <div className="space-y-3 pt-1">
                                <div className="flex items-center justify-between bg-[#141927]/80 p-4 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-200">إضافة صفر للأرقام الفردية</span>
                                        <span className="text-[11px] text-gray-500 font-mono mt-0.5" dir="ltr">01, 02 instead of 1, 2</span>
                                    </div>
                                    <ToggleSwitch 
                                        checked={padZero} 
                                        onChange={val => {
                                            setPadZero(val);
                                            if (val) setPadTwoZeros(false);
                                        }} 
                                        label={padZero ? "مفعل" : "معطل"} 
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-[#141927]/80 p-4 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-200">إضافة صفرين للأرقام</span>
                                        <span className="text-[11px] text-gray-500 font-mono mt-0.5" dir="ltr">001, 010 instead of 1, 10</span>
                                    </div>
                                    <ToggleSwitch 
                                        checked={padTwoZeros} 
                                        onChange={val => {
                                            setPadTwoZeros(val);
                                            if (val) setPadZero(false);
                                        }} 
                                        label={padTwoZeros ? "مفعل" : "معطل"} 
                                    />
                                </div>
                            </div>

                            {/* Quality Selection */}
                            <div className="space-y-3.5 bg-[#141927]/50 p-5 rounded-2xl border border-gray-800/80">
                                <div className="flex items-center justify-between">
                                    <label className={`${labelClass} !mb-0 text-gray-200 font-bold`}>
                                        <ActivityIcon className="w-4 h-4 text-emerald-400" />
                                        <span>تحديد الجودات (اختياري - متعدد)</span>
                                    </label>
                                    {selectedQualities.length > 0 && (
                                        <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-md">
                                            محدد: {selectedQualities.length}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2.5 pt-1">
                                    {['1080p', '720p', '480p', '360p', '240p'].map((qual) => {
                                        const isSelected = selectedQualities.includes(qual);
                                        return (
                                            <button
                                                key={qual}
                                                type="button"
                                                onClick={() => {
                                                    const updated = selectedQualities.includes(qual)
                                                        ? selectedQualities.filter(q => q !== qual)
                                                        : [...selectedQualities, qual];
                                                    setSelectedQualities(updated);
                                                }}
                                                className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-md shadow-emerald-500/10 font-black scale-[1.02]'
                                                        : 'bg-[#0c0f17] text-gray-400 border-gray-800 hover:bg-gray-800/80 hover:text-white'
                                                }`}
                                            >
                                                {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                                                <span>{qual}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed pt-1">
                                    * عند اختيار جودات، سيتم توليد خادم منفصل لكل جودة تلقائياً. في حال عدم التحديد، سيتم التوليد بالطريقة الافتراضية.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Preview box - كبير ومريح في العرض */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-[#10141f] to-[#10141f] border border-emerald-500/30 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-br-full pointer-events-none blur-2xl"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 relative z-10">
                        <div className="flex items-center gap-2.5 text-emerald-400 font-black text-sm">
                            <EyeIcon className="w-5 h-5" />
                            <span>معاينة حية لشكل الرابط المتوقع (للحلقة الأولى):</span>
                        </div>
                        <span className="text-xs font-mono bg-black/50 text-gray-400 px-3 py-1 rounded-xl border border-gray-800 self-start sm:self-center">
                            Live Output Preview
                        </span>
                    </div>

                    <div className="text-xs md:text-sm text-white font-mono break-all dir-ltr text-left bg-[#080a0f]/95 p-5 rounded-2xl border border-gray-800/80 shadow-inner relative z-10 space-y-3.5">
                        {previewLinks.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-gray-800/70 pb-3 last:border-b-0 last:pb-0">
                                {item.quality && (
                                    <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg font-bold shrink-0 self-start sm:self-center">
                                        {item.quality}
                                    </span>
                                )}
                                <span className="text-gray-200 font-bold select-all hover:text-emerald-400 transition-colors tracking-wide">
                                    {item.url}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* 
               تعديل جوهري 2: استخدام sticky bottom-0 mt-auto 
               بدلاً من fixed عشان متغطيش على أي القوائم الجانبية (Sidebars) وتفضل متثبتة تحت! 
            */}
            <footer className="sticky bottom-0 z-40 w-full bg-[#0e121b]/95 backdrop-blur-md border-t border-gray-800/80 py-4 px-4 md:px-8 shadow-2xl shrink-0 mt-auto">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>جميع التغييرات جاهزة للتطبيق. تأكد من مسار السلسلة وأرقام الحلقات قبل الاعتماد.</span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button 
                            onClick={onCancel} 
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gray-800/80 text-xs font-bold text-gray-300 hover:bg-gray-800 hover:text-white border border-gray-700/50 transition-all duration-200 cursor-pointer"
                        >
                            إلغاء والرجوع
                        </button>
                        <button 
                            onClick={handleSave} 
                            className="flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black text-black bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <LinkIcon className="w-4 h-4 stroke-[2.5]" />
                            <span>توليد واعتماد الروابط الآن</span>
                        </button>
                    </div>
                </div>
            </footer>

        </div>
    );
}