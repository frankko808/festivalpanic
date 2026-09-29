import { gameState } from "../state/GameState";

// Small procedural soundtrack: no external files, samples, or licensed melodies.
const TOWN_NOTES = [262, 330, 392, 330, 294, 349, 392, 349];
const FESTIVAL_NOTES = [392, 494, 587, 494, 440, 523, 659, 523];

class AudioManager {
  private context?: AudioContext;
  private timer?: number;
  private beat = 0;

  get isMuted(): boolean { return Boolean(gameState.persisted.settings.muted); }

  start(): void {
    if (typeof window === "undefined" || !window.AudioContext) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") void this.context.resume();
      if (this.timer === undefined) this.timer = window.setInterval(() => this.tick(), 340);
    } catch { /* Audio is optional; the game stays playable without it. */ }
  }

  toggleMute(): boolean {
    const next = !this.isMuted;
    gameState.setAudioMuted(next);
    if (!next) this.start();
    return next;
  }

  playSelect(): void {
    if (this.isMuted) return;
    this.tone(620, 0.055, 0.035 * gameState.persisted.settings.sfxVolume, "square");
  }

  private tick(): void {
    if (!this.context || this.context.state !== "running" || this.isMuted || document.hidden) return;
    const phase = gameState.current.phase;
    if (phase === "results" || phase === "character-select") return;
    const notes = phase === "festival" ? FESTIVAL_NOTES : TOWN_NOTES;
    const frequency = notes[this.beat % notes.length] ?? 330;
    const volume = gameState.persisted.settings.musicVolume;
    this.tone(frequency, phase === "festival" ? 0.23 : 0.18, 0.018 * volume, "triangle");
    if (this.beat % 4 === 0) this.tone(frequency / 2, 0.27, 0.012 * volume, "sine");
    this.beat += 1;
  }

  private tone(frequency: number, duration: number, volume: number, type: OscillatorType): void {
    const context = this.context;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.015);
  }
}

export const audioManager = new AudioManager();
