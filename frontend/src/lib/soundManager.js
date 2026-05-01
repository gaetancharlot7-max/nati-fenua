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

  // Play notification sound - Authentic ukulele pluck using Web Audio API
  // Uses additive synthesis with harmonics + plucked-string envelope for a
  // realistic ukulele-like "ting" on 3 notes (C-E-G arpeggio).
  playNotification() {
    if (!this.initialized) this.init();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Resume context (required by browser autoplay policies)
      if (ctx.state === 'suspended') ctx.resume();

      // Master gain for the whole arpeggio
      const master = ctx.createGain();
      master.gain.value = this.notificationVolume;
      // Gentle highpass to remove muddiness like a real ukulele
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 180;
      master.connect(hp);
      hp.connect(ctx.destination);

      // Plucked-string tones: fundamental + 3 harmonics, short attack, long exponential decay
      const pluck = (freq, startOffset) => {
        const t0 = ctx.currentTime + startOffset;
        const envDuration = 1.4; // total ring time
        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(0.0001, t0);
        voiceGain.gain.exponentialRampToValueAtTime(0.6, t0 + 0.008); // fast attack ~8ms
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, t0 + envDuration);
        voiceGain.connect(master);

        // Harmonic stack (relative amplitudes mimic ukulele nylon string)
        const harmonics = [
          { mult: 1, gain: 1.0, type: 'triangle' },
          { mult: 2, gain: 0.5, type: 'sine' },
          { mult: 3, gain: 0.22, type: 'sine' },
          { mult: 4, gain: 0.08, type: 'sine' },
        ];
        harmonics.forEach(h => {
          const osc = ctx.createOscillator();
          osc.type = h.type;
          osc.frequency.setValueAtTime(freq * h.mult, t0);
          // tiny pitch-bend at the start simulates a finger-nail pluck
          osc.frequency.exponentialRampToValueAtTime(freq * h.mult * 1.002, t0 + 0.02);

          const partialGain = ctx.createGain();
          partialGain.gain.value = h.gain;
          osc.connect(partialGain);
          partialGain.connect(voiceGain);

          osc.start(t0);
          osc.stop(t0 + envDuration + 0.1);
        });
      };

      // C5 - E5 - G5 arpeggio, slight timing variance for human feel
      pluck(523.25, 0);      // C5
      pluck(659.25, 0.12);   // E5
      pluck(783.99, 0.24);   // G5
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
