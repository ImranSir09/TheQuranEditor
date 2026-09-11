import { AyahTiming, WordTiming } from '../types/video';

// In-memory cache for verse timings by reciter and surah
const timingsCache: Record<string, { audioUrl: string; timings: Record<string, AyahTiming> }> = {};

/**
 * Fetches verified recitation audio and timestamps for a given Surah and reciter.
 * Reciter 7 (Mishari Rashid al-`Afasy) provides official verified word-by-word segments.
 */
export async function fetchRecitationTimings(
  surahNumber: number,
  reciterId: number = 7
): Promise<{ audioUrl: string; timings: Record<string, AyahTiming>; hasWordSegments: boolean }> {
  const cacheKey = `${reciterId}_${surahNumber}`;
  if (timingsCache[cacheKey]) {
    const cached = timingsCache[cacheKey];
    const hasWordSegments = Object.values(cached.timings).some((t) => t.segments && t.segments.length > 0);
    return { audioUrl: cached.audioUrl, timings: cached.timings, hasWordSegments };
  }

  try {
    const response = await fetch(
      `https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahNumber}?segments=true`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch recitation: HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.audio_file) {
      throw new Error('No audio file in response');
    }

    const audioUrl = data.audio_file.audio_url;
    const timestampsRaw = data.audio_file.timestamps || [];
    const timings: Record<string, AyahTiming> = {};
    let hasWordSegments = false;

    for (const item of timestampsRaw) {
      const segments: [number, number, number][] = item.segments || [];
      if (segments.length > 0) {
        hasWordSegments = true;
      }
      const words: WordTiming[] = segments.map(([pos, start, end]) => ({
        position: pos,
        startMs: start,
        endMs: end,
        text: '',
      }));

      timings[item.verse_key] = {
        verseKey: item.verse_key,
        fromMs: item.timestamp_from,
        toMs: item.timestamp_to,
        duration: item.duration,
        segments,
        words,
      };
    }

    timingsCache[cacheKey] = { audioUrl, timings };
    return { audioUrl, timings, hasWordSegments };
  } catch (err) {
    console.warn('Recitation timing fetch warning:', err);
    // Fallback URL for Alafasy
    const fallbackUrl = `https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/${surahNumber}.mp3`;
    return { audioUrl: fallbackUrl, timings: {}, hasWordSegments: false };
  }
}

/**
 * Fetch word text for a verse to attach to segment timestamps
 */
export async function fetchVerseWords(verseKey: string): Promise<{ position: number; text: string }[]> {
  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${verseKey}?words=true&word_fields=text_uthmani`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.verse?.words) return [];
    return data.verse.words
      .filter((w: any) => w.char_type_name === 'word')
      .map((w: any) => ({
        position: w.position,
        text: w.text_uthmani || w.text,
      }));
  } catch {
    return [];
  }
}

/**
 * Formats seconds into MM:SS.S or MM:SS
 */
export function formatTime(seconds: number, includeMs: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) return includeMs ? '00:00.0' : '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  const minStr = String(mins).padStart(2, '0');
  const secStr = String(secs).padStart(2, '0');
  if (includeMs) {
    return `${minStr}:${secStr}.${ms}`;
  }
  return `${minStr}:${secStr}`;
}

/**
 * Generates synthetic waveform bars or extracts from audio data
 */
export function generateWaveformData(points: number = 60, seed: number = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < points; i++) {
    // Elegant harmonic wave pattern simulating human vocal recitation
    const v1 = Math.sin((i / points) * Math.PI * 4 + seed);
    const v2 = Math.cos((i / points) * Math.PI * 7);
    const v3 = Math.sin((i / points) * Math.PI * 2);
    const val = Math.abs((v1 * 0.4 + v2 * 0.3 + v3 * 0.3));
    data.push(Math.max(0.12, Math.min(1.0, val * 0.9 + 0.15)));
  }
  return data;
}

/**
 * Extracts real audio waveform from an AudioBuffer if available
 */
export async function extractWaveformFromUrl(url: string, numBars: number = 60): Promise<number[]> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return generateWaveformData(numBars);
    
    const audioCtx = new AudioContextClass();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / numBars);
    const filteredData: number[] = [];
    
    for (let i = 0; i < numBars; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j] || 0);
      }
      filteredData.push(Math.max(0.1, Math.min(1.0, (sum / blockSize) * 4)));
    }
    
    audioCtx.close();
    return filteredData;
  } catch (err) {
    console.warn('Using fallback waveform data:', err);
    return generateWaveformData(numBars);
  }
}
