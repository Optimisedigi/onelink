import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createError, getCookie, setCookie, deleteCookie, getRequestURL, setHeader } from 'h3';

const scrypt = promisify(scryptCallback);
const name = 'owner_session';
const lifetime = 12 * 60 * 60;

function settings() {
  const [salt, hash] = (process.env.OWNER_PASSWORD_HASH || '').split(':');
  const secret = process.env.OWNER_SESSION_SECRET || '';
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '') || secret.length < 48) {
    throw createError({ statusCode: 503, statusMessage: 'Owner login is not configured' });
  }
  return { salt, hash, secret };
}
function signature(payload, secret) { return createHmac('sha256', secret).update(payload).digest('base64url'); }
function cookieOptions(event) {
  return { httpOnly: true, secure: getRequestURL(event).protocol === 'https:' || process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
}
export async function verifyPassword(password) {
  const { salt, hash } = settings();
  const actual = await scrypt(password, Buffer.from(salt, 'hex'), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
}
export function issueSession(event) {
  const { secret } = settings();
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + lifetime * 1000, nonce: randomBytes(16).toString('hex') })).toString('base64url');
  setCookie(event, name, `${payload}.${signature(payload, secret)}`, { ...cookieOptions(event), maxAge: lifetime });
  setHeader(event, 'Cache-Control', 'private, no-store');
}
export function requireOwner(event) {
  setHeader(event, 'Cache-Control', 'private, no-store');
  const { secret } = settings();
  const token = getCookie(event, name) || '';
  const match = /^([A-Za-z0-9_-]{1,512})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) throw createError({ statusCode: 401, statusMessage: 'Sign in required' });
  const expected = Buffer.from(signature(match[1], secret));
  const supplied = Buffer.from(match[2]);
  if (!timingSafeEqual(expected, supplied)) throw createError({ statusCode: 401, statusMessage: 'Sign in required' });
  let payload;
  try { payload = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')); }
  catch { throw createError({ statusCode: 401, statusMessage: 'Sign in required' }); }
  if (!Number.isSafeInteger(payload.exp) || payload.exp <= Date.now() || payload.exp > Date.now() + lifetime * 1000) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired' });
  }
}
export function revokeOwnerSession(event) {
  deleteCookie(event, name, cookieOptions(event));
  setHeader(event, 'Cache-Control', 'private, no-store');
}
