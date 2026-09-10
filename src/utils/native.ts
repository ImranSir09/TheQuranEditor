import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapApp } from '@capacitor/app';

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
}) => {
  triggerHaptic();

  // Try Capacitor native share if on native Android
  if (isNativePlatform()) {
    try {
      // On Capacitor, share can accept dialogTitle and text/url
      await Share.share({
        title,
        text,
        dialogTitle: 'Share Quran Verse',
      });
      return true;
    } catch (err: any) {
      if (err?.message !== 'Share canceled') {
        console.warn('Capacitor share fallback:', err);
      }
    }
  }

  // Web Share API with File support
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
