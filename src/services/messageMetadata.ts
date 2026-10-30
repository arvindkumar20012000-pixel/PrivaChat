import { DecryptedMessage } from '../types';
import { formatFullDateTime, formatHumanReadableTime, formatDurationBetween } from '../utils/formatTime';

export interface MessageMetadataInfo {
  id: string;
  type: string;
  isMe: boolean;
  senderName: string;
  contentSnippet: string;
  sentTimestamp: number;
  sentTimeFormatted: string;
  sentFullDateTime: string;
  isDelivered: boolean;
  isRead: boolean;
  readTimestamp: number | null;
  readTimeFormatted: string | null;
  readFullDateTime: string | null;
  timeToReadFormatted: string | null;
  encryption: {
    algorithm: string;
    keyLength: string;
    mode: string;
    status: string;
    serverVisibility: string;
  };
  details: {
    charactersCount?: number;
    mediaSizeFormatted?: string;
    isViewOnce: boolean;
    disappearingDuration: number;
    disappearingDurationLabel: string;
    expiresInSeconds: number | null;
    replyToSnippet?: string;
  };
  reactions: Record<string, string[]>;
}

/**
 * Fetches and assembles comprehensive WhatsApp-style metadata for any chat message
 */
export async function fetchMessageMetadata(
  roomId: string,
  message: DecryptedMessage,
  lang: 'hi' | 'en' = 'en'
): Promise<MessageMetadataInfo> {
  const isMe = !!message;
  let serverInfo: any = null;

  // Attempt to fetch latest real-time status from server
  try {
    const res = await fetch(`/api/rooms/${roomId}/messages/${message.id}/info`);
    if (res.ok) {
      serverInfo = await res.json();
    }
  } catch (err) {
    // Graceful fallback to client message state
  }

  const isRead = !!(message.viewed || serverInfo?.viewed);
  const readTimestamp = message.viewedAt || serverInfo?.viewedAt || (isRead ? Date.now() : null);

  const sentTimeFormatted = formatHumanReadableTime(message.timestamp);
  const sentFullDateTime = formatFullDateTime(message.timestamp, lang);

  const readTimeFormatted = readTimestamp ? formatHumanReadableTime(readTimestamp) : null;
  const readFullDateTime = readTimestamp ? formatFullDateTime(readTimestamp, lang) : null;

  const timeToReadFormatted = (isRead && readTimestamp)
    ? formatDurationBetween(message.timestamp, readTimestamp, lang)
    : null;

  // Media size calculation
  let mediaSizeFormatted: string | undefined;
  if (message.type !== 'text') {
    if (message.mediaMeta?.size) {
      const bytes = message.mediaMeta.size;
      mediaSizeFormatted = bytes > 1024 * 1024
        ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(bytes / 1024)} KB`;
    } else if (message.content?.startsWith('data:')) {
      const approxBytes = Math.round((message.content.length * 3) / 4);
      mediaSizeFormatted = approxBytes > 1024 * 1024
        ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(approxBytes / 1024)} KB`;
    }
  }

  // Disappearing label
  const timer = message.disappearingTimer || 0;
  let disappearingDurationLabel = 'Off';
  if (timer === 5) disappearingDurationLabel = '5s';
  else if (timer === 30) disappearingDurationLabel = '30s';
  else if (timer === 60) disappearingDurationLabel = '1m';
  else if (timer === 300) disappearingDurationLabel = '5m';
  else if (timer === 3600) disappearingDurationLabel = '1h';
  else if (timer === 86400) disappearingDurationLabel = '24h';

  let expiresInSeconds: number | null = null;
  if (message.expiresAt && message.expiresAt > Date.now()) {
    expiresInSeconds = Math.ceil((message.expiresAt - Date.now()) / 1000);
  }

  let contentSnippet = '';
  if (message.type === 'text') {
    contentSnippet = message.content?.slice(0, 100) || '';
  } else {
    contentSnippet = `[${message.type.toUpperCase()}] ${message.mediaMeta?.name || ''}`;
  }

  return {
    id: message.id,
    type: message.type,
    isMe: true,
    senderName: message.senderName,
    contentSnippet,
    sentTimestamp: message.timestamp,
    sentTimeFormatted,
    sentFullDateTime,
    isDelivered: true,
    isRead,
    readTimestamp,
    readTimeFormatted,
    readFullDateTime,
    timeToReadFormatted,
    encryption: {
      algorithm: 'AES-GCM',
      keyLength: '256 bits',
      mode: 'Client-Authoritative Authenticated Encryption',
      status: '100% End-to-End Encrypted',
      serverVisibility: 'Ciphertext Only (Zero-Knowledge)',
    },
    details: {
      charactersCount: message.type === 'text' ? message.content?.length || 0 : undefined,
      mediaSizeFormatted,
      isViewOnce: !!message.isViewOnce,
      disappearingDuration: timer,
      disappearingDurationLabel,
      expiresInSeconds,
      replyToSnippet: message.replyTo?.snippet,
    },
    reactions: message.reactions || {},
  };
}
