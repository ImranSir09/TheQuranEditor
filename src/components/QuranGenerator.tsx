import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Download, 
  Check, 
  Copy, 
  RotateCw, 
  Palette, 
  Crop, 
  Type, 
  Languages, 
  Square, 
  Hash, 
  Sparkles, 
  ChevronDown, 
  X, 
  Minus, 
  Plus,
  Share2,
  Sliders,
  FolderDown
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { SurahInfo, AyahData, AspectRatioKey, QuickPreset, BismillahStyle } from '../types';
import { RATIO_CONFIGS, THEMES, QUICK_PRESETS, BISMILLAH_STYLES } from '../constants/quranData';
import { stripBismillah } from '../utils/arabicText';
import SurahSelector from './SurahSelector';
import { QuranCard } from './QuranCard';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  initCapacitorApp, 
  listenToHardwareBack, 
  triggerHaptic, 
  shareVerseImage,
  saveImageFile,
  saveViaSystemPicker,
  isNativePlatform
} from '../utils/native';

type ActiveTool = 'none' | 'palette' | 'ratio' | 'type' | 'languages' | 'frame' | 'range' | 'presets' | 'export';

export default function QuranGenerator() {
  // Surahs state
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState<boolean>(true);
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(7);
  const [isSurahModalOpen, setIsSurahModalOpen] = useState<boolean>(false);

  // Ayahs data state
  const [ayahsData, setAyahsData] = useState<AyahData[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Design state
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('1:1');
  const [themeId, setThemeId] = useState<string>('emerald');
  const [borderStyle, setBorderStyle] = useState<'gold' | 'minimal' | 'rounded' | 'none'>('gold');
  const [marginSize, setMarginSize] = useState<number>(9);

  // Content toggles
  const [showBismillah, setShowBismillah] = useState<boolean>(true);
  const [bismillahStyle, setBismillahStyle] = useState<BismillahStyle>('classic');
  const [showArabic, setShowArabic] = useState<boolean>(true);
  const [showEnglish, setShowEnglish] = useState<boolean>(true);
  const [showUrdu, setShowUrdu] = useState<boolean>(false);
  const [showReference, setShowReference] = useState<boolean>(true);

  // Typography
  const [arabicFont, setArabicFont] = useState<string>('Amiri');
  const [arabicFontSize, setArabicFontSize] = useState<number>(24);
  const [arabicLineSpacing, setArabicLineSpacing] = useState<number>(2.0);
  const [arabicAlign, setArabicAlign] = useState<'left' | 'center' | 'right'>('center');
  const [englishFontSize, setEnglishFontSize] = useState<number>(13);
  const [englishAlign, setEnglishAlign] = useState<'left' | 'center' | 'right'>('center');
  const [urduFontSize, setUrduFontSize] = useState<number>(18);

  // Active Tool Drawer in Bottom Dock
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [exporting, setExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Initialize native Capacitor capabilities and hardware back button
  useEffect(() => {
    initCapacitorApp();

    const cleanup = listenToHardwareBack(() => {
      if (isSurahModalOpen) {
        setIsSurahModalOpen(false);
        return true;
      }
      if (activeTool !== 'none') {
        setActiveTool('none');
        return true;
      }
      return false;
    });

    return () => {
      cleanup();
    };
  }, [isSurahModalOpen, activeTool]);

  // Fetch Surahs list with offline local cache fallback
  useEffect(() => {
    const cachedSurahs = localStorage.getItem('quran_surahs_cache');
    if (cachedSurahs) {
      try {
        const parsed = JSON.parse(cachedSurahs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSurahs(parsed);
          setSelectedSurah(parsed[0]);
          setStartAyah(1);
          setEndAyah(7);
          setLoadingSurahs(false);
        }
      } catch {
        // ignore parse error
      }
    }

    fetch('https://api.alquran.cloud/v1/surah')
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200 && data.data) {
          setSurahs(data.data);
          localStorage.setItem('quran_surahs_cache', JSON.stringify(data.data));
          if (!selectedSurah) {
            setSelectedSurah(data.data[0]); // Al-Fatihah
            setStartAyah(1);
            setEndAyah(7);
          }
        }
        setLoadingSurahs(false);
      })
      .catch((err) => {
        console.error('Failed to load surahs:', err);
        if (!cachedSurahs) {
          setFetchError('Failed to load Surah index.');
        }
        setLoadingSurahs(false);
      });
  }, []);

  // Fetch Ayahs when Surah or Range changes with offline caching
  useEffect(() => {
    if (!selectedSurah) return;

    const s = Math.max(1, Math.min(startAyah, selectedSurah.numberOfAyahs));
    const e = Math.max(s, Math.min(endAyah, selectedSurah.numberOfAyahs));

    setLoadingAyahs(true);
    setFetchError(null);

    const cacheKey = `quran_surah_full_${selectedSurah.number}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const { arabicAyahs, englishAyahs, urduAyahs } = JSON.parse(cachedData);
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
        if (combined.length > 0) {
          setAyahsData(combined);
          setLoadingAyahs(false);
        }
      } catch {
        // ignore
      }
    }

    const urlArabic = `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/quran-uthmani`;
    const urlEnglish = `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/en.sahih`;
    const urlUrdu = `https://api.alquran.cloud/v1/surah/${selectedSurah.number}/editions/ur.jalandhry`;

    Promise.all([
      fetch(urlArabic).then((r) => r.json()),
      fetch(urlEnglish).then((r) => r.json()),
      fetch(urlUrdu).then((r) => r.json()),
    ])
      .then(([arabicRes, englishRes, urduRes]) => {
        if (arabicRes.code === 200 && englishRes.code === 200 && urduRes.code === 200) {
          const arabicAyahs = arabicRes.data[0].ayahs;
          const englishAyahs = englishRes.data[0].ayahs;
          const urduAyahs = urduRes.data[0].ayahs;

          // Cache entire surah for instant offline access
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({ arabicAyahs, englishAyahs, urduAyahs })
            );
          } catch {
            // ignore localStorage quota limit
          }

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
          setAyahsData(combined);
        } else {
          setFetchError('Could not verify Quranic text.');
        }
        setLoadingAyahs(false);
      })
      .catch((err) => {
        console.error('Error loading ayahs:', err);
        if (!cachedData) {
          setFetchError('Network error while fetching immutable Quranic text.');
        }
        setLoadingAyahs(false);
      });
  }, [selectedSurah, startAyah, endAyah]);

  // Apply Quick Preset
  const applyPreset = (preset: QuickPreset) => {
    triggerHaptic();
    const targetSurah = surahs.find((s) => s.number === preset.surahNumber);
    if (targetSurah) {
      setSelectedSurah(targetSurah);
      setStartAyah(preset.startAyah);
      setEndAyah(preset.endAyah);
      setThemeId(preset.themeId);
      setAspectRatio(preset.aspectRatio);
      setActiveTool('none');
      showToast(`${preset.label}`);
    }
  };

  // Generate card image data url
  const generateImageDataUrl = async (format: 'png' | 'jpeg'): Promise<string | null> => {
    if (!previewRef.current) return null;
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
      } catch {
        // ignore
      }
    }

    const node = previewRef.current;
    const rect = node.getBoundingClientRect();
    const nodeWidth = rect.width || node.clientWidth || 360;
    const activeRatio = RATIO_CONFIGS[aspectRatio];

    // Preserves 100% natural element alignment and prevents text being forced into left-side half
    const targetRatio = Math.max(2, Math.min(4, Math.round((activeRatio.width / nodeWidth) * 10) / 10));

    // Load base64 embedded fonts for the active calligraphy style so exported images render identical to preview
    let fontEmbedCSS = '';
    try {
      const { getEmbeddedFontCSS } = await import('../constants/embeddedFonts');
      fontEmbedCSS = getEmbeddedFontCSS(arabicFont);
    } catch (fontErr) {
      console.warn('Could not load embedded fonts for export:', fontErr);
    }

    const options = {
      quality: 0.98,
      pixelRatio: targetRatio,
      skipFonts: false,
      fontEmbedCSS,
      cacheBust: true,
      style: {
        borderRadius: '0px',
      },
    };

    return format === 'png' ? await toPng(node, options) : await toJpeg(node, options);
  };

  // Export card as image
  const handleExport = async (format: 'png' | 'jpeg', mode: 'direct' | 'system' = 'direct') => {
    triggerHaptic();
    setExporting(true);

    try {
      const dataUrl = await generateImageDataUrl(format);
      if (!dataUrl) {
        showToast('Failed to render image');
        return;
      }

      const surahNameClean = (selectedSurah?.englishName || 'Verse').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Quran_${surahNameClean}_${startAyah}${
        startAyah !== endAyah ? `-${endAyah}` : ''
      }.${format}`;

      if (mode === 'system' && isNativePlatform()) {
        const opened = await saveViaSystemPicker({ dataUrl, filename });
        if (opened) {
          showToast('Choose destination in system menu');
          setActiveTool('none');
          return;
        }
      }

      const result = await saveImageFile({ dataUrl, filename });
      if (result.success) {
        showToast(result.message);
        setActiveTool('none');
      } else {
        showToast(result.message || 'Export failed');
      }
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Native & Web Share
  const handleShare = async () => {
    triggerHaptic();
    setExporting(true);

    try {
      const dataUrl = await generateImageDataUrl('png');
      const verseRef = `Surah ${selectedSurah?.englishName || 'Quran'} (${selectedSurah?.number || 1}:${startAyah}${
        startAyah !== endAyah ? `-${endAyah}` : ''
      })`;
      const surahNameClean = (selectedSurah?.englishName || 'Verse').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Quran_${surahNameClean}_${startAyah}.png`;

      const shared = await shareVerseImage({
        title: 'Quran Verse',
        text: verseRef,
        dataUrl: dataUrl || undefined,
        filename,
      });

      if (shared) {
        showToast('Shared successfully!');
        setActiveTool('none');
      } else if (dataUrl) {
        // Fallback: direct save to files
        const saveRes = await saveImageFile({ dataUrl, filename });
        showToast(saveRes.message);
      }
    } catch (err) {
      console.error('Share failed:', err);
      showToast('Share failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    triggerHaptic();
    if (ayahsData.length === 0 || !selectedSurah) return;
    const arabicPart = ayahsData
      .map((a) => {
        const text = selectedSurah.number === 1 ? a.arabicText : stripBismillah(a.arabicText);
        return `${text} ﴿${a.numberInSurah}﴾`;
      })
      .join(' ');
    const englishPart = showEnglish ? `\n\n"${ayahsData.map((a) => a.englishText).join(' ')}"` : '';
    const urduPart = showUrdu ? `\n\n${ayahsData.map((a) => a.urduText).join(' ')}` : '';
    const refPart = `\n\n— Surah ${selectedSurah.englishName} (${selectedSurah.number}:${startAyah}${
      startAyah !== endAyah ? `-${endAyah}` : ''
    })`;

    const textToCopy = `${arabicPart}${englishPart}${urduPart}${refPart}`;
    navigator.clipboard.writeText(textToCopy);
    showToast('Verse text copied!');
  };

  // Measure canvas container size dynamically using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const activeRatioConfig = RATIO_CONFIGS[aspectRatio];

  // Compute exact fitted width & height for the selected aspect ratio
  const cardDimensions = React.useMemo(() => {
    const { width: cW, height: cH } = containerDimensions;
    if (!cW || !cH) {
      return {
        aspectRatio: activeRatioConfig.shortLabel.replace(':', '/'),
        maxWidth: '100%',
        maxHeight: '100%',
      };
    }

    const padding = 12; // breathing space around the card
    const availW = Math.max(100, cW - padding * 2);
    const availH = Math.max(100, cH - padding * 2);

    const targetRatio = activeRatioConfig.width / activeRatioConfig.height;
    const containerRatio = availW / availH;

    let finalW: number;
    let finalH: number;

    if (containerRatio > targetRatio) {
      // Container is wider than target ratio -> constrained by available height
      finalH = availH;
      finalW = availH * targetRatio;
    } else {
      // Container is taller than target ratio -> constrained by available width
      finalW = availW;
      finalH = availW / targetRatio;
    }

    return {
      width: `${Math.round(finalW)}px`,
      height: `${Math.round(finalH)}px`,
      maxWidth: '100%',
      maxHeight: '100%',
    };
  }, [containerDimensions, activeRatioConfig]);

  // Toggle tool drawer
  const toggleTool = (tool: ActiveTool) => {
    triggerHaptic();
    setActiveTool((prev) => (prev === tool ? 'none' : tool));
  };

  return (
    <div className="h-full w-full flex flex-col justify-between relative overflow-hidden bg-slate-950 select-none">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 backdrop-blur-md animate-in fade-in duration-150"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Touch Bar */}
      <header 
        className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 z-20"
      >
        <div className="h-14 flex items-center justify-between">
          {/* Surah Trigger Chip */}
          <button
            onClick={() => {
              setActiveTool('none');
              setIsSurahModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-white transition text-xs font-semibold max-w-[210px] truncate"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {selectedSurah?.number || 1}
            </div>
            <span className="truncate">
              {selectedSurah ? selectedSurah.englishName : 'Surah'}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono shrink-0">
              {startAyah}{startAyah !== endAyah ? `-${endAyah}` : ''}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Top Right Quick Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* PWA / Android App Install button */}
            <PWAInstallButton />

            {/* Quick Presets Icon */}
            <button
              onClick={() => toggleTool('presets')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                activeTool === 'presets'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
              title="Curated Presets"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Copy Text Icon */}
            <button
              onClick={handleCopyText}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition"
              title="Copy Text"
            >
              <Copy className="w-4 h-4" />
            </button>

            {/* Export Sheet Trigger */}
            <button
              onClick={() => toggleTool('export')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                activeTool === 'export'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
              }`}
              title="Export Image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CENTER VIEWPORT: Auto-Fitting Non-Scrolling Canvas */}
      <main 
        ref={containerRef}
        onClick={() => setActiveTool('none')}
        className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-3 relative overflow-hidden cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={cardDimensions}
          className="shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative select-none shrink-0"
        >
          <QuranCard
            ref={previewRef}
            surah={selectedSurah}
            ayahs={ayahsData}
            theme={currentTheme}
            aspectRatio={aspectRatio}
            borderStyle={borderStyle}
            marginSize={marginSize}
            showBismillah={showBismillah}
            bismillahStyle={bismillahStyle}
            showArabic={showArabic}
            showEnglish={showEnglish}
            showUrdu={showUrdu}
            showReference={showReference}
            arabicFont={arabicFont}
            arabicFontSize={arabicFontSize}
            arabicLineSpacing={arabicLineSpacing}
            arabicAlign={arabicAlign}
            englishFontSize={englishFontSize}
            englishAlign={englishAlign}
            urduFontSize={urduFontSize}
            urduAlign={arabicAlign}
            startAyah={startAyah}
            endAyah={endAyah}
            isLoading={loadingAyahs}
            fetchError={fetchError}
          />
        </div>
      </main>

      {/* TOUCH DRAWER / TOOL TRAY (Above Bottom Dock) */}
      {activeTool !== 'none' && (
        <div 
          style={{
            bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 0px) + 64px)',
          }}
          className="absolute inset-x-0 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 shadow-2xl z-30 p-3.5 animate-in slide-in-from-bottom-2 duration-150 rounded-t-2xl max-h-[70vh] overflow-y-auto"
        >
          {/* Tool Drawer Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              {activeTool === 'palette' && <><Palette className="w-3.5 h-3.5" /> Color & Theme</>}
              {activeTool === 'ratio' && <><Crop className="w-3.5 h-3.5" /> Aspect Ratio</>}
              {activeTool === 'type' && <><Type className="w-3.5 h-3.5" /> Typography & Size</>}
              {activeTool === 'languages' && <><Languages className="w-3.5 h-3.5" /> Text Toggles</>}
              {activeTool === 'frame' && <><Square className="w-3.5 h-3.5" /> Frame & Spacing</>}
              {activeTool === 'range' && <><Hash className="w-3.5 h-3.5" /> Verse Range</>}
              {activeTool === 'presets' && <><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets</>}
              {activeTool === 'export' && <><Download className="w-3.5 h-3.5 text-emerald-400" /> Export High-Res</>}
            </span>
            <button
              onClick={() => setActiveTool('none')}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TOOL 1: PALETTE & THEMES */}
          {activeTool === 'palette' && (
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((th) => {
                const isSelected = themeId === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => setThemeId(th.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${th.bgClass} border border-white/20 shadow-xs shrink-0`} />
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                      {th.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TOOL 2: ASPECT RATIO */}
          {activeTool === 'ratio' && (
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(RATIO_CONFIGS) as AspectRatioKey[]).map((key) => {
                const cfg = RATIO_CONFIGS[key];
                const isSelected = aspectRatio === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      triggerHaptic();
                      setAspectRatio(key);
                      showToast(`Ratio set to ${cfg.label}`);
                    }}
                    className={`py-2.5 px-1 rounded-xl border flex flex-col items-center justify-center transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold ring-1 ring-emerald-500/40'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {/* Visual Ratio Card Outline */}
                    <div className="w-6 h-6 flex items-center justify-center mb-1.5">
                      <div
                        style={{
                          aspectRatio: cfg.shortLabel.replace(':', '/'),
                          width: cfg.width >= cfg.height ? '20px' : `${Math.max(10, Math.round(20 * (cfg.width / cfg.height)))}px`,
                          height: cfg.height >= cfg.width ? '20px' : `${Math.max(10, Math.round(20 * (cfg.height / cfg.width)))}px`,
                        }}
                        className={`rounded-[3px] border ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-400/25 shadow-xs'
                            : 'border-slate-500/60 bg-slate-700/30'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-bold">{cfg.shortLabel}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-full">
                      {key === '1:1' ? 'Square' : key === '4:5' ? 'Feed' : key === '9:16' ? 'Story' : key === '16:9' ? 'Wide' : 'Card'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TOOL 3: TYPOGRAPHY & SIZING */}
          {activeTool === 'type' && (
            <div className="space-y-3">
              {/* Font Family Selection */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">Arabic Calligraphy:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setArabicFont('Amiri')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      arabicFont === 'Amiri'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Amiri
                  </button>
                  <button
                    onClick={() => setArabicFont('Scheherazade New')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      arabicFont === 'Scheherazade New'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Scheherazade
                  </button>
                  <button
                    onClick={() => setArabicFont('Lateef')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      arabicFont === 'Lateef'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Lateef
                  </button>
                </div>
              </div>

              {/* Arabic Size Stepper */}
              <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">Arabic Text Size</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setArabicFontSize((s) => Math.max(16, s - 2))}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-mono font-bold text-xs text-emerald-400">
                    {arabicFontSize}px
                  </span>
                  <button
                    onClick={() => setArabicFontSize((s) => Math.min(42, s + 2))}
                    className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Alignment formatting */}
              <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300">Text Alignment</span>
                <div className="flex gap-1.5">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => {
                        setArabicAlign(align);
                        setEnglishAlign(align);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                        arabicAlign === align
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Translation Size Steppers */}
              {showEnglish && (
                <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-300">English Text Size</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEnglishFontSize((s) => Math.max(11, s - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center font-mono font-bold text-xs text-emerald-400">
                      {englishFontSize}px
                    </span>
                    <button
                      onClick={() => setEnglishFontSize((s) => Math.min(22, s + 1))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center hover:bg-slate-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TOOL 4: TRANSLATIONS, BISMILLAH & TOGGLES */}
          {activeTool === 'languages' && (
            <div className="space-y-3">
              {/* Text Language Toggles */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    triggerHaptic();
                    setShowArabic(!showArabic);
                  }}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    showArabic
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <span>Arabic</span>
                  {showArabic && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setShowEnglish(!showEnglish);
                  }}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    showEnglish
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <span>English</span>
                  {showEnglish && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic();
                    setShowUrdu(!showUrdu);
                  }}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                    showUrdu
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <span>Urdu</span>
                  {showUrdu && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Bismillah Header Controls */}
              <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">Bismillah Header</span>
                    <span className="text-[10px] text-slate-400">
                      {selectedSurah?.number === 9 
                        ? 'Surah At-Tawbah has no Bismillah'
                        : selectedSurah?.number === 1 && startAyah === 1
                        ? 'Ayah 1 of Al-Fatiha is already Bismillah'
                        : 'Displays sacred opening before verses'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic();
                      setShowBismillah(!showBismillah);
                    }}
                    disabled={selectedSurah?.number === 9}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedSurah?.number === 9
                        ? 'opacity-40 bg-slate-800 text-slate-500 cursor-not-allowed'
                        : showBismillah
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {showBismillah && selectedSurah?.number !== 9 ? 'Shown' : 'Hidden'}
                  </button>
                </div>

                {/* Bismillah Calligraphy Style Selector */}
                {showBismillah && selectedSurah?.number !== 9 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">Bismillah Style:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {BISMILLAH_STYLES.map((st) => {
                        const isSelected = bismillahStyle === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => {
                              triggerHaptic();
                              setBismillahStyle(st.id);
                              showToast(`Bismillah style: ${st.shortLabel}`);
                            }}
                            className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold ring-1 ring-emerald-500/40'
                                : 'border-slate-800 bg-slate-800/80 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[11px] font-semibold">{st.shortLabel}</span>
                            <span 
                              dir="rtl" 
                              style={{ fontFamily: "'Amiri', serif" }}
                              className="text-xs opacity-90 truncate mt-1 text-right font-normal"
                            >
                              {st.arabicText}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Attribution & Footnote Toggle */}
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowReference(!showReference);
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                  showReference
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-800 bg-slate-800/60 text-slate-400'
                }`}
              >
                <span>Surah Attribution & Footnote</span>
                {showReference && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* TOOL 5: FRAME BORDER & MARGIN */}
          {activeTool === 'frame' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-4 gap-1.5">
                {(['gold', 'minimal', 'rounded', 'none'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBorderStyle(b)}
                    className={`py-2 rounded-xl border text-xs font-medium capitalize transition ${
                      borderStyle === b
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400">Card Margin:</span>
                <div className="flex gap-1.5">
                  {[
                    { label: 'Compact', val: 7 },
                    { label: 'Normal', val: 9 },
                    { label: 'Spacious', val: 13 },
                  ].map((m) => (
                    <button
                      key={m.val}
                      onClick={() => setMarginSize(m.val)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        marginSize === m.val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOOL 6: VERSE RANGE */}
          {activeTool === 'range' && selectedSurah && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {/* Start Ayah Stepper */}
                <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Start:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={startAyah <= 1}
                      onClick={() => {
                        const n = Math.max(1, startAyah - 1);
                        setStartAyah(n);
                        if (endAyah < n) setEndAyah(n);
                      }}
                      className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs text-emerald-400 w-6 text-center font-mono">
                      {startAyah}
                    </span>
                    <button
                      disabled={startAyah >= selectedSurah.numberOfAyahs}
                      onClick={() => {
                        const n = Math.min(selectedSurah.numberOfAyahs, startAyah + 1);
                        setStartAyah(n);
                        if (endAyah < n) setEndAyah(n);
                      }}
                      className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* End Ayah Stepper */}
                <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">End:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={endAyah <= startAyah}
                      onClick={() => setEndAyah(Math.max(startAyah, endAyah - 1))}
                      className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="font-bold text-xs text-emerald-400 w-6 text-center font-mono">
                      {endAyah}
                    </span>
                    <button
                      disabled={endAyah >= Math.min(selectedSurah.numberOfAyahs, startAyah + 12)}
                      onClick={() => setEndAyah(Math.min(selectedSurah.numberOfAyahs, endAyah + 1))}
                      className="w-7 h-7 rounded bg-slate-700 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setStartAyah(1);
                    setEndAyah(1);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                >
                  Ayah 1
                </button>
                <button
                  onClick={() => {
                    setStartAyah(1);
                    setEndAyah(Math.min(selectedSurah.numberOfAyahs, 3));
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                >
                  Ayah 1-3
                </button>
                <button
                  onClick={() => {
                    setStartAyah(1);
                    setEndAyah(Math.min(selectedSurah.numberOfAyahs, 5));
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                >
                  Ayah 1-5
                </button>
                {selectedSurah.numberOfAyahs <= 10 && (
                  <button
                    onClick={() => {
                      setStartAyah(1);
                      setEndAyah(selectedSurah.numberOfAyahs);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                  >
                    Full Surah
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TOOL 7: PRESETS */}
          {activeTool === 'presets' && (
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/60 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition text-left"
                >
                  <div className="text-xs font-semibold text-slate-200 truncate">{p.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.surahName} ({p.startAyah}{p.startAyah !== p.endAyah ? `-${p.endAyah}` : ''})</div>
                </button>
              ))}
            </div>
          )}

          {/* TOOL 8: EXPORT */}
          {activeTool === 'export' && (
            <div className="space-y-3">
              {/* Header label with storage target status */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                <span className="font-medium">Save to Files & Downloads</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {isNativePlatform() ? 'Documents Folder' : 'Direct Download'}
                </span>
              </div>

              {/* Primary: Direct Save PNG / JPG */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleExport('png', 'direct')}
                  disabled={exporting || loadingAyahs}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-950/60 disabled:opacity-50"
                  title="Save high resolution PNG into device Documents / Downloads"
                >
                  {exporting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="font-bold">Save PNG</span>
                  <span className="text-[10px] font-normal opacity-85">Lossless Quality</span>
                </button>

                <button
                  onClick={() => handleExport('jpeg', 'direct')}
                  disabled={exporting || loadingAyahs}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs transition flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                  title="Save compressed JPG into device Documents / Downloads"
                >
                  {exporting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="font-bold">Save JPG</span>
                  <span className="text-[10px] font-normal text-slate-400">Smaller File Size</span>
                </button>
              </div>

              {/* Secondary Options: System Folder Picker / Share Image */}
              <div className="grid grid-cols-2 gap-2">
                {isNativePlatform() ? (
                  <button
                    onClick={() => handleExport('png', 'system')}
                    disabled={exporting || loadingAyahs}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    title="Choose folder or Downloads via Android system sheet"
                  >
                    <FolderDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Choose Folder</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleExport('png', 'direct')}
                    disabled={exporting || loadingAyahs}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <FolderDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Downloads</span>
                  </button>
                )}

                <button
                  onClick={handleShare}
                  disabled={exporting || loadingAyahs}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Share image file to WhatsApp, Stories, etc."
                >
                  {exporting ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span>Share Image</span>
                </button>
              </div>

              {/* Copy Formatted Text */}
              <button
                onClick={handleCopyText}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                Copy Formatted Text Only
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM ICON-ONLY TOOLBAR / DOCK */}
      <footer 
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
        }}
        className="shrink-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-800/90 flex flex-col z-20"
      >
        <div className="h-16 flex items-center justify-around px-2">
        {/* Palette / Theme Icon */}
        <button
          onClick={() => toggleTool('palette')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            activeTool === 'palette'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Theme & Colors"
        >
          <Palette className="w-5 h-5" />
        </button>

        {/* Aspect Ratio Icon */}
        <button
          onClick={() => toggleTool('ratio')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            activeTool === 'ratio'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Aspect Ratio"
        >
          <Crop className="w-5 h-5" />
        </button>

        {/* Typography Icon */}
        <button
          onClick={() => toggleTool('type')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            activeTool === 'type'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Typography & Sizing"
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Translations Icon */}
        <button
          onClick={() => toggleTool('languages')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            activeTool === 'languages'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Translations & Toggles"
        >
          <Languages className="w-5 h-5" />
        </button>

        {/* Frame & Spacing Icon */}
        <button
          onClick={() => toggleTool('frame')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            activeTool === 'frame'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Frame Border & Margins"
        >
          <Square className="w-5 h-5" />
        </button>

        {/* Verse Range Icon */}
        <button
          onClick={() => toggleTool('range')}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition ${
            activeTool === 'range'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Verse Range Stepper"
        >
          <Hash className="w-5 h-5" />
        </button>
        </div>
      </footer>

      {/* Surah Selector Modal */}
      <SurahSelector
        surahs={surahs}
        selectedSurah={selectedSurah}
        onSelectSurah={(surah) => {
          setSelectedSurah(surah);
          setStartAyah(1);
          setEndAyah(1);
        }}
        isOpen={isSurahModalOpen}
        onClose={() => setIsSurahModalOpen(false)}
      />
    </div>
  );
}
