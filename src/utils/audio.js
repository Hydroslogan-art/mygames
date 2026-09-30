// Web Audio API Synthesizer for Frontline Sandbox
// High-performance procedural sound effects with audio throttling to prevent loops and lag

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterVolume = 0.35;
    this.lastSoundTime = {};
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  canPlay(soundName, minIntervalMs = 35) {
    if (this.muted) return false;
    const now = performance.now();
    const last = this.lastSoundTime[soundName] || 0;
    if (now - last < minIntervalMs) {
      return false; // Throttled to prevent audio node flood
    }
    this.lastSoundTime[soundName] = now;
    return true;
  }

  // Tactical Rifle Shot
  playRifle() {
    if (!this.canPlay('rifle', 30)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch (e) {
      // Audio safety
    }
  }

  // Heavy Machine Gun burst
  playHMG() {
    if (!this.canPlay('hmg', 40)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  // Sniper Rifle
  playSniper() {
    if (!this.canPlay('sniper', 60)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);

      gain.gain.setValueAtTime(0.35 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {}
  }

  // Rocket Launch
  playRocketLaunch() {
    if (!this.canPlay('rocket', 80)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.linearRampToValueAtTime(650, t + 0.25);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  }

  // Tank Cannon
  playTankCannon() {
    if (!this.canPlay('tank', 100)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

      gain.gain.setValueAtTime(0.45 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  // Explosion
  playExplosion() {
    if (!this.canPlay('explosion', 70)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);
      filter.frequency.exponentialRampToValueAtTime(35, t + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
    } catch (e) {}
  }

  // Tactical Airstrike Siren
  playAirstrike() {
    if (!this.canPlay('airstrike', 500)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(700, t + 0.4);
      osc.frequency.linearRampToValueAtTime(400, t + 0.8);

      gain.gain.setValueAtTime(0.18 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.0);
    } catch (e) {}
  }

  // Orbital Laser Beam
  playOrbitalBeam() {
    if (!this.canPlay('orbital', 500)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.5);

      gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  // Base Under Attack Alarm
  playNexusAlarm() {
    if (!this.canPlay('alarm', 250)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.setValueAtTime(880, t + 0.1);

      gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  // UI Deploy Beep
  playDeploy() {
    if (!this.canPlay('deploy', 60)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.setValueAtTime(820, t + 0.05);

      gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  // Cash / Betting Win Jingle
  playWinPayout() {
    if (!this.canPlay('win', 200)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + i * 0.08);

        gain.gain.setValueAtTime(0.18 * this.masterVolume, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.2);
      });
    } catch (e) {}
  }

  // Heal / Buff Shimmer
  playHeal() {
    if (!this.canPlay('heal', 100)) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(1000, t + 0.2);

      gain.gain.setValueAtTime(0.18 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }
}

export const sounds = new SoundEngine();
