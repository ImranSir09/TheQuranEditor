import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipBack, 
  SkipForward, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  Type, 
  Languages, 
  Image as ImageIcon, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AyahData } from '../../types';
import { AyahTiming } from '../../types/video';
import { formatTime } from '../../utils/videoAudio';
import { triggerHaptic } from '../../utils/native';

interface VideoTimelineProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onSeekToVerse: (verseIndex: number) => void;
  ayahs: AyahData[];
  currentAyahIndex: number;
  ayahTimings: Record<string, AyahTiming>;
  hasWordSegments: boolean;
  waveformData: number[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  themeAccentColor: string;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  onSeekToVerse,
  ayahs,
  currentAyahIndex,
  ayahTimings,
  hasWordSegments,
  waveformData,
  isExpanded,
  onToggleExpanded,
  themeAccentColor,
}) => {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const calculateTimeFromClientX = useCallback(
    (clientX: number) => {
      if (!scrubberRef.current || duration <= 0) return 0;
      const rect = scrubberRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return pos * duration;
    },
    [duration]
  );

  const handlePointerDown = (clientX: number) => {
    setIsScrubbing(true);
    const targetTime = calculateTimeFromClientX(clientX);
    setScrubTime(targetTime);
    onSeek(targetTime);
    triggerHaptic();
  };

  const handlePointerMove = (clientX: number) => {
    if (!isScrubbing) return;
    const targetTime = calculateTimeFromClientX(clientX);
    setScrubTime(targetTime);
    onSeek(targetTime);
  };

  const handlePointerUp = () => {
    if (isScrubbing) {
      setIsScrubbing(false);
      setScrubTime(null);
    }
  };

  // Global pointer move and up listeners while scrubbing so finger/cursor can leave the bar freely
  useEffect(() => {
    if (!isScrubbing) return;

    const onGlobalMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX);
    };
    const onGlobalMouseUp = () => {
      handlePointerUp();
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX);
      }
    };
    const onGlobalTouchEnd = () => {
      handlePointerUp();
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalTouchEnd);
    window.addEventListener('touchcancel', onGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalTouchEnd);
      window.removeEventListener('touchcancel', onGlobalTouchEnd);
    };
  }, [isScrubbing, calculateTimeFromClientX]);

  const displayedTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayedTime / duration) * 100)) : 0;

  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800 backdrop-blur-md transition-all duration-300 select-none flex flex-col shrink-0">
      {/* Playback Transport Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 gap-2">
        {/* Left: Play/Pause and Seek Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => {
              triggerHaptic();
              onSeek(0);
            }}
            title="Reset to beginning"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              onSeek(Math.max(0, currentTime - 3));
            }}
            title="Back 3s"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition active:scale-95"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              onTogglePlay();
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition active:scale-90"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => {
              triggerHaptic();
              onSeek(Math.min(duration, currentTime + 3));
            }}
            title="Forward 3s"
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition active:scale-95"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Time indicator and sync status badge */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-emerald-400 font-semibold">{formatTime(currentTime)}</span>
          <span className="text-slate-600 font-mono">/</span>
          <span className="font-mono text-slate-400">{formatTime(duration)}</span>

          {hasWordSegments ? (
            <span 
              title="Verified Word-by-Word Timing loaded from Quran.com"
              className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
            >
              <CheckCircle2 className="w-2.5 h-2.5" /> Word Sync
            </span>
          ) : null}
        </div>

        {/* Right: Expand/Collapse Multi-Track Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleExpanded();
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition active:scale-95 border border-slate-800/80"
        >
          <span className="text-[11px] font-medium hidden xs:inline">{isExpanded ? 'Collapse' : 'Tracks'}</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Primary Scrubbing Track with generous 44px mobile touch target */}
      <div 
        ref={scrubberRef}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX);
        }}
        className="w-full h-11 bg-slate-900/90 relative cursor-pointer group flex items-center border-b border-slate-800/50 px-3 touch-none select-none"
      >
        {/* Waveform preview bars inside scrubber */}
        <div className="absolute inset-x-3 inset-y-0 flex items-center justify-between opacity-35 group-hover:opacity-50 transition pointer-events-none">
          {waveformData.slice(0, 52).map((val, idx) => (
            <div
              key={idx}
              style={{ height: `${Math.max(4, val * 22)}px` }}
              className="w-0.5 bg-slate-300/80 rounded-full"
            />
          ))}
        </div>

        {/* Background Track Line */}
        <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden relative shadow-inner">
          {/* Progress Fill */}
          <div
            style={{ width: `${progressPercent}%`, backgroundColor: themeAccentColor || '#10b981' }}
            className="h-full rounded-full shadow-xs transition-[width] duration-75"
          />
        </div>

        {/* Floating Time Tooltip while scrubbing/dragging */}
        {isScrubbing && (
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute -top-7 -translate-x-1/2 bg-emerald-500 text-slate-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none flex items-center gap-1 z-30 animate-in fade-in zoom-in-95 duration-100"
          >
            <span>{formatTime(displayedTime)}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-solid border-t-emerald-500 border-t-4 border-x-transparent border-x-4 border-b-0" />
          </div>
        )}

        {/* Playhead Pin */}
        <div
          style={{ left: `${progressPercent}%` }}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-emerald-500 pointer-events-none transition-transform duration-100 ${
            isScrubbing ? 'scale-125 ring-4 ring-emerald-500/30' : 'group-hover:scale-110'
          }`}
        />
      </div>

      {/* Multi-Track Detail View (Collapsible) */}
      {isExpanded && (
        <div className="p-2 space-y-1.5 text-[11px] bg-slate-950 max-h-48 overflow-y-auto scrollbar-none">
          {/* Track 1: Quran Arabic Verses */}
          <div className="flex items-center gap-2">
            <div className="w-20 shrink-0 flex items-center gap-1 text-slate-400 font-medium">
              <Type className="w-3 h-3 text-emerald-400" />
              <span>Quran</span>
            </div>
            <div className="flex-1 flex gap-1 h-6 bg-slate-900 rounded p-0.5 border border-slate-800 overflow-hidden">
              {ayahs.map((ayah, idx) => {
                const isActive = idx === currentAyahIndex;
                return (
                  <button
                    key={ayah.number}
                    onClick={() => {
                      triggerHaptic();
                      onSeekToVerse(idx);
                    }}
                    title={`Jump to Ayah ${ayah.numberInSurah}`}
                    className={`flex-1 flex items-center justify-center rounded text-[10px] font-semibold transition truncate px-1 ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    v.{ayah.numberInSurah}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Track 2: Translation Layer */}
          <div className="flex items-center gap-2">
            <div className="w-20 shrink-0 flex items-center gap-1 text-slate-400 font-medium">
              <Languages className="w-3 h-3 text-cyan-400" />
              <span>Translation</span>
            </div>
            <div className="flex-1 flex gap-1 h-6 bg-slate-900 rounded p-0.5 border border-slate-800 overflow-hidden">
              {ayahs.map((ayah, idx) => (
                <div
                  key={ayah.number}
                  className={`flex-1 flex items-center justify-center rounded text-[9px] truncate px-1 ${
                    idx === currentAyahIndex ? 'bg-cyan-950 text-cyan-200 border border-cyan-800/40' : 'bg-slate-800/60 text-slate-500'
                  }`}
                >
                  {ayah.englishText.slice(0, 14)}...
                </div>
              ))}
            </div>
          </div>

          {/* Track 3: Background Layer */}
          <div className="flex items-center gap-2">
            <div className="w-20 shrink-0 flex items-center gap-1 text-slate-400 font-medium">
              <ImageIcon className="w-3 h-3 text-amber-400" />
              <span>Visual</span>
            </div>
            <div className="flex-1 h-6 bg-slate-900 rounded px-2 flex items-center justify-between border border-slate-800 text-slate-400">
              <span className="text-[10px] text-amber-300/80 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Atmospheric Canvas Motion
              </span>
              <span className="text-[9px] text-slate-500">100%</span>
            </div>
          </div>

          {/* Track 4: Audio Waveform Track */}
          <div className="flex items-center gap-2">
            <div className="w-20 shrink-0 flex items-center gap-1 text-slate-400 font-medium">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span>Recitation</span>
            </div>
            <div className="flex-1 h-6 bg-slate-900 rounded px-1.5 flex items-center gap-0.5 border border-slate-800 overflow-hidden">
              {waveformData.slice(0, 60).map((v, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.max(3, v * 16)}px` }}
                  className="flex-1 bg-purple-400/60 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
