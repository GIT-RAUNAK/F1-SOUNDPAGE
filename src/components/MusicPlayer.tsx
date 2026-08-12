"use client";

import React, { useEffect } from "react";
import { useTrack } from "@/context/TrackContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";

export function MusicPlayer() {
  const { 
    currentDriver, 
    currentMusic,
    isPlaying, 
    togglePlay, 
    volume, 
    setVolume, 
    progress,
    nextTrack,
    prevTrack
  } = useTrack();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === 'ArrowRight') nextTrack();
      if (e.code === 'ArrowLeft') prevTrack();
      if (e.code === 'KeyM') setVolume(volume === 0 ? 0.5 : 0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, volume, setVolume]);

  if (!currentDriver || !currentMusic) return null;

  // Use the parsed track name from ID3 tags or filename fallback
  const trackName = currentMusic.name;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50"
    >
      <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-4">
        
        {/* Track Info */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[0.65rem] tracking-[0.2em] text-neutral-400 mb-1">NOW PLAYING</span>
            <AnimatePresence mode="wait">
              <motion.h3 
                key={trackName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg md:text-xl font-bold tracking-widest uppercase truncate"
              >
                {trackName}
              </motion.h3>
            </AnimatePresence>
            <span className="text-xs tracking-widest text-neutral-500 mt-1 uppercase">
              {currentDriver.full_name}
            </span>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer">
              <div 
                className="h-full transition-all duration-300"
                style={{ width: `${volume * 100}%`, backgroundColor: currentDriver.accent }}
              />
            </div>
          </div>
        </div>

        {/* Controls & Progress */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button onClick={prevTrack} className="text-neutral-400 hover:text-white transition-colors">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} className="fill-black" /> : <Play size={20} className="fill-black ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-neutral-400 hover:text-white transition-colors">
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 bottom-0"
              style={{ width: `${progress}%`, backgroundColor: currentDriver.accent }}
              layout
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
}
