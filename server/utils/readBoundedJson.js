import { createError, getHeader } from 'h3';

export async function readBoundedJson(event, maxBytes) {
  const declared = Number(getHeader(event, 'content-length') || 0);
  if (declared > maxBytes) throw createError({ statusCode: 413, statusMessage: 'Request too large' });
  const chunks = [];
  let size = 0;
  for await (const chunk of event.node.req) {
    size += chunk.length;
    if (size > maxBytes) throw createError({ statusCode: 413, statusMessage: 'Request too large' });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' }); }
}
