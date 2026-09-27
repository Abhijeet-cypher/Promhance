#!/usr/bin/env node
/**
 * IndexNow submission for Promhance.
 *
 * Notifies Bing, Yandex, DuckDuckGo, and other IndexNow participants that URLs
 * have changed so they can be recrawled quickly.
 *
 * Usage:
 *   npm run indexnow                      # submit every URL in the sitemap
 *   npm run indexnow -- /blog/new-post    # submit specific paths/URLs
 */

const HOST = "www.promhance.com";
const BASE_URL = `https://${HOST}`;
const KEY = "4ec819a7ef58c72476f4947dc3a953f6";
const KEY_LOCATION = `${BASE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

function toAbsolute(value) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

async function urlsFromSitemap() {
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const urlList = args.length ? args.map(toAbsolute) : await urlsFromSitemap();
  const uniqueUrls = [...new Set(urlList)];

  if (uniqueUrls.length === 0) {
    console.error("No URLs to submit.");
    process.exit(1);
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: uniqueUrls }),
  });

  console.log(`Submitted ${uniqueUrls.length} URL(s) to IndexNow — HTTP ${res.status}`);
  uniqueUrls.forEach((u) => console.log(`  • ${u}`));

  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
