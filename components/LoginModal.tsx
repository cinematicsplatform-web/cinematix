
import React, { useState } from 'react';
import type { View, LoginError } from '@/types';
import { CheckIcon } from './CheckIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface LoginModalProps {
  onSetView: (view: View) => void;
  onLogin: (email: string, password: string) => Promise<LoginError>;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
  authReturnView?: View;
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

const LoginModal: React.FC<LoginModalProps> = ({ onSetView, onLogin, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme, authReturnView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<LoginError>('none');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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
      className="min-h-screen flex items-center justify-center p-4 pt-24 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://shahid.mbc.net/mediaObject/436ea116-cdae-4007-ace6-3c755df16856?width=1920&type=avif&q=80')`
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      
      <button 
          onClick={() => onSetView(authReturnView || 'home')} 
          className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-50 border border-white/10 shadow-lg group"
          title="رجوع"
      >
           <ChevronRightIcon className="w-6 h-6 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md text-white animate-fade-in-up relative z-10">
        <div className="p-8 md:p-12">
            <h1 className="text-3xl font-extrabold mb-4 text-center">
                <span className="text-white">سينما</span><span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span>
            </h1>
            <p className="text-gray-400 text-center mb-8">سجل الدخول للمتابعة من حيث توقفت</p>

            {error !== 'none' && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-center p-3 rounded-lg mb-6 space-y-3 animate-fade-in-up">
                    <p>{getErrorMessage()}</p>
                    <button onClick={() => onSetView('register')} className="bg-red-500/50 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        إنشاء حساب جديد
                    </button>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                    <input 
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@cinematix.com"
                        disabled={isLoading || isSuccess}
                        className={`w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${error !== 'none' ? errorGlowClass : ''}`}
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            disabled={isLoading || isSuccess}
                            className={`w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${error !== 'none' ? errorGlowClass : ''}`}
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>
                
                 <button 
                    type="submit" 
                    disabled={isLoading || isSuccess}
                    className={`w-full font-bold py-3 rounded-lg transition-all duration-300 transform flex items-center justify-center gap-2
                        ${isSuccess 
                            ? 'bg-green-500 text-white scale-105 cursor-default shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
                            : isLoading 
                                ? 'bg-gray-600 text-gray-300 cursor-not-allowed opacity-80' 
                                : 'btn-primary hover:scale-105'
                        }
                    `}
                >
                    {isLoading ? (
                        <>
                            <SpinnerIcon />
                            <span>جاري الدخول...</span>
                        </>
                    ) : isSuccess ? (
                        <>
                            <CheckIcon className="w-6 h-6 text-black" />
                            <span>تم بنجاح</span>
                        </>
                    ) : (
                        'تسجيل الدخول'
                    )}
                </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
                ليس لديك حساب؟ <a href="#" onClick={(e) => {e.preventDefault(); !isLoading && onSetView('register')}} className={`font-medium hover:underline transition-colors ${linkColorClass} ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>أنشئ حساباً</a>
            </p>
            <p className="text-center text-gray-500 text-sm mt-2">
                أو <a href="#" onClick={(e) => { e.preventDefault(); !isLoading && onSetView('home'); }} className={`font-medium text-gray-300 hover:underline ${isLoading ? 'pointer-events-none opacity-50' : ''}`}>تصفح كزائر</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
