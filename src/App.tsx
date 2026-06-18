import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Bell, User, Play, Info, ChevronLeft, ChevronRight, Menu, X, MonitorPlay } from 'lucide-react';

// --- Mock Data ---
const featuredContent = {
  title: "الحشاشين",
  description: "في إطار تاريخي، تدور أحداث المسلسل حول طائفة الحشاشين التي أسسها حسن الصباح في القرن الحادي عشر، والتي اشتهرت بتنفيذ عمليات اغتيال دموية ضد شخصيات مرموقة في تلك المرحلة.",
  image: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=3446&auto=format&fit=crop", // Desert/historical vibe
  logo: "الحشاشين",
  match: "98%",
  year: "2024",
  age: "+16",
  seasons: "موسم 1",
  genres: ["تاريخي", "دراما", "إثارة"]
};

const categories = [
  {
    title: "أضيف مؤخراً",
    items: [
      { id: 1, title: "العتاولة", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop" },
      { id: 2, title: "نعمة الأفوكاتو", image: "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?q=80&w=800&auto=format&fit=crop" },
      { id: 3, title: "أشغال شقة", image: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=800&auto=format&fit=crop" },
      { id: 4, title: "المداح", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800&auto=format&fit=crop" },
      { id: 5, title: "صلة رحم", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop" },
      { id: 6, title: "كوبرا", image: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=800&auto=format&fit=crop" },
      { id: 7, title: "حق عرب", image: "https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=800&auto=format&fit=crop" },
    ]
  },
  {
    title: "أعمال حصرية",
    items: [
      { id: 8, title: "سفاح الجيزة", image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop" },
      { id: 9, title: "الغرفة 207", image: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?q=80&w=800&auto=format&fit=crop" },
      { id: 10, title: "موضوع عائلي", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop" },
      { id: 11, title: "منعطف خطر", image: "https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?q=80&w=800&auto=format&fit=crop" },
      { id: 12, title: "رشاش", image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=800&auto=format&fit=crop" },
      { id: 13, title: "الثمانية", image: "https://images.unsplash.com/photo-1574267432553-4b4628081524?q=80&w=800&auto=format&fit=crop" },
    ]
  },
  {
    title: "أفلام عربية",
    items: [
      { id: 14, title: "كيرة والجن", image: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=800&auto=format&fit=crop" },
      { id: 15, title: "الفيل الأزرق 2", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop" },
      { id: 16, title: "ولاد رزق", image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop" },
      { id: 17, title: "الجزيرة", image: "https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?q=80&w=800&auto=format&fit=crop" },
      { id: 18, title: "تراب الماس", image: "https://images.unsplash.com/photo-1515508268448-8d0d2928d21e?q=80&w=800&auto=format&fit=crop" },
      { id: 19, title: "الممر", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800&auto=format&fit=crop" },
    ]
  }
];

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ["الرئيسية", "مسلسلات", "أفلام", "أطفال", "مباشر"];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/90 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="px-4 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <MonitorPlay className="w-8 h-8 text-brand" />
            <span className="text-2xl font-black tracking-tighter text-white">
              سينما<span className="text-brand">تيكس</span>
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link, idx) => (
              <a key={idx} href="#" className={`text-sm font-medium transition-colors hover:text-brand ${idx === 0 ? 'text-white' : 'text-zinc-300'}`}>
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4 md:gap-6">
          <button className="text-zinc-300 hover:text-white transition">
            <Search className="w-5 h-5" />
          </button>
          <button className="text-zinc-300 hover:text-white transition hidden md:block">
            <Bell className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 text-zinc-300 hover:text-white transition">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
              <User className="w-5 h-5" />
            </div>
          </button>
          <button 
            className="md:hidden text-zinc-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-zinc-950 border-t border-zinc-800 py-4 px-4 flex flex-col gap-4 shadow-xl"
          >
            {navLinks.map((link, idx) => (
              <a key={idx} href="#" className="text-lg font-medium text-zinc-300 hover:text-brand transition-colors">
                {link}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <div className="relative h-[85vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={featuredContent.image} 
          alt={featuredContent.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Gradients for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-4 md:px-12 pt-20 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
            {featuredContent.logo}
          </h1>
          
          <div className="flex items-center gap-4 text-sm md:text-base font-medium text-zinc-300 mb-6">
            <span className="text-green-500 font-bold">{featuredContent.match} نسبة مطابقة</span>
            <span>{featuredContent.year}</span>
            <span className="px-2 py-0.5 border border-zinc-600 rounded text-xs">{featuredContent.age}</span>
            <span>{featuredContent.seasons}</span>
          </div>

          <p className="text-zinc-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl drop-shadow-md">
            {featuredContent.description}
          </p>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand/20">
              <Play className="w-6 h-6 fill-current" />
              <span>تشغيل</span>
            </button>
            <button className="flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-white px-8 py-3 rounded-lg font-bold text-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95">
              <Info className="w-6 h-6" />
              <span>مزيد من المعلومات</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-8 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-300">الأنواع:</span>
            {featuredContent.genres.map((genre, idx) => (
              <React.Fragment key={idx}>
                <span className="hover:text-white cursor-pointer transition-colors">{genre}</span>
                {idx < featuredContent.genres.length - 1 && <span className="w-1 h-1 rounded-full bg-zinc-600" />}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const CategoryRow = ({ title, items }: { title: string, items: any[] }) => {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      // In RTL, scrollLeft is negative or zero depending on browser, but let's just check bounds
      // A more robust way for RTL is checking if we can scroll more in either direction
      setShowRightArrow(Math.abs(scrollLeft) > 0);
      setShowLeftArrow(Math.abs(scrollLeft) + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-10 relative group">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-12 flex items-center gap-2">
        {title}
        <ChevronLeft className="w-5 h-5 text-brand opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
      </h2>
      
      <div className="relative">
        {/* Scroll Buttons - Hidden on mobile, visible on hover on desktop */}
        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-0 top-0 bottom-0 w-12 bg-black/50 hover:bg-black/80 items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
        
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 w-12 bg-black/50 hover:bg-black/80 items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Items Container */}
        <div 
          ref={rowRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-12 pb-4 snap-x snap-mandatory"
        >
          {items.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative flex-none w-[140px] md:w-[200px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer snap-start shadow-lg"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-sm md:text-base line-clamp-2 mb-2">{item.title}</h3>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-brand hover:text-white transition-colors">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  <button className="w-8 h-8 rounded-full border border-white/50 text-white flex items-center justify-center hover:border-white transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-zinc-950 pt-16 pb-8 px-4 md:px-12 border-t border-zinc-900 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <h4 className="text-white font-bold mb-4">سينماتيكس</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-white transition">عن الشركة</a></li>
            <li><a href="#" className="hover:text-white transition">الأسئلة الشائعة</a></li>
            <li><a href="#" className="hover:text-white transition">مركز المساعدة</a></li>
            <li><a href="#" className="hover:text-white transition">الوظائف</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">تصفح</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-white transition">المسلسلات</a></li>
            <li><a href="#" className="hover:text-white transition">الأفلام</a></li>
            <li><a href="#" className="hover:text-white transition">أطفال</a></li>
            <li><a href="#" className="hover:text-white transition">البث المباشر</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">الشروط والأحكام</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><a href="#" className="hover:text-white transition">شروط الاستخدام</a></li>
            <li><a href="#" className="hover:text-white transition">سياسة الخصوصية</a></li>
            <li><a href="#" className="hover:text-white transition">سياسة ملفات تعريف الارتباط</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">تابعنا</h4>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-brand cursor-pointer transition">
              <span className="font-bold text-white">X</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-brand cursor-pointer transition">
              <span className="font-bold text-white">f</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-brand cursor-pointer transition">
              <span className="font-bold text-white">in</span>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-zinc-600 border-t border-zinc-900 pt-8">
        &copy; {new Date().getFullYear()} سينماتيكس. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main>
        <Hero />
        <div className="mt-[-80px] relative z-10">
          {categories.map((category, idx) => (
            <CategoryRow key={idx} title={category.title} items={category.items} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
