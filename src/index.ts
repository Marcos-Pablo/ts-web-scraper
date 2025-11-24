import { argv } from 'node:process';
import { crawlPage } from './crawl';

async function main() {
  if (argv.length !== 3) {
    console.error('Invalid arguments. Usage: npm run start <base_url>');
    process.exit(1);
  }

  const baseURL = argv[2];

  console.log(`Crawling starting on ${baseURL}`);
  const pages = await crawlPage(baseURL);

  console.log(pages);
  process.exit(0);
}

main();
