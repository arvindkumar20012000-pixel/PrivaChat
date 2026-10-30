import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Heart,
  Key,
  Languages,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Calculator,
  Download,
  HelpCircle,
  Info
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
  const [showSecret, setShowSecret] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerName, setPartnerName] = useState('');

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
      setUserName('');
      setPartnerName('');
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
      userName: userName.trim() || (lang === 'hi' ? 'आप' : 'You'),
      partnerName: partnerName.trim() || (lang === 'hi' ? 'पार्टनर' : 'Partner'),
    });
  };

  const handleGenerateNew = () => {
    setRoomId(generateRoomId());
    setRoomSecret(generateRoomSecret());
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">{t.appName}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isInstalled && onOpenInstallModal && (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition"
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
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
                ? 'bg-emerald-600 text-white shadow'
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
                ? 'bg-emerald-600 text-white shadow'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.joinRoom}
          </button>
        </div>

        {/* Simple How-It-Works Guide Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-between transition"
          >
            <span className="flex items-center gap-1.5 text-rose-400">
              <HelpCircle className="w-4 h-4" />
              <span>{t.howItWorks}</span>
            </span>
            <span className="text-[11px] text-neutral-400">
              {showGuide ? (lang === 'hi' ? 'बंद करें' : 'Close') : (lang === 'hi' ? 'समझें कैसे काम करेगा' : 'Read 3-step guide')}
            </span>
          </button>

          {showGuide && (
            <div className="mt-2 p-3.5 bg-neutral-900/90 border border-rose-900/40 rounded-2xl text-xs text-neutral-300 space-y-2 animate-in fade-in duration-200">
              <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.howItWorksTitle}</span>
              </h3>
              {lang === 'hi' ? (
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-white">1. रूम कोड:</strong> यह आपके और पार्टनर के चैट रूम का नंबर/पता है ताकि दोनों एक ही कमरे में आ सकें।
                  </p>
                  <p>
                    <strong className="text-amber-400">2. सीक्रेट कोड (चाबी):</strong> यह डिजिटल ताला-चाबी है। आपके फोन से मैसेज, फोटो निकलने से पहले इसी चाबी से लॉक होते हैं। सर्वर भी इन्हें नहीं पढ़ सकता। पार्टनर का फोन इसी चाबी से अनलॉक करता है।
                  </p>
                  <p>
                    <strong className="text-rose-400">3. पार्टनर को कैसे जोड़ें:</strong> अंदर जाकर बस <strong>"1-क्लिक सीक्रेट लिंक"</strong> कॉपी करें या व्हाट्सएप पर भेजें। पार्टनर उस लिंक पर सिर्फ टच (क्लिक) करेगी और बिना कुछ टाइप किए तुरंत जुड़ जाएगी!
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <p>
                    <strong className="text-white">1. Room Code:</strong> Private room identifier that links both devices to the same conversation.
                  </p>
                  <p>
                    <strong className="text-amber-400">2. Secret Key:</strong> The master encryption passphrase. Encrypts your messages & media client-side. Zero server logs.
                  </p>
                  <p>
                    <strong className="text-rose-400">3. Connect Partner:</strong> Inside the chat, tap <strong>"1-Click Secret Link"</strong> or WhatsApp share. Your partner taps the link and joins instantly with zero technical setup!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-neutral-900/70 border border-neutral-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur shadow-2xl space-y-4">
          {/* User Names / Aliases */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-400 mb-1.5 block">
                {t.yourName}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={lang === 'hi' ? 'उपनाम (वैकल्पिक)' : 'Alias (optional)'}
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
                placeholder={lang === 'hi' ? 'उपनाम (वैकल्पिक)' : 'Alias (optional)'}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Room ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>{t.roomCode}</span>
              </label>
              {tab === 'create' && (
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
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
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-neutral-500 outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              {lang === 'hi' ? 'कमरा संख्या (Room Code) - दोनों इसी एक कमरे में जुड़ेंगे' : 'Room ID - both connect to this space'}
            </p>
          </div>

          {/* Secret Key with Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-400" />
                <span>{t.secretKey}</span>
              </label>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecret ? t.hideKey : t.showKey}</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={roomSecret}
                onChange={(e) => setRoomSecret(e.target.value)}
                placeholder={lang === 'hi' ? 'गुप्त एन्क्रिप्शन कोड (चाबी)' : 'Secret encryption passphrase'}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono text-amber-300 placeholder-neutral-500 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                title={showSecret ? 'Hide' : 'Show'}
              >
                {showSecret ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 flex items-start gap-1">
              <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span>{t.keyExplanation}</span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 transition active:scale-98 mt-2"
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
