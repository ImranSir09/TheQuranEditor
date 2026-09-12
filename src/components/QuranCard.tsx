import React, { forwardRef } from 'react';
import { SurahInfo, AyahData, ThemeConfig, AspectRatioKey, BismillahStyle } from '../types';
import { stripBismillah } from '../utils/arabicText';

interface QuranCardProps {
  surah: SurahInfo | null;
  ayahs: AyahData[];
  theme: ThemeConfig;
  aspectRatio: AspectRatioKey;
  borderStyle: 'gold' | 'minimal' | 'rounded' | 'none';
  marginSize: number;
  showBismillah: boolean;
  bismillahStyle?: BismillahStyle;
  showArabic: boolean;
  showEnglish: boolean;
  showUrdu: boolean;
  showReference: boolean;
  watermarkEnabled?: boolean;
  watermarkStyle?: 'badge' | 'emblem' | 'text';
  watermarkOpacity?: number;
  arabicFont: string;
  arabicFontSize: number;
  arabicLineSpacing: number;
  arabicAlign?: 'left' | 'center' | 'right';
  englishFontSize: number;
  englishAlign: 'left' | 'center' | 'right';
  urduFontSize: number;
  urduAlign?: 'left' | 'center' | 'right';
  startAyah: number;
  endAyah: number;
  isLoading: boolean;
  fetchError: string | null;
}

export const QuranCard = forwardRef<HTMLDivElement, QuranCardProps>(function QuranCard(
  {
    surah,
    ayahs,
    theme,
    borderStyle,
    marginSize,
    showBismillah,
    bismillahStyle = 'classic',
    showArabic,
    showEnglish,
    showUrdu,
    showReference,
    watermarkEnabled = true,
    watermarkStyle = 'badge',
    watermarkOpacity = 0.9,
    arabicFont,
    arabicFontSize,
    arabicLineSpacing,
    arabicAlign = 'center',
    englishFontSize,
    englishAlign,
    urduFontSize,
    urduAlign = 'center',
    startAyah,
    endAyah,
    isLoading,
    fetchError,
  },
  ref
) {
  const isSurahTawbah = surah?.number === 9;
  const isSurahFatihah = surah?.number === 1;

  // Render Bismillah header if enabled, style is not none, and not Surah At-Tawbah
  const shouldRenderBismillah =
    showBismillah &&
    bismillahStyle !== 'none' &&
    !isSurahTawbah;

  // Consistent Arabic font family resolution
  const getArabicFontFamily = (font: string) => {
    if (font === 'Scheherazade New') return "'Scheherazade New', serif";
    if (font === 'Lateef') return "'Lateef', serif";
    return "'Amiri', serif";
  };

  const arabicFontFamily = getArabicFontFamily(arabicFont);

  // Filter ayahs so Surah 1 never duplicates Bismillah in both header and body.
  // When Bismillah header is shown, Ayah 1 is presented through the header.
  const displayAyahs = ayahs.filter((ayah) => {
    if (isSurahFatihah && shouldRenderBismillah && ayah.numberInSurah === 1 && ayahs.length > 1) {
      return false;
    }
    return true;
  });

  // Clean Arabic text so verse body never contains a duplicated Bismillah
  const getCleanArabicText = (ayah: AyahData) => {
    if (isSurahFatihah) {
      if (shouldRenderBismillah && ayah.numberInSurah === 1) {
        return '';
      }
      return ayah.arabicText.trim();
    }
    // For Surahs 2-114, always strip the Bismillah prefix from Ayah 1
    return stripBismillah(ayah.arabicText);
  };

  const renderBismillahContent = () => {
    switch (bismillahStyle) {
      case 'ornamental':
        return (
          <div
            dir="rtl"
            style={{ fontFamily: arabicFontFamily }}
            className="w-full text-center text-2xl sm:text-3xl font-bold opacity-90 pb-2 border-b border-white/10 select-none tracking-normal"
            title="Bismillah Ligature"
          >
            ﷽
          </div>
        );
      case 'framed':
        return (
          <div
            dir="rtl"
            style={{ fontFamily: arabicFontFamily }}
            className="w-full text-center text-sm sm:text-base font-bold opacity-85 pb-1.5 border-b border-white/10 tracking-wide"
          >
            ۞ بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۞
          </div>
        );
      case 'minimal':
        return (
          <div
            dir="rtl"
            style={{ fontFamily: arabicFontFamily }}
            className="w-full text-center text-base sm:text-lg font-medium opacity-85 pb-1.5 border-b border-white/10"
          >
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </div>
        );
      case 'classic':
      default:
        return (
          <div
            dir="rtl"
            style={{ fontFamily: arabicFontFamily }}
            className="w-full text-center text-base sm:text-lg font-bold opacity-90 pb-1.5 border-b border-white/10"
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </div>
        );
    }
  };

  return (
    <div
      ref={ref}
      style={{
        padding: `${marginSize}%`,
      }}
      className={`w-full h-full ${theme.bgClass} ${theme.textClass} flex flex-col justify-between relative overflow-hidden select-none transition-colors duration-200 ${
        borderStyle === 'gold'
          ? 'border-4 border-amber-400/80 ring-4 ring-amber-400/20'
          : borderStyle === 'minimal'
          ? 'border border-white/25'
          : borderStyle === 'rounded'
          ? 'border-2 border-white/30 rounded-3xl'
          : ''
      }`}
    >
      {/* Subtle geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:20px_20px]" 
      />

      {/* Decorative corner accents for gold theme */}
      {borderStyle === 'gold' && (
        <>
          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/90 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/90 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/90 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/90 pointer-events-none" />
        </>
      )}

      {/* Top Header: Surah Details */}
      {showReference && surah && (
        <header className="relative z-10 w-full flex justify-between items-center pb-3 border-b border-white/10 text-xs tracking-wider shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${theme.badgeBg}`}>
              {surah.number}. {surah.englishName}
            </span>
            <span className="text-[11px] opacity-70 hidden sm:inline">
              {surah.englishNameTranslation}
            </span>
          </div>
          <div className="text-right">
            <span 
              style={{ fontFamily: "'Amiri', serif" }} 
              className="text-base sm:text-lg font-bold tracking-normal opacity-95"
            >
              {surah.name}
            </span>
          </div>
        </header>
      )}

      {/* Center Quranic Content */}
      <main className="relative z-10 my-auto py-4 sm:py-6 flex flex-col justify-center w-full">
        {isLoading ? (
          <div className="text-center py-10 opacity-75 w-full">
            <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs tracking-wide">Loading Quranic text...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-8 text-rose-300 text-xs w-full">
            <p className="font-semibold mb-1">Error Loading Verses</p>
            <p className="opacity-80">{fetchError}</p>
          </div>
        ) : ayahs.length === 0 ? (
          <div className="text-center py-10 opacity-60 text-xs w-full">
            Select a Surah and Ayah range to preview
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {/* Optional Bismillah */}
            {shouldRenderBismillah && renderBismillahContent()}

            {/* Arabic Uthmani Text */}
            {showArabic && (
              <div
                dir="rtl"
                style={{
                  fontSize: `${arabicFontSize}px`,
                  lineHeight: arabicLineSpacing,
                  fontFamily: arabicFontFamily,
                  textAlign: arabicAlign,
                }}
                className={`w-full font-bold tracking-wide drop-shadow-xs ${
                  arabicAlign === 'center' ? 'text-center' : arabicAlign === 'left' ? 'text-left' : 'text-right'
                }`}
              >
                {displayAyahs.map((ayah) => {
                  const cleanText = getCleanArabicText(ayah);
                  if (!cleanText) return null;
                  return (
                    <span key={ayah.number} className="inline">
                      {cleanText}{' '}
                      <span 
                        style={{ color: theme.accentColor }} 
                        className="inline-block font-sans text-xs sm:text-sm mx-1 px-1.5 py-0.5 rounded-full border border-current/30 align-middle font-medium"
                      >
                        ﴿{ayah.numberInSurah}﴾
                      </span>{' '}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Urdu Translation */}
            {showUrdu && displayAyahs[0]?.urduText && (
              <div
                dir="rtl"
                style={{
                  fontSize: `${urduFontSize}px`,
                  fontFamily: "'Lateef', 'Amiri', serif",
                  lineHeight: 1.8,
                  textAlign: urduAlign,
                }}
                className={`w-full opacity-90 border-t border-white/10 pt-3 ${
                  urduAlign === 'center' ? 'text-center' : urduAlign === 'left' ? 'text-left' : 'text-right'
                }`}
              >
                <p>
                  {displayAyahs.map((a) => (
                    <span key={a.number}>
                      {a.urduText}{' '}
                      <span className="text-xs opacity-60 font-sans">({a.numberInSurah})</span>{' '}
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* English Translation */}
            {showEnglish && displayAyahs[0]?.englishText && (
              <div
                style={{
                  fontSize: `${englishFontSize}px`,
                  textAlign: englishAlign,
                  lineHeight: 1.65,
                }}
                className={`w-full opacity-90 font-sans border-t border-white/10 pt-3 ${
                  englishAlign === 'center' ? 'text-center' : englishAlign === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                <p>
                  {displayAyahs.map((a) => (
                    <span key={a.number}>
                      {a.englishText}{' '}
                      <span className="text-[11px] opacity-60 font-mono">[{a.numberInSurah}]</span>{' '}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Watermark & Attribution Footer */}
      {(watermarkEnabled || (showReference && surah)) && (
        <footer className="relative z-10 w-full pt-2 flex flex-col items-center gap-2 shrink-0">
          {/* Brand Watermark */}
          {watermarkEnabled && (
            <div 
              style={{ opacity: watermarkOpacity }}
              className="flex items-center justify-center transition-opacity duration-200"
            >
              {watermarkStyle === 'badge' ? (
                <img 
                  src="/branding-watermark-badge.png" 
                  alt="Hadith of the Moment" 
                  className="h-6 sm:h-7 object-contain drop-shadow-md" 
                />
              ) : watermarkStyle === 'emblem' ? (
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs border border-white/20 px-2.5 py-1 rounded-full shadow-xs">
                  <img src="/icon.svg" alt="Hadith of the Moment" className="w-4 h-4 rounded-full object-cover" />
                  <span className="text-[10px] font-bold text-sky-400 tracking-wider">HADITH OF THE MOMENT</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold tracking-widest text-sky-400 uppercase drop-shadow">
                  HADITH OF THE MOMENT
                </span>
              )}
            </div>
          )}

          {/* Reference Attribution */}
          {showReference && surah && (
            <div className="w-full pt-1.5 border-t border-white/10 flex justify-between items-center text-[10px] sm:text-[11px] opacity-75 font-sans">
              <span>
                Surah {surah.englishName} ({surah.number}:{startAyah}
                {startAyah !== endAyah ? `-${endAyah}` : ''})
              </span>
              <span className="tracking-wider uppercase font-semibold text-[9px] sm:text-[10px]">
                Quran.com Verified
              </span>
            </div>
          )}
        </footer>
      )}
    </div>
  );
});
