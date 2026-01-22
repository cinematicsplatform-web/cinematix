import React, { useState } from 'react';
import type { User, View } from '@/types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import SEO from './SEO';

interface CreateAccountPageProps {
  onSetView: (view: View, category?: string, params?: any) => void;
  // Updated signature to handle gender for avatar selection
  onRegister: (newUser: Omit<User, 'id' | 'role' | 'profiles'> & { gender: 'male' | 'female' }) => Promise<string | null>;
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

const CreateAccountPage: React.FC<CreateAccountPageProps> = ({ onSetView, onRegister, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme, authReturnView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrorType(null);

        if (!validateEmail(email)) {
            setError('الرجاء إدخال بريد إلكتروني صالح.');
            return;
        }
        if (password.length < 6) {
            setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }

        setIsLoading(true);
        const errCode = await onRegister({ email, password, firstName, lastName, gender });
        setIsLoading(false);

        if (errCode) {
            if (errCode === 'auth/email-already-in-use' || String(errCode).includes('email-already-in-use')) {
                setErrorType('email-in-use');
                setError('هذا البريد الإلكتروني مسجل بالفعل.');
            } else {
                setError('حدث خطأ غير متوقع. حاول مرة أخرى لاحقاً.');
            }
        }
    };

    const linkColorClass = isRamadanTheme 
        ? 'text-amber-500 hover:text-amber-400' 
        : isEidTheme
            ? 'text-purple-400 hover:text-purple-300'
            : isCosmicTealTheme
                ? 'text-[#35F18B] hover:text-[#2596be]'
                : isNetflixRedTheme
                    ? 'text-[#E50914] hover:text-[#b20710]'
                    : 'text-[#00A7F8] hover:text-[#00FFB0]';

    const accentBorder = isRamadanTheme ? 'border-amber-500' : isEidTheme ? 'border-purple-500' : isCosmicTealTheme ? 'border-[#35F18B]' : isNetflixRedTheme ? 'border-[#E50914]' : 'border-[#00A7F8]';
    const accentBg = isRamadanTheme ? 'bg-amber-500/10' : isEidTheme ? 'bg-purple-500/10' : isCosmicTealTheme ? 'bg-[#35F18B]/10' : isNetflixRedTheme ? 'bg-[#E50914]/10' : 'bg-[#00A7F8]/10';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-10 relative bg-cover bg-center bg-no-repeat transition-all duration-700"
      style={{
        backgroundImage: `url('https://shahid.mbc.net/mediaObject/436ea116-cdae-4007-ace6-3c755df16856?width=1920&type=avif&q=80')`
      }}
    >
      <SEO title="إنشاء حساب - سينماتيكس" noIndex={true} />
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

      <div className="w-full max-w-[550px] z-10">
        <div className="bg-black/75 md:bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[32px] md:rounded-[24px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up">
            <div className="p-8 md:p-14">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black mb-3">
                        <span className="text-white">إنشاء</span><span className="gradient-text font-['Lalezar'] tracking-wide"> حساب جديد</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base font-bold">انضم لملايين المشاهدين حول العالم</p>
                </div>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-center p-5 rounded-2xl mb-8 space-y-4 animate-fade-in">
                        <p className="font-black text-sm">{error}</p>
                        {errorType === 'email-in-use' && (
                            <button 
                                type="button"
                                onClick={() => onSetView('login', undefined, { email })} 
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl text-sm transition-all transform active:scale-95 shadow-lg"
                            >
                                تسجيل الدخول بدلاً من ذلك
                            </button>
                        )}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                             <label className="block text-[10px] font-black text-gray-500 uppercase mr-2">الاسم الأول</label>
                             <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="مثال: أحمد" className="w-full bg-white/5 border border-gray-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white placeholder-gray-700" />
                        </div>
                        <div className="flex-1 space-y-2">
                             <label className="block text-[10px] font-black text-gray-500 uppercase mr-2">الاسم الأخير</label>
                             <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="اختياري" className="w-full bg-white/5 border border-gray-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white placeholder-gray-700" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mr-2">الجنس</label>
                        <div className="flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setGender('male')}
                                className={`flex-1 py-3.5 rounded-2xl border-2 font-black transition-all duration-300 text-sm ${gender === 'male' ? `${accentBorder} ${accentBg} text-white shadow-lg` : 'border-gray-800 bg-black/20 text-gray-500 hover:border-gray-700'}`}
                            >
                                ذكر
                            </button>
                            <button 
                                type="button"
                                onClick={() => setGender('female')}
                                className={`flex-1 py-3.5 rounded-2xl border-2 font-black transition-all duration-300 text-sm ${gender === 'female' ? `${accentBorder} ${accentBg} text-white shadow-lg` : 'border-gray-800 bg-black/20 text-gray-500 hover:border-gray-700'}`}
                            >
                                أنثى
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mr-2">البريد الإلكتروني</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@domain.com" className="w-full bg-white/5 border border-gray-700/50 rounded-2xl px-6 py-3.5 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white placeholder-gray-700 dir-ltr" required />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mr-2">كلمة المرور</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="••••••••" 
                                    className="w-full bg-white/5 border border-gray-700/50 rounded-2xl px-5 py-3.5 pl-12 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white placeholder-gray-700" 
                                    required 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase mr-2">تأكيد المرور</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    placeholder="••••••••" 
                                    className="w-full bg-white/5 border border-gray-700/50 rounded-2xl px-5 py-3.5 pl-12 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-white placeholder-gray-700" 
                                    required 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full btn-primary font-black py-4 md:py-5 rounded-2xl transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] text-xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                                    <span>جاري الإنشاء...</span>
                                </div>
                            ) : 'إنشاء الحساب الآن'}
                        </button>
                    </div>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm font-bold">
                        لديك حساب بالفعل؟ <a href="#" onClick={(e) => {e.preventDefault(); onSetView('login')}} className={`font-black hover:underline transition-colors ${linkColorClass}`}>سجل الدخول</a>
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;