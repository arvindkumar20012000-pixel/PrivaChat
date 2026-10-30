/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DecryptedMessage,
  EncryptedMessage,
  CamouflageMode,
  AppTheme,
} from './types';
import { Language, translations } from './translations';
import {
  encryptData,
  decryptData,
  generateMessageId,
  generateRoomId,
  generateRoomSecret,
} from './utils/crypto';
import { resolveTheme, ThemeColors } from './utils/theme';
import { WhatsAppWallpaper } from './components/WhatsAppWallpaper';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { MessageItem } from './components/MessageItem';
import { CamouflageCalculator } from './components/CamouflageCalculator';
import { CamouflageNotes } from './components/CamouflageNotes';
import { RoomModal } from './components/RoomModal';
import { MediaViewer } from './components/MediaViewer';
import { RoomSetup } from './components/RoomSetup';
import { PWAInstallModal } from './components/PWAInstallModal';
import { PasscodeLock } from './components/PasscodeLock';
import { ChatSearchBar } from './components/ChatSearchBar';
import { getOrCreateClientId } from './utils/security';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  ShieldCheck,
  Heart,
  EyeOff,
  Lock,
  Database,
  ChevronDown,
  Share2,
  Copy,
  Sparkles,
  Search,
} from 'lucide-react';
import { testConnection } from './services/firebase';
import {
  initOrJoinRoom,
  subscribeToRoomMessages,
  subscribeToRoomMeta,
  sendEncryptedMessageToFirestore,
  markMessageAsViewedInFirestore,
  markBatchAsSeenInFirestore,
  deleteMessageFromFirestore,
  clearRoomInFirestore,
  updateRoomDisappearingTimerInFirestore,
  updateTypingStatusInFirestore,
} from './services/firestoreChat';

export default function App() {
  const [lang, setLang] = useState<Language>('hi');
  const t = translations[lang];

  // Theme selection with localStorage persistence (Default: light mode as requested)
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('secret_chat_theme') as AppTheme) || 'light';
    }
    return 'light';
  });
  const themeColors: ThemeColors = resolveTheme(theme);

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('secret_chat_theme', newTheme);
    }
  };

  // Optional message notifications (discreet browser notifications when backgrounded)
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return localStorage.getItem('cipherchat_notifications') === 'true' && Notification.permission === 'granted';
    }
    return false;
  });

  const toggleNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert(lang === 'hi' ? 'यह ब्राउज़र नोटिफिकेशन सपोर्ट नहीं करता' : 'Notifications not supported in this browser');
      return;
    }
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('cipherchat_notifications', 'false');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('cipherchat_notifications', 'true');
        try {
          new Notification('CipherChat', {
            body: t.notificationsEnabledToast,
            icon: '/icon.svg',
          });
        } catch {}
      } else {
        alert(t.notificationsBlockedToast);
      }
    }
  };

  // PWA Install State
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Security Passcode Lock (App requires PIN on first open and when returning from background)
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const myClientId = useRef<string>(getOrCreateClientId()).current;

  // Room Credentials & Session
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomSecret, setRoomSecret] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(lang === 'hi' ? 'आप' : 'You');
  const [partnerName, setPartnerName] = useState<string>(lang === 'hi' ? 'पार्टनर' : 'Partner');

  // Messages & UI
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [disappearingDuration, setDisappearingDuration] = useState<number>(0);
  const [replyingTo, setReplyingTo] = useState<DecryptedMessage | null>(null);
  const [activeMediaMessage, setActiveMediaMessage] = useState<DecryptedMessage | null>(null);
  const [typingText, setTypingText] = useState<string | null>(null);

  // In-Room Decrypted Search State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Scroll Position & Floating Jump-to-Bottom State
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);
  const isAtBottomRef = useRef<boolean>(true);

  // Modals & Camouflage
  const [camouflageMode, setCamouflageMode] = useState<CamouflageMode>('none');
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [unlockPin, setUnlockPin] = useState<string>('1402');
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const firestoreUnsubRef = useRef<(() => void) | null>(null);
  const firestoreMetaUnsubRef = useRef<(() => void) | null>(null);

  // Validate Firestore database connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Automatically lock the app when backgrounded, minimized, or tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle URL hash changes (#room=...&key=...) or restore persistent saved session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashOrSession = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const r = params.get('room');
        const k = params.get('key');
        if (r && k) {
          setRoomId(r);
          setRoomSecret(k);
          try {
            localStorage.setItem(
              'cipherchat_session',
              JSON.stringify({ roomId: r, roomSecret: k })
            );
          } catch {}
          return;
        }
      }

      // No hash: Check stored persistent session
      try {
        const saved = localStorage.getItem('cipherchat_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.roomId && parsed.roomSecret) {
            setRoomId(parsed.roomId);
            setRoomSecret(parsed.roomSecret);
            if (parsed.userName) setUserName(parsed.userName);
            if (parsed.partnerName) setPartnerName(parsed.partnerName);
          }
        }
      } catch (err) {
        console.warn('Failed to load saved session:', err);
      }
    };

    handleHashOrSession();
    window.addEventListener('hashchange', handleHashOrSession);
    return () => window.removeEventListener('hashchange', handleHashOrSession);
  }, []);

  // Update browser document title based on disguise
  useEffect(() => {
    if (camouflageMode === 'calculator') {
      document.title = 'Calculator - Basic & Scientific Math';
    } else if (camouflageMode === 'notes') {
      document.title = 'Notes - Quick Workspace';
    } else {
      document.title = 'CipherChat - End-to-End Encrypted Private Chat';
    }
  }, [camouflageMode]);

  // Window Focus / Blur privacy shield and Panic Escape shortcut (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCamouflageMode('calculator');
      }
    };

    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Decrypted In-Memory Search: filter messages in the current room matching query
  const matchingMessageIds = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => m.content && m.content.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [messages, searchQuery]);

  // Reset match index when query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Scroll to targeted search match
  const scrollToMatch = useCallback((messageId: string) => {
    if (!messageId) return;
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (matchingMessageIds.length > 0 && isSearching) {
      scrollToMatch(matchingMessageIds[currentMatchIndex]);
    }
  }, [currentMatchIndex, matchingMessageIds, isSearching, scrollToMatch]);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessageIds.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
  };

  // Scroll Detection: Keep track whether user is at bottom or scrolled up reading past history
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceToBottom < 100;
    isAtBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  // Smooth scroll to bottom on demand
  const scrollToBottomSmooth = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setShowScrollBottom(false);
      isAtBottomRef.current = true;
    }
  };

  // Smart Auto-scroll: Only auto-scroll down if a new message was added and user is at bottom,
  // or if the message was sent by me. Background read-receipts or ticks will NOT fight scrolling!
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const newMsgAdded = messages.length > prevMessagesLengthRef.current;
    const lastMsg = messages[messages.length - 1];
    const sentByMe = lastMsg?.senderId === myClientId;

    if (prevMessagesLengthRef.current === 0) {
      el.scrollTop = el.scrollHeight;
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
    } else if (newMsgAdded && (isAtBottomRef.current || sentByMe)) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      isAtBottomRef.current = true;
      setShowScrollBottom(false);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, myClientId]);

  // Decrypt an incoming EncryptedMessage
  const decryptIncoming = useCallback(
    async (encMsg: EncryptedMessage, secret: string): Promise<DecryptedMessage> => {
      try {
        const decryptedContent = await decryptData(encMsg.payload, secret);
        return {
          id: encMsg.id,
          senderId: encMsg.senderId,
          senderName: encMsg.senderName,
          timestamp: encMsg.timestamp,
          type: encMsg.type,
          content: decryptedContent,
          isViewOnce: encMsg.isViewOnce,
          viewed: encMsg.viewed,
          viewedAt: encMsg.viewedAt,
          disappearingTimer: encMsg.disappearingTimer,
          expiresAt: encMsg.expiresAt,
          replyTo: encMsg.replyTo,
          reactions: encMsg.reactions,
          mediaMeta: encMsg.mediaMeta,
        };
      } catch (err) {
        console.error('Decryption failed for message:', encMsg.id, err);
        return {
          id: encMsg.id,
          senderId: encMsg.senderId,
          senderName: encMsg.senderName,
          timestamp: encMsg.timestamp,
          type: encMsg.type,
          content: '🔒 [Decryption failed - Check secret key]',
          decryptionError: true,
        };
      }
    },
    []
  );

  // Discreet browser notification helper when app is backgrounded
  const triggerDiscreetNotification = useCallback(
    (senderId: string) => {
      if (
        notificationsEnabled &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden' &&
        senderId !== myClientId
      ) {
        try {
          new Notification('CipherChat', {
            body: lang === 'hi' ? '🔒 नया सुरक्षित संदेश प्राप्त हुआ' : '🔒 New secure message received',
            icon: '/icon.svg',
            tag: 'cipherchat-msg',
          });
        } catch {}
      }
    },
    [notificationsEnabled, myClientId, lang]
  );

  // Initialize Real-time synchronization (SSE + BroadcastChannel)
  useEffect(() => {
    if (!roomId || !roomSecret) return;

    // Local BroadcastChannel for instant inter-tab coordination
    const bc = new BroadcastChannel(`secret_room_${roomId}`);
    broadcastChannelRef.current = bc;

    bc.onmessage = async (event) => {
      const { type, payload } = event.data;
      if (type === 'new_message') {
        const decrypted = await decryptIncoming(payload, roomSecret);
        triggerDiscreetNotification(decrypted.senderId);
        setMessages((prev) => {
          if (prev.some((m) => m.id === decrypted.id)) return prev;
          return [...prev, decrypted];
        });
      } else if (type === 'message_deleted') {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      } else if (type === 'room_cleared') {
        setMessages([]);
      } else if (type === 'message_viewed') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? { ...m, viewed: true, expiresAt: payload.expiresAt }
              : m
          )
        );
      } else if (type === 'messages_seen_batch') {
        const { updates } = payload;
        setMessages((prev) =>
          prev.map((m) => {
            const update = updates?.find((u: any) => u.messageId === m.id);
            if (update) {
              return {
                ...m,
                viewed: true,
                viewedAt: update.viewedAt,
                expiresAt: update.expiresAt || m.expiresAt,
              };
            }
            return m;
          })
        );
      }
    };

    // Server-Sent Events (SSE) with graceful static fallback
    const sse = new EventSource(`/api/rooms/${roomId}/events`);
    sseRef.current = sse;

    sse.onerror = () => {
      // Gracefully close on static hosts (like Vercel CDN) where Firestore handles sync
      sse.close();
    };

    sse.addEventListener('new_message', async (e: MessageEvent) => {
      const data: EncryptedMessage = JSON.parse(e.data);
      const decrypted = await decryptIncoming(data, roomSecret);
      triggerDiscreetNotification(decrypted.senderId);
      setMessages((prev) => {
        if (prev.some((m) => m.id === decrypted.id)) return prev;
        return [...prev, decrypted];
      });
    });

    sse.addEventListener('message_deleted', (e: MessageEvent) => {
      const { messageId } = JSON.parse(e.data);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    sse.addEventListener('message_expired', (e: MessageEvent) => {
      const { messageId } = JSON.parse(e.data);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    sse.addEventListener('message_viewed', (e: MessageEvent) => {
      const { messageId, expiresAt } = JSON.parse(e.data);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, viewed: true, expiresAt } : m
        )
      );
    });

    sse.addEventListener('messages_seen_batch', (e: MessageEvent) => {
      const { updates } = JSON.parse(e.data);
      setMessages((prev) =>
        prev.map((m) => {
          const update = updates?.find((u: any) => u.messageId === m.id);
          if (update) {
            return {
              ...m,
              viewed: true,
              viewedAt: update.viewedAt,
              expiresAt: update.expiresAt || m.expiresAt,
            };
          }
          return m;
        })
      );
    });

    sse.addEventListener('room_cleared', () => {
      setMessages([]);
    });

    sse.addEventListener('settings_updated', (e: MessageEvent) => {
      const { defaultTimer } = JSON.parse(e.data);
      if (typeof defaultTimer === 'number') {
        setDisappearingDuration(defaultTimer);
      }
    });

    sse.addEventListener('typing_update', (e: MessageEvent) => {
      const { typingUsers } = JSON.parse(e.data);
      const othersTyping = (typingUsers as string[]).filter((u) => u !== userName);
      if (othersTyping.length > 0) {
        setTypingText(`${othersTyping.join(', ')} ${t.typing}`);
      } else {
        setTypingText(null);
      }
    });

    // Fetch initial existing messages from server if available
    fetch(`/api/rooms/${roomId}/messages`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(async (data) => {
        if (!data) return;
        if (data.defaultTimer) {
          setDisappearingDuration(data.defaultTimer);
        }
        if (data.messages && Array.isArray(data.messages)) {
          const decryptedList: DecryptedMessage[] = [];
          for (const msg of data.messages) {
            const dec = await decryptIncoming(msg, roomSecret);
            decryptedList.push(dec);
          }
          setMessages(decryptedList);
        }
      })
      .catch(() => {
        // Graceful fallback: Firestore real-time listener loads messages directly
      });

    // Initialize or join Firestore room document
    initOrJoinRoom(roomId, disappearingDuration)
      .then((meta) => {
        if (meta && typeof meta.defaultTimer === 'number') {
          setDisappearingDuration(meta.defaultTimer);
        }
      })
      .catch((err) => console.warn('Firestore room init:', err));

    // Subscribe to Firestore room messages in real-time
    const unsubFirestore = subscribeToRoomMessages(
      roomId,
      async (encMsgs) => {
        const decryptedList: DecryptedMessage[] = [];
        for (const msg of encMsgs) {
          const dec = await decryptIncoming(msg, roomSecret);
          decryptedList.push(dec);
        }
        if (decryptedList.length > 0) {
          const newest = decryptedList[decryptedList.length - 1];
          if (newest && newest.senderId !== myClientId) {
            triggerDiscreetNotification(newest.senderId);
          }
        }
        setMessages(decryptedList);
      },
      (err) => console.error('Firestore messages sync error:', err)
    );
    firestoreUnsubRef.current = unsubFirestore;

    // Subscribe to Firestore room metadata (timers, typing)
    const unsubMeta = subscribeToRoomMeta(roomId, (meta) => {
      if (!meta) return;
      if (typeof meta.defaultTimer === 'number') {
        setDisappearingDuration(meta.defaultTimer);
      }
      if (meta.typingUsers) {
        const now = Date.now();
        const activeTypers = Object.entries(meta.typingUsers)
          .filter(([name, exp]) => name !== userName && exp > now)
          .map(([name]) => name);

        if (activeTypers.length > 0) {
          setTypingText(`${activeTypers.join(', ')} ${t.typing}`);
        } else {
          setTypingText(null);
        }
      }
    });
    firestoreMetaUnsubRef.current = unsubMeta;

    return () => {
      sse.close();
      bc.close();
      if (firestoreUnsubRef.current) firestoreUnsubRef.current();
      if (firestoreMetaUnsubRef.current) firestoreMetaUnsubRef.current();
    };
  }, [roomId, roomSecret, userName, decryptIncoming, t.typing, disappearingDuration, triggerDiscreetNotification, myClientId]);

  // Automatic Read Receipts: Mark unread partner messages as seen
  useEffect(() => {
    if (!roomId) return;

    // Find messages from partner that aren't marked viewed yet
    const unreadPartnerMsgs = messages.filter(
      (m) => m.senderId !== myClientId && !m.viewed && !m.isViewOnce
    );

    if (unreadPartnerMsgs.length === 0) return;

    const now = Date.now();
    const unreadIds = unreadPartnerMsgs.map((m) => m.id);

    // Optimistic local state update
    setMessages((prev) =>
      prev.map((m) => (unreadIds.includes(m.id) ? { ...m, viewed: true, viewedAt: now } : m))
    );

    // Notify other open tabs immediately
    broadcastChannelRef.current?.postMessage({
      type: 'messages_seen_batch',
      payload: {
        readerId: myClientId,
        updates: unreadIds.map((id) => ({ messageId: id, viewedAt: now })),
      },
    });

    // Mark in Firestore for persistent real-time read receipts (double blue checkmarks across devices)
    markBatchAsSeenInFirestore(
      roomId,
      unreadPartnerMsgs.map((m) => ({ id: m.id, disappearingTimer: m.disappearingTimer }))
    ).catch(() => {});

    // Notify server to broadcast SSE to partner's other devices
    fetch(`/api/rooms/${roomId}/read-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readerId: myClientId }),
    }).catch((err) => console.error('Failed to mark read-all:', err));
  }, [roomId, myClientId, messages.length]);

  // Send message
  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'video' | 'audio',
    isViewOnce: boolean,
    mediaMeta?: any
  ) => {
    if (!roomId || !roomSecret) return;

    const currentSenderId = myClientId;
    const currentSenderName = userName;
    const msgId = generateMessageId();
    const timestamp = Date.now();

    // 100% Client-Side End-to-End Encryption
    const encryptedPayload = await encryptData(content, roomSecret);

    const message: EncryptedMessage = {
      id: msgId,
      senderId: currentSenderId,
      senderName: currentSenderName,
      timestamp,
      type,
      payload: encryptedPayload,
      isViewOnce,
      disappearingTimer: disappearingDuration,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            snippet: replyingTo.type === 'text' ? replyingTo.content.slice(0, 40) : `[${replyingTo.type}]`,
          }
        : undefined,
      mediaMeta,
    };

    const localDecrypted: DecryptedMessage = {
      id: msgId,
      senderId: currentSenderId,
      senderName: currentSenderName,
      timestamp,
      type,
      content,
      isViewOnce,
      disappearingTimer: disappearingDuration,
      replyTo: message.replyTo,
      mediaMeta,
    };

    // Optimistic local update
    setMessages((prev) => [...prev, localDecrypted]);
    setReplyingTo(null);

    // Broadcast through BroadcastChannel
    broadcastChannelRef.current?.postMessage({
      type: 'new_message',
      payload: message,
    });

    // Save to Firestore real-time database
    sendEncryptedMessageToFirestore(roomId, message).catch((err) => {
      console.error('Firestore send failed:', err);
    });

    // Send to local server
    try {
      await fetch(`/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (err) {
      console.error('Failed to send message to server:', err);
    }
  };

  // Delete message for me
  const handleDeleteForMe = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  // Delete message for everyone
  const handleDeleteForEveryone = async (messageId: string) => {
    if (!roomId) return;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    broadcastChannelRef.current?.postMessage({
      type: 'message_deleted',
      payload: { messageId },
    });

    // Delete from Firestore
    deleteMessageFromFirestore(roomId, messageId).catch((err) => {
      console.error('Firestore delete failed:', err);
    });

    try {
      await fetch(`/api/rooms/${roomId}/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Delete request failed:', err);
    }
  };

  // Burn View Once Media
  const handleBurnMedia = async (messageId: string) => {
    if (!roomId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, viewed: true } : m))
    );

    broadcastChannelRef.current?.postMessage({
      type: 'message_viewed',
      payload: { messageId, expiresAt: Date.now() + 5000 },
    });

    // Mark burned in Firestore
    markMessageAsViewedInFirestore(roomId, messageId, 5).catch((err) => {
      console.error('Firestore burn failed:', err);
    });

    try {
      await fetch(`/api/rooms/${roomId}/messages/${messageId}/viewed`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Burn request failed:', err);
    }
  };

  // Nuclear wipe room
  const handleNuclearWipe = async () => {
    if (!roomId) return;
    setMessages([]);

    broadcastChannelRef.current?.postMessage({
      type: 'room_cleared',
      payload: { timestamp: Date.now() },
    });

    // Wipe from Firestore
    clearRoomInFirestore(roomId).catch((err) => {
      console.error('Firestore wipe failed:', err);
    });

    try {
      await fetch(`/api/rooms/${roomId}/all`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Nuclear wipe failed:', err);
    }
  };

  // Update room timer setting
  const handleUpdateTimer = async (seconds: number) => {
    setDisappearingDuration(seconds);
    if (!roomId) return;

    // Update in Firestore
    updateRoomDisappearingTimerInFirestore(roomId, seconds).catch((err) => {
      console.error('Firestore timer update failed:', err);
    });

    try {
      await fetch(`/api/rooms/${roomId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disappearingDuration: seconds }),
      });
    } catch (err) {
      console.error('Failed to update timer:', err);
    }
  };

  // Typing dispatch
  const handleTyping = () => {
    if (!roomId) return;
    const currentSenderId = myClientId;
    const currentSenderName = userName;

    // Update in Firestore
    updateTypingStatusInFirestore(roomId, currentSenderName, true).catch(() => {});

    fetch(`/api/rooms/${roomId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentSenderId,
        userName: currentSenderName,
        isTyping: true,
      }),
    }).catch(() => {});

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatusInFirestore(roomId, currentSenderName, false).catch(() => {});
      fetch(`/api/rooms/${roomId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentSenderId,
          userName: currentSenderName,
          isTyping: false,
        }),
      }).catch(() => {});
    }, 3000);
  };

  // Message Reaction
  const handleReact = (messageId: string, emoji: string) => {
    const currentSenderId = myClientId;
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];
        if (users.includes(currentSenderId)) {
          reactions[emoji] = users.filter((u) => u !== currentSenderId);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
          reactions[emoji] = [...users, currentSenderId];
        }
        return { ...msg, reactions };
      })
    );
  };

  // Security Passcode Lock screen when locked
  if (isLocked) {
    return (
      <PasscodeLock
        lang={lang}
        onUnlock={() => setIsLocked(false)}
        onSetCamouflage={(mode) => setCamouflageMode(mode)}
      />
    );
  }

  // Camouflage Overrides
  if (camouflageMode === 'calculator') {
    return (
      <CamouflageCalculator
        onUnlock={() => setCamouflageMode('none')}
        unlockPin={unlockPin}
      />
    );
  }

  if (camouflageMode === 'notes') {
    return (
      <CamouflageNotes
        onUnlock={() => setCamouflageMode('none')}
        unlockPin={unlockPin}
      />
    );
  }

  // Room Setup Screen if room not entered
  if (!roomId || !roomSecret) {
    return (
      <>
        <RoomSetup
          lang={lang}
          onToggleLang={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          onOpenInstallModal={() => setShowInstallModal(true)}
          isInstalled={isInstalled}
          onJoinRoom={(params) => {
            setRoomId(params.roomId);
            setRoomSecret(params.roomSecret);
            setUserName(params.userName);
            setPartnerName(params.partnerName);
            try {
              localStorage.setItem(
                'cipherchat_session',
                JSON.stringify({
                  roomId: params.roomId,
                  roomSecret: params.roomSecret,
                  userName: params.userName,
                  partnerName: params.partnerName,
                })
              );
            } catch {}
            // Set URL hash so refreshing keeps the session
            window.location.hash = `#room=${encodeURIComponent(params.roomId)}&key=${encodeURIComponent(params.roomSecret)}`;
          }}
        />
        <PWAInstallModal
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
          onInstall={install}
          isInstallable={isInstallable}
          isIOS={isIOS}
          lang={lang}
        />
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] flex flex-col overflow-hidden select-none transition-colors duration-200"
      style={{
        height: '100dvh',
        backgroundColor: themeColors.bg,
        color: themeColors.textPrimary,
      }}
    >
      {/* Authentic WhatsApp Wallpaper with subtle doodle art */}
      <WhatsAppWallpaper themeColors={themeColors} roomId={roomId || undefined} />

      {/* Screen Privacy Shield when window loses focus */}
      {isWindowBlurred && (
        <div
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4 cursor-pointer text-center animate-in fade-in duration-100"
        >
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-rose-400 mb-3 shadow-2xl">
            <EyeOff className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">{t.antiScreenshot}</h2>
          <p className="text-xs text-neutral-400 max-w-xs">
            {lang === 'hi'
              ? 'स्क्रीन छुप गई है। वापस देखने के लिए कहीं भी क्लिक करें।'
              : 'Screen obscured for privacy. Click anywhere to resume.'}
          </p>
        </div>
      )}

      {/* Chat Header */}
      <ChatHeader
        roomId={roomId}
        partnerName={partnerName}
        isOnline={true}
        typingText={typingText}
        lang={lang}
        onToggleLang={() => setLang(lang === 'hi' ? 'en' : 'hi')}
        onOpenRoomModal={() => setShowRoomModal(true)}
        onTriggerPanic={() => setCamouflageMode('calculator')}
        onSetCamouflage={(mode) => setCamouflageMode(mode)}
        onNuclearWipe={handleNuclearWipe}
        disappearingDuration={disappearingDuration}
        onSelectTimer={handleUpdateTimer}
        onOpenInstallModal={() => setShowInstallModal(true)}
        isInstalled={isInstalled}
        theme={theme}
        themeColors={themeColors}
        onSelectTheme={handleSelectTheme}
        onExitRoom={() => {
          if (window.confirm(t.leaveRoomConfirm)) {
            setRoomId(null);
            setRoomSecret(null);
            setMessages([]);
            try {
              localStorage.removeItem('cipherchat_session');
              window.location.hash = '';
            } catch {}
          }
        }}
        onLockApp={() => setIsLocked(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={toggleNotifications}
        isSearching={isSearching}
        onToggleSearch={() => {
          setIsSearching((prev) => !prev);
          if (isSearching) {
            setSearchQuery('');
          }
        }}
      />

      {/* In-Room Message Search Bar */}
      {isSearching && (
        <ChatSearchBar
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          totalMatches={matchingMessageIds.length}
          currentMatchIndex={currentMatchIndex}
          onNextMatch={handleNextMatch}
          onPrevMatch={handlePrevMatch}
          onClose={() => {
            setIsSearching(false);
            setSearchQuery('');
          }}
          lang={lang}
          themeColors={themeColors}
        />
      )}

      {/* Messages Scroll Area */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2 relative z-10 touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* E2EE Info Bubble banner at top of chat */}
        <div
          className="max-w-xs mx-auto my-3 p-2.5 rounded-xl border text-center text-[11px] leading-relaxed shadow-sm transition-colors"
          style={{
            backgroundColor: themeColors.systemMessageBg,
            borderColor: themeColors.border,
            color: themeColors.textSecondary,
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1.5"
            style={{
              backgroundColor: `${themeColors.accent}22`,
              color: themeColors.accent,
            }}
          >
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold block mb-0.5" style={{ color: themeColors.accent }}>
            {t.e2eeBadge}
          </span>
          <p>{t.e2eeDescription}</p>
        </div>

        {/* Render Messages */}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center max-w-sm mx-auto">
            <div
              className="w-14 h-14 rounded-3xl flex items-center justify-center mb-3 shadow-sm"
              style={{
                backgroundColor: themeColors.headerBg,
                color: themeColors.accent,
              }}
            >
              <Heart className="w-7 h-7 fill-rose-500/30 text-rose-400" />
            </div>
            <p className="text-sm font-semibold" style={{ color: themeColors.textPrimary }}>
              {lang === 'hi'
                ? `${partnerName} से सुरक्षित बातचीत शुरू करें 💕`
                : `Start your private conversation with ${partnerName} 💕`}
            </p>
            <p className="text-xs mt-1 mb-5" style={{ color: themeColors.textSecondary }}>
              {lang === 'hi'
                ? 'फ़ोटो, वीडियो या संदेश भेजें — सब एंड-टू-एंड एन्क्रिप्टेड है'
                : 'Send photos, videos, or voice notes — all end-to-end encrypted'}
            </p>

            {/* Non-Tech Partner Friendly 1-Touch WhatsApp Invite Card */}
            <div
              className="w-full p-4 rounded-2xl border text-left shadow-sm space-y-3"
              style={{
                backgroundColor: themeColors.systemMessageBg,
                borderColor: themeColors.border,
              }}
            >
              <div>
                <span className="text-xs font-bold block" style={{ color: themeColors.textPrimary }}>
                  {t.quickInviteTitle}
                </span>
                <p className="text-[11px] mt-0.5" style={{ color: themeColors.textSecondary }}>
                  {t.quickInviteSub}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${lang === 'hi' ? 'मेरी सीक्रेट चैट ज्वाइन करें 💕: ' : 'Join my private chat 💕: '}${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#room=${encodeURIComponent(roomId || '')}&key=${encodeURIComponent(roomSecret || '')}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.quickInviteBtn}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const fullLink = `${window.location.origin}${window.location.pathname}#room=${encodeURIComponent(roomId || '')}&key=${encodeURIComponent(roomSecret || '')}`;
                    navigator.clipboard.writeText(fullLink);
                    alert(lang === 'hi' ? 'लिंक कॉपी हो गया!' : 'Invite link copied!');
                  }}
                  className="py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition"
                  style={{
                    borderColor: themeColors.border,
                    color: themeColors.textPrimary,
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.quickCopyBtn}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMe={msg.senderId === myClientId}
              lang={lang}
              themeColors={themeColors}
              searchQuery={searchQuery}
              isCurrentSearchMatch={matchingMessageIds[currentMatchIndex] === msg.id}
              roomId={roomId || ''}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
              onReply={(m) => setReplyingTo(m)}
              onOpenMedia={(m) => {
                setActiveMediaMessage(m);
                if (m.isViewOnce) {
                  // Mark as viewed
                  handleBurnMedia(m.id);
                }
              }}
              onReact={handleReact}
            />
          ))
        )}
      </main>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottomSmooth}
          className="fixed bottom-24 right-4 z-30 p-2.5 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all transform active:scale-95 flex items-center justify-center"
          title={t.scrollToBottom}
          aria-label={t.scrollToBottom}
        >
          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      {/* Non-Tech Friendly Quick Starters (tap to send instant sweet message) */}
      <div
        className="px-3 pt-1 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t"
        style={{
          backgroundColor: themeColors.inputBg,
          borderColor: themeColors.border,
        }}
      >
        <span className="text-[10px] text-neutral-400 shrink-0 font-medium hidden sm:inline">
          {t.quickStartersTitle}
        </span>
        {[
          lang === 'hi' ? 'हाय 💕' : 'Hi 💕',
          lang === 'hi' ? 'कैसी हो? 😊' : 'How are you? 😊',
          lang === 'hi' ? 'फ़ोटो भेजो 📷' : 'Send a pic 📷',
          lang === 'hi' ? 'कहाँ हो? 📍' : 'Where are you? 📍',
          lang === 'hi' ? 'Love you ❤️' : 'Love you ❤️',
        ].map((starter, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(starter, 'text', false)}
            className="px-2.5 py-1 rounded-full text-xs shrink-0 border bg-black/5 dark:bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-600 transition active:scale-95"
            style={{
              borderColor: themeColors.border,
              color: themeColors.textPrimary,
            }}
          >
            {starter}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        lang={lang}
        onTyping={handleTyping}
        themeColors={themeColors}
      />

      {/* Room Modal (Invite Girlfriend / QR / Safety Numbers) */}
      {showRoomModal && (
        <RoomModal
          roomId={roomId}
          roomSecret={roomSecret}
          lang={lang}
          onClose={() => setShowRoomModal(false)}
          disappearingDuration={disappearingDuration}
          onUpdateDisappearingDuration={handleUpdateTimer}
        />
      )}

      {/* Fullscreen Media Viewer */}
      {activeMediaMessage && (
        <MediaViewer
          message={activeMediaMessage}
          lang={lang}
          onClose={() => setActiveMediaMessage(null)}
          onBurnMedia={handleBurnMedia}
        />
      )}

      {/* PWA Install Popup */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onInstall={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
        lang={lang}
      />
    </div>
  );
}
