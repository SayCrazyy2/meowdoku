// Web Audio API sound generator and synthesizer
// Respects sound and music user settings

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('meowdoku_sound') !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meowdoku_sound', enabled ? 'true' : 'false');
}

export function isMusicEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('meowdoku_music') !== 'false';
}

export function setMusicEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meowdoku_music', enabled ? 'true' : 'false');
  if (!enabled) {
    stopBGM();
  } else {
    startBGM();
  }
}

export function getMusicVolume(): number {
  if (typeof window === 'undefined') return 0.5;
  const val = localStorage.getItem('meowdoku_music_volume');
  if (val !== null) {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      return num;
    }
  }
  return 0.5;
}

export function setMusicVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, volume));
  localStorage.setItem('meowdoku_music_volume', clamped.toString());
  sounds.setBGMVolume(clamped);
}

export function isVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('meowdoku_voice') !== 'false';
}

export function setVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('meowdoku_voice', enabled ? 'true' : 'false');
}

class SoundFX {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private isBgmPlaying = false;
  private hasInteractionListener = false;
  private hasVisibilityListener = false;
  private btnClickAudio: HTMLAudioElement | null = null;
  private btnClickBuffer: AudioBuffer | null = null;
  private isBtnClickLoading = false;
  private catRevealAudio: HTMLAudioElement | null = null;
  private catRevealBuffer: AudioBuffer | null = null;
  private isCatRevealLoading = false;
  private gameLoadAudio: HTMLAudioElement | null = null;
  private gameLoadBuffer: AudioBuffer | null = null;
  private isGameLoadLoading = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBGM();
      this.preloadBtnClick();
      this.preloadCatReveal();
      this.preloadGameLoad();
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private preloadBtnClick() {
    if (typeof window === 'undefined') return;
    if (!this.btnClickAudio) {
      this.btnClickAudio = new Audio('/audios/btn-click.mp3');
      this.btnClickAudio.preload = 'auto';
      this.btnClickAudio.volume = 0.6;
    }

    if (!this.btnClickBuffer && !this.isBtnClickLoading) {
      this.isBtnClickLoading = true;
      fetch('/audios/btn-click.mp3')
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
          this.initCtx();
          if (this.ctx) {
            return this.ctx.decodeAudioData(arrayBuffer);
          }
          return null;
        })
        .then(decoded => {
          if (decoded) {
            this.btnClickBuffer = decoded;
          }
        })
        .catch(() => {})
        .finally(() => {
          this.isBtnClickLoading = false;
        });
    }
  }

  private preloadCatReveal() {
    if (typeof window === 'undefined') return;
    if (!this.catRevealAudio) {
      this.catRevealAudio = new Audio('/audios/cat-reveal.wav');
      this.catRevealAudio.preload = 'auto';
      this.catRevealAudio.volume = 0.85;
    }

    if (!this.catRevealBuffer && !this.isCatRevealLoading) {
      this.isCatRevealLoading = true;
      fetch('/audios/cat-reveal.wav')
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
          this.initCtx();
          if (this.ctx) {
            return this.ctx.decodeAudioData(arrayBuffer);
          }
          return null;
        })
        .then(decoded => {
          if (decoded) {
            this.catRevealBuffer = decoded;
          }
        })
        .catch(() => {})
        .finally(() => {
          this.isCatRevealLoading = false;
        });
    }
  }

  private preloadGameLoad() {
    if (typeof window === 'undefined') return;
    if (!this.gameLoadAudio) {
      this.gameLoadAudio = new Audio('/audios/game-load.mp3');
      this.gameLoadAudio.preload = 'auto';
      this.gameLoadAudio.volume = 0.85;
    }

    if (!this.gameLoadBuffer && !this.isGameLoadLoading) {
      this.isGameLoadLoading = true;
      fetch('/audios/game-load.mp3')
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
          this.initCtx();
          if (this.ctx) {
            return this.ctx.decodeAudioData(arrayBuffer);
          }
          return null;
        })
        .then(decoded => {
          if (decoded) {
            this.gameLoadBuffer = decoded;
          }
        })
        .catch(() => {})
        .finally(() => {
          this.isGameLoadLoading = false;
        });
    }
  }

  // Game load sound using /audios/game-load.mp3
  playGameLoad() {
    this.ensureBGMPlaying();
    if (!isSoundEnabled() || typeof window === 'undefined') return;
    this.initCtx();

    // 1. High performance Web Audio API buffer (instant, zero-lag)
    if (this.ctx && this.gameLoadBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.gameLoadBuffer;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.85, this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch {}
    }

    // 2. HTMLAudioElement playback / clone fallback
    try {
      if (!this.gameLoadAudio) {
        this.gameLoadAudio = new Audio('/audios/game-load.mp3');
        this.gameLoadAudio.volume = 0.85;
      }
      const audioClone = this.gameLoadAudio.cloneNode(true) as HTMLAudioElement;
      audioClone.volume = 0.85;
      audioClone.play().catch(() => {});
    } catch {}

    if (!this.gameLoadBuffer && !this.isGameLoadLoading) {
      this.preloadGameLoad();
    }
  }

  // Button click sound using /audios/btn-click.mp3
  playTap() {
    this.ensureBGMPlaying();
    if (!isSoundEnabled() || typeof window === 'undefined') return;
    this.initCtx();

    // 1. High performance Web Audio API buffer (instant, overlapping, zero-lag)
    if (this.ctx && this.btnClickBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.btnClickBuffer;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.6, this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch {}
    }

    // 2. HTMLAudioElement playback / clone
    try {
      if (!this.btnClickAudio) {
        this.btnClickAudio = new Audio('/audios/btn-click.mp3');
        this.btnClickAudio.volume = 0.6;
      }
      const audioClone = this.btnClickAudio.cloneNode(true) as HTMLAudioElement;
      audioClone.volume = 0.6;
      audioClone.play().catch(() => {});
    } catch {}

    // Load buffer for subsequent clicks
    if (!this.btnClickBuffer && !this.isBtnClickLoading) {
      this.preloadBtnClick();
    }
  }

  // Cross sound (wooden tap)
  playCross() {
    this.ensureBGMPlaying();
    if (!isSoundEnabled()) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Uncross / erase sound
  playUncross() {
    this.ensureBGMPlaying();
    if (!isSoundEnabled()) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Cat reveal sound using /audios/cat-reveal.wav
  playCatMeow() {
    this.ensureBGMPlaying();
    if (!isSoundEnabled() || !isVoiceEnabled() || typeof window === 'undefined') return;
    this.initCtx();

    // 1. High performance Web Audio API buffer (instant, zero-latency)
    if (this.ctx && this.catRevealBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.catRevealBuffer;
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.85, this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch {}
    }

    // 2. HTMLAudioElement playback / clone fallback
    try {
      if (!this.catRevealAudio) {
        this.catRevealAudio = new Audio('/audios/cat-reveal.wav');
        this.catRevealAudio.volume = 0.85;
      }
      const audioClone = this.catRevealAudio.cloneNode(true) as HTMLAudioElement;
      audioClone.volume = 0.85;
      audioClone.play().catch(() => {});
      return;
    } catch {}

    // 3. Synthesizer fallback if file not yet loaded
    if (this.ctx) {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.linearRampToValueAtTime(940, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  // Heartbreak / Wrong move error sound
  playHeartBreak() {
    if (!isSoundEnabled()) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Lower descending dissonant tone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.28);

    osc2.frequency.setValueAtTime(245, now);
    osc2.frequency.exponentialRampToValueAtTime(110, now + 0.28);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  // Level Win fanfare
  playWin() {
    if (!isSoundEnabled()) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + i * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    });
  }

  // Level Fail sound
  playFail() {
    if (!isSoundEnabled()) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 415.3, 392, 349.23]; // Descending
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + i * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  // Fish collected chime
  playFishCollect() {
    if (!isSoundEnabled()) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  private initBGM() {
    if (typeof window === 'undefined') return;
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/audios/background.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = getMusicVolume();
      this.bgmAudio.preload = 'auto';
      try {
        (this.bgmAudio as any).playsInline = true;
      } catch {}

      this.bgmAudio.addEventListener('play', () => {
        this.isBgmPlaying = true;
      });
      this.bgmAudio.addEventListener('pause', () => {
        if (this.bgmAudio?.paused) {
          this.isBgmPlaying = false;
        }
      });
    }

    if (!this.hasVisibilityListener && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.bgmAudio && !this.bgmAudio.paused) {
            this.bgmAudio.pause();
          }
        } else {
          if (this.bgmAudio && isMusicEnabled()) {
            this.startBGM();
          }
        }
      });
      this.hasVisibilityListener = true;
    }
  }

  private attachUnlockListener() {
    if (typeof window === 'undefined' || this.hasInteractionListener) return;
    this.hasInteractionListener = true;

    // Use touch completion and click events that browsers accept as valid user activations
    const events: (keyof WindowEventMap)[] = ['click', 'touchend', 'pointerup', 'keydown'];

    const tryUnlock = () => {
      if (!isMusicEnabled()) {
        cleanup();
        return;
      }

      this.initBGM();
      if (!this.bgmAudio) return;

      this.bgmAudio.volume = getMusicVolume();
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isBgmPlaying = true;
            cleanup();
          })
          .catch(() => {
            // Keep listener attached if rejected so subsequent taps can unlock
          });
      }
    };

    const cleanup = () => {
      events.forEach((ev) => {
        window.removeEventListener(ev, tryUnlock, true);
        document.removeEventListener(ev, tryUnlock, true);
      });
      this.hasInteractionListener = false;
    };

    events.forEach((ev) => {
      window.addEventListener(ev, tryUnlock, { capture: true, passive: true });
      document.addEventListener(ev, tryUnlock, { capture: true, passive: true });
    });
  }

  private ensureBGMPlaying() {
    if (isMusicEnabled() && (!this.isBgmPlaying || (this.bgmAudio && this.bgmAudio.paused))) {
      this.startBGM();
    }
  }

  // Background music using /audios/background.mp3 in loop
  startBGM() {
    if (!isMusicEnabled() || typeof window === 'undefined') return;
    this.initBGM();
    if (!this.bgmAudio) return;

    if (this.isBgmPlaying && !this.bgmAudio.paused) return;

    this.bgmAudio.volume = getMusicVolume();
    const playPromise = this.bgmAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isBgmPlaying = true;
        })
        .catch(() => {
          // Autoplay blocked by browser policy until user gesture: attach persistent unlock listener
          this.attachUnlockListener();
        });
    }
  }

  setBGMVolume(volume: number) {
    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
    this.isBgmPlaying = false;
  }
}

export const sounds = new SoundFX();
export const playTap = () => sounds.playTap();
export const playCross = () => sounds.playCross();
export const playUncross = () => sounds.playUncross();
export const playCatMeow = () => sounds.playCatMeow();
export const playCatReveal = () => sounds.playCatMeow();
export const playHeartBreak = () => sounds.playHeartBreak();
export const playWin = () => sounds.playWin();
export const playFail = () => sounds.playFail();
export const playFishCollect = () => sounds.playFishCollect();
export const playGameLoad = () => sounds.playGameLoad();
export const startBGM = () => sounds.startBGM();
export const stopBGM = () => sounds.stopBGM();
