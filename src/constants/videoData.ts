import { VideoAspectRatio, VideoRatioConfig, VideoBackgroundTheme, Reciter } from '../types/video';

export const VIDEO_RATIO_CONFIGS: Record<VideoAspectRatio, VideoRatioConfig> = {
  '9:16': {
    label: 'Story / Reel (9:16)',
    shortLabel: '9:16',
    description: 'Instagram Reel, TikTok, Shorts',
    width: 1080,
    height: 1920,
    aspectClass: 'aspect-[9/16]',
  },
  '16:9': {
    label: 'Landscape (16:9)',
    shortLabel: '16:9',
    description: 'YouTube, Desktop, TV',
    width: 1920,
    height: 1080,
    aspectClass: 'aspect-[16/9]',
  },
  '1:1': {
    label: 'Square (1:1)',
    shortLabel: '1:1',
    description: 'Instagram Feed, Status, Post',
    width: 1080,
    height: 1080,
    aspectClass: 'aspect-square',
  },
};

export const VIDEO_BG_THEMES: VideoBackgroundTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald Royale',
    gradient: 'from-emerald-950 via-teal-950 to-slate-950',
    canvasBg: ['#022c22', '#042f2e', '#020617'],
    particleColor: 'rgba(52, 211, 153, 0.4)',
    textColor: '#f0fdf4',
    accentColor: '#34d399',
    highlightGlow: '#10b981',
  },
  {
    id: 'midnight',
    name: 'Midnight Celestial',
    gradient: 'from-slate-950 via-indigo-950 to-zinc-950',
    canvasBg: ['#020617', '#1e1b4b', '#09090b'],
    particleColor: 'rgba(129, 140, 248, 0.4)',
    textColor: '#e0e7ff',
    accentColor: '#818cf8',
    highlightGlow: '#6366f1',
  },
  {
    id: 'gold',
    name: 'Desert Gold',
    gradient: 'from-amber-950 via-stone-900 to-neutral-950',
    canvasBg: ['#451a03', '#1c1917', '#0a0a0a'],
    particleColor: 'rgba(251, 191, 36, 0.4)',
    textColor: '#fef3c7',
    accentColor: '#fbbf24',
    highlightGlow: '#f59e0b',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Minimal',
    gradient: 'from-neutral-950 via-zinc-900 to-black',
    canvasBg: ['#0a0a0a', '#18181b', '#000000'],
    particleColor: 'rgba(255, 255, 255, 0.3)',
    textColor: '#fafafa',
    accentColor: '#ffffff',
    highlightGlow: '#e4e4e7',
  },
  {
    id: 'twilight',
    name: 'Twilight Sapphire',
    gradient: 'from-cyan-950 via-blue-950 to-slate-950',
    canvasBg: ['#083344', '#172554', '#020617'],
    particleColor: 'rgba(56, 189, 248, 0.4)',
    textColor: '#ecfeff',
    accentColor: '#38bdf8',
    highlightGlow: '#0284c7',
  },
  {
    id: 'ruby',
    name: 'Royal Ruby',
    gradient: 'from-rose-950 via-stone-950 to-black',
    canvasBg: ['#4c0519', '#1c1917', '#000000'],
    particleColor: 'rgba(251, 113, 133, 0.4)',
    textColor: '#fff1f2',
    accentColor: '#fb7185',
    highlightGlow: '#e11d48',
  },
];

export const RECITERS: Reciter[] = [
  {
    id: 7,
    name: 'Mishari Rashid al-`Afasy',
    subname: 'Verified Word-by-Word Timing',
    hasWordTimestamps: true,
  },
  {
    id: 1,
    name: 'AbdulBaset AbdulSamad',
    subname: 'Mujawwad',
    hasWordTimestamps: false,
  },
  {
    id: 2,
    name: 'AbdulBaset AbdulSamad',
    subname: 'Murattal',
    hasWordTimestamps: false,
  },
  {
    id: 4,
    name: 'Abu Bakr al-Shatri',
    subname: 'Murattal',
    hasWordTimestamps: false,
  },
  {
    id: 5,
    name: 'Hani ar-Rifai',
    subname: 'Murattal',
    hasWordTimestamps: false,
  },
];
