import {
  Box3,
  createSystem,
  Entity,
  Grabbed,
  Group,
  Mesh,
  MeshBasicMaterial,
  OneHandGrabbable,
  PlaneGeometry,
  Quaternion,
  RayInteractable,
  Vector3,
  VisibilityState,
  WebGLRenderTarget,
  XRPlane,
} from '@iwsdk/core';
import { Sfx } from './audio.js';
import { ClothMesh } from './cloth.js';
import { ClothSurface, FoldHandle, LiftLoop, UnfoldTab } from './components.js';
import {
  centroid,
  cloneRecipe,
  dailyRecipe,
  emptyRecipe,
  Fold,
  FoldOption,
  foldOptions,
  MAX_FOLDS,
  MAX_TIES,
  outlineAfter,
  pointInConvex,
  Recipe,
  todayKey,
  Vec2,
} from './fold.js';
import { PatternBaker } from './pattern.js';
import {
  createFrame,
  createLabel,
  createLiftLoop,
  createPullTab,
  createTieKnot,
  createVat,
  createVirtualTable,
  VAT_HEIGHT,
  VAT_RADIUS,
} from './props.js';
import { loadProgress, recordResult, Progress } from './progress.js';

type Phase = 'fold' | 'dipping' | 'unfolding' | 'reveal';

const MAX_HANDLES = 3;
const HIDDEN_Y = -50;
const HANDLE_COLORS = ['#f0c674', '#f0c674', '#f0c674'];

interface FoldAnim {
  option: FoldOption;
  t: number;
  /** Where the animation is heading after release: 1 = commit, 0 = cancel. */
  goal: number;
  held: boolean;
}

/**
 * Bluefold game loop: fold, tie, dip, unfold, compare with today's cloth.
 * One system owns the whole workspace; the props are plain entities.
 */
export class BluefoldSystem extends createSystem({
  heldFold: { required: [FoldHandle, Grabbed] },
  heldLift: { required: [LiftLoop, Grabbed] },
  heldUnfold: { required: [UnfoldTab, Grabbed] },
  planes: { required: [XRPlane] },
}) {
  private sfx = new Sfx();
  private baker!: PatternBaker;
  private clothTarget!: WebGLRenderTarget;
  private targetTarget!: WebGLRenderTarget;

  private workspace!: Group;
  private workspaceEntity!: Entity;
  private clothGroup!: Group;
  private cloth!: ClothMesh;
  private tieSheet!: Mesh;
  private vatLiquid!: { uniforms: Record<string, { value: number }> };
  private vatGroup!: Group;
  private table!: Group;
  private knots: Group[] = [];
  private handleEntities: Entity[] = [];
  private handleSlots: (FoldOption | null)[] = [];
  private liftEntity!: Entity;
  private unfoldEntity!: Entity;
  private label!: { mesh: Mesh; draw: (s: string, sub?: string) => void };
  private targetFrame!: ReturnType<typeof createFrame>;

  private phase: Phase = 'fold';
  private recipe: Recipe = emptyRecipe();
  private target: Recipe = dailyRecipe(todayKey());
  private progress: Progress = loadProgress();
  private oxidation = 1;
  private foldAnim: FoldAnim | null = null;
  private pendingTie: { point: Vector3; frames: number } | null = null;
  private lastGrabEnd = 0;
  private clock = 0;

  private dipTime = 0;
  private dipStart = new Vector3();
  private liftOffset = new Vector3();
  private unfold = { u: 0, goal: 0, held: false, start: new Vector3() };
  private revealTime = 0;
  private placed = false;
  private placeAfter = 0;
  private box = new Box3();
  private boxB = new Box3();
  private placedInXR = false;
  private needsBake = true;

  // Scratch objects (no allocation in update).
  private v1 = new Vector3();
  private v2 = new Vector3();
  private v3 = new Vector3();
  private q1 = new Quaternion();

  init(): void {
    this.baker = new PatternBaker();
    this.clothTarget = PatternBaker.colorTarget(512);
    this.targetTarget = PatternBaker.colorTarget(512);

    this.workspace = new Group();
    this.workspace.name = 'workspace';
    this.workspaceEntity = this.world.createTransformEntity(this.workspace, { persistent: true });

    this.table = createVirtualTable();
    this.workspace.add(this.table);

    this.clothGroup = new Group();
    this.clothGroup.name = 'cloth-group';
    const clothGroupEntity = this.world.createTransformEntity(this.clothGroup, {
      parent: this.workspaceEntity,
      persistent: true,
    });
    this.cloth = new ClothMesh(this.clothTarget.texture);
    this.clothGroup.add(this.cloth.mesh);

    // Ties land where a pinch ray meets this invisible, static sheet over the
    // cloth (a static mesh keeps the ray acceleration structure valid).
    this.tieSheet = new Mesh(
      new PlaneGeometry(0.4, 0.4).rotateX(-Math.PI / 2),
      new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    );
    this.tieSheet.name = 'tie-sheet';
    const sheetEntity = this.world.createTransformEntity(this.tieSheet, {
      parent: clothGroupEntity,
      persistent: true,
    });
    sheetEntity.addComponent(RayInteractable);
    sheetEntity.addComponent(ClothSurface);
    (this.tieSheet as unknown as { addEventListener: (t: string, cb: (e: { point?: Vector3 }) => void) => void }).addEventListener(
      'pointerdown',
      (e) => this.onClothPointerDown(e),
    );

    const vat = createVat();
    this.vatGroup = vat.group;
    this.vatLiquid = vat.liquidMaterial as unknown as { uniforms: Record<string, { value: number }> };
    this.vatGroup.position.set(0.32, 0, -0.02);
    this.workspace.add(this.vatGroup);

    for (let i = 0; i < MAX_HANDLES; i++) {
      const tab = createPullTab(HANDLE_COLORS[i]);
      tab.name = `fold-tab-${i}`;
      const e = this.world.createTransformEntity(tab, { persistent: true });
      e.addComponent(FoldHandle, { slot: i });
      e.addComponent(OneHandGrabbable, { rotate: false, translate: true });
      this.handleEntities.push(e);
      this.handleSlots.push(null);
    }

    const loop = createLiftLoop();
    loop.name = 'lift-loop';
    this.liftEntity = this.world.createTransformEntity(loop, { persistent: true });
    this.liftEntity.addComponent(LiftLoop);
    this.liftEntity.addComponent(OneHandGrabbable, { rotate: false, translate: true });

    const unfoldTab = createPullTab('#7fb2ff');
    unfoldTab.name = 'unfold-tab';
    this.unfoldEntity = this.world.createTransformEntity(unfoldTab, { persistent: true });
    this.unfoldEntity.addComponent(UnfoldTab);
    this.unfoldEntity.addComponent(OneHandGrabbable, { rotate: false, translate: true });

    this.label = createLabel(0.3, 0.06);
    this.label.mesh.position.set(0, 0.24, -0.28);
    this.workspace.add(this.label.mesh);
    this.label.mesh.visible = false;

    this.targetFrame = createFrame(0.3, "Today's cloth");
    (this.targetFrame.face.material as MeshBasicMaterial).map = this.targetTarget.texture;
    this.targetFrame.group.position.set(0, 0.42, -0.42);
    this.targetFrame.group.rotation.x = -0.12;
    this.workspace.add(this.targetFrame.group);

    // Queries: grab start / end.
    this.queries.heldFold.subscribe('qualify', (e) => this.onFoldGrab(e));
    this.queries.heldFold.subscribe('disqualify', (e) => this.onFoldRelease(e));
    this.queries.heldLift.subscribe('qualify', () => this.onLiftGrab());
    this.queries.heldLift.subscribe('disqualify', () => this.onLiftRelease());
    this.queries.heldUnfold.subscribe('qualify', () => this.onUnfoldGrab());
    this.queries.heldUnfold.subscribe('disqualify', () => this.onUnfoldRelease());

    this.cleanupFuncs.push(
      this.world.visibilityState.subscribe((state) => {
        const panel = this.scene.getObjectByName('Welcome Panel');
        if (state !== VisibilityState.NonImmersive) {
          this.sfx.unlock();
          if (!this.placedInXR) {
            this.placed = false;
            this.placeAfter = this.clock + 1.2;
          }
          if (panel) {
            panel.visible = false;
            panel.position.y += 100;
          }
        } else {
          this.placedInXR = false;
          this.placed = false;
          if (panel && !panel.visible) {
            panel.visible = true;
            panel.position.y -= 100;
          }
        }
      }),
    );

    this.baker.bake(this.renderer, this.targetTarget, this.target, 1);
    this.startNewCloth();
  }

  // ---------------------------------------------------------------- setup

  private startNewCloth(): void {
    this.recipe = emptyRecipe();
    this.oxidation = 1;
    this.phase = 'fold';
    this.foldAnim = null;
    this.unfold.u = 0;
    this.unfold.goal = 0;
    for (const k of this.knots) this.clothGroup.remove(k);
    this.knots = [];
    this.clothGroup.position.set(0, 0, 0);
    this.clothGroup.quaternion.identity();
    this.cloth.update(this.recipe.folds, 0, -1, 0);
    this.label.mesh.visible = false;
    this.needsBake = true;
    this.refreshHandles();
  }

  /** Put the workspace on a real table if one is known, else in front of the viewer. */
  private placeWorkspace(): void {
    const head = this.v1;
    this.player.head.getWorldPosition(head);
    const inXR = this.world.visibilityState.peek() !== VisibilityState.NonImmersive;
    if (inXR && (head.y < 0.3 || this.clock < this.placeAfter)) return; // pose or planes not ready yet
    const fwd = this.v2.set(0, 0, -1).applyQuaternion(this.player.head.getWorldQuaternion(this.q1));
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
    fwd.normalize();

    let tableY = inXR ? Math.min(1.0, Math.max(0.5, head.y - 0.48)) : 0.78;
    let usedPlane = false;
    let planeBox: Box3 | null = null;
    if (inXR) {
      let best = Infinity;
      for (const e of this.queries.planes.entities) {
        const plane = e.getValue(XRPlane, '_plane') as { orientation?: string; semanticLabel?: string } | undefined;
        const obj = e.object3D;
        if (!plane || !obj) continue;
        obj.getWorldPosition(this.v3);
        if (import.meta.env.DEV) console.log('[bluefold] plane', plane.orientation, plane.semanticLabel, this.v3.x.toFixed(2), this.v3.y.toFixed(2), this.v3.z.toFixed(2));
        if (plane.orientation !== 'horizontal') continue;
        const h = this.v3.y;
        if (h < 0.35 || h > 1.15) continue;
        const label = plane.semanticLabel ?? '';
        if (label === 'floor' || label === 'ceiling' || label === 'couch' || label === 'bed') continue;
        this.boxB.setFromObject(obj);
        // Horizontal distance from the head to the nearest point of the surface.
        const nx = Math.min(this.boxB.max.x, Math.max(this.boxB.min.x, head.x));
        const nz = Math.min(this.boxB.max.z, Math.max(this.boxB.min.z, head.z));
        const dist = Math.hypot(nx - head.x, nz - head.z);
        const score = dist - (label === 'table' ? 0.3 : 0);
        if (dist < 0.9 && score < best) {
          best = score;
          tableY = h;
          usedPlane = true;
          planeBox = this.box.copy(this.boxB);
        }
      }
    }
    const dist = inXR ? 0.42 : 0.0;
    const pos = inXR
      ? this.v3.set(head.x + fwd.x * dist, tableY, head.z + fwd.z * dist)
      : this.v3.set(0, tableY, -0.15);
    if (planeBox) {
      // Keep the cloth on the real tabletop, a hand's width in from its edges.
      const inset = 0.17;
      const bx0 = planeBox.min.x + inset;
      const bx1 = planeBox.max.x - inset;
      const bz0 = planeBox.min.z + inset;
      const bz1 = planeBox.max.z - inset;
      pos.x = bx0 < bx1 ? Math.min(bx1, Math.max(bx0, pos.x)) : (planeBox.min.x + planeBox.max.x) / 2;
      pos.z = bz0 < bz1 ? Math.min(bz1, Math.max(bz0, pos.z)) : (planeBox.min.z + planeBox.max.z) / 2;
      pos.y = tableY + 0.002;
    }
    this.workspace.position.copy(pos);
    this.workspace.rotation.set(0, Math.atan2(-fwd.x, -fwd.z), 0);
    this.table.visible = !usedPlane;
    if (import.meta.env.DEV) console.log('[bluefold] placed', usedPlane ? 'on plane' : 'fallback', pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2), 'head', head.y.toFixed(2));
    this.placed = true;
    if (inXR) this.placedInXR = true;
    this.refreshHandles();
  }

  /** While the cloth is untouched, follow the player if they sit down or move away. */
  private maybeRecenter(): void {
    if (!this.placedInXR || this.clock < this.placeAfter) return;
    const r = this.recipe;
    if (this.phase !== 'fold' || this.foldAnim || r.folds.length > 0 || r.ties.length > 0 || r.dips > 0) return;
    this.player.head.getWorldPosition(this.v1);
    this.workspace.getWorldPosition(this.v2);
    const flat = Math.hypot(this.v1.x - this.v2.x, this.v1.z - this.v2.z);
    const drop = this.v1.y - this.v2.y;
    if (flat > 0.95 || drop < 0.25 || drop > 0.95) {
      this.placed = false;
      this.placeAfter = this.clock + 0.6;
    }
  }

  // ---------------------------------------------------------------- input

  private onClothPointerDown(e: { point?: Vector3 }): void {
    if (import.meta.env.DEV) console.log('[bluefold] cloth pointerdown', this.phase, !!this.foldAnim, e.point ? e.point.toArray().map((n) => n.toFixed(3)).join(',') : 'no point');
    if (this.phase !== 'fold' || this.foldAnim || !e.point) return;
    if (this.recipe.ties.length >= MAX_TIES) return;
    this.pendingTie = { point: e.point.clone(), frames: 0 };
  }

  private commitPendingTie(): void {
    const pt = this.pendingTie;
    this.pendingTie = null;
    if (!pt || this.phase !== 'fold' || this.foldAnim) return;
    if (this.clock - this.lastGrabEnd < 0.3) return;
    if (this.queries.heldFold.entities.size > 0 || this.queries.heldLift.entities.size > 0) return;
    const local = this.clothGroup.worldToLocal(pt.point.clone());
    const outline = outlineAfter(this.recipe.folds);
    const p: Vec2 = { x: local.x, z: local.z };
    if (!pointInConvex(p, outline)) {
      if (import.meta.env.DEV) console.log('[bluefold] tie outside bundle', p.x.toFixed(3), p.z.toFixed(3));
      return;
    }
    this.recipe.ties.push({ x: p.x, z: p.z, r: 0.018, kind: 0, stage: this.recipe.folds.length });
    const knot = createTieKnot();
    this.clothGroup.add(knot);
    this.knots.push(knot);
    this.layoutKnots();
    this.sfx.tie();
    this.refreshHandles();
  }

  private onFoldGrab(e: Entity): void {
    if (this.phase !== 'fold' || this.foldAnim) return;
    const slot = e.getValue(FoldHandle, 'slot') as number;
    const option = this.handleSlots[slot];
    if (!option) return;
    this.foldAnim = { option, t: 0, goal: 0, held: true };
    this.sfx.tick();
  }

  private onFoldRelease(_e: Entity): void {
    this.lastGrabEnd = this.clock;
    const anim = this.foldAnim;
    if (!anim) return;
    anim.held = false;
    anim.goal = anim.t > 0.45 ? 1 : 0;
  }

  private onLiftGrab(): void {
    if (this.phase !== 'fold' || this.foldAnim) return;
    const obj = this.liftEntity.object3D!;
    obj.getWorldPosition(this.v1);
    this.clothGroup.getWorldPosition(this.v2);
    this.liftOffset.copy(this.v2).sub(this.v1);
  }

  private onLiftRelease(): void {
    this.lastGrabEnd = this.clock;
    if (this.phase !== 'fold') return;
    // Over the vat? Dip it; otherwise set it back down.
    this.clothGroup.getWorldPosition(this.v1);
    this.vatGroup.getWorldPosition(this.v2);
    const dx = this.v1.x - this.v2.x;
    const dz = this.v1.z - this.v2.z;
    const overVat = Math.hypot(dx, dz) < VAT_RADIUS * 1.6 && this.v1.y > this.v2.y - 0.05;
    this.dipStart.copy(this.clothGroup.position);
    this.dipTime = 0;
    this.phase = 'dipping';
    this.dipIntoVat = overVat;
    this.refreshHandles();
  }

  private dipIntoVat = false;

  private onUnfoldGrab(): void {
    if (this.phase !== 'fold' || this.recipe.dips < 1 || this.oxidation < 0.95) return;
    this.unfoldEntity.object3D!.getWorldPosition(this.unfold.start);
    this.unfold.held = true;
    this.phase = 'unfolding';
    for (const k of this.knots) this.clothGroup.remove(k);
    this.knots = [];
    if (this.recipe.ties.length > 0) this.sfx.snip();
  }

  private onUnfoldRelease(): void {
    this.lastGrabEnd = this.clock;
    if (this.phase !== 'unfolding') return;
    this.unfold.held = false;
    this.unfold.goal = this.unfold.u > 0.35 ? 1 : 0;
  }

  // ---------------------------------------------------------------- update

  update(delta: number): void {
    const dt = Math.min(delta, 0.05);
    this.clock += dt;
    if (!this.placed) this.placeWorkspace();
    else this.maybeRecenter();
    this.vatLiquid.uniforms.uTime.value = this.clock;

    if (this.pendingTie) {
      this.pendingTie.frames++;
      if (this.pendingTie.frames >= 2) this.commitPendingTie();
    }

    switch (this.phase) {
      case 'fold':
        this.updateFold(dt);
        this.updateLiftFollow();
        break;
      case 'dipping':
        this.updateDip(dt);
        break;
      case 'unfolding':
        this.updateUnfold(dt);
        break;
      case 'reveal':
        this.updateReveal(dt);
        break;
    }

    if (this.oxidation < 1 && this.phase !== 'dipping') {
      this.oxidation = Math.min(1, this.oxidation + dt / 3);
      this.needsBake = true;
      if (this.oxidation >= 1) this.refreshHandles();
    }
    if (this.needsBake) {
      this.baker.bake(this.renderer, this.clothTarget, this.recipe, this.oxidation);
      this.needsBake = false;
    }
    this.pulseHandles();
  }

  private updateFold(dt: number): void {
    const anim = this.foldAnim;
    if (!anim) return;
    const f = anim.option.fold;
    if (anim.held) {
      // The flap edge follows the hand around the fold line.
      const slot = this.handleSlots.indexOf(anim.option);
      const handle = slot >= 0 ? this.handleEntities[slot].object3D : undefined;
      if (handle) {
        handle.getWorldPosition(this.v1);
        const local = this.clothGroup.worldToLocal(this.v1);
        const s = (local.x - f.ax) * f.nx + (local.z - f.az) * f.nz;
        const h = Math.max(0, local.y);
        anim.t = Math.min(1, Math.max(0, Math.atan2(h, s) / Math.PI));
      }
    } else {
      const speed = 2.6;
      anim.t += Math.sign(anim.goal - anim.t) * speed * dt;
      if ((anim.goal === 1 && anim.t >= 1) || (anim.goal === 0 && anim.t <= 0)) {
        anim.t = anim.goal;
        if (anim.goal === 1) {
          this.recipe.folds.push({ ...f });
          this.sfx.fold();
          this.needsBake = true;
        }
        this.foldAnim = null;
        this.cloth.update(this.recipe.folds, this.recipe.folds.length, -1, 0);
        this.layoutKnots();
        this.refreshHandles();
        return;
      }
    }
    const tmp: Fold[] = this.recipe.folds.concat([f]);
    this.cloth.update(tmp, this.recipe.folds.length, this.recipe.folds.length, anim.t);
    this.layoutKnots(tmp, anim.t);
  }

  private updateLiftFollow(): void {
    if (this.queries.heldLift.entities.size === 0) return;
    const obj = this.liftEntity.object3D!;
    obj.getWorldPosition(this.v1);
    this.v1.add(this.liftOffset);
    this.workspace.worldToLocal(this.v1);
    this.clothGroup.position.copy(this.v1);
  }

  private updateDip(dt: number): void {
    this.dipTime += dt;
    const t = this.dipTime;
    const home = this.v3.set(0, 0, 0);
    if (!this.dipIntoVat) {
      const k = Math.min(1, t / 0.4);
      this.clothGroup.position.lerpVectors(this.dipStart, home, easeInOut(k));
      if (k >= 1) this.finishDip(false);
      return;
    }
    const above = this.v1.copy(this.vatGroup.position);
    above.y = VAT_HEIGHT + 0.06;
    const under = this.v2.copy(this.vatGroup.position);
    under.y = VAT_HEIGHT - 0.06;
    if (t < 0.45) {
      this.clothGroup.position.lerpVectors(this.dipStart, above, easeInOut(t / 0.45));
    } else if (t < 1.0) {
      this.clothGroup.position.lerpVectors(above, under, easeInOut((t - 0.45) / 0.55));
      if (t - dt < 0.75 && t >= 0.75) {
        this.recipe.dips += 1;
        this.oxidation = 0;
        this.needsBake = true;
        this.sfx.splash();
      }
    } else if (t < 2.4) {
      this.clothGroup.position.copy(under);
      this.vatLiquid.uniforms.uStir.value = Math.sin(((t - 1.0) / 1.4) * Math.PI);
      if (t - dt < 1.2 && t >= 1.2) this.sfx.bubbles();
    } else if (t < 2.95) {
      this.vatLiquid.uniforms.uStir.value = 0;
      this.clothGroup.position.lerpVectors(under, above, easeInOut((t - 2.4) / 0.55));
    } else if (t < 3.6) {
      this.clothGroup.position.lerpVectors(above, home, easeInOut((t - 2.95) / 0.65));
    } else {
      this.clothGroup.position.copy(home);
      this.finishDip(true);
    }
  }

  private finishDip(dipped: boolean): void {
    this.phase = 'fold';
    if (dipped) this.sfx.shimmer();
    this.refreshHandles();
  }

  private updateUnfold(dt: number): void {
    const u = this.unfold;
    if (u.held) {
      this.unfoldEntity.object3D!.getWorldPosition(this.v1);
      u.u = Math.min(1, Math.max(0, this.v1.distanceTo(u.start) / 0.16));
    } else {
      u.u += Math.sign(u.goal - u.u) * 1.6 * dt;
      if (u.goal === 1 && u.u >= 1) {
        u.u = 1;
        this.beginReveal();
        return;
      }
      if (u.goal === 0 && u.u <= 0) {
        u.u = 0;
        this.phase = 'fold';
        this.cloth.update(this.recipe.folds, this.recipe.folds.length, -1, 0);
        this.refreshHandles();
        return;
      }
    }
    this.layoutUnfold(u.u);
  }

  /** Unfold progress 0..1 undoes the folds last-first. */
  private layoutUnfold(progress: number): void {
    const n = this.recipe.folds.length;
    if (n === 0) {
      this.cloth.update(this.recipe.folds, 0, -1, 0);
      return;
    }
    const x = Math.min(n - 1e-6, progress * n);
    const undone = Math.floor(x);
    const animIndex = n - 1 - undone;
    const t = 1 - (x - undone);
    this.cloth.update(this.recipe.folds, animIndex, animIndex, t);
  }

  private beginReveal(): void {
    this.phase = 'reveal';
    this.revealTime = 0;
    this.cloth.update(this.recipe.folds, 0, -1, 0);
    const score = this.baker.similarity(this.renderer, this.recipe, this.target);
    const pct = Math.round(score * 100);
    const stars = score >= 0.86 ? 3 : score >= 0.72 ? 2 : score >= 0.55 ? 1 : 0;
    this.progress = recordResult(this.progress, todayKey(), cloneRecipe(this.recipe), pct, stars);
    const starText = '◆'.repeat(stars) + '◇'.repeat(3 - stars);
    this.label.draw(`${pct}% match  ${starText}`, `Streak ${this.progress.streak} day${this.progress.streak === 1 ? '' : 's'}`);
    this.label.mesh.visible = true;
    this.sfx.reveal(stars);
    this.refreshHandles();
  }

  private updateReveal(dt: number): void {
    this.revealTime += dt;
    // Lift the finished cloth up so it can be admired, then start a fresh one.
    const k = Math.min(1, this.revealTime / 1.2);
    this.clothGroup.position.set(0, 0.12 * easeInOut(k), -0.02 * k);
    this.clothGroup.rotation.set(-1.1 * easeInOut(k), 0, 0);
    if (this.revealTime > 7) this.startNewCloth();
  }

  // ---------------------------------------------------------------- layout

  private layoutKnots(folds?: Fold[], t = 0): void {
    const fs = folds ?? this.recipe.folds;
    const done = this.recipe.folds.length;
    const animF = folds ? fs[done] : undefined;
    for (let i = 0; i < this.knots.length; i++) {
      const tie = this.recipe.ties[i];
      let x = tie.x;
      let z = tie.z;
      for (let k = tie.stage; k < done; k++) {
        const f = fs[k];
        const d = (x - f.ax) * f.nx + (z - f.az) * f.nz;
        if (d > 0) {
          x -= 2 * d * f.nx;
          z -= 2 * d * f.nz;
        }
      }
      let y = ClothMesh.topHeight(done);
      let flip = false;
      if (animF) {
        const d = (x - animF.ax) * animF.nx + (z - animF.az) * animF.nz;
        if (d > 0) {
          const th = Math.PI * t;
          x = x - d * animF.nx + d * Math.cos(th) * animF.nx;
          z = z - d * animF.nz + d * Math.cos(th) * animF.nz;
          y = y + d * Math.sin(th);
          flip = th > Math.PI / 2;
        }
      }
      const knot = this.knots[i];
      knot.position.set(x, y, z);
      knot.scale.y = flip ? -1 : 1;
    }
  }

  /** Show the tabs that make sense right now, at their rest positions. */
  private refreshHandles(): void {
    const folding = this.phase === 'fold' && !this.foldAnim;
    const outline = outlineAfter(this.recipe.folds);
    const opts = folding && this.recipe.folds.length < MAX_FOLDS && this.recipe.dips === 0 ? foldOptions(outline) : [];
    const top = ClothMesh.topHeight(this.recipe.folds.length);
    this.tieSheet.position.y = top;
    for (let i = 0; i < MAX_HANDLES; i++) {
      const e = this.handleEntities[i];
      const obj = e.object3D!;
      const opt = opts[i] ?? null;
      this.handleSlots[i] = opt;
      if (!opt) {
        obj.visible = false;
        obj.position.set(0, HIDDEN_Y, 0);
        continue;
      }
      obj.visible = true;
      const f = opt.fold;
      // Rest a little outside the edge so the tab is easy to pinch.
      const hx = opt.handle.x + f.nx * 0.012;
      const hz = opt.handle.z + f.nz * 0.012;
      this.v1.set(hx, top + 0.006, hz);
      this.clothGroup.localToWorld(this.v1);
      obj.position.copy(this.v1);
      obj.rotation.set(0, this.workspace.rotation.y + Math.atan2(f.nx, f.nz) + Math.PI / 2, Math.PI / 2);
    }

    // Lift loop: once there is something to dye, and only between dips.
    const canLift = this.phase === 'fold' && !this.foldAnim && (this.recipe.folds.length > 0 || this.recipe.ties.length > 0) && this.oxidation >= 0.95;
    const loop = this.liftEntity.object3D!;
    if (canLift) {
      const c = centroid(outline);
      this.v1.set(c.x, top + 0.02, c.z);
      this.clothGroup.localToWorld(this.v1);
      loop.position.copy(this.v1);
      loop.rotation.set(0, this.workspace.rotation.y, 0);
      loop.visible = true;
    } else {
      loop.visible = false;
      loop.position.set(0, HIDDEN_Y, 0);
    }

    // Unfold tab: after at least one dip has fully oxidised.
    const canUnfold = this.phase === 'fold' && !this.foldAnim && this.recipe.dips > 0 && this.oxidation >= 0.95;
    const tab = this.unfoldEntity.object3D!;
    if (canUnfold) {
      let nearest = outline[0];
      for (const p of outline) if (p.z > nearest.z + 1e-6 || (Math.abs(p.z - nearest.z) < 1e-6 && p.x < nearest.x)) nearest = p;
      this.v1.set(nearest.x - 0.006, top + 0.008, nearest.z + 0.012);
      this.clothGroup.localToWorld(this.v1);
      tab.position.copy(this.v1);
      tab.rotation.set(0, this.workspace.rotation.y + Math.PI / 4, Math.PI / 2);
      tab.visible = true;
    } else {
      tab.visible = false;
      tab.position.set(0, HIDDEN_Y, 0);
    }
  }

  private pulseHandles(): void {
    const s = 1 + 0.12 * Math.sin(this.clock * 4.5);
    for (let i = 0; i < MAX_HANDLES; i++) {
      const obj = this.handleEntities[i].object3D!;
      if (obj.visible && !(this.foldAnim && this.handleSlots[i] === this.foldAnim.option)) obj.scale.setScalar(s);
    }
    const loop = this.liftEntity.object3D!;
    if (loop.visible) loop.scale.setScalar(1 + 0.08 * Math.sin(this.clock * 3.2));
    const tab = this.unfoldEntity.object3D!;
    if (tab.visible) tab.scale.setScalar(s);
  }
}

function easeInOut(x: number): number {
  const k = Math.min(1, Math.max(0, x));
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
}
