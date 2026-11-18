import {
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  BoxGeometry,
} from '@iwsdk/core';

export const VAT_RADIUS = 0.1;
export const VAT_HEIGHT = 0.15;

/** A plain wooden tabletop, used only when no real table is detected. */
export function createVirtualTable(): Group {
  const g = new Group();
  g.name = 'virtual-table';
  const top = new Mesh(
    new BoxGeometry(1.0, 0.04, 0.62),
    new MeshStandardMaterial({ color: new Color('#8a6a4a'), roughness: 0.8 }),
  );
  top.position.y = -0.02;
  top.receiveShadow = true;
  g.add(top);
  const legGeo = new BoxGeometry(0.05, 0.7, 0.05);
  const legMat = new MeshStandardMaterial({ color: new Color('#5d4632'), roughness: 0.85 });
  for (const [x, z] of [
    [-0.45, -0.26],
    [0.45, -0.26],
    [-0.45, 0.26],
    [0.45, 0.26],
  ]) {
    const leg = new Mesh(legGeo, legMat);
    leg.position.set(x, -0.39, z);
    g.add(leg);
  }
  return g;
}

/** Indigo vat: glazed clay pot with a dark liquid surface and a coppery "flower" of foam. */
export function createVat(): { group: Group; liquid: Mesh; liquidMaterial: ShaderMaterial } {
  const group = new Group();
  group.name = 'vat';
  const potMat = new MeshStandardMaterial({ color: new Color('#3a2a22'), roughness: 0.55, metalness: 0.05 });
  const pot = new Mesh(
    new CylinderGeometry(VAT_RADIUS, VAT_RADIUS * 0.82, VAT_HEIGHT, 40, 1, true),
    potMat,
  );
  pot.material.side = DoubleSide;
  pot.position.y = VAT_HEIGHT / 2;
  pot.castShadow = true;
  group.add(pot);
  const rim = new Mesh(new TorusGeometry(VAT_RADIUS, 0.008, 10, 48), potMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = VAT_HEIGHT;
  group.add(rim);
  const base = new Mesh(new CircleGeometry(VAT_RADIUS * 0.82, 32), potMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.002;
  group.add(base);

  const liquidMaterial = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStir: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uStir;
      float hash(vec2 p){ p = fract(p*vec2(91.7, 37.3)); p += dot(p, p+19.19); return fract(p.x*p.y); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c);
        float a = atan(c.y, c.x);
        float swirl = noise(vec2(a * 3.0 + uTime * 0.2, r * 14.0 - uTime * 0.3));
        vec3 deep = vec3(0.02, 0.04, 0.10);
        vec3 sheen = vec3(0.10, 0.16, 0.30);
        vec3 col = mix(deep, sheen, swirl * 0.6);
        // The "flower": coppery foam gathered in the middle of a healthy vat.
        float bub = noise(c * 60.0 + uTime * 0.15);
        float flower = smoothstep(0.24, 0.05, r) * smoothstep(0.45, 0.75, bub);
        col = mix(col, vec3(0.42, 0.30, 0.20), flower * 0.8);
        col += vec3(0.25, 0.35, 0.6) * uStir * smoothstep(0.5, 0.0, r) * (0.5 + 0.5 * sin(r * 80.0 - uTime * 12.0));
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
      }
    `,
  });
  const liquid = new Mesh(new CircleGeometry(VAT_RADIUS * 0.97, 40), liquidMaterial);
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = VAT_HEIGHT - 0.025;
  group.add(liquid);
  return { group, liquid, liquidMaterial };
}

/** A glowing pull tab that the player pinches to fold or unfold. */
export function createPullTab(color = '#f0c674'): Mesh {
  const mat = new MeshStandardMaterial({
    color: new Color(color),
    emissive: new Color(color),
    emissiveIntensity: 0.6,
    roughness: 0.4,
  });
  const tab = new Mesh(new CapsuleGeometry(0.009, 0.03, 6, 12), mat);
  tab.rotation.z = Math.PI / 2;
  tab.castShadow = true;
  return tab;
}

/** A loop of raffia thread standing on the bundle: grab it to carry the cloth. */
export function createLiftLoop(): Mesh {
  const mat = new MeshStandardMaterial({
    color: new Color('#c9a66b'),
    emissive: new Color('#7a5a2a'),
    emissiveIntensity: 0.35,
    roughness: 0.9,
  });
  const loop = new Mesh(new TorusGeometry(0.018, 0.0045, 8, 24), mat);
  loop.castShadow = true;
  return loop;
}

/** A tie: raffia wound tight around a gathered nub of cloth. */
export function createTieKnot(): Group {
  const g = new Group();
  const nubMat = new MeshStandardMaterial({ color: new Color('#e8e2d4'), roughness: 0.95 });
  const nub = new Mesh(new SphereGeometry(0.011, 14, 10), nubMat);
  nub.scale.set(1, 0.7, 1);
  nub.position.y = 0.006;
  g.add(nub);
  const threadMat = new MeshStandardMaterial({ color: new Color('#b8935a'), roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const wrap = new Mesh(new TorusGeometry(0.0085 - i * 0.0012, 0.0016, 6, 20), threadMat);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = 0.004 + i * 0.0025;
    g.add(wrap);
  }
  return g;
}

/** A framed square that shows a cloth texture (today's target, gallery). */
export function createFrame(size: number, label: string): { group: Group; face: Mesh; setLabel: (s: string, sub?: string) => void } {
  const group = new Group();
  const back = new Mesh(
    new BoxGeometry(size + 0.03, size + 0.03, 0.012),
    new MeshStandardMaterial({ color: new Color('#2b2118'), roughness: 0.7 }),
  );
  back.position.z = -0.008;
  group.add(back);
  const face = new Mesh(new PlaneGeometry(size, size), new MeshBasicMaterial({ color: 0xffffff }));
  group.add(face);
  const labelH = Math.max(0.028, size * 0.2);
  const { mesh: labelMesh, draw } = createLabel(size, labelH);
  labelMesh.position.y = -size / 2 - labelH * 0.75;
  group.add(labelMesh);
  draw(label);
  return { group, face, setLabel: draw };
}

/** A small text strip drawn on a canvas. */
export function createLabel(width: number, height: number): { mesh: Mesh; draw: (s: string, sub?: string) => void } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.round((512 * height) / width);
  const ctx = canvas.getContext('2d')!;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(
    new PlaneGeometry(width, height),
    new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  const draw = (s: string, sub?: string) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(16, 22, 40, 0.72)';
    const r = canvas.height * 0.3;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, r);
    ctx.fill();
    ctx.fillStyle = '#f3efe6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (sub) {
      ctx.font = `600 ${Math.round(canvas.height * 0.36)}px system-ui, sans-serif`;
      ctx.fillText(s, canvas.width / 2, canvas.height * 0.36);
      ctx.font = `400 ${Math.round(canvas.height * 0.24)}px system-ui, sans-serif`;
      ctx.fillStyle = '#c9d3ee';
      ctx.fillText(sub, canvas.width / 2, canvas.height * 0.74);
    } else {
      ctx.font = `600 ${Math.round(canvas.height * 0.5)}px system-ui, sans-serif`;
      ctx.fillText(s, canvas.width / 2, canvas.height * 0.54);
    }
    tex.needsUpdate = true;
  };
  return { mesh, draw };
}

/** Itajime clamp: a pair of small wooden blocks pressed onto the folded cloth. */
export function createClampBlock(size = 0.04): Group {
  const g = new Group();
  const wood = new MeshStandardMaterial({ color: new Color('#a07b4f'), roughness: 0.75 });
  const block = new Mesh(new BoxGeometry(size, 0.012, size), wood);
  block.position.y = 0.006;
  block.castShadow = true;
  g.add(block);
  const grain = new MeshStandardMaterial({ color: new Color('#7d5b37'), roughness: 0.8 });
  const peg = new Mesh(new CylinderGeometry(0.004, 0.004, 0.012, 10), grain);
  peg.position.y = 0.018;
  g.add(peg);
  return g;
}
