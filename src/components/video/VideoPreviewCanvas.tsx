import React, { useEffect, useRef } from 'react';
import { SurahInfo, AyahData } from '../../types';
import { VideoAspectRatio, VideoBackgroundTheme, TextAnimationType, WordTiming } from '../../types/video';
import { VIDEO_RATIO_CONFIGS } from '../../constants/videoData';
import { stripBismillah } from '../../utils/arabicText';

interface VideoPreviewCanvasProps {
  aspectRatio: VideoAspectRatio;
  surah: SurahInfo | null;
  ayahs: AyahData[];
  currentAyahIndex: number;
  activeWordPosition: number | null;
  theme: VideoBackgroundTheme;
  customBgUrl: string | null;
  customBgType: 'image' | 'video' | null;
  bgOverlayOpacity: number;
  arabicFont: string;
  arabicFontSize: number;
  arabicLineSpacing: number;
  arabicAlign: 'center' | 'right';
  showTranslation: boolean;
  translationLang: 'en' | 'ur';
  translationFontSize: number;
  animationType: TextAnimationType;
  wordHighlightColor: string;
  waveformEnabled: boolean;
  waveformStyle: 'bars' | 'wave' | 'minimal';
  waveformData: number[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  showReference: boolean;
  showBismillah: boolean;
  bismillahStyle: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoElementRef?: React.RefObject<HTMLVideoElement | null>;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  baseOpacity: number;
}

export const VideoPreviewCanvas: React.FC<VideoPreviewCanvasProps> = ({
  aspectRatio,
  surah,
  ayahs,
  currentAyahIndex,
  activeWordPosition,
  theme,
  customBgUrl,
  customBgType,
  bgOverlayOpacity,
  arabicFont,
  arabicFontSize,
  arabicLineSpacing,
  arabicAlign,
  showTranslation,
  translationLang,
  translationFontSize,
  animationType,
  wordHighlightColor,
  waveformEnabled,
  waveformStyle,
  waveformData,
  currentTime,
  duration,
  isPlaying,
  showReference,
  showBismillah,
  bismillahStyle,
  canvasRef,
  videoElementRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const config = VIDEO_RATIO_CONFIGS[aspectRatio] || VIDEO_RATIO_CONFIGS['9:16'];
  const canvasWidth = config.width;
  const canvasHeight = config.height;

  // Initialize atmospheric particles
  useEffect(() => {
    const pList: Particle[] = [];
    for (let i = 0; i < 35; i++) {
      pList.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        radius: Math.random() * 2.5 + 1.2,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.2,
        baseOpacity: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = pList;
  }, [canvasWidth, canvasHeight]);

  // Load custom image if provided
  useEffect(() => {
    if (customBgType === 'image' && customBgUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = customBgUrl;
      img.onload = () => {
        imageElementRef.current = img;
      };
    } else {
      imageElementRef.current = null;
    }
  }, [customBgUrl, customBgType]);

  // Main rendering loop for canvas
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const renderFrame = () => {
      // 1. Draw Background
      if (customBgType === 'video' && videoElementRef?.current && videoElementRef.current.readyState >= 2) {
        const v = videoElementRef.current;
        const vRatio = v.videoWidth / (v.videoHeight || 1);
        const cRatio = canvasWidth / canvasHeight;
        let dw = canvasWidth;
        let dh = canvasHeight;
        let dx = 0;
        let dy = 0;
        if (vRatio > cRatio) {
          dw = canvasHeight * vRatio;
          dx = (canvasWidth - dw) / 2;
        } else {
          dh = canvasWidth / vRatio;
          dy = (canvasHeight - dh) / 2;
        }
        ctx.drawImage(v, dx, dy, dw, dh);
      } else if (customBgType === 'image' && imageElementRef.current && imageElementRef.current.complete) {
        const img = imageElementRef.current;
        const imgRatio = img.naturalWidth / (img.naturalHeight || 1);
        const cRatio = canvasWidth / canvasHeight;
        let dw = canvasWidth;
        let dh = canvasHeight;
        let dx = 0;
        let dy = 0;
        if (imgRatio > cRatio) {
          dw = canvasHeight * imgRatio;
          dx = (canvasWidth - dw) / 2;
        } else {
          dh = canvasWidth / imgRatio;
          dy = (canvasHeight - dh) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        // Aesthetic Theme Radial Gradient with subtle moving aura
        const grad = ctx.createRadialGradient(
          canvasWidth / 2,
          canvasHeight * 0.45,
          canvasWidth * 0.08,
          canvasWidth / 2,
          canvasHeight / 2,
          canvasWidth * 0.95
        );
        const colors = theme.canvasBg;
        grad.addColorStop(0, colors[1]);
        grad.addColorStop(0.5, colors[0]);
        grad.addColorStop(1, colors[2]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Subtle ornamental geometric corner accents (very faint, elegant)
        ctx.save();
        ctx.strokeStyle = theme.accentColor;
        ctx.globalAlpha = 0.12;
        ctx.lineWidth = 1.5;
        const m = 40;
        const s = 50;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(m, m + s);
        ctx.lineTo(m, m);
        ctx.lineTo(m + s, m);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(canvasWidth - m, m + s);
        ctx.lineTo(canvasWidth - m, m);
        ctx.lineTo(canvasWidth - m - s, m);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(m, canvasHeight - m - s);
        ctx.lineTo(m, canvasHeight - m);
        ctx.lineTo(m + s, canvasHeight - m);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(canvasWidth - m, canvasHeight - m - s);
        ctx.lineTo(canvasWidth - m, canvasHeight - m);
        ctx.lineTo(canvasWidth - m - s, canvasHeight - m);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Dark Overlay for readability
      if (bgOverlayOpacity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${bgOverlayOpacity})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // 3. Floating Celestial / Dust Particles
      ctx.save();
      const particles = particlesRef.current;
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < 0) p.y = canvasHeight;
        if (p.x < 0) p.x = canvasWidth;
        if (p.x > canvasWidth) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.particleColor;
        ctx.shadowColor = theme.accentColor;
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();

      // 4. Header Badge: Surah & Reference
      const currentAyah = ayahs[currentAyahIndex] || ayahs[0];
      const headerY = canvasHeight * 0.12;

      if (showReference && surah) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Reference Pill Box
        const pillText = `سُورَةُ ${surah.name} • Surah ${surah.englishName} (${surah.number}:${currentAyah?.numberInSurah || 1})`;
        ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const pillMetrics = ctx.measureText(pillText);
        const pillWidth = pillMetrics.width + 48;
        const pillHeight = 44;
        const pillX = (canvasWidth - pillWidth) / 2;
        const pillY = headerY - 22;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.strokeStyle = `${theme.accentColor}44`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = theme.textColor;
        ctx.fillText(pillText, canvasWidth / 2, headerY);
        ctx.restore();
      }

      // 5. Bismillah Header (if enabled and applicable)
      let bismillahBottomY = headerY + 40;
      if (showBismillah && bismillahStyle !== 'none' && surah && surah.number !== 9) {
        ctx.save();
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold 32px '${arabicFont}', 'Amiri', serif`;
        ctx.fillStyle = `${theme.textColor}cc`;
        ctx.shadowColor = theme.accentColor;
        ctx.shadowBlur = 8;

        const bismillahText =
          bismillahStyle === 'ornamental'
            ? '﷽'
            : bismillahStyle === 'framed'
            ? '۞ بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۞'
            : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

        ctx.fillText(bismillahText, canvasWidth / 2, bismillahBottomY + 30);
        bismillahBottomY += 70;
        ctx.restore();
      }

      // 6. Quran Arabic Text Layer
      if (currentAyah) {
        ctx.save();
        const baseArabicSize = (canvasWidth / 1080) * arabicFontSize * 1.55;
        const lineHeight = baseArabicSize * arabicLineSpacing;

        // Clean verse text: remove duplicate Bismillah if not Surah 1
        const rawArabic =
          surah?.number === 1
            ? currentAyah.arabicText
            : stripBismillah(currentAyah.arabicText);

        const words = rawArabic.trim().split(/\s+/).filter(Boolean);

        // Calculate layout with wrapping
        const maxWidth = canvasWidth * 0.86;
        const fontStr = `bold ${baseArabicSize}px '${arabicFont}', 'Amiri', serif`;
        ctx.font = fontStr;
        ctx.direction = 'rtl';

        // Measure words and split into lines
        const lines: { words: { text: string; index: number; width: number }[]; totalWidth: number }[] = [];
        let currentLineWords: { text: string; index: number; width: number }[] = [];
        let currentLineWidth = 0;

        words.forEach((word, idx) => {
          const wMetrics = ctx.measureText(word + ' ');
          const wordW = wMetrics.width;

          if (currentLineWidth + wordW > maxWidth && currentLineWords.length > 0) {
            lines.push({ words: currentLineWords, totalWidth: currentLineWidth });
            currentLineWords = [];
            currentLineWidth = 0;
          }
          currentLineWords.push({ text: word, index: idx + 1, width: wordW });
          currentLineWidth += wordW;
        });
        if (currentLineWords.length > 0) {
          lines.push({ words: currentLineWords, totalWidth: currentLineWidth });
        }

        // Center vertically in main viewing zone
        const totalArabicHeight = lines.length * lineHeight;
        const translationExpectedHeight = showTranslation ? 100 : 0;
        const availableHeight = canvasHeight * 0.65;
        const arabicStartY =
          bismillahBottomY + (availableHeight - totalArabicHeight - translationExpectedHeight) / 2 + 40;

        // Animation modifiers
        let scale = 1.0;
        let alpha = 1.0;
        let translateY = 0;

        if (animationType === 'scale') {
          // Gentle breathing pulsation
          scale = 1.0 + Math.sin(currentTime * 2.5) * 0.018;
        } else if (animationType === 'fade') {
          // Fade in at start of verse
          alpha = Math.min(1.0, (currentTime % 4) * 1.5);
        } else if (animationType === 'slide') {
          // Gentle upward slide
          translateY = Math.max(0, (1 - Math.min(1, (currentTime % 3) * 2)) * 15);
        }

        ctx.translate(0, translateY);

        // Render each line of Arabic text
        lines.forEach((line, lineIdx) => {
          const lineY = arabicStartY + lineIdx * lineHeight;
          let currentX: number;

          if (arabicAlign === 'right') {
            currentX = canvasWidth - (canvasWidth - maxWidth) / 2;
          } else {
            // Centered alignment in RTL
            currentX = canvasWidth / 2 + line.totalWidth / 2;
          }

          ctx.textAlign = 'right';
          ctx.textBaseline = 'alphabetic';

          line.words.forEach((item) => {
            const isHighlighted =
              activeWordPosition !== null
                ? item.index === activeWordPosition
                : animationType === 'highlight' &&
                  Math.floor((currentTime * 2) % words.length) + 1 === item.index;

            ctx.save();
            if (isHighlighted) {
              ctx.fillStyle = wordHighlightColor;
              ctx.shadowColor = wordHighlightColor;
              ctx.shadowBlur = 24;
              ctx.font = `bold ${baseArabicSize * 1.04}px '${arabicFont}', 'Amiri', serif`;
            } else {
              ctx.fillStyle = theme.textColor;
              ctx.shadowColor = 'rgba(0,0,0,0.7)';
              ctx.shadowBlur = 10;
              ctx.font = fontStr;
            }

            // Word text
            ctx.fillText(item.text, currentX, lineY);
            ctx.restore();

            // Shift X to left for next Arabic word (RTL)
            currentX -= item.width;
          });
        });

        // Verse end marker ﴿N﴾
        const lastLineY = arabicStartY + (lines.length - 1) * lineHeight;
        const ayahMarker = `﴿${currentAyah.numberInSurah}﴾`;
        ctx.save();
        ctx.font = `500 ${baseArabicSize * 0.65}px -apple-system, sans-serif`;
        ctx.fillStyle = theme.accentColor;
        ctx.textAlign = 'center';
        // Placed nicely
        ctx.restore();

        // 7. Optional Translation Layer
        if (showTranslation) {
          const transY = lastLineY + baseArabicSize * 1.4;
          const transText =
            translationLang === 'ur'
              ? currentAyah.urduText
              : currentAyah.englishText;

          if (transText) {
            ctx.save();
            const transSize = (canvasWidth / 1080) * translationFontSize * 1.6;
            ctx.font = `${translationLang === 'ur' ? '500' : '400'} ${transSize}px ${
              translationLang === 'ur' ? "'Amiri', serif" : '-apple-system, sans-serif'
            }`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 8;
            ctx.direction = translationLang === 'ur' ? 'rtl' : 'ltr';

            // Wrap translation lines
            const transWords = transText.split(' ');
            let transLines: string[] = [];
            let curTransLine = '';

            transWords.forEach((tw) => {
              const testLine = curTransLine ? `${curTransLine} ${tw}` : tw;
              if (ctx.measureText(testLine).width > maxWidth && curTransLine) {
                transLines.push(curTransLine);
                curTransLine = tw;
              } else {
                curTransLine = testLine;
              }
            });
            if (curTransLine) transLines.push(curTransLine);

            transLines.slice(0, 4).forEach((tl, tIdx) => {
              ctx.fillText(tl, canvasWidth / 2, transY + tIdx * (transSize * 1.45));
            });
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // 8. Waveform Visualizer Layer (if enabled)
      if (waveformEnabled && waveformData.length > 0) {
        ctx.save();
        const waveBottomY = canvasHeight * 0.92;
        const waveWidth = canvasWidth * 0.76;
        const waveStartX = (canvasWidth - waveWidth) / 2;
        const numBars = waveformData.length;
        const barWidth = (waveWidth / numBars) * 0.65;
        const barGap = (waveWidth / numBars) * 0.35;
        const maxBarHeight = canvasHeight * 0.06;

        const currentProgress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
        const activeBarCount = Math.floor(currentProgress * numBars);

        for (let i = 0; i < numBars; i++) {
          const rawAmp = waveformData[i] || 0.2;
          // Dynamically animate slightly when playing
          const dynamicBoost = isPlaying ? Math.sin(currentTime * 8 + i * 0.4) * 0.15 : 0;
          const amp = Math.max(0.12, Math.min(1.0, rawAmp + dynamicBoost));
          const barH = amp * maxBarHeight;
          const bx = waveStartX + i * (barWidth + barGap);

          const isActive = i <= activeBarCount;
          ctx.fillStyle = isActive ? theme.accentColor : 'rgba(255, 255, 255, 0.25)';
          ctx.shadowColor = isActive ? theme.accentColor : 'transparent';
          ctx.shadowBlur = isActive ? 10 : 0;

          if (waveformStyle === 'bars') {
            // Symmetrical rounded bars centered vertically
            const by = waveBottomY - barH / 2;
            ctx.beginPath();
            ctx.roundRect(bx, by, barWidth, barH, barWidth / 2);
            ctx.fill();
          } else if (waveformStyle === 'wave') {
            // Upward vertical bars
            const by = waveBottomY - barH;
            ctx.beginPath();
            ctx.roundRect(bx, by, barWidth, barH, barWidth / 2);
            ctx.fill();
          } else {
            // Minimal dots
            ctx.beginPath();
            ctx.arc(bx + barWidth / 2, waveBottomY, barWidth / 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // Continue loop if playing or animate particles
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    aspectRatio,
    surah,
    ayahs,
    currentAyahIndex,
    activeWordPosition,
    theme,
    customBgUrl,
    customBgType,
    bgOverlayOpacity,
    arabicFont,
    arabicFontSize,
    arabicLineSpacing,
    arabicAlign,
    showTranslation,
    translationLang,
    translationFontSize,
    animationType,
    wordHighlightColor,
    waveformEnabled,
    waveformStyle,
    waveformData,
    currentTime,
    duration,
    isPlaying,
    showReference,
    showBismillah,
    bismillahStyle,
    canvasWidth,
    canvasHeight,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center p-2 sm:p-4 select-none relative overflow-hidden"
    >
      <div
        className={`relative max-w-full max-h-full shadow-2xl rounded-xl overflow-hidden border border-slate-700/60 flex items-center justify-center bg-black ${config.aspectClass}`}
        style={{
          aspectRatio: `${config.width} / ${config.height}`,
          height: aspectRatio === '9:16' ? '100%' : 'auto',
          maxHeight: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain block"
        />
      </div>
    </div>
  );
};
