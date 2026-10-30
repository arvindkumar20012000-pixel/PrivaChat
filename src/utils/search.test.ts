import { test } from 'node:test';
import assert from 'node:assert';

interface SimpleMessage {
  id: string;
  content: string;
}

function filterMatchingMessages(messages: SimpleMessage[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return messages
    .filter((m) => m.content && m.content.toLowerCase().includes(q))
    .map((m) => m.id);
}

test('Message Search in Room', async (t) => {
  const sampleMessages: SimpleMessage[] = [
    { id: 'msg-1', content: 'नमस्ते जानू 💕' },
    { id: 'msg-2', content: 'कैसी हो आप?' },
    { id: 'msg-3', content: 'मैं बाज़ार में हूँ' },
    { id: 'msg-4', content: 'Secret dinner plan tonight at 8' },
    { id: 'msg-5', content: 'Love you so much' },
  ];

  await t.test('returns matching ids for Hindi substring search', () => {
    const matches = filterMatchingMessages(sampleMessages, 'बाज़ार');
    assert.deepStrictEqual(matches, ['msg-3']);
  });

  await t.test('returns matching ids case-insensitively for English', () => {
    const matches = filterMatchingMessages(sampleMessages, 'SECRET');
    assert.deepStrictEqual(matches, ['msg-4']);
  });

  await t.test('returns empty array when query is empty or spaces', () => {
    const matches = filterMatchingMessages(sampleMessages, '   ');
    assert.deepStrictEqual(matches, []);
  });

  await t.test('finds multiple matches across chat history', () => {
    const matches = filterMatchingMessages(sampleMessages, 'you');
    assert.deepStrictEqual(matches, ['msg-5']);
  });
});
