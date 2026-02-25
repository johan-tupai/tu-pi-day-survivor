// Game Audio Manager
// - Chiptune music (Megaman X4-inspired via Web Audio API)
// - Instant SFX via Web Audio API oscillators
// - Voice announcements via ElevenLabs TTS (pre-cached)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ─── Voice IDs ───
// 80s announcer style: Brian (deep, dramatic)
const VOICE_80S = 'nPczCjzI2devNBz1zQrb';
// Cute anime girl: Lily (bright, youthful)
const VOICE_ANIME = 'pFZP5JQG7iQjIQuC4Bku';

class GameAudio {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private musicPlaying = false;
  private musicOscs: OscillatorNode[] = [];
  private voiceCache = new Map<string, AudioBuffer>();
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.25;
      this.sfxGain.connect(this.ctx.destination);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = 0.7;
      this.voiceGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch {
      // Audio not available
    }
  }

  // ─── CHIPTUNE MUSIC (Megaman X4-inspired) ───
  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;

    // Megaman X4-style driving chiptune in E minor
    // Pattern: fast arpeggiated square waves with pulse bass
    const bpm = 160;
    const beatDur = 60 / bpm;

    // Melody sequence (E minor pentatonic, heroic feel)
    const melodyNotes = [
      659, 784, 880, 784, 659, 587, 659, 784,
      880, 988, 880, 784, 659, 587, 494, 587,
      659, 784, 880, 988, 1047, 988, 880, 784,
      659, 587, 494, 587, 659, 784, 880, 659,
    ];

    // Bass line
    const bassNotes = [
      165, 165, 196, 196, 220, 220, 196, 196,
      165, 165, 247, 247, 220, 220, 196, 196,
    ];

    // Arp pattern
    const arpNotes = [
      330, 392, 494, 392, 330, 392, 494, 587,
      330, 370, 440, 370, 330, 370, 440, 494,
    ];

    let step = 0;

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;

      // Melody (square wave, high)
      const melodyIdx = step % melodyNotes.length;
      this.playTone(melodyNotes[melodyIdx], 'square', beatDur * 0.8, 0.08, now);

      // Bass (sawtooth, low)
      const bassIdx = Math.floor(step / 2) % bassNotes.length;
      this.playTone(bassNotes[bassIdx], 'sawtooth', beatDur * 1.8, 0.1, now);

      // Arp (pulse/square, mid)
      const arpIdx = step % arpNotes.length;
      this.playTone(arpNotes[arpIdx], 'square', beatDur * 0.3, 0.05, now);

      // Kick drum on beats 0,4,8,12...
      if (step % 4 === 0) {
        this.playNoise(0.06, 80, now);
      }
      // Hi-hat on every other step
      if (step % 2 === 0) {
        this.playNoise(0.02, 8000, now);
      }

      step++;
    }, beatDur * 1000);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number, time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  private playNoise(duration: number, freq: number, time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(1, time + duration);
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // ─── INSTANT SFX (Web Audio) ───
  playShot() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playHeal() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Rising arpeggio
    [400, 500, 600, 800].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.15);
    });
  }

  playDamage() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playEnemyDeath() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playBossSpawn() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Dramatic low rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playScreenClear() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Explosion sweep
    [200, 300, 400, 600, 800].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.15, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.3);
    });
  }

  playTimerExtend() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Clock-like tick ascending
    [880, 1047, 1319].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.1, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.1);
    });
  }

  // ─── VOICE ANNOUNCEMENTS (ElevenLabs TTS, cached) ───

  private async fetchTTS(text: string, voiceId: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const cacheKey = `${voiceId}:${text}`;
    if (this.voiceCache.has(cacheKey)) return this.voiceCache.get(cacheKey)!;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.voiceCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.warn('TTS fetch failed:', e);
      return null;
    }
  }

  private async playVoice(text: string, voiceId: string) {
    if (!this.ctx || !this.voiceGain) return;
    const buffer = await this.fetchTTS(text, voiceId);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.voiceGain);
    source.start();
  }

  // Pre-cache common voice lines on game start
  async preloadVoices() {
    // 80s announcer lines
    await Promise.allSettled([
      this.fetchTTS('Level Up!', VOICE_80S),
      this.fetchTTS('Multi Nut!', VOICE_80S),
      this.fetchTTS('Orbiting Leaf!', VOICE_80S),
      this.fetchTTS('Coffee Bean!', VOICE_80S),
      this.fetchTTS('Pie Crust!', VOICE_80S),
      // Anime girl boss warning
      this.fetchTTS('Danger! Danger! Danger!', VOICE_ANIME),
    ]);
  }

  // 80s voice: "Level Up!" announcement
  announceLevelUp() {
    this.playVoice('Level Up!', VOICE_80S);
  }

  // 80s voice: read out ability name
  announceAbility(abilityName: string) {
    this.playVoice(`${abilityName}!`, VOICE_80S);
  }

  // Anime girl: "Danger! Danger! Danger!" for boss spawn
  announceBossSpawn() {
    this.playBossSpawn();
    this.playVoice('Danger! Danger! Danger!', VOICE_ANIME);
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.voiceCache.clear();
    this.initialized = false;
  }
}

// Singleton
export const gameAudio = new GameAudio();
