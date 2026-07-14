/**
 * A robust, fault-tolerant fetch function for TMDB API.
 * If the primary request fails or returns HTML (e.g. due to ISP blocking/redirection in countries like Egypt),
 * it will automatically try alternative proxy/mirror domains to ensure the request succeeds with valid JSON.
 */
export async function fetchTMDB(url: string, options?: RequestInit): Promise<Response> {
  const tryFetch = async (targetUrl: string): Promise<Response> => {
    const response = await fetch(targetUrl, options);
    
    // Check if the response status is not successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Check if the response is HTML (indicates ISP blockpage or Cloudflare interception)
    const clone = response.clone();
    const text = await clone.text();
    const trimmed = text.trim();
    if (trimmed.startsWith('<html') || trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<!doctype html') || trimmed.includes('<body') || trimmed.includes('<div id="cf-')) {
      throw new Error("HTML response received instead of valid JSON. This is usually caused by an ISP blocking page or firewalls.");
    }
    
    return response;
  };

  try {
    return await tryFetch(url);
  } catch (err) {
    console.warn(`Primary TMDB fetch failed for URL: ${url}. Error:`, err);

    // List of reliable alternative domains
    const alternativeBases = [
      'https://api.tmdb.org',
      'https://tmdb-api.reorx.workers.dev',
      'https://cf-tmdb.v98765.workers.dev'
    ];

    try {
      const parsedUrl = new URL(url);
      const originalHost = parsedUrl.origin; // e.g., "https://api.themoviedb.org" or "https://api.tmdb.org"
      const pathAndQuery = parsedUrl.pathname + parsedUrl.search;

      for (const altBase of alternativeBases) {
        if (altBase === originalHost) continue; // Skip if it matches the failed original host

        const altUrl = `${altBase}${pathAndQuery}`;
        try {
          console.log(`Trying alternative TMDB mirror: ${altUrl}`);
          return await tryFetch(altUrl);
        } catch (altErr) {
          console.warn(`TMDB mirror failed: ${altBase}. Error:`, altErr);
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse URL for TMDB proxying:", parseErr);
    }

    // If all alternatives fail, throw the original error
    throw err;
  }
}
