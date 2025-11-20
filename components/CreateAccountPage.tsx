
import React, { useState } from 'react';
import type { User, View } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CreateAccountPageProps {
  onSetView: (view: View) => void;
  onRegister: (newUser: Omit<User, 'id' | 'role' | 'profiles'>) => Promise<void>;
}

const CreateAccountPage: React.FC<CreateAccountPageProps> = ({ onSetView, onRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

  return (
    <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center p-4 pt-24 relative">
        
      <button 
          onClick={() => onSetView('login')}
          className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all z-50 border border-white/10 shadow-lg group"
          title="رجوع"
      >
          <ChevronRightIcon className="w-6 h-6 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
      </button>

      <div className="bg-black border border-gray-700 rounded-2xl shadow-xl w-full max-w-md text-white animate-fade-in-up relative">
        <div className="p-8 md:p-12">
            <h1 className="text-3xl font-extrabold mb-4 text-center">
                <span className="text-white">أنشئ حساباً في سينما</span><span className="gradient-text font-['Lalezar'] tracking-wide">تيكس</span>
            </h1>
            <p className="text-gray-400 text-center mb-8">انضم إلينا للاستمتاع بآلاف الساعات من الترفيه.</p>
            
            {error && <p className="bg-red-500/20 text-red-400 text-center p-3 rounded-lg mb-6">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="الاسم الأول (اختياري)" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" />
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="الاسم الأخير (اختياري)" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" />
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" required />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" required />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-ring-accent" required />
                
                <button type="submit" className="w-full btn-primary font-bold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 !mt-6">
                    إنشاء حساب
                </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
                لديك حساب بالفعل؟ <a href="#" onClick={(e) => {e.preventDefault(); onSetView('login')}} className="font-medium hover-text-accent hover:underline">سجل الدخول</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountPage;
