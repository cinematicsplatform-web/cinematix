import React, { useState } from 'react';
import type { Season, Episode } from '../types';
import { PlayIcon } from './icons/PlayIcon';

interface EpisodeListProps {
  seasons: Season[];
  onSelectEpisode: (episode: Episode) => void;
  selectedEpisodeId?: number | null;
}

const EpisodeList: React.FC<EpisodeListProps> = ({ seasons, onSelectEpisode, selectedEpisodeId }) => {
  const [activeSeason, setActiveSeason] = useState(seasons[0].id);

  const currentSeason = seasons.find(s => s.id === activeSeason);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6">
      <div className="flex items-center border-b border-gray-700 mb-4 overflow-x-auto rtl-scroll">
        {seasons.map(season => (
          <button
            key={season.id}
            onClick={() => setActiveSeason(season.id)}
            className={`flex-shrink-0 px-4 py-2 text-lg font-bold transition-colors duration-200 ${activeSeason === season.id ? 'text-[#00FFB0] border-b-2 border-[#00FFB0]' : 'text-gray-400 hover:text-white'}`}
          >
            الموسم {season.seasonNumber}
          </button>
        ))}
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {currentSeason?.episodes.map(ep => (
          <div 
            key={ep.id} 
            onClick={() => onSelectEpisode(ep)}
            className={`flex items-center gap-4 p-3 rounded-lg group transition-all duration-200 cursor-pointer ${selectedEpisodeId === ep.id ? 'bg-[#00FFB0]/20 ring-2 ring-[#00FFB0]' : 'bg-gray-800/50 hover:bg-gray-700/70'}`}
            >
            <div className="relative flex-shrink-0 w-32 h-20 rounded-md overflow-hidden">
                <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="w-6 h-6 text-white"/>
                </div>
                <div className="absolute bottom-0 right-0 left-0 h-1 bg-gray-500/50">
                    <div style={{width: `${ep.progress}%`}} className="h-full bg-[#00FFB0]"></div>
                </div>
            </div>
            <div className="flex-grow">
              <h4 className="text-white font-semibold">{ep.title}</h4>
              <p className="text-gray-400 text-sm">{ep.duration} دقيقة</p>
            </div>
             <button className={`hidden md:block font-bold px-4 py-2 rounded-lg transition-all text-sm ${selectedEpisodeId === ep.id ? 'bg-[#00FFB0] text-black' : 'bg-transparent text-gray-400 group-hover:bg-gray-600 group-hover:text-white'}`}>
                {ep.progress > 0 && ep.progress < 100 ? "استئناف" : "مشاهدة"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EpisodeList;