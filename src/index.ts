import { argv } from 'node:process';
import { crawlSiteAsync } from './crawl';

async function main() {
  if (argv.length !== 5) {
    console.error('Invalid arguments. Usage: npm run start <base_url> <maxConcurrency> <maxPages>');
    process.exit(1);
  }

  const baseURL = argv[2];
  const maxConcurrency = parseInt(argv[3]);
  const maxPages = parseInt(argv[4]);

  if (!Number.isFinite(maxConcurrency) || !Number.isFinite(maxPages)) {
    console.error('Invalid maxConcurrency or maxPages. Usage: npm run start <base_url> <maxConcurrency> <maxPages>');
    process.exit(1);
  }

  console.log(`starting crawl of: ${baseURL} (concurrency=${maxConcurrency}, maxPages=${maxPages})...`);
  const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages);

  console.log('Result => ', pages);
  process.exit(0);
}

main();
