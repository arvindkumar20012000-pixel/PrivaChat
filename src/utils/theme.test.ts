import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from './theme';

test('resolveTheme returns valid WhatsApp dark theme colors', () => {
  const theme = resolveTheme('whatsapp');
  assert.equal(theme.bg, '#0b141a');
  assert.equal(theme.myBubble, '#005c4b');
  assert.equal(theme.checkColor, '#53bdeb');
  assert.equal(theme.isLight, false);
});

test('resolveTheme returns valid WhatsApp light theme colors', () => {
  const theme = resolveTheme('light');
  assert.equal(theme.bg, '#efeae2');
  assert.equal(theme.headerBg, '#008069');
  assert.equal(theme.myBubble, '#d9fdd3');
  assert.equal(theme.isLight, true);
});

test('resolveTheme returns valid stealth dark theme colors', () => {
  const theme = resolveTheme('dark');
  assert.equal(theme.bg, '#09090b');
  assert.equal(theme.myBubble, '#be123c');
  assert.equal(theme.isLight, false);
});

test('resolveTheme handles system theme fallback correctly', () => {
  const theme = resolveTheme('system');
  assert.ok(theme.bg);
  assert.ok(theme.myBubble);
});
