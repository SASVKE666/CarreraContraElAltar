/**
 * Utilidades de dibujo compartidas: fábrica de canvas, caché de sprites,
 * helpers de contorno y texto con borde.
 */
import { COLORS } from '../constants';

export const FONT_DISPLAY = '"Titan One", "Arial Black", Impact, system-ui, sans-serif';

type CanvasFactory = (w: number, h: number) => HTMLCanvasElement;

let factory: CanvasFactory = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/** Permite inyectar otra implementación de canvas (p. ej. pruebas fuera del navegador) */
export function setCanvasFactory(f: CanvasFactory) {
  factory = f;
  spriteCache.clear();
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  return factory(w, h);
}

let renderScale = 1;
const spriteCache = new Map<string, HTMLCanvasElement>();

/** Escala de resolución para los sprites pre-renderizados (normalmente devicePixelRatio) */
export function setRenderScale(s: number) {
  if (s !== renderScale) {
    renderScale = s;
    spriteCache.clear();
  }
}
export function getRenderScale() {
  return renderScale;
}

/** Pre-renderiza un dibujo una sola vez y lo reutiliza con drawImage */
export function getSprite(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement {
  let c = spriteCache.get(key);
  if (!c) {
    c = makeCanvas(Math.ceil(w * renderScale), Math.ceil(h * renderScale));
    const ctx = c.getContext('2d')!;
    ctx.scale(renderScale, renderScale);
    draw(ctx);
    spriteCache.set(key, c);
  }
  return c;
}

/**
 * Sprite con contorno de "peligro": un brillo rosado suave + un borde claro y fino alrededor de la silueta.
 * Hace que los obstáculos se separen del fondo sin importar los colores de este.
 * Devuelve el canvas (más grande que `w`x`h` por `pad` en cada lado): dibújalo en (x - pad, y - pad).
 */
export function getHaloSprite(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  pad = 7
): { sprite: HTMLCanvasElement; pad: number } {
  const sprite = getSprite(key + '#halo', w + pad * 2, h + pad * 2, (c) => {
    const s = renderScale;
    const iw = Math.ceil(w * s);
    const ih = Math.ceil(h * s);
    const inner = makeCanvas(iw, ih);
    const ictx = inner.getContext('2d')!;
    ictx.scale(s, s);
    draw(ictx);
    const fw = Math.ceil((w + pad * 2) * s);
    const fh = Math.ceil((h + pad * 2) * s);
    const layer = (r: number, color: string, alpha: number) => {
      const t = makeCanvas(fw, fh);
      const tctx = t.getContext('2d')!;
      const n = 20;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        tctx.drawImage(inner, pad * s + Math.cos(a) * r * s, pad * s + Math.sin(a) * r * s);
      }
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = color;
      tctx.fillRect(0, 0, fw, fh);
      c.globalAlpha = alpha;
      c.drawImage(t, 0, 0, w + pad * 2, h + pad * 2);
      c.globalAlpha = 1;
    };
    layer(pad - 0.5, '#ff2f6d', 0.32); // resplandor de peligro
    layer(pad * 0.62, '#ff5c8d', 0.38);
    layer(3.2, '#fff6e8', 1); // borde claro
    c.drawImage(inner, pad, pad, w, h);
  });
  return { sprite, pad };
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ruido pseudoaleatorio determinista en [0,1) */
export function rand01(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Rellena y contornea el trazado actual con el estilo "cartoon" del juego */
export function ink(ctx: CanvasRenderingContext2D, fill: string | null, lw = 3, stroke: string = COLORS.ink) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | null, lw = 3) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ink(ctx, fill, lw);
}

export function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string | null,
  lw = 3,
  rot = 0
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ink(ctx, fill, lw);
}

export function rrect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | null,
  lw = 3
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ink(ctx, fill, lw);
}

export function poly(ctx: CanvasRenderingContext2D, pts: number[], fill: string | null, lw = 3) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ink(ctx, fill, lw);
}

export function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.55, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.55, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  ctx.closePath();
}

export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string, lw = 2.5) {
  heartPath(ctx, x, y, s);
  ink(ctx, fill, lw);
}

export interface TextOpts {
  align?: CanvasTextAlign;
  stroke?: string;
  strokeW?: number;
  baseline?: CanvasTextBaseline;
  font?: string;
  alpha?: number;
}

/** Texto con contorno grueso, estilo arcade */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string = COLORS.cream,
  o: TextOpts = {}
) {
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.font = `${size}px ${o.font ?? FONT_DISPLAY}`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = o.strokeW ?? Math.max(3, size / 5);
  ctx.strokeStyle = o.stroke ?? COLORS.ink;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}
