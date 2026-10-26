import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, ShieldCheck, QrCode, Share2, Key, Clock, X, Lock } from 'lucide-react';
import { Language, translations } from '../translations';
import { generateFingerprint } from '../utils/crypto';

interface RoomModalProps {
  roomId: string;
  roomSecret: string;
  lang: Language;
  onClose: () => void;
  disappearingDuration: number;
  onUpdateDisappearingDuration: (sec: number) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  roomId,
  roomSecret,
  lang,
  onClose,
  disappearingDuration,
  onUpdateDisappearingDuration,
}) => {
  const t = translations[lang];
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [fingerprint, setFingerprint] = useState<string>('');

  // Generate invite link containing room and key in hash and role=partner for recipient
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteLink = `${origin}/#room=${encodeURIComponent(roomId)}&key=${encodeURIComponent(roomSecret)}&role=partner`;

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(inviteLink, {
      margin: 1,
      width: 180,
      color: {
        dark: '#ffffff',
        light: '#18181b',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));

    // Calculate fingerprint
    generateFingerprint(roomSecret).then(setFingerprint);
  }, [inviteLink, roomSecret]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(roomSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const shareText = encodeURIComponent(`${t.whatsappMessage}\n${inviteLink}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto cursor-default"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition z-10"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{t.invitePartner}</h2>
            <p className="text-xs text-rose-400/90 font-medium">{t.e2eeBadge}</p>
          </div>
        </div>

        <p className="text-xs text-neutral-400 mt-2 mb-4 leading-relaxed">
          {t.e2eeDescription} {lang === 'hi' ? 'लिंक में गुप्त की (#hash) शामिल है, जो सर्वर को कभी नहीं भेजी जाती।' : 'The key is passed in the URL hash, so the server never receives the key.'}
        </p>

        {/* 1-Click Copy Invite Link */}
        <div className="space-y-3 mb-5">
          <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block">
                {t.copyLink}
              </span>
              <span className="text-xs font-mono text-neutral-300 truncate block">
                {inviteLink}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition shrink-0 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? (lang === 'hi' ? 'कॉपी हो गया' : 'Copied!') : (lang === 'hi' ? 'कॉपी लिंक' : 'Copy')}</span>
            </button>
          </div>

          {/* Quick WhatsApp Share Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-medium transition"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareViaWhatsApp}</span>
          </a>
        </div>

        {/* QR Code Section */}
        <div className="bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800 flex flex-col items-center mb-5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3">
            <QrCode className="w-4 h-4 text-rose-400" />
            <span>{t.scanQR}</span>
          </div>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Secret Room QR Code"
              className="w-36 h-36 rounded-xl border border-neutral-700 p-2 bg-neutral-900"
            />
          ) : (
            <div className="w-36 h-36 bg-neutral-900 rounded-xl animate-pulse" />
          )}
          <span className="text-[11px] text-neutral-500 mt-2 text-center">
            {lang === 'hi' ? 'गर्लफ्रेंड के फोन कैमरे से स्कैन कराएं' : "Scan with partner's phone camera to join instantly"}
          </span>
        </div>

        {/* Safety Numbers (Fingerprint) */}
        <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> {t.safetyNumbers}
            </span>
          </div>
          <div className="font-mono text-xs text-amber-300/90 tracking-wider text-center py-2 bg-neutral-900/90 rounded-lg select-all">
            {fingerprint || 'Calculating...'}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1.5">
            {t.safetyNumbersDesc}
          </p>
        </div>

        {/* Room Disappearing Timer Setting */}
        <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" /> {t.disappearingMessages}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {[
              { val: 0, label: t.off },
              { val: 5, label: t.timer5s },
              { val: 30, label: t.timer30s },
              { val: 60, label: t.timer1m },
              { val: 300, label: t.timer5m },
              { val: 3600, label: t.timer1h },
              { val: 86400, label: t.timer24h },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => onUpdateDisappearingDuration(item.val)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                  disappearingDuration === item.val
                    ? 'bg-rose-600 text-white shadow'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
