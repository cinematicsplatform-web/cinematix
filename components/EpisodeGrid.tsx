
import React from 'react';
import type { Episode } from '../types';

interface EpisodeGridProps {
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
  selectedEpisodeId?: number | null;
}

const EpisodeGrid: React.FC<EpisodeGridProps> = ({ episodes, onSelectEpisode, selectedEpisodeId }) => {
  if (episodes.length === 0) {
    return (
        <div className="bg-gray-900/50 rounded-lg p-4 text-center text-gray-500 border border-gray-800">
            لا توجد حلقات متاحة لهذا الموسم.
        </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {episodes.map((ep, index) => (
          <button
            key={ep.id}
            onClick={() => onSelectEpisode(ep)}
            className={`
                relative py-3 px-2 flex items-center justify-center text-center rounded-lg font-bold text-sm transition-all duration-200 overflow-hidden border
                ${
                  selectedEpisodeId === ep.id
                    ? 'bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black border-transparent shadow-[0_0_10px_rgba(0,167,248,0.3)] scale-105 z-10'
                    : 'bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
                }
            `}
            title={ep.title || `حلقة ${index + 1}`}
          >
            <span className="truncate w-full">
                {ep.title ? ep.title.replace('الحلقة ', '') : `${index + 1}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EpisodeGrid;
