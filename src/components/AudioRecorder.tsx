import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause } from 'lucide-react';
import { Language, translations } from '../translations';

interface AudioRecorderProps {
  onSendAudio: (audioDataUrl: string, duration: number) => void;
  onCancel: () => void;
  lang: Language;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSendAudio,
  onCancel,
  lang,
}) => {
  const t = translations[lang];
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startRecording() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(200);

        timerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Audio permission failed:', err);
        alert(lang === 'hi' ? 'माइक्रोफ़ोन की अनुमति नहीं मिली।' : 'Microphone permission denied.');
        onCancel();
      }
    }

    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;

    const currentDuration = recordingSeconds;
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        onSendAudio(base64Audio, currentDuration);
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center justify-between w-full bg-rose-950/40 border border-rose-500/40 rounded-2xl p-2.5 px-4 backdrop-blur animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-mono text-rose-300 font-semibold">
          {formatTime(recordingSeconds)}
        </span>
        <span className="text-xs text-rose-200/80 hidden sm:inline">
          {t.recordingAudio}
        </span>
      </div>

      {/* Pulsing sound bars simulation */}
      <div className="flex items-center gap-1 h-5">
        {[40, 70, 30, 90, 60, 100, 45, 80, 50].map((h, i) => (
          <div
            key={i}
            className="w-1 bg-rose-400 rounded-full animate-pulse"
            style={{
              height: `${Math.max(20, (h * ((recordingSeconds % 3) + 1)) / 3)}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          title={t.cancelRecord}
          aria-label={t.cancelRecord}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleStopAndSend}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950 transition active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t.send}</span>
        </button>
      </div>
    </div>
  );
};

export const AudioPlayerBubble: React.FC<{
  src: string;
  duration?: number;
  isMe: boolean;
}> = ({ src, duration = 0, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[200px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow transition ${
          isMe
            ? 'bg-white text-rose-600 hover:bg-neutral-100'
            : 'bg-rose-600 text-white hover:bg-rose-500'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        {/* Progress bar */}
        <div className="flex items-center gap-1 h-4">
          {[3, 6, 4, 8, 5, 9, 7, 10, 6, 8, 4, 7, 5, 3].map((bar, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full ${
                isPlaying && (idx / 14) <= (currentTime / (duration || 5))
                  ? isMe ? 'bg-white' : 'bg-rose-500'
                  : isMe ? 'bg-rose-300/40' : 'bg-neutral-700'
              }`}
              style={{ height: `${bar * 10}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] opacity-75 mt-1 font-mono">
          <span>{formatSec(currentTime)}</span>
          <span>{formatSec(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};
