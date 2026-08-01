import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { BouncingDotsLoader } from '../shared/BouncingDotsLoader';
import { getSavedWatchPosition, saveWatchPosition, clearWatchPosition } from '../../utils/watchProgress';
import { PLAYER_CONFIG, formatVideoSource, checkIsDirectVideo } from '../../playerConfig';

export interface SubtitleTrack {
  language: string; // e.g. 'ar', 'en'
  label: string;    // e.g. 'العربية', 'English'
  url: string;      // e.g. .vtt or .srt file URL
}

export interface IntroTiming {
  introStart: number; // seconds
  introEnd: number;   // seconds
}

export interface PlayerEpisode {
  id: number;
  episodeNumber?: number;
  title?: string;
  thumbnail?: string;
  duration?: string;
  servers?: any[];
}

export interface PlayerServer {
  id: number | string;
  name?: string;
  url: string;
  downloadUrl?: string;
  isActive?: boolean;
}

export interface VideoPlayerProps {
  poster: string;
  manualSrc?: string; 
  tmdbId?: string;    
  type?: string;      
  season?: number;    
  episode?: number;   
  ads?: any[];
  adsEnabled?: boolean;
  title?: string;
  episodeTitle?: string;
  seriesTitle?: string;
  contentId?: string;
  subtitles?: SubtitleTrack[];
  intro?: IntroTiming;
  episodes?: PlayerEpisode[];
  servers?: PlayerServer[];
  selectedServerId?: number | string;
  onServerSelect?: (server: PlayerServer) => void;
  lastPosition?: number;
  onEpisodeSelect?: (episodeNumber: number, episodeObj?: PlayerEpisode) => void;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onClose?: () => void;
}

// SVG Icons matching the target design exact specs
const PlayIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const Rewind10Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.5 3C17.19 3 21 6.81 21 11.5C21 16.19 17.19 20 12.5 20C8.71 20 5.5 17.5 4.38 14H6.55C7.54 16.37 9.83 18 12.5 18C16.09 18 19 15.09 19 11.5C19 7.91 16.09 5 12.5 5C10.22 5 8.21 6.17 7.05 7.95L10 10.9H3V3.9L5.55 6.45C7.11 4.36 9.65 3 12.5 3Z" />
    <text x="12.5" y="14.2" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="currentColor">10</text>
  </svg>
);

const Forward10Icon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.5 3C6.81 3 3 6.81 3 11.5C3 16.19 6.81 20 11.5 20C15.29 20 18.5 17.5 19.62 14H17.45C16.46 16.37 14.17 18 11.5 18C7.91 18 5 15.09 5 11.5C5 7.91 7.91 5 11.5 5C13.78 5 15.79 6.17 16.95 7.95L14 10.9H21V3.9L18.45 6.45C16.89 4.36 14.35 3 11.5 3Z" />
    <text x="11.5" y="14.2" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="currentColor">10</text>
  </svg>
);

const VolumeHighIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const VolumeMuteIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
);

const ShareCurvedIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z"/>
  </svg>
);

const PipScreenIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <rect x="11" y="9" width="8" height="6" rx="1" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

const SettingsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const FullscreenIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const SubtitleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M7 15h4M15 15h2M7 11h10" />
  </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SkipNextIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const ServerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  poster,
  manualSrc,
  tmdbId,
  type,
  season = 1,
  episode = 1,
  title,
  episodeTitle,
  seriesTitle,
  contentId,
  subtitles = [],
  intro,
  episodes = [],
  servers = [],
  selectedServerId,
  onServerSelect,
  lastPosition,
  onEpisodeSelect,
  onProgressUpdate,
  onClose
}) => {
  // Logic states
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [activeServerType, setActiveServerType] = useState<string>('server1');
  const [activeSource, setActiveSource] = useState<string | undefined>(undefined);

  // Compute effective server list dynamically
  const effectiveServers = useMemo<PlayerServer[]>(() => {
    if (servers && servers.length > 0) {
      return servers.map((srv, idx) => ({
        id: srv.id ?? idx + 1,
        name: srv.name && srv.name.trim() !== '' ? srv.name : `جودة ${idx + 1}`,
        url: srv.url,
        downloadUrl: srv.downloadUrl,
        isActive: srv.isActive
      }));
    }

    if (tmdbId) {
      const s1Domain = PLAYER_CONFIG.servers[0]?.domain || 'https://vidsrc.xyz/embed';
      const s2Domain = PLAYER_CONFIG.servers[1]?.domain || 'https://vidsrc.vip/embed';
      const s1Url = (type === 'movie' || type === 'video.movie')
        ? `${s1Domain}/movie/${tmdbId}`
        : `${s1Domain}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      const s2Url = (type === 'movie' || type === 'video.movie')
        ? `${s2Domain}/movie/${tmdbId}`
        : `${s2Domain}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      const s3Url = (type === 'movie' || type === 'video.movie')
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season || 1}&e=${episode || 1}`;

      return [
        { id: 'server1', name: 'جودة 1 (VidSrc)', url: s1Url },
        { id: 'server2', name: 'جودة 2 (Cinematix VIP)', url: s2Url },
        { id: 'server3', name: 'جودة 3 (2Embed)', url: s3Url }
      ];
    }

    if (manualSrc) {
      return [
        { id: 'server1', name: 'جودة عالية (رئيسي)', url: manualSrc }
      ];
    }

    return [];
  }, [servers, tmdbId, type, season, episode, manualSrc]);

  const [selectedServer, setSelectedServer] = useState<PlayerServer | null>(null);

  useEffect(() => {
    if (effectiveServers.length > 0) {
      if (selectedServerId !== undefined) {
        const match = effectiveServers.find(s => String(s.id) === String(selectedServerId));
        if (match) {
          setSelectedServer(match);
          return;
        }
      }
      if (manualSrc) {
        const matchUrl = effectiveServers.find(s => s.url === manualSrc);
        if (matchUrl) {
          setSelectedServer(matchUrl);
          return;
        }
      }

      const item720 = effectiveServers.find(s => `${s.name} ${s.url}`.includes('720'));
      const item360 = effectiveServers.find(s => `${s.name} ${s.url}`.includes('360'));
      const item480 = effectiveServers.find(s => `${s.name} ${s.url}`.includes('480'));

      let chosenServer: PlayerServer;
      if (item720 && item360) {
        chosenServer = item360;
      } else if (item480) {
        chosenServer = item480;
      } else if (item720) {
        chosenServer = item720;
      } else if (item360) {
        chosenServer = item360;
      } else {
        const middleIndex = effectiveServers.length >= 2 ? 1 : 0;
        chosenServer = effectiveServers[middleIndex];
      }

      setSelectedServer(chosenServer);
    }
  }, [effectiveServers, selectedServerId, manualSrc]);

  // Custom UI States
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  // Modals & Drawers
  const [activeModal, setActiveModal] = useState<'none' | 'servers' | 'quality' | 'speed' | 'subtitles' | 'episodes'>('none');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [qualityLevels, setQualityLevels] = useState<{ id: number; label: string; height: number }[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<string>('off');

  const failedQualitiesRef = useRef<Set<string>>(new Set());
  const failedServersRef = useRef<Set<string>>(new Set());

  // Reset error tracking when content/episode/source explicitly changes
  useEffect(() => {
    failedQualitiesRef.current.clear();
    failedServersRef.current.clear();
    setHasVideoError(false);
  }, [season, episode, tmdbId, manualSrc]);

  const handleVideoPlaybackError = useCallback(() => {
    // 1. Try switching HLS quality level first if available
    if (hlsRef.current && qualityLevels.length > 0) {
      const currentQ = selectedQuality;
      failedQualitiesRef.current.add(currentQ);

      // Find next untried quality level
      const untriedLevel = qualityLevels.find(l => !failedQualitiesRef.current.has(l.label));
      if (untriedLevel && hlsRef.current) {
        hlsRef.current.currentLevel = untriedLevel.id;
        setSelectedQuality(untriedLevel.label);
        setIsServerLoading(false);
        setIsBuffering(false);
        setHasVideoError(false);
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
        return;
      } else if (!failedQualitiesRef.current.has('Auto') && hlsRef.current) {
        failedQualitiesRef.current.add('Auto');
        hlsRef.current.currentLevel = -1;
        setSelectedQuality('Auto');
        setIsServerLoading(false);
        setIsBuffering(false);
        setHasVideoError(false);
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
        return;
      }
    }

    // 2. If HLS switching is exhausted or not HLS, try next server/quality option in effectiveServers
    if (effectiveServers.length > 1) {
      if (selectedServer) {
        failedServersRef.current.add(String(selectedServer.id || selectedServer.url));
      }

      const nextServer = effectiveServers.find(s => !failedServersRef.current.has(String(s.id || s.url)));
      if (nextServer) {
        setSelectedServer(nextServer);
        setIsServerLoading(true);
        setIsBuffering(false);
        setHasVideoError(false);
        return;
      }
    }

    // 3. Fallback error view if all options failed
    setIsServerLoading(false);
    setIsBuffering(false);
    setHasVideoError(true);
  }, [qualityLevels, selectedQuality, effectiveServers, selectedServer]);

  // Next Episode Auto-Next Overlay State
  const [showNextEpisodeOverlay, setShowNextEpisodeOverlay] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const [hasDismissedNextEpisode, setHasDismissedNextEpisode] = useState(false);
  const nextEpisodeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resume Position Prompt State
  const [resumePosition, setResumePosition] = useState<number | null>(null);
  const [hasPromptedResume, setHasPromptedResume] = useState(false);

  // Fast Seek Indicators
  const [showForwardIndicator, setShowForwardIndicator] = useState(false);
  const [showBackwardIndicator, setShowBackwardIndicator] = useState(false);
  const forwardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backwardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate Next Episode Obj
  const nextEpisodeObj = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;
    const currentIndex = episodes.findIndex((e, idx) => (e.episodeNumber || idx + 1) === episode);
    if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
      const nextEp = episodes[currentIndex + 1];
      return {
        ...nextEp,
        episodeNumber: nextEp.episodeNumber || (currentIndex + 2)
      };
    }
    return null;
  }, [episodes, episode]);

  // Read saved watch position on load
  useEffect(() => {
    const effectiveContentId = contentId || tmdbId || title || 'default';
    const savedPos = lastPosition || getSavedWatchPosition(effectiveContentId, season, episode);
    if (savedPos > 5) {
      setResumePosition(savedPos);
    } else {
      setResumePosition(null);
    }
    setHasPromptedResume(false);
    setHasDismissedNextEpisode(false);
    setShowNextEpisodeOverlay(false);
  }, [manualSrc, contentId, tmdbId, season, episode, lastPosition, title]);

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Source URL Resolution
  useEffect(() => {
    let sourceUrl = selectedServer?.url || manualSrc;
    let shouldUseIsolation = false;

    if (!sourceUrl && tmdbId) {
      let domain = PLAYER_CONFIG.servers[0]?.domain || 'https://vidsrc.xyz/embed';
      if (activeServerType === 'server2') domain = PLAYER_CONFIG.servers[1]?.domain || 'https://vidsrc.vip/embed';
      if (activeServerType === 'server3') domain = PLAYER_CONFIG.servers[2]?.domain || 'https://www.2embed.cc/embed';

      if (activeServerType === 'server3') {
        sourceUrl = (type === 'movie' || type === 'video.movie')
          ? `https://www.2embed.cc/embed/${tmdbId}`
          : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season || 1}&e=${episode || 1}`;
      } else {
        sourceUrl = (type === 'movie' || type === 'video.movie')
          ? `${domain}/movie/${tmdbId}`
          : `${domain}/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      }
      shouldUseIsolation = true;
    }

    let finalUrl = formatVideoSource(sourceUrl);

    setActiveSource(undefined);
    setHasVideoError(false);
    setIsPlaying(false);

    if (finalUrl && finalUrl.trim() !== '') {
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && finalUrl.toLowerCase().startsWith('http://')) {
        finalUrl = finalUrl.replace(/^http:\/\//i, 'https://');
      }
      setIsServerLoading(true);
      setIsBuffering(false);

      if (shouldUseIsolation || finalUrl.includes('vidsrc') || finalUrl.includes('2embed')) {
        const encodedUrl = encodeURIComponent(finalUrl);
        setActiveSource(`/embed.html?url=${encodedUrl}`);
      } else {
        setActiveSource(finalUrl);
      }

      const loadingTimer = setTimeout(() => {
        setIsServerLoading(false);
      }, PLAYER_CONFIG.loadingTimeoutMs);

      return () => clearTimeout(loadingTimer);
    } else {
      setActiveSource(undefined);
      setIsServerLoading(false);
      setIsBuffering(false);
    }
  }, [selectedServer, manualSrc, tmdbId, type, season, episode, activeServerType]);

  const isDirectVideo = useMemo(() => {
    return checkIsDirectVideo(activeSource);
  }, [activeSource]);

  // HLS Setup & Adaptive Quality Levels Detection
  useEffect(() => {
    let hls: Hls | null = null;
    const videoElement = videoRef.current;

    if (activeSource && isDirectVideo && activeSource.toLowerCase().includes('.m3u8') && videoElement) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxMaxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsRef.current = hls;

        hls.loadSource(activeSource);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          setIsServerLoading(false);
          setIsBuffering(false);
          if (videoElement.duration) {
            setDuration(videoElement.duration);
          }
          if (data.levels) {
            const levels = data.levels.map((lvl, index) => ({
              id: index,
              label: `${lvl.height || lvl.bitrate || 720}p`,
              height: lvl.height || 720
            }));
            levels.sort((a, b) => b.height - a.height);
            setQualityLevels(levels);

            const level720 = levels.find(l => l.height === 720 || l.label.includes('720'));
            const level360 = levels.find(l => l.height === 360 || l.label.includes('360'));
            const level480 = levels.find(l => l.height === 480 || l.label.includes('480'));

            let chosenLevel = null;
            if (level720 && level360) {
              chosenLevel = level360;
            } else if (level480) {
              chosenLevel = level480;
            } else if (level720) {
              chosenLevel = level720;
            } else if (level360) {
              chosenLevel = level360;
            } else {
              const midIdx = levels.length >= 2 ? Math.floor(levels.length / 2) : 0;
              chosenLevel = levels[midIdx];
            }

            if (chosenLevel && hls) {
              hls.currentLevel = chosenLevel.id;
              setSelectedQuality(chosenLevel.label);
            }
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                handleVideoPlaybackError();
                break;
            }
          }
        });
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = activeSource;
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeSource, isDirectVideo]);

  // Fast Seek Logic
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      setCurrentTime(videoRef.current.currentTime);

      if (seconds > 0) {
        setShowForwardIndicator(true);
        if (forwardTimeoutRef.current) clearTimeout(forwardTimeoutRef.current);
        forwardTimeoutRef.current = setTimeout(() => setShowForwardIndicator(false), 800);
      } else {
        setShowBackwardIndicator(true);
        if (backwardTimeoutRef.current) clearTimeout(backwardTimeoutRef.current);
        backwardTimeoutRef.current = setTimeout(() => setShowBackwardIndicator(false), 800);
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeModal !== 'none') {
      setActiveModal('none');
      return;
    }

    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          console.debug('Playback prevented:', err);
        }
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    }
  };

  // Time & Progress Updates
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration;
    setCurrentTime(cur);

    if (dur && dur > 0) {
      setDuration(dur);

      const effectiveContentId = contentId || tmdbId || title || 'default';
      if (Math.floor(cur) % 5 === 0) {
        saveWatchPosition(effectiveContentId, cur, dur, season, episode);
        if (onProgressUpdate) onProgressUpdate(cur, dur);
      }

      if (
        nextEpisodeObj &&
        dur > 30 &&
        cur >= dur - 20 &&
        !showNextEpisodeOverlay &&
        !hasDismissedNextEpisode
      ) {
        setShowNextEpisodeOverlay(true);
        setNextEpisodeCountdown(10);
      }
    }
  };

  // Auto-Next Episode Countdown Effect
  useEffect(() => {
    if (showNextEpisodeOverlay && nextEpisodeCountdown > 0) {
      nextEpisodeTimerRef.current = setInterval(() => {
        setNextEpisodeCountdown(prev => {
          if (prev <= 1) {
            clearInterval(nextEpisodeTimerRef.current!);
            handlePlayNextEpisode();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (nextEpisodeTimerRef.current) clearInterval(nextEpisodeTimerRef.current);
    };
  }, [showNextEpisodeOverlay, nextEpisodeCountdown]);

  const handlePlayNextEpisode = () => {
    setShowNextEpisodeOverlay(false);
    if (nextEpisodeObj && onEpisodeSelect) {
      onEpisodeSelect(nextEpisodeObj.episodeNumber || 1, nextEpisodeObj);
    }
  };

  const handleDismissNextEpisode = () => {
    setShowNextEpisodeOverlay(false);
    setHasDismissedNextEpisode(true);
    if (nextEpisodeTimerRef.current) clearInterval(nextEpisodeTimerRef.current);
  };

  const handleResumePlayback = () => {
    if (videoRef.current && resumePosition) {
      videoRef.current.currentTime = resumePosition;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch(() => {});
    }
    setHasPromptedResume(true);
  };

  const handleStartOver = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch(() => {});
    }
    const effectiveContentId = contentId || tmdbId || title || 'default';
    clearWatchPosition(effectiveContentId, season, episode);
    setHasPromptedResume(true);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsServerLoading(false);
      setIsBuffering(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const updateVolume = (val: number) => {
    const newVolume = Math.max(0, Math.min(1, val));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (videoRef.current) {
      videoRef.current.muted = newMute;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setActiveModal('none');
  };

  const handleQualityChange = (levelId: number | 'auto', label: string) => {
    setSelectedQuality(label);
    if (hlsRef.current) {
      if (levelId === 'auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        hlsRef.current.currentLevel = levelId as number;
      }
    }
    setActiveModal('none');
  };

  const toggleFullscreen = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err: any) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: mainTitle,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2500);
    }
  };

  const handleTogglePip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      } else {
        setActiveModal(activeModal === 'episodes' ? 'none' : 'episodes');
      }
    } catch (err) {
      console.error('PIP error:', err);
      setActiveModal(activeModal === 'episodes' ? 'none' : 'episodes');
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && activeModal === 'none') setShowControls(false);
    }, 3500);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!isDirectVideo) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          handleMouseMove();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          handleMouseMove();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          handleMouseMove();
          break;
        case 'ArrowUp':
          e.preventDefault();
          updateVolume(volume + 0.1);
          handleMouseMove();
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateVolume(volume - 0.1);
          handleMouseMove();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          handleMouseMove();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          handleMouseMove();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirectVideo, isPlaying, volume, isMuted, activeModal]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Title formatting matching target design exact screenshot
  const mainTitle = useMemo(() => {
    if (seriesTitle) return seriesTitle;
    if (title) {
      const parts = title.split(' - ');
      return parts[0];
    }
    return 'تحت السن';
  }, [seriesTitle, title]);

  const subTitle = useMemo(() => {
    const sNum = season || 1;
    const eNum = episode || 1;
    let extraTitle = '';
    if (episodeTitle && episodeTitle !== mainTitle) {
      const cleanEpTitle = episodeTitle.trim();
      if (!cleanEpTitle.match(/^(الحلقة|episode)\s*\d+$/i)) {
        extraTitle = ` - ${cleanEpTitle}`;
      }
    }
    return `الموسم ${sNum} : الحلقة ${eNum}${extraTitle}`;
  }, [episodeTitle, mainTitle, season, episode]);

  return (
    <div className="flex flex-col gap-4 font-['Cairo']">
      <div
        ref={containerRef}
        className="aspect-video w-full bg-[#000000] rounded-2xl overflow-hidden shadow-2xl relative video-player-wrapper group border border-white/10 select-none"
        onMouseMove={handleMouseMove}
      >
        {/* Copy Confirmation Toast */}
        {showCopiedToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[220] bg-black/90 text-white font-bold text-xs px-4 py-2 rounded-full border border-white/20 shadow-xl animate-fade-in pointer-events-none">
            ✓ تم نسخ رابط الحلقة
          </div>
        )}

        {/* Server Loading Overlay */}
        {isServerLoading && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#090A0F]">
            <div className="mb-4">
              <BouncingDotsLoader size="md" colorClass="bg-emerald-400" delayMs={0} />
            </div>
            <p className="text-white font-black text-base md:text-lg animate-pulse font-['Cairo']">
              جاري جلب البث وسيرفر التشغيل...
            </p>
          </div>
        )}

        {/* Buffering Spinner */}
        {isBuffering && isPlaying && !isServerLoading && !hasVideoError && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
            <BouncingDotsLoader size="lg" colorClass="bg-emerald-400" delayMs={0} />
          </div>
        )}

        {/* Fast Seek Indicators */}
        <div className="absolute inset-0 z-[80] flex pointer-events-none select-none">
          <div className="flex-1 flex items-center justify-center">
            <div className={`transition-all duration-300 transform bg-black/60 backdrop-blur-md p-6 rounded-full flex flex-col items-center gap-1 ${showForwardIndicator ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
              <Forward10Icon className="w-10 h-10 text-emerald-400" />
              <span className="text-white font-black text-sm">+10ث</span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className={`transition-all duration-300 transform bg-black/60 backdrop-blur-md p-6 rounded-full flex flex-col items-center gap-1 ${showBackwardIndicator ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}>
              <Rewind10Icon className="w-10 h-10 text-emerald-400" />
              <span className="text-white font-black text-sm">-10ث</span>
            </div>
          </div>
        </div>

        {/* Resume Watch Position Prompt Modal */}
        {resumePosition && resumePosition > 5 && !hasPromptedResume && (
          <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in pointer-events-auto">
            <div className="bg-[#0e1218] border border-white/10 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <PlayIcon className="w-6 h-6 text-emerald-400 translate-x-0.5" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">هل ترغب في الاستمرار من حيث توقفت؟</h3>
              <p className="text-xs md:text-sm text-gray-300 font-bold">
                توقفت سابقاً عند <span className="text-emerald-400 dir-ltr font-mono">{formatTime(resumePosition)}</span>
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResumePlayback}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-black font-black text-xs md:text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  متابعة المشاهدة
                </button>
                <button
                  onClick={handleStartOver}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs md:text-sm active:scale-95 transition-all"
                >
                  البدء من البداية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Error Fallback */}
        {hasVideoError && (
          <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-[#0a0c10]/95 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <PlayIcon className="w-8 h-8 text-emerald-400 translate-x-0.5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black text-base md:text-lg">تعذر تشغيل المقطع مباشرة</h3>
              <p className="text-gray-400 text-xs md:text-sm font-bold">يمكنك تجربة السيرفر التبادلي أو فتح الرابط مباشر</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setHasVideoError(false);
                  setIsServerLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                    videoRef.current.play().catch(() => {});
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs md:text-sm hover:bg-emerald-400 active:scale-95 transition-all shadow-lg"
              >
                إعادة المحاولة
              </button>
              {manualSrc && (
                <a
                  href={manualSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white border border-white/10 font-bold text-xs md:text-sm hover:bg-white/20 active:scale-95 transition-all"
                >
                  فتح البث مباشر
                </a>
              )}
            </div>
          </div>
        )}

        {/* Skip Intro Overlay Button */}
        {intro && intro.introStart && intro.introEnd && currentTime >= intro.introStart && currentTime < intro.introEnd && (
          <div className="absolute bottom-20 right-6 z-[120] pointer-events-auto">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = intro.introEnd;
                  setCurrentTime(intro.introEnd);
                }
              }}
              className="bg-emerald-500 text-black font-black text-xs md:text-sm px-5 py-2.5 rounded-2xl shadow-2xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center gap-2"
            >
              <SkipNextIcon className="w-5 h-5 text-black" />
              <span>تخطي المقدمة</span>
            </button>
          </div>
        )}

        {/* Next Episode Floating Card Overlay (Auto-Next) */}
        {showNextEpisodeOverlay && nextEpisodeObj && (
          <div className="absolute bottom-20 left-6 z-[170] bg-[#0c1015]/95 border border-emerald-500/40 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl max-w-xs md:max-w-sm w-full animate-fade-in-up pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                الحلقة التالية بعد {nextEpisodeCountdown}ث
              </span>
              <button onClick={handleDismissNextEpisode} className="text-gray-400 hover:text-white p-1">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 items-center mb-3">
              {nextEpisodeObj.thumbnail ? (
                <img src={nextEpisodeObj.thumbnail} alt={nextEpisodeObj.title || ''} className="w-20 h-12 object-cover rounded-xl border border-white/10" />
              ) : (
                <div className="w-20 h-12 bg-white/10 rounded-xl flex items-center justify-center font-bold text-xs text-emerald-400">
                  حلقة {nextEpisodeObj.episodeNumber || 1}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <h4 className="text-xs md:text-sm font-black text-white truncate">{nextEpisodeObj.title || `الحلقة ${nextEpisodeObj.episodeNumber || 1}`}</h4>
                <span className="text-[10px] text-gray-400 font-bold">الموسم {season} • الحلقة {nextEpisodeObj.episodeNumber || 1}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePlayNextEpisode}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs shadow-md hover:bg-emerald-400 transition-all flex items-center justify-center gap-1"
              >
                <PlayIcon className="w-4 h-4 text-black translate-x-0.5" />
                <span>تشغيل الآن</span>
              </button>
              <button
                onClick={handleDismissNextEpisode}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* Video or Embed Container */}
        {activeSource && (
          <div className="absolute inset-0 z-10">
            {isDirectVideo ? (
              <div className="relative w-full h-full" onClick={togglePlay}>
                <video
                  ref={videoRef}
                  key={activeSource}
                  poster={poster}
                  className="w-full h-full bg-black object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onCanPlay={() => { setIsServerLoading(false); setIsBuffering(false); }}
                  onCanPlayThrough={() => { setIsServerLoading(false); setIsBuffering(false); }}
                  onLoadedData={() => { setIsServerLoading(false); setIsBuffering(false); }}
                  onWaiting={() => { if (isPlaying) setIsBuffering(true); }}
                  onPlaying={() => { setIsBuffering(false); setIsPlaying(true); setIsServerLoading(false); }}
                  onPlay={() => { setIsPlaying(true); setIsBuffering(false); }}
                  onPause={() => { setIsPlaying(false); setIsBuffering(false); }}
                  onError={() => {
                    handleVideoPlaybackError();
                  }}
                  playsInline
                >
                  {!activeSource.toLowerCase().includes('.m3u8') && (
                    <source src={activeSource} type="video/mp4" />
                  )}
                  {subtitles.map((sub, idx) => (
                    <track
                      key={idx}
                      kind="subtitles"
                      src={sub.url}
                      srcLang={sub.language}
                      label={sub.label}
                      default={activeSubtitle === sub.language}
                    />
                  ))}
                </video>

                {/* Big Middle Play Button */}
                {!isPlaying && activeModal === 'none' && !hasVideoError && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer pointer-events-auto group/playbtn"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-all group-hover/playbtn:scale-110 group-hover/playbtn:bg-black/60">
                      <PlayIcon className="w-8 h-8 md:w-10 md:h-10 text-white translate-x-0.5" />
                    </div>
                  </div>
                )}

                {/* Video Controls Overlay - Exact Match to Screenshot */}
                <div
                  className={`absolute inset-0 z-50 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${showControls || activeModal !== 'none' || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.92) 100%)'
                  }}
                >
                  {/* TOP CONTROL BAR (HEADER OVERLAY) */}
                  <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 pointer-events-auto relative">
                    {/* Top Left: ONLY Close 'X' Button (NO FHD, NO Ads options as instructed) */}
                    <div className="flex items-center gap-3">
                      {onClose ? (
                        <button
                          onClick={onClose}
                          className="p-1.5 hover:opacity-80 transition-opacity text-white"
                          title="إغلاق"
                        >
                          <CloseIcon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                      ) : (
                        <button
                          onClick={() => window.history.back()}
                          className="p-1.5 hover:opacity-80 transition-opacity text-white"
                          title="إغلاق"
                        >
                          <CloseIcon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                      )}
                    </div>

                    {/* Top Center: Title & Subtitle */}
                    <div className="flex flex-col items-center text-center px-4 overflow-hidden">
                      <h2 className="text-base md:text-xl font-black text-white tracking-wide truncate max-w-md drop-shadow-sm">
                        {mainTitle}
                      </h2>
                      <span className="text-xs md:text-sm font-bold text-gray-200 opacity-90 drop-shadow-sm">
                        {subTitle}
                      </span>
                    </div>

                    {/* Top Right: Share & Picture-in-Picture / Screen Icons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleShare}
                        className="p-1.5 hover:opacity-80 transition-opacity text-white"
                        title="مشاركة"
                      >
                        <ShareCurvedIcon className="w-6 h-6 md:w-7 md:h-7" />
                      </button>
                      <button
                        onClick={handleTogglePip}
                        className="p-1.5 hover:opacity-80 transition-opacity text-white"
                        title="شاشة داخل شاشة / قائمة الحلقات"
                      >
                        <PipScreenIcon className="w-6 h-6 md:w-7 md:h-7" />
                      </button>
                    </div>
                  </div>

                  {/* Modals & Popovers */}
                  {/* Quality Settings Modal */}
                  {(activeModal === 'servers' || activeModal === 'quality') && (
                    <div className="absolute bottom-16 right-6 z-[200] w-64 bg-[#0c1015]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-fade-in-up">
                      <div className="bg-white/5 py-3 px-4 text-center border-b border-white/10 flex items-center justify-between">
                        <span className="text-sm font-black text-[#00E699] flex items-center gap-1.5">
                          <SettingsIcon className="w-4 h-4 text-[#00E699]" />
                          جودة المشاهدة
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold font-mono">
                          {effectiveServers.length} {effectiveServers.length === 1 ? 'جودة' : 'خيارات'}
                        </span>
                      </div>
                      <div className="flex flex-col py-1 max-h-64 overflow-y-auto custom-scrollbar">
                        {effectiveServers.length > 0 ? (
                          effectiveServers.map((srv, idx) => {
                            const isSelected = selectedServer?.id === srv.id || (selectedServer?.url === srv.url);
                            const displayName = srv.name && srv.name.trim() !== '' ? srv.name : `جودة ${idx + 1}`;
                            return (
                              <button
                                key={srv.id || idx}
                                onClick={() => {
                                  setSelectedServer(srv);
                                  if (srv.id && typeof srv.id === 'string' && srv.id.startsWith('server')) {
                                    setActiveServerType(srv.id);
                                  }
                                  if (onServerSelect) onServerSelect(srv);
                                  setActiveModal('none');
                                }}
                                className={`px-5 py-3 text-right font-bold text-xs md:text-sm hover:bg-white/10 flex items-center justify-between transition-colors ${isSelected ? 'text-[#00E699] bg-white/5 font-black' : 'text-white'}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-[#00E699] animate-pulse' : 'bg-gray-500'}`} />
                                  <span className="truncate">{displayName}</span>
                                </div>
                                {isSelected && <span className="text-[#00E699] font-black text-sm shrink-0">✓</span>}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-5 py-3 text-center text-xs text-gray-400">لا توجد خيارات متاحة</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subtitles Modal */}
                  {activeModal === 'subtitles' && (
                    <div className="absolute bottom-16 right-20 z-[200] w-56 bg-[#0c1015]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-fade-in-up">
                      <div className="bg-white/5 py-3 text-center border-b border-white/10">
                        <span className="text-sm font-black text-emerald-400">الترجمة واللغة</span>
                      </div>
                      <div className="flex flex-col py-1">
                        <button
                          onClick={() => { setActiveSubtitle('off'); setActiveModal('none'); }}
                          className={`px-5 py-3 text-right font-bold text-xs md:text-sm hover:bg-white/10 flex items-center justify-between ${activeSubtitle === 'off' ? 'text-emerald-400 bg-white/5' : 'text-white'}`}
                        >
                          <span>إيقاف</span>
                          {activeSubtitle === 'off' && <span className="text-emerald-400">✓</span>}
                        </button>
                        {subtitles.map((sub, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setActiveSubtitle(sub.language); setActiveModal('none'); }}
                            className={`px-5 py-3 text-right font-bold text-xs md:text-sm hover:bg-white/10 flex items-center justify-between ${activeSubtitle === sub.language ? 'text-emerald-400 bg-white/5' : 'text-white'}`}
                          >
                            <span>{sub.label || sub.language}</span>
                            {activeSubtitle === sub.language && <span className="text-emerald-400">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Episodes List Drawer (Side Overlay) */}
                  {activeModal === 'episodes' && episodes && episodes.length > 0 && (
                    <div className="absolute top-0 bottom-0 right-0 z-[220] w-72 md:w-80 bg-[#0c1015]/95 border-l border-white/10 backdrop-blur-2xl p-4 shadow-2xl pointer-events-auto flex flex-col animate-fade-in-right">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                        <h3 className="text-sm md:text-base font-black text-emerald-400">قائمة الحلقات ({episodes.length})</h3>
                        <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-white p-1">
                          <CloseIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {episodes.map((epObj, idx) => {
                          const epNum = epObj.episodeNumber || (idx + 1);
                          const isCurrent = epNum === episode;
                          return (
                            <button
                              key={epObj.id || idx}
                              onClick={() => {
                                if (onEpisodeSelect) onEpisodeSelect(epNum, { ...epObj, episodeNumber: epNum });
                                setActiveModal('none');
                              }}
                              className={`w-full p-2.5 rounded-xl border text-right transition-all flex gap-3 items-center ${isCurrent ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}
                            >
                              {epObj.thumbnail ? (
                                <img src={epObj.thumbnail} alt="" className="w-16 h-10 object-cover rounded-lg shrink-0 border border-white/10" />
                              ) : (
                                <div className="w-12 h-10 bg-white/10 rounded-lg flex items-center justify-center text-xs font-black shrink-0">
                                  {epNum}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black truncate">{epObj.title || `الحلقة ${epNum}`}</span>
                                  {isCurrent && <span className="text-[9px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded">حالياً</span>}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-0.5">{epObj.duration || '45د'}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* BOTTOM CONTROLS BAR */}
                  <div className="px-4 pb-3 pt-2 md:px-6 md:pb-4 pointer-events-auto flex flex-col gap-2" onClick={e => e.stopPropagation()} dir="ltr">
                    {/* Progress Bar (Teal/Cyan GreenPlayed Line) */}
                    <div className="relative w-full h-1 md:h-[5px] flex items-center group/progress cursor-pointer">
                      <div className="absolute w-full h-full bg-white/20 rounded-full"></div>
                      <div
                        className="absolute h-full bg-[#00E699] rounded-full flex items-center justify-end"
                        style={{
                          width: `${(currentTime / (duration || 1)) * 100}%`
                        }}
                      >
                        <div className="w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity translate-x-1/2"></div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                      />
                    </div>

                    {/* Controls Row (Left to Right) */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Left Side Controls: Play, Skip-10, Skip+10, Volume */}
                      <div className="flex items-center gap-4 md:gap-5">
                        {/* Play/Pause */}
                        <button
                          onClick={togglePlay}
                          className="text-white hover:opacity-80 transition-transform active:scale-95 shrink-0"
                          title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
                        >
                          {isPlaying ? <PauseIcon className="w-6 h-6 md:w-7 md:h-7" /> : <PlayIcon className="w-6 h-6 md:w-7 md:h-7" />}
                        </button>

                        {/* Skip 10s Backward */}
                        <button
                          onClick={() => skip(-10)}
                          className="text-white hover:opacity-80 transition-colors shrink-0"
                          title="تراجع 10 ثواني"
                        >
                          <Rewind10Icon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>

                        {/* Skip 10s Forward */}
                        <button
                          onClick={() => skip(10)}
                          className="text-white hover:opacity-80 transition-colors shrink-0"
                          title="تقديم 10 ثواني"
                        >
                          <Forward10Icon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>

                        {/* Volume Control */}
                        <div
                          className="flex items-center gap-2 group/volume relative"
                          onMouseEnter={() => setIsVolumeHovered(true)}
                          onMouseLeave={() => setIsVolumeHovered(false)}
                        >
                          <button
                            onClick={() => toggleMute()}
                            className="text-white hover:opacity-80 transition-colors"
                            title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                          >
                            {isMuted || volume === 0 ? <VolumeMuteIcon className="w-6 h-6 md:w-7 md:h-7" /> : <VolumeHighIcon className="w-6 h-6 md:w-7 md:h-7" />}
                          </button>
                          <div className={`flex items-center relative transition-all duration-300 overflow-visible ${isVolumeHovered ? 'w-20 opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}`}>
                            <div className="absolute w-full h-1 bg-white/20 rounded-full"></div>
                            <div
                              className="absolute h-1 bg-[#00E699] rounded-full flex items-center justify-end"
                              style={{ width: `${volume * 100}%` }}
                            >
                              <div className="w-2.5 h-2.5 bg-white rounded-full shadow-lg translate-x-1/2"></div>
                            </div>
                            <input
                              type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => updateVolume(parseFloat(e.target.value))}
                              className="relative w-full h-4 opacity-0 cursor-pointer z-20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Side Controls: Time, Next Episode, Subtitles, Settings, Fullscreen */}
                      <div className="flex items-center gap-3 md:gap-5">
                        {/* Time Counter */}
                        <span className="text-xs md:text-sm font-mono font-bold text-white/90 dir-ltr tracking-wider select-none">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>

                        {/* Next Episode Button */}
                        {nextEpisodeObj && (
                          <button
                            onClick={handlePlayNextEpisode}
                            className="text-white hover:opacity-80 transition-opacity shrink-0"
                            title="الحلقة التالية"
                          >
                            <SkipNextIcon className="w-6 h-6 md:w-7 md:h-7" />
                          </button>
                        )}

                        {/* Subtitles Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveModal(activeModal === 'subtitles' ? 'none' : 'subtitles'); }}
                          className={`hover:opacity-80 transition-opacity shrink-0 ${activeModal === 'subtitles' ? 'text-[#00E699]' : 'text-white'}`}
                          title="الترجمة"
                        >
                          <SubtitleIcon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>

                        {/* Quality & Settings Button (Gear Icon) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveModal(activeModal === 'servers' || activeModal === 'quality' ? 'none' : 'quality'); }}
                          className={`hover:opacity-80 transition-opacity shrink-0 flex items-center gap-1.5 ${activeModal === 'servers' || activeModal === 'quality' ? 'text-[#00E699]' : 'text-white'}`}
                          title="جودة المشاهدة"
                        >
                          <SettingsIcon className="w-6 h-6 md:w-7 md:h-7" />
                          {selectedServer?.name && (
                            <span className="hidden md:inline-block text-[10px] font-black max-w-[100px] truncate bg-[#00E699]/10 text-[#00E699] px-2 py-0.5 rounded-full border border-[#00E699]/30">
                              {selectedServer.name}
                            </span>
                          )}
                        </button>

                        {/* Fullscreen Button */}
                        <button
                          onClick={toggleFullscreen}
                          className="text-white hover:opacity-80 transition-transform active:scale-95 shrink-0"
                          title="ملء الشاشة"
                        >
                          <FullscreenIcon className="w-6 h-6 md:w-7 md:h-7" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                key={activeSource}
                src={activeSource}
                allowFullScreen
                loading="eager"
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="w-full h-full border-none rounded-2xl"
                title="Cinematix Player"
                onLoad={() => setIsServerLoading(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Embedded Quality Selector Switcher Bar */}
      {effectiveServers.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center bg-[#0d1015] p-3 md:p-4 rounded-2xl border border-white/10" dir="rtl">
          <span className="text-[10px] md:text-xs text-gray-400 self-center ml-2 font-black uppercase tracking-widest font-['Cairo']">جودة المشاهدة:</span>
          {effectiveServers.map((srv, idx) => {
            const isSelected = selectedServer?.id === srv.id || (selectedServer?.url === srv.url);
            const displayName = srv.name && srv.name.trim() !== '' ? srv.name : `جودة ${idx + 1}`;
            return (
              <button
                key={srv.id || idx}
                onClick={() => {
                  setSelectedServer(srv);
                  if (srv.id && typeof srv.id === 'string' && srv.id.startsWith('server')) {
                    setActiveServerType(srv.id);
                  }
                  if (onServerSelect) onServerSelect(srv);
                }}
                className={`px-3.5 py-1.5 md:px-5 md:py-2 text-[10px] md:text-xs rounded-xl transition-all font-black font-['Cairo'] ${isSelected ? 'bg-emerald-500 text-black shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {displayName}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        input[type=range]::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #00E699;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #FFFFFF;
            box-shadow: 0 0 8px rgba(0, 230, 153, 0.8);
        }
        @media (max-width: 768px) {
            input[type=range]::-webkit-slider-thumb {
                width: 10px;
                height: 10px;
            }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
