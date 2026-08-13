// script.js

// --- State ---
let drivers = [];
let currentDriverIndex = -1;
let currentMusic = null;
let currentImageUrl = null;
let isPlaying = false;
let volume = 0.5;

// The foolproof active background slot tracker (1 or 2)
let activeBgSlot = 1;

// --- DOM Elements ---
const audioPlayer = document.getElementById('audio-player');
const bgSlot1 = document.getElementById('bg-slot-1');
const bgSlot2 = document.getElementById('bg-slot-2');
const colorOverlay = document.getElementById('color-overlay');

const driverNumberEl = document.getElementById('driver-number');
const driverFirstNameEl = document.getElementById('driver-first-name');
const driverLastNameEl = document.getElementById('driver-last-name');
const trackNameEl = document.getElementById('track-name');

const timeCurrentEl = document.getElementById('time-current');
const timeTotalEl = document.getElementById('time-total');
const progressFill = document.getElementById('progress-fill');
const progressSlider = document.getElementById('progress-slider');
const volumeFill = document.getElementById('volume-fill');
const volumeSlider = document.getElementById('volume-slider');

const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnVolume = document.getElementById('btn-volume');

const iconPlay = document.getElementById('icon-play');
const iconVolume = document.getElementById('icon-volume');
const visualizer = document.getElementById('visualizer');

const uiLayer = document.querySelector('.ui-layer');

// --- Helper Functions ---
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Initialization ---
async function init() {
  try {
    const res = await fetch('./data.json');
    const data = await res.json();
    if (data.drivers && data.drivers.length > 0) {
      drivers = data.drivers;
      
      // Initialize Feather Icons
      feather.replace();

      // Start App
      setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        playDriverConfiguration(0);
      }, 2000);
    }
  } catch (err) {
    console.error("Failed to load data.json", err);
    document.getElementById('loader').innerHTML = "<div class='loader-text'>ERROR LOADING DATA</div>";
  }
}

// --- Core Logic ---
let transitionTimeout1, transitionTimeout2;

function playDriverConfiguration(driverIndex) {
  if (drivers.length === 0) return;
  
  clearTimeout(transitionTimeout1);
  clearTimeout(transitionTimeout2);
  
  // Fade out UI
  uiLayer.classList.add('transitioning');
  
  transitionTimeout1 = setTimeout(() => {
    currentDriverIndex = driverIndex;
    const driver = drivers[driverIndex];
    
    // Shuffle independent music and image
    if (driver.musics.length > 0) currentMusic = getRandomItem(driver.musics);
    if (driver.images.length > 0) currentImageUrl = getRandomItem(driver.images);

    // Update DOM
    updateDOM(driver);
    updateBackgroundFoolproof(currentImageUrl);
    
    // Play Music
    if (currentMusic) {
      audioPlayer.src = encodeURI(currentMusic.url);
      audioPlayer.load();
      if (isPlaying) {
        audioPlayer.play().catch(e => console.error("Playback error:", e));
      }
    }

    // Fade in UI
    transitionTimeout2 = setTimeout(() => {
      uiLayer.classList.remove('transitioning');
    }, 500);
  }, 500);
}

function updateDOM(driver) {
  // Accent color
  document.documentElement.style.setProperty('--theme-accent', driver.accent || '#00D2BE');
  colorOverlay.style.backgroundColor = driver.accent || '#00D2BE';

  // Driver Info
  driverNumberEl.textContent = driver.driver_number || '--';
  const nameParts = driver.full_name.split(' ');
  driverFirstNameEl.textContent = nameParts[0];
  driverLastNameEl.textContent = nameParts.slice(1).join(' ');

  // Track Info
  trackNameEl.textContent = currentMusic ? currentMusic.name : 'Unknown Track';
}

function updateBackgroundFoolproof(imageUrl) {
  if (!imageUrl) return;

  const nextSlot = activeBgSlot === 1 ? 2 : 1;
  const currentImgNode = activeBgSlot === 1 ? bgSlot1 : bgSlot2;
  const nextImgNode = activeBgSlot === 1 ? bgSlot2 : bgSlot1;

  // Wait for the new image to fully download before crossfading!
  nextImgNode.onload = () => {
    // Crossfade only AFTER the new image is ready
    nextImgNode.classList.add('active');
    currentImgNode.classList.remove('active');
    
    // Update tracker
    activeBgSlot = nextSlot;
  };

  // Start downloading the new image
  nextImgNode.src = encodeURI(imageUrl);
}

// --- Player Controls ---
function togglePlay() {
  if (isPlaying) {
    audioPlayer.pause();
  } else {
    audioPlayer.play().catch(e => console.error(e));
  }
}

function nextTrack() {
  if (drivers.length === 0) return;
  const nextIndex = (currentDriverIndex + 1) % drivers.length;
  playDriverConfiguration(nextIndex);
}

function prevTrack() {
  if (drivers.length === 0) return;
  const prevIndex = (currentDriverIndex - 1 + drivers.length) % drivers.length;
  playDriverConfiguration(prevIndex);
}

// --- Event Listeners ---
btnPlay.addEventListener('click', togglePlay);
btnNext.addEventListener('click', nextTrack);
btnPrev.addEventListener('click', prevTrack);

// Audio Events
audioPlayer.addEventListener('play', () => {
  isPlaying = true;
  iconPlay.setAttribute('data-feather', 'pause');
  feather.replace();
  visualizer.classList.add('active');
});

audioPlayer.addEventListener('pause', () => {
  isPlaying = false;
  iconPlay.setAttribute('data-feather', 'play');
  feather.replace();
  visualizer.classList.remove('active');
});

audioPlayer.addEventListener('ended', () => {
  // Auto advance
  setTimeout(nextTrack, 1000);
});

audioPlayer.addEventListener('timeupdate', () => {
  if (isNaN(audioPlayer.duration)) return;
  const curr = audioPlayer.currentTime;
  const tot = audioPlayer.duration;
  
  timeCurrentEl.textContent = formatTime(curr);
  timeTotalEl.textContent = formatTime(tot);
  
  const percentage = (curr / tot) * 100;
  progressFill.style.width = `${percentage}%`;
  
  // Only update slider value if user is not actively dragging it
  if (!progressSlider.matches(':active')) {
    progressSlider.value = percentage;
  }
});

audioPlayer.addEventListener('loadedmetadata', () => {
  timeTotalEl.textContent = formatTime(audioPlayer.duration);
});

// Progress Slider
progressSlider.addEventListener('input', (e) => {
  const percentage = e.target.value;
  progressFill.style.width = `${percentage}%`;
});

progressSlider.addEventListener('change', (e) => {
  if (isNaN(audioPlayer.duration)) return;
  const percentage = e.target.value;
  audioPlayer.currentTime = (percentage / 100) * audioPlayer.duration;
});

// Volume
volumeSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  volumeFill.style.width = `${val * 100}%`;
  audioPlayer.volume = val;
  
  if (val == 0) {
    iconVolume.setAttribute('data-feather', 'volume-x');
  } else if (val < 0.5) {
    iconVolume.setAttribute('data-feather', 'volume-1');
  } else {
    iconVolume.setAttribute('data-feather', 'volume-2');
  }
  feather.replace();
});

// Boot
init();
