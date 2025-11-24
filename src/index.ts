import { argv } from 'node:process';
import { getHTML } from './crawl';

async function main() {
  if (argv.length !== 3) {
    console.error('Invalid arguments. Usage: npm run start <base_url>');
    process.exit(1);
  }

  const baseURL = argv[2];

  console.log(`Crawling starting on ${baseURL}`);
  const HTML = await getHTML(baseURL);
  if (HTML) {
    console.log(HTML);
  }
  process.exit(0);
}

main();
