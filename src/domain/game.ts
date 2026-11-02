/** Pure game rules: no React, timers, audio, or storage dependencies. */
export type Mode = 'visual' | 'auditory' | 'dual';
export type Channel = 'visual' | 'auditory';
export const LETTERS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'Y'] as const;
export const SETTINGS = { n: 2, eventDurationMs: 2500, eventCount: 30 } as const;
export const channelsFor = (mode: Mode): Channel[] =>
  mode === 'dual' ? ['visual', 'auditory'] : [mode];
export type Stimulus = { visual: number; auditory: string };
export type Counts = { hits: number; misses: number; falseAlarms: number; correctRejections: number };
export type RoundState = {
  status: 'idle' | 'running' | 'finished';
  eventIndex: number;
  responded: Partial<Record<Channel, boolean>>;
  counts: Counts;
};

/** Fix the target count at 30% of eligible positions; exclude accidental matches. */
export function generateSequence<T>(values: readonly T[], count: number, n: number, random = Math.random): T[] {
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(count) || count <= n || new Set(values).size < 2) {
    throw new Error('Sequence requires n >= 1, count > n, and at least two distinct stimuli.');
  }
  const pick = (length: number) => Math.min(length - 1, Math.max(0, Math.floor(random() * length)));
  const eligible = Array.from({ length: count - n }, (_, index) => index + n);
  for (let index = eligible.length - 1; index > 0; index--) {
    const other = pick(index + 1);
    [eligible[index], eligible[other]] = [eligible[other], eligible[index]];
  }
  const targets = new Set(eligible.slice(0, Math.round(eligible.length * 0.3)));
  const sequence: T[] = [];
  for (let index = 0; index < count; index++) {
    const previous = sequence[index - n];
    const options = index < n ? values : values.filter((value) => value !== previous);
    sequence.push(targets.has(index) ? previous : options[pick(options.length)]);
  }
  return sequence;
}

export type GameSettings = { mode: Mode; n: number; eventDurationMs: number; eventCount: number; gridSize: number; letterCount: number };
export const DEFAULT_SETTINGS: GameSettings = { ...SETTINGS, mode: 'visual', gridSize: 3, letterCount: 8 };
/** Validate persisted or route-supplied data before it reaches the engine. */
export function validateSettings(value: unknown): GameSettings {
  const s = value as GameSettings | null;
  if (!s || !['visual', 'auditory', 'dual'].includes(s.mode) ||
    !Number.isInteger(s.n) || s.n < 1 || s.n > 5 ||
    !Number.isInteger(s.eventCount) || s.eventCount < 10 || s.eventCount > 100 ||
    !Number.isInteger(s.eventDurationMs) || s.eventDurationMs < 1000 || s.eventDurationMs > 5000 ||
    ![3, 5].includes(s.gridSize) || !Number.isInteger(s.letterCount) || s.letterCount < 4 || s.letterCount > 8) return { ...DEFAULT_SETTINGS };
  return { mode: s.mode, n: s.n, eventCount: s.eventCount, eventDurationMs: s.eventDurationMs, gridSize: s.gridSize, letterCount: s.letterCount };
}

export function createStimuli(random = Math.random, settings: GameSettings = DEFAULT_SETTINGS): Stimulus[] {
  const visual = generateSequence(Array.from({ length: settings.gridSize ** 2 }, (_, index) => index), settings.eventCount, settings.n, random);
  const auditory = generateSequence(LETTERS.slice(0, settings.letterCount), settings.eventCount, settings.n, random);
  return visual.map((cell, index) => ({ visual: cell, auditory: auditory[index] }));
}

/** Misses and false alarms cost equally; scores never fall below zero. */
export const calculateScore = (counts: Counts) => Math.max(0, counts.hits * 100 - (counts.misses + counts.falseAlarms) * 50);

/** Authoritative synchronous response guards prevent duplicate taps before React renders. */
export class GameEngine {
  private state: RoundState = this.initialState();
  readonly mode: Mode;
  readonly sequence: readonly Stimulus[];
  readonly n: number;
  constructor(mode: Mode, sequence: readonly Stimulus[], n: number = SETTINGS.n) {
    if (sequence.length <= n || !Number.isInteger(n) || n < 1) throw new Error('Invalid round');
    this.mode = mode;
    this.sequence = sequence;
    this.n = n;
  }
  private initialState(): RoundState {
    return { status: 'idle', eventIndex: -1, responded: {}, counts: { hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 } };
  }
  snapshot(): RoundState {
    return { ...this.state, responded: { ...this.state.responded }, counts: { ...this.state.counts } };
  }
  start() {
    if (this.state.status !== 'idle') return;
    this.state = { ...this.initialState(), status: 'running', eventIndex: 0 };
  }
  isMatch(channel: Channel): boolean {
    const index = this.state.eventIndex;
    return index >= this.n && this.sequence[index]?.[channel] === this.sequence[index - this.n]?.[channel];
  }
  press(channel: Channel): 'ignored' | 'hit' | 'falseAlarm' {
    if (this.state.status !== 'running' || this.state.eventIndex < this.n ||
      !channelsFor(this.mode).includes(channel) || this.state.responded[channel]) return 'ignored';
    this.state.responded[channel] = true;
    if (this.isMatch(channel)) {
      this.state.counts.hits++;
      return 'hit';
    }
    this.state.counts.falseAlarms++;
    return 'falseAlarm';
  }
  /** Settle the outgoing event exactly once, including the last full-duration event. */
  advance() {
    if (this.state.status !== 'running') return;
    if (this.state.eventIndex >= this.n) {
      for (const channel of channelsFor(this.mode)) {
        if (!this.state.responded[channel]) {
          if (this.isMatch(channel)) this.state.counts.misses++;
          else this.state.counts.correctRejections++;
        }
      }
    }
    if (this.state.eventIndex === this.sequence.length - 1) this.state.status = 'finished';
    else { this.state.eventIndex++; this.state.responded = {}; }
  }
  cancel() { this.state = this.initialState(); }
}
