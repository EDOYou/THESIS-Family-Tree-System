import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TreeIndex } from "./data/types";
import { CARD_ASPECT, CARD_WIDTH, createPersonCard } from "./labels";
import type { TreeLayout } from "./layout";
import { buildTree, type TreePart } from "./treeModel";

const TAP_MAX_MOVE = 12; // px
const TAP_MAX_MS = 450;
const DOUBLE_TAP_MS = 320;
const SKY = "#0b1020";
const HIGHLIGHT = new THREE.Color("#ffcf70");

export interface SceneCallbacks {
  onSelect: (personId: string | null) => void;
  onInteract: () => void;
}

interface Tween {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  duration: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function starField(radius: number): THREE.Points {
  const positions: number[] = [];
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.8 + Math.random() * 0.2));
    if (v.y < -radius * 0.1) v.y = -v.y; // keep stars above the horizon
    positions.push(v.x, v.y, v.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: "#c9d6ff", size: 0.35, sizeAttenuation: true, fog: false }),
  );
}

function groundDisc(radius: number, y: number): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(46, 74, 52, 0.95)");
  gradient.addColorStop(0.55, "rgba(30, 48, 40, 0.6)");
  gradient.addColorStop(1, "rgba(11, 16, 32, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  return mesh;
}

export class FamilyTreeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private content = new THREE.Group();
  private cards = new Map<string, THREE.Sprite>();
  private parts: TreePart[] = [];
  private raycaster = new THREE.Raycaster();
  private homePos = new THREE.Vector3();
  private homeTarget = new THREE.Vector3();
  private tween: Tween | null = null;
  private selected: string | null = null;
  private down: { x: number; y: number; t: number } | null = null;
  private lastTap: { id: string | null; t: number } = { id: null, t: 0 };
  private index!: TreeIndex;
  private layout!: TreeLayout;

  constructor(
    private container: HTMLElement,
    index: TreeIndex,
    layout: TreeLayout,
    private callbacks: SceneCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(SKY);

    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.minDistance = 4;
    this.controls.minPolarAngle = Math.PI * 0.2;
    this.controls.maxPolarAngle = Math.PI * 0.62;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener("start", () => {
      this.tween = null;
      this.callbacks.onInteract();
    });

    this.scene.add(new THREE.HemisphereLight("#cfe0ff", "#2b2a1e", 1.1));
    const moon = new THREE.DirectionalLight("#ffffff", 1.4);
    moon.position.set(15, 30, 25);
    this.scene.add(moon);
    this.scene.add(starField(300));
    this.scene.add(this.content);

    this.setTree(index, layout, true);
    this.bindPointer();
    window.addEventListener("resize", () => this.resize());
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  /**
   * Replaces the people and branches, e.g. after an edit. The camera stays
   * where it is unless `frame` is set.
   */
  setTree(index: TreeIndex, layout: TreeLayout, frame = false) {
    this.index = index;
    this.layout = layout;
    this.content.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) {
        (material as THREE.MeshBasicMaterial).map?.dispose();
        material.dispose();
      }
    });
    this.content.clear();
    this.cards.clear();

    const tree = buildTree(index, layout);
    this.parts = tree.parts;
    this.content.add(tree.group);

    // Frame the whole tree, from the roots to the top generation, on any screen shape.
    const top = Math.max(layout.generations - 1, 0);
    const topY = layout.levelY(top) + 1.5;
    const bottomY = tree.groundY;
    const topRadius = layout.radiusAt(top);
    const halfTan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const fitHeight = ((topY - bottomY) * 1.15) / 2 / halfTan;
    const fitWidth = (topRadius * 2 * 1.1) / 2 / (halfTan * this.camera.aspect);
    const distance = topRadius + Math.max(fitHeight, fitWidth);
    this.homeTarget.set(0, (topY + bottomY) / 2, 0);
    this.homePos.set(0, this.homeTarget.y + (topY - bottomY) * 0.12, distance);
    this.controls.maxDistance = distance * 1.8;
    // Fade the far side of the crown so the front reads clearly.
    this.scene.fog = new THREE.Fog(SKY, distance, distance + topRadius * 2.5);
    this.content.add(groundDisc(topRadius * 1.4, bottomY - 0.35));

    for (const [id, node] of layout.nodes) {
      const card = createPersonCard(index.people.get(id)!);
      card.position.set(...node.position);
      card.userData.personId = id;
      card.renderOrder = 1;
      this.cards.set(id, card);
      this.content.add(card);
    }

    if (frame) {
      this.camera.position.copy(this.homePos);
      this.controls.target.copy(this.homeTarget);
    }
    this.select(this.selected && index.people.has(this.selected) ? this.selected : null);
  }

  private bindPointer() {
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.callbacks.onInteract();
    });
    el.addEventListener("pointerup", (e) => {
      const down = this.down;
      this.down = null;
      if (!down || !e.isPrimary) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const now = performance.now();
      if (moved > TAP_MAX_MOVE || now - down.t > TAP_MAX_MS) return;

      const id = this.pick(e.clientX, e.clientY);
      const isDouble = id !== null && this.lastTap.id === id && now - this.lastTap.t < DOUBLE_TAP_MS;
      this.lastTap = { id, t: now };
      this.callbacks.onSelect(id);
      if (isDouble && id) this.flyTo(id);
    });
  }

  private pick(clientX: number, clientY: number): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects([...this.cards.values()], false);
    return (hits[0]?.object.userData.personId as string | undefined) ?? null;
  }

  /** Highlights a person, their close family and the branches between them; null clears it. */
  select(id: string | null) {
    this.selected = id;
    const family = new Set<string>();
    if (id) {
      family.add(id);
      for (const map of [this.index.parents, this.index.children, this.index.partners]) {
        for (const relative of map.get(id) ?? []) family.add(relative);
      }
    }
    for (const [personId, card] of this.cards) {
      (card.material as THREE.SpriteMaterial).opacity = !id || family.has(personId) ? 1 : 0.25;
    }
    for (const part of this.parts) {
      const material = part.mesh.material as THREE.MeshStandardMaterial;
      const lit = id !== null && part.ids.includes(id);
      material.color.copy(lit ? HIGHLIGHT : part.baseColor);
      material.emissive.copy(lit ? HIGHLIGHT : new THREE.Color(0)).multiplyScalar(lit ? 0.35 : 0);
      material.opacity = !id || lit || part.ids.length === 0 ? 1 : 0.35;
    }
  }

  /** Smoothly moves the camera in front of a person. */
  flyTo(id: string) {
    const node = this.layout.nodes.get(id);
    if (!node) return;
    const target = new THREE.Vector3(...node.position);
    const outward = new THREE.Vector3(Math.sin(node.angle), 0.15, Math.cos(node.angle)).normalize();
    this.animate(target.clone().add(outward.multiplyScalar(9)), target);
  }

  home() {
    this.animate(this.homePos, this.homeTarget);
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on;
  }

  private animate(toPos: THREE.Vector3, toTarget: THREE.Vector3) {
    this.tween = {
      fromPos: this.camera.position.clone(),
      toPos: toPos.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: toTarget.clone(),
      start: performance.now(),
      duration: 900,
    };
  }

  private frame(time: number) {
    if (this.tween) {
      const t = Math.min(1, (time - this.tween.start) / this.tween.duration);
      const k = easeInOut(t);
      this.camera.position.lerpVectors(this.tween.fromPos, this.tween.toPos, k);
      this.controls.target.lerpVectors(this.tween.fromTarget, this.tween.toTarget, k);
      if (t >= 1) this.tween = null;
    }
    // Scale the selected card up a little so it stands out.
    for (const [id, card] of this.cards) {
      const goal = id === this.selected ? 1.35 : 1;
      const s = card.scale.x / CARD_WIDTH;
      const next = s + (goal - s) * 0.15;
      card.scale.set(CARD_WIDTH * next, CARD_WIDTH * next * CARD_ASPECT, 1);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
