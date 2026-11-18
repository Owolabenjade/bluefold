import { Object3D } from '@iwsdk/core';
import { createLabel } from './props.js';

/**
 * Dev-only caption strip for recording the demo video in the emulator.
 * Number keys show a caption, 0 hides it. Never active in production builds.
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

export function installFilmCaptions(camera: Object3D): void {
  if (!import.meta.env.DEV) return;
  const label = createLabel(0.46, 0.07);
  label.mesh.position.set(0, -0.235, -0.62);
  label.mesh.renderOrder = 20;
  const mat = label.mesh.material as { depthTest?: boolean };
  mat.depthTest = false;
  label.mesh.visible = false;
  camera.add(label.mesh);
  window.addEventListener('keydown', (e) => {
    if (e.key === '0') {
      label.mesh.visible = false;
      return;
    }
    const i = Number(e.key) - 1;
    if (Number.isInteger(i) && i >= 0 && i < CAPTIONS.length) {
      const [title, sub] = CAPTIONS[i];
      label.draw(title, sub);
      label.mesh.visible = true;
    }
  });
}
