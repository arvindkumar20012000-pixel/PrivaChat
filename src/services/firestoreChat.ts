import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { EncryptedMessage } from '../types';

export interface RoomMeta {
  id: string;
  created: number;
  defaultTimer?: number;
  lastActivity?: number;
  typingUsers?: Record<string, number>; // username -> expiry timestamp
}

/**
 * Initializes or joins an encrypted room in Firestore
 */
export async function initOrJoinRoom(roomId: string, defaultTimer: number = 0): Promise<RoomMeta> {
  const roomPath = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);

    if (snap.exists()) {
      const data = snap.data() as RoomMeta;
      return data;
    } else {
      const newRoom: RoomMeta = {
        id: roomId,
        created: Date.now(),
        defaultTimer,
        lastActivity: Date.now(),
      };
      await setDoc(roomRef, newRoom);
      return newRoom;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, roomPath);
    throw error;
  }
}

/**
 * Subscribes to real-time messages in a room
 */
export function subscribeToRoomMessages(
  roomId: string,
  onUpdate: (messages: EncryptedMessage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const messagesPath = `rooms/${roomId}/messages`;
  const messagesCol = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(150));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const msgs: EncryptedMessage[] = [];
      const now = Date.now();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as EncryptedMessage;
        // Filter out expired disappearing messages on the fly
        if (data.expiresAt && data.expiresAt <= now) {
          // Asynchronously clean up expired document
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }
        msgs.push(data);
      });

      onUpdate(msgs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, messagesPath);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );

  return unsubscribe;
}

/**
 * Subscribes to room metadata (default timers, typing indicators)
 */
export function subscribeToRoomMeta(
  roomId: string,
  onMeta: (meta: RoomMeta | null) => void
): () => void {
  const roomPath = `rooms/${roomId}`;
  const roomRef = doc(db, 'rooms', roomId);

  const unsubscribe = onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onMeta(snapshot.data() as RoomMeta);
      } else {
        onMeta(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, roomPath);
      } catch (e) {
        console.error('Room meta snapshot error:', e);
      }
    }
  );

  return unsubscribe;
}

/**
 * Saves a new encrypted message to Firestore
 */
export async function sendEncryptedMessageToFirestore(
  roomId: string,
  message: EncryptedMessage
): Promise<void> {
  const msgPath = `rooms/${roomId}/messages/${message.id}`;
  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', message.id);
    
    // Clean undefined fields before writing to Firestore
    const cleanPayload: any = {
      iv: message.payload.iv,
      ciphertext: message.payload.ciphertext,
      salt: message.payload.salt,
    };

    const cleanMsg: any = {
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: message.timestamp,
      type: message.type,
      payload: cleanPayload,
      isViewOnce: Boolean(message.isViewOnce),
      viewed: Boolean(message.viewed),
    };

    if (message.viewedAt) cleanMsg.viewedAt = message.viewedAt;
    if (message.disappearingTimer) cleanMsg.disappearingTimer = message.disappearingTimer;
    if (message.expiresAt) cleanMsg.expiresAt = message.expiresAt;
    if (message.replyTo) cleanMsg.replyTo = message.replyTo;
    if (message.reactions) cleanMsg.reactions = message.reactions;
    if (message.mediaMeta) cleanMsg.mediaMeta = message.mediaMeta;

    await setDoc(msgRef, cleanMsg);

    // Update room lastActivity timestamp
    const roomRef = doc(db, 'rooms', roomId);
    updateDoc(roomRef, { lastActivity: Date.now() }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
    throw error;
  }
}

/**
 * Marks a view-once message as viewed, triggering the burn timer
 */
export async function markMessageAsViewedInFirestore(
  roomId: string,
  messageId: string,
  burnTimerSeconds: number = 0
): Promise<void> {
  const msgPath = `rooms/${roomId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
    const updates: any = {
      viewed: true,
      viewedAt: Date.now(),
    };
    if (burnTimerSeconds > 0) {
      updates.expiresAt = Date.now() + burnTimerSeconds * 1000;
    }
    await updateDoc(msgRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, msgPath);
  }
}

/**
 * Marks all incoming messages from partner as seen (Double Blue Checkmarks)
 */
export async function markBatchAsSeenInFirestore(
  roomId: string,
  messagesToMark: { id: string; disappearingTimer?: number }[]
): Promise<void> {
  if (messagesToMark.length === 0) return;
  const now = Date.now();

  for (const m of messagesToMark) {
    const msgRef = doc(db, 'rooms', roomId, 'messages', m.id);
    const updates: any = {
      viewed: true,
      viewedAt: now,
    };
    if (m.disappearingTimer && m.disappearingTimer > 0) {
      updates.expiresAt = now + m.disappearingTimer * 1000;
    }
    updateDoc(msgRef, updates).catch(() => {});
  }
}

/**
 * Deletes a message for everyone from Firestore
 */
export async function deleteMessageFromFirestore(
  roomId: string,
  messageId: string
): Promise<void> {
  const msgPath = `rooms/${roomId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
    await deleteDoc(msgRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, msgPath);
  }
}

/**
 * Clears the entire chat room
 */
export async function clearRoomInFirestore(roomId: string): Promise<void> {
  const messagesPath = `rooms/${roomId}/messages`;
  try {
    const messagesCol = collection(db, 'rooms', roomId, 'messages');
    const snap = await getDocs(messagesCol);
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, messagesPath);
  }
}

/**
 * Updates default disappearing timer for the room
 */
export async function updateRoomDisappearingTimerInFirestore(
  roomId: string,
  timerSeconds: number
): Promise<void> {
  const roomPath = `rooms/${roomId}`;
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { defaultTimer: timerSeconds, lastActivity: Date.now() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, roomPath);
  }
}

/**
 * Updates typing status for user in the room
 */
export async function updateTypingStatusInFirestore(
  roomId: string,
  userDisplayName: string,
  isTyping: boolean
): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const currentData = snap.data() as RoomMeta;
    const typingUsers = { ...(currentData.typingUsers || {}) };

    if (isTyping) {
      typingUsers[userDisplayName] = Date.now() + 4000; // expires in 4 seconds
    } else {
      delete typingUsers[userDisplayName];
    }

    await updateDoc(roomRef, { typingUsers });
  } catch {
    // Non-fatal, typing indicators can fail gracefully
  }
}
