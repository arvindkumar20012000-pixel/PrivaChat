import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateQrDataUrl } from './qr.js';

describe('QR Generator', () => {
  it('should generate a valid data URL for standard text', () => {
    const url = generateQrDataUrl('https://example.com/secret#room=123');
    assert.ok(url.startsWith('data:image/'), 'Should produce a data:image URL');
    assert.ok(url.length > 100, 'Data URL should contain encoded image data');
  });

  it('should return empty string for empty input', () => {
    const url = generateQrDataUrl('');
    assert.strictEqual(url, '');
  });
});
