
import React, { useState, useEffect } from 'react';
import type { Content } from '../types';
import { carouselsByPage } from '../data';
import Hero from './Hero';
import ContentCarousel from './ContentCarousel';

// FIX: Added missing props to satisfy child component requirements.
interface UpcomingPageProps {
  allContent: Content[];
  pinnedContent: Content[];
  onSelectContent: (content: Content) => void;
  countdownDate: string;
  isLoggedIn: boolean;
  myList?: string[];
  onToggleMyList: (contentId: string) => void;
}

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: Record<string, number> = {};

        if (difference > 0) {
            timeLeft = {
                أيام: Math.floor(difference / (1000 * 60 * 60 * 24)),
                ساعات: Math.floor((difference / (1000 * 60 * 60)) % 24),
                دقائق: Math.floor((difference / 1000 / 60) % 60),
                ثواني: Math.floor((difference / 1000) % 60)
            };
        } else {
             timeLeft = { أيام: 0, ساعات: 0, دقائق: 0, ثواني: 0 };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, targetDate]);

    return (
        <div className="flex justify-center gap-4 md:gap-8 text-center bg-black/30 backdrop-blur-sm p-6 rounded-2xl">
            {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="flex flex-col">
                    <span className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A7F8] to-[#00FFB0]">{String(value).padStart(2, '0')}</span>
                    <span className="text-sm text-gray-300 mt-1">{unit}</span>
                </div>
            ))}
        </div>
    );
};

// FIX: Added missing props to the function signature.
const UpcomingPage: React.FC<UpcomingPageProps> = ({ allContent, pinnedContent, onSelectContent, countdownDate, isLoggedIn, myList, onToggleMyList }) => {
  // FIX: Changed filtering from non-existent `tags` property to the correct `categories` property.
  const allUpcomingContent = allContent.filter(c => c.categories.includes('قريباً'));
  
  // FIX: Changed filtering from non-existent `tags` property to the correct `categories` property.
  const heroContents = pinnedContent.filter(c => c.categories.includes('قريباً'));
   if (heroContents.length === 0 && allUpcomingContent.length > 0) {
    heroContents.push(allUpcomingContent[0]);
  }
  
  const mainUpcoming = allUpcomingContent.find(c => c.releaseDate);

  if (allUpcomingContent.length === 0) {
    return <div className="pt-24 text-center">لا يوجد محتوى قادم لعرضه حالياً.</div>
  }

  return (
    <>
      {/* FIX: Passed missing required props `isLoggedIn`, `myList`, and `onToggleMyList`. */}
      <Hero contents={heroContents} onWatchNow={() => alert('هذا المحتوى غير متوفر بعد.')} isLoggedIn={isLoggedIn} myList={myList} onToggleMyList={onToggleMyList} />
      <main className="px-4 md:px-12 lg:px-16 pb-16 -mt-32 md:-mt-48 z-10 relative text-center">
        {mainUpcoming && (
            <>
                <h2 className="text-3xl font-bold mb-4">يترقب في رمضان 2026</h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">كونوا أول من يشاهد أضخم الأعمال عند عرضها. العد التنازلي قد بدأ!</p>
                <CountdownTimer targetDate={countdownDate} />
            </>
        )}

        <div className="mt-16 text-right">
            {/* FIX: Changed `carouselsByPage.upcoming` to `carouselsByPage.soon` to prevent runtime error. */}
            {carouselsByPage.soon.map((carousel) => (
              <ContentCarousel
                key={carousel.id}
                title={carousel.title}
                contents={carousel.contentIds.map(id => allUpcomingContent.find(m => m.id === id)).filter(Boolean) as Content[]}
                onSelectContent={() => alert('هذا المحتوى غير متوفر بعد.')}
                // FIX: Passed missing required props `isLoggedIn`, `myList`, and `onToggleMyList`.
                isLoggedIn={isLoggedIn}
                myList={myList}
                onToggleMyList={onToggleMyList}
              />
            ))}
        </div>
      </main>
    </>
  );
};

export default UpcomingPage;
