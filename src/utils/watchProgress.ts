export interface WatchPositionData {
  contentId: string;
  seasonNumber?: number;
  episodeNumber?: number;
  position: number; // in seconds
  duration: number; // in seconds
  updatedAt: number; // timestamp
}

export const getSavedWatchPosition = (
  contentId: string | number,
  seasonNumber?: number,
  episodeNumber?: number
): number => {
  if (!contentId) return 0;
  try {
    const isMovie = seasonNumber === undefined && episodeNumber === undefined;
    const key = isMovie ? `cinematix_pos_${contentId}` : `cinematix_pos_${contentId}_s${seasonNumber || 1}_e${episodeNumber || 1}`;
    let raw = localStorage.getItem(key);
    if (!raw && isMovie) {
      // Fallback for legacy movie records saved with _s1_e1
      raw = localStorage.getItem(`cinematix_pos_${contentId}_s1_e1`);
    }
    if (raw) {
      const data: WatchPositionData = JSON.parse(raw);
      if (data && typeof data.position === 'number' && data.position > 3) {
        return data.position;
      }
    }
  } catch (e) {
    console.error('Failed to read watch position:', e);
  }
  return 0;
};

export const saveWatchPosition = (
  contentId: string | number,
  position: number,
  duration: number,
  seasonNumber?: number,
  episodeNumber?: number
) => {
  if (!contentId || position < 3) return;
  try {
    const isMovie = seasonNumber === undefined && episodeNumber === undefined;
    const key = isMovie ? `cinematix_pos_${contentId}` : `cinematix_pos_${contentId}_s${seasonNumber || 1}_e${episodeNumber || 1}`;
    // If completed (> 95% watched), clear position
    if (duration > 0 && position / duration > 0.95) {
      localStorage.removeItem(key);
      if (isMovie) localStorage.removeItem(`cinematix_pos_${contentId}_s1_e1`);
      return;
    }
    const data: WatchPositionData = {
      contentId: String(contentId),
      seasonNumber,
      episodeNumber,
      position: Math.floor(position),
      duration: Math.floor(duration),
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save watch position:', e);
  }
};

export const clearWatchPosition = (
  contentId: string | number,
  seasonNumber?: number,
  episodeNumber?: number
) => {
  if (!contentId) return;
  try {
    const isMovie = seasonNumber === undefined && episodeNumber === undefined;
    const key = isMovie ? `cinematix_pos_${contentId}` : `cinematix_pos_${contentId}_s${seasonNumber || 1}_e${episodeNumber || 1}`;
    localStorage.removeItem(key);
    if (isMovie) localStorage.removeItem(`cinematix_pos_${contentId}_s1_e1`);
  } catch (e) {
    console.error('Failed to clear watch position:', e);
  }
};
