import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  hashPin,
  generateRecoveryKey,
  hashRecoveryKey,
  verifyRecoveryKey,
  verifyPin,
} from './security';

describe('Security Utilities — Master Recovery Key & PIN Cryptography', () => {
  it('generates unique salts with correct hex length', () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);

    expect(salt1).toBeDefined();
    expect(salt2).toBeDefined();
    expect(salt1).not.toBe(salt2);
    expect(salt1.length).toBe(32); // 16 bytes * 2 chars per byte
  });

  it('hashes PIN deterministically with given salt', async () => {
    const salt = '1234567890abcdef1234567890abcdef';
    const pin = '1234';

    const hash1 = await hashPin(pin, salt);
    const hash2 = await hashPin(pin, salt);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(10);
  });

  it('produces distinct hashes for different PINs with identical salt', async () => {
    const salt = 'constant_salt_for_testing_123456';
    const hashA = await hashPin('1234', salt);
    const hashB = await hashPin('4321', salt);

    expect(hashA).not.toBe(hashB);
  });

  it('produces distinct hashes for the same PIN with different salts', async () => {
    const salt1 = generateSalt(16);
    const salt2 = generateSalt(16);
    const pin = '9999';

    const hash1 = await hashPin(pin, salt1);
    const hash2 = await hashPin(pin, salt2);

    expect(hash1).not.toBe(hash2);
  });

  it('generates recovery key in valid RECOVER-XXXX-XXXX-XXXX-XXXX format (16 characters)', () => {
    const key = generateRecoveryKey();
    expect(key).toMatch(/^RECOVER-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    
    // Total character count without prefix and hyphens must be exactly 16
    const cleanChars = key.replace(/RECOVER-|-/g, '');
    expect(cleanChars.length).toBe(16);
  });

  it('generates high-entropy unique recovery keys with no ambiguous characters (0, 1, I, O)', () => {
    const keys = new Set<string>();
    const ambiguousRegex = /[01IOio]/;

    for (let i = 0; i < 50; i++) {
      const k = generateRecoveryKey();
      const payload = k.replace('RECOVER-', '').replace(/-/g, '');
      expect(ambiguousRegex.test(payload)).toBe(false);
      keys.add(k);
    }

    expect(keys.size).toBe(50);
  });

  it('verifies valid recovery key correctly and rejects invalid ones', async () => {
    const salt = generateSalt(16);
    const key = generateRecoveryKey();

    const storedHash = await hashRecoveryKey(key, salt);
    expect(storedHash.startsWith('pbkdf2_rec$')).toBe(true);

    // Exact key
    const isValid = await verifyRecoveryKey(key, storedHash, salt);
    expect(isValid).toBe(true);

    // Normalized key (lower case, extra spaces)
    const isValidNormalized = await verifyRecoveryKey(key.toLowerCase() + '  ', storedHash, salt);
    expect(isValidNormalized).toBe(true);

    // Without hyphens
    const isValidNoHyphens = await verifyRecoveryKey(key.replace(/-/g, ''), storedHash, salt);
    expect(isValidNoHyphens).toBe(true);

    // Wrong key
    const isInvalid = await verifyRecoveryKey('RECOVER-WRONG-KEY0-TEST-ABCD', storedHash, salt);
    expect(isInvalid).toBe(false);

    // Empty key or missing hash
    expect(await verifyRecoveryKey('', storedHash, salt)).toBe(false);
    expect(await verifyRecoveryKey(key, null, salt)).toBe(false);
  });

  it('verifies PIN and correctly flags PBKDF2 hashes vs legacy hashes and enables migration', async () => {
    const salt = generateSalt(16);
    const pin = '4826';
    const pbkdf2Hash = await hashPin(pin, salt);

    expect(pbkdf2Hash.startsWith('pbkdf2$')).toBe(true);

    const isValid = await verifyPin(pin, pbkdf2Hash, salt);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPin('9999', pbkdf2Hash, salt);
    expect(isWrongValid).toBe(false);

    // Legacy SHA-256 simulation and migration
    const legacySalt = 'legacy-salt-123';
    const legacyPin = '5555';
    // Create a legacy SHA-256 hash
    const cryptoObj = globalThis.crypto;
    const encoder = new TextEncoder();
    const legacyBuffer = await cryptoObj.subtle.digest(
      'SHA-256',
      encoder.encode(`finantrack_salt_${legacySalt}:${legacyPin}`)
    );
    const legacyHex = Array.from(new Uint8Array(legacyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Verify against legacy hash format
    const isLegacyValid = await verifyPin(legacyPin, legacyHex, legacySalt);
    expect(isLegacyValid).toBe(true);

    // Migration to PBKDF2
    const migratedHash = await hashPin(legacyPin, legacySalt);
    expect(migratedHash.startsWith('pbkdf2$')).toBe(true);
    expect(await verifyPin(legacyPin, migratedHash, legacySalt)).toBe(true);
  });
});
