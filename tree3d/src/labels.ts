import * as THREE from "three";
import { lifespan, type Person } from "./data/types";

const WIDTH = 512;
const HEIGHT = 192;

/** Card size in world units. */
export const CARD_WIDTH = 2.2;
export const CARD_ASPECT = HEIGHT / WIDTH;

function initials(person: Person): string {
  return person.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function draw(canvas: HTMLCanvasElement, person: Person, photo?: HTMLImageElement) {
  const ctx = canvas.getContext("2d")!;
  const deceased = Boolean(person.death);
  const accent = person.gender === "F" ? "#f2a7c3" : person.gender === "M" ? "#8ec5ff" : "#c7c9d9";

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  roundRect(ctx, 6, 6, WIDTH - 12, HEIGHT - 12, 40);
  ctx.fillStyle = deceased ? "rgba(28, 32, 48, 0.92)" : "rgba(20, 28, 54, 0.94)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = accent;
  ctx.stroke();

  // Portrait circle: photo if we have one, initials otherwise.
  const cx = 96;
  const cy = HEIGHT / 2;
  const r = 66;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  if (photo) {
    ctx.clip();
    const scale = Math.max((r * 2) / photo.width, (r * 2) / photo.height);
    const w = photo.width * scale;
    const h = photo.height * scale;
    ctx.drawImage(photo, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = "#0b1020";
    ctx.font = "600 56px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(person), cx, cy + 2);
  }
  ctx.restore();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText(fitText(ctx, person.givenName ?? person.displayName, WIDTH - 200), 184, 86);
  ctx.fillStyle = "#c9d2f0";
  ctx.font = "400 30px system-ui, sans-serif";
  ctx.fillText(fitText(ctx, person.familyName ?? "", WIDTH - 200), 184, 124);
  ctx.fillStyle = "#8f9bc4";
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillText(`${lifespan(person)}${deceased ? "  ✝" : ""}`, 184, 160);
}

/** A camera-facing name card. The photo is drawn in once it loads. */
export function createPersonCard(person: Person): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  draw(canvas, person);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(CARD_WIDTH, CARD_WIDTH * CARD_ASPECT, 1);

  if (person.photoUrl) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      draw(canvas, person, img);
      texture.needsUpdate = true;
    };
    img.src = person.photoUrl;
  }
  return sprite;
}
