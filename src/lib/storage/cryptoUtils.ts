/**
 * Chess Community India — Cryptographic Utilities
 * 
 * Provides standard FIPS 180-4 SHA-256 implementation, salted password hashing,
 * constant-time string comparison, rate limiting, and session token generation.
 */

// Initial hash values (first 32 bits of fractional parts of square roots of first 8 primes)
const H = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// Round constants (first 32 bits of fractional parts of cube roots of first 64 primes)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256(message: string): string {
  // UTF-8 encoding
  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    let charCode = message.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      i++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (message.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }

  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) {
    bytes.push(0);
  }

  // 64-bit big-endian representation of bitLength
  for (let i = 7; i >= 0; i--) {
    bytes.push((bitLength >>> (i * 8)) & 0xff);
  }

  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  const h = [...H];
  const w = new Array(64);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t];
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (((w[t - 16] + s0) | 0) + ((w[t - 7] + s1) | 0)) | 0;
    }

    let [a, b, c, d, e, f, g, hVal] = h;

    for (let t = 0; t < 64; t++) {
      const s1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((hVal + s1) | 0) + (((ch + K[t]) | 0) + w[t]) | 0) | 0;
      const s0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      hVal = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hVal) | 0;
  }

  return h.map((val) => (val >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * Generate cryptographically random hexadecimal salt
 */
export function generateSalt(length = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Math.random fallback
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return salt;
}

/**
 * Hash a password using SHA-256 with salt in format: sha256$<salt>$<hash>
 */
export function hashPassword(password: string, salt?: string): string {
  const chosenSalt = salt || generateSalt(16);
  const digest = sha256(`${chosenSalt}:${password}`);
  return `sha256$${chosenSalt}$${digest}`;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify a candidate password against stored hash.
 * Supports:
 * - sha256$<salt>$<digest>
 * - legacy plaintext migration
 */
export function verifyPassword(password: string, storedHash: string): { verified: boolean; needsRehash: boolean } {
  if (!password || !storedHash) {
    return { verified: false, needsRehash: false };
  }

  if (storedHash.startsWith('sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedDigest = parts[2];
      const candidateDigest = sha256(`${salt}:${password}`);
      const verified = constantTimeCompare(expectedDigest, candidateDigest);
      return { verified, needsRehash: false };
    }
  }

  // Backward compatibility with legacy plaintext passwords from older session storage
  if (constantTimeCompare(password, storedHash)) {
    return { verified: true, needsRehash: true };
  }

  return { verified: false, needsRehash: false };
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  const salt = generateSalt(24);
  const timestamp = Date.now().toString(36);
  return `cci_sess_${timestamp}_${salt}`;
}

/**
 * In-memory rate limiting for login attempts
 * Locks out after 5 consecutive failed attempts for 15 minutes.
 */
interface RateLimitRecord {
  attempts: number;
  lockUntil: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingLockoutSeconds?: number } {
  const key = identifier.trim().toLowerCase();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true };
  }

  const now = Date.now();
  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, remainingLockoutSeconds: remainingSeconds };
  }

  // Lockout expired
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    loginAttempts.delete(key);
  }

  return { allowed: true };
}

export function recordLoginFailure(identifier: string): { lockedOut: boolean; lockUntilMs?: number } {
  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(key) || { attempts: 0, lockUntil: 0 };

  record.attempts += 1;
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(key, record);
    return { lockedOut: true, lockUntilMs: record.lockUntil };
  }

  loginAttempts.set(key, record);
  return { lockedOut: false };
}

export function recordLoginSuccess(identifier: string): void {
  const key = identifier.trim().toLowerCase();
  loginAttempts.delete(key);
}

