import React, { useState } from 'react';
import type { User, View } from '@/types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CreateAccountPageProps {
  onSetView: (view: View) => void;
  onRegister: (newUser: Omit<User, 'id' | 'role' | 'profiles'>) => Promise<void>;
  isRamadanTheme?: boolean;
  isEidTheme?: boolean;
  isCosmicTealTheme?: boolean;
  isNetflixRedTheme?: boolean;
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

const CreateAccountPage: React.FC<CreateAccountPageProps> = ({ onSetView, onRegister, isRamadanTheme, isEidTheme, isCosmicTealTheme, isNetflixRedTheme }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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

        await onRegister({ email, password, firstName, lastName });
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

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 pt-24 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('https://shahid.mbc.net/mediaObject/436ea116-cdae-4007-ace6-3c755df16856?width=1920&type=avif&q=80')`
      }}
    >
      <div className="absolute inset-0 bg-black/50 z-0"></div>
        
      <button 
          onClick={() => onSetView('login')}
          className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-50 border border-white/10 shadow-lg group"
          title="رجوع"
      >
          <ChevronRightIcon className="w-6 h-6 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl w-full max-w-md text-white animate-fade-in-up relative z-10">
        <div className="p-8 md:p-12">
            <h1 className="text-3xl font-extrabold mb-4 text-center">
                <span className="text-white">أنشئ حساباً في سينما</span><span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span>
            </h1>
            <p className="text-gray-400 text-center mb-8">انضم إلينا للاستمتاع بآلاف الساعات من الترفيه.</p>
            
            {error && <p className="bg-red-500/20 text-red-400 text-center p-3 rounded-lg mb-6">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="الاسم الأول (اختياري)" className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" />
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="الاسم الأخير (اختياري)" className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" required />
                
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="كلمة المرور" 
                        className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus-ring-accent" 
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

                <div className="relative">
                    <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="تأكيد كلمة المرور" 
                        className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus-ring-accent" 
                        required 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                        {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </button>
                </div>
                
                <button type="submit" className="w-full btn-primary font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 !mt-6">
                    إنشاء حساب
                </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
                لديك حساب بالفعل؟ <a href="#" onClick={(e) => {e.preventDefault(); onSetView('login')}} className={`font-medium hover:underline transition-colors ${linkColorClass}`}>سجل الدخول</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;