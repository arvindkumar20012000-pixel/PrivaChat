import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  Video,
  Mic,
  Flame,
  X,
  Smile,
  Paperclip,
  Camera
} from 'lucide-react';
import { Language, translations } from '../translations';
import { DecryptedMessage } from '../types';
import { AudioRecorder } from './AudioRecorder';
import { ThemeColors } from '../utils/theme';

interface ChatInputProps {
  onSendMessage: (
    content: string,
    type: 'text' | 'image' | 'video' | 'audio',
    isViewOnce: boolean,
    mediaMeta?: any
  ) => void;
  replyingTo: DecryptedMessage | null;
  onCancelReply: () => void;
  lang: Language;
  onTyping: () => void;
  themeColors: ThemeColors;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  lang,
  onTyping,
  themeColors,
}) => {
  const t = translations[lang];
  const [text, setText] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiBarRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        showAttachMenu &&
        attachMenuRef.current &&
        !attachMenuRef.current.contains(target)
      ) {
        setShowAttachMenu(false);
      }
      if (
        showEmojiBar &&
        emojiBarRef.current &&
        !emojiBarRef.current.contains(target)
      ) {
        setShowEmojiBar(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAttachMenu(false);
        setShowEmojiBar(false);
      }
    };

    if (showAttachMenu || showEmojiBar) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAttachMenu, showEmojiBar]);

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    onSendMessage(text.trim(), 'text', false);
    setText('');
    setShowEmojiBar(false);
    setShowAttachMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onSendMessage(base64, 'image', isViewOnce, {
        name: file.name,
        size: file.size,
      });
      setIsViewOnce(false);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert(lang === 'hi' ? 'कृपया 25MB से छोटा वीडियो चुनें।' : 'Please choose a video under 25MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onSendMessage(base64, 'video', isViewOnce, {
        name: file.name,
        size: file.size,
      });
      setIsViewOnce(false);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quickEmojis = ['❤️', '😘', '🔥', '💋', '🤫', '🥰', '🌹', '✨', '🔒', '👀', '🥺', '😂'];

  return (
    <div
      className="shrink-0 z-30 p-2 sm:p-2.5 select-none transition-colors"
      style={{
        backgroundColor: themeColors.inputContainerBg,
      }}
    >
      {/* Reply Banner */}
      {replyingTo && (
        <div
          className="flex items-center justify-between rounded-xl px-3 py-1.5 mb-2 text-xs border-l-4 shadow-sm"
          style={{
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.actionBg,
            color: themeColors.inputText,
          }}
        >
          <div className="overflow-hidden">
            <span className="font-semibold block text-[11px]" style={{ color: themeColors.actionBg }}>
              {lang === 'hi' ? 'जवाब दिया जा रहा है:' : 'Replying to'} {replyingTo.senderName}
            </span>
            <span className="truncate block text-[11px] opacity-80">
              {replyingTo.type === 'text' ? replyingTo.content : `[${replyingTo.type}]`}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-black/10 transition"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>
      )}

      {/* Audio Recorder Mode */}
      {isRecordingAudio ? (
        <AudioRecorder
          lang={lang}
          onSendAudio={(audioBase64, duration) => {
            onSendMessage(audioBase64, 'audio', false, { duration });
            setIsRecordingAudio(false);
          }}
          onCancel={() => setIsRecordingAudio(false)}
        />
      ) : (
        <>
          {/* Click-outside backdrop for attach menu and emoji bar */}
          {(showAttachMenu || showEmojiBar) && (
            <div
              className="fixed inset-0 z-30 bg-transparent"
              onClick={() => {
                setShowAttachMenu(false);
                setShowEmojiBar(false);
              }}
              aria-hidden="true"
            />
          )}

          {/* Quick Emoji Bar */}
          {showEmojiBar && (
            <div
              ref={emojiBarRef}
              className="relative z-40 flex items-center gap-2 mb-2 px-2 overflow-x-auto py-1.5 scrollbar-none rounded-2xl shadow-md border"
              style={{
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
              }}
            >
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    onTyping();
                  }}
                  className="text-xl hover:scale-125 transition shrink-0 p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoSelect}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handlePhotoSelect}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoSelect}
            accept="video/*"
            className="hidden"
          />

          {/* Attachment Floating Menu */}
          {showAttachMenu && (
            <div
              ref={attachMenuRef}
              className="absolute bottom-16 left-4 rounded-2xl p-3 shadow-2xl border flex items-center gap-4 z-40 animate-in zoom-in-95 duration-100"
              style={{
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex flex-col items-center gap-1 text-[11px]"
                style={{ color: themeColors.inputText }}
              >
                <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center shadow">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span>{t.photo}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cameraInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex flex-col items-center gap-1 text-[11px]"
                style={{ color: themeColors.inputText }}
              >
                <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center shadow">
                  <Camera className="w-5 h-5" />
                </div>
                <span>कैमरा</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex flex-col items-center gap-1 text-[11px]"
                style={{ color: themeColors.inputText }}
              >
                <div className="w-11 h-11 rounded-full bg-pink-600 text-white flex items-center justify-center shadow">
                  <Video className="w-5 h-5" />
                </div>
                <span>{t.video}</span>
              </button>
            </div>
          )}

          {/* WhatsApp-Style Input Controls Bar */}
          <div className="flex items-center gap-2">
            {/* Main Rounded Input Capsule */}
            <div
              className="flex-1 rounded-3xl flex items-center px-2 py-1 shadow-sm border transition-colors"
              style={{
                backgroundColor: themeColors.inputBg,
                borderColor: themeColors.inputBorder,
              }}
            >
              {/* Emoji button */}
              <button
                type="button"
                onClick={() => setShowEmojiBar(!showEmojiBar)}
                className="p-1.5 rounded-full hover:bg-black/10 transition shrink-0"
                style={{ color: themeColors.inputPlaceholder }}
                aria-label="Toggle Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Textarea Input */}
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  onTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isViewOnce
                    ? lang === 'hi'
                      ? '1 बार देखने वाला संदेश...'
                      : 'View once confidential message...'
                    : t.typeMessage
                }
                rows={1}
                className="flex-1 bg-transparent text-sm px-2 py-1.5 outline-none resize-none max-h-24 leading-relaxed"
                style={{
                  color: themeColors.inputText,
                }}
              />

              {/* Paperclip attachment button */}
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-1.5 rounded-full hover:bg-black/10 transition shrink-0"
                style={{ color: themeColors.inputPlaceholder }}
                title="Attach"
                aria-label="Attach Media"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* View Once Toggle Button */}
              <button
                type="button"
                onClick={() => setIsViewOnce(!isViewOnce)}
                className={`p-1.5 rounded-full transition shrink-0 relative ${
                  isViewOnce
                    ? 'text-rose-500 font-bold animate-pulse'
                    : ''
                }`}
                style={{ color: isViewOnce ? '#f43f5e' : themeColors.inputPlaceholder }}
                title={t.viewOnceDesc}
                aria-label={t.viewOnce}
              >
                <div className="relative flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 text-[8px] font-black bg-rose-500 text-white rounded-full px-1 leading-none py-0.5">
                    1
                  </span>
                </div>
              </button>
            </div>

            {/* Circular Send or Mic Button */}
            {text.trim() ? (
              <button
                type="button"
                onClick={() => handleSendText()}
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-90 transition shrink-0"
                style={{
                  backgroundColor: themeColors.actionBg,
                  color: themeColors.actionText,
                }}
                aria-label={t.send}
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingAudio(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-md active:scale-90 transition shrink-0"
                style={{
                  backgroundColor: themeColors.actionBg,
                  color: themeColors.actionText,
                }}
                title={t.voiceNote}
                aria-label={t.voiceNote}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
