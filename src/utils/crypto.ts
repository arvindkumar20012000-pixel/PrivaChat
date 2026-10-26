import { EncryptedPayload } from '../types';

/**
 * Utility functions for client-side End-to-End Encryption (E2EE) using Web Crypto API.
 * Uses AES-GCM 256-bit with PBKDF2 (100,000 iterations of SHA-256).
 */

const subtle = globalThis.crypto?.subtle;

// Helper: Uint8Array to Base64 string
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 string to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM key from a shared secret passphrase and random salt
 */
export async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  if (!subtle) {
    throw new Error('Web Crypto API is not available in this environment');
  }

  const enc = new TextEncoder();
  const rawKey = await subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string (text or media data URL) using AES-GCM
 */
export async function encryptData(plainText: string, secret: string): Promise<EncryptedPayload> {
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);

  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  const key = await deriveKey(secret, salt);
  const enc = new TextEncoder();
  const encryptedBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    enc.encode(plainText)
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
  };
}

/**
 * Decrypts an EncryptedPayload using the shared secret
 */
export async function decryptData(payload: EncryptedPayload, secret: string): Promise<string> {
  if (!subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(secret, salt);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertext as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Generates a human-verifiable security fingerprint (like Signal safety numbers)
 * Formatted as 6 blocks of 5 digits: "12345 67890 12345 67890 12345 67890"
 */
export async function generateFingerprint(secret: string): Promise<string> {
  if (!subtle) return '00000 00000 00000 00000 00000 00000';

  const enc = new TextEncoder();
  const hashBuffer = await subtle.digest('SHA-256', enc.encode(secret));
  const bytes = new Uint8Array(hashBuffer);

  const blocks: string[] = [];
  for (let i = 0; i < 6; i++) {
    const val = (bytes[i * 4] << 24) | (bytes[i * 4 + 1] << 16) | (bytes[i * 4 + 2] << 8) | bytes[i * 4 + 3];
    const positive = Math.abs(val) % 100000;
    blocks.push(positive.toString().padStart(5, '0'));
  }
  return blocks.join(' ');
}

/**
 * Generates a random cryptographic room secret
 */
export function generateRoomSecret(): string {
  const bytes = new Uint8Array(18);
  globalThis.crypto.getRandomValues(bytes);
  return bufferToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a clean, readable Room ID
 */
export function generateRoomId(): string {
  const adjectives = ['secret', 'rose', 'star', 'moon', 'flame', 'whisper', 'cosy', 'pure', 'velvet'];
  const nouns = ['haven', 'nest', 'spark', 'bond', 'room', 'space', 'vault', 'heart'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}-${noun}-${num}`;
}

/**
 * Generates a unique message ID
 */
export function generateMessageId(): string {
  return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
