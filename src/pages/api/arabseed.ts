import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: 'Missing query' });

  try {
    // 1. Fake a real browser request using Headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    };

    // 2. Search URL
    const searchUrl = `https://m.arabseed.show/find/?find=${encodeURIComponent(query as string)}`;
    console.log('Fetching:', searchUrl);
    const response = await axios.get(searchUrl, { headers });

    // 3. Parse HTML
    const $ = cheerio.load(response.data);

    // 4. Extract first movie link (Looking for .MovieBlock a)
    // Note: If ArabSeed changes class names, this part returns null.
    const firstLink = $('.MovieBlock a').attr('href');

    if (!firstLink) {
      return res.status(404).json({ status: 'Not Found', message: 'Could not find movie link via selector' });
    }
    res.status(200).json({ status: 'Success', url: firstLink });
  } catch (error: any) {
    console.error('Scraping Error:', error.message);
    res.status(500).json({ status: 'Error', error: error.message });
  }
}