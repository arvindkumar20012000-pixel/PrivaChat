import React, { useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Language, translations } from '../translations';
import { ThemeColors } from '../utils/theme';

interface ChatSearchBarProps {
  query: string;
  onChangeQuery: (q: string) => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClose: () => void;
  lang: Language;
  themeColors: ThemeColors;
}

export const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  query,
  onChangeQuery,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
  onClose,
  lang,
  themeColors,
}) => {
  const t = translations[lang];
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      className="w-full shrink-0 z-40 px-3 py-2 flex items-center gap-2 border-b shadow-sm transition-all animate-in slide-in-from-top-2 duration-150"
      style={{
        backgroundColor: themeColors.inputBg,
        borderColor: themeColors.border,
        color: themeColors.inputText,
      }}
    >
      {/* Search Icon & Input */}
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-black/5 dark:bg-white/5 border-neutral-300 dark:border-neutral-700">
        <Search className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.searchPlaceholder}
          className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-neutral-400 font-sans"
          style={{ color: themeColors.inputText }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onChangeQuery('')}
            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 transition"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Match Count & Navigation */}
      {query.trim() && (
        <div className="flex items-center gap-1 shrink-0 text-xs text-neutral-500 font-medium">
          {totalMatches > 0 ? (
            <>
              <span className="font-mono text-[11px] px-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                {currentMatchIndex + 1}/{totalMatches}
              </span>
              <button
                type="button"
                onClick={onPrevMatch}
                disabled={totalMatches <= 1}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition"
                title="Previous match (Shift+Enter)"
                aria-label="Previous match"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onNextMatch}
                disabled={totalMatches <= 1}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 transition"
                title="Next match (Enter)"
                aria-label="Next match"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          ) : (
            <span className="text-[11px] text-rose-500 px-1 font-medium">
              {t.noMatches}
            </span>
          )}
        </div>
      )}

      {/* Close Search */}
      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition shrink-0"
        title="Close search (Esc)"
        aria-label="Close search"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
