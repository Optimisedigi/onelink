import { getHeader, getRequestURL, setResponseStatus } from 'h3';
import { readBoundedJson } from '../utils/readBoundedJson.js';
import { isOwner } from '../utils/ownerSession.js';
import { analyticsClient, looksAutomated, recordClick, recordView } from '../utils/analytics.js';
import { safeEmailHref, safeHttpsUrl } from '../../utils/safeLinks.js';

// Counts a profile visit or link click. Stores only a day and a link ID: no IP,
// cookie or browser details. Always answers 204 so visitors are never affected.
export default defineEventHandler(async (event) => {
  setResponseStatus(event, 204);
  // Browsers may omit Origin on beacons; reject only clear cross-site requests.
  const origin = getHeader(event, 'origin');
  const site = getHeader(event, 'sec-fetch-site');
  if ((origin && origin !== getRequestURL(event).origin) || (site && site !== 'same-origin')) return null;
  let body;
  try { body = await readBoundedJson(event, 4096); } catch { return null; }
  const type = body?.type;
  const href = typeof body?.href === 'string' ? body.href : '';
  if (type !== 'view' && !(type === 'click' && href.length <= 2048 && (safeHttpsUrl(href) === href || safeEmailHref(href.replace(/^mailto:/, '')) === href))) return null;
  if (looksAutomated(getHeader(event, 'user-agent')) || isOwner(event)) return null;
  const redis = analyticsClient();
  if (!redis) return null;
  const started = Date.now();
  try {
    if (type === 'view') await recordView(redis, new Date());
    else await recordClick(redis, href, new Date());
  } catch (error) {
    console.error(JSON.stringify({ operation: 'track', type, outcome: 'failed', error: error?.name, elapsedMs: Date.now() - started }));
  }
  return null;
});
