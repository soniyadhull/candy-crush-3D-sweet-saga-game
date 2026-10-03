// Audio Service: Candy Crush Saga Official Soundtrack (OST) + Arcade SFX

class AudioService {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private currentTrackIndex = 0;
  private musicTimer: number | null = null;
  private step = 0;
  private bgmVol = 0.5;
  private sfxVol = 0.6;
  private ostAudio: HTMLAudioElement | null = null;
  private hasInteracted = false;

  public trackNames = [
    '🍬 Candy Crush Saga Official OST (Full Loop)',
    '🍭 Sugar Pop Paradise',
    '✨ Anime Arcade Quest',
    '🧸 Gummy Bear Waltz',
    '🌈 Neon Candy Groove'
  ];

  constructor() {
    this.initOstAudio();
    this.setupUserGestureUnlock();
  }

  private initOstAudio() {
    if (typeof window === 'undefined') return;

    try {
      // Primary OST source
      const ostUrl = encodeURI('/vidssave.com Candy Crush Saga - Full Soundtrack (OST) 48KBPS.mp3');
      this.ostAudio = new Audio(ostUrl);
      this.ostAudio.loop = true;
      this.ostAudio.preload = 'auto';
      this.ostAudio.volume = this.bgmVol;

      // Fallback url if primary fails
      this.ostAudio.addEventListener('error', () => {
        if (this.ostAudio && this.ostAudio.src !== window.location.origin + '/candy_crush_ost.mp3') {
          this.ostAudio.src = '/candy_crush_ost.mp3';
          this.ostAudio.load();
          if (this.isMusicPlaying && this.currentTrackIndex === 0) {
            this.ostAudio.play().catch(() => {});
          }
        }
      });

      // Explicit loop safeguard for continuous seamless replay
      this.ostAudio.addEventListener('ended', () => {
        if (this.ostAudio && this.isMusicPlaying && this.currentTrackIndex === 0) {
          this.ostAudio.currentTime = 0;
          this.ostAudio.play().catch(err => console.warn('OST loop replay:', err));
        }
      });
    } catch (e) {
      console.warn('Could not initialize OST audio element:', e);
    }
  }

  // Modern browsers block autoplay until a user gesture occurs
  private setupUserGestureUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.hasInteracted = true;
      this.initContext();

      if (this.isMusicPlaying) {
        this.playCurrentTrack();
      }

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMusicVolume(vol: number) {
    this.bgmVol = Math.max(0, Math.min(1, vol));

    if (this.ostAudio) {
      this.ostAudio.volume = this.bgmVol;
    }

    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.bgmVol, this.ctx.currentTime);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVol = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  public setTrack(index: number) {
    this.currentTrackIndex = (index + this.trackNames.length) % this.trackNames.length;
    this.step = 0;

    if (this.isMusicPlaying) {
      this.playCurrentTrack();
    }
  }

  public nextTrack(): number {
    this.setTrack(this.currentTrackIndex + 1);
    return this.currentTrackIndex;
  }

  public getTrackIndex(): number {
    return this.currentTrackIndex;
  }

  public startMusic() {
    this.isMusicPlaying = true;
    this.initContext();
    this.playCurrentTrack();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.ostAudio) {
      this.ostAudio.pause();
    }
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playCurrentTrack() {
    if (!this.isMusicPlaying) return;

    if (this.currentTrackIndex === 0) {
      // STOP procedural synth
      if (this.musicTimer !== null) {
        window.clearTimeout(this.musicTimer);
        this.musicTimer = null;
      }

      // PLAY the official Candy Crush Soundtrack in loop
      if (this.ostAudio) {
        this.ostAudio.volume = this.bgmVol;
        const playPromise = this.ostAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay was blocked; will unlock on first user click/touch
          });
        }
      }
    } else {
      // Pause OST
      if (this.ostAudio) {
        this.ostAudio.pause();
      }

      // Start procedural synth track
      this.step = 0;
      if (this.musicTimer !== null) {
        window.clearTimeout(this.musicTimer);
        this.musicTimer = null;
      }
      this.scheduleNextBeat();
    }
  }

  private scheduleNextBeat = () => {
    if (!this.isMusicPlaying || this.currentTrackIndex === 0 || !this.ctx || !this.musicGain) return;

    // Track notes & rhythms (Tracks 1, 2, 3, 4)
    const synthIndex = this.currentTrackIndex - 1;
    const bpm = synthIndex === 1 ? 138 : synthIndex === 2 ? 105 : 124;
    const intervalMs = (60 / bpm / 2) * 1000;

    const melodyTrack0 = [
      523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 880.00, 1046.50,
      587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 523.25, 0
    ];
    const bassTrack0 = [261.63, 0, 261.63, 0, 329.63, 0, 392.00, 0, 220.00, 0, 261.63, 0, 196.00, 0, 261.63, 0];

    const melodyTrack1 = [
      698.46, 783.99, 880.00, 1046.50, 880.00, 783.99, 698.46, 880.00,
      659.25, 783.99, 880.00, 987.77, 880.00, 783.99, 659.25, 0
    ];
    const bassTrack1 = [174.61, 174.61, 220.00, 174.61, 261.63, 174.61, 220.00, 174.61];

    const melodyTrack2 = [
      523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 0, 698.46, 880.00, 0, 698.46
    ];
    const bassTrack2 = [261.63, 392.00, 392.00, 293.66, 440.00, 440.00];

    const melodyTrack3 = [
      440.00, 523.25, 0, 587.33, 659.25, 0, 587.33, 523.25,
      659.25, 783.99, 880.00, 0, 783.99, 659.25, 587.33, 523.25
    ];
    const bassTrack3 = [110.00, 0, 110.00, 130.81, 146.83, 0, 164.81, 146.83];

    let noteFreq = 0;
    let bassFreq = 0;

    if (synthIndex === 0) {
      noteFreq = melodyTrack0[this.step % melodyTrack0.length];
      bassFreq = bassTrack0[this.step % bassTrack0.length];
    } else if (synthIndex === 1) {
      noteFreq = melodyTrack1[this.step % melodyTrack1.length];
      bassFreq = bassTrack1[this.step % bassTrack1.length];
    } else if (synthIndex === 2) {
      noteFreq = melodyTrack2[this.step % melodyTrack2.length];
      bassFreq = bassTrack2[this.step % bassTrack2.length];
    } else {
      noteFreq = melodyTrack3[this.step % melodyTrack3.length];
      bassFreq = bassTrack3[this.step % bassTrack3.length];
    }

    const t = this.ctx.currentTime;

    if (noteFreq > 0 && this.bgmVol > 0.01) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = synthIndex === 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(noteFreq, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.25);
    }

    if (bassFreq > 0 && this.bgmVol > 0.01) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassGain.gain.setValueAtTime(0.12, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + 0.28);
    }

    this.step++;
    this.musicTimer = window.setTimeout(this.scheduleNextBeat, intervalMs);
  };

  // Sound FX implementations (Web Audio API)
  public playSelect() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playSwap() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.1);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playMatch(comboLevel = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;

    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const baseIndex = Math.min(comboLevel - 1, pentatonic.length - 2);

    [0, 1].forEach((offset, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const freq = pentatonic[(baseIndex + offset) % pentatonic.length];
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(0.28, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.18);
    });
  }

  public playSpecialCreate() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.2, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.22);
    });
  }

  public playSpecialExplode(type: 'striped' | 'wrapped' | 'color_bomb') {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;

    if (type === 'striped') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.27);
    } else if (type === 'wrapped') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.33);
    } else {
      [0, 1, 2, 3, 4, 5].forEach(i => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + i * 220, t + i * 0.05);

        gain.gain.setValueAtTime(0.25, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.18);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.2);
      });
    }
  }

  public playWinFanfare() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 0, 1046.50, 1318.51];
    fanfareNotes.forEach((freq, i) => {
      if (freq === 0 || !this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);

      gain.gain.setValueAtTime(0.3, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.38);
    });
  }

  public playBooster() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }
}

export const audio = new AudioService();
