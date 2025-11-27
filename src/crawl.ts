import { ConcurrentCrawler } from './concurrent-crawler';
import { JSDOM } from 'jsdom';

type ExtractedPageData = {
  url: string;
  h1: string;
  first_paragraph: string;
  outgoing_links: string[];
  image_urls: string[];
};

export async function crawlSiteAsync(baseURL: string, maxConcurrency: number, maxPages: number) {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency, maxPages);
  return await crawler.crawl();
}

export function extractPageData(html: string, pageURL: string): ExtractedPageData {
  return {
    url: pageURL,
    h1: getH1FromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };
}

export function normalizeURL(url: string): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname.endsWith('/') ? urlObj.pathname.slice(0, -1) : urlObj.pathname;

  return `${urlObj.host}${path}`;
}

export function getH1FromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const h1 = doc.querySelector('h1')?.textContent;
  return h1 ?? '';
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const main = doc.querySelector('main');

  const p = main?.querySelector('p')?.textContent ?? doc.querySelector('p')?.textContent;
  return p ?? '';
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const anchorTags = doc.querySelectorAll('a');

  const anchorURLS = anchorTags
    .values()
    .toArray()
    .flatMap((a) => {
      const href = a.getAttribute('href');
      return typeof href === 'string' ? [new URL(href, baseURL).toString()] : [];
    });

  return anchorURLS;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const imgTags = doc.querySelectorAll('img');

  const imgURLS = imgTags
    .values()
    .toArray()
    .flatMap((img) => {
      const src = img.getAttribute('src');
      return typeof src === 'string' ? [new URL(src, baseURL).toString()] : [];
    });

  return imgURLS;
}
