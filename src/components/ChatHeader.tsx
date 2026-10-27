import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Calculator,
  Clock,
  Trash2,
  Languages,
  UserCheck,
  MoreVertical,
  QrCode,
  AlertOctagon,
  FileText,
  Download,
  Phone,
  Video,
  ArrowLeft,
  Sun,
  Moon,
  Palette,
  Check
} from 'lucide-react';
import { Language, translations } from '../translations';
import { CamouflageMode, AppTheme } from '../types';
import { ThemeColors } from '../utils/theme';

interface ChatHeaderProps {
  roomId: string;
  partnerName: string;
  isOnline: boolean;
  typingText: string | null;
  lang: Language;
  onToggleLang: () => void;
  onOpenRoomModal: () => void;
  onTriggerPanic: () => void;
  onSetCamouflage: (mode: CamouflageMode) => void;
  onNuclearWipe: () => void;
  disappearingDuration: number;
  onSelectTimer: (seconds: number) => void;
  activeRole: 'you' | 'partner';
  onToggleRole: () => void;
  onOpenInstallModal: () => void;
  isInstalled: boolean;
  theme: AppTheme;
  themeColors: ThemeColors;
  onSelectTheme: (newTheme: AppTheme) => void;
  onExitRoom: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomId,
  partnerName,
  isOnline,
  typingText,
  lang,
  onToggleLang,
  onOpenRoomModal,
  onTriggerPanic,
  onSetCamouflage,
  onNuclearWipe,
  disappearingDuration,
  onSelectTimer,
  activeRole,
  onToggleRole,
  onOpenInstallModal,
  isInstalled,
  theme,
  themeColors,
  onSelectTheme,
  onExitRoom,
}) => {
  const t = translations[lang];
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showWipeDialog, setShowWipeDialog] = useState(false);
  const [callAlert, setCallAlert] = useState<string | null>(null);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus when clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        showMoreMenu &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target)
      ) {
        setShowMoreMenu(false);
        setShowTimerMenu(false);
      }
      if (
        showThemeMenu &&
        themeMenuRef.current &&
        !themeMenuRef.current.contains(target)
      ) {
        setShowThemeMenu(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMoreMenu(false);
        setShowTimerMenu(false);
        setShowThemeMenu(false);
      }
    };

    if (showMoreMenu || showThemeMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMoreMenu, showThemeMenu]);

  const timerLabels: Record<number, string> = {
    0: t.off,
    5: t.timer5s,
    30: t.timer30s,
    60: t.timer1m,
    300: t.timer5m,
    3600: t.timer1h,
    86400: t.timer24h,
  };

  const handleCallClick = (type: 'audio' | 'video') => {
    setCallAlert(
      lang === 'hi'
        ? `${type === 'video' ? 'वीडियो' : 'ऑडियो'} कॉल सिम्युलेटेड है। पूर्ण गोपनीयता सक्रिय है।`
        : `${type === 'video' ? 'Video' : 'Voice'} call simulated. Stealth E2EE active.`
    );
    setTimeout(() => setCallAlert(null), 3000);
  };

  return (
    <header
      className="h-16 shrink-0 z-40 px-2 sm:px-4 flex items-center justify-between select-none shadow-sm transition-colors border-b"
      style={{
        backgroundColor: themeColors.headerBg,
        borderColor: themeColors.headerBorder,
        color: themeColors.headerText,
      }}
    >
      {/* Left: Back Arrow + Partner Avatar + Name & Status */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* Back arrow (WhatsApp style) */}
        <button
          onClick={onExitRoom}
          className="p-1.5 -ml-1 rounded-full hover:bg-black/10 active:scale-95 transition"
          title="Exit Room"
          aria-label="Exit Room"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: themeColors.headerText }} />
        </button>

        {/* WhatsApp Avatar */}
        <div className="relative shrink-0 cursor-pointer" onClick={onOpenRoomModal}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow">
            {partnerName && partnerName.trim() ? partnerName.slice(0, 2).toUpperCase() : '🔒'}
          </div>
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
              isOnline ? 'bg-emerald-400' : 'bg-neutral-400'
            }`}
            style={{ borderColor: themeColors.headerBg }}
          />
        </div>

        {/* Name and Online / Typing */}
        <div className="flex flex-col min-w-0 cursor-pointer" onClick={onOpenRoomModal}>
          <div className="flex items-center gap-1.5 truncate">
            <h1
              className="text-sm sm:text-base font-semibold tracking-tight truncate leading-tight"
              style={{ color: themeColors.headerText }}
            >
              {partnerName}
            </h1>
            <span
              className="p-0.5 rounded text-rose-400 shrink-0"
              title={t.e2eeBadge}
              aria-label={t.e2eeBadge}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            className="text-[11px] truncate leading-tight"
            style={{ color: themeColors.headerSubtext }}
          >
            {typingText ? (
              <span className="font-semibold text-emerald-400 animate-pulse">{typingText}</span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>{t.online}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* WhatsApp Simulated Video Call */}
        <button
          onClick={() => handleCallClick('video')}
          className="p-2 rounded-full hover:bg-black/10 transition"
          title={t.videoCall}
          aria-label={t.videoCall}
        >
          <Video className="w-4 h-4" style={{ color: themeColors.headerText }} />
        </button>

        {/* WhatsApp Simulated Voice Call */}
        <button
          onClick={() => handleCallClick('audio')}
          className="p-2 rounded-full hover:bg-black/10 transition"
          title={t.voiceCall}
          aria-label={t.voiceCall}
        >
          <Phone className="w-4 h-4" style={{ color: themeColors.headerText }} />
        </button>

        {/* Prominent Install App Button */}
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-950/20 active:scale-95 transition"
          title={t.installApp}
          aria-label={t.installApp}
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline font-sans">{t.installApp}</span>
        </button>

        {/* Click outside backdrop for header menus */}
        {(showMoreMenu || showThemeMenu) && (
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => {
              setShowMoreMenu(false);
              setShowTimerMenu(false);
              setShowThemeMenu(false);
            }}
            aria-hidden="true"
          />
        )}

        {/* Theme Selector Button */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-full hover:bg-black/10 transition"
            title={t.theme}
            aria-label={t.theme}
          >
            <Palette className="w-4 h-4" style={{ color: themeColors.headerText }} />
          </button>

          {showThemeMenu && (
            <div
              ref={themeMenuRef}
              className="absolute right-0 top-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 w-48 space-y-1 text-xs text-white animate-in zoom-in-95 duration-100"
            >
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1 block">
                {t.theme}
              </span>
              {[
                { id: 'whatsapp' as AppTheme, label: t.themeWhatsApp, icon: Moon },
                { id: 'light' as AppTheme, label: t.themeLight, icon: Sun },
                { id: 'dark' as AppTheme, label: t.themeDark, icon: Moon },
                { id: 'system' as AppTheme, label: t.themeSystem, icon: Palette },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTheme(item.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition ${
                    theme === item.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </span>
                  {theme === item.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Panic Calculator Button */}
        <button
          onClick={onTriggerPanic}
          className="p-2 rounded-full hover:bg-black/10 text-amber-400 transition"
          title={t.panicHint}
          aria-label={t.panicEscape}
        >
          <Calculator className="w-4 h-4" />
        </button>

        {/* More 3-Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded-full hover:bg-black/10 transition"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" style={{ color: themeColors.headerText }} />
          </button>

          {showMoreMenu && (
            <div
              ref={moreMenuRef}
              className="absolute right-0 top-12 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 w-56 space-y-1 text-xs text-white animate-in zoom-in-95 duration-100"
            >
              {/* Install option inside menu */}
              <button
                onClick={() => {
                  onOpenInstallModal();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-emerald-400 font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{t.installApp}</span>
              </button>

              {/* QR Invite */}
              <button
                onClick={() => {
                  onOpenRoomModal();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-rose-400" />
                <span>{t.invitePartner}</span>
              </button>

              {/* Switch Role / Test Partner */}
              <button
                onClick={() => {
                  onToggleRole();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span>
                  {t.switchRole} ({activeRole === 'you' ? t.you : t.partner})
                </span>
              </button>

              {/* Disappearing Timer */}
              <button
                onClick={() => {
                  setShowTimerMenu(!showTimerMenu);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  <span>{t.disappearingMessages}</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {timerLabels[disappearingDuration]}
                </span>
              </button>

              {/* Sub-menu: Timer choices */}
              {showTimerMenu && (
                <div className="bg-neutral-950 p-1.5 rounded-xl border border-neutral-800 grid grid-cols-2 gap-1 my-1">
                  {[0, 5, 30, 60, 300, 3600, 86400].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        onSelectTimer(sec);
                        setShowTimerMenu(false);
                        setShowMoreMenu(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] text-center transition ${
                        disappearingDuration === sec
                          ? 'bg-rose-600 text-white font-medium'
                          : 'text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      {timerLabels[sec]}
                    </button>
                  ))}
                </div>
              )}

              {/* Disguises */}
              <button
                onClick={() => {
                  onSetCamouflage('calculator');
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>{t.calculatorMode}</span>
              </button>

              <button
                onClick={() => {
                  onSetCamouflage('notes');
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>{t.notesMode}</span>
              </button>

              {/* Language Switch */}
              <button
                onClick={() => {
                  onToggleLang();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-200 flex items-center gap-2"
              >
                <Languages className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}</span>
              </button>

              <div className="border-t border-neutral-800 my-1" />

              {/* Wipe All */}
              <button
                onClick={() => {
                  setShowWipeDialog(true);
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-950/60 text-red-400 flex items-center gap-2"
              >
                <AlertOctagon className="w-4 h-4 text-red-500" />
                <span>{t.wipeAll}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Call simulated notification banner */}
      {callAlert && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 bg-neutral-900 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {callAlert}
        </div>
      )}

      {/* Nuclear Wipe Confirmation Dialog */}
      {showWipeDialog && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-red-500/40 p-6 rounded-3xl max-w-sm w-full text-white shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center mb-2">{t.wipeAll}</h3>
            <p className="text-xs text-neutral-400 text-center mb-6 leading-relaxed">
              {t.wipeConfirm}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWipeDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
              >
                {t.confirmCancel}
              </button>
              <button
                onClick={() => {
                  onNuclearWipe();
                  setShowWipeDialog(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950"
              >
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
