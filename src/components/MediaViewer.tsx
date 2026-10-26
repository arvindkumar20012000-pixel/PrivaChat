import React, { useEffect, useState } from 'react';
import { X, Flame, EyeOff, AlertTriangle } from 'lucide-react';
import { DecryptedMessage } from '../types';
import { Language, translations } from '../translations';

interface MediaViewerProps {
  message: DecryptedMessage;
  lang: Language;
  onClose: () => void;
  onBurnMedia: (messageId: string) => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  message,
  lang,
  onClose,
  onBurnMedia,
}) => {
  const t = translations[lang];
  const isViewOnce = message.isViewOnce;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(isViewOnce ? 8 : 0);

  useEffect(() => {
    if (!isViewOnce) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onBurnMedia(message.id);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isViewOnce, message.id, onBurnMedia, onClose]);

  const handleClose = () => {
    if (isViewOnce) {
      onBurnMedia(message.id);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewOnce, message.id]);

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col justify-between p-4 select-none animate-in fade-in duration-150 cursor-pointer"
    >
      {/* Top Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between z-10 cursor-default"
      >
        <div className="flex items-center gap-2">
          {isViewOnce ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-semibold animate-pulse">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>{lang === 'hi' ? `नष्ट हो रहा है: ${secondsRemaining}s` : `Burning in: ${secondsRemaining}s`}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <EyeOff className="w-4 h-4 text-rose-400" />
              <span>{lang === 'hi' ? 'सुरक्षित मीडिया व्यूअर' : 'Secure Media Viewer'}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="p-2 bg-neutral-800/80 hover:bg-neutral-700 text-white rounded-full transition"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center p-2 overflow-hidden cursor-default"
      >
        {message.type === 'image' && (
          <img
            src={message.content}
            alt="Secure shared photo"
            className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl border border-neutral-800 pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}

        {message.type === 'video' && (
          <video
            src={message.content}
            controls
            autoPlay
            playsInline
            className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl border border-neutral-800"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </div>

      {/* Bottom info banner */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {isViewOnce
              ? (lang === 'hi'
                  ? 'यह फ़ोटो केवल 1 बार देखी जा सकती है। बंद करते ही तुरंत मिट जाएगी।'
                  : 'View-once media: Will be permanently deleted immediately upon closing.')
              : (lang === 'hi'
                  ? 'एंड-टू-एंड एन्क्रिप्टेड सामग्री'
                  : 'End-to-End Encrypted content')}
          </span>
        </p>
      </div>
    </div>
  );
};
