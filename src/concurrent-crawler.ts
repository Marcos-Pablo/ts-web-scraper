import { LimitFunction } from 'p-limit';
import pLimit from 'p-limit';
import { getURLsFromHTML, normalizeURL } from './crawl';

export class ConcurrentCrawler {
  private baseURL: URL;
  private pages = new Map<string, number>();
  private limit: LimitFunction;
  private maxPages: number;
  private shouldStop = false;
  private allTasks = new Set<Promise<void>>();
  private abortController = new AbortController();

  constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
    this.baseURL = new URL(baseURL);
    this.limit = pLimit(maxConcurrency);
    this.maxPages = Math.max(1, maxPages);
  }

  public async crawl() {
    const rootTask = this.crawlPage(this.baseURL.toString());
    this.allTasks.add(rootTask);

    try {
      await rootTask;
    } finally {
      this.allTasks.delete(rootTask);
    }
    await Promise.allSettled(Array.from(this.allTasks));
    return this.pages;
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) return;

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

    if (this.shouldStop) return;

    const nextURLs = getURLsFromHTML(html, this.baseURL.toString());

    let crawlPromises: Promise<void>[] = [];

    for (const nextURL of nextURLs) {
      if (this.shouldStop) break;

      const crawlPromise = this.crawlPage(nextURL);
      crawlPromise.finally(() => this.allTasks.delete(crawlPromise));

      this.allTasks.add(crawlPromise);
      crawlPromises.push(crawlPromise);
    }

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
          signal: this.abortController.signal,
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
    if (this.shouldStop) return true;

    if (this.pages.size >= this.maxPages) {
      this.shouldStop = true;
      console.log('Reached maximum number of pages to crawl.');
      this.abortController.abort();

      return true;
    }

    let count = this.pages.get(normalizedURL);

    if (!count) {
      this.pages.set(normalizedURL, 1);
      return false;
    }

    this.pages.set(normalizedURL, count + 1);

    return true;
  }
}
