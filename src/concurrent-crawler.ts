import { LimitFunction } from 'p-limit';
import pLimit from 'p-limit';
import { getURLsFromHTML, normalizeURL } from './crawl';

export class ConcurrentCrawler {
  private baseURL: URL;
  private pages: Record<string, number>;
  private limit: LimitFunction;

  constructor(baseURL: string, maxConcurrency = 5) {
    this.baseURL = new URL(baseURL);
    this.pages = {};
    this.limit = pLimit(maxConcurrency);
  }

  public async crawl() {
    await this.crawlPage(this.baseURL.toString());
    return this.pages;
  }

  private async crawlPage(currentURL: string): Promise<void> {
    const current = new URL(currentURL);

    if (this.baseURL.hostname !== current.hostname) {
      return;
    }

    const normalizedURL = normalizeURL(currentURL);

    const visited = this.addPageVisit(normalizedURL);
    if (visited) {
      return;
    }

    console.log(`Crawling ${currentURL}`);
    let html: string | undefined;

    try {
      html = await this.getHTML(currentURL);
    } catch (err) {
      console.log(`${err instanceof Error ? err.message : 'Unknown error'}`);
      return;
    }

    if (!html) {
      console.log('Got empty HTML');
      return;
    }

    const nextURLs = getURLsFromHTML(html, this.baseURL.toString());

    const crawlPromises = nextURLs.map((nextURL) => this.crawlPage(nextURL));
    await Promise.all(crawlPromises);
  }

  private async getHTML(currentURL: string): Promise<string> {
    return await this.limit(async () => {
      let res;

      try {
        res = await fetch(currentURL, {
          headers: {
            'User-Agent': 'BootCrawler/1.0',
          },
        });
      } catch (err) {
        throw new Error(
          `Error while trying to fetch HTML from ${currentURL} - ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }

      if (res.status >= 400) {
        throw new Error(`Got HTTP error: ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type');

      if (!contentType || !contentType.includes('text/html')) {
        throw new Error(`Got non-HTML response: ${contentType}`);
      }
      return res.text();
    });
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (!this.pages[normalizedURL]) {
      this.pages[normalizedURL] = 0;
    }

    this.pages[normalizedURL]++;

    return this.pages[normalizedURL] > 1;
  }
}
