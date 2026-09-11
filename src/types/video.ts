import { SurahInfo, AyahData } from '../types';

export type VideoAspectRatio = '9:16' | '16:9' | '1:1';

export type TextAnimationType = 'fade' | 'highlight' | 'reveal' | 'scale' | 'slide';

export interface VideoRatioConfig {
  label: string;
  shortLabel: string;
  description: string;
  width: number;
  height: number;
  aspectClass: string;
}

export interface VideoBackgroundTheme {
  id: string;
  name: string;
  gradient: string;
  canvasBg: string[];
  particleColor: string;
  textColor: string;
  accentColor: string;
  highlightGlow: string;
}

export interface WordTiming {
  position: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface AyahTiming {
  verseKey: string;
  fromMs: number;
  toMs: number;
  duration: number;
  segments: [number, number, number][]; // [wordPosition, startMs, endMs]
  words: WordTiming[];
}

export interface Reciter {
  id: number;
  name: string;
  subname: string;
  hasWordTimestamps: boolean;
}

export interface VideoProject {
  id: string;
  title: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  aspectRatio: VideoAspectRatio;
  arabicFont: string;
  arabicFontSize: number;
  arabicLineSpacing: number;
  arabicAlign: 'center' | 'right';
  showTranslation: boolean;
  translationLang: 'en' | 'ur';
  translationFontSize: number;
  animationType: TextAnimationType;
  wordHighlightColor: string;
  bgThemeId: string;
  bgOverlayOpacity: number;
  reciterId: number;
  waveformEnabled: boolean;
  waveformStyle: 'bars' | 'wave' | 'minimal';
  showBismillah: boolean;
  bismillahStyle: string;
  showReference: boolean;
  updatedAt: number;
}
