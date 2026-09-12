import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Type, 
  Sparkles, 
  Image as ImageIcon, 
  Volume2, 
  Languages, 
  Play, 
  Pause,
  RotateCcw
} from 'lucide-react';
import { SurahInfo, AyahData } from '../../types';
import { 
  VideoAspectRatio, 
  VideoBackgroundTheme, 
  TextAnimationType, 
  AyahTiming,
  VideoProject
} from '../../types/video';
import { VIDEO_BG_THEMES, VIDEO_RATIO_CONFIGS, RECITERS } from '../../constants/videoData';
import { 
  fetchRecitationTimings, 
  extractWaveformFromUrl, 
  generateWaveformData 
} from '../../utils/videoAudio';
import { VideoPreviewCanvas } from './VideoPreviewCanvas';
import { VideoTimeline } from './VideoTimeline';
import { VideoToolbar } from './VideoToolbar';
import { VideoBottomSheet, VideoToolTab } from './VideoBottomSheet';
import { VideoExportModal } from './VideoExportModal';
import SurahSelector from '../SurahSelector';
import { 
  triggerHaptic, 
  shareVerseImage, 
  saveViaSystemPicker,
  saveVideoFile,
  shareVideoFile,
  getVideoExportMimeType,
  isNativePlatform,
  listenToHardwareBack
} from '../../utils/native';

interface VideoEditorProps {
  initialSurah?: SurahInfo | null;
  isActive?: boolean;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ initialSurah, isActive = true }) => {
  // Surah & Verse selection state
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);
  const [ayahsData, setAyahsData] = useState<AyahData[]>([]);
  const [isSurahModalOpen, setIsSurahModalOpen] = useState<boolean>(false);

  // Audio and Synchronization State
  const [reciterId, setReciterId] = useState<number>(7); // Default: Mishari Rashid al-`Afasy
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [ayahTimings, setAyahTimings] = useState<Record<string, AyahTiming>>({});
  const [hasWordSegments, setHasWordSegments] = useState<boolean>(false);
  const [waveformData, setWaveformData] = useState<number[]>(generateWaveformData(64));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(10);
  const [clipOffsetSeconds, setClipOffsetSeconds] = useState<number>(0);

  // Visual & Typographic styling
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('9:16');
  const [themeId, setThemeId] = useState<string>('emerald');
  const [bgOverlayOpacity, setBgOverlayOpacity] = useState<number>(0.2);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [customBgType, setCustomBgType] = useState<'image' | 'video' | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);

  // Arabic text & typography
  const [arabicFont, setArabicFont] = useState<string>('Amiri');
  const [arabicFontSize, setArabicFontSize] = useState<number>(26);
  const [arabicLineSpacing, setArabicLineSpacing] = useState<number>(2.0);
  const [arabicAlign, setArabicAlign] = useState<'center' | 'right'>('center');
  const [wordHighlightColor, setWordHighlightColor] = useState<string>('#fbbf24');
  const [showBismillah, setShowBismillah] = useState<boolean>(true);
  const [bismillahStyle, setBismillahStyle] = useState<string>('classic');
  const [showReference, setShowReference] = useState<boolean>(true);

  // Motion & Animation
  const [animationType, setAnimationType] = useState<TextAnimationType>('highlight');

  // Translation
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [translationLang, setTranslationLang] = useState<'en' | 'ur'>('en');
  const [translationFontSize, setTranslationFontSize] = useState<number>(14);

  // Waveform Visualizer
  const [waveformEnabled, setWaveformEnabled] = useState<boolean>(true);
  const [waveformStyle, setWaveformStyle] = useState<'bars' | 'wave' | 'minimal'>('bars');

  // Hadith of the Moment Branding Watermark
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [watermarkStyle, setWatermarkStyle] = useState<'badge' | 'emblem' | 'text'>('badge');

  // UI state: bottom dock & timeline
  const [activeTool, setActiveTool] = useState<VideoToolTab>('none');
  const [isTimelineExpanded, setIsTimelineExpanded] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedExtension, setExportedExtension] = useState<'mp4' | 'webm'>('mp4');
  const [isSavingVideo, setIsSavingVideo] = useState<boolean>(false);
  const [savedFileUri, setSavedFileUri] = useState<string | null>(null);

  // Undo / Redo history
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const customVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const exportIntervalRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Helper to get active theme object
  const currentTheme =
    VIDEO_BG_THEMES.find((t) => t.id === themeId) || VIDEO_BG_THEMES[0];

  // Hardware Back button handling for Android APK
  useEffect(() => {
    const cleanup = listenToHardwareBack(() => {
      if (isExportModalOpen) {
        if (!isExporting) setIsExportModalOpen(false);
        return true;
      }
      if (isSurahModalOpen) {
        setIsSurahModalOpen(false);
        return true;
      }
      if (activeTool !== 'none') {
        setActiveTool('none');
        return true;
      }
      if (isTimelineExpanded) {
        setIsTimelineExpanded(false);
        return true;
      }
      return false;
    });

    return () => {
      cleanup();
    };
  }, [isExportModalOpen, isExporting, isSurahModalOpen, activeTool, isTimelineExpanded]);

  // 1. Initial Load of Surah list from cache or API
  useEffect(() => {
    const cached = localStorage.getItem('quran_surahs_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSurahs(parsed);
          setSelectedSurah(parsed[0]);
          return;
        }
      } catch {}
    }

    fetch('https://api.alquran.cloud/v1/surah')
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200 && data.data) {
          setSurahs(data.data);
          localStorage.setItem('quran_surahs_cache', JSON.stringify(data.data));
          if (!selectedSurah) {
            setSelectedSurah(data.data[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load surahs for video editor:', err));
  }, []);

  // 2. Load Quran Arabic & Translation Data when Surah/Range changes
  useEffect(() => {
    if (!selectedSurah) return;

    const s = Math.max(1, Math.min(startAyah, selectedSurah.numberOfAyahs));
    const e = Math.max(s, Math.min(endAyah, selectedSurah.numberOfAyahs));

    const cacheKey = `quran_surah_full_${selectedSurah.number}`;
    const cachedData = localStorage.getItem(cacheKey);

    const parseCombined = (arabicAyahs: any[], englishAyahs: any[], urduAyahs: any[]) => {
      const combined: AyahData[] = [];
      for (let i = s - 1; i < e; i++) {
        if (arabicAyahs[i]) {
          combined.push({
            number: arabicAyahs[i].number,
            numberInSurah: arabicAyahs[i].numberInSurah,
            arabicText: arabicAyahs[i].text,
            englishText: englishAyahs[i]?.text || '',
            urduText: urduAyahs[i]?.text || '',
            juz: arabicAyahs[i].juz,
            page: arabicAyahs[i].page,
          });
        }
      }
      return combined;
    };

    if (cachedData) {
      try {
        const { arabicAyahs, englishAyahs, urduAyahs } = JSON.parse(cachedData);
        const combined = parseCombined(arabicAyahs, englishAyahs, urduAyahs);
        if (combined.length > 0) {
          setAyahsData(combined);
        }
      } catch {}
    }

    const urlArabic = `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/quran-uthmani`;
    const urlEnglish = `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/en.sahih`;
    const urlUrdu = `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/ur.jalandhry`;

    Promise.all([
      fetch(urlArabic).then((r) => r.json()),
      fetch(urlEnglish).then((r) => r.json()),
      fetch(urlUrdu).then((r) => r.json()),
    ])
      .then(([aRes, eRes, uRes]) => {
        if (aRes.code === 200 && eRes.code === 200 && uRes.code === 200) {
          const aList = aRes.data[0].ayahs;
          const eList = eRes.data[0].ayahs;
          const uList = uRes.data[0].ayahs;

          try {
            localStorage.setItem(cacheKey, JSON.stringify({ arabicAyahs: aList, englishAyahs: eList, urduAyahs: uList }));
          } catch {}

          setAyahsData(parseCombined(aList, eList, uList));
        }
      })
      .catch((err) => console.error('Error fetching verse data:', err));
  }, [selectedSurah, startAyah, endAyah]);

  // 3. Load Recitation Audio & Word-by-Word Timings
  useEffect(() => {
    if (!selectedSurah) return;

    if (customAudioUrl) {
      setAudioUrl(customAudioUrl);
      return;
    }

    fetchRecitationTimings(selectedSurah.number, reciterId)
      .then(({ audioUrl: url, timings, hasWordSegments: hasSegments }) => {
        setAudioUrl(url);
        setAyahTimings(timings);
        setHasWordSegments(hasSegments);

        // Compute clip duration and start offset
        const firstVerseKey = `${selectedSurah.number}:${startAyah}`;
        const lastVerseKey = `${selectedSurah.number}:${endAyah}`;

        const firstTiming = timings[firstVerseKey];
        const lastTiming = timings[lastVerseKey];

        if (firstTiming && lastTiming) {
          const startSec = firstTiming.fromMs / 1000;
          const endSec = lastTiming.toMs / 1000;
          const clipDur = Math.max(2, endSec - startSec);
          setClipOffsetSeconds(startSec);
          setDuration(clipDur);
        } else {
          // Fallback approximate duration
          setClipOffsetSeconds(0);
          setDuration(Math.max(5, (endAyah - startAyah + 1) * 4.5));
        }

        // Generate or extract waveform
        extractWaveformFromUrl(url, 64).then((data) => {
          setWaveformData(data);
        });
      })
      .catch((err) => console.warn('Audio timing fetch error:', err));
  }, [selectedSurah, startAyah, endAyah, reciterId, customAudioUrl]);

  // 4. Manage Playback Loop with `<audio>` element
  useEffect(() => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }

    audio.src = audioUrl;
    audio.crossOrigin = 'anonymous';

    const handleTimeUpdate = () => {
      if (!audio) return;
      const relativeTime = Math.max(0, audio.currentTime - clipOffsetSeconds);
      setCurrentTime(relativeTime);

      // Loop back if reached end of selected clip
      if (relativeTime >= duration && duration > 0) {
        audio.currentTime = clipOffsetSeconds;
        setCurrentTime(0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio?.removeEventListener('timeupdate', handleTimeUpdate);
      audio?.removeEventListener('ended', handleEnded);
      audio?.pause();
    };
  }, [audioUrl, clipOffsetSeconds, duration]);

  // Pause audio recitation if user switches to Poster mode
  useEffect(() => {
    if (!isActive && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  // 60FPS high-precision synchronization clock for buttery smooth timeline playhead, waveform, and word highlighting
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;

    const tick = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const rel = Math.max(0, audio.currentTime - clipOffsetSeconds);
        setCurrentTime(rel);

        if (rel >= duration && duration > 0) {
          audio.currentTime = clipOffsetSeconds;
          setCurrentTime(0);
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, clipOffsetSeconds, duration]);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= duration || audio.currentTime < clipOffsetSeconds) {
        audio.currentTime = clipOffsetSeconds;
      }
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.warn('Play error:', e));
    }
  }, [isPlaying, currentTime, duration, clipOffsetSeconds]);

  // Seek relative to clip start
  const handleSeek = useCallback((targetRelativeTime: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(duration, targetRelativeTime));
    setCurrentTime(clamped);
    if (audio) {
      audio.currentTime = clipOffsetSeconds + clamped;
    }
  }, [clipOffsetSeconds, duration]);

  // Seek directly to a specific Ayah in the selected range
  const handleSeekToVerse = useCallback((verseIdx: number) => {
    if (!selectedSurah || !ayahsData[verseIdx]) return;
    const targetAyahNumber = ayahsData[verseIdx].numberInSurah;
    const verseKey = `${selectedSurah.number}:${targetAyahNumber}`;
    const timing = ayahTimings[verseKey];

    if (timing) {
      const verseStartRelative = Math.max(0, timing.fromMs / 1000 - clipOffsetSeconds);
      handleSeek(verseStartRelative);
    } else {
      const approxRelative = (verseIdx / ayahsData.length) * duration;
      handleSeek(approxRelative);
    }
  }, [selectedSurah, ayahsData, ayahTimings, clipOffsetSeconds, duration, handleSeek]);

  // Calculate current active verse and active word based on timing segments
  const absoluteCurrentMs = (clipOffsetSeconds + currentTime) * 1000;

  let currentAyahIndex = 0;
  let activeWordPosition: number | null = null;

  if (selectedSurah && ayahsData.length > 0) {
    ayahsData.forEach((ayah, idx) => {
      const key = `${selectedSurah.number}:${ayah.numberInSurah}`;
      const timing = ayahTimings[key];
      if (timing) {
        if (absoluteCurrentMs >= timing.fromMs && absoluteCurrentMs <= timing.toMs) {
          currentAyahIndex = idx;
          // Find matching word segment
          if (timing.segments && timing.segments.length > 0) {
            for (const [pos, start, end] of timing.segments) {
              if (absoluteCurrentMs >= start && absoluteCurrentMs <= end) {
                activeWordPosition = pos;
                break;
              }
            }
          }
        }
      } else {
        // Fallback proportional verse splitting
        const approxVerseDur = duration / ayahsData.length;
        if (currentTime >= idx * approxVerseDur && currentTime <= (idx + 1) * approxVerseDur) {
          currentAyahIndex = idx;
        }
      }
    });
  }

  // Handle custom background media upload (100% in-browser memory)
  const handleUploadCustomBg = (file: File) => {
    const isVideo = file.type.startsWith('video');
    const objectUrl = URL.createObjectURL(file);
    setCustomBgUrl(objectUrl);
    setCustomBgType(isVideo ? 'video' : 'image');
    showToast(`Loaded custom ${isVideo ? 'video' : 'image'}`);
  };

  const handleClearCustomBg = () => {
    if (customBgUrl) URL.revokeObjectURL(customBgUrl);
    setCustomBgUrl(null);
    setCustomBgType(null);
    showToast('Reverted to theme background');
  };

  // Handle custom audio file upload (100% in-browser memory)
  const handleUploadCustomAudio = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setCustomAudioUrl(objectUrl);
    setCustomAudioName(file.name);
    showToast('Loaded custom recitation audio');
  };

  const handleClearCustomAudio = () => {
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    setCustomAudioUrl(null);
    setCustomAudioName(null);
    showToast('Reverted to official reciter');
  };

  // Save Project to localStorage
  const handleSaveProject = () => {
    if (!selectedSurah) return;
    const project: VideoProject = {
      id: `proj_${Date.now()}`,
      title: `Surah ${selectedSurah.englishName} (${startAyah}:${endAyah})`,
      surahNumber: selectedSurah.number,
      startAyah,
      endAyah,
      aspectRatio,
      arabicFont,
      arabicFontSize,
      arabicLineSpacing,
      arabicAlign,
      showTranslation,
      translationLang,
      translationFontSize,
      animationType,
      wordHighlightColor,
      bgThemeId: themeId,
      bgOverlayOpacity,
      reciterId,
      waveformEnabled,
      waveformStyle,
      showBismillah,
      bismillahStyle,
      showReference,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem('quran_video_project_last', JSON.stringify(project));
      showToast('Project saved successfully!');
    } catch {
      showToast('Could not save project locally.');
    }
  };

  // Undo / Redo Helpers
  const pushStateToUndo = () => {
    const snapshot = {
      aspectRatio,
      themeId,
      arabicFont,
      arabicFontSize,
      animationType,
      wordHighlightColor,
      showTranslation,
    };
    setUndoStack((prev) => [...prev.slice(-15), snapshot]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    setRedoStack((prev) => [
      ...prev,
      { aspectRatio, themeId, arabicFont, arabicFontSize, animationType, wordHighlightColor, showTranslation },
    ]);
    setUndoStack(newUndo);

    setAspectRatio(previous.aspectRatio);
    setThemeId(previous.themeId);
    setArabicFont(previous.arabicFont);
    setArabicFontSize(previous.arabicFontSize);
    setAnimationType(previous.animationType);
    setWordHighlightColor(previous.wordHighlightColor);
    setShowTranslation(previous.showTranslation);
    showToast('Action undone');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    setUndoStack((prev) => [
      ...prev,
      { aspectRatio, themeId, arabicFont, arabicFontSize, animationType, wordHighlightColor, showTranslation },
    ]);
    setRedoStack(newRedo);

    setAspectRatio(next.aspectRatio);
    setThemeId(next.themeId);
    setArabicFont(next.arabicFont);
    setArabicFontSize(next.arabicFontSize);
    setAnimationType(next.animationType);
    setWordHighlightColor(next.wordHighlightColor);
    setShowTranslation(next.showTranslation);
    showToast('Action redone');
  };

  // Start Video Export Pipeline with MediaRecorder & Canvas captureStream
  const handleStartExport = async (quality: '1080p' | '720p') => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) {
      showToast('Canvas or audio element not ready');
      return;
    }

    // Safety validation
    if (ayahsData.length === 0) {
      showToast('No Quran text loaded');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      showToast('Video recording not supported on this browser/device');
      return;
    }

    setIsExporting(true);
    setExportProgress(3);
    setSavedFileUri(null);

    try {
      // 1. Capture stream from canvas
      const canvasStream = canvas.captureStream(30);

      // 2. Mix audio stream using Web Audio API Destination
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      let combinedStream: MediaStream = canvasStream;

      if (AudioContextClass) {
        try {
          const audioCtx = new AudioContextClass();
          const source = audioCtx.createMediaElementSource(audio);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioCtx.destination);

          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch {
          // If media element source already created or cross-origin limits, record video stream directly
        }
      }

      // Check supported MIME type and container format
      const { mimeType, extension } = getVideoExportMimeType();
      setExportedExtension(extension);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: quality === '1080p' ? 6000000 : 3500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setIsExporting(false);
        audio.pause();
        setIsPlaying(false);
        showToast('Video recording encountered an error');
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setExportedBlob(blob);
        setExportedVideoUrl(videoUrl);
        setIsExporting(false);
        setExportProgress(100);
        showToast('Video compiled successfully!');
      };

      // Reset audio to start and start recording
      audio.currentTime = clipOffsetSeconds;
      recorder.start(500);

      audio.play().catch((err) => console.warn('Export play error:', err));
      setIsPlaying(true);

      const exportStartTime = Date.now();
      const exportTotalMs = duration * 1000;

      if (exportIntervalRef.current) {
        clearInterval(exportIntervalRef.current);
      }

      exportIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - exportStartTime;
        const pct = Math.min(96, Math.round((elapsed / exportTotalMs) * 100));
        setExportProgress(pct);

        if (elapsed >= exportTotalMs || audio.currentTime >= clipOffsetSeconds + duration) {
          if (exportIntervalRef.current) {
            clearInterval(exportIntervalRef.current);
            exportIntervalRef.current = null;
          }
          audio.pause();
          setIsPlaying(false);
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }, 250);

      mediaRecorderRef.current = recorder;
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      showToast(`Export failed: ${err.message || 'Browser recorder error'}`);
    }
  };

  // Cancel in-progress export
  const handleCancelExport = () => {
    if (exportIntervalRef.current) {
      clearInterval(exportIntervalRef.current);
      exportIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping recorder on cancel:', err);
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsExporting(false);
    setExportProgress(0);
    showToast('Export canceled');
  };

  // Save/Download Video File using Capacitor native Filesystem on Android or browser download fallback
  const handleDownloadVideo = async () => {
    if (!exportedBlob || !selectedSurah) {
      showToast('No exported video available');
      return;
    }

    setIsSavingVideo(true);
    triggerHaptic();

    const ext = exportedExtension;
    const sanitizedSurah = selectedSurah.englishName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Quran_${sanitizedSurah}_${startAyah}-${endAyah}.${ext}`;

    try {
      const result = await saveVideoFile({
        blob: exportedBlob,
        filename,
        mimeType: exportedBlob.type,
      });

      if (result.success) {
        if (result.uri) {
          setSavedFileUri(result.uri);
        }
        showToast(result.message);
      } else {
        showToast(result.message || 'Save failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Save video failed:', err);
      showToast(`Save failed: ${err?.message || 'Device storage error'}`);
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Share Video File
  const handleShareVideo = async () => {
    if (!exportedBlob || !selectedSurah) return;
    const ext = exportedExtension;
    const sanitizedSurah = selectedSurah.englishName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Quran_${sanitizedSurah}_${startAyah}-${endAyah}.${ext}`;
    const title = `Surah ${selectedSurah.englishName}`;
    const text = `Recitation of Holy Quran — Surah ${selectedSurah.englishName} (${startAyah}:${endAyah})`;

    try {
      const shared = await shareVideoFile({
        blob: exportedBlob,
        filename,
        title,
        text,
      });
      if (!shared && !isNativePlatform()) {
        await handleDownloadVideo();
      }
    } catch (err) {
      console.error('Share error:', err);
      await handleDownloadVideo();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-800/95 border border-emerald-500/50 text-emerald-300 text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* 1. Top Toolbar */}
      <VideoToolbar
        selectedSurah={selectedSurah}
        startAyah={startAyah}
        endAyah={endAyah}
        onOpenSurahModal={() => setIsSurahModalOpen(true)}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={(ratio) => {
          pushStateToUndo();
          setAspectRatio(ratio);
        }}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSaveProject={handleSaveProject}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* 2. Main Video Preview Area */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden bg-slate-950">
        <VideoPreviewCanvas
          aspectRatio={aspectRatio}
          surah={selectedSurah}
          ayahs={ayahsData}
          currentAyahIndex={currentAyahIndex}
          activeWordPosition={activeWordPosition}
          theme={currentTheme}
          customBgUrl={customBgUrl}
          customBgType={customBgType}
          bgOverlayOpacity={bgOverlayOpacity}
          arabicFont={arabicFont}
          arabicFontSize={arabicFontSize}
          arabicLineSpacing={arabicLineSpacing}
          arabicAlign={arabicAlign}
          showTranslation={showTranslation}
          translationLang={translationLang}
          translationFontSize={translationFontSize}
          animationType={animationType}
          wordHighlightColor={wordHighlightColor}
          waveformEnabled={waveformEnabled}
          waveformStyle={waveformStyle}
          waveformData={waveformData}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          showReference={showReference}
          showBismillah={showBismillah}
          bismillahStyle={bismillahStyle}
          watermarkEnabled={watermarkEnabled}
          watermarkStyle={watermarkStyle}
          canvasRef={canvasRef}
          videoElementRef={customVideoRef}
        />

        {/* Floating Center Play Overlay for quick touch */}
        {!isPlaying && (
          <button
            onClick={() => {
              triggerHaptic();
              handleTogglePlay();
            }}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-xs shadow-2xl transition active:scale-95 group"
            title="Play Video"
          >
            <Play className="w-6 h-6 fill-white ml-1 text-white group-hover:scale-110 transition" />
          </button>
        )}
      </div>

      {/* 3. Collapsible Multi-Track Timeline */}
      <VideoTimeline
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        onSeekToVerse={handleSeekToVerse}
        ayahs={ayahsData}
        currentAyahIndex={currentAyahIndex}
        ayahTimings={ayahTimings}
        hasWordSegments={hasWordSegments}
        waveformData={waveformData}
        isExpanded={isTimelineExpanded}
        onToggleExpanded={() => setIsTimelineExpanded(!isTimelineExpanded)}
        themeAccentColor={currentTheme.accentColor}
      />

      {/* 4. Bottom Dock Navigation Bar */}
      <div 
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
        }}
        className="w-full bg-slate-900 border-t border-slate-800/80 px-1.5 pt-1.5 flex items-center justify-around shrink-0 z-20"
      >
        {[
          { id: 'text', label: 'Script', icon: Type, color: 'text-emerald-400' },
          { id: 'animation', label: 'Motion', icon: Sparkles, color: 'text-amber-400' },
          { id: 'background', label: 'Visual', icon: ImageIcon, color: 'text-cyan-400' },
          { id: 'audio', label: 'Reciter', icon: Volume2, color: 'text-purple-400' },
          { id: 'translation', label: 'Subtitles', icon: Languages, color: 'text-rose-400' },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                triggerHaptic();
                setActiveTool(isActive ? 'none' : (tool.id as VideoToolTab));
              }}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2 rounded-xl transition active:scale-95 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-inner font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tool.color : ''}`} />
              <span className="text-[10px] tracking-tight">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Backdrop overlay for dismissing bottom sheet on mobile */}
      {activeTool !== 'none' && (
        <div 
          className="fixed inset-0 z-25 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            triggerHaptic();
            setActiveTool('none');
          }}
        />
      )}

      {/* Bottom Sheet Drawer for Selected Tool */}
      <VideoBottomSheet
        activeTab={activeTool}
        onClose={() => setActiveTool('none')}
        arabicFont={arabicFont}
        setArabicFont={(f) => {
          pushStateToUndo();
          setArabicFont(f);
        }}
        arabicFontSize={arabicFontSize}
        setArabicFontSize={setArabicFontSize}
        arabicLineSpacing={arabicLineSpacing}
        setArabicLineSpacing={setArabicLineSpacing}
        arabicAlign={arabicAlign}
        setArabicAlign={setArabicAlign}
        wordHighlightColor={wordHighlightColor}
        setWordHighlightColor={setWordHighlightColor}
        showBismillah={showBismillah}
        setShowBismillah={setShowBismillah}
        bismillahStyle={bismillahStyle}
        setBismillahStyle={setBismillahStyle}
        showReference={showReference}
        setShowReference={setShowReference}
        animationType={animationType}
        setAnimationType={(a) => {
          pushStateToUndo();
          setAnimationType(a);
        }}
        currentThemeId={themeId}
        setThemeId={(t) => {
          pushStateToUndo();
          setThemeId(t);
        }}
        bgOverlayOpacity={bgOverlayOpacity}
        setBgOverlayOpacity={setBgOverlayOpacity}
        customBgUrl={customBgUrl}
        customBgType={customBgType}
        onUploadCustomBg={handleUploadCustomBg}
        onClearCustomBg={handleClearCustomBg}
        currentReciterId={reciterId}
        setReciterId={setReciterId}
        waveformEnabled={waveformEnabled}
        setWaveformEnabled={setWaveformEnabled}
        waveformStyle={waveformStyle}
        setWaveformStyle={setWaveformStyle}
        onUploadCustomAudio={handleUploadCustomAudio}
        customAudioName={customAudioName}
        onClearCustomAudio={handleClearCustomAudio}
        showTranslation={showTranslation}
        setShowTranslation={setShowTranslation}
        translationLang={translationLang}
        setTranslationLang={setTranslationLang}
        translationFontSize={translationFontSize}
        setTranslationFontSize={setTranslationFontSize}
        watermarkEnabled={watermarkEnabled}
        setWatermarkEnabled={setWatermarkEnabled}
        watermarkStyle={watermarkStyle}
        setWatermarkStyle={setWatermarkStyle}
      />

      {/* Surah Selector Modal (Reused existing component) */}
      <SurahSelector
        surahs={surahs}
        selectedSurah={selectedSurah}
        isOpen={isSurahModalOpen}
        onClose={() => setIsSurahModalOpen(false)}
        onSelectSurah={(s) => {
          setSelectedSurah(s);
          setStartAyah(1);
          setEndAyah(Math.min(7, s.numberOfAyahs));
          setIsSurahModalOpen(false);
          showToast(`Selected Surah ${s.englishName}`);
        }}
      />

      {/* Video Export Modal */}
      <VideoExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportedVideoUrl(null);
          setExportedBlob(null);
          setSavedFileUri(null);
        }}
        surah={selectedSurah}
        startAyah={startAyah}
        endAyah={endAyah}
        ayahs={ayahsData}
        aspectRatio={aspectRatio}
        duration={duration}
        isExporting={isExporting}
        exportProgress={exportProgress}
        exportedVideoUrl={exportedVideoUrl}
        exportedExtension={exportedExtension}
        isSavingVideo={isSavingVideo}
        savedFileUri={savedFileUri}
        onStartExport={handleStartExport}
        onCancelExport={handleCancelExport}
        onDownloadVideo={handleDownloadVideo}
        onShareVideo={handleShareVideo}
      />
    </div>
  );
};
