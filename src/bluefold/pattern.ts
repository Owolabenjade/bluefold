import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector4,
  WebGLRenderTarget,
  WebGLRenderer,
} from '@iwsdk/core';
import { CLOTH_SIZE, MAX_FOLDS, MAX_TIES, Recipe } from './fold.js';

/**
 * Bakes the dye pattern of a cloth into a texture. Every fragment is a point
 * of the flat cloth; it is pushed through the same folds as the geometry, so
 * resist marks made on the folded bundle repeat with the fold symmetry, inner
 * layers take less dye, and creases darken.
 */
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec4 uFolds[${MAX_FOLDS}];
uniform int uFoldCount;
uniform vec4 uTies[${MAX_TIES}];
uniform int uTieCount;
uniform float uDips;
uniform float uOx;
uniform float uSize;
uniform float uMode;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}
vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

void main() {
  vec2 p = vec2((vUv.x - 0.5) * uSize, (0.5 - vUv.y) * uSize);
  vec2 orig = p;
  float layer = 0.0;
  float layers = 1.0;
  float creaseDist = 1000.0;
  float resist = 0.0;
  for (int i = 0; i <= ${MAX_FOLDS}; i++) {
    // Ties made after i folds act on the bundle as it was at stage i.
    for (int j = 0; j < ${MAX_TIES}; j++) {
      if (j >= uTieCount) break;
      vec4 t = uTies[j];
      float stage = floor(t.w * 0.5 + 0.01);
      if (abs(stage - float(i)) > 0.5) continue;
      float kind = t.w - stage * 2.0;
      vec2 dv = p - t.xy;
      float d = length(dv);
      float n = fbm(dv * 90.0 + float(j) * 7.13);
      if (kind < 0.5) {
        float core = 1.0 - smoothstep(t.z * 0.5, t.z * 0.95, d + (n - 0.5) * 0.006);
        float ang = atan(dv.y, dv.x);
        float streak = (1.0 - smoothstep(t.z * 0.9, t.z * 2.9, d)) *
          smoothstep(0.35, 0.95, 0.5 + 0.5 * sin(ang * 14.0 + n * 5.0));
        float ring = (1.0 - smoothstep(0.0012, 0.0032, abs(d - t.z * 1.5 - (n - 0.5) * 0.004))) * 0.75;
        resist = max(resist, max(core, max(streak * 0.8, ring)));
      } else {
        vec2 q = abs(dv);
        float box = 1.0 - smoothstep(t.z * 0.9, t.z * 1.04, max(q.x, q.y) + (n - 0.5) * 0.004);
        resist = max(resist, box);
      }
    }
    if (i >= uFoldCount) break;
    vec4 f = uFolds[i];
    float d = dot(p - f.xy, f.zw);
    creaseDist = min(creaseDist, abs(d));
    if (d > 0.0) {
      p -= 2.0 * d * f.zw;
      layer = 2.0 * layers - 1.0 - layer;
    }
    layers *= 2.0;
  }
  float inner = min(layer, layers - 1.0 - layer);
  float maxInner = max(1.0, floor(layers / 2.0));
  float depth = layers > 1.0 ? inner / maxInner : 0.0;
  float penetration = mix(1.0, 0.42, depth);

  float D = 1.0 - exp(-0.95 * uDips);
  float weave = fbm(orig * 260.0);
  float mottle = fbm(p * 36.0 + 3.1);
  float crease = layers > 1.0 ? exp(-creaseDist / 0.0035) : 0.0;
  float dye = D * penetration * (1.0 - resist) * (0.8 + 0.32 * mottle);
  dye += D * crease * 0.35 * (1.0 - resist);
  dye = clamp(dye, 0.0, 1.0);

  if (uMode > 0.5) {
    gl_FragColor = vec4(vec3(dye), 1.0);
    return;
  }
  vec3 white = vec3(0.94, 0.92, 0.87) * (0.95 + 0.07 * weave);
  vec3 green = vec3(0.47, 0.55, 0.22);
  vec3 indigo = mix(vec3(0.17, 0.26, 0.52), vec3(0.05, 0.08, 0.22), clamp((uDips - 1.0) / 3.0, 0.0, 1.0));
  vec3 dyeCol = mix(green, indigo, uOx);
  vec3 col = mix(white, dyeCol, smoothstep(0.0, 1.0, dye));
  col *= 0.97 + 0.05 * weave;
  gl_FragColor = vec4(toLinear(col), 1.0);
}
`;

export class PatternBaker {
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: ShaderMaterial;
  private folds = Array.from({ length: MAX_FOLDS }, () => new Vector4());
  private ties = Array.from({ length: MAX_TIES }, () => new Vector4());

  constructor() {
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uFolds: { value: this.folds },
        uFoldCount: { value: 0 },
        uTies: { value: this.ties },
        uTieCount: { value: 0 },
        uDips: { value: 0 },
        uOx: { value: 1 },
        uSize: { value: CLOTH_SIZE },
        uMode: { value: 0 },
      },
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad);
  }

  static colorTarget(size = 512): WebGLRenderTarget {
    const rt = new WebGLRenderTarget(size, size, { colorSpace: SRGBColorSpace });
    rt.texture.generateMipmaps = false;
    return rt;
  }

  static dyeTarget(size = 64): WebGLRenderTarget {
    return new WebGLRenderTarget(size, size);
  }

  bake(
    renderer: WebGLRenderer,
    target: WebGLRenderTarget,
    recipe: Recipe,
    oxidation: number,
    mode: 0 | 1 = 0,
  ): void {
    const u = this.material.uniforms;
    const fc = Math.min(recipe.folds.length, MAX_FOLDS);
    for (let i = 0; i < fc; i++) {
      const f = recipe.folds[i];
      this.folds[i].set(f.ax, f.az, f.nx, f.nz);
    }
    const tc = Math.min(recipe.ties.length, MAX_TIES);
    for (let i = 0; i < tc; i++) {
      const t = recipe.ties[i];
      this.ties[i].set(t.x, t.z, t.r, t.stage * 2 + t.kind);
    }
    u.uFoldCount.value = fc;
    u.uTieCount.value = tc;
    u.uDips.value = recipe.dips;
    u.uOx.value = oxidation;
    u.uMode.value = mode;

    const xrEnabled = renderer.xr.enabled;
    const previousTarget = renderer.getRenderTarget();
    renderer.xr.enabled = false;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
    renderer.xr.enabled = xrEnabled;
    renderer.setRenderTarget(previousTarget);
  }

  /** Mean similarity (0..1) between the dye maps of two recipes. */
  similarity(renderer: WebGLRenderer, a: Recipe, b: Recipe): number {
    const size = 64;
    const ta = PatternBaker.dyeTarget(size);
    const tb = PatternBaker.dyeTarget(size);
    this.bake(renderer, ta, a, 1, 1);
    this.bake(renderer, tb, b, 1, 1);
    const pa = new Uint8Array(size * size * 4);
    const pb = new Uint8Array(size * size * 4);
    renderer.readRenderTargetPixels(ta, 0, 0, size, size, pa);
    renderer.readRenderTargetPixels(tb, 0, 0, size, size, pb);
    ta.dispose();
    tb.dispose();
    let diff = 0;
    for (let i = 0; i < size * size; i++) diff += Math.abs(pa[i * 4] - pb[i * 4]) / 255;
    const mad = diff / (size * size);
    return Math.max(0, Math.min(1, 1 - mad * 2.4));
  }
}
