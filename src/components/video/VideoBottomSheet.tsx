import React, { useRef } from 'react';
import { 
  X, 
  Type, 
  Sparkles, 
  Image as ImageIcon, 
  Volume2, 
  Languages, 
  Check, 
  Upload, 
  Trash2,
  Sliders,
  AlignRight,
  AlignCenter,
  Eye,
  Activity
} from 'lucide-react';
import { VideoBackgroundTheme, TextAnimationType, Reciter } from '../../types/video';
import { VIDEO_BG_THEMES, RECITERS } from '../../constants/videoData';
import { triggerHaptic } from '../../utils/native';

export type VideoToolTab = 'none' | 'text' | 'animation' | 'background' | 'audio' | 'translation';

interface VideoBottomSheetProps {
  activeTab: VideoToolTab;
  onClose: () => void;
  // Text Props
  arabicFont: string;
  setArabicFont: (font: string) => void;
  arabicFontSize: number;
  setArabicFontSize: (size: number) => void;
  arabicLineSpacing: number;
  setArabicLineSpacing: (spacing: number) => void;
  arabicAlign: 'center' | 'right';
  setArabicAlign: (align: 'center' | 'right') => void;
  wordHighlightColor: string;
  setWordHighlightColor: (color: string) => void;
  showBismillah: boolean;
  setShowBismillah: (show: boolean) => void;
  bismillahStyle: string;
  setBismillahStyle: (style: string) => void;
  showReference: boolean;
  setShowReference: (show: boolean) => void;

  // Animation Props
  animationType: TextAnimationType;
  setAnimationType: (anim: TextAnimationType) => void;

  // Background Props
  currentThemeId: string;
  setThemeId: (id: string) => void;
  bgOverlayOpacity: number;
  setBgOverlayOpacity: (opacity: number) => void;
  customBgUrl: string | null;
  customBgType: 'image' | 'video' | null;
  onUploadCustomBg: (file: File) => void;
  onClearCustomBg: () => void;

  // Audio Props
  currentReciterId: number;
  setReciterId: (id: number) => void;
  waveformEnabled: boolean;
  setWaveformEnabled: (enabled: boolean) => void;
  waveformStyle: 'bars' | 'wave' | 'minimal';
  setWaveformStyle: (style: 'bars' | 'wave' | 'minimal') => void;
  onUploadCustomAudio: (file: File) => void;
  customAudioName: string | null;
  onClearCustomAudio: () => void;

  // Translation Props
  showTranslation: boolean;
  setShowTranslation: (show: boolean) => void;
  translationLang: 'en' | 'ur';
  setTranslationLang: (lang: 'en' | 'ur') => void;
  translationFontSize: number;
  setTranslationFontSize: (size: number) => void;

  // Watermark Props
  watermarkEnabled: boolean;
  setWatermarkEnabled: (enabled: boolean) => void;
  watermarkStyle: 'badge' | 'emblem' | 'text';
  setWatermarkStyle: (style: 'badge' | 'emblem' | 'text') => void;
}

const HIGHLIGHT_COLORS = [
  { label: 'Gold', value: '#fbbf24' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Cyan', value: '#38bdf8' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'White', value: '#ffffff' },
];

export const VideoBottomSheet: React.FC<VideoBottomSheetProps> = ({
  activeTab,
  onClose,
  arabicFont,
  setArabicFont,
  arabicFontSize,
  setArabicFontSize,
  arabicLineSpacing,
  setArabicLineSpacing,
  arabicAlign,
  setArabicAlign,
  wordHighlightColor,
  setWordHighlightColor,
  showBismillah,
  setShowBismillah,
  bismillahStyle,
  setBismillahStyle,
  showReference,
  setShowReference,
  animationType,
  setAnimationType,
  currentThemeId,
  setThemeId,
  bgOverlayOpacity,
  setBgOverlayOpacity,
  customBgUrl,
  customBgType,
  onUploadCustomBg,
  onClearCustomBg,
  currentReciterId,
  setReciterId,
  waveformEnabled,
  setWaveformEnabled,
  waveformStyle,
  setWaveformStyle,
  onUploadCustomAudio,
  customAudioName,
  onClearCustomAudio,
  showTranslation,
  setShowTranslation,
  translationLang,
  setTranslationLang,
  translationFontSize,
  setTranslationFontSize,
  watermarkEnabled,
  setWatermarkEnabled,
  watermarkStyle,
  setWatermarkStyle,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  if (activeTab === 'none') return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-slate-900 border-t border-slate-800/90 rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-200">
      {/* Visual drag pill handle */}
      <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2">
          {activeTab === 'text' && <Type className="w-4 h-4 text-emerald-400" />}
          {activeTab === 'animation' && <Sparkles className="w-4 h-4 text-amber-400" />}
          {activeTab === 'background' && <ImageIcon className="w-4 h-4 text-cyan-400" />}
          {activeTab === 'audio' && <Volume2 className="w-4 h-4 text-purple-400" />}
          {activeTab === 'translation' && <Languages className="w-4 h-4 text-rose-400" />}
          <h3 className="text-xs font-semibold text-slate-100 capitalize">
            {activeTab === 'text' && 'Typography & Calligraphy'}
            {activeTab === 'animation' && 'Text Motion & Animation'}
            {activeTab === 'background' && 'Background Atmosphere'}
            {activeTab === 'audio' && 'Reciter & Audio Sync'}
            {activeTab === 'translation' && 'Translation Layer'}
          </h3>
        </div>
        <button
          onClick={() => {
            triggerHaptic();
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div 
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
        }}
        className="p-4 overflow-y-auto space-y-4 text-xs text-slate-300"
      >
        {/* TAB 1: TEXT & CALLIGRAPHY */}
        {activeTab === 'text' && (
          <>
            {/* Arabic Font Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Calligraphy Script
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Amiri', name: 'Amiri (Naskh)' },
                  { id: 'Scheherazade New', name: 'Scheherazade' },
                  { id: 'Lateef', name: 'Lateef' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      triggerHaptic();
                      setArabicFont(f.id);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition font-semibold ${
                      arabicFont === f.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Line Spacing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Font Size</span>
                  <span className="font-mono text-emerald-400">{arabicFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="40"
                  value={arabicFontSize}
                  onChange={(e) => setArabicFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Line Spacing</span>
                  <span className="font-mono text-emerald-400">{arabicLineSpacing.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.6"
                  max="2.8"
                  step="0.1"
                  value={arabicLineSpacing}
                  onChange={(e) => setArabicLineSpacing(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Alignment & Word Highlight Glow Color */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Text Alignment
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setArabicAlign('center');
                    }}
                    className={`flex-1 py-1.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                      arabicAlign === 'center'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" /> Center
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setArabicAlign('right');
                    }}
                    className={`flex-1 py-1.5 rounded-xl border flex items-center justify-center gap-1 transition ${
                      arabicAlign === 'right'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" /> Right
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Highlight Glow
                </label>
                <div className="flex items-center gap-1.5">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        triggerHaptic();
                        setWordHighlightColor(c.value);
                      }}
                      style={{ backgroundColor: c.value }}
                      className={`w-6 h-6 rounded-full border transition relative flex items-center justify-center ${
                        wordHighlightColor === c.value ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-70'
                      }`}
                    >
                      {wordHighlightColor === c.value && (
                        <Check className="w-3 h-3 text-black stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bismillah Header Options */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-300">Bismillah Header</span>
                <input
                  type="checkbox"
                  checked={showBismillah}
                  onChange={(e) => setShowBismillah(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>
              {showBismillah && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'classic', label: 'Classic' },
                    { id: 'ornamental', label: 'Ligature (﷽)' },
                    { id: 'framed', label: 'Framed' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        triggerHaptic();
                        setBismillahStyle(s.id);
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-center transition text-[10px] ${
                        bismillahStyle === s.id
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Surah Reference Pill */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="font-medium text-slate-300 block">Surah & Verse Badge</span>
                <span className="text-[10px] text-slate-500">Show sacred chapter name pill at top</span>
              </div>
              <input
                type="checkbox"
                checked={showReference}
                onChange={(e) => setShowReference(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>
          </>
        )}

        {/* TAB 2: ANIMATION */}
        {activeTab === 'animation' && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Animation Style
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'highlight',
                    label: 'Word Highlight',
                    desc: 'Real-time active glow as recited',
                  },
                  {
                    id: 'fade',
                    label: 'Gentle Fade',
                    desc: 'Smooth verse fade transitions',
                  },
                  {
                    id: 'reveal',
                    label: 'Progressive Reveal',
                    desc: 'Words appear in time sequence',
                  },
                  {
                    id: 'scale',
                    label: 'Breathing Depth',
                    desc: 'Subtle spiritual depth pulse',
                  },
                  {
                    id: 'slide',
                    label: 'Gentle Slide',
                    desc: 'Smooth upward glide into view',
                  },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => {
                      triggerHaptic();
                      setAnimationType(anim.id as TextAnimationType);
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      animationType === anim.id
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-xs'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-semibold text-xs flex items-center justify-between">
                      {anim.label}
                      {animationType === anim.id && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-[10px] text-slate-400">{anim.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: BACKGROUND */}
        {activeTab === 'background' && (
          <>
            {/* Ambient Themes */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Atmospheric Gradients
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_BG_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      triggerHaptic();
                      setThemeId(theme.id);
                    }}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      currentThemeId === theme.id && !customBgUrl
                        ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-800/70 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div
                      style={{
                        background: `radial-gradient(circle, ${theme.canvasBg[1]} 0%, ${theme.canvasBg[0]} 50%, ${theme.canvasBg[2]} 100%)`,
                      }}
                      className="w-full h-8 rounded-lg border border-white/10 shadow-xs"
                    />
                    <span className="text-[10px] font-medium text-slate-300 truncate w-full">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Darkness Overlay Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Overlay Dim / Contrast</span>
                <span className="font-mono text-emerald-400">
                  {Math.round(bgOverlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.85"
                step="0.05"
                value={bgOverlayOpacity}
                onChange={(e) => setBgOverlayOpacity(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Custom Background Upload (Zero upload, 100% browser local memory) */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Custom Media (Image / Video)
              </label>

              {customBgUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] text-slate-200 capitalize">
                      Custom {customBgType || 'file'} loaded (Local)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onClearCustomBg();
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                    title="Remove custom background"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Upload Image or Video (Local only)</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1 text-center">
                    Files remain strictly within your browser and are never uploaded to any server.
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadCustomBg(file);
                  }
                }}
              />
            </div>

            {/* Hadith of the Moment Branding Watermark */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img src="/icon.svg" alt="Brand" className="w-5 h-5 rounded-md object-cover" />
                  <div>
                    <span className="font-semibold text-xs text-slate-200 block">Hadith of the Moment Watermark</span>
                    <span className="text-[10px] text-slate-400">Included on exported video frames</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setWatermarkEnabled(!watermarkEnabled);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
                    watermarkEnabled
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {watermarkEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {watermarkEnabled && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'badge', label: 'Badge Pill' },
                    { id: 'emblem', label: 'Circle Icon' },
                    { id: 'text', label: 'Clean Text' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        triggerHaptic();
                        setWatermarkStyle(st.id as 'badge' | 'emblem' | 'text');
                      }}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition text-center ${
                        watermarkStyle === st.id
                          ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-bold ring-1 ring-sky-500/30'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 4: AUDIO & RECITATION */}
        {activeTab === 'audio' && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Quran Reciter
              </label>
              <div className="space-y-1.5">
                {RECITERS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      triggerHaptic();
                      setReciterId(r.id);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      currentReciterId === r.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-xs'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{r.name}</div>
                      <div className="text-[10px] text-slate-400">{r.subname}</div>
                    </div>
                    {currentReciterId === r.id && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Waveform Visualizer Settings */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-slate-200 block">Audio Waveform Visualizer</span>
                  <span className="text-[10px] text-slate-500">
                    Real-time sound frequency bars on video
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={waveformEnabled}
                  onChange={(e) => setWaveformEnabled(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded"
                />
              </div>

              {waveformEnabled && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'bars', label: 'Balanced Bars' },
                    { id: 'wave', label: 'Rising Wave' },
                    { id: 'minimal', label: 'Minimal Dots' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        triggerHaptic();
                        setWaveformStyle(style.id as any);
                      }}
                      className={`py-1.5 px-2 rounded-xl border text-center transition text-[10px] ${
                        waveformStyle === style.id
                          ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Recitation Audio Upload */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Custom Recitation File
              </label>

              {customAudioName ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="flex items-center gap-2 truncate">
                    <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-[11px] text-slate-200 truncate">{customAudioName}</span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      onClearCustomAudio();
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                    title="Remove custom audio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full py-2 border border-dashed border-slate-700 hover:border-purple-500 rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 transition text-[11px]"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>Upload Custom Audio (MP3/WAV)</span>
                  </button>
                  <p className="text-[10px] text-slate-500 mt-1 text-center">
                    Audio is processed locally in browser memory.
                  </p>
                </div>
              )}

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadCustomAudio(file);
                  }
                }}
              />
            </div>
          </>
        )}

        {/* TAB 5: TRANSLATION */}
        {activeTab === 'translation' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-slate-200 block">Show Verse Translation</span>
                <span className="text-[10px] text-slate-500">
                  Synchronized meaning subtitles
                </span>
              </div>
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded"
              />
            </div>

            {showTranslation && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Language Edition
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setTranslationLang('en');
                      }}
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        translationLang === 'en'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      English (Sahih Int.)
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setTranslationLang('ur');
                      }}
                      className={`py-2 px-3 rounded-xl border text-center transition ${
                        translationLang === 'ur'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      Urdu (Jalandhry)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Subtitle Font Size</span>
                    <span className="font-mono text-rose-400">{translationFontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="11"
                    max="22"
                    value={translationFontSize}
                    onChange={(e) => setTranslationFontSize(Number(e.target.value))}
                    className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
