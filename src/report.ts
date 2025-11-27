import * as fs from 'node:fs';
import * as path from 'node:path';
import { ExtractedPageData } from './crawl';

export function writeCSVReport(pageData: Record<string, ExtractedPageData>, filename = 'report.csv'): void {
  if (!pageData || Object.keys(pageData).length === 0) {
    console.log('No data to write to CSV');
    return;
  }

  const headers = ['page_url', 'h1', 'first_paragraph', 'outgoing_link_urls', 'image_urls'];
  const rows: string[] = [headers.join(';')];

  for (const page of Object.values(pageData)) {
    const row = [
      csvEscape(page.url),
      csvEscape(page.h1),
      csvEscape(page.first_paragraph),
      csvEscape(page.outgoing_links.join('\n')),
      csvEscape(page.image_urls.join('\n')),
    ].join(';');
    rows.push(row);
  }

  const filePath = path.join('./reports/', filename);
  fs.writeFileSync(filePath, rows.join('\n'), { encoding: 'utf8' });
  console.log(`Report written to ${filePath}`);
}

function csvEscape(field: string) {
  const str = field ?? '';
  const needsQuoting = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}
