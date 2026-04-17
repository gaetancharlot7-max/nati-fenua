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

  // Play notification sound
  playNotification() {
    if (!this.initialized) this.init();
    
    try {
      // Create a simple polynesian-style notification using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillators for a ukulele-like sound
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      // Polynesian-style melody (C, E, G arpeggio)
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      // Play arpeggio
      notes.forEach((freq, i) => {
        setTimeout(() => {
          osc1.frequency.setValueAtTime(freq, audioContext.currentTime);
          osc2.frequency.setValueAtTime(freq * 2, audioContext.currentTime);
        }, i * 100);
      });
      
      osc1.start(audioContext.currentTime);
      osc2.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.5);
      osc2.stop(audioContext.currentTime + 0.5);
      
    } catch (e) {
      console.log('Audio notification not supported');
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
