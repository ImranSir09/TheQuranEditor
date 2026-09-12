import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 1800,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    onComplete?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          onClick={handleDismiss}
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 1.5rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#02a2de] via-[#0090c5] to-[#006d96] text-white select-none cursor-pointer overflow-hidden p-6"
        >
          {/* Subtle background geometric halo */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            <div className="w-[500px] h-[500px] rounded-full border border-white" />
            <div className="w-[700px] h-[700px] rounded-full border border-white" />
          </div>

          {/* Top Quote curve banner */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-sm text-center pt-2"
          >
            <p className="text-xs sm:text-sm font-serif italic text-white/95 tracking-wide px-2 drop-shadow-sm">
              “Discover the wisdom of the Prophet ﷺ every day with Hadith of the Moment.”
            </p>
          </motion.div>

          {/* Center Brand Emblem & Typography */}
          <motion.div 
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
            className="flex flex-col items-center my-auto"
          >
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <img 
                src="/branding-logo.svg" 
                alt="Hadith of the Moment" 
                className="w-full h-full object-contain drop-shadow-2xl rounded-2xl"
              />
            </div>
          </motion.div>

          {/* Bottom Loading / App Title */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col items-center gap-2 pb-2"
          >
            <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-white/90">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>Quran &amp; Hadith Studio</span>
            </div>
            {/* Animated progress line */}
            <div className="w-36 h-1 bg-black/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: durationMs / 1000, ease: 'linear' }}
                className="h-full bg-white rounded-full shadow-xs"
              />
            </div>
            <span className="text-[10px] text-white/70 tracking-wider">Tap anywhere to enter</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
