import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, Calculator, ShieldCheck, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../translations';
import { verifyPin, getStoredPin, saveStoredPin, isPinValidFormat, hasUserSetPin, DEFAULT_PIN } from '../utils/security';
import { CamouflageMode } from '../types';

interface PasscodeLockProps {
  lang: Language;
  onUnlock: () => void;
  onSetCamouflage: (mode: CamouflageMode) => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({
  lang,
  onUnlock,
  onSetCamouflage,
}) => {
  const t = translations[lang];
  const [isConfigured, setIsConfigured] = useState<boolean>(() => hasUserSetPin());
  const [setupStage, setSetupStage] = useState<'create' | 'confirm'>('create');
  const [firstAttemptPin, setFirstAttemptPin] = useState<string>('');
  
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showChangeModal, setShowChangeModal] = useState<boolean>(false);
  
  // State for changing PIN in modal
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<boolean>(false);

  const checkPin = useCallback(
    (entered: string) => {
      if (entered.length !== 4) return;

      // Mode A: Setting up PIN for the first time
      if (!isConfigured) {
        if (setupStage === 'create') {
          setFirstAttemptPin(entered);
          setPin('');
          setSetupStage('confirm');
          return;
        }

        if (setupStage === 'confirm') {
          if (entered === firstAttemptPin) {
            saveStoredPin(entered);
            setIsConfigured(true);
            setSuccessMessage(t.pinSavedSuccess);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([40, 40]);
            }
            setTimeout(() => {
              onUnlock();
            }, 600);
          } else {
            setIsError(true);
            setErrorMessage(t.pinMismatch);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([80, 50, 80]);
            }
            setTimeout(() => {
              setPin('');
              setFirstAttemptPin('');
              setSetupStage('create');
              setIsError(false);
              setErrorMessage(null);
            }, 1000);
          }
          return;
        }
      }

      // Mode B: Regular unlock with configured PIN
      if (verifyPin(entered)) {
        setIsError(false);
        setErrorMessage(null);
        onUnlock();
      } else {
        setIsError(true);
        setErrorMessage(t.wrongPin);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 50, 80]);
        }
        setTimeout(() => {
          setPin('');
          setIsError(false);
          setErrorMessage(null);
        }, 600);
      }
    },
    [isConfigured, setupStage, firstAttemptPin, onUnlock, t]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        checkPin(next);
      }
    },
    [pin, checkPin]
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
    setErrorMessage(null);
  }, []);

  // Keyboard support for desktop / laptop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showChangeModal) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onSetCamouflage('calculator');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, onSetCamouflage, showChangeModal]);

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    const stored = getStoredPin();
    if (currentPinInput !== stored && isConfigured) {
      setChangeError(lang === 'hi' ? 'मौजूदा पिन गलत है' : 'Current PIN is incorrect');
      return;
    }

    if (!isPinValidFormat(newPinInput)) {
      setChangeError(lang === 'hi' ? 'नया पिन ठीक 4 अंकों का होना चाहिए' : 'New PIN must be exactly 4 digits');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setChangeError(t.pinMismatch);
      return;
    }

    const saved = saveStoredPin(newPinInput);
    if (saved) {
      setIsConfigured(true);
      setChangeSuccess(true);
      setTimeout(() => {
        setShowChangeModal(false);
        setChangeSuccess(false);
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
      }, 1200);
    }
  };

  // Determine active title & subtext
  const getHeaderInfo = () => {
    if (!isConfigured) {
      if (setupStage === 'create') {
        return {
          title: t.setupPinTitle,
          subtext: t.setupPinSubtext,
        };
      }
      return {
        title: t.confirmPinTitle,
        subtext: t.confirmPinSubtext,
      };
    }
    return {
      title: t.enterPasscode,
      subtext: t.passcodeSubtext,
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-neutral-950 flex flex-col items-center justify-between p-6 select-none z-50 text-white overflow-hidden">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between max-w-sm pt-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
            {t.realChatBadge}
          </span>
        </div>
        <button
          onClick={() => onSetCamouflage('calculator')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-amber-400 hover:bg-neutral-800 transition"
          title={t.panicHint}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'छलावा' : 'Camouflage'}</span>
        </button>
      </div>

      {/* Center Lock Status & PIN Dots */}
      <div className="flex flex-col items-center justify-center -mt-6">
        <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shadow-2xl mb-4 relative">
          <Lock className="w-8 h-8 text-emerald-400" />
          <div className="absolute -inset-1 rounded-3xl bg-emerald-500/10 -z-10 blur-sm" />
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-1.5 text-center">
          {headerInfo.title}
        </h1>
        <p className="text-xs text-neutral-400 text-center max-w-xs mb-6">
          {headerInfo.subtext}
        </p>

        {/* 4 PIN Dots */}
        <div className={`flex items-center gap-5 my-2 ${isError ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isError
                    ? 'bg-rose-500 border-rose-500 shadow-lg shadow-rose-950/50'
                    : isFilled
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-lg shadow-emerald-950/50'
                    : 'bg-transparent border-neutral-600'
                }`}
              />
            );
          })}
        </div>

        {/* Error message or Status */}
        <div className="h-6 mt-3 text-center">
          {errorMessage ? (
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </span>
          ) : successMessage ? (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {successMessage}
            </span>
          ) : !isConfigured ? (
            <span className="text-[11px] text-amber-400/90 font-medium">
              {setupStage === 'create' ? 'चरण 1: 4 अंक दर्ज करें' : 'चरण 2: पुष्टि करें'}
            </span>
          ) : (
            <span className="text-[11px] text-neutral-500">
              CipherChat 256-bit AES Protected
            </span>
          )}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs flex flex-col gap-3.5 pb-4">
        <div className="grid grid-cols-3 gap-3.5 text-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-16 rounded-full bg-neutral-900/90 hover:bg-neutral-800 active:bg-neutral-700 active:scale-95 text-xl font-medium text-white transition flex items-center justify-center border border-neutral-800/80 shadow-md"
            >
              {num}
            </button>
          ))}

          {/* Bottom Row: Camouflage Disguise, 0, Backspace */}
          <button
            type="button"
            onClick={() => onSetCamouflage('calculator')}
            className="h-16 rounded-full bg-neutral-900/60 hover:bg-neutral-800 active:scale-95 text-xs font-medium text-neutral-400 transition flex flex-col items-center justify-center gap-1 border border-neutral-800/50"
            title="Calculator Disguise"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-neutral-400">{lang === 'hi' ? 'कैलकुलेटर' : 'Math'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-16 rounded-full bg-neutral-900/90 hover:bg-neutral-800 active:bg-neutral-700 active:scale-95 text-xl font-medium text-white transition flex items-center justify-center border border-neutral-800/80 shadow-md"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-full bg-neutral-900/60 hover:bg-neutral-800 active:scale-95 text-neutral-300 transition flex items-center justify-center border border-neutral-800/50"
            aria-label="Delete"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Change PIN Link */}
        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={() => setShowChangeModal(true)}
            className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition py-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{t.changePin}</span>
          </button>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xs w-full p-5 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-400" />
              <span>{t.changePin}</span>
            </h3>
            <p className="text-[11px] text-neutral-400 mb-4">
              {lang === 'hi'
                ? 'नया 4 अंकों का गुप्त पिन सेट करें:'
                : 'Set a new 4-digit secret PIN:'}
            </p>

            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              {isConfigured && (
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1">
                    {lang === 'hi' ? 'मौजूदा पिन' : 'Current PIN'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1">
                  {t.newPin}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-neutral-400 uppercase block mb-1">
                  {t.confirmPin}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              {changeError && (
                <p className="text-[11px] text-rose-400 text-center font-medium">
                  {changeError}
                </p>
              )}

              {changeSuccess && (
                <p className="text-[11px] text-emerald-400 text-center font-medium">
                  {t.pinUpdated}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
