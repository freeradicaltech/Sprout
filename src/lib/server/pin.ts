import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

// PIN storage format: `s2$<saltHex>$<hashHex>` using scrypt (built into Node,
// so no extra dependency to vendor on the offline container). Legacy plaintext
// PINs (no `s2$` prefix) are still accepted once and transparently upgraded on
// the next successful login.
const PREFIX = 's2';
const KEYLEN = 64;

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, KEYLEN);
  return `${PREFIX}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(`${PREFIX}$`);
}

export function verifyPin(stored: string, pin: string): boolean {
  if (!isHashed(stored)) {
    // Legacy plaintext comparison (constant-time-ish).
    return stored.length === pin.length && timingSafeEqual(Buffer.from(stored), Buffer.from(pin));
  }
  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(pin, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
