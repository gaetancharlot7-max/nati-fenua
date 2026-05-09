// Sound Manager for Nati Fenua
// Gère les sons de notification et la musique d'ambiance

class SoundManager {
  constructor() {
    this.notificationSound = null;
    this.ambientMusic = null;
    this.isAmbientPlaying = false;
    this.ambientVolume = 0.3;
    this.notificationVolume = 0.5;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Create notification sound (ukulele/polynesian style tone)
    this.notificationSound = new Audio();
    this.notificationSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////////////////////////////////////////////////////////////';
    this.notificationSound.volume = this.notificationVolume;
    
    // Ambient music will be loaded from external source or created
    this.ambientMusic = new Audio();
    this.ambientMusic.loop = true;
    this.ambientMusic.volume = this.ambientVolume;
    
    this.initialized = true;
  }

  // Play notification sound - Single soft ukulele pluck note (E5)
  // A short, gentle, single nylon-string "tip" — discrete and pleasant.
  playNotification() {
    if (!this.initialized) this.init();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Resume context (required by browser autoplay policies)
      if (ctx.state === 'suspended') ctx.resume();

      // Master gain for the single note
      const master = ctx.createGain();
      master.gain.value = this.notificationVolume * 0.85;
      // Gentle highpass to remove muddiness like a real ukulele
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 200;
      // Soft lowpass to remove harshness — very ukulele-like warm tone
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 5500;
      master.connect(hp);
      hp.connect(lp);
      lp.connect(ctx.destination);

      // Single plucked-string note
      const freq = 783.99;          // G5 — bright, joyful, polynesian feel
      const t0 = ctx.currentTime;
      const envDuration = 1.0;       // total ring time (~1s, short and discrete)

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, t0);
      voiceGain.gain.exponentialRampToValueAtTime(0.55, t0 + 0.006); // very fast attack ~6ms (pluck)
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t0 + envDuration);
      voiceGain.connect(master);

      // Harmonic stack (relative amplitudes mimic ukulele nylon string)
      const harmonics = [
        { mult: 1, gain: 1.0, type: 'triangle' },
        { mult: 2, gain: 0.45, type: 'sine' },
        { mult: 3, gain: 0.18, type: 'sine' },
        { mult: 4, gain: 0.06, type: 'sine' },
      ];
      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        osc.type = h.type;
        osc.frequency.setValueAtTime(freq * h.mult, t0);
        // tiny pitch-bend at the start simulates a fingernail pluck
        osc.frequency.exponentialRampToValueAtTime(freq * h.mult * 1.0015, t0 + 0.02);

        const partialGain = ctx.createGain();
        partialGain.gain.value = h.gain;
        osc.connect(partialGain);
        partialGain.connect(voiceGain);

        osc.start(t0);
        osc.stop(t0 + envDuration + 0.05);
      });

      // Auto-close context after the note finishes to free resources
      setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, (envDuration + 0.2) * 1000);
    } catch {
      // silent fallback - audio not critical
    }
  }

  // Play ambient tahitian music
  playAmbient(musicUrl) {
    if (!this.initialized) this.init();
    
    if (musicUrl) {
      this.ambientMusic.src = musicUrl;
    }
    
    this.ambientMusic.play().then(() => {
      this.isAmbientPlaying = true;
    }).catch(e => {
      console.log('Ambient music autoplay blocked - user interaction required');
    });
  }

  // Stop ambient music
  stopAmbient() {
    if (this.ambientMusic) {
      this.ambientMusic.pause();
      this.ambientMusic.currentTime = 0;
      this.isAmbientPlaying = false;
    }
  }

  // Toggle ambient music
  toggleAmbient(musicUrl) {
    if (this.isAmbientPlaying) {
      this.stopAmbient();
    } else {
      this.playAmbient(musicUrl);
    }
    return this.isAmbientPlaying;
  }

  // Set ambient volume (0-1)
  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientMusic) {
      this.ambientMusic.volume = this.ambientVolume;
    }
  }

  // Set notification volume (0-1)
  setNotificationVolume(volume) {
    this.notificationVolume = Math.max(0, Math.min(1, volume));
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
export default soundManager;
