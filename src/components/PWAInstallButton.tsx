import React, { useState } from 'react';
import { Download, Smartphone, Check, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isNativePlatform, triggerHaptic } from '../utils/native';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const isNative = isNativePlatform();

  // If already running in standalone PWA or native Android APK, do not show install prompt
  if (isInstalled || isNative) {
    return null;
  }

  const handleAction = async () => {
    triggerHaptic();
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleAction}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition active:scale-95 shrink-0"
        title="Install Android App / PWA"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Get Android App</h3>
                  <p className="text-[11px] text-slate-400">Offline & full screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <h4 className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Method 1: Direct Web APK / PWA
                </h4>
                <p className="text-slate-400 mb-2">
                  Tap below to add Quran Editor directly to your Android Home Screen with native app framing and offline storage.
                </p>
                {isInstallable ? (
                  <button
                    onClick={async () => {
                      await install();
                      setShowModal(false);
                    }}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-lg transition"
                  >
                    Install Now
                  </button>
                ) : (
                  <p className="text-[11px] text-amber-300/90 italic">
                    Tap browser menu (⋮) &gt; "Add to Home screen" or "Install App".
                  </p>
                )}
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <h4 className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  Method 2: GitHub Android APK
                </h4>
                <p className="text-slate-400 text-[11px]">
                  GitHub Actions automatically compiles <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">app-debug.apk</code> on every push. You can download the APK artifact from the GitHub repository’s <strong>Actions</strong> tab!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-medium text-slate-300 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
