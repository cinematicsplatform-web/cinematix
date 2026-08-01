/**
 * Central Player Configuration for Cinematix VideoPlayer
 * All player settings, default qualities, playback speeds, skip intervals,
 * and URL formatters are configured here so that any modification
 * automatically applies across all video players in the app.
 */

export interface PlayerSettings {
  defaultPlaybackSpeed: number;
  availableSpeeds: number[];
  availableQualities: string[];
  skipIntervalSeconds: number;
  autoNextCountdownSeconds: number;
  resumeThresholdSeconds: number;
  loadingTimeoutMs: number;
  primaryAccentColor: string;
  servers: { id: string; label: string; domain: string }[];
}

export const PLAYER_CONFIG: PlayerSettings = {
  defaultPlaybackSpeed: 1.0,
  availableSpeeds: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
  availableQualities: ['تلقائي', '1080p High', '720p HD', '480p SD', '360p Low'],
  skipIntervalSeconds: 10,
  autoNextCountdownSeconds: 10,
  resumeThresholdSeconds: 5,
  loadingTimeoutMs: 600,
  primaryAccentColor: '#2563eb', // Blue-600
  servers: [
    { id: 'server1', label: 'VidSrc (XYZ)', domain: 'https://vidsrc.xyz/embed' },
    { id: 'server2', label: 'Cinematix VIP', domain: 'https://vidsrc.vip/embed' },
    { id: 'server3', label: '2Embed (Backup)', domain: 'https://www.2embed.cc/embed' }
  ]
};

/**
 * Normalizes video source URLs (e.g. YouTube watch/shorts links, Google Drive preview links, Dropbox links -> direct/embed format)
 */
export function formatVideoSource(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  let trimmed = url.trim();
  if (!trimmed) return undefined;

  // Fix http -> https
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && trimmed.toLowerCase().startsWith('http://')) {
    trimmed = trimmed.replace(/^http:\/\//i, 'https://');
  }

  // Handle Google Drive view/preview links -> convert to direct uc stream
  if (trimmed.includes('drive.google.com')) {
    const fileIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
    }
  }

  // Handle Dropbox links -> convert to raw stream
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl=0')) {
      return trimmed.replace('dl=0', 'raw=1');
    }
    if (!trimmed.includes('raw=1') && !trimmed.includes('dl=1')) {
      return `${trimmed}${trimmed.includes('?') ? '&' : '?'}raw=1`;
    }
  }

  // Handle YouTube links
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    let videoId = '';
    if (trimmed.includes('youtu.be/')) {
      videoId = trimmed.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    } else if (trimmed.includes('youtube.com/watch')) {
      const match = trimmed.match(/[?&]v=([^&]+)/);
      if (match && match[1]) videoId = match[1];
    } else if (trimmed.includes('youtube.com/embed/')) {
      videoId = trimmed.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0];
    } else if (trimmed.includes('youtube.com/shorts/')) {
      videoId = trimmed.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('&')[0];
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
  }

  return trimmed;
}

/**
 * Checks if a URL points to a direct video format that can be handled natively by HTML5 video / HLS
 */
export function checkIsDirectVideo(url?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase().trim();
  const cleanUrl = lowerUrl.split('?')[0];
  const videoExtensions = ['.mp4', '.m3u8', '.mpd', '.ogg', '.webm', '.ts', '.mov', '.mkv', '.avi', '.flv'];

  // 1. Direct extension match
  if (videoExtensions.some(ext => cleanUrl.endsWith(ext))) {
    return true;
  }

  // 2. Direct storage / streaming provider keywords
  const directKeywords = [
    '.m3u8', '.mp4', '.webm', '.mov', '.mkv', 'blob:', 'googlevideo', 
    'firebasestorage', 'stream', 'raw', 'video/mp4', 'drive.google.com/uc', 
    'dropbox.com', 'dl=1', 'raw=1', 'storage.googleapis.com', 
    'myqcloud.com', 'cloudinary.com', 'r2.dev', 'backblazeb2.com'
  ];

  if (directKeywords.some(kw => lowerUrl.includes(kw))) {
    return true;
  }

  // 3. Exclude known third-party embed providers (that require iframe)
  const embedDomains = [
    'youtube.com/embed', 'youtu.be', 'vidsrc', '2embed', 'uqload', 
    'dailymotion', 'player.vimeo.com', 'vk.com/video_ext'
  ];
  const isKnownEmbed = embedDomains.some(domain => lowerUrl.includes(domain));
  if (isKnownEmbed) {
    return false;
  }

  // 4. Fallback check: If URL has video keyword or extension anywhere in query, treat as direct video
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.m3u8') || lowerUrl.includes('video')) {
    return true;
  }

  return false;
}

