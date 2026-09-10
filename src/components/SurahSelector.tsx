import React, { useState, useMemo } from 'react';
import { Search, X, Check, BookOpen, Sparkles } from 'lucide-react';
import { SurahInfo } from '../types';
import { POPULAR_SURAH_NUMBERS } from '../constants/quranData';
import { triggerHaptic } from '../utils/native';

interface SurahSelectorProps {
  surahs: SurahInfo[];
  selectedSurah: SurahInfo | null;
  onSelectSurah: (surah: SurahInfo) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SurahSelector({
  surahs,
  selectedSurah,
  onSelectSurah,
  isOpen,
  onClose,
}: SurahSelectorProps) {
  const [query, setQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    if (!query.trim()) return surahs;
    const q = query.toLowerCase().trim();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(q) ||
        s.number.toString() === q
    );
  }, [surahs, query]);

  const popularSurahsList = useMemo(() => {
    return surahs.filter((s) => POPULAR_SURAH_NUMBERS.includes(s.number));
  }, [surahs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Select Surah</h3>
              <p className="text-xs text-slate-400">All 114 Surahs of the Holy Quran</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or number (e.g. 36, Yasin, Mulk)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Popular Pills */}
          {!query && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400 shrink-0">Popular:</span>
              {popularSurahsList.slice(0, 6).map((s) => (
                <button
                  key={s.number}
                  onClick={() => {
                    triggerHaptic();
                    onSelectSurah(s);
                    onClose();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition ${
                    selectedSurah?.number === s.number
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  {s.englishName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Surah List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {filteredSurahs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No Surahs found matching &quot;{query}&quot;
            </div>
          ) : (
            filteredSurahs.map((surah) => {
              const isSelected = selectedSurah?.number === surah.number;
              return (
                <button
                  key={surah.number}
                  onClick={() => {
                    triggerHaptic();
                    onSelectSurah(surah);
                    onClose();
                  }}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition ${
                    isSelected
                      ? 'bg-emerald-950/60 text-white'
                      : 'hover:bg-slate-800/50 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {surah.number}
                    </span>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-medium flex items-center gap-1.5 truncate">
                        <span>{surah.englishName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({surah.englishNameTranslation})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {surah.numberOfAyahs} Ayahs • {surah.revelationType}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span 
                      style={{ fontFamily: "'Amiri', serif" }}
                      className="text-base text-emerald-400 font-bold"
                    >
                      {surah.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
