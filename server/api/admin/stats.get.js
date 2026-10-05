import { createError } from 'h3';
import { requireOwner } from '../../utils/ownerSession.js';
import { readProfile } from '../../utils/blobProfile.js';
import { analyticsClient, readStats } from '../../utils/analytics.js';

export default defineEventHandler(async (event) => {
  requireOwner(event);
  const redis = analyticsClient();
  if (!redis) return { configured: false };
  const { profile } = await readProfile();
  const started = Date.now();
  try {
    return { configured: true, ...(await readStats(redis, profile, new Date())) };
  } catch (error) {
    console.error(JSON.stringify({ operation: 'stats-read', outcome: 'failed', error: error?.name, elapsedMs: Date.now() - started }));
    throw createError({ statusCode: 503, statusMessage: 'Stats are unavailable right now' });
  }
});
