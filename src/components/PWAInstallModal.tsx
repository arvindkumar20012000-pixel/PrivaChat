import React from 'react';
import { Download, X, Smartphone, ShieldCheck, EyeOff, Sparkles, Share, PlusSquare } from 'lucide-react';
import { Language, translations } from '../translations';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isIOS: boolean;
  lang: Language;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden cursor-default"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition z-10"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Icon badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 p-0.5 shadow-lg shadow-rose-950 flex items-center justify-center">
            <img
              src="/icon.svg"
              alt="SecretCouples Icon"
              className="w-12 h-12 rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold tracking-tight text-white">{t.installTitle}</h2>
            </div>
            <span className="text-[11px] text-rose-400 font-semibold block">{t.e2eeBadge}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
          {t.installSubtitle}
        </p>

        {/* Benefits list */}
        <div className="space-y-2 mb-5">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <Smartphone className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="text-xs text-neutral-300">{t.installBenefit1}</span>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-xs text-neutral-300">{t.installBenefit2}</span>
          </div>
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-xs text-neutral-300">{t.installBenefit3}</span>
          </div>
        </div>

        {/* iOS specific guide */}
        {isIOS && (
          <div className="p-3 rounded-2xl bg-neutral-950 border border-rose-500/30 text-xs text-neutral-300 space-y-2 mb-4">
            <span className="font-semibold text-rose-400 flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5" />
              {t.iosInstallGuide}
            </span>
            <div className="text-[11px] text-neutral-400 space-y-1 pl-1">
              <p>{t.iosStep1}</p>
              <p>{t.iosStep2}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{t.installNow}</span>
            </button>
          )}

          {!isInstallable && !isIOS && (
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 text-center mb-1">
              {t.androidStep}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs font-medium transition"
          >
            {t.later}
          </button>
        </div>
      </div>
    </div>
  );
};
