import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Texture,
} from '@iwsdk/core';
import { CLOTH_SIZE, Fold, FoldedPoint, mapThrough } from './fold.js';

const GRID = 24;
const LAYER_GAP = 0.0014;
const BASE_LIFT = 0.0012;

/**
 * The cloth as a mesh in its own local XZ frame. Vertices sit on a grid with
 * a centre vertex in every cell, so every half, quarter and diagonal fold line
 * runs along mesh edges and folds without tearing triangles.
 */
export class ClothMesh {
  readonly mesh: Mesh;
  private geometry: BufferGeometry;
  private flat: Float32Array;
  private positions: Float32Array;
  private fp: FoldedPoint = { x: 0, z: 0, layer: 0, layers: 1 };

  constructor(map: Texture, size = CLOTH_SIZE) {
    const corners = (GRID + 1) * (GRID + 1);
    const centres = GRID * GRID;
    const count = corners + centres;
    this.flat = new Float32Array(count * 2);
    const uv = new Float32Array(count * 2);
    const step = size / GRID;
    const h = size / 2;
    let v = 0;
    for (let j = 0; j <= GRID; j++) {
      for (let i = 0; i <= GRID; i++) {
        const x = -h + i * step;
        const z = -h + j * step;
        this.flat[v * 2] = x;
        this.flat[v * 2 + 1] = z;
        uv[v * 2] = x / size + 0.5;
        uv[v * 2 + 1] = 0.5 - z / size;
        v++;
      }
    }
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const x = -h + (i + 0.5) * step;
        const z = -h + (j + 0.5) * step;
        this.flat[v * 2] = x;
        this.flat[v * 2 + 1] = z;
        uv[v * 2] = x / size + 0.5;
        uv[v * 2 + 1] = 0.5 - z / size;
        v++;
      }
    }
    const index: number[] = [];
    const corner = (i: number, j: number) => j * (GRID + 1) + i;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const c = corners + j * GRID + i;
        const a = corner(i, j);
        const b = corner(i + 1, j);
        const d = corner(i, j + 1);
        const e = corner(i + 1, j + 1);
        // Counter-clockwise when seen from +Y.
        index.push(c, b, a, c, e, b, c, d, e, c, a, d);
      }
    }
    this.positions = new Float32Array(count * 3);
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('uv', new BufferAttribute(uv, 2));
    this.geometry.setIndex(index);
    const material = new MeshStandardMaterial({
      map,
      side: DoubleSide,
      roughness: 0.93,
      metalness: 0,
    });
    this.mesh = new Mesh(this.geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.name = 'cloth';
    this.update([], 0, -1, 0);
  }

  /**
   * Lay out the vertices: folds [0, done) are complete, fold `anim` (if >= 0)
   * is rotating about its line by t * 180 degrees.
   */
  update(folds: Fold[], done: number, anim: number, t: number): void {
    const p = this.positions;
    const fp = this.fp;
    const n = this.flat.length / 2;
    const theta = Math.PI * Math.min(1, Math.max(0, t));
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const af = anim >= 0 ? folds[anim] : undefined;
    for (let v = 0; v < n; v++) {
      mapThrough(this.flat[v * 2], this.flat[v * 2 + 1], folds, done, fp);
      let x = fp.x;
      let z = fp.z;
      let y = BASE_LIFT + fp.layer * LAYER_GAP;
      if (af) {
        const d = (x - af.ax) * af.nx + (z - af.az) * af.nz;
        if (d > 0) {
          x = x - d * af.nx + d * cos * af.nx;
          z = z - d * af.nz + d * cos * af.nz;
          const stacked = theta < Math.PI / 2 ? fp.layer : 2 * fp.layers - 1 - fp.layer;
          y = BASE_LIFT + d * sin + stacked * LAYER_GAP;
        }
      }
      p[v * 3] = x;
      p[v * 3 + 1] = y;
      p[v * 3 + 2] = z;
    }
    const attr = this.geometry.getAttribute('position') as BufferAttribute;
    attr.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
    this.geometry.computeBoundingBox();
  }

  /** Height of the bundle top for a recipe with `layers` stacked layers. */
  static topHeight(foldCount: number): number {
    return BASE_LIFT + (2 ** foldCount - 1) * LAYER_GAP + 0.002;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as MeshStandardMaterial).dispose();
  }
}
