import React from 'react';
import QuranGenerator from './components/QuranGenerator';

export default function App() {
  return (
    <div className="h-[100dvh] w-full bg-slate-950 text-slate-100 flex justify-center items-center overflow-hidden">
      {/* Mobile-Only Frame container: 100% height, max-w-md, non-scrolling */}
      <div className="w-full max-w-[450px] h-full bg-slate-900 border-x border-slate-800/80 flex flex-col relative overflow-hidden shadow-2xl">
        <QuranGenerator />
      </div>
    </div>
  );
}
