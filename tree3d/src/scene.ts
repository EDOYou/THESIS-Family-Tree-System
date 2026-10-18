import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { TreeIndex } from "./data/types";
import { CARD_ASPECT, CARD_WIDTH, createPersonCard } from "./labels";
import type { TreeLayout } from "./layout";

const TAP_MAX_MOVE = 12; // px
const TAP_MAX_MS = 450;
const DOUBLE_TAP_MS = 320;

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

export class FamilyTreeScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private cards = new Map<string, THREE.Sprite>();
  private links: { mesh: THREE.Mesh; ids: string[] }[] = [];
  private raycaster = new THREE.Raycaster();
  private homePos: THREE.Vector3;
  private homeTarget = new THREE.Vector3(0, 0, 0);
  private tween: Tween | null = null;
  private selected: string | null = null;
  private down: { x: number; y: number; t: number } | null = null;
  private lastTap: { id: string | null; t: number } = { id: null, t: 0 };

  constructor(
    private container: HTMLElement,
    private index: TreeIndex,
    private layout: TreeLayout,
    private callbacks: SceneCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color("#0b1020");

    // Back the camera off until the whole tree fits, on landscape or portrait screens.
    const aspect = container.clientWidth / container.clientHeight;
    const fov = 50;
    const halfTan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const treeHeight = layout.levelY(0) - layout.levelY(layout.generations - 1) + 2;
    const fitHeight = (treeHeight * 1.2) / 2 / halfTan;
    const fitWidth = (layout.radius * 2 * 1.1) / 2 / (halfTan * aspect);
    const distance = layout.radius + Math.max(fitHeight, fitWidth);
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 500);
    this.homePos = new THREE.Vector3(0, treeHeight * 0.1, distance);
    // Fade the far side of the cylinder so the front reads clearly.
    this.scene.fog = new THREE.Fog("#0b1020", distance, distance + layout.radius * 2.5);
    this.camera.position.copy(this.homePos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(this.homeTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.minDistance = 4;
    this.controls.maxDistance = distance * 2;
    this.controls.minPolarAngle = Math.PI * 0.2;
    this.controls.maxPolarAngle = Math.PI * 0.8;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener("start", () => {
      this.tween = null;
      this.callbacks.onInteract();
    });

    this.buildScene();
    this.bindPointer();
    window.addEventListener("resize", () => this.resize());
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  private buildScene() {
    const { layout, index } = this;
    this.scene.add(new THREE.AmbientLight("#ffffff", 0.9));
    const sun = new THREE.DirectionalLight("#ffffff", 1.2);
    sun.position.set(10, 20, 15);
    this.scene.add(sun);

    // A faint trunk and one ring per generation give the tree a shape.
    const top = layout.levelY(0) + 2;
    const bottom = layout.levelY(layout.generations - 1) - 2;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.6, top - bottom, 24),
      new THREE.MeshStandardMaterial({ color: "#3a2f4f", transparent: true, opacity: 0.6 }),
    );
    trunk.position.y = (top + bottom) / 2;
    this.scene.add(trunk);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: "#2a3566", transparent: true, opacity: 0.5 });
    for (let g = 0; g < layout.generations; g++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(layout.radius, 0.03, 8, 128), ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = layout.levelY(g) - 0.9;
      this.scene.add(ring);
    }

    for (const [id, node] of layout.nodes) {
      const card = createPersonCard(index.people.get(id)!);
      card.position.set(...node.position);
      card.userData.personId = id;
      this.cards.set(id, card);
      this.scene.add(card);
    }

    const point = (id: string) => new THREE.Vector3(...layout.nodes.get(id)!.position);
    const parentMaterial = new THREE.MeshBasicMaterial({ color: "#7c8cff", transparent: true, opacity: 0.85 });
    const partnerMaterial = new THREE.MeshBasicMaterial({ color: "#ffcf70", transparent: true, opacity: 0.9 });

    // One curve per child, starting from the middle of the parents' couple bar
    // (or from the single parent's card) and landing on top of the child's card.
    for (const [childId, parentIds] of index.parents) {
      const from = parentIds
        .map(point)
        .reduce((sum, p) => sum.add(p), new THREE.Vector3())
        .divideScalar(parentIds.length);
      if (parentIds.length === 1) from.y -= 0.45;
      const to = point(childId).add(new THREE.Vector3(0, 0.45, 0));
      const midY = (from.y + to.y) / 2;
      const curve = new THREE.CubicBezierCurve3(
        from,
        new THREE.Vector3(from.x, midY, from.z),
        new THREE.Vector3(to.x, midY, to.z),
        to,
      );
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.035, 6), parentMaterial.clone());
      this.links.push({ mesh, ids: [...parentIds, childId] });
      this.scene.add(mesh);
    }

    const drawn = new Set<string>();
    for (const [id, partnerIds] of index.partners) {
      for (const partnerId of partnerIds) {
        const key = [id, partnerId].sort().join("|");
        if (drawn.has(key) || !layout.nodes.has(id) || !layout.nodes.has(partnerId)) continue;
        drawn.add(key);
        // Bar between the two cards' inner edges, so it never crosses a name.
        const a = point(id);
        const b = point(partnerId);
        const inset = b.clone().sub(a).normalize().multiplyScalar(CARD_WIDTH / 2 - 0.05);
        const curve = new THREE.LineCurve3(a.add(inset), b.sub(inset));
        const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 4, 0.06, 6), partnerMaterial.clone());
        this.links.push({ mesh, ids: [id, partnerId] });
        this.scene.add(mesh);
      }
    }
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

  /** Highlights a person and their immediate family; null clears it. */
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
      const material = card.material as THREE.SpriteMaterial;
      material.opacity = !id || family.has(personId) ? 1 : 0.25;
    }
    for (const { mesh, ids } of this.links) {
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = !id || ids.includes(id) ? 0.9 : 0.12;
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

  get selectedId() {
    return this.selected;
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
