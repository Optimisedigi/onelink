import { safeEmailHref, safeHttpsUrl, safeWhatsappHref } from '../../utils/safeLinks.js';

const fields = { n: 120, d: 1000, i: 2048, f: 2048, t: 2048, ig: 2048, gh: 2048, tg: 2048, l: 2048, e: 254, w: 40, y: 2048 };
const social = ['f', 't', 'ig', 'gh', 'tg', 'l', 'y'];
const linkFields = { l: 160, g: 80, s: 1000, i: 120, image: 2048, fi: 2048, u: 2048 };
const plain = (value) => value && typeof value === 'object' && !Array.isArray(value);

export function validateProfile(input) {
  if (!plain(input) || Object.keys(input).some((key) => ![...Object.keys(fields), 'ls'].includes(key))) return 'Invalid profile fields';
  for (const [key, max] of Object.entries(fields)) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length > max)) return `Invalid ${key} field`;
  }
  if (input.i && !safeHttpsUrl(input.i)) return 'Profile image must be an HTTPS URL';
  for (const key of social) if (input[key] && !safeHttpsUrl(input[key])) return `${key} must be an HTTPS URL`;
  if (input.e && !safeEmailHref(input.e)) return 'Email address is invalid';
  if (input.w && !safeWhatsappHref(input.w)) return 'WhatsApp number is invalid';
  if (!Array.isArray(input.ls) || input.ls.length > 100) return 'Too many links (maximum 100)';
  for (const [index, link] of input.ls.entries()) {
    if (!plain(link) || Object.keys(link).some((key) => !Object.hasOwn(linkFields, key))) return `Link ${index + 1} has invalid fields`;
    for (const [key, max] of Object.entries(linkFields)) {
      if (link[key] !== undefined && (typeof link[key] !== 'string' || link[key].length > max)) return `Link ${index + 1}: invalid ${key}`;
    }
    if (!link.l?.trim() || !safeHttpsUrl(link.u)) return `Link ${index + 1}: add a label and an HTTPS URL`;
    if (link.image && !safeHttpsUrl(link.image)) return `Link ${index + 1}: image must be an HTTPS URL`;
    if (link.fi && !safeHttpsUrl(link.fi)) return `Link ${index + 1}: invalid site icon`;
  }
  if (Buffer.byteLength(JSON.stringify(input), 'utf8') > 60000) return 'Profile is too large';
  return null;
}
