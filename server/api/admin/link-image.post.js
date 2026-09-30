import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { createError, getHeader } from 'h3';
import { requireOwner } from '../../utils/ownerSession.js';
import { checkRequestOrigin } from '../../utils/checkMutation.js';
import { blobOptions } from '../../utils/blobProfile.js';

const maxBytes = 2 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  requireOwner(event);
  checkRequestOrigin(event);
  const contentType = getHeader(event, 'content-type') || '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) {
    throw createError({ statusCode: 415, statusMessage: 'Choose a PNG, JPEG or WebP image' });
  }
  if (Number(getHeader(event, 'content-length') || 0) > maxBytes) {
    throw createError({ statusCode: 413, statusMessage: 'Image must be 2 MB or smaller' });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of event.node.req) {
    size += chunk.length;
    if (size > maxBytes) throw createError({ statusCode: 413, statusMessage: 'Image must be 2 MB or smaller' });
    chunks.push(chunk);
  }
  const image = Buffer.concat(chunks);
  const valid = contentType === 'image/png'
    ? image.length >= 24 && image.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) && image.toString('ascii', 12, 16) === 'IHDR'
    : contentType === 'image/jpeg'
      ? image.length >= 4 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
      : image.length >= 20 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw createError({ statusCode: 415, statusMessage: 'The file does not match its image format' });
  const opts = blobOptions();
  if (opts.access !== 'public') throw createError({ statusCode: 503, statusMessage: 'Public image storage is not configured' });
  const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[contentType];
  const started = Date.now();
  try {
    const uploaded = await put(`linkfriend/link-images/${randomUUID()}.${extension}`, image, {
      ...opts, contentType, addRandomSuffix: false, allowOverwrite: false,
    });
    console.info(JSON.stringify({ operation: 'link-image-upload', contentType, bytes: size, outcome: 'uploaded', elapsedMs: Date.now() - started }));
    return { url: uploaded.url };
  } catch {
    console.error(JSON.stringify({ operation: 'link-image-upload', contentType, bytes: size, outcome: 'failed', elapsedMs: Date.now() - started }));
    throw createError({ statusCode: 503, statusMessage: 'Image upload failed. Try again.' });
  }
});
