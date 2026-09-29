import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

// Run locally in a private terminal. Reads a password from stdin, not argv or shell history.
const chunks = [];
process.stdin.setEncoding('utf8');
if (process.stdin.isTTY) {
  process.stderr.write('Enter a password (input is hidden), then press Enter: ');
  process.stdin.setRawMode(true);
  process.stdin.on('data', (input) => {
    if (input === '\r' || input === '\n') { process.stdin.setRawMode(false); process.stdin.pause(); process.stderr.write('\n'); return; }
    if (input === '\u0003') { process.stdin.setRawMode(false); process.exit(1); }
    if (input === '\u007f') chunks.pop();
    else chunks.push(input);
  });
  await new Promise((resolve) => process.stdin.on('pause', resolve));
} else {
  for await (const chunk of process.stdin) chunks.push(chunk);
}
const password = chunks.join('').replace(/[\r\n]+$/, '');
if (password.length < 16) { process.stderr.write('Use a unique password of at least 16 characters.\n'); process.exitCode = 1; }
else {
  const salt = randomBytes(16);
  const hash = await promisify(scryptCallback)(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  process.stdout.write(`OWNER_PASSWORD_HASH=${salt.toString('hex')}:${hash.toString('hex')}\n`);
  process.stdout.write(`OWNER_SESSION_SECRET=${randomBytes(48).toString('base64url')}\n`);
}
