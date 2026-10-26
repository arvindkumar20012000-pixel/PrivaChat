import React, { useState, useEffect } from 'react';
import {
  MoreVertical,
  Trash2,
  Reply,
  Heart,
  Eye,
  EyeOff,
  Flame,
  Check,
  CheckCheck,
  Clock,
  Lock,
  Play
} from 'lucide-react';
import { DecryptedMessage } from '../types';
import { Language, translations } from '../translations';
import { AudioPlayerBubble } from './AudioRecorder';
import { ThemeColors } from '../utils/theme';

interface MessageItemProps {
  message: DecryptedMessage;
  isMe: boolean;
  lang: Language;
  themeColors: ThemeColors;
  onDeleteForMe: (id: string) => void;
  onDeleteForEveryone: (id: string) => void;
  onReply: (msg: DecryptedMessage) => void;
  onOpenMedia: (msg: DecryptedMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMe,
  lang,
  themeColors,
  onDeleteForMe,
  onDeleteForEveryone,
  onReply,
  onOpenMedia,
  onReact,
}) => {
  const t = translations[lang];
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBlurred, setIsBlurred] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Expiration countdown
  useEffect(() => {
    if (!message.expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((message.expiresAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [message.expiresAt]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const reactionEmojis = ['❤️', '🔥', '💋', '🤫', '🔒', '👍'];

  return (
    <div
      className={`group relative flex flex-col mb-3 px-3 select-none ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for received messages */}
      {!isMe && (
        <span className="text-[11px] font-medium text-neutral-400 mb-1 ml-1 flex items-center gap-1">
          <span>{message.senderName}</span>
          {message.isViewOnce && (
            <span className="text-rose-400 text-[10px] flex items-center gap-0.5">
              • <Flame className="w-3 h-3" /> View Once
            </span>
          )}
        </span>
      )}

      {/* Reply Reference Preview */}
      {message.replyTo && (
        <div
          className={`text-[11px] mb-1 px-3 py-1 rounded-xl max-w-xs truncate border-l-2 bg-neutral-900/80 ${
            isMe ? 'border-rose-400 text-neutral-300' : 'border-rose-500 text-neutral-400'
          }`}
        >
          <span className="font-semibold text-rose-400 mr-1">{message.replyTo.senderName}:</span>
          <span>{message.replyTo.snippet}</span>
        </div>
      )}

      {/* Main Bubble Container */}
      <div className="relative max-w-[85%] sm:max-w-md">
        <div
          className={`relative rounded-2xl px-3.5 py-2 shadow-sm transition-all text-sm leading-relaxed ${
            isMe ? 'rounded-tr-none' : 'rounded-tl-none'
          }`}
          style={{
            backgroundColor: isMe ? themeColors.myBubble : themeColors.partnerBubble,
            color: isMe ? themeColors.myBubbleText : themeColors.partnerBubbleText,
          }}
        >
          {/* View Once Media (Burned or Pending) */}
          {message.isViewOnce ? (
            message.viewed ? (
              <div className="flex items-center gap-2 p-2 text-xs text-rose-300/80 font-medium">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>{t.viewedOnceNotice}</span>
              </div>
            ) : (
              <button
                onClick={() => onOpenMedia(message)}
                className="flex items-center gap-3 p-3 bg-black/30 hover:bg-black/50 rounded-2xl border border-white/10 transition w-full text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 animate-pulse">
                  <Flame className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{message.type === 'video' ? t.video : t.photo}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-rose-500 text-white rounded-full">1</span>
                  </div>
                  <p className="text-[11px] text-neutral-300/80">
                    {lang === 'hi' ? 'टैप करके देखें (1 बार देखने के बाद मिट जाएगी)' : 'Tap to open (Burns after opening)'}
                  </p>
                </div>
              </button>
            )
          ) : (
            <>
              {/* Normal Media: Photo */}
              {message.type === 'image' && (
                <div className="relative rounded-2xl overflow-hidden mb-1.5 cursor-pointer group/media max-h-80">
                  <img
                    src={message.content}
                    alt="Encrypted attachment"
                    className={`w-full max-h-80 object-cover rounded-2xl transition duration-300 ${
                      isBlurred ? 'filter blur-xl scale-105' : 'filter-none scale-100'
                    }`}
                    onClick={() => {
                      if (isBlurred) setIsBlurred(false);
                      else onOpenMedia(message);
                    }}
                  />
                  {isBlurred && (
                    <button
                      onClick={() => setIsBlurred(false)}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-2 text-center"
                    >
                      <Eye className="w-6 h-6 mb-1 text-white drop-shadow" />
                      <span className="text-xs font-semibold drop-shadow">{t.sensitiveMedia}</span>
                    </button>
                  )}
                  {!isBlurred && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBlurred(true);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                      title="Blur media"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Normal Media: Video */}
              {message.type === 'video' && (
                <div className="relative rounded-2xl overflow-hidden mb-1.5 cursor-pointer max-h-80">
                  <video
                    src={message.content}
                    className="w-full max-h-80 rounded-2xl object-cover"
                    onClick={() => onOpenMedia(message)}
                  />
                  <button
                    onClick={() => onOpenMedia(message)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-rose-600/90 flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </button>
                </div>
              )}

              {/* Voice Note Audio */}
              {message.type === 'audio' && (
                <AudioPlayerBubble
                  src={message.content}
                  duration={message.mediaMeta?.duration}
                  isMe={isMe}
                />
              )}

              {/* Text Message */}
              {message.type === 'text' && (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </p>
              )}
            </>
          )}

          {/* Bubble Footer: Expiration timer + Timestamp + Read Status */}
          <div
            className="flex items-center justify-end gap-1 mt-1 text-[11px] select-none"
            style={{
              color: isMe ? themeColors.myBubbleMeta : themeColors.partnerBubbleMeta,
            }}
          >
            {/* Countdown timer badge if disappearing */}
            {timeLeft !== null && timeLeft > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/20 text-amber-300 font-mono font-bold text-[9px] animate-pulse">
                <Clock className="w-2.5 h-2.5" />
                <span>{timeLeft}s</span>
              </span>
            )}

            <span className="text-[10px]">{formatTime(message.timestamp)}</span>

            {isMe && (
              <span
                className="inline-flex items-center ml-0.5 cursor-help"
                title={
                  message.viewed
                    ? `${t.seen} ${
                        message.viewedAt
                          ? `(${new Date(message.viewedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })})`
                          : ''
                      }`
                    : t.sent
                }
              >
                {message.viewed ? (
                  <CheckCheck
                    className="w-4 h-4 inline stroke-[2.2]"
                    style={{ color: themeColors.checkColor }}
                  />
                ) : (
                  <Check
                    className="w-3.5 h-3.5 inline opacity-70 stroke-[2.2]"
                    style={{ color: themeColors.myBubbleMeta }}
                  />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Floating Quick Action trigger on hover */}
        <div
          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center gap-1 z-20 ${
            isMe ? '-left-14' : '-right-14'
          }`}
        >
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white shadow hover:scale-110 transition"
            title="React"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white shadow hover:scale-110 transition"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Click-outside backdrop for message menu and emoji picker */}
        {(showMenu || showEmojiPicker) && (
          <div
            className="fixed inset-0 z-30 bg-transparent"
            onClick={() => {
              setShowMenu(false);
              setShowEmojiPicker(false);
            }}
            aria-hidden="true"
          />
        )}

        {/* Emoji Reaction Bar */}
        {showEmojiPicker && (
          <div
            className={`absolute -top-10 bg-neutral-900 border border-neutral-700 rounded-full px-2 py-1 shadow-2xl flex items-center gap-1 z-40 animate-in zoom-in-95 duration-100 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(message.id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="hover:scale-125 transition text-sm p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Options Dropdown Menu */}
        {showMenu && (
          <div
            className={`absolute top-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-40 w-44 text-xs font-medium space-y-1 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            <button
              onClick={() => {
                onReply(message);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
            >
              <Reply className="w-3.5 h-3.5 text-rose-400" />
              <span>{lang === 'hi' ? 'जवाब दें' : 'Reply'}</span>
            </button>

            <button
              onClick={() => {
                onDeleteForMe(message.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>{t.deleteForMe}</span>
            </button>

            {isMe && (
              <button
                onClick={() => {
                  onDeleteForEveryone(message.id);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-400 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>{t.deleteForEveryone}</span>
              </button>
            )}
          </div>
        )}

        {/* Display attached reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(message.reactions).map(([emoji, senders]) => (
              <span
                key={emoji}
                className="text-xs bg-neutral-900/90 border border-neutral-700/80 rounded-full px-2 py-0.5 text-white flex items-center gap-1 shadow-sm"
              >
                <span>{emoji}</span>
                {senders.length > 1 && (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {senders.length}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
