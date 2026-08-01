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
    const key = `cinematix_pos_${contentId}_s${seasonNumber || 1}_e${episodeNumber || 1}`;
    const raw = localStorage.getItem(key);
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
    const key = `cinematix_pos_${contentId}_s${seasonNumber || 1}_e${episodeNumber || 1}`;
    // If completed (> 95% watched), clear position
    if (duration > 0 && position / duration > 0.95) {
      localStorage.removeItem(key);
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
    const key = `cinematix_pos_${contentId}_s${seasonNumber || 1}_e${episodeNumber || 1}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear watch position:', e);
  }
};
