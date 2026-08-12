"use client";

import React from "react";
import { useTrack } from "@/context/TrackContext";
import { motion, AnimatePresence } from "framer-motion";

export function DriverInfo() {
  const { currentDriver, isTransitioning, loading } = useTrack();

  const titleVariants = {
    initial: { opacity: 0, y: 40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -40, scale: 1.05 }
  };

  if (loading || !currentDriver) return null;

  // Split name for stylish rendering
  const nameParts = currentDriver.full_name.split(' ');

  return (
    <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        {!isTransitioning && (
          <motion.div
            key={currentDriver.id}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: { opacity: 0 },
              animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
              exit: { opacity: 0, transition: { staggerChildren: 0.05 } }
            }}
            className="flex flex-col gap-1 max-w-lg"
          >
            {/* Jersey Number Background */}
            <motion.div variants={titleVariants} className="text-8xl md:text-[14rem] font-bold leading-none tracking-tighter opacity-20 text-stroke absolute -top-16 -left-4 md:-top-32 md:-left-8 pointer-events-none z-[-1]">
              {currentDriver.driver_number > 0 ? currentDriver.driver_number : ""}
            </motion.div>

            <motion.h2 
              variants={titleVariants}
              className="text-5xl md:text-8xl font-black uppercase tracking-tight leading-[0.85] mt-8"
            >
              {nameParts.map((part: string, i: number) => (
                <span key={i} className="block">{part}</span>
              ))}
            </motion.h2>

            <motion.div 
              variants={titleVariants}
              className="flex items-center gap-4 mt-6 mb-6"
            >
              <div 
                className="w-8 h-[2px]" 
                style={{ backgroundColor: currentDriver.accent }} 
              />
              <span className="text-sm font-bold tracking-[0.2em] uppercase">
                {currentDriver.accent === "#DC0000" ? "SCUDERIA FERRARI" : 
                 currentDriver.accent === "#00D2BE" ? "MERCEDES-AMG" : 
                 currentDriver.accent === "#FF8000" ? "MCLAREN RACING" : 
                 currentDriver.accent === "#0600EF" ? "RED BULL RACING" : "FORMULA 1"}
              </span>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
