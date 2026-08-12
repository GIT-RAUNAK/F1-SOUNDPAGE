"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { DriverInfo } from "@/components/DriverInfo";
import { MusicPlayer } from "@/components/MusicPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { useTrack } from "@/context/TrackContext";

function InitialLoader({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(t);
  }, []); // Empty dependency array prevents re-triggering

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-[#050505]"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-t-2 border-white rounded-full animate-spin"
        />
        <div className="text-xs font-bold tracking-[0.4em] uppercase text-neutral-400">
          INITIALIZING TELEMETRY
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { currentDriver, currentImageUrl, isTransitioning, loading: dataLoading } = useTrack();
  const [appReady, setAppReady] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050505] text-white selection:bg-white selection:text-black">
      <AnimatePresence>
        {(!appReady || dataLoading) && (
          <InitialLoader key="loader" onComplete={() => setAppReady(true)} />
        )}
      </AnimatePresence>

      {(appReady && !dataLoading) && currentDriver && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="w-full h-full relative"
        >
          {/* Driver Portrait Background (Shuffled) */}
          <div className="absolute inset-0 w-full h-full -z-20 overflow-hidden flex items-center justify-center bg-[#050505]">
            <AnimatePresence>
              {currentImageUrl && (
                <motion.img 
                  key={currentImageUrl}
                  src={encodeURI(currentImageUrl)}
                  alt={currentDriver.full_name}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 object-cover w-full h-full"
                />
              )}
            </AnimatePresence>
            
            {/* Color Overlay */}
            <div 
              className="absolute inset-0 opacity-30 transition-colors duration-[2000ms] pointer-events-none"
              style={{ backgroundColor: currentDriver.accent }}
            />
          </div>

          {/* F1 Car Model Removed as requested */}

          <Navbar />
          <DriverInfo />
          <MusicPlayer />
          
          {/* Subtle vignette for cinematic feel */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10" />
        </motion.div>
      )}
    </main>
  );
}
