import { copy, get, head, put, BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob';
import { randomBytes } from 'node:crypto';
import { createError } from 'h3';

const pathname = 'linkfriend/official-profile.json';
export function blobOptions() {
  if (!(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw createError({ statusCode: 503, statusMessage: 'Profile storage is not configured' });
  }
  const access = process.env.BLOB_ACCESS || 'public';
  if (access !== 'private' && access !== 'public') throw createError({ statusCode: 503, statusMessage: 'Invalid Blob access setting' });
  return { access, abortSignal: AbortSignal.timeout(10000) };
}
export async function readProfile() {
  const opts = blobOptions();
  try {
    // Public get() cannot bypass the CDN. The metadata API supplies the current
    // ETag so a versioned URL does not reuse a previously cached public response.
    let metadata;
    if (opts.access === 'public') {
      try { metadata = await head(pathname, opts); }
      catch (error) {
        if (error instanceof BlobNotFoundError) return { profile: null, version: null };
        throw error;
      }
      if (metadata.size > 65536) throw new Error('Unexpected profile size');
    }
    const target = metadata ? `${metadata.url}?v=${encodeURIComponent(metadata.etag)}` : pathname;
    const result = await get(target, { ...opts, useCache: false });
    if (!result && !metadata) return { profile: null, version: null };
    if (!result || result.statusCode !== 200 || result.blob.size > 65536 || (metadata && result.blob.etag !== metadata.etag)) {
      throw new Error('Current profile version is not available yet');
    }
    const profile = JSON.parse(await new Response(result.stream).text());
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new Error('Invalid stored profile');
    return { profile, version: metadata?.etag || result.blob.etag };
  } catch (error) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 503, statusMessage: 'Profile storage unavailable' });
  }
}
export async function saveProfile(profile, expectedVersion) {
  const opts = blobOptions();
  const current = await readProfile();
  if (current.version !== expectedVersion) throw createError({ statusCode: 409, statusMessage: 'Profile changed in another tab. Export your draft before reloading.' });
  try {
    if (current.version) {
      const backup = `linkfriend/profile-history/${Date.now()}-${randomBytes(8).toString('hex')}.json`;
      await copy(pathname, backup, { ...opts, contentType: 'application/json' });
    }
    const saved = await put(pathname, JSON.stringify(profile), {
      ...opts, contentType: 'application/json', addRandomSuffix: false,
      ...(expectedVersion ? { ifMatch: expectedVersion } : { allowOverwrite: false }),
      cacheControlMaxAge: 60,
    });
    return { version: saved.etag };
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw createError({ statusCode: 409, statusMessage: 'Profile changed in another tab. Export your draft before reloading.' });
    // A racing first write may find the pathname already taken.
    const latest = await readProfile();
    if (latest.version !== expectedVersion) throw createError({ statusCode: 409, statusMessage: 'Profile changed in another tab. Export your draft before reloading.' });
    throw createError({ statusCode: 503, statusMessage: 'Profile could not be saved' });
  }
}
