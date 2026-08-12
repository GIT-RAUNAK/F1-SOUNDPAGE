"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Howl } from "howler";

export interface TrackData {
  url: string;
  name: string;
}

export interface DriverData {
  id: string;
  full_name: string;
  about: string;
  car_image: string;
  images: string[];
  musics: TrackData[];
  accent: string;
  driver_number: number;
}

interface TrackContextType {
  drivers: DriverData[];
  currentDriver: DriverData | null;
  currentMusic: TrackData | null;
  currentImageUrl: string | null;
  nextTrack: () => void;
  prevTrack: () => void;
  isTransitioning: boolean;
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: (v: number) => void;
  progress: number;
  loading: boolean;
}

const TrackContext = createContext<TrackContextType | undefined>(undefined);

export function TrackProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  
  const [currentDriverIndex, setCurrentDriverIndex] = useState(-1);
  const [currentMusic, setCurrentMusic] = useState<TrackData | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [howl, setHowl] = useState<Howl | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to pick random item
  const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Fetch initial drivers data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/data.json");
        const data = await res.json();
        
        if (data.drivers && data.drivers.length > 0) {
          setDrivers(data.drivers);
          // Initial selection
          const initDriverIndex = 0;
          setCurrentDriverIndex(initDriverIndex);
          const driver = data.drivers[initDriverIndex];
          if (driver.musics.length > 0) setCurrentMusic(getRandomItem(driver.musics));
          if (driver.images.length > 0) setCurrentImageUrl(getRandomItem(driver.images));
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load drivers from API", err);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentDriver = currentDriverIndex >= 0 ? drivers[currentDriverIndex] : null;

  const transitionTimeout1 = React.useRef<NodeJS.Timeout | null>(null);
  const transitionTimeout2 = React.useRef<NodeJS.Timeout | null>(null);

  const playDriverConfiguration = useCallback((driverIndex: number) => {
    if (drivers.length === 0) return;
    
    if (transitionTimeout1.current) clearTimeout(transitionTimeout1.current);
    if (transitionTimeout2.current) clearTimeout(transitionTimeout2.current);
    
    setIsTransitioning(true);
    
    // Allow UI to fade out
    transitionTimeout1.current = setTimeout(() => {
      setCurrentDriverIndex(driverIndex);
      const driver = drivers[driverIndex];
      
      // Shuffle music and image independently!
      if (driver.musics.length > 0) {
        setCurrentMusic(getRandomItem(driver.musics));
      }
      if (driver.images.length > 0) {
        setCurrentImageUrl(getRandomItem(driver.images));
      }

      // Allow UI to fade back in
      transitionTimeout2.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 800);
  }, [drivers]);

  const nextTrack = useCallback(() => {
    if (drivers.length === 0) return;
    // Auto-advance to next driver (shuffling between drivers)
    const nextIndex = (currentDriverIndex + 1) % drivers.length;
    playDriverConfiguration(nextIndex);
  }, [drivers, currentDriverIndex, playDriverConfiguration]);

  const prevTrack = useCallback(() => {
    if (drivers.length === 0) return;
    const prevIndex = (currentDriverIndex - 1 + drivers.length) % drivers.length;
    playDriverConfiguration(prevIndex);
  }, [drivers, currentDriverIndex, playDriverConfiguration]);

  const howlRef = React.useRef<Howl | null>(null);

  // Handle audio playback when currentMusic changes
  useEffect(() => {
    if (!currentMusic) return;

    if (howlRef.current) {
      howlRef.current.unload();
      howlRef.current = null;
    }

    const newHowl = new Howl({
      src: [encodeURI(currentMusic.url)],
      volume: volume,
      html5: true,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => {
        // Safe next track call to avoid infinite loops if audio fails
        setTimeout(() => nextTrack(), 1000);
      },
      onloaderror: () => console.error("Howler failed to load audio:", currentMusic.url),
      onplayerror: () => console.error("Howler failed to play audio:", currentMusic.url)
    });

    howlRef.current = newHowl;
    setHowl(newHowl);
    
    if (isPlaying) {
      newHowl.play();
    }

    return () => {
      if (howlRef.current === newHowl) {
        newHowl.unload();
        howlRef.current = null;
      }
    };
  }, [currentMusic]); // Depend only on music object to prevent re-creation loops

  // Update volume
  useEffect(() => {
    if (howl) {
      howl.volume(volume);
    }
  }, [volume, howl]);

  // Track progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && howl) {
      interval = setInterval(() => {
        const seek = howl.seek();
        const duration = howl.duration();
        if (typeof seek === 'number' && duration) {
          setProgress((seek / duration) * 100);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, howl]);

  const togglePlay = () => {
    if (!howl) return;
    if (isPlaying) {
      howl.pause();
    } else {
      howl.play();
    }
  };

  return (
    <TrackContext.Provider
      value={{
        drivers,
        currentDriver,
        currentMusic,
        currentImageUrl,
        nextTrack,
        prevTrack,
        isTransitioning,
        isPlaying,
        togglePlay,
        volume,
        setVolume,
        progress,
        loading
      }}
    >
      <div 
        style={{ '--theme-accent': currentDriver?.accent || '#00D2BE' } as React.CSSProperties}
        className="w-full h-full"
      >
        {children}
      </div>
    </TrackContext.Provider>
  );
}

export function useTrack() {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error("useTrack must be used within a TrackProvider");
  }
  return context;
}
