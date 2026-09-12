import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapApp } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

export const configureStatusBar = async (options?: { style?: 'DARK' | 'LIGHT'; backgroundColor?: string }) => {
  if (isNativePlatform()) {
    try {
      // Keep Android status bar visible and prevent app from drawing behind it
      await StatusBar.show();
      await StatusBar.setOverlaysWebView({ overlay: false });

      const targetStyle = options?.style === 'LIGHT' ? Style.Light : Style.Dark;
      await StatusBar.setStyle({ style: targetStyle });

      if (options?.backgroundColor) {
        await StatusBar.setBackgroundColor({ color: options.backgroundColor });
      } else {
        await StatusBar.setBackgroundColor({ color: '#020617' });
      }
    } catch (err) {
      console.warn('StatusBar configuration warning:', err);
    }
  }
};

export const initCapacitorApp = async () => {
  if (isNativePlatform()) {
    await configureStatusBar({ style: 'DARK', backgroundColor: '#020617' });

    try {
      await SplashScreen.hide();
    } catch {
      // ignore
    }
  }
};

export const triggerHaptic = async () => {
  try {
    if (isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  } catch {
    // ignore
  }
};

/**
 * Saves an image to the device's Documents/Downloads directory on Android/iOS,
 * or downloads via browser blob on Web/PWA.
 */
export const saveImageFile = async ({
  dataUrl,
  filename,
}: {
  dataUrl: string;
  filename: string;
}): Promise<{ success: boolean; message: string; uri?: string }> => {
  triggerHaptic();

  // 1. Native Capacitor implementation (Android / iOS)
  if (isNativePlatform()) {
    try {
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

      // Check and request storage permissions if applicable
      try {
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          await Filesystem.requestPermissions();
        }
      } catch {
        // ignore on newer Android where scoped storage doesn't require runtime storage permission
      }

      // Write to public Documents directory (accessible by user Files app)
      try {
        const docResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });

        // Also write to Cache so it's readily accessible to other apps
        await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        }).catch(() => null);

        return {
          success: true,
          message: `Saved to Documents: ${filename}`,
          uri: docResult.uri,
        };
      } catch (writeErr) {
        console.warn('Writing to Documents failed, falling back to Cache + System Share:', writeErr);

        // Fallback: write to Cache and trigger system save/share dialog
        const cacheResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title: filename,
          url: cacheResult.uri,
          dialogTitle: 'Save to Downloads or Share',
        });

        return {
          success: true,
          message: `Saved: ${filename}`,
          uri: cacheResult.uri,
        };
      }
    } catch (err: any) {
      console.error('Native saveImageFile error:', err);
      return {
        success: false,
        message: err?.message || 'Failed to save to device files',
      };
    }
  }

  // 2. Web / PWA / Mobile browser download
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);

    return {
      success: true,
      message: `Downloaded ${filename}`,
    };
  } catch (err: any) {
    console.error('Browser download failed:', err);
    return {
      success: false,
      message: 'Download failed. Please try again.',
    };
  }
};

/**
 * Triggers native system share dialog with the actual image file attached
 */
export const saveViaSystemPicker = async ({
  dataUrl,
  filename,
}: {
  dataUrl: string;
  filename: string;
}): Promise<boolean> => {
  triggerHaptic();

  if (isNativePlatform()) {
    try {
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const cacheFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      await Share.share({
        title: filename,
        url: cacheFile.uri,
        dialogTitle: 'Save to Downloads or Choose App',
      });
      return true;
    } catch (err) {
      console.warn('System picker share canceled or failed:', err);
      return false;
    }
  }

  const result = await saveImageFile({ dataUrl, filename });
  return result.success;
};

/**
 * Shares the verse image (with image file attached) to WhatsApp, Stories, etc.
 */
export const shareVerseImage = async ({
  title,
  text,
  dataUrl,
  filename,
}: {
  title: string;
  text: string;
  dataUrl?: string;
  filename: string;
}): Promise<boolean> => {
  triggerHaptic();

  // 1. Native Capacitor Share with actual local image URI
  if (isNativePlatform()) {
    try {
      if (dataUrl) {
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const cacheFile = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title,
          text,
          url: cacheFile.uri,
          dialogTitle: 'Share Quran Verse Card',
        });
        return true;
      } else {
        await Share.share({
          title,
          text,
          dialogTitle: 'Share Quran Verse',
        });
        return true;
      }
    } catch (err: any) {
      if (err?.message !== 'Share canceled' && err?.name !== 'AbortError') {
        console.warn('Capacitor native share error:', err);
      }
      return false;
    }
  }

  // 2. Web Share API with File attachment
  if (typeof navigator !== 'undefined' && navigator.share && dataUrl) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: blob.type || 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return true;
      } else {
        await navigator.share({
          title,
          text,
        });
        return true;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share failed, falling back:', err);
      }
    }
  }

  return false;
};

export const listenToHardwareBack = (handler: () => boolean) => {
  if (isNativePlatform()) {
    const listenerPromise = CapApp.addListener('backButton', (event) => {
      const handled = handler();
      if (!handled && !event.canGoBack) {
        CapApp.exitApp();
      }
    });

    return () => {
      listenerPromise.then((handle) => handle.remove());
    };
  }
  return () => {};
};

/**
 * Detects the best supported video MIME type and container extension.
 * Prioritizes standard MP4 codecs for high Android & iOS mobile compatibility,
 * and falls back cleanly to WebM without pretending it is MP4.
 */
export const getVideoExportMimeType = (): { mimeType: string; extension: 'mp4' | 'webm' } => {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: 'video/mp4', extension: 'mp4' };
  }

  const candidateFormats: { mime: string; ext: 'mp4' | 'webm' }[] = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ];

  for (const candidate of candidateFormats) {
    if (MediaRecorder.isTypeSupported(candidate.mime)) {
      return { mimeType: candidate.mime, extension: candidate.ext };
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
};

/**
 * Converts a Blob or Blob slice into a raw Base64 string without data-URL header.
 */
const blobChunkToBase64 = (chunk: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const commaIndex = reader.result.indexOf(',');
        resolve(commaIndex !== -1 ? reader.result.substring(commaIndex + 1) : reader.result);
      } else {
        reject(new Error('Failed to read blob chunk as base64'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(chunk);
  });
};

/**
 * Saves a rendered video file to the device.
 * On Android Capacitor: writes chunk-by-chunk to Directory.Documents so large
 * videos never crash the WebView and are immediately visible in the Android Files app.
 * Falls back to Directory.Cache + native system picker if Documents permission fails.
 * On Desktop/Web: triggers clean browser download without leaving blank tabs.
 */
export const saveVideoFile = async ({
  blob,
  filename,
  mimeType,
  onProgress,
}: {
  blob: Blob;
  filename: string;
  mimeType?: string;
  onProgress?: (progress: number) => void;
}): Promise<{ success: boolean; message: string; uri?: string }> => {
  triggerHaptic();

  // 1. Native Capacitor on Android & iOS
  if (isNativePlatform()) {
    try {
      // Check and request storage permissions if necessary
      try {
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          await Filesystem.requestPermissions();
        }
      } catch {
        // Scoped storage on newer Android does not require publicStorage permission
      }

      // 512 KB chunks keep memory footprint very small and avoid WebView bridge crashes
      const CHUNK_SIZE = 512 * 1024;
      const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);

      // Attempt primary write to Public Documents directory (visible in Files app)
      try {
        const firstChunk = blob.slice(0, Math.min(blob.size, CHUNK_SIZE));
        const firstBase64 = await blobChunkToBase64(firstChunk);

        const docResult = await Filesystem.writeFile({
          path: filename,
          data: firstBase64,
          directory: Directory.Documents,
          recursive: true,
        });

        if (onProgress && totalChunks > 1) {
          onProgress(Math.round((1 / totalChunks) * 100));
        }

        for (let i = 1; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(blob.size, start + CHUNK_SIZE);
          const chunkBase64 = await blobChunkToBase64(blob.slice(start, end));

          await Filesystem.appendFile({
            path: filename,
            data: chunkBase64,
            directory: Directory.Documents,
          });

          if (onProgress) {
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
          }
        }

        return {
          success: true,
          message: `Saved to Documents (${filename})`,
          uri: docResult.uri,
        };
      } catch (writeErr) {
        console.warn('Primary save to Documents failed, falling back to Cache + System Share:', writeErr);

        // Fallback: write chunked to Cache and trigger system Save/Share picker
        const firstChunk = blob.slice(0, Math.min(blob.size, CHUNK_SIZE));
        const firstBase64 = await blobChunkToBase64(firstChunk);

        const cacheResult = await Filesystem.writeFile({
          path: filename,
          data: firstBase64,
          directory: Directory.Cache,
          recursive: true,
        });

        for (let i = 1; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(blob.size, start + CHUNK_SIZE);
          const chunkBase64 = await blobChunkToBase64(blob.slice(start, end));

          await Filesystem.appendFile({
            path: filename,
            data: chunkBase64,
            directory: Directory.Cache,
          });

          if (onProgress) {
            onProgress(Math.round(((i + 1) / totalChunks) * 100));
          }
        }

        await Share.share({
          title: filename,
          url: cacheResult.uri,
          dialogTitle: 'Save Quran Video to Device',
        });

        return {
          success: true,
          message: `Saved: ${filename}`,
          uri: cacheResult.uri,
        };
      }
    } catch (err: any) {
      console.error('Native saveVideoFile error:', err);
      return {
        success: false,
        message: err?.message || 'Failed to save video to device storage',
      };
    }
  }

  // 2. Desktop Web / Browser Fallback
  try {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

    return {
      success: true,
      message: `Downloaded ${filename}`,
    };
  } catch (err: any) {
    console.error('Browser download failed:', err);
    return {
      success: false,
      message: 'Video download failed. Please try again.',
    };
  }
};

/**
 * Shares the rendered Quran video via native Share dialog or Web Share API.
 */
export const shareVideoFile = async ({
  blob,
  filename,
  title,
  text,
}: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
}): Promise<boolean> => {
  triggerHaptic();

  if (isNativePlatform()) {
    try {
      const CHUNK_SIZE = 512 * 1024;
      const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);

      const firstSlice = blob.slice(0, Math.min(blob.size, CHUNK_SIZE));
      const firstBase64 = await blobChunkToBase64(firstSlice);

      const cacheResult = await Filesystem.writeFile({
        path: filename,
        data: firstBase64,
        directory: Directory.Cache,
        recursive: true,
      });

      for (let i = 1; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(blob.size, start + CHUNK_SIZE);
        const chunkBase64 = await blobChunkToBase64(blob.slice(start, end));
        await Filesystem.appendFile({
          path: filename,
          data: chunkBase64,
          directory: Directory.Cache,
        });
      }

      await Share.share({
        title,
        text,
        url: cacheResult.uri,
        dialogTitle: 'Share Quran Video',
      });
      return true;
    } catch (err: any) {
      if (err?.message !== 'Share canceled' && err?.name !== 'AbortError') {
        console.warn('Native video share failed:', err);
      }
      return false;
    }
  }

  // Web Share API fallback
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], filename, { type: blob.type || 'video/mp4' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text,
          files: [file],
        });
        return true;
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Web Share video failed:', err);
      }
    }
  }

  return false;
};
