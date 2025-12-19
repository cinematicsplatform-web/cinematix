
import React from 'react';
import type { View } from '@/types';

interface PrivacyPolicyPageProps {
  content: string;
  onSetView: (view: View) => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ content, onSetView }) => {
  // Split content by newline to render paragraphs
  const paragraphs = content.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white p-4 sm:p-6 lg:p-8 pt-10 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => onSetView('home')} className="text-gray-400 hover:text-white mb-8 transition-colors flex items-center gap-2 font-bold">
          <span>&rarr;</span>
          <span>العودة إلى الرئيسية</span>
        </button>
        <div className="bg-gray-900/50 p-6 md:p-10 rounded-2xl border border-gray-800">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 border-b border-gray-700 pb-4 text-center gradient-text">سياسة الخصوصية</h1>
            <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-loose space-y-4">
               {paragraphs.map((p, index) => (
                    <p key={index} className="mb-4">{p}</p>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
