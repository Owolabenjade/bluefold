/**
 * Flat-fold model for a square cloth lying in its local XZ plane (metres).
 *
 * A fold is a line (point a, unit normal n). Points on the side n points to
 * (the "moving" side) are reflected across the line and stacked on top. The
 * same mapping runs in the pattern shader, so the dye pattern of the unfolded
 * cloth is exactly what the folds and ties produce.
 */

export interface Fold {
  ax: number;
  az: number;
  nx: number;
  nz: number;
}

export interface Tie {
  x: number;
  z: number;
  r: number;
  /** 0 = thread tie (sunburst), 1 = clamp block (solid square) */
  kind: number;
  /** Number of folds already made when the tie went on (its x/z live in that bundle space). */
  stage: number;
}

export interface Recipe {
  folds: Fold[];
  ties: Tie[];
  dips: number;
}

export const MAX_FOLDS = 4;
export const MAX_TIES = 6;
export const CLOTH_SIZE = 0.36;

export type Vec2 = { x: number; z: number };

export function emptyRecipe(): Recipe {
  return { folds: [], ties: [], dips: 0 };
}

export function cloneRecipe(r: Recipe): Recipe {
  return {
    folds: r.folds.map((f) => ({ ...f })),
    ties: r.ties.map((t) => ({ ...t })),
    dips: r.dips,
  };
}

/** Initial outline of the flat cloth. */
export function squareOutline(size = CLOTH_SIZE): Vec2[] {
  const h = size / 2;
  return [
    { x: -h, z: -h },
    { x: h, z: -h },
    { x: h, z: h },
    { x: -h, z: h },
  ];
}

export function signedDist(p: Vec2, f: Fold): number {
  return (p.x - f.ax) * f.nx + (p.z - f.az) * f.nz;
}

export function reflect(p: Vec2, f: Fold): Vec2 {
  const d = signedDist(p, f);
  return { x: p.x - 2 * d * f.nx, z: p.z - 2 * d * f.nz };
}

/** Clip a convex polygon to the half-plane signedDist <= 0. */
function clipKeep(poly: Vec2[], f: Fold): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = signedDist(a, f);
    const db = signedDist(b, f);
    if (da <= 1e-9) out.push(a);
    if ((da < -1e-9 && db > 1e-9) || (da > 1e-9 && db < -1e-9)) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
    }
  }
  return out;
}

function convexHull(points: Vec2[]): Vec2[] {
  const pts = points
    .map((p) => ({ x: Math.round(p.x * 1e6) / 1e6, z: Math.round(p.z * 1e6) / 1e6 }))
    .sort((a, b) => (a.x === b.x ? a.z - b.z : a.x - b.x));
  const uniq: Vec2[] = [];
  for (const p of pts) {
    const last = uniq[uniq.length - 1];
    if (!last || last.x !== p.x || last.z !== p.z) uniq.push(p);
  }
  if (uniq.length < 3) return uniq;
  const cross = (o: Vec2, a: Vec2, b: Vec2) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower: Vec2[] = [];
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Vec2[] = [];
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Outline of the bundle after applying a fold to a convex outline. */
export function foldOutline(poly: Vec2[], f: Fold): Vec2[] {
  const kept = clipKeep(poly, f);
  const moved = clipKeep(
    poly.map((p) => ({ x: p.x, z: p.z })),
    { ax: f.ax, az: f.az, nx: -f.nx, nz: -f.nz },
  ).map((p) => reflect(p, f));
  return convexHull(kept.concat(moved));
}

export function outlineAfter(folds: Fold[], size = CLOTH_SIZE): Vec2[] {
  let poly = squareOutline(size);
  for (const f of folds) poly = foldOutline(poly, f);
  return poly;
}

export function centroid(poly: Vec2[]): Vec2 {
  let x = 0;
  let z = 0;
  for (const p of poly) {
    x += p.x;
    z += p.z;
  }
  return { x: x / poly.length, z: z / poly.length };
}

export function pointInConvex(p: Vec2, poly: Vec2[]): boolean {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const c = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
    if (Math.abs(c) < 1e-9) continue;
    const s = Math.sign(c);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

export interface FoldOption {
  id: string;
  fold: Fold;
  /** Where the grab handle sits at rest (bundle edge on the moving side). */
  handle: Vec2;
  /** Distance from the fold line to the handle at rest. */
  reach: number;
}

/**
 * Fold choices offered for the current outline: the two midlines of its
 * bounding box, plus the diagonal when the outline is still square.
 */
export function foldOptions(poly: Vec2[]): FoldOption[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const opts: FoldOption[] = [];
  const add = (id: string, fold: Fold) => {
    let reach = 0;
    let hx = 0;
    let hz = 0;
    let count = 0;
    for (const p of poly) {
      const s = signedDist(p, fold);
      if (s > reach + 1e-6) {
        reach = s;
        hx = p.x;
        hz = p.z;
        count = 1;
      } else if (Math.abs(s - reach) <= 1e-6 && s > 0) {
        hx += p.x;
        hz += p.z;
        count++;
      }
    }
    if (reach < 0.03 || count === 0) return;
    opts.push({ id, fold, handle: { x: hx / count, z: hz / count }, reach });
  };
  // Right half over onto the left.
  if (w > 0.06) add('half-x', { ax: cx, az: cz, nx: 1, nz: 0 });
  // Far half over toward the player (far is -z).
  if (d > 0.06) add('half-z', { ax: cx, az: cz, nx: 0, nz: -1 });
  // Diagonal: only while the outline is a square (4 corners, w == d).
  if (poly.length === 4 && Math.abs(w - d) < 1e-4 && w > 0.06) {
    const s = Math.SQRT1_2;
    add('diag', { ax: cx, az: cz, nx: s, nz: -s });
  }
  return opts;
}

export interface FoldedPoint {
  x: number;
  z: number;
  layer: number;
  layers: number;
}

/** Map a point of the flat cloth through `count` folds into bundle space. */
export function mapThrough(
  x: number,
  z: number,
  folds: Fold[],
  count: number,
  out: FoldedPoint,
): FoldedPoint {
  let layer = 0;
  let layers = 1;
  for (let i = 0; i < count; i++) {
    const f = folds[i];
    const d = (x - f.ax) * f.nx + (z - f.az) * f.nz;
    if (d > 0) {
      x -= 2 * d * f.nx;
      z -= 2 * d * f.nz;
      layer = 2 * layers - 1 - layer;
    }
    layers *= 2;
  }
  out.x = x;
  out.z = z;
  out.layer = layer;
  out.layers = layers;
  return out;
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Today's target cloth, the same for everyone on the same UTC date. */
export function dailyRecipe(dateKey: string): Recipe {
  const rand = rng(hashString(`bluefold:${dateKey}`));
  const folds: Fold[] = [];
  let poly = squareOutline();
  const foldCount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < foldCount; i++) {
    const opts = foldOptions(poly);
    if (opts.length === 0) break;
    const pick = opts[Math.floor(rand() * opts.length)];
    folds.push(pick.fold);
    poly = foldOutline(poly, pick.fold);
  }
  const ties: Tie[] = [];
  const tieCount = 1 + Math.floor(rand() * 2);
  const c = centroid(poly);
  for (let i = 0; i < tieCount; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const v = poly[Math.floor(rand() * poly.length)];
      const k = 0.25 + rand() * 0.6;
      const p = { x: c.x + (v.x - c.x) * k, z: c.z + (v.z - c.z) * k };
      if (pointInConvex(p, poly)) {
        ties.push({ x: p.x, z: p.z, r: 0.018, kind: 0, stage: folds.length });
        break;
      }
    }
  }
  return { folds, ties, dips: 1 + Math.floor(rand() * 2) };
}

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
