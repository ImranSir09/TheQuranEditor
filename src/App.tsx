import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import QuranGenerator from './components/QuranGenerator';
import { VideoEditor } from './components/video/VideoEditor';
import { triggerHaptic, initCapacitorApp } from './utils/native';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'video'>('editor');

  useEffect(() => {
    initCapacitorApp();
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex justify-center items-center overflow-hidden">
      {/* Dynamic Frame container: mobile-first, responsive width for video workspace */}
      <div 
        className={`w-full h-full bg-slate-900 border-x border-slate-800/80 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-300 ${
          activeTab === 'video' ? 'max-w-[500px] sm:max-w-xl md:max-w-2xl' : 'max-w-[450px]'
        }`}
      >
        {/* Top-Level Tab Switcher Bar: safely padded below Android/iOS status bar */}
        <div 
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)',
          }}
          className="w-full bg-slate-950 border-b border-slate-800/90 px-3 pb-2 flex items-center justify-between shrink-0 z-30 transition-[padding]"
        >
          <div className="flex items-center gap-1.5 pt-1.5">
            <span className="font-bold text-xs tracking-tight text-emerald-400">TheQuranEditor</span>
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 shadow-inner mt-1.5">
            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('editor');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === 'editor'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Quran Editor</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setActiveTab('video');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition relative ${
                activeTab === 'video'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Video Editor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Content Views with State Preservation */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className={`w-full h-full ${activeTab === 'editor' ? 'block' : 'hidden'}`}>
            <QuranGenerator />
          </div>
          <div className={`w-full h-full ${activeTab === 'video' ? 'block' : 'hidden'}`}>
            <VideoEditor />
          </div>
        </div>
      </div>
    </div>
  );
}

