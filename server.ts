import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { EncryptedMessage } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Increase body parser limit to support encrypted photo & video chunks
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

interface RoomState {
  id: string;
  created: number;
  messages: EncryptedMessage[];
  sseClients: Set<Response>;
  typingUsers: Map<string, { name: string; expires: number }>;
  defaultTimer: number; // in seconds
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      created: Date.now(),
      messages: [],
      sseClients: new Set<Response>(),
      typingUsers: new Map(),
      defaultTimer: 0,
    };
    rooms.set(roomId, room);
  }
  return room;
}

// Broadcast SSE event to all connected clients in a room
function broadcastToRoom(roomId: string, event: string, data: any) {
  const room = rooms.get(roomId);
  if (!room) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of room.sseClients) {
    try {
      client.write(payload);
    } catch {
      room.sseClients.delete(client);
    }
  }
}

// Periodically clean expired disappearing messages
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    const initialCount = room.messages.length;
    room.messages = room.messages.filter((msg) => {
      if (msg.expiresAt && msg.expiresAt <= now) {
        broadcastToRoom(roomId, 'message_expired', { messageId: msg.id });
        return false;
      }
      return true;
    });

    // Clean typing users
    for (const [userId, info] of room.typingUsers.entries()) {
      if (info.expires <= now) {
        room.typingUsers.delete(userId);
      }
    }
  }
}, 1000);

// API: Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now(), roomsActive: rooms.size });
});

// API: Server-Sent Events stream for real-time live messages
app.get('/api/rooms/:roomId/events', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  room.sseClients.add(res);

  // Send initial connect handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ roomId, defaultTimer: room.defaultTimer })}\n\n`);

  // Keep-alive ping every 15 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(': keepalive ping\n\n');
    } catch {
      clearInterval(pingInterval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(pingInterval);
    room.sseClients.delete(res);
  });
});

// API: Fetch messages
app.get('/api/rooms/:roomId/messages', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  res.json({
    roomId,
    messages: room.messages,
    defaultTimer: room.defaultTimer,
  });
});

// API: Post encrypted message
app.post('/api/rooms/:roomId/messages', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  const message: EncryptedMessage = req.body;

  if (!message || !message.id || !message.payload) {
    res.status(400).json({ error: 'Invalid message payload' });
    return;
  }

  // Calculate expiration if timer set
  if (message.disappearingTimer && message.disappearingTimer > 0) {
    message.expiresAt = Date.now() + message.disappearingTimer * 1000;
  }

  room.messages.push(message);

  // Broadcast new message to other participants
  broadcastToRoom(roomId, 'new_message', message);

  res.status(201).json({ success: true, messageId: message.id });
});

// API: Delete single message (Delete for Everyone)
app.delete('/api/rooms/:roomId/messages/:messageId', (req: Request, res: Response) => {
  const { roomId, messageId } = req.params;
  const room = getOrCreateRoom(roomId);

  const prevLen = room.messages.length;
  room.messages = room.messages.filter((m) => m.id !== messageId);

  if (room.messages.length < prevLen) {
    broadcastToRoom(roomId, 'message_deleted', { messageId });
  }

  res.json({ success: true, messageId });
});

// API: Mark viewed (for View-Once media or reading receipt)
app.post('/api/rooms/:roomId/messages/:messageId/viewed', (req: Request, res: Response) => {
  const { roomId, messageId } = req.params;
  const room = getOrCreateRoom(roomId);

  const msg = room.messages.find((m) => m.id === messageId);
  if (!msg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  msg.viewed = true;
  msg.viewedAt = Date.now();

  // If view-once, start burning or burn immediately
  if (msg.isViewOnce) {
    // Schedule deletion in 5 seconds to allow brief inspection
    msg.expiresAt = Date.now() + 5000;
  } else if (msg.disappearingTimer && msg.disappearingTimer > 0 && !msg.expiresAt) {
    // Start countdown on read
    msg.expiresAt = Date.now() + msg.disappearingTimer * 1000;
  }

  broadcastToRoom(roomId, 'message_viewed', {
    messageId,
    viewedAt: msg.viewedAt,
    expiresAt: msg.expiresAt,
  });

  res.json({ success: true, messageId, expiresAt: msg.expiresAt });
});

// API: Mark all messages as read by partner (Read receipts / Double checkmarks)
app.post('/api/rooms/:roomId/read-all', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { readerId } = req.body;
  const room = getOrCreateRoom(roomId);
  const now = Date.now();
  const readUpdates: { messageId: string; viewedAt: number; expiresAt?: number }[] = [];

  for (const msg of room.messages) {
    if (msg.senderId !== readerId && !msg.viewed) {
      msg.viewed = true;
      msg.viewedAt = now;
      if (msg.isViewOnce) {
        msg.expiresAt = now + 5000;
      } else if (msg.disappearingTimer && msg.disappearingTimer > 0 && !msg.expiresAt) {
        msg.expiresAt = now + msg.disappearingTimer * 1000;
      }
      readUpdates.push({
        messageId: msg.id,
        viewedAt: msg.viewedAt,
        expiresAt: msg.expiresAt,
      });
    }
  }

  if (readUpdates.length > 0) {
    broadcastToRoom(roomId, 'messages_seen_batch', {
      updates: readUpdates,
      readerId,
    });
  }

  res.json({ success: true, count: readUpdates.length });
});

// API: Nuclear Panic Clear Room (All messages deleted immediately)
app.delete('/api/rooms/:roomId/all', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);

  room.messages = [];
  broadcastToRoom(roomId, 'room_cleared', { timestamp: Date.now() });

  res.json({ success: true, roomId, message: 'All messages wiped' });
});

// API: Update room disappearing timer
app.post('/api/rooms/:roomId/settings', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  const { disappearingDuration } = req.body;

  if (typeof disappearingDuration === 'number') {
    room.defaultTimer = disappearingDuration;
    broadcastToRoom(roomId, 'settings_updated', { defaultTimer: room.defaultTimer });
  }

  res.json({ success: true, defaultTimer: room.defaultTimer });
});

// API: Typing indicator
app.post('/api/rooms/:roomId/typing', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  const { userId, userName, isTyping } = req.body;

  if (isTyping) {
    room.typingUsers.set(userId, { name: userName || 'Partner', expires: Date.now() + 4000 });
  } else {
    room.typingUsers.delete(userId);
  }

  broadcastToRoom(roomId, 'typing_update', {
    typingUsers: Array.from(room.typingUsers.values()).map((u) => u.name),
  });

  res.json({ success: true });
});

// Vite middleware / Static file hosting
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (isProduction: ${isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
