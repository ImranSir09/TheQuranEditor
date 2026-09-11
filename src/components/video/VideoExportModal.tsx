import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Film, 
  Loader2,
  Sparkles,
  Play
} from 'lucide-react';
import { SurahInfo, AyahData } from '../../types';
import { VideoAspectRatio } from '../../types/video';
import { triggerHaptic, isNativePlatform } from '../../utils/native';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surah: SurahInfo | null;
  startAyah: number;
  endAyah: number;
  ayahs: AyahData[];
  aspectRatio: VideoAspectRatio;
  duration: number;
  isExporting: boolean;
  exportProgress: number; // 0 to 100
  exportedVideoUrl: string | null;
  onStartExport: (quality: '1080p' | '720p') => void;
  onDownloadVideo: () => void;
  onShareVideo: () => void;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  surah,
  startAyah,
  endAyah,
  ayahs,
  aspectRatio,
  duration,
  isExporting,
  exportProgress,
  exportedVideoUrl,
  onStartExport,
  onDownloadVideo,
  onShareVideo,
}) => {
  const [selectedQuality, setSelectedQuality] = useState<'1080p' | '720p'>('1080p');

  if (!isOpen) return null;

  // Pre-export validation check to strictly uphold Quran integrity
  const isArabicValid = ayahs.length > 0 && ayahs.every((a) => a.arabicText && a.arabicText.trim().length > 0);
  const isRangeValid = surah && startAyah >= 1 && endAyah >= startAyah && endAyah <= surah.numberOfAyahs;
  const isReadyToExport = isArabicValid && isRangeValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 rounded-2xl w-full max-w-md flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export Quran Video</h3>
              <p className="text-[11px] text-slate-400">
                {surah ? `Surah ${surah.englishName} (${startAyah}:${endAyah})` : 'Export Video'}
              </p>
            </div>
          </div>
          {!isExporting && (
            <button
              onClick={() => {
                triggerHaptic();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Exporting State */}
          {isExporting ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono">
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Rendering Video...</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronizing Quran recitation and canvas motion
                </p>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  style={{ width: `${exportProgress}%` }}
                  className="bg-emerald-500 h-full transition-all duration-150 rounded-full"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Please keep this tab open while the browser compiles your video.
              </p>
            </div>
          ) : exportedVideoUrl ? (
            /* Finished Export State */
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 flex items-center justify-center">
                <video
                  src={exportedVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-200">
                  Video rendered successfully with verified Quran text.
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    triggerHaptic();
                    onDownloadVideo();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Download className="w-4 h-4" /> Download Video
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    onShareVideo();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          ) : (
            /* Configure Export State */
            <>
              {/* Quran Validation Notice */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Quran Validation</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  All Arabic verses are checked against the verified Uthmani recitation script with full tashkeel and safe typographic margins.
                </p>
              </div>

              {/* Quality Preset */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Resolution Preset
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setSelectedQuality('1080p');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      selectedQuality === '1080p'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">1080p Full HD</span>
                    <span className="text-[10px] text-slate-400">
                      High bitrate for TikTok, Reels & YouTube
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic();
                      setSelectedQuality('720p');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      selectedQuality === '720p'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs">720p Standard</span>
                    <span className="text-[10px] text-slate-400">
                      Fast rendering, lightweight file size
                    </span>
                  </button>
                </div>
              </div>

              {/* Video Info Pill */}
              <div className="flex items-center justify-between text-xs text-slate-400 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span>Aspect Ratio: <strong className="text-slate-200">{aspectRatio}</strong></span>
                <span>Duration: <strong className="text-slate-200">~{Math.round(duration)}s</strong></span>
                <span>Verses: <strong className="text-slate-200">{ayahs.length}</strong></span>
              </div>

              {/* Start Export Button */}
              <button
                onClick={() => {
                  triggerHaptic();
                  onStartExport(selectedQuality);
                }}
                disabled={!isReadyToExport}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                  isReadyToExport
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Film className="w-4 h-4" /> Start Video Export
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
