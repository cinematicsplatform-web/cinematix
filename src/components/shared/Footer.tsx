import React from 'react';
import { FacebookIcon } from '../icons/FacebookIcon';
import { InstagramIcon } from '../icons/InstagramIcon';
import { TwitterIcon } from '../icons/TwitterIcon';
import { GroupIcon } from '../icons/GroupIcon';
import type { SocialLinks, View } from '@/types';

interface FooterProps {
  socialLinks: SocialLinks;
  onSetView: (view: View) => void;
  isRamadanFooter?: boolean;
  className?: string; 
}

const Footer: React.FC<FooterProps> = ({ socialLinks, onSetView, isRamadanFooter, className = '' }) => {
  const footerLinks: {name: string, action: () => void}[] = [
      { name: 'الرئيسية', action: () => onSetView('home') },
      { name: 'طلبات المحتوى', action: () => onSetView('contentRequest') },
      { name: 'تطبيق الموبايل', action: () => onSetView('appDownload') },
      { name: 'سياسة الخصوصية', action: () => onSetView('privacy') },
      { name: 'حقوق الملكية', action: () => onSetView('copyright') },
      { name: 'حولنا', action: () => onSetView('about') },
      { name: 'اتصل بنا', action: () => { window.location.href = socialLinks.contactUs } },
  ];
  
  const baseClasses = isRamadanFooter
    ? "relative w-full bg-[var(--bg-body)] shadow-[0_0_25px_rgba(0,0,0,0.8)] z-0 pt-16 pb-16 border-t border-white/5" 
    : "relative w-full bg-[var(--bg-body)] py-16 border-t border-white/5 z-0"; 
  
  const footerClasses = `${baseClasses} ${className}`;

  return (
    <footer className={`${footerClasses} px-4 md:px-8 w-full transition-all duration-500`}>
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center">
        
        {/* Navigation Links Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 md:gap-x-4 text-xs md:text-sm font-semibold text-gray-300/90 dir-rtl">
          {footerLinks.map((link, idx) => (
            <React.Fragment key={link.name}>
              {idx > 0 && <span className="text-white/10 font-light select-none">|</span>}
              <button 
                onClick={(e) => { e.preventDefault(); link.action(); }} 
                className="hover:text-[var(--color-accent)] md:hover:text-white transition-colors duration-200 cursor-pointer text-center py-1 outline-none"
              >
                {link.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Circular Social Icons Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <a 
            href={socialLinks.facebook} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full border border-white/10 hover:border-white/30 hover:scale-105 bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-md"
            aria-label="Facebook"
          >
            <FacebookIcon className="w-5 h-5" />
          </a>
          <a 
            href={socialLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full border border-white/10 hover:border-white/30 hover:scale-105 bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-md"
            aria-label="Twitter"
          >
            <TwitterIcon className="w-5 h-5" />
          </a>
          <a 
            href={socialLinks.instagram} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full border border-white/10 hover:border-white/30 hover:scale-105 bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-md"
            aria-label="Instagram"
          >
            <InstagramIcon className="w-5 h-5" />
          </a>
          <a 
            href={socialLinks.facebookGroup} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-11 h-11 rounded-full border border-white/10 hover:border-white/30 hover:scale-105 bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-md"
            aria-label="Facebook Group"
          >
            <GroupIcon className="w-5 h-5" />
          </a>
        </div>

        {/* Cinematix Centered Brand Logo */}
        <div className="flex justify-center mt-10 mb-6">
          <div 
            onClick={() => onSetView('home')} 
            className="text-2xl md:text-3xl font-extrabold cursor-pointer transition-all hover:opacity-85 flex items-center gap-1 select-none"
          >
            <span className="text-white">سينما</span>
            <span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span>
          </div>
        </div>

        {/* Centered Copyright Text */}
        <div className="text-center text-[11px] md:text-xs font-semibold text-gray-500/80 tracking-wide select-none">
          جميع الحقوق محفوظة لسينماتيكس © {new Date().getFullYear()}
        </div>

      </div>
    </footer>
  );
};

export default Footer;
