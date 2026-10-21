import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection, Geometry, Position } from "geojson";
import countriesTopo from "world-atlas/countries-110m.json";
import type { Residence } from "../data/types";

const TEX_W = 2048;
const TEX_H = 1024;
const OCEAN = "#10224a";
const LAND = "#2f6f5e";
const HOME = "#ffcf70";

const topology = countriesTopo as unknown as Topology;
const countries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>;

function drawRing(ctx: CanvasRenderingContext2D, ring: Position[]) {
  // Unwrap longitudes so rings crossing the 180° line stay continuous,
  // then draw again shifted by a full turn to cover the other edge.
  const lngs: number[] = [];
  ring.forEach(([lng], i) => {
    let value = lng;
    if (i > 0) {
      const prev = lngs[i - 1];
      while (value - prev > 180) value -= 360;
      while (value - prev < -180) value += 360;
    }
    lngs.push(value);
  });
  const offsets = [0];
  if (Math.min(...lngs) < -180) offsets.push(360);
  if (Math.max(...lngs) > 180) offsets.push(-360);
  for (const offset of offsets) {
    ring.forEach(([, lat], i) => {
      const x = ((lngs[i] + offset + 180) / 360) * TEX_W;
      const y = ((90 - lat) / 180) * TEX_H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
}

/** Equirectangular map texture with one country highlighted. */
function paintMap(canvas: HTMLCanvasElement, highlight?: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = OCEAN;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * TEX_W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TEX_H);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * TEX_H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TEX_W, y);
    ctx.stroke();
  }

  for (const country of countries.features) {
    const geometry = country.geometry;
    if (!geometry) continue;
    const polygons =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    ctx.beginPath();
    for (const polygon of polygons) for (const ring of polygon) drawRing(ctx, ring);
    const isHome = highlight !== undefined && country.properties?.name === highlight;
    ctx.fillStyle = isHome ? HOME : LAND;
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(8, 16, 36, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** Unit vector for a latitude/longitude, matching three.js sphere UVs. */
function insideRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Name of the country at a point, as used for highlighting. */
export function countryAt(lat: number, lng: number): string | undefined {
  for (const country of countries.features) {
    const geometry = country.geometry;
    if (!geometry) continue;
    const polygons =
      geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
    for (const [outer, ...holes] of polygons) {
      if (insideRing(lng, lat, outer) && !holes.some((hole) => insideRing(lng, lat, hole))) {
        return country.properties?.name;
      }
    }
  }
  return undefined;
}

export function latLngToVector(lat: number, lng: number, radius = 1): THREE.Vector3 {
  const phi = ((lng + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return new THREE.Vector3(
    -Math.cos(phi) * Math.sin(theta) * radius,
    Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
  );
}

/**
 * A small spinning globe for the biography panel. `show` turns it to face
 * a place and marks it with a pulsing beacon.
 */
export class Globe {
  readonly element: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  private controls: OrbitControls;
  private earth = new THREE.Group();
  private mapCanvas = document.createElement("canvas");
  private mapTexture: THREE.CanvasTexture;
  private pin = new THREE.Group();
  private pulse: THREE.Mesh;
  private turn: { from: THREE.Quaternion; to: THREE.Quaternion; start: number } | null = null;
  private running = false;
  private sphere: THREE.Mesh;
  private picker: ((place: { lat: number; lng: number; country?: string }) => void) | null = null;

  constructor() {
    this.element = document.createElement("canvas");
    this.element.className = "globe";
    this.renderer = new THREE.WebGLRenderer({ canvas: this.element, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.mapCanvas.width = TEX_W;
    this.mapCanvas.height = TEX_H;
    paintMap(this.mapCanvas);
    this.mapTexture = new THREE.CanvasTexture(this.mapCanvas);
    this.mapTexture.colorSpace = THREE.SRGBColorSpace;
    this.mapTexture.anisotropy = 4;

    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 48),
      new THREE.MeshStandardMaterial({ map: this.mapTexture, roughness: 1 }),
    );
    this.earth.add(this.sphere);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 48, 32),
      new THREE.MeshBasicMaterial({ color: "#5aa0ff", transparent: true, opacity: 0.12, side: THREE.BackSide }),
    );
    this.scene.add(glow, this.earth);

    // Beacon: a dot, a short beam and a ring that keeps expanding and fading.
    const gold = new THREE.MeshBasicMaterial({ color: HOME });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 12), gold);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 8), gold);
    beam.position.y = 0.11;
    this.pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.045, 32),
      new THREE.MeshBasicMaterial({ color: HOME, transparent: true, side: THREE.DoubleSide }),
    );
    this.pulse.rotation.x = -Math.PI / 2;
    this.pin.add(dot, beam, this.pulse);
    this.pin.visible = false;
    this.earth.add(this.pin);

    this.scene.add(new THREE.AmbientLight("#ffffff", 1.6));
    const sun = new THREE.DirectionalLight("#ffffff", 1.2);
    sun.position.set(2, 1, 3);
    this.scene.add(sun);

    this.camera.position.set(0, 0, 3.6);
    this.controls = new OrbitControls(this.camera, this.element);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.rotateSpeed = 0.5;

    // A tap (not a drag) on the globe picks a place when picking is on.
    let down: { x: number; y: number } | null = null;
    this.element.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
    this.element.addEventListener("pointerup", (e) => {
      if (!down || !this.picker || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const rect = this.element.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, this.camera);
      const uv = raycaster.intersectObject(this.sphere)[0]?.uv;
      if (!uv) return;
      const lat = Math.round((uv.y - 0.5) * 180 * 1000) / 1000;
      const lng = Math.round((uv.x * 360 - 180) * 1000) / 1000;
      this.picker({ lat, lng, country: countryAt(lat, lng) });
    });
  }

  /** Lets the editor pick a place by tapping the globe; null turns it off. */
  setPicker(picker: ((place: { lat: number; lng: number; country?: string }) => void) | null) {
    this.picker = picker;
    this.element.classList.toggle("picking", picker !== null);
  }

  /** Turns the globe to the place and starts animating; hides the pin without coordinates. */
  show(residence: Residence | undefined) {
    paintMap(this.mapCanvas, residence?.country);
    this.mapTexture.needsUpdate = true;
    this.controls.reset();

    const { lat, lng } = residence ?? {};
    if (lat === undefined || lng === undefined) {
      this.pin.visible = false;
    } else {
      const surface = latLngToVector(lat, lng);
      this.pin.position.copy(surface);
      this.pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surface.clone().normalize());
      this.pin.visible = true;
      // Rotate so the place faces the viewer, tilted slightly so the beam shows.
      const azimuth = Math.atan2(surface.x, surface.z);
      const target = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(THREE.MathUtils.degToRad(lat) - 0.25, -azimuth, 0, "XYZ"),
      );
      this.turn = { from: this.earth.quaternion.clone(), to: target, start: performance.now() };
    }
    this.start();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.renderer.setAnimationLoop((time) => this.frame(time));
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  private frame(time: number) {
    const width = this.element.clientWidth;
    const height = this.element.clientHeight;
    if (width && height && (this.element.width !== Math.floor(width * this.renderer.getPixelRatio()))) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
    if (this.turn) {
      const t = Math.min(1, (time - this.turn.start) / 1400);
      const k = 1 - Math.pow(1 - t, 3);
      this.earth.quaternion.slerpQuaternions(this.turn.from, this.turn.to, k);
      if (t >= 1) this.turn = null;
    } else if (!this.pin.visible) {
      this.earth.rotation.y += 0.003;
    }
    const phase = (time % 1600) / 1600;
    this.pulse.scale.setScalar(1 + phase * 4);
    (this.pulse.material as THREE.MeshBasicMaterial).opacity = 1 - phase;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
