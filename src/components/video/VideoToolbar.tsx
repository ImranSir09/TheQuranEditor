import React from 'react';
import { 
  BookOpen, 
  Undo2, 
  Redo2, 
  Download, 
  Save, 
  ChevronDown, 
  Smartphone, 
  Monitor, 
  Square,
  Sparkles
} from 'lucide-react';
import { SurahInfo } from '../../types';
import { VideoAspectRatio } from '../../types/video';
import { triggerHaptic } from '../../utils/native';

interface VideoToolbarProps {
  selectedSurah: SurahInfo | null;
  startAyah: number;
  endAyah: number;
  onOpenSurahModal: () => void;
  aspectRatio: VideoAspectRatio;
  onChangeAspectRatio: (ratio: VideoAspectRatio) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveProject: () => void;
  onOpenExport: () => void;
}

export const VideoToolbar: React.FC<VideoToolbarProps> = ({
  selectedSurah,
  startAyah,
  endAyah,
  onOpenSurahModal,
  aspectRatio,
  onChangeAspectRatio,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveProject,
  onOpenExport,
}) => {
  return (
    <div className="w-full bg-slate-950/95 border-b border-slate-800 px-2.5 py-2 flex items-center justify-between gap-1.5 shrink-0 z-20">
      {/* Left: Surah & Ayah Selector Button */}
      <button
        onClick={() => {
          triggerHaptic();
          onOpenSurahModal();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-white text-xs font-medium transition shadow-xs max-w-[190px] sm:max-w-xs truncate"
      >
        <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="truncate">
          {selectedSurah ? `${selectedSurah.englishName} (${startAyah}-${endAyah})` : 'Select Verse'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
      </button>

      {/* Center: Aspect Ratio Segment Switcher */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
        <button
          onClick={() => {
            triggerHaptic();
            onChangeAspectRatio('9:16');
          }}
          title="Story / Reel (9:16)"
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
            aspectRatio === '9:16'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-2.5 h-2.5" />
          <span>9:16</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onChangeAspectRatio('1:1');
          }}
          title="Square (1:1)"
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
            aspectRatio === '1:1'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Square className="w-2.5 h-2.5" />
          <span>1:1</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onChangeAspectRatio('16:9');
          }}
          title="Landscape (16:9)"
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition ${
            aspectRatio === '16:9'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-2.5 h-2.5" />
          <span>16:9</span>
        </button>
      </div>

      {/* Right: Undo / Redo, Save, and Export */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            triggerHaptic();
            onUndo();
          }}
          disabled={!canUndo}
          title="Undo"
          className={`p-1.5 rounded-lg transition ${
            canUndo
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onRedo();
          }}
          disabled={!canRedo}
          title="Redo"
          className={`p-1.5 rounded-lg transition ${
            canRedo
              ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onSaveProject();
          }}
          title="Save Project"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            triggerHaptic();
            onOpenExport();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition active:scale-95 ml-0.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Export</span>
        </button>
      </div>
    </div>
  );
};
