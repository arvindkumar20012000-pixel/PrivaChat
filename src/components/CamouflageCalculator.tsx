import React, { useState } from 'react';
import { Lock, EyeOff } from 'lucide-react';

interface CamouflageCalculatorProps {
  onUnlock: () => void;
  unlockPin?: string;
}

export const CamouflageCalculator: React.FC<CamouflageCalculatorProps> = ({
  onUnlock,
  unlockPin = '1402',
}) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState('');
  const [enteredSequence, setEnteredSequence] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleDigit = (digit: string) => {
    setEnteredSequence((prev) => prev + digit);

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setEnteredSequence((prev) => prev + '.');
      setWaitingForOperand(false);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory('');
    setEnteredSequence('');
  };

  const handleToggleSign = () => {
    const val = parseFloat(display);
    setDisplay(String(-val));
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    setDisplay(String(val / 100));
  };

  const handleOp = (nextOp: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operation) {
      const current = prevValue || 0;
      let result = current;
      if (operation === '+') result = current + inputValue;
      else if (operation === '−') result = current - inputValue;
      else if (operation === '×') result = current * inputValue;
      else if (operation === '÷') result = inputValue !== 0 ? current / inputValue : 0;

      setPrevValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
    setHistory(`${display} ${nextOp}`);
  };

  const handleEquals = () => {
    // Secret trigger: If user entered the secret PIN and pressed equals
    if (enteredSequence.endsWith(unlockPin) || display === unlockPin) {
      onUnlock();
      return;
    }

    const inputValue = parseFloat(display);
    if (prevValue !== null && operation) {
      const current = prevValue;
      let result = current;
      if (operation === '+') result = current + inputValue;
      else if (operation === '−') result = current - inputValue;
      else if (operation === '×') result = current * inputValue;
      else if (operation === '÷') result = inputValue !== 0 ? current / inputValue : 0;

      setDisplay(String(result));
      setHistory(`${current} ${operation} ${inputValue} =`);
      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === unlockPin) {
      onUnlock();
    } else {
      setPinError(true);
      setPinInput('');
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 select-none font-sans">
      {/* Top subtle bar */}
      <div className="w-full max-w-sm flex items-center justify-between text-neutral-500 text-xs px-2 mb-2">
        <span className="flex items-center gap-1 font-mono">
          <EyeOff className="w-3.5 h-3.5" /> Stealth Disguise Active
        </span>
        <button
          onClick={() => setShowPinModal(true)}
          className="text-neutral-600 hover:text-neutral-400 p-1 rounded transition"
          aria-label="Direct Unlock"
          title="Direct Unlock PIN"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Realistic Calculator Body */}
      <div className="w-full max-w-sm bg-black/90 p-5 rounded-3xl border border-neutral-800 shadow-2xl backdrop-blur-md">
        {/* Screen */}
        <div className="text-right px-3 py-4 mb-3 flex flex-col justify-end min-h-[110px]">
          <div className="text-neutral-500 text-sm h-6 overflow-hidden text-ellipsis font-mono">
            {history}
          </div>
          <div className="text-white text-5xl font-light tracking-tight overflow-x-auto overflow-y-hidden whitespace-nowrap">
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 text-2xl font-normal">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="h-16 rounded-full bg-neutral-700 text-neutral-100 hover:bg-neutral-600 active:scale-95 transition flex items-center justify-center"
          >
            AC
          </button>
          <button
            onClick={handleToggleSign}
            className="h-16 rounded-full bg-neutral-700 text-neutral-100 hover:bg-neutral-600 active:scale-95 transition flex items-center justify-center"
          >
            ⁺∕₋
          </button>
          <button
            onClick={handlePercent}
            className="h-16 rounded-full bg-neutral-700 text-neutral-100 hover:bg-neutral-600 active:scale-95 transition flex items-center justify-center"
          >
            %
          </button>
          <button
            onClick={() => handleOp('÷')}
            className={`h-16 rounded-full ${
              operation === '÷' ? 'bg-white text-amber-600' : 'bg-amber-600 text-white'
            } hover:bg-amber-500 active:scale-95 transition flex items-center justify-center`}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleDigit('7')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            9
          </button>
          <button
            onClick={() => handleOp('×')}
            className={`h-16 rounded-full ${
              operation === '×' ? 'bg-white text-amber-600' : 'bg-amber-600 text-white'
            } hover:bg-amber-500 active:scale-95 transition flex items-center justify-center`}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleDigit('4')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            6
          </button>
          <button
            onClick={() => handleOp('−')}
            className={`h-16 rounded-full ${
              operation === '−' ? 'bg-white text-amber-600' : 'bg-amber-600 text-white'
            } hover:bg-amber-500 active:scale-95 transition flex items-center justify-center`}
          >
            −
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleDigit('1')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            3
          </button>
          <button
            onClick={() => handleOp('+')}
            className={`h-16 rounded-full ${
              operation === '+' ? 'bg-white text-amber-600' : 'bg-amber-600 text-white'
            } hover:bg-amber-500 active:scale-95 transition flex items-center justify-center`}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleDigit('0')}
            className="h-16 col-span-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-start pl-8"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="h-16 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95 transition flex items-center justify-center"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-16 rounded-full bg-amber-600 text-white hover:bg-amber-500 active:scale-95 transition flex items-center justify-center font-medium"
          >
            =
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-neutral-600">
            Hint: Enter PIN (default: <span className="font-mono text-neutral-500">{unlockPin}</span>) and press <span className="font-mono text-amber-500 font-bold">=</span> to unlock
          </p>
        </div>
      </div>

      {/* Discrete PIN Modal if user prefers typing directly */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl max-w-xs w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-2 text-center">Unlock Private Chat</h3>
            <p className="text-xs text-neutral-400 mb-4 text-center">
              Enter your 4-digit PIN to exit camouflage mode.
            </p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN (1402)"
                autoFocus
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-center tracking-widest text-xl text-white outline-none focus:border-rose-500"
              />
              {pinError && (
                <p className="text-red-400 text-xs text-center">Incorrect PIN</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-500"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
