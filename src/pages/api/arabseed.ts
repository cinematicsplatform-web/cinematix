import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Please provide a movie name (query)' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true, // Run in background
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // IMPORTANT: Set a real User Agent to look like a human
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // 1. Go to Search Page
    // Note: If this domain is blocked, we will need to update it later.
    const searchUrl = `https://m.arabseed.show/find/?find=${encodeURIComponent(query as string)}`;
    console.log('Searching at:', searchUrl);

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // 2. Wait for result (Targeting the class '.MovieBlock')
    // If ArabSeed changes the class name, this part will need update.
    const movieSelector = '.MovieBlock';
    
    await page.waitForSelector(movieSelector, { timeout: 5000 });

    // 3. Get the link of the first item
    const pageLink = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.getAttribute('href') : null;
    }, movieSelector);

    if (!pageLink) throw new Error('No results found');

    res.status(200).json({ status: 'Found', pageUrl: pageLink });

  } catch (error: any) {
    console.error('Scraping Error:', error.message);
    res.status(500).json({ status: 'Error', error: error.message });
  } finally {
    if (browser) await browser.close();
  }
}