import React, { useState } from 'react';
import { Lock, FileText, CheckCircle2, Search, Plus } from 'lucide-react';

interface CamouflageNotesProps {
  onUnlock: () => void;
  unlockPin?: string;
}

export const CamouflageNotes: React.FC<CamouflageNotesProps> = ({
  onUnlock,
  unlockPin = '1402',
}) => {
  const [notes, setNotes] = useState([
    { id: 1, title: 'Database Systems Chapter 4', body: 'ACID properties, normalization, indexing strategies for B-trees and hash tables.', date: 'Oct 24' },
    { id: 2, title: 'Weekly Grocery & Essentials', body: 'Milk, oats, bananas, almond milk, coffee beans, laundry detergent.', date: 'Oct 25' },
    { id: 3, title: 'Meeting Takeaways with Team', body: 'Finalize Q4 roadmap, sprint review on Wednesday, review pull requests.', date: 'Oct 26' },
  ]);
  const [selectedNote, setSelectedNote] = useState(notes[0]);
  const [secretClickCount, setSecretClickCount] = useState(0);

  const handleSecretClick = () => {
    const next = secretClickCount + 1;
    if (next >= 3) {
      onUnlock();
    } else {
      setSecretClickCount(next);
      setTimeout(() => setSecretClickCount(0), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950/60 backdrop-blur">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h1 className="font-semibold text-sm tracking-tight text-slate-200">Personal Notes & Tasks</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onUnlock}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition"
            title="Unlock Private Space"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Unlock</span>
          </button>
        </div>
      </header>

      {/* Main Notes Layout */}
      <div className="flex-1 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 p-4">
        {/* Left Column: Note List */}
        <div className="md:pr-4 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs uppercase font-medium tracking-wider text-slate-400">All Notes (3)</span>
            <button className="p-1 hover:bg-slate-800 rounded text-slate-400">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full bg-slate-800/80 border border-slate-700/70 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-3 rounded-xl cursor-pointer transition border ${
                  selectedNote.id === note.id
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                    : 'bg-slate-800/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-sm font-medium truncate">{note.title}</h4>
                  <span className="text-[10px] text-slate-500">{note.date}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{note.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Note Preview / Editor */}
        <div className="md:col-span-2 md:pl-6 pt-4 md:pt-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <input
                type="text"
                value={selectedNote.title}
                readOnly
                className="text-lg font-semibold bg-transparent outline-none text-slate-100 w-full"
              />
              <span
                onClick={handleSecretClick}
                className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-400 px-2 py-1 rounded"
              >
                Saved
              </span>
            </div>
            <textarea
              value={selectedNote.body}
              readOnly
              className="w-full h-64 bg-transparent outline-none text-sm text-slate-300 resize-none leading-relaxed"
            />
          </div>

          <div className="text-[11px] text-slate-500 text-center py-2 border-t border-slate-800/60">
            Press <span className="font-mono text-slate-400">Unlock</span> button or enter PIN <span className="font-mono text-slate-400">{unlockPin}</span> to return to chat.
          </div>
        </div>
      </div>
    </div>
  );
};
