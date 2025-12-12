import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { getAIRecommendation } from '../services/geminiService';

export const GeminiSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    const result = await getAIRecommendation(query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="px-4 md:px-12 mb-16">
      <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Sparkles size={20} className="animate-pulse" />
            <span className="font-bold text-sm tracking-widest uppercase">مساعد شاهد الذكي</span>
          </div>
          
          <h3 className="text-2xl font-bold mb-4">محتار إيش تتابع؟ اسأل الذكاء الاصطناعي</h3>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: اقترح لي فيلم حزين، أو مسلسل كوميدي مصري جديد..."
              className="flex-1 bg-black/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold flex items-center justify-center disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} className="transform rotate-180" /> 
              )}
            </button>
          </form>

          {response && (
            <div className="mt-6 bg-white/5 p-4 rounded-lg border-r-4 border-blue-500 animate-fade-in">
              <p className="text-gray-200 leading-relaxed">
                {response}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};