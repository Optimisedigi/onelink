import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import { safeHttpsUrl } from '../../utils/safeLinks.js';

// Owner-triggered only (admin Save). Visitors never cause server-side fetches.
const maxBytes = 256 * 1024;
const maxRedirects = 3;
const timeoutMs = 4000;

const blocked = new net.BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]) blocked.addSubnet(address, prefix, 'ipv4');
for (const [address, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['64:ff9b::', 96], ['2001:db8::', 32]]) {
  blocked.addSubnet(address, prefix, 'ipv6');
}
export function isPublicAddress(address, family) {
  const type = family === 6 || family === 'IPv6' ? 'ipv6' : 'ipv4';
  if (type === 'ipv6') {
    const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) return !blocked.check(mapped[1], 'ipv4');
  }
  return !blocked.check(address, type);
}

// Validates the address actually used for the connection, so DNS rebinding
// between check and connect cannot reach a private network.
function publicLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error);
    const usable = addresses.filter((entry) => isPublicAddress(entry.address, entry.family));
    if (!usable.length) return callback(new Error('Destination resolves to a non-public address'));
    if (options.all) return callback(null, usable);
    return callback(null, usable[0].address, usable[0].family);
  });
}

function fetchHead(url, signal) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      lookup: publicLookup, signal, headers: { accept: 'text/html', 'user-agent': 'OneLinkFaviconBot/1.0' },
    }, (response) => {
      const status = response.statusCode || 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        return resolve({ redirect: response.headers.location });
      }
      if (status !== 200 || !/text\/html/i.test(response.headers['content-type'] || '')) {
        response.resume();
        return resolve({ html: '' });
      }
      let size = 0;
      const chunks = [];
      response.on('data', (chunk) => {
        size += chunk.length;
        chunks.push(chunk);
        const text = Buffer.concat(chunks).toString('utf8');
        if (size >= maxBytes || /<\/head>/i.test(text)) { response.destroy(); resolve({ html: text }); }
      });
      response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8') }));
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}

const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const attribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? decode(match[1] ?? match[2] ?? match[3] ?? '') : '';
};

export function pickIcon(html, pageUrl) {
  const candidates = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    const rel = attribute(tag, 'rel').toLowerCase().split(/\s+/);
    if (!rel.includes('icon') && !rel.includes('apple-touch-icon')) continue;
    if (rel.includes('mask-icon')) continue;
    const href = attribute(tag, 'href');
    if (!href) continue;
    let resolved;
    try { resolved = safeHttpsUrl(new URL(href, pageUrl).href); } catch { continue; }
    if (!resolved) continue;
    // Prefer a regular icon over apple-touch-icon; prefer non-SVG raster images.
    const rank = (rel.includes('icon') ? 0 : 2) + (/\.svg(\?|$)/i.test(resolved) ? 1 : 0);
    candidates.push({ rank, url: resolved });
  }
  candidates.sort((a, b) => a.rank - b.rank);
  return candidates[0]?.url || '';
}

export async function discoverFavicon(pageUrl) {
  const signal = AbortSignal.timeout(timeoutMs);
  let current = safeHttpsUrl(pageUrl);
  for (let hop = 0; current && hop <= maxRedirects; hop += 1) {
    const parsed = new URL(current);
    if (parsed.port && parsed.port !== '443') return '';
    const result = await fetchHead(current, signal);
    if (result.redirect) { current = safeHttpsUrl(new URL(result.redirect, current).href); continue; }
    return pickIcon(result.html, current);
  }
  return '';
}

// Fill `fi` for links that have no attached image or legacy icon and no stored
// favicon yet. Failures leave the link unchanged; the browser then falls back
// to /favicon.ico and the initial letter.
export async function addDiscoveredFavicons(profile) {
  const pending = profile.ls.filter((link) => !link.image && !link.i && !link.fi);
  const started = Date.now();
  let found = 0;
  for (let index = 0; index < pending.length; index += 6) {
    if (Date.now() - started > 8000) break;
    await Promise.all(pending.slice(index, index + 6).map(async (link) => {
      try {
        const icon = await discoverFavicon(link.u);
        if (icon) { link.fi = icon; found += 1; }
      } catch { /* unreachable site: keep fallback */ }
    }));
  }
  if (pending.length) {
    console.info(JSON.stringify({ operation: 'favicon-discovery', links: pending.length, found, elapsedMs: Date.now() - started }));
  }
  return profile;
}
