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

export const initCapacitorApp = async () => {
  if (isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#020617' });
    } catch {
      // ignore on unsupported devices
    }

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
