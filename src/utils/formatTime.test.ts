import { test } from 'node:test';
import assert from 'node:assert';
import { formatHumanReadableTime, formatDurationBetween } from './formatTime';

test('formatHumanReadableTime', async (t) => {
  await t.test('formats morning timestamp with AM', () => {
    // 2026-10-30T10:30:00
    const d = new Date(2026, 9, 30, 10, 30, 0);
    const result = formatHumanReadableTime(d.getTime());
    assert.strictEqual(result, '10:30 AM');
  });

  await t.test('formats afternoon timestamp with PM', () => {
    // 2026-10-30T14:05:00 -> 02:05 PM
    const d = new Date(2026, 9, 30, 14, 5, 0);
    const result = formatHumanReadableTime(d.getTime());
    assert.strictEqual(result, '02:05 PM');
  });

  await t.test('formats midnight (00:15) as 12:15 AM', () => {
    const d = new Date(2026, 9, 30, 0, 15, 0);
    const result = formatHumanReadableTime(d.getTime());
    assert.strictEqual(result, '12:15 AM');
  });

  await t.test('formats noon (12:00) as 12:00 PM', () => {
    const d = new Date(2026, 9, 30, 12, 0, 0);
    const result = formatHumanReadableTime(d.getTime());
    assert.strictEqual(result, '12:00 PM');
  });

  await t.test('handles invalid timestamp gracefully', () => {
    assert.strictEqual(formatHumanReadableTime(0), '');
    assert.strictEqual(formatHumanReadableTime(NaN), '');
  });
});

test('formatDurationBetween', async (t) => {
  await t.test('formats seconds difference', () => {
    const start = 1000000;
    const end = 1000000 + 45 * 1000;
    assert.strictEqual(formatDurationBetween(start, end, 'en'), 'in 45s');
    assert.strictEqual(formatDurationBetween(start, end, 'hi'), '45 सेकंड में');
  });

  await t.test('formats minutes difference', () => {
    const start = 1000000;
    const end = 1000000 + 3 * 60 * 1000;
    assert.strictEqual(formatDurationBetween(start, end, 'en'), 'in 3m');
    assert.strictEqual(formatDurationBetween(start, end, 'hi'), '3 मिनट में');
  });
});
