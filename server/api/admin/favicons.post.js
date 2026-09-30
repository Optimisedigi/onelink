import { createError } from 'h3';
import { requireOwner } from '../../utils/ownerSession.js';
import { checkMutation } from '../../utils/checkMutation.js';
import { readBoundedJson } from '../../utils/readBoundedJson.js';
import { addDiscoveredFavicons } from '../../utils/discoverFavicon.js';
import { safeHttpsUrl } from '../../../utils/safeLinks.js';

// Owner-only preview lookup: returns each page's declared icon without saving.
export default defineEventHandler(async (event) => {
  checkMutation(event);
  requireOwner(event);
  const body = await readBoundedJson(event, 32768);
  const urls = body?.urls;
  if (!Array.isArray(urls) || urls.length > 100 || urls.some((url) => typeof url !== 'string' || url.length > 2048 || !safeHttpsUrl(url))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid link addresses' });
  }
  const { ls } = await addDiscoveredFavicons({ ls: urls.map((u) => ({ u })) });
  return { icons: ls.map((link) => (link.fi && link.fi.length <= 2048 ? link.fi : '')) };
});
