export function normalizeURL(url: string): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname.endsWith('/') ? urlObj.pathname.slice(0, -1) : urlObj.pathname;

  return `${urlObj.host}${path}`;
}
