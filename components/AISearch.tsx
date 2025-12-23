
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Content, View } from '@/types';
import ContentCard from './ContentCard';
import { SearchIcon } from './icons/SearchIcon';
import { CloseIcon } from './icons/CloseIcon';

interface AISearchProps {
  allContent: Content[];
  onSelectContent: (content: Content) => void;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
  isRamadanTheme?: boolean;
}

const AISearch: React.FC<AISearchProps> = ({ 
    allContent, 
    onSelectContent, 
    isLoggedIn, 
    myList, 
    onToggleMyList,
    isRamadanTheme 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setAiThinking(true);
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // تبسيط بيانات المحتوى ليرسلها للذكاء الاصطناعي (العناوين والأنواع والوصف فقط لتقليل التوكينز)
      const contentLibrary = allContent.map(c => ({
        id: c.id,
        title: c.title,
        genres: c.genres.join(','),
        type: c.type,
        desc: c.description.substring(0, 100)
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        systemInstruction: `أنت خبير سينمائي في منصة "سينماتيكس". مهمتك هي مساعدة المستخدم في العثور على ما يشاهده من القائمة المتوفرة فقط. 
        بناءً على طلب المستخدم، اختر أفضل 6 نتائج مطابقة من القائمة المقدمة لك. 
        يجب أن يكون الرد بصيغة JSON فقط عبارة عن مصفوفة من الـ IDs الخاصة بالمحتوى المختار. 
        مثال الرد: ["1", "5", "12"]`,
        contents: `قائمة المحتوى: ${JSON.stringify(contentLibrary)}. طلب المستخدم: "${query}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const matchedIds = JSON.parse(response.text || "[]");
      const matchedContent = allContent.filter(c => matchedIds.includes(c.id));
      setResults(matchedContent);
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setIsLoading(false);
      setAiThinking(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-12 lg:px-16 mb-12">
      <div className={`relative p-6 md:p-8 rounded-[2.5rem] overflow-hidden border transition-all duration-500 
        ${isRamadanTheme 
          ? 'bg-amber-950/20 border-amber-500/30' 
          : 'bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl'}`}>
        
        {/* AI Background Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] animate-pulse delay-700"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl animate-bounce">✨</span>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white">البحث الذكي (AI)</h3>
              <p className="text-xs md:text-sm text-gray-400 font-bold">اسألني عن أي شيء تريد مشاهدته وسأقترحه لك!</p>
            </div>
          </div>

          <form onSubmit={handleAISearch} className="relative group">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثلاً: بدي فيلم أكشن أجنبي قصة انتقام..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 md:py-5 pr-14 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'جاري التفكير...' : 'اسأل ذكاء'}
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <SearchIcon className="w-6 h-6 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
          </form>

          {results.length > 0 && (
            <div className="mt-8 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest">مقترحات الذكاء الاصطناعي لك:</h4>
                <button onClick={() => setResults([])} className="text-xs text-gray-500 hover:text-white">مسح النتائج</button>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar rtl-scroll">
                {results.map(content => (
                  <div key={content.id} className="w-40 md:w-48 flex-shrink-0">
                    <ContentCard 
                      content={content}
                      onSelectContent={onSelectContent}
                      isLoggedIn={isLoggedIn}
                      myList={myList}
                      onToggleMyList={onToggleMyList}
                      isRamadanTheme={isRamadanTheme}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiThinking && results.length === 0 && (
            <div className="mt-8 flex flex-col items-center justify-center py-10 animate-pulse">
                <div className="flex gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></div>
                </div>
                <p className="text-sm text-blue-400 font-bold">جاري تحليل مكتبة الأفلام والمسلسلات...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISearch;
