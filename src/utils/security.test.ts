import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isPinValidFormat, verifyPin, DEFAULT_PIN, hasUserSetPin } from './security.js';

describe('Security and PIN Lock', () => {
  it('validates 4-digit PIN format strictly', () => {
    assert.strictEqual(isPinValidFormat('1402'), true);
    assert.strictEqual(isPinValidFormat('0000'), true);
    assert.strictEqual(isPinValidFormat('123'), false);
    assert.strictEqual(isPinValidFormat('12345'), false);
    assert.strictEqual(isPinValidFormat('abcd'), false);
    assert.strictEqual(isPinValidFormat('12a4'), false);
    assert.strictEqual(isPinValidFormat(''), false);
  });

  it('verifies entered PIN correctly against target', () => {
    assert.strictEqual(verifyPin('1402', '1402'), true);
    assert.strictEqual(verifyPin('9999', '1402'), false);
    assert.strictEqual(verifyPin('1234', '1234'), true);
  });

  it('has a default PIN fallback of 1402', () => {
    assert.strictEqual(DEFAULT_PIN, '1402');
  });

  it('checks hasUserSetPin safely in node/mock environment', () => {
    // In node environment without window/localStorage, returns false safely
    assert.strictEqual(typeof hasUserSetPin(), 'boolean');
  });
});
