import { JSDOM } from 'jsdom';

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
