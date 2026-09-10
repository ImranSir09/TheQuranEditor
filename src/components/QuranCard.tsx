import React, { forwardRef } from 'react';
import { SurahInfo, AyahData, ThemeConfig, AspectRatioKey } from '../types';

interface QuranCardProps {
  surah: SurahInfo | null;
  ayahs: AyahData[];
  theme: ThemeConfig;
  aspectRatio: AspectRatioKey;
  borderStyle: 'gold' | 'minimal' | 'rounded' | 'none';
  marginSize: number;
  showBismillah: boolean;
  showArabic: boolean;
  showEnglish: boolean;
  showUrdu: boolean;
  showReference: boolean;
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
    showArabic,
    showEnglish,
    showUrdu,
    showReference,
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
  const shouldRenderBismillah = showBismillah && !isSurahTawbah;

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
            {shouldRenderBismillah && (
              <div 
                dir="rtl"
                style={{ fontFamily: "'Amiri', serif" }}
                className="w-full text-center text-lg sm:text-xl font-bold opacity-85 pb-1 border-b border-white/10"
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}

            {/* Arabic Uthmani Text */}
            {showArabic && (
              <div
                dir="rtl"
                style={{
                  fontSize: `${arabicFontSize}px`,
                  lineHeight: arabicLineSpacing,
                  fontFamily: arabicFont === 'Scheherazade New' ? "'Scheherazade New', serif" : "'Amiri', serif",
                  textAlign: arabicAlign,
                }}
                className={`w-full font-bold tracking-wide drop-shadow-xs ${
                  arabicAlign === 'center' ? 'text-center' : arabicAlign === 'left' ? 'text-left' : 'text-right'
                }`}
              >
                {ayahs.map((ayah) => (
                  <span key={ayah.number} className="inline">
                    {ayah.arabicText}{' '}
                    <span 
                      style={{ color: theme.accentColor }} 
                      className="inline-block font-sans text-xs sm:text-sm mx-1 px-1.5 py-0.5 rounded-full border border-current/30 align-middle font-medium"
                    >
                      ﴿{ayah.numberInSurah}﴾
                    </span>{' '}
                  </span>
                ))}
              </div>
            )}

            {/* Urdu Translation */}
            {showUrdu && ayahs[0]?.urduText && (
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
                  {ayahs.map((a) => (
                    <span key={a.number}>
                      {a.urduText}{' '}
                      <span className="text-xs opacity-60 font-sans">({a.numberInSurah})</span>{' '}
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* English Translation */}
            {showEnglish && ayahs[0]?.englishText && (
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
                  {ayahs.map((a) => (
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

      {/* Bottom Footer Attribution */}
      {showReference && surah && (
        <footer className="relative z-10 w-full pt-3 border-t border-white/10 flex justify-between items-center text-[10px] sm:text-[11px] opacity-75 font-sans shrink-0">
          <span>
            Surah {surah.englishName} ({surah.number}:{startAyah}
            {startAyah !== endAyah ? `-${endAyah}` : ''})
          </span>
          <span className="tracking-wider uppercase font-semibold text-[9px] sm:text-[10px]">
            Quran.com Verified
          </span>
        </footer>
      )}
    </div>
  );
});
