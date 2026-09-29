import { createError } from 'h3';
import { checkMutation } from '../../utils/checkMutation.js';
import { readBoundedJson } from '../../utils/readBoundedJson.js';
import { issueSession, verifyPassword } from '../../utils/ownerSession.js';

export default defineEventHandler(async (event) => {
  checkMutation(event);
  const body = await readBoundedJson(event, 4096);
  if (typeof body?.password !== 'string' || body.password.length < 1 || body.password.length > 1024) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  }
  if (!await verifyPassword(body.password)) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  issueSession(event);
  return { ok: true };
});
