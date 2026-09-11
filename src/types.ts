export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface AyahData {
  number: number;
  numberInSurah: number;
  arabicText: string;
  englishText: string;
  urduText: string;
  juz: number;
  page: number;
}

export type AspectRatioKey = '1:1' | '4:5' | '9:16' | '16:9' | '3:4';

export type BismillahStyle = 'classic' | 'ornamental' | 'framed' | 'minimal' | 'none';

export interface RatioConfig {
  label: string;
  shortLabel: string;
  description: string;
  width: number;
  height: number;
  aspectClass: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'ornamental';
  bgClass: string;
  textClass: string;
  accentColor: string;
  borderDefault: string;
  badgeBg: string;
}

export interface QuickPreset {
  id: string;
  label: string;
  surahNumber: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  themeId: string;
  aspectRatio: AspectRatioKey;
}
