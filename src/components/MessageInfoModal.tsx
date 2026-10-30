import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCheck,
  ShieldCheck,
  Lock,
  Clock,
  Info,
  FileText,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { DecryptedMessage } from '../types';
import { Language, translations } from '../translations';
import { ThemeColors } from '../utils/theme';
import { fetchMessageMetadata, MessageMetadataInfo } from '../services/messageMetadata';

interface MessageInfoModalProps {
  message: DecryptedMessage;
  roomId: string;
  lang: Language;
  themeColors: ThemeColors;
  onClose: () => void;
}

export const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  message,
  roomId,
  lang,
  themeColors,
  onClose,
}) => {
  const t = translations[lang];
  const [metadata, setMetadata] = useState<MessageMetadataInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchMessageMetadata(roomId, message, lang)
      .then((data) => {
        if (isMounted) {
          setMetadata(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId, message, lang]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: themeColors.bg,
          borderColor: themeColors.border,
          color: themeColors.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between shrink-0"
          style={{
            backgroundColor: themeColors.headerBg,
            borderColor: themeColors.headerBorder,
            color: themeColors.headerText,
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 -ml-1 rounded-full hover:bg-black/10 active:scale-95 transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-semibold leading-tight">
                {t.messageInfoTitle}
              </h2>
              <p
                className="text-[11px] leading-tight"
                style={{ color: themeColors.headerSubtext }}
              >
                {t.messageInfoSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition text-current opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Message Preview Bubble */}
          <div
            className="p-3.5 rounded-2xl border shadow-sm space-y-1.5"
            style={{
              backgroundColor: themeColors.myBubble,
              borderColor: themeColors.border,
              color: themeColors.myBubbleText,
            }}
          >
            <span
              className="text-[10px] font-semibold tracking-wider uppercase block"
              style={{ color: themeColors.myBubbleMeta }}
            >
              {message.type === 'text' ? (lang === 'hi' ? 'संदेश' : 'Message') : `[${message.type.toUpperCase()}]`}
            </span>
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.type === 'text'
                ? message.content
                : message.mediaMeta?.name || `Encrypted ${message.type}`}
            </p>
            <div
              className="text-[10px] flex items-center justify-end gap-1 pt-1 border-t border-black/5 dark:border-white/5"
              style={{ color: themeColors.myBubbleMeta }}
            >
              <Clock className="w-3 h-3" />
              <span>{metadata?.sentFullDateTime || '...'}</span>
            </div>
          </div>

          {/* Delivery & Read Receipts Card (WhatsApp style) */}
          <div
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{
              backgroundColor: themeColors.systemMessageBg,
              borderColor: themeColors.border,
            }}
          >
            <div className="px-3.5 py-2.5 border-b font-bold flex items-center justify-between text-xs" style={{ borderColor: themeColors.border }}>
              <span className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'hi' ? 'डिलीवरी और सीन रिपोर्ट' : 'Delivery & Read Receipts'}</span>
              </span>
              {metadata?.isRead && metadata?.timeToReadFormatted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                  {metadata.timeToReadFormatted}
                </span>
              )}
            </div>

            {/* Read Status Row */}
            <div className="px-3.5 py-3 border-b flex items-start gap-3" style={{ borderColor: themeColors.border }}>
              <div className="mt-0.5 shrink-0">
                <CheckCheck
                  className={`w-5 h-5 stroke-[2.5] ${
                    metadata?.isRead ? 'text-[#53bdeb]' : 'text-neutral-400 opacity-60'
                  }`}
                  style={{ color: metadata?.isRead ? themeColors.checkColor : undefined }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs" style={{ color: themeColors.textPrimary }}>
                    {t.readStatus}
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      metadata?.isRead ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
                    }`}
                  >
                    {metadata?.isRead ? metadata.readTimeFormatted : t.notReadYet}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {metadata?.isRead
                    ? metadata.readFullDateTime
                    : (lang === 'hi' ? 'पार्टनर ने अभी तक चैट नहीं खोली है' : 'Partner has not viewed this message yet')}
                </p>
              </div>
            </div>

            {/* Delivered Status Row */}
            <div className="px-3.5 py-3 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <CheckCheck className="w-5 h-5 stroke-[2] text-[#8696a0]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs" style={{ color: themeColors.textPrimary }}>
                    {t.deliveredStatus}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {metadata?.sentTimeFormatted || '...'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {metadata?.sentFullDateTime || '...'}
                </p>
              </div>
            </div>
          </div>

          {/* End-to-End Encryption Verification Card */}
          <div
            className="p-3.5 rounded-2xl border shadow-sm space-y-2"
            style={{
              backgroundColor: themeColors.systemMessageBg,
              borderColor: themeColors.border,
            }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-xs" style={{ color: themeColors.textPrimary }}>
                  {t.encryptionInfo}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {metadata?.encryption.status}
                </span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              {t.encryptionDetail}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px]">
              <div>
                <span className="text-neutral-400 block text-[10px]">Algorithm</span>
                <span className="font-mono font-medium">{metadata?.encryption.algorithm}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">Server Access</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">Zero-Knowledge</span>
              </div>
            </div>
          </div>

          {/* Technical Specs Card */}
          <div
            className="p-3.5 rounded-2xl border shadow-sm space-y-2 text-[11px]"
            style={{
              backgroundColor: themeColors.systemMessageBg,
              borderColor: themeColors.border,
            }}
          >
            <span className="font-bold block text-xs" style={{ color: themeColors.textPrimary }}>
              {lang === 'hi' ? 'तकनीकी विवरण' : 'Technical Details'}
            </span>
            <div className="space-y-1.5 text-neutral-500">
              <div className="flex justify-between items-center py-1 border-b border-black/5 dark:border-white/5">
                <span>{t.messageIdLabel}</span>
                <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-300 truncate max-w-[180px]">
                  {message.id}
                </span>
              </div>
              {metadata?.details.charactersCount !== undefined && (
                <div className="flex justify-between items-center py-1 border-b border-black/5 dark:border-white/5">
                  <span>{t.messageSizeLabel}</span>
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">
                    {metadata.details.charactersCount} {lang === 'hi' ? 'अक्षर' : 'chars'}
                  </span>
                </div>
              )}
              {metadata?.details.mediaSizeFormatted && (
                <div className="flex justify-between items-center py-1 border-b border-black/5 dark:border-white/5">
                  <span>{t.messageSizeLabel}</span>
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">
                    {metadata.details.mediaSizeFormatted}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-black/5 dark:border-white/5">
                <span>{t.disappearingTimerLabel}</span>
                <span className="font-mono font-medium text-neutral-600 dark:text-neutral-300">
                  {metadata?.details.disappearingDurationLabel}
                </span>
              </div>
              {metadata?.details.isViewOnce && (
                <div className="flex justify-between items-center py-1">
                  <span>View Once</span>
                  <span className="font-semibold text-rose-500">Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div
          className="p-3 border-t shrink-0 flex justify-end"
          style={{
            borderColor: themeColors.border,
          }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs active:scale-95 transition shadow-sm"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
