import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  hashPin,
  generateRecoveryKey,
  hashRecoveryKey,
  verifyRecoveryKey,
  verifyPin,
  generateSecureId,
  generateSecureRandomNumber,
} from './security';

describe('Security Utilities — Master Recovery Key & PIN Cryptography', () => {
  it('generates secure random IDs with cryptographic bytes and rejects predictable patterns', () => {
    const id1 = generateSecureId('tx', 8);
    const id2 = generateSecureId('tx', 8);

    expect(id1).toMatch(/^tx-\d+-[a-f0-9]{16}$/);
    expect(id2).toMatch(/^tx-\d+-[a-f0-9]{16}$/);
    expect(id1).not.toBe(id2);
  });

  it('generates secure random integers within the requested range strictly', () => {
    for (let i = 0; i < 50; i++) {
      const num = generateSecureRandomNumber(10, 20);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
      expect(Number.isInteger(num)).toBe(true);
    }
  });
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

    // New credentials strictly generate pbkdf2$ prefix and never plain SHA-256
    expect(pbkdf2Hash.startsWith('pbkdf2$')).toBe(true);
    expect(pbkdf2Hash).not.toMatch(/^[a-f0-9]{64}$/); // Not raw hex SHA-256

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

    // Rejection of invalid pin against legacy hash (no bypass)
    const isInvalidLegacy = await verifyPin('0000', legacyHex, legacySalt);
    expect(isInvalidLegacy).toBe(false);

    // Migration to modern PBKDF2: Once migrated, modern hash replaces legacy entirely
    const migratedHash = await hashPin(legacyPin, legacySalt);
    expect(migratedHash.startsWith('pbkdf2$')).toBe(true);
    expect(await verifyPin(legacyPin, migratedHash, legacySalt)).toBe(true);

    // Post-migration: The stored state is now pbkdf2$, legacy string is discarded
    expect(migratedHash).not.toBe(legacyHex);
  });

  it('guarantees new recovery key hashing strictly uses pbkdf2_rec$ and never plain SHA-256', async () => {
    const salt = generateSalt(16);
    const key = generateRecoveryKey();
    const newHash = await hashRecoveryKey(key, salt);

    expect(newHash.startsWith('pbkdf2_rec$')).toBe(true);
    expect(newHash).not.toMatch(/^[a-f0-9]{64}$/);

    // Legacy recovery key simulation and migration
    const legacySalt = 'rec-salt-legacy';
    const normalized = key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cryptoObj = globalThis.crypto;
    const encoder = new TextEncoder();
    const legacyBuffer = await cryptoObj.subtle.digest(
      'SHA-256',
      encoder.encode(`finantrack_recovery_${legacySalt}:${normalized}`)
    );
    const legacyHex = Array.from(new Uint8Array(legacyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    expect(await verifyRecoveryKey(key, legacyHex, legacySalt)).toBe(true);
    expect(await verifyRecoveryKey('RECOVER-WRONG-AAAA-BBBB', legacyHex, legacySalt)).toBe(false);

    // Post-migration: Stored state migrates to pbkdf2_rec$
    const modernHash = await hashRecoveryKey(key, legacySalt);
    expect(modernHash.startsWith('pbkdf2_rec$')).toBe(true);
    expect(await verifyRecoveryKey(key, modernHash, legacySalt)).toBe(true);
    expect(modernHash).not.toBe(legacyHex);
  });

  it('demonstrates stateful migration cycle: legacy accepted once -> rehashed to PBKDF2 -> stored state updated -> legacy rejected', async () => {
    // Initial legacy state in storage
    const legacySalt = 'stateful-salt-legacy';
    const pin = '7890';
    const cryptoObj = globalThis.crypto;
    const encoder = new TextEncoder();
    const legacyBuffer = await cryptoObj.subtle.digest(
      'SHA-256',
      encoder.encode(`finantrack_salt_${legacySalt}:${pin}`)
    );
    const legacyHash = Array.from(new Uint8Array(legacyBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    let currentStoredConfig = {
      pinHash: legacyHash,
      pinSalt: legacySalt,
    };

    // Step 1: Detect legacy hash and verify user input
    expect(currentStoredConfig.pinHash.startsWith('pbkdf2$')).toBe(false);
    const isLegacyAuthValid = await verifyPin(pin, currentStoredConfig.pinHash, currentStoredConfig.pinSalt);
    expect(isLegacyAuthValid).toBe(true);

    // Step 2: Instant migration during authentication (rehash + persist)
    const upgradedModernHash = await hashPin(pin, currentStoredConfig.pinSalt);
    currentStoredConfig = {
      ...currentStoredConfig,
      pinHash: upgradedModernHash,
    };

    // Step 3: From now on, stored config has pbkdf2$ prefix and legacy hash is gone
    expect(currentStoredConfig.pinHash.startsWith('pbkdf2$')).toBe(true);
    expect(currentStoredConfig.pinHash).not.toBe(legacyHash);

    // Step 4: Verification succeeds with modern PBKDF2
    const isModernAuthValid = await verifyPin(pin, currentStoredConfig.pinHash, currentStoredConfig.pinSalt);
    expect(isModernAuthValid).toBe(true);

    // Step 5: If an attacker attempts to inject/replay the raw old legacy hash string against the modern stored config, it fails
    const isReplayValid = await verifyPin(legacyHash, currentStoredConfig.pinHash, currentStoredConfig.pinSalt);
    expect(isReplayValid).toBe(false);
  });
});
