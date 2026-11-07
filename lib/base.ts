/**
 * Sub-folder the site is served from. Empty on Netlify, localhost and a custom domain
 * (learn4success.com); "/Learn4Success" on https://<user>.github.io/Learn4Success/.
 * Set at build time by the GitHub Pages workflow (NEXT_PUBLIC_BASE_PATH).
 *
 * Next.js adds it automatically to <Link>, router.push and /_next assets; use withBase()
 * for plain strings such as <img src>, <a href>, fetch() and location.replace().
 */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
