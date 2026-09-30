import { createError, getHeader, getRequestURL } from 'h3';

export function checkRequestOrigin(event) {
  const origin = getHeader(event, 'origin');
  const host = getRequestURL(event);
  if (!origin || origin !== host.origin) throw createError({ statusCode: 403, statusMessage: 'Request origin rejected' });
}

export function checkMutation(event) {
  checkRequestOrigin(event);
  if (!/^application\/json(?:\s*;|$)/i.test(getHeader(event, 'content-type') || '')) {
    throw createError({ statusCode: 415, statusMessage: 'JSON required' });
  }
}
