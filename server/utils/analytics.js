import { createHash } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { safeHttpsUrl } from '../../utils/safeLinks.js';
import { profileSocialLinks, profileVisibleLinks } from '../../utils/profileLinks.js';

// stats:views  hash  day -> visits
// stats:clicks hash  "<linkId>:<day>" -> clicks
// stats:links  set   linkIds currently on the saved profile (clicks for others are ignored)
const keys = { views: 'stats:views', clicks: 'stats:clicks', links: 'stats:links' };
const countClick = `if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 1 then return redis.call('HINCRBY', KEYS[2], ARGV[2], 1) end return 0`;
const dayMs = 24 * 60 * 60 * 1000;

export function analyticsClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, enableTelemetry: false, retry: { retries: 1 }, signal: () => AbortSignal.timeout(3000) });
}

export const linkId = (href) => createHash('sha256').update(href).digest('hex').slice(0, 16);
export const utcDay = (date) => date.toISOString().slice(0, 10);

// Every destination a visitor can click, in page order.
export function trackableLinks(profile) {
  if (!profile) return [];
  return [
    ...profileVisibleLinks(profile).filter((link) => link.l).map((link) => ({ kind: 'link', label: link.l, section: typeof link.g === 'string' ? link.g.trim() : '', href: safeHttpsUrl(link.u) })),
    ...profileSocialLinks(profile).map((social) => ({ kind: 'social', label: social.label, section: '', href: social.href })),
  ].map((link) => ({ ...link, id: linkId(link.href) }));
}

export async function recordView(redis, now) {
  await redis.hincrby(keys.views, utcDay(now), 1);
}
export async function recordClick(redis, href, now) {
  const id = linkId(href);
  return await redis.eval(countClick, [keys.links, keys.clicks], [id, `${id}:${utcDay(now)}`]);
}

// Replace the set of countable links with those on the saved profile.
function queueLinkSync(transaction, links) {
  transaction.del(keys.links);
  const ids = [...new Set(links.map((link) => link.id))].sort();
  if (ids.length) transaction.sadd(keys.links, ids[0], ...ids.slice(1));
}
export async function syncTrackedLinks(redis, profile) {
  const transaction = redis.multi();
  queueLinkSync(transaction, trackableLinks(profile));
  await transaction.exec();
}
export async function readStats(redis, profile, now) {
  const links = trackableLinks(profile);
  const transaction = redis.multi();
  queueLinkSync(transaction, links);
  transaction.hgetall(keys.views);
  transaction.hgetall(keys.clicks);
  const results = await transaction.exec();
  return summarizeStats(results.at(-2) || {}, results.at(-1) || {}, links, now);
}

// Pure: totals for the last 7 and 30 UTC days (including today) and all time.
export function summarizeStats(viewsByDay, clicksByIdDay, links, now) {
  const since = (days) => utcDay(new Date(now.getTime() - (days - 1) * dayMs));
  const from7 = since(7);
  const from30 = since(30);
  const totals = (entries) => {
    const result = { last7: 0, last30: 0, all: 0 };
    for (const [day, value] of entries) {
      const count = Number(value) || 0;
      result.all += count;
      if (day >= from30) result.last30 += count;
      if (day >= from7) result.last7 += count;
    }
    return result;
  };
  const clicksById = new Map();
  for (const [field, value] of Object.entries(clicksByIdDay)) {
    const [id, day] = field.split(':');
    if (!clicksById.has(id)) clicksById.set(id, []);
    clicksById.get(id).push([day, value]);
  }
  // Links with the same address share one count.
  const shared = new Set(links.filter((link, index) => links.findIndex((other) => other.id === link.id) !== index).map((link) => link.id));
  return {
    views: totals(Object.entries(viewsByDay)),
    links: links.map(({ kind, label, section, href, id }) => ({
      kind, label, section, href, sharedAddress: shared.has(id), clicks: totals(clicksById.get(id) || []),
    })),
  };
}

const botPattern = /bot|crawl|spider|slurp|preview|fetch|facebookexternalhit|embed|headless|lighthouse|monitor|python|curl|wget|http-?client|axios|node/i;
export const looksAutomated = (userAgent) => !userAgent || botPattern.test(userAgent);
