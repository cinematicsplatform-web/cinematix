import React from 'react';
import type { Content, Episode, Season } from '../../types';

interface EpisodeGridProps {
  isLoaded: boolean;
  sortedEpisodes: any[];
  currentSeason: Season | undefined;
  seriesSlug: string;
  content: Content;
  isAdmin: boolean;
  onEpisodeSelect: (episode: Episode, seasonNum?: number, episodeIndex?: number) => void;
}

const EpisodeGrid: React.FC<EpisodeGridProps> = ({
  isLoaded,
  sortedEpisodes,
  currentSeason,
  seriesSlug,
  content,
  isAdmin,
  onEpisodeSelect,
}) => {
  const displayBackdrop = currentSeason?.backdrop || content?.backdrop || '';

  const getEpisodeDescription = (description: string | undefined, epNumber: number, sNumber: number) => {
    if (description && description.trim().length > 0) return description;
    return `شاهد أحداث الحلقة ${epNumber} من الموسم ${sNumber}. استمتع بمشاهدة تطورات الأحداث في هذه الحلقة.`;
  };

  if (!isLoaded) {
    return (
      <div className="mb-10 grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-700/50 bg-gray-800/40 skeleton-shimmer"
          >
            <div className="relative aspect-video w-full bg-gray-700/30"></div>
            <div className="space-y-3 p-4">
              <div className="h-4 w-1/2 rounded bg-gray-700/40"></div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-gray-700/40"></div>
                <div className="h-2 w-5/6 rounded bg-gray-700/40"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Episode Card Hover Logic */
        .episode-card-hover {
            transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), z-index 0s;
        }
        
        @media (min-width: 768px) {
            .episode-card-hover:hover {
                transform: scale(1.20);
                z-index: 100 !important;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8);
            }
        }
        
        .episode-card-hover:nth-child(2n+1) { transform-origin: right center; }
        .episode-card-hover:nth-child(2n) { transform-origin: left center; }
        
        @media (min-width: 768px) {
            .episode-card-hover:nth-child(n) { transform-origin: center center; }
            .episode-card-hover:nth-child(3n+1) { transform-origin: right center; }
            .episode-card-hover:nth-child(3n) { transform-origin: left center; }
        }
        
        @media (min-width: 1024px) {
            .episode-card-hover:nth-child(n) { transform-origin: center center; }
            .episode-card-hover:nth-child(4n+1) { transform-origin: right center; }
            .episode-card-hover:nth-child(4n) { transform-origin: left center; }
        }
        
        @media (min-width: 1280px) {
            .episode-card-hover:nth-child(n) { transform-origin: center center; }
            .episode-card-hover:nth-child(5n+1) { transform-origin: right center; }
            .episode-card-hover:nth-child(5n) { transform-origin: left center; }
        }
      `}</style>
      <div className="mb-10 grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sortedEpisodes.map((ep: any, index) => {
        const eNum = ep.originalNumber;
        const sNum = currentSeason?.seasonNumber || 1;
        const watchUrl = `/watch/${seriesSlug}/${sNum}/${eNum}`;

        // منطق تحديد هل الجدولة في المستقبل أم مرت
        const isFutureScheduled = ep.isScheduled && ep.scheduledAt && new Date() < new Date(ep.scheduledAt);

        return (
          <a
            key={ep.id}
            href={watchUrl}
            onClick={(e) => {
              e.preventDefault();
              onEpisodeSelect(ep, sNum, eNum);
            }}
            aria-label={`شاهد ${content.title} الموسم ${sNum} الحلقة ${eNum}`}
            className="episode-card-hover group relative flex cursor-pointer flex-col rounded-xl border border-gray-800 bg-[var(--bg-card)] text-inherit no-underline w-full h-full md:h-auto overflow-hidden md:overflow-visible"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl md:group-hover:rounded-b-none transition-all duration-300 bg-black">
              <img
                src={ep.thumbnail || displayBackdrop}
                alt={ep.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Play Button on Hover (Desktop) */}
              <div className="absolute left-3 bottom-3 z-20 hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-white text-black shadow-lg opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              </div>

              {(() => {
                const badges = [];
                if (ep.isLastEpisode) {
                  badges.push({ text: 'الحلقة الأخيرة', type: 'last' });
                }
                if (ep.badgeText) {
                  const customBadges = ep.badgeText
                    .split(',')
                    .map((b: string) => b.trim())
                    .filter(Boolean);
                  customBadges.forEach((b: string) => {
                    if (b.toUpperCase() === 'VIP') badges.push({ text: 'VIP', type: 'vip' });
                    else if (b === 'حصري') badges.push({ text: 'حصري', type: 'exclusive' });
                    else if (b === 'جديد') badges.push({ text: 'جديد', type: 'new' });
                    else if (b === 'قريباً') badges.push({ text: 'قريباً', type: 'soon' });
                    else if (b === 'مترجم') badges.push({ text: 'مترجم', type: 'translated' });
                    else badges.push({ text: b, type: 'custom' });
                  });
                }

                if (badges.length === 0) return null;

                return (
                  <div className="absolute top-2 right-2 z-10 flex flex-wrap gap-1 max-w-[80%] dir-rtl">
                    {badges.map((badge, idx) => {
                      let badgeClasses = '';
                      switch (badge.type) {
                        case 'last':
                          badgeClasses = 'border-red-500/50 bg-red-600/90 text-white';
                          break;
                        case 'vip':
                          badgeClasses =
                            'border-yellow-500/50 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black';
                          break;
                        case 'exclusive':
                          badgeClasses = 'border-orange-500/50 bg-orange-600/90 text-white';
                          break;
                        case 'new':
                          badgeClasses = 'border-emerald-500/50 bg-emerald-600/90 text-white';
                          break;
                        case 'soon':
                          badgeClasses = 'border-purple-500/50 bg-purple-600/90 text-white';
                          break;
                        case 'translated':
                          badgeClasses = 'border-slate-500/50 bg-slate-700/90 text-white';
                          break;
                        default:
                          badgeClasses = 'border-amber-500/50 bg-amber-600/90 text-white';
                          break;
                      }
                      return (
                        <span
                          key={idx}
                          className={`rounded-md border backdrop-blur-md px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shadow-lg ${badgeClasses}`}
                        >
                          {badge.text}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Scheduled Label for Admins - Updated Logic: Hide if time passed */}
              {isFutureScheduled && isAdmin && (
                <div className="absolute top-10 right-2 z-10">
                  <span className="rounded-md border border-blue-500/50 bg-blue-600/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-black text-white shadow-lg uppercase">
                    مجدولة
                  </span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between dir-rtl">
                <h4 className="leading-none text-lg md:text-xl font-bold text-white drop-shadow-md text-right">
                  {ep.title || `الحلقة ${eNum}`}
                </h4>
                {ep.duration && (
                  <span className="rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-white md:group-hover:opacity-0 md:group-hover:scale-50 transition-all duration-300">
                    {ep.duration}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 p-3 md:p-4 flex flex-col justify-between bg-[var(--bg-card)] md:absolute md:top-[98%] md:left-0 md:right-0 md:z-10 md:border-x md:border-b md:border-gray-800 md:rounded-b-xl md:opacity-0 md:invisible md:group-hover:opacity-100 md:group-hover:visible md:transform md:translate-y-[-10px] md:group-hover:translate-y-0 md:transition-all md:duration-300 md:shadow-2xl">
              <div className="flex items-start justify-between gap-3 dir-rtl mb-2">
                <p className="leading-relaxed line-clamp-3 text-xs md:text-sm text-gray-400 text-right flex-1">
                  {getEpisodeDescription(ep.description, eNum, sNum)}
                </p>
              </div>
              {ep.publishDate && (
                <>
                  {/* خط أفقي فاصل بين وصف الحلقة وتاريخ النشر */}
                  <hr className="border-t border-gray-400/40 my-2 w-full" />
                  <div className="text-[10px] text-gray-500 font-bold mt-auto pt-1 flex items-center gap-1 dir-rtl justify-start">
                    <span>تاريخ النشر:</span>
                    <span>{ep.publishDate}</span>
                  </div>
                </>
              )}
            </div>
          </a>
        );
      })}
    </div>
    </>
  );
};

export default EpisodeGrid;
