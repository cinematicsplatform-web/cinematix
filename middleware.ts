import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for handling SEO Prerendering.
 * This checks if the request is coming from a search engine bot or social media crawler.
 * If so, it routes the request through Prerender.io to serve a fully rendered HTML page.
 */
export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const url = new URL(request.url);

  // List of common bot user agents
  const bots = [
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'slurp',
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'embedly',
    'baiduspider',
    'pinterest',
    'slackbot',
    'vkShare',
    'W3C_Validator',
    'whatsapp',
    'telegrambot',
    'discordbot'
  ];

  const isBot = bots.some(bot => userAgent.includes(bot));
  const isStaticFile = /\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|svg|eot)$/i.test(url.pathname);

  // If it's a bot and not a static file, proxy to Prerender.io
  if (isBot && !isStaticFile) {
    const prerenderUrl = `https://service.prerender.io/${url.href}`;
    
    return fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': process.env.PRERENDER_TOKEN || '',
      },
    });
  }

  return NextResponse.next();
}

// Ensure middleware doesn't run on internal API or static assets to optimize performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files - if applicable)
     * - _next/image (image optimization files - if applicable)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};