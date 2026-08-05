const ytdl = require('@distube/ytdl-core');

// Extract 11-char YouTube Video ID
function extractVideoId(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

// Expanded Invidious instances
const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://invidious.drgns.space',
  'https://vid.puffyan.us',
  'https://yewtu.be',
  'https://invidious.privacydev.net',
  'https://invidious.flokinet.to',
  'https://invidious.projectsegfau.lt',
  'https://iv.melmac.space'
];

// Expanded Piped instances
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.mha.fi',
  'https://pipedapi.col2.righttoprivate.com',
  'https://pipedapi.lunar.icu',
  'https://pipedapi.projectsegfau.lt'
];

async function extractFromInvidious(videoId) {
  for (const domain of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${domain}/api/v1/videos/${videoId}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.formatStreams) && data.formatStreams.length > 0) {
          const mp4Streams = data.formatStreams.filter(f => f.container === 'mp4' || (f.type && f.type.includes('mp4')));
          const bestStream = (mp4Streams.length > 0 ? mp4Streams : data.formatStreams)[0];
          if (bestStream && bestStream.url) {
            return {
              rawUrl: bestStream.url,
              quality: bestStream.qualityLabel || bestStream.resolution || '720p',
              title: data.title,
              duration: data.lengthSeconds
            };
          }
        }
      }
    } catch (e) {
      // Try next instance
    }
  }
  return null;
}

async function extractFromPiped(videoId) {
  for (const domain of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${domain}/streams/${videoId}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videoStreams) && data.videoStreams.length > 0) {
          const mp4WithAudio = data.videoStreams.filter(s => s.mimeType && s.mimeType.includes('mp4') && s.videoOnly === false);
          const mp4Streams = data.videoStreams.filter(s => s.mimeType && s.mimeType.includes('mp4'));
          const candidates = mp4WithAudio.length > 0 ? mp4WithAudio : (mp4Streams.length > 0 ? mp4Streams : data.videoStreams);
          const best = candidates[0];
          if (best && best.url) {
            return {
              rawUrl: best.url,
              quality: best.quality || '720p',
              title: data.title,
              duration: data.duration
            };
          }
        }
      }
    } catch (e) {
      // Try next instance
    }
  }
  return null;
}

async function extractFromCobalt(ytUrl) {
  const cobaltInstances = [
    'https://api.cobalt.tools',
    'https://co.wuk.sh'
  ];
  for (const domain of cobaltInstances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${domain}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: ytUrl,
          videoQuality: '720'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return {
            rawUrl: data.url,
            quality: '720p'
          };
        }
      }
    } catch (e) {
      // Try next instance
    }
  }
  return null;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const inputUrl = req.body?.url || req.body?.youtubeId || req.body?.videoId || req.query?.url || req.query?.videoId || req.query?.youtubeId;

  if (!inputUrl) {
    return res.status(400).json({
      success: false,
      error: 'يرجى تقديم رابط الفيديو أو معرف يوتيوب.'
    });
  }

  // If already a direct video file URL (.mp4, .m3u8, etc.)
  if (typeof inputUrl === 'string' && (inputUrl.includes('.mp4') || inputUrl.includes('.m3u8') || inputUrl.includes('.webm')) && !inputUrl.includes('youtube.com') && !inputUrl.includes('youtu.be')) {
    return res.status(200).json({
      success: true,
      rawUrl: inputUrl,
      quality: 'Direct Stream',
      mimeType: 'video/mp4'
    });
  }

  const videoId = extractVideoId(inputUrl);

  if (!videoId) {
    return res.status(400).json({
      success: false,
      error: 'لم يتم العثور على معرف يوتيوب صالحة من الرابط المدخل.'
    });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Method 1: ytdl-core (with iOS / Android client attempt)
  try {
    const info = await ytdl.getInfo(videoId, {
      requestOptions: {
        headers: {
          'User-Agent': 'com.google.android.youtube/18.11.34 (Linux; U; Android 11; en_US) gzip'
        }
      }
    });

    const progressiveFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const mp4Progressive = progressiveFormats.filter(f => f.container === 'mp4' || (f.mimeType && f.mimeType.includes('mp4')));

    let selectedFormat = mp4Progressive[0] || progressiveFormats[0];

    if (!selectedFormat) {
      const videoFormats = ytdl.filterFormats(info.formats, 'videoonly');
      const mp4Video = videoFormats.filter(f => f.container === 'mp4' || (f.mimeType && f.mimeType.includes('mp4')));
      selectedFormat = mp4Video[0] || videoFormats[0];
    }

    if (selectedFormat && selectedFormat.url) {
      const lengthSeconds = parseInt(info.videoDetails?.lengthSeconds || '0', 10);
      let formattedDuration = '';
      if (lengthSeconds > 0) {
        const mins = Math.floor(lengthSeconds / 60);
        const secs = lengthSeconds % 60;
        formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      return res.status(200).json({
        success: true,
        videoId,
        rawUrl: selectedFormat.url,
        quality: selectedFormat.qualityLabel || (selectedFormat.height ? `${selectedFormat.height}p` : '720p'),
        mimeType: selectedFormat.mimeType || 'video/mp4',
        title: info.videoDetails?.title || '',
        duration: formattedDuration,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        source: 'ytdl-core'
      });
    }
  } catch (ytdlErr) {
    // Silently proceed to fallbacks if YouTube blocks direct bot request
  }

  // Method 2: Fallback to Invidious API
  const invidiousResult = await extractFromInvidious(videoId);
  if (invidiousResult) {
    let formattedDuration = '';
    if (invidiousResult.duration) {
      const mins = Math.floor(invidiousResult.duration / 60);
      const secs = invidiousResult.duration % 60;
      formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return res.status(200).json({
      success: true,
      videoId,
      rawUrl: invidiousResult.rawUrl,
      quality: invidiousResult.quality,
      mimeType: 'video/mp4',
      title: invidiousResult.title || '',
      duration: formattedDuration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      source: 'invidious'
    });
  }

  // Method 3: Fallback to Piped API
  const pipedResult = await extractFromPiped(videoId);
  if (pipedResult) {
    let formattedDuration = '';
    if (pipedResult.duration) {
      const mins = Math.floor(pipedResult.duration / 60);
      const secs = pipedResult.duration % 60;
      formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return res.status(200).json({
      success: true,
      videoId,
      rawUrl: pipedResult.rawUrl,
      quality: pipedResult.quality,
      mimeType: 'video/mp4',
      title: pipedResult.title || '',
      duration: formattedDuration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      source: 'piped'
    });
  }

  // Method 4: Fallback to Cobalt API
  const cobaltResult = await extractFromCobalt(ytUrl);
  if (cobaltResult) {
    return res.status(200).json({
      success: true,
      videoId,
      rawUrl: cobaltResult.rawUrl,
      quality: cobaltResult.quality,
      mimeType: 'video/mp4',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      source: 'cobalt'
    });
  }

  // Method 5: Final Graceful Fallback - Return video embed URL
  return res.status(200).json({
    success: true,
    videoId,
    rawUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
    quality: 'Embed Fallback',
    mimeType: 'text/html',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    source: 'youtube-embed',
    isEmbed: true,
    note: 'تم إرجاع رابط المشغل المباشر كخيار احتياطي لضمان تشغيل الفيديو دون انقطاع.'
  });
};
