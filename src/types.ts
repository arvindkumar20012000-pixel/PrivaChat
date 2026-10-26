export type MediaType = 'text' | 'image' | 'video' | 'audio';

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  salt: string;
}

export interface EncryptedMessage {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  type: MediaType;
  payload: EncryptedPayload;
  isViewOnce?: boolean;
  viewed?: boolean;
  viewedAt?: number;
  disappearingTimer?: number; // seconds: 0 = off, 5, 30, 60, 300, 3600, 86400
  expiresAt?: number; // absolute timestamp
  replyTo?: {
    id: string;
    senderName: string;
    snippet: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of senderIds
  mediaMeta?: {
    name?: string;
    size?: number;
    duration?: number;
    width?: number;
    height?: number;
  };
}

export interface DecryptedMessage extends Omit<EncryptedMessage, 'payload'> {
  content: string; // Decrypted text or base64 data URL
  decryptionError?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarSeed: string;
  role: 'you' | 'partner';
}

export interface RoomInfo {
  id: string;
  created: number;
  disappearingDuration: number; // default room timer in seconds
  activeUsers: {
    id: string;
    name: string;
    lastSeen: number;
  }[];
}

export type CamouflageMode = 'none' | 'calculator' | 'notes';

export type AppTheme = 'whatsapp' | 'dark' | 'light' | 'system';
