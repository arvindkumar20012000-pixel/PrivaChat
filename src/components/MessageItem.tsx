import React, { useState, useEffect } from 'react';
import {
  MoreVertical,
  Trash2,
  Reply,
  Heart,
  Eye,
  EyeOff,
  Flame,
  CheckCheck,
  Clock,
  Lock,
  Play,
  Info,
} from 'lucide-react';
import { DecryptedMessage } from '../types';
import { Language, translations } from '../translations';
import { AudioPlayerBubble } from './AudioRecorder';
import { ThemeColors } from '../utils/theme';
import { MessageInfoModal } from './MessageInfoModal';
import { formatHumanReadableTime } from '../utils/formatTime';

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
  searchQuery?: string;
  isCurrentSearchMatch?: boolean;
  roomId?: string;
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
  searchQuery = '',
  isCurrentSearchMatch = false,
  roomId = '',
}) => {
  const t = translations[lang];
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
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

  // Subtle double-check delivery / read status indicator
  const renderDoubleCheck = () => {
    if (!isMe) return null;
    const isRead = !!message.viewed;
    const statusText = isRead
      ? (lang === 'hi' ? 'पढ़ा गया (Blue Ticks - Seen)' : 'Read (Seen)')
      : (lang === 'hi' ? 'पहुंचा दिया गया (Grey Ticks - Delivered)' : 'Delivered');

    return (
      <span
        className="inline-flex items-center ml-1 select-none transition-colors duration-200"
        title={statusText}
        aria-label={statusText}
      >
        <CheckCheck
          className={`w-3.5 h-3.5 inline transition-colors duration-200 ${
            isRead
              ? 'stroke-[2.5] text-[#53bdeb]'
              : 'stroke-[2] text-[#8696a0] opacity-75'
          }`}
          style={{
            color: isRead ? themeColors.checkColor : '#8696a0',
          }}
        />
      </span>
    );
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex w-full mb-2 px-1 sm:px-2 transition-all ${
        isMe ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Reply Reference Preview if any */}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
        {message.replyTo && (
          <div
            className={`text-[11px] mb-1 px-3 py-1 rounded-xl max-w-xs truncate border-l-2 bg-neutral-900/80 ${
              isMe ? 'border-emerald-400 text-neutral-300' : 'border-rose-400 text-neutral-300'
            }`}
          >
            <span className="font-semibold text-rose-300 mr-1">
              {isMe ? (lang === 'hi' ? 'जवाब' : 'Reply') : (lang === 'hi' ? 'संदेश' : 'Message')}:
            </span>
            <span>{message.replyTo.snippet}</span>
          </div>
        )}

        {/* Main Bubble Container with genuine messenger dimensions */}
        <div className="relative group/bubble">
          <div
            className={`relative w-fit min-w-[76px] rounded-2xl shadow-sm transition-all text-sm leading-relaxed ${
              message.type === 'text' ? 'px-3 pt-2 pb-1.5' : 'p-1.5 pb-1'
            } ${isMe ? 'rounded-tr-xs' : 'rounded-tl-xs'} ${
              isCurrentSearchMatch
                ? 'ring-2 ring-amber-400 ring-offset-2 scale-[1.02] shadow-md z-20'
                : ''
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
                  className="flex items-center gap-3 p-3 bg-black/30 hover:bg-black/50 rounded-xl border border-white/10 transition w-60 sm:w-68 text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 shrink-0 animate-pulse">
                    <Flame className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{message.type === 'video' ? t.video : t.photo}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-rose-500 text-white rounded-full">1</span>
                    </div>
                    <p className="text-[10px] text-neutral-300/80 truncate">
                      {lang === 'hi' ? 'टैप करके देखें' : 'Tap to open'}
                    </p>
                  </div>
                </button>
              )
            ) : (
              <>
                {/* Normal Media: Photo */}
                {message.type === 'image' && (
                  <div className="relative rounded-xl overflow-hidden mb-1 cursor-pointer w-60 sm:w-72 max-w-full">
                    <img
                      src={message.content}
                      alt="Attachment"
                      className={`w-full max-h-72 object-cover rounded-xl transition duration-300 ${
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
                  <div className="relative rounded-xl overflow-hidden mb-1 cursor-pointer w-60 sm:w-72 max-w-full">
                    <video
                      src={message.content}
                      className="w-full max-h-72 rounded-xl object-cover"
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
                  <div className="w-60 sm:w-72">
                    <AudioPlayerBubble
                      src={message.content}
                      duration={message.mediaMeta?.duration}
                      isMe={isMe}
                    />
                  </div>
                )}

                {/* Text Message with WhatsApp wrap alignment */}
                {message.type === 'text' && (
                  <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-0.5">
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed flex-1 min-w-[3rem]">
                      {searchQuery.trim()
                        ? message.content.split(
                            new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
                          ).map((part, idx) =>
                            part.toLowerCase() === searchQuery.trim().toLowerCase() ? (
                              <mark
                                key={idx}
                                className="bg-amber-300 text-neutral-900 font-bold px-0.5 rounded shadow-xs"
                              >
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )
                        : message.content}
                    </p>
                    <div
                      className="flex items-center gap-1 text-[10px] ml-auto shrink-0 select-none pb-0.5"
                      style={{
                        color: isMe ? themeColors.myBubbleMeta : themeColors.partnerBubbleMeta,
                      }}
                    >
                      {timeLeft !== null && timeLeft > 0 && (
                        <span className="flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-black/20 text-amber-300 font-mono font-bold text-[9px]">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeLeft}s</span>
                        </span>
                      )}
                      <span className="font-sans text-[10.5px] tracking-tight font-normal opacity-90">
                        {formatHumanReadableTime(message.timestamp)}
                      </span>
                      {renderDoubleCheck()}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Media Bubble Footer (for photo/video/audio) */}
            {message.type !== 'text' && (
              <div
                className="flex items-center justify-end gap-1 px-1 text-[10px] select-none"
                style={{
                  color: isMe ? themeColors.myBubbleMeta : themeColors.partnerBubbleMeta,
                }}
              >
                {timeLeft !== null && timeLeft > 0 && (
                  <span className="flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-black/20 text-amber-300 font-mono font-bold text-[9px]">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{timeLeft}s</span>
                  </span>
                )}
                <span className="font-sans text-[10.5px] tracking-tight font-normal opacity-90">
                  {formatHumanReadableTime(message.timestamp)}
                </span>
                {renderDoubleCheck()}
              </div>
            )}
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
            className={`absolute top-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-40 w-48 text-xs font-medium space-y-1 ${
              isMe ? 'right-0' : 'left-0'
            }`}
          >
            {/* WhatsApp-style Message Info (Delivery & Read receipts report) */}
            <button
              onClick={() => {
                setShowMenu(false);
                setShowInfoModal(true);
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.messageInfo}</span>
            </button>

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

      {/* WhatsApp Message Metadata Info Modal */}
      {showInfoModal && (
        <MessageInfoModal
          message={message}
          roomId={roomId}
          lang={lang}
          themeColors={themeColors}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
};
