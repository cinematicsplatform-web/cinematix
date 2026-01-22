import React, { useState, useEffect } from 'react';
import type { View, LoginError } from '@/types';
import { CheckIcon } from './CheckIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import SEO from './SEO';

interface LoginModalProps {
  onSetView: (view: View, category?: string, params?: any) => void;
  onLogin: (email: string, password: string) => Promise<LoginError>;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  authReturnView?: View;
  initialEmail?: string;
}

// Eye Icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.414 6.811 7.272 4.125 12 4.125s8.586 2.686 9.964 7.553a1.012 1.012 0 0 1 0 .644C20.586 17.189 16.728 19.875 12 19.875s-8.586-2.686-9.964-7.553Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({ onSetView, onLogin, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme, authReturnView, initialEmail }) => {
    const [email, setEmail] = useState(initialEmail || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<LoginError>('none');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (initialEmail) setEmail(initialEmail);
    }, [initialEmail]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('none');
        
        if(email && password) {
            setIsLoading(true);
            try {
                const loginResult = await onLogin(email, password);
                if (loginResult === 'none') {
                    setIsSuccess(true);
                    setTimeout(() => {
                        onSetView('profileSelector');
                    }, 400);
                } else {
                    setError(loginResult);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error(err);
                setError('userNotFound');
                setIsLoading(false);
            }
        }
    }

    const getErrorMessage = () => {
        if (error === 'userNotFound' || error === 'wrongPassword') return '⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        return '';
    };

    const errorGlowClass = 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';

    const linkColorClass = isRamadanTheme 
        ? 'text-amber-500 hover:text-amber-400' 
        : isEidTheme
            ? 'text-purple-400 hover:text-purple-300'
            : isCosmicTealTheme
                ? 'text-[#35F18B] hover:text-[#2596be]'
                : isNetflixRedTheme
                    ? 'text-[#E50914] hover:text-[#b20710]'
                    : 'text-[#00A7F8] hover:text-[#00FFB0]';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-10 relative bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{
        backgroundImage: `url('https://shahid.mbc.net/mediaObject/436ea116-cdae-4007-ace6-3c755df16856?width=1920&type=avif&q=80')`
      }}
    >
      <SEO title="تسجيل الدخول - سينماتيكس" noIndex={true} />
      {/* Deep overlay inspired by global platforms */}
      <div className="absolute inset-0 bg-black/60 md:bg-black/50 z-0"></div>
      
      {/* Elegant Back Button */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-[100]">
          <button 
              onClick={() => onSetView(authReturnView || 'home')} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white transition-all border border-white/10 shadow-xl group font-bold"
              title="رجوع"
          >
               <ChevronRightIcon className="w-5 h-5 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
               <span className="hidden sm:inline">رجوع</span>
          </button>
      </div>

      <div className="w-full max-w-[450px] z-10">
        <div className="bg-black/75 md:bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[32px] md:rounded-[24px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up">
            <div className="p-8 md:p-14">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black mb-3">
                        <span className="text-white">تسجيل</span><span className="gradient-text font-['Lalezar'] tracking-wide"> الدخول</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base font-bold">استعد لرحلة ترفيهية بلا حدود</p>
                </div>

                {error !== 'none' && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-center p-4 rounded-2xl mb-8 space-y-4 animate-fade-in">
                        <p className="text-sm font-bold">{getErrorMessage()}</p>
                        <button onClick={() => onSetView('register')} className="w-full bg-red-500 text-white font-black py-2.5 rounded-xl text-sm transition-all hover:brightness-110 shadow-lg">
                            إنشاء حساب جديد
                        </button>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-xs font-black text-gray-500 uppercase tracking-widest mr-2">البريد الإلكتروني</label>
                        <input 
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@cinematix.watch"
                            disabled={isLoading || isSuccess}
                            className={`w-full bg-white/5 border border-gray-700/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg placeholder-gray-600 ${error !== 'none' ? errorGlowClass : ''}`}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-xs font-black text-gray-500 uppercase tracking-widest mr-2">كلمة المرور</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isLoading || isSuccess}
                                className={`w-full bg-white/5 border border-gray-700/50 rounded-2xl px-6 py-4 pl-14 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg placeholder-gray-600 ${error !== 'none' ? errorGlowClass : ''}`}
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isLoading || isSuccess}
                            className={`w-full font-black py-4 md:py-5 rounded-2xl transition-all duration-500 transform flex items-center justify-center gap-3 text-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]
                                ${isSuccess 
                                    ? 'bg-green-600 text-white scale-[1.02] cursor-default shadow-green-900/40' 
                                    : isLoading 
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700' 
                                        : 'btn-primary hover:scale-[1.02] active:scale-[0.98]'
                                }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <SpinnerIcon />
                                    <span>جاري التحقق...</span>
                                </>
                            ) : isSuccess ? (
                                <>
                                    <CheckIcon className="w-6 h-6 text-white" />
                                    <span>تم الدخول بنجاح</span>
                                </>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-12 space-y-4 text-center">
                    <p className="text-gray-500 text-sm font-bold">
                        جديد في سينماتيكس؟ <a href="#" onClick={(e) => {e.preventDefault(); !isLoading && onSetView('register')}} className={`font-black hover:underline transition-colors ${linkColorClass} ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>أنشئ حساباً الآن</a>
                    </p>
                    <p className="text-gray-600 text-xs font-bold pt-4 border-t border-white/5">
                        <a href="#" onClick={(e) => { e.preventDefault(); !isLoading && onSetView('home'); }} className={`hover:text-white transition-colors ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>التصفح كزائر</a>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;