
import React from 'react';
import type { View } from '@/types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface PrivacyPolicyPageProps {
  content: string;
  onSetView: (view: View) => void;
  returnView?: View;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ content, onSetView, returnView }) => {
  // Split content by newline to render paragraphs
  const paragraphs = content.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white p-4 sm:p-6 lg:p-8 pt-24 animate-fade-in-up relative">
      {/* Back Button like Login Modal */}
      <button 
          onClick={() => onSetView(returnView || 'home')} 
          className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-50 border border-white/10 shadow-lg group"
          title="رجوع"
      >
           <ChevronRightIcon className="w-6 h-6 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="max-w-4xl mx-auto">
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
