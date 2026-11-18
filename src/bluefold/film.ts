import { Object3D } from '@iwsdk/core';
import { createLabel } from './props.js';

/**
 * Dev-only caption strip for recording the demo video in the emulator.
 * Captions advance on game events (never backwards), so recording needs no
 * keyboard or window interaction. Inactive in production builds.
 */
const CAPTIONS: [string, string?][] = [
  ['Bluefold', 'An indigo resist-dye workshop on your real table. Hands only.'],
  ["Today's cloth hangs above your table", 'Recreate it with folds, ties and dips.'],
  ['Pinch an edge and fold', 'The cloth follows your hand around the crease.'],
  ['Pinch to tie with raffia, or press a wooden clamp', 'Inspired by adire oniko (tied) and itajime shibori (clamped).'],
  ['Carry it to the vat and let go', 'Indigo comes out green, then turns blue in the air.'],
  ['Pull the corner to unfold', 'Every fold mirrors your ties into the pattern.'],
  ['A new cloth every day', 'Your cloths stay on the wall. Keep the streak going.'],
  ['Seated, hands-only, about two minutes a cloth', 'Built with Meta Immersive Web SDK. Recorded in the Immersive Web Emulator (Quest 3).'],
  ['owolabenjade.github.io/bluefold', 'Open it in the Quest Browser.'],
];

export type FilmCue = 'start' | 'fold' | 'tie' | 'lift' | 'unfold' | 'reveal';
const CUE_INDEX: Record<FilmCue, number> = { start: 0, fold: 2, tie: 3, lift: 4, unfold: 5, reveal: 6 };

export interface Film {
  cue(c: FilmCue): void;
  update(dt: number): void;
}

const noop: Film = { cue: () => {}, update: () => {} };

export function installFilmCaptions(camera: Object3D): Film {
  if (!import.meta.env.DEV) return noop;
  const label = createLabel(0.46, 0.07);
  label.mesh.position.set(0, -0.235, -0.62);
  label.mesh.renderOrder = 20;
  (label.mesh.material as { depthTest?: boolean }).depthTest = false;
  label.mesh.visible = false;
  camera.add(label.mesh);

  let index = -1;
  let timer = 0;
  // Captions that follow on their own after a delay: [from index, seconds, to index].
  const chains: [number, number, number][] = [
    [0, 4, 1],
    [6, 5, 7],
    [7, 5.5, 8],
    [8, 5, -1],
  ];
  const show = (i: number) => {
    index = i;
    timer = 0;
    if (i < 0) {
      label.mesh.visible = false;
      return;
    }
    const [title, sub] = CAPTIONS[i];
    label.draw(title, sub);
    label.mesh.visible = true;
  };
  return {
    cue(c) {
      const i = CUE_INDEX[c];
      if (i > index) show(i);
    },
    update(dt) {
      if (index < 0) return;
      timer += dt;
      for (const [from, secs, to] of chains) {
        if (from === index && timer > secs) {
          if (to < 0) {
            label.mesh.visible = false;
            index = 99; // finished
          } else {
            show(to);
          }
          break;
        }
      }
    },
  };
}
