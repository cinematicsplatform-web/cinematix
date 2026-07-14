
import React, { useState } from 'react';
import { CloseIcon } from '../icons/CloseIcon';
import { SearchIcon } from '../icons/SearchIcon';

// Local Link Icon
const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

const CloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

interface UqloadFile {
    file_code: string;
    name: string;
    size?: string;
}

interface UqloadResult {
    embedUrl: string;
    downloadUrl: string;
    name: string;
}

interface UqloadSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (result: UqloadResult) => void;
}

const UqloadSearchModal: React.FC<UqloadSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<UqloadFile[]>([]);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    // بيانات الاتصال الخاصة بالمستخدم
    const API_KEY = '150390klo47yxemdrsky1o';
    const API_DOMAIN = 'https://uqload.co'; 
    const LINK_DOMAIN = 'https://uqload.co';

    // دالة لجلب معلومات الملف مباشرة
    const fetchFileInfo = async (fileCode: string): Promise<any> => {
        const targetUrl = `${API_DOMAIN}/api/file/info?key=${API_KEY}&file_code=${fileCode}`;
        
        // قائمة البروكسيات (الأولوية للأسرع)
        const proxies = [
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
        ];

        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy);
                if (res.ok) {
                    let data;
                    
                    // معالجة خاصة لـ AllOrigins
                    if (proxy.includes('allorigins')) {
                        const wrapper = await res.json();
                        if (wrapper.contents) {
                            try {
                                data = JSON.parse(wrapper.contents);
                            } catch (e) {
                                continue;
                            }
                        }
                    } else {
                        data = await res.json();
                    }

                    if (data && data.status === 200 && data.result) {
                        // API returns result as an object for single file, or array for multiple
                        // Note: info API with single code returns result object directly or array of 1
                        const resList = Array.isArray(data.result) ? data.result : [data.result];
                        return resList[0];
                    }
                }
            } catch (e) {
                // نتابع للبروكسي التالي بصمت
            }
        }

        return null;
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const input = query.trim();
        if (!input) {
            setError('يرجى وضع رابط الملف');
            return;
        }

        setLoading(true);
        setError('');
        setStatusMessage('جاري تحليل الرابط...');
        setResults([]);

        try {
            let fileCode = input;

            // استخراج الكود إذا كان المدخل رابطاً
            // يدعم: https://uqload.co/xxxxx.html أو https://uqload.cx/embed-xxxxx.html
            const urlRegex = /(?:uqload\.(?:co|com|io|cx|to|net))\/(?:embed-)?([a-zA-Z0-9]+)/i;
            const match = input.match(urlRegex);
            
            if (match && match[1]) {
                fileCode = match[1];
            } else {
                // Check if it looks like a code (alphanumeric)
                const isCode = /^[a-zA-Z0-9]+$/.test(input);
                if (!isCode) {
                    setError('صيغة الرابط غير صحيحة. تأكد من نسخ رابط Uqload الصحيح.');
                    setLoading(false);
                    setStatusMessage('');
                    return;
                }
            }

            console.log(`🔗 Resolving Link: ${input} -> Code: ${fileCode}`);
            setStatusMessage(`جاري جلب بيانات الملف (${fileCode})...`);

            const fileData = await fetchFileInfo(fileCode);

            if (fileData) {
                // Check if file exists (API sometimes returns success but empty or error text in result)
                if (fileData.file_code) {
                    setResults([{
                        file_code: fileData.file_code,
                        name: fileData.name || 'ملف بدون عنوان',
                        size: fileData.size ? String(fileData.size) : undefined
                    }]);
                    setStatusMessage('');
                } else {
                    setError('الملف غير موجود أو تم حذفه.');
                }
            } else {
                setError("فشل الاتصال: لم يتم العثور على بيانات الملف. تأكد من صحة الرابط أو صلاحية الـ API.");
            }

        } catch (err: any) {
            console.error("❌ Resolve Error:", err);
            setError('حدث خطأ غير متوقع أثناء المعالجة.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFile = (file: UqloadFile) => {
        const result: UqloadResult = {
            name: file.name,
            embedUrl: `${LINK_DOMAIN}/embed-${file.file_code}.html`,
            downloadUrl: `${LINK_DOMAIN}/${file.file_code}.html`
        };
        onSelect(result);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-xl text-white overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                        <LinkIcon />
                        جلب ملف من Uqload
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                        <CloseIcon />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-gray-800">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="ضع رابط Uqload هنا (مثال: https://uqload.co/abc...)"
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:border-blue-500 dir-ltr text-left placeholder:text-right"
                                autoFocus
                            />
                            <div className="absolute left-3 top-2.5 text-gray-500">
                                <LinkIcon />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? '...' : 'جلب'}
                        </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2 px-1">
                        * الصق رابط الملف أو كود الملف مباشرة. سيتم جلب الاسم والحجم تلقائياً.
                    </p>
                </div>

                {/* Status Message */}
                {loading && (
                    <div className="px-4 py-2 text-center text-xs text-blue-300 animate-pulse">
                        {statusMessage || 'جاري الاتصال...'}
                    </div>
                )}

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                    
                    {!loading && error && (
                        <div className="text-center py-8 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 mx-4 text-sm font-bold">
                            {error}
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-3">
                            <CloudIcon />
                            <span>بإمكانك إضافة ملفاتك بسهولة عبر نسخ الرابط ولصقه هنا.</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        {results.map((file) => (
                            <div 
                                key={file.file_code} 
                                onClick={() => handleSelectFile(file)}
                                className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-gray-600 border border-gray-600 hover:border-blue-500 rounded-lg cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-blue-500/20 p-2 rounded text-blue-400">
                                        <CloudIcon />
                                    </div>
                                    <div className="truncate flex-1">
                                        <p className="text-sm font-bold text-white group-hover:text-blue-300 truncate text-right">{file.name}</p>
                                        <div className="flex gap-3 text-[10px] text-gray-400 font-mono dir-ltr">
                                            <span>{file.file_code}</span>
                                            {file.size && <span>• {file.size}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-500 flex-shrink-0">
                                    إضافة
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UqloadSearchModal;
