
import React from 'react';
import type { View } from '@/types';

interface AboutPageProps {
  onSetView: (view: View) => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onSetView }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-white p-4 sm:p-6 lg:p-8 pt-10 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => onSetView('home')} className="text-gray-400 hover:text-white mb-8 transition-colors flex items-center gap-2 font-bold">
          <span>&rarr;</span>
          <span>العودة إلى الرئيسية</span>
        </button>

        <div className="bg-gray-900/50 p-8 md:p-12 rounded-2xl border border-gray-800 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-6">
                <span className="text-white">مرحباً بك في سينما</span>
                <span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-loose mb-4">
                منصتك الأولى لمتابعة أحدث الأفلام والمسلسلات بجودة عالية وبشكل مجاني.
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-loose mb-8">
                هدفنا هو تقديم تجربة مشاهدة سهلة وممتعة لكل عشاق السينما والمسلسلات حول العالم.
            </p>
            <h2 className="text-2xl font-bold text-[#00A7F8] mb-6">🎬 استكشف جديدنا الآن!</h2>
            <button
              onClick={() => onSetView('home')}
              className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold px-10 py-5 rounded-full text-xl hover:bg-white transition-all duration-300 transform hover:scale-105"
            >
              شاهد الآن
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
