import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import QuranGenerator from './components/QuranGenerator';
import { VideoEditor } from './components/video/VideoEditor';
import { SplashScreen } from './components/SplashScreen';
import { triggerHaptic, initCapacitorApp } from './utils/native';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'video'>('editor');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initCapacitorApp();
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex justify-center items-center overflow-hidden">
      {/* Brand Launch Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} durationMs={1800} />
      )}

      {/* Dynamic Frame container: edge-to-edge on mobile, responsive max-width on tablet/desktop */}
      <div 
        className={`w-full h-full bg-slate-950 sm:bg-slate-900 sm:border-x sm:border-slate-800/80 flex flex-col relative overflow-hidden transition-all duration-300 ${
          activeTab === 'video' ? 'sm:max-w-xl md:max-w-2xl' : 'sm:max-w-md md:max-w-lg'
        }`}
      >
        {/* Top-Level Tab Switcher Bar: safely padded below Android/iOS status bar */}
        <div 
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
          }}
          className="w-full bg-slate-950/98 border-b border-slate-800/80 px-3 pb-2 flex items-center justify-between shrink-0 z-30 transition-[padding]"
        >
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 pt-1.5">
            <img 
              src="/branding-watermark-badge.png" 
              alt="Hadith of the Moment" 
              className="h-7 w-auto object-contain drop-shadow-xs" 
            />
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-800/90 rounded-xl p-0.5 shadow-inner mt-1.5">
            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('editor');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                activeTab === 'editor'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Poster</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('video');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                activeTab === 'video'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>
        </div>

        {/* Content Views with State Preservation */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className={`w-full h-full ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
            <QuranGenerator />
          </div>
          <div className={`w-full h-full ${activeTab === 'video' ? 'block' : 'hidden'}`}>
            <VideoEditor isActive={activeTab === 'video'} />
          </div>
        </div>
      </div>
    </div>
  );
}

