
import React from 'react';
import type { SocialLinks, View } from '@/types';
import { FacebookIcon } from '../icons/FacebookIcon';
import { InstagramIcon } from '../icons/InstagramIcon';
import { TwitterIcon } from '../icons/TwitterIcon';
import { GroupIcon } from '../icons/GroupIcon';

// Use a simple lock icon for admin access
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

interface MaintenancePageProps {
    socialLinks: SocialLinks;
    onSetView: (view: View) => void;
    isClosure?: boolean;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ socialLinks, onSetView, isClosure = false }) => {
    // Use type assertion to bypass TypeScript's IntrinsicElements check for the custom element
    const DotLottie = 'dotlottie-wc' as unknown as React.ElementType;

    return (
        <div className={`w-full bg-[var(--bg-body)] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden select-none ${isClosure ? 'h-screen max-h-screen' : 'min-h-screen'}`}>
            
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none">
                 <div className={`absolute top-10 left-10 w-72 h-72 rounded-full blur-[120px] ${isClosure ? 'bg-red-600/20' : 'bg-[#00A7F8]'}`}></div>
                 <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full blur-[120px] ${isClosure ? 'bg-amber-600/10' : 'bg-[#00FFB0]'}`}></div>
            </div>

            <div className={`z-10 w-full flex flex-col items-center gap-6 animate-fade-in-up ${
                isClosure 
                    ? 'max-w-xl bg-gray-950/40 border border-red-500/10 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden' 
                    : 'max-w-4xl'
            }`}>
                
                {/* Visual Header Illustration */}
                <div className="w-full flex justify-center mb-4">
                    {isClosure ? (
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Outer glowing pulsing background rings */}
                            <div className="absolute inset-0 bg-red-500/5 rounded-full animate-pulse opacity-25" style={{ animationDuration: '3s' }} />
                            <div className="absolute w-36 h-36 bg-gradient-to-tr from-red-600/15 to-amber-600/15 rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
                            
                            {/* Nested modern glassmorphism panels */}
                            <div className="absolute w-32 h-32 bg-gray-900/50 backdrop-blur-md rounded-full border border-gray-800/80 flex items-center justify-center shadow-2xl">
                                <div className="w-24 h-24 bg-gray-800/70 rounded-full border border-red-500/20 flex items-center justify-center shadow-inner relative">
                                    {/* Small floating particles */}
                                    <div className="absolute top-1 left-2 w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                                    <div className="absolute bottom-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '1.2s' }} />
                                    
                                    {/* Padlock Icon with glow */}
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        strokeWidth={1.5} 
                                        stroke="currentColor" 
                                        className="w-12 h-12 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"
                                        style={{ animationDuration: '2s' }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <DotLottie 
                            src="https://lottie.host/bd6cf564-4798-4ced-bda8-2db3af17fa72/n2bS4Fanvz.lottie" 
                            style={{ width: '100%', height: 'auto', margin: '0 auto' }}
                            className="w-full md:w-[650px]"
                            autoplay 
                            loop
                        ></DotLottie>
                    )}
                </div>

                {/* Text Content */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <h1 className={`font-bold text-white leading-tight ${isClosure ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'}`}>
                            {isClosure ? "عذراً، تم إغلاق الموقع!" : "نقوم الآن بعمل بعض التحديثات!"}
                        </h1>
                        <p className={`text-gray-300 opacity-80 leading-relaxed max-w-lg mx-auto ${isClosure ? 'text-sm md:text-base' : 'text-lg md:text-2xl'}`}>
                            {isClosure 
                                ? "نأسف لإبلاغكم بأنه تم إغلاق المنصة بالكامل. نشكركم جزيلاً على دعمكم وثقتكم بنا طوال الفترة الماضية."
                                : "المنصة حالياً في وضع الصيانة، وهنرجع خلال وقت قصير بتجربة أفضل وأسرع. شكراً لتفهمكم."}
                        </p>
                    </div>

                    <div className="w-full h-px bg-white/10 max-w-xs mx-auto"></div>

                    <div className="space-y-3" dir="ltr">
                        <h2 className={`font-bold text-white leading-tight ${isClosure ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'}`}>
                            {isClosure ? "Sorry, the website is closed!" : "We’re doing some upgrades!"}
                        </h2>
                        <p className={`text-gray-300 opacity-80 leading-relaxed max-w-lg mx-auto ${isClosure ? 'text-xs md:text-sm' : 'text-base md:text-xl'}`}>
                            {isClosure 
                                ? "We regret to inform you that our platform has been closed. Thank you so much for your support and trust over the past period."
                                : "Our platform is currently under maintenance. We’ll be back shortly with a smoother and faster experience. Thank you for your patience."}
                        </p>
                    </div>
                </div>

                {/* Social Links - Hidden completely in Closure mode */}
                {!isClosure && (
                    <div className="mt-12">
                         <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wider font-semibold">تابعنا على</h3>
                         <div className="flex items-center justify-center gap-6">
                             <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00A7F8] transition-all transform hover:scale-110">
                                 <FacebookIcon className="w-8 h-8" />
                             </a>
                             <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-all transform hover:scale-110">
                                 <InstagramIcon className="w-8 h-8" />
                             </a>
                             <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-all transform hover:scale-110">
                                 <TwitterIcon className="w-8 h-8" />
                             </a>
                             <a href={socialLinks.facebookGroup} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-all transform hover:scale-110">
                                 <GroupIcon className="w-8 h-8" />
                             </a>
                         </div>
                    </div>
                )}
            </div>

            {/* Admin Access Trigger */}
            <button 
                onClick={() => onSetView('login')}
                className="absolute bottom-6 right-6 text-gray-600 hover:text-white transition-colors opacity-30 hover:opacity-100 p-3 bg-black/20 rounded-full"
                title="Admin Access"
            >
                <LockIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default MaintenancePage;
