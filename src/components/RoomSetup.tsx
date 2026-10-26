import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Heart,
  Key,
  Languages,
  Sparkles,
  ArrowRight,
  EyeOff,
  Flame,
  Calculator,
  Download
} from 'lucide-react';
import { Language, translations } from '../translations';
import { generateRoomId, generateRoomSecret } from '../utils/crypto';

interface RoomSetupProps {
  onJoinRoom: (params: {
    roomId: string;
    roomSecret: string;
    userName: string;
    partnerName: string;
  }) => void;
  lang: Language;
  onToggleLang: () => void;
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
}

export const RoomSetup: React.FC<RoomSetupProps> = ({
  onJoinRoom,
  lang,
  onToggleLang,
  onOpenInstallModal,
  isInstalled,
}) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomId, setRoomId] = useState('');
  const [roomSecret, setRoomSecret] = useState('');
  const [userName, setUserName] = useState('Arvind');
  const [partnerName, setPartnerName] = useState(lang === 'hi' ? 'मेरी जान' : 'Sweetheart');

  // Detect URL hash params if opened via shared link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.substring(1);
    if (!hash) {
      // Auto-generate fresh credentials for creation
      setRoomId(generateRoomId());
      setRoomSecret(generateRoomSecret());
      return;
    }

    const params = new URLSearchParams(hash);
    const hashRoom = params.get('room');
    const hashKey = params.get('key');

    if (hashRoom && hashKey) {
      setRoomId(hashRoom);
      setRoomSecret(hashKey);
      setTab('join');
      setUserName(lang === 'hi' ? 'गर्लफ्रेंड' : 'Girlfriend');
      setPartnerName('Arvind');
    } else {
      setRoomId(generateRoomId());
      setRoomSecret(generateRoomSecret());
    }
  }, [lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !roomSecret.trim()) return;

    onJoinRoom({
      roomId: roomId.trim(),
      roomSecret: roomSecret.trim(),
      userName: userName.trim() || 'You',
      partnerName: partnerName.trim() || 'Partner',
    });
  };

  const handleGenerateNew = () => {
    setRoomId(generateRoomId());
    setRoomSecret(generateRoomSecret());
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-950">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">{t.appName}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isInstalled && onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.installApp}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>
        </div>
      </header>

      {/* Center Setup Card */}
      <main className="max-w-md w-full mx-auto my-auto z-10 py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.e2eeBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {tab === 'create' ? t.createRoom : t.joinRoom}
          </h1>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            {t.tagline}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800 mb-6">
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'create'
                ? 'bg-rose-600 text-white shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.createRoom}
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
              tab === 'join'
                ? 'bg-rose-600 text-white shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.joinRoom}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-neutral-900/70 border border-neutral-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur shadow-2xl space-y-4">
          {/* User Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 block">
                {t.yourName}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Name"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 block">
                {t.partnerName}
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Partner"
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Room ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>{t.roomCode}</span>
              </label>
              {tab === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-medium"
                >
                  {lang === 'hi' ? 'नया कोड जनरेट करें' : 'Generate new'}
                </button>
              )}
            </div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. secret-nest-4821"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 outline-none focus:border-rose-500"
            />
          </div>

          {/* Secret Key */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-400" />
              <span>{t.secretKey}</span>
            </label>
            <input
              type="password"
              value={roomSecret}
              onChange={(e) => setRoomSecret(e.target.value)}
              placeholder="Secret encryption passphrase"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xl shadow-rose-950 flex items-center justify-center gap-2 transition active:scale-98 mt-2"
          >
            <span>{t.joinButton}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Feature Highlights Pill Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-2 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
            <Calculator className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] text-neutral-400 font-medium block">
              {lang === 'hi' ? 'कैलकुलेटर छलावा' : 'Stealth Calc'}
            </span>
          </div>
          <div className="p-2 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
            <Flame className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <span className="text-[10px] text-neutral-400 font-medium block">
              {lang === 'hi' ? 'View-Once फ़ोटो' : 'View-Once Media'}
            </span>
          </div>
          <div className="p-2 rounded-2xl bg-neutral-900/40 border border-neutral-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] text-neutral-400 font-medium block">
              {lang === 'hi' ? 'नो लॉग्स' : 'Zero Logs'}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-neutral-500 py-2 z-10">
        <span>{lang === 'hi' ? '256-बिट AES क्लाइंट एन्क्रिप्शन • कोई सर्वर हिस्ट्री नहीं' : '256-bit AES Client Encryption • Zero Server History'}</span>
      </footer>
    </div>
  );
};
