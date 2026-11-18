/**
 * Small procedural sound kit (Web Audio). Every sound is synthesised, so the
 * project ships no third-party audio files.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 1.5;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return this.ctx;
  }

  unlock(): void {
    this.ensure();
  }

  private noise(duration: number, filterType: BiquadFilterType, freqFrom: number, freqTo: number, gain: number, q = 0.8): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freqFrom, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.05, duration * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + duration + 0.05);
  }

  private tone(freq: number, start: number, duration: number, gain: number, type: OscillatorType = 'sine'): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  fold(): void {
    this.noise(0.35, 'bandpass', 900, 2400, 0.25, 0.6);
  }

  tie(): void {
    this.noise(0.12, 'highpass', 2500, 1800, 0.18, 1.2);
    this.tone(220, 0.02, 0.12, 0.08, 'triangle');
  }

  splash(): void {
    this.noise(0.7, 'lowpass', 2200, 300, 0.45, 0.7);
  }

  bubbles(): void {
    for (let i = 0; i < 6; i++) this.tone(380 + Math.random() * 500, 0.1 + i * 0.18, 0.08, 0.05);
  }

  shimmer(): void {
    [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, i * 0.12, 0.9, 0.05));
  }

  snip(): void {
    this.noise(0.06, 'highpass', 5000, 4000, 0.22, 2);
  }

  reveal(stars: number): void {
    const notes = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
    const n = 3 + stars;
    for (let i = 0; i < n; i++) this.tone(notes[i % notes.length] * (i >= 6 ? 2 : 1), i * 0.11, 1.2, 0.07);
  }

  tick(): void {
    this.tone(880, 0, 0.06, 0.04, 'triangle');
  }
}
