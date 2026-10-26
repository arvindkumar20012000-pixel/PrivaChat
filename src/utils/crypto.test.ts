import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bufferToBase64,
  base64ToBuffer,
  encryptData,
  decryptData,
  generateFingerprint,
  generateRoomSecret,
  generateRoomId,
  generateMessageId
} from './crypto';

test('bufferToBase64 and base64ToBuffer roundtrip correctly', () => {
  const original = new Uint8Array([1, 2, 3, 254, 255, 0, 42]);
  const base64 = bufferToBase64(original);
  const recovered = base64ToBuffer(base64);
  assert.deepEqual(Array.from(recovered), Array.from(original));
});

test('encryptData and decryptData perform clean E2EE roundtrip on text', async () => {
  const secret = 'ultra-secret-passphrase-for-couple-991';
  const originalMessage = 'हैलो मेरी जान! यह एक गुप्त संदेश है 💖 Secret Message 123';

  const encrypted = await encryptData(originalMessage, secret);
  assert.ok(encrypted.iv, 'IV must exist');
  assert.ok(encrypted.ciphertext, 'Ciphertext must exist');
  assert.ok(encrypted.salt, 'Salt must exist');
  assert.notEqual(encrypted.ciphertext, originalMessage, 'Encrypted data must not match plaintext');

  const decrypted = await decryptData(encrypted, secret);
  assert.equal(decrypted, originalMessage, 'Decrypted text should match original');
});

test('decryptData fails with incorrect secret', async () => {
  const secret = 'correct-passphrase-123';
  const wrongSecret = 'wrong-passphrase-456';
  const originalMessage = 'Confidential photo/video metadata';

  const encrypted = await encryptData(originalMessage, secret);

  await assert.rejects(
    async () => {
      await decryptData(encrypted, wrongSecret);
    },
    /operation failed|tag mismatch|failed/i,
    'Decryption with incorrect key must fail'
  );
});

test('generateFingerprint creates a 6-block security number', async () => {
  const secret = 'shared-couple-key-7788';
  const fp1 = await generateFingerprint(secret);
  const fp2 = await generateFingerprint(secret);

  assert.equal(fp1, fp2, 'Fingerprint must be deterministic for the same secret');
  const parts = fp1.split(' ');
  assert.equal(parts.length, 6, 'Fingerprint must have 6 blocks of digits');
  for (const part of parts) {
    assert.equal(part.length, 5, 'Each block must be 5 digits');
  }
});

test('generateRoomSecret and generateRoomId output valid tokens', () => {
  const secret = generateRoomSecret();
  assert.ok(secret.length >= 20, 'Room secret should be long enough');

  const roomId = generateRoomId();
  assert.match(roomId, /^[a-z]+-[a-z]+-\d{4}$/, 'Room ID should match pattern');

  const msgId = generateMessageId();
  assert.ok(msgId.startsWith('msg_'), 'Message ID should start with msg_');
});
