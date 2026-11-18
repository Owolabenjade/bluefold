import { Recipe } from './fold.js';

/** What a player keeps between sessions, stored only in this browser. */
export interface Progress {
  version: 1;
  /** Best score per UTC day, 0..100. */
  days: Record<string, { best: number; stars: number }>;
  /** Most recent finished cloths, newest first. */
  gallery: { date: string; score: number; stars: number; recipe: Recipe }[];
  streak: number;
}

const KEY = 'bluefold.progress.v1';
const GALLERY_MAX = 8;

function empty(): Progress {
  return { version: 1, days: {}, gallery: [], streak: 0 };
}

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Progress;
    if (p.version !== 1 || typeof p.days !== 'object' || !Array.isArray(p.gallery)) return empty();
    return p;
  } catch {
    return empty();
  }
}

function save(p: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage can be unavailable (private mode); progress then lasts one session.
  }
}

/** Consecutive days, ending today, with at least one finished cloth. */
function streakEnding(days: Progress['days'], today: string): number {
  let n = 0;
  const d = new Date(`${today}T00:00:00Z`);
  while (days[d.toISOString().slice(0, 10)]) {
    n++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return n;
}

export function recordResult(p: Progress, today: string, recipe: Recipe, score: number, stars: number): Progress {
  const days = { ...p.days };
  const prev = days[today];
  if (!prev || score > prev.best) days[today] = { best: score, stars: Math.max(stars, prev?.stars ?? 0) };
  const gallery = [{ date: today, score, stars, recipe }, ...p.gallery].slice(0, GALLERY_MAX);
  const next: Progress = { version: 1, days, gallery, streak: streakEnding(days, today) };
  save(next);
  return next;
}
