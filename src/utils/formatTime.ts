/**
 * Human-readable date and time formatting utilities for CipherChat
 */

/**
 * Returns clean 12-hour format timestamp with AM/PM (e.g., '10:30 AM', '08:15 PM')
 */
export function formatHumanReadableTime(ts: number): string {
  if (!ts || isNaN(ts)) return '';
  const date = new Date(ts);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  const strHours = hours < 10 ? `0${hours}` : `${hours}`;
  const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${strHours}:${strMinutes} ${ampm}`;
}

/**
 * Returns full date and time string (e.g., 'Oct 30, 2026, 10:30 AM')
 */
export function formatFullDateTime(ts: number, lang: 'hi' | 'en' = 'en'): string {
  if (!ts || isNaN(ts)) return '—';
  const date = new Date(ts);
  const time = formatHumanReadableTime(ts);
  const dateStr = date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${dateStr}, ${time}`;
}

/**
 * Returns human-readable duration between message sent and read
 */
export function formatDurationBetween(startTs: number, endTs: number, lang: 'hi' | 'en' = 'en'): string {
  if (!startTs || !endTs || endTs <= startTs) {
    return lang === 'hi' ? 'तुरंत (1 सेकंड से कम)' : 'Instantly (< 1s)';
  }
  const diffSec = Math.floor((endTs - startTs) / 1000);
  if (diffSec < 60) {
    return lang === 'hi' ? `${diffSec} सेकंड में` : `in ${diffSec}s`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'hi' ? `${diffMin} मिनट में` : `in ${diffMin}m`;
  }
  const diffHours = Math.floor(diffMin / 60);
  return lang === 'hi' ? `${diffHours} घंटे में` : `in ${diffHours}h`;
}
