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
import { usePWAInstall } from './hooks/usePWAInstall';
import { ShieldCheck, Heart, EyeOff, Lock, Database } from 'lucide-react';
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

  // Theme selection with localStorage persistence
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('secret_chat_theme') as AppTheme) || 'whatsapp';
    }
    return 'whatsapp';
  });
  const themeColors: ThemeColors = resolveTheme(theme);

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('secret_chat_theme', newTheme);
    }
  };

  // PWA Install State
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Room Credentials & Session
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomSecret, setRoomSecret] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User 1');
  const [partnerName, setPartnerName] = useState<string>('Partner');
  const [activeRole, setActiveRole] = useState<'you' | 'partner'>('you');

  // Messages & UI
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [disappearingDuration, setDisappearingDuration] = useState<number>(0);
  const [replyingTo, setReplyingTo] = useState<DecryptedMessage | null>(null);
  const [activeMediaMessage, setActiveMediaMessage] = useState<DecryptedMessage | null>(null);
  const [typingText, setTypingText] = useState<string | null>(null);

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

  // Autostart handler for automated test checks (?autostart=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1' && !roomId) {
      const demoRoom = 'secret-nest-8492';
      const demoKey = 'demo-ultra-secure-key-2026';
      setRoomId(demoRoom);
      setRoomSecret(demoKey);
      setUserName('User 1');
      setPartnerName('Partner');
    }
  }, [roomId]);

  // Handle URL hash changes (#room=...&key=...&role=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const r = params.get('room');
        const k = params.get('key');
        const role = params.get('role');
        if (r && k) {
          setRoomId(r);
          setRoomSecret(k);
          if (role === 'partner') {
            setActiveRole('partner');
            setUserName(lang === 'hi' ? 'पार्टनर' : 'Partner');
            setPartnerName(lang === 'hi' ? 'आप' : 'You');
          }
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [lang]);

  // Update browser document title based on disguise
  useEffect(() => {
    if (camouflageMode === 'calculator') {
      document.title = 'Calculator - Basic & Scientific Math';
    } else if (camouflageMode === 'notes') {
      document.title = 'Notes - Quick Workspace';
    } else {
      document.title = 'SecretCouples - End-to-End Encrypted Private Chat';
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

  // Scroll to bottom on new messages inside the inner container only
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const currentSenderName = activeRole === 'you' ? userName : partnerName;
      const othersTyping = (typingUsers as string[]).filter((u) => u !== currentSenderName);
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
        const currentSenderName = activeRole === 'you' ? userName : partnerName;
        const activeTypers = Object.entries(meta.typingUsers)
          .filter(([name, exp]) => name !== currentSenderName && exp > now)
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
  }, [roomId, roomSecret, activeRole, userName, partnerName, decryptIncoming, t.typing, disappearingDuration]);

  // Prompt install popup automatically once entered room if not installed
  useEffect(() => {
    if (roomId && !isInstalled) {
      const alreadyPrompted = sessionStorage.getItem('pwa_prompt_shown');
      if (!alreadyPrompted) {
        const tId = setTimeout(() => {
          setShowInstallModal(true);
          sessionStorage.setItem('pwa_prompt_shown', 'true');
        }, 1500);
        return () => clearTimeout(tId);
      }
    }
  }, [roomId, isInstalled]);

  // Automatic Read Receipts: Mark unread partner messages as seen
  useEffect(() => {
    if (!roomId) return;
    const currentSenderId = activeRole === 'you' ? 'user_1' : 'user_2';

    // Find messages from partner that aren't marked viewed yet
    const unreadPartnerMsgs = messages.filter(
      (m) => m.senderId !== currentSenderId && !m.viewed && !m.isViewOnce
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
        readerId: currentSenderId,
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
      body: JSON.stringify({ readerId: currentSenderId }),
    }).catch((err) => console.error('Failed to mark read-all:', err));
  }, [roomId, activeRole, messages.length]);

  // Send message
  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'video' | 'audio',
    isViewOnce: boolean,
    mediaMeta?: any
  ) => {
    if (!roomId || !roomSecret) return;

    const currentSenderId = activeRole === 'you' ? 'user_1' : 'user_2';
    const currentSenderName = activeRole === 'you' ? userName : partnerName;
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
    const currentSenderId = activeRole === 'you' ? 'user_1' : 'user_2';
    const currentSenderName = activeRole === 'you' ? userName : partnerName;

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
    const currentSenderId = activeRole === 'you' ? 'user_1' : 'user_2';
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

  const currentSenderId = activeRole === 'you' ? 'user_1' : 'user_2';
  const displayPartnerName = activeRole === 'you' ? partnerName : userName;

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
        partnerName={displayPartnerName}
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
        activeRole={activeRole}
        onToggleRole={() => setActiveRole(activeRole === 'you' ? 'partner' : 'you')}
        onOpenInstallModal={() => setShowInstallModal(true)}
        isInstalled={isInstalled}
        theme={theme}
        themeColors={themeColors}
        onSelectTheme={handleSelectTheme}
        onExitRoom={() => {
          setRoomId(null);
          setRoomSecret(null);
          window.location.hash = '';
        }}
      />

      {/* Messages Scroll Area */}
      <main
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2 relative z-10"
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
          <div
            className="flex flex-col items-center justify-center h-48 text-center"
            style={{ color: themeColors.textSecondary }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
              style={{
                backgroundColor: themeColors.headerBg,
                color: themeColors.accent,
              }}
            >
              <Heart className="w-6 h-6 fill-rose-500/30 text-rose-400" />
            </div>
            <p className="text-xs font-medium" style={{ color: themeColors.textPrimary }}>
              {lang === 'hi'
                ? `${displayPartnerName} से सुरक्षित बातचीत शुरू करें 💕`
                : `Start your private conversation with ${displayPartnerName} 💕`}
            </p>
            <p className="text-[10px] mt-1" style={{ color: themeColors.textSecondary }}>
              {lang === 'hi'
                ? 'फ़ोटो, वीडियो या संदेश भेजें — सब एंड-टू-एंड एन्क्रिप्टेड है'
                : 'Send photos, videos, or voice notes — all end-to-end encrypted'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMe={msg.senderId === currentSenderId}
              lang={lang}
              themeColors={themeColors}
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
