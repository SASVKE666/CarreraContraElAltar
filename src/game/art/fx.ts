/**
 * Postproceso "cinematográfico" 2D: luz dinámica, sombras suaves, oclusión ambiental,
 * niebla, haces de luz, polvo y destellos, grano de película y gradación de color.
 *
 * Todo se hace con sprites pre-renderizados y mezclas de composición del canvas (nada de
 * filtros costosos), no toca el diseño de personajes ni objetos y es determinista: no usa el
 * generador aleatorio del juego, solo el tiempo y el scroll. La calidad se adapta sola según
 * los cuadros por segundo (o se fuerza con localStorage `novio_en_fuga_fx` = off | low | mid | high).
 */
import { CEIL_Y, FLOOR_Y, H, W } from '../constants';
import { getSprite } from './core';

type C = CanvasRenderingContext2D;

/* ------------------------------------------------------------------ */
/* Calidad adaptable                                                   */
/* ------------------------------------------------------------------ */

/** 0 = solo sombras y gradaciones baratas · 1 = + niebla, polvo, luces · 2 = todo */
export type FxTier = 0 | 1 | 2;
const KEY = 'novio_en_fuga_fx';
let tier: FxTier = 2;
let forced = false;
try {
  // en pantallas táctiles se empieza en calidad media (sube sola si va fluido)
  if (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) tier = 1;
} catch {
  /* sin matchMedia */
}
let lastNow = 0;
let ema = 16.7;
let slowFrames = 0;
let fastFrames = 0;

function readForced(): FxTier | null {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (v === 'off' || v === 'low') return 0;
    if (v === 'mid') return 1;
    if (v === 'high') return 2;
  } catch {
    /* sin almacenamiento */
  }
  return null;
}
const f0 = readForced();
if (f0 !== null) {
  tier = f0;
  forced = true;
}

export const fxTier = () => tier;

/** Se llama una vez por cuadro: baja la calidad si el juego va lento (y la sube si sobra) */
export function fxTick() {
  if (forced || typeof performance === 'undefined') return;
  const now = performance.now();
  const dt = now - lastNow;
  lastNow = now;
  if (dt <= 0 || dt > 250) return; // pausas / cambio de pestaña
  ema += (dt - ema) * 0.08;
  if (ema > 26) {
    slowFrames++;
    fastFrames = 0;
  } else if (ema < 18.5) {
    fastFrames++;
    slowFrames = 0;
  } else {
    slowFrames = 0;
    fastFrames = 0;
  }
  if (slowFrames > 90 && tier > 0) {
    tier = (tier - 1) as FxTier;
    slowFrames = 0;
    ema = 16.7;
  } else if (fastFrames > 1500 && tier < 2) {
    // mucho rato fluido: se prueba a subir otra vez
    tier = (tier + 1) as FxTier;
    fastFrames = 0;
  }
}

/* ------------------------------------------------------------------ */
/* Paletas por zona (índices de ZONE_DEFS: 0 salón, 1 jardín, 2 catedral) */
/* ------------------------------------------------------------------ */

interface Look {
  /** gradiente suave de gradación (arriba, abajo) */
  top: string;
  bottom: string;
  /** niebla */
  fog: [number, number, number];
  /** haces de luz y polvo */
  beam: [number, number, number];
  mote: string;
}
const LOOKS: Look[] = [
  { top: 'rgba(255,196,120,.55)', bottom: 'rgba(130,40,100,.38)', fog: [255, 190, 205], beam: [255, 214, 150], mote: '255,226,170' },
  { top: 'rgba(255,240,170,.55)', bottom: 'rgba(40,100,70,.34)', fog: [235, 255, 225], beam: [255, 245, 190], mote: '255,250,200' },
  { top: 'rgba(170,200,255,.5)', bottom: 'rgba(70,40,120,.4)', fog: [190, 200, 255], beam: [190, 215, 255], mote: '215,228,255' },
];
const look = (zone: number) => LOOKS[((zone % LOOKS.length) + LOOKS.length) % LOOKS.length];

/** Hash determinista en [0,1) */
function h01(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ------------------------------------------------------------------ */
/* Sprites                                                             */
/* ------------------------------------------------------------------ */

function glowSprite(rgb: string) {
  return getSprite(`fx_glow_${rgb}`, 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.25, `rgba(${rgb},.5)`);
    g.addColorStop(0.6, `rgba(${rgb},.14)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });
}

function shadowSprite() {
  return getSprite('fx_shadow', 128, 64, (c) => {
    c.save();
    c.translate(64, 32);
    c.scale(1, 0.5);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 64);
    g.addColorStop(0, 'rgba(24,6,22,.9)');
    g.addColorStop(0.55, 'rgba(24,6,22,.45)');
    g.addColorStop(1, 'rgba(24,6,22,0)');
    c.fillStyle = g;
    c.fillRect(-64, -64, 128, 128);
    c.restore();
  });
}

/** Oclusión ambiental: el techo y el piso oscurecen suavemente el espacio junto a ellos */
function aoSprite() {
  return getSprite('fx_ao', W, H, (c) => {
    const t = c.createLinearGradient(0, CEIL_Y - 4, 0, CEIL_Y + 84);
    t.addColorStop(0, 'rgba(22,4,22,.34)');
    t.addColorStop(1, 'rgba(22,4,22,0)');
    c.fillStyle = t;
    c.fillRect(0, CEIL_Y - 4, W, 90);
    const b = c.createLinearGradient(0, FLOOR_Y - 70, 0, FLOOR_Y + 2);
    b.addColorStop(0, 'rgba(22,4,22,0)');
    b.addColorStop(1, 'rgba(22,4,22,.3)');
    c.fillStyle = b;
    c.fillRect(0, FLOOR_Y - 70, W, 72);
  });
}

/** Gradación de color de la zona (se mezcla en 'soft-light') */
function gradeSprite(zone: number) {
  const l = look(zone);
  return getSprite(`fx_grade_${zone % LOOKS.length}`, W, H, (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, l.top);
    g.addColorStop(0.5, 'rgba(128,128,128,0)');
    g.addColorStop(1, l.bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });
}

/** Haces de luz diagonales desde arriba (se mezclan en 'screen' muy tenues) */
function beamsSprite(zone: number) {
  const l = look(zone);
  const [r, g, b] = l.beam;
  return getSprite(`fx_beams_${zone % LOOKS.length}`, W, H, (c) => {
    const beams: [number, number, number][] = [
      [120, 70, 0.9],
      [330, 54, 0.6],
      [560, 82, 1],
      [790, 60, 0.7],
    ];
    for (const [x, w, a] of beams) {
      const grad = c.createLinearGradient(x, CEIL_Y, x - 150, FLOOR_Y);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.2 * a})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(x, CEIL_Y);
      c.lineTo(x + w, CEIL_Y);
      c.lineTo(x + w - 190, FLOOR_Y);
      c.lineTo(x - 190 - w * 0.3, FLOOR_Y);
      c.closePath();
      c.fill();
    }
  });
}

const FOG_W = 720;
function fogSprite(zone: number) {
  const l = look(zone);
  const [r, g, b] = l.fog;
  return getSprite(`fx_fog_${zone % LOOKS.length}`, FOG_W, 150, (c) => {
    // manchones suaves que se repiten sin costura (se dibujan también desplazados ±FOG_W)
    for (let i = 0; i < 6; i++) {
      const cx = h01(i * 7.3 + zone) * FOG_W;
      const cy = 78 + (h01(i * 3.1 + 5) - 0.5) * 46;
      const rx = 150 + h01(i * 5.9) * 130;
      const ry = 30 + h01(i * 2.3) * 26;
      for (const off of [-FOG_W, 0, FOG_W]) {
        c.save();
        c.translate(cx + off, cy);
        c.scale(1, ry / rx);
        const grad = c.createRadialGradient(0, 0, 0, 0, 0, rx);
        grad.addColorStop(0, `rgba(${r},${g},${b},.34)`);
        grad.addColorStop(0.6, `rgba(${r},${g},${b},.13)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.fillStyle = grad;
        c.fillRect(-rx, -rx, rx * 2, rx * 2);
        c.restore();
      }
    }
  });
}

function moteSprite(rgb: string) {
  return getSprite(`fx_mote_${rgb}`, 32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.3, `rgba(${rgb},.55)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  });
}

function sparkSprite() {
  return getSprite('fx_spark', 40, 40, (c) => {
    c.translate(20, 20);
    const arm = (len: number, w: number, rot: number) => {
      c.save();
      c.rotate(rot);
      const g = c.createLinearGradient(-len, 0, len, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, 0, len, w, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };
    arm(19, 1.5, 0);
    arm(19, 1.5, Math.PI / 2);
    arm(9, 1.1, Math.PI / 4);
    arm(9, 1.1, -Math.PI / 4);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 7);
    g.addColorStop(0, 'rgba(255,255,255,.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(-7, -7, 14, 14);
  });
}

const GRAIN_W = 320;
const GRAIN_H = 180;
function grainSprite() {
  return getSprite('fx_grain', GRAIN_W, GRAIN_H, (c) => {
    const cv = c.canvas;
    const id = c.createImageData(cv.width, cv.height);
    let s = 1234567;
    for (let i = 0; i < id.data.length; i += 4) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const v = 96 + ((s >>> 24) % 128); // ruido alrededor del gris medio
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    c.putImageData(id, 0, 0);
  });
}

/* ------------------------------------------------------------------ */
/* Sombras suaves                                                      */
/* ------------------------------------------------------------------ */

/** Sombra de contacto suave bajo algo que está a `height` px sobre el piso */
export function softShadow(ctx: C, x: number, height: number, rx: number, strength = 1) {
  const k = Math.max(0.22, 1 - Math.max(0, height) / 330); // más lejos del piso: más difusa y tenue
  const w = rx * 2.3 * (1 + (1 - k) * 0.5);
  const h = w * 0.28 * (1 + (1 - k) * 0.4);
  ctx.save();
  ctx.globalAlpha = Math.min(1, 0.75 * k * strength);
  ctx.drawImage(shadowSprite(), x - w / 2, FLOOR_Y + 12 - h / 2, w, h);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Ambiente (detrás de personajes y objetos)                           */
/* ------------------------------------------------------------------ */

/** Oclusión, haces de luz y niebla: se dibuja justo encima del decorado */
export function drawAmbientBack(ctx: C, zone: number, t: number, scroll: number) {
  ctx.drawImage(aoSprite(), 0, 0, W, H);
  if (tier < 1) return;
  // haces de luz que respiran
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.45);
  ctx.drawImage(beamsSprite(zone), 0, 0, W, H);
  ctx.restore();
  // niebla baja en dos capas con parallax
  const fog = fogSprite(zone);
  for (let layer = 0; layer < 2; layer++) {
    const speed = layer ? 0.34 : 0.17;
    const y = FLOOR_Y - 118 + layer * 26 + Math.sin(t * 0.35 + layer * 2) * 5;
    const off = -(((scroll * speed + t * (7 + layer * 5)) % FOG_W) + FOG_W) % FOG_W;
    ctx.save();
    ctx.globalAlpha = layer ? 0.4 : 0.3;
    for (let x = off; x < W; x += FOG_W) ctx.drawImage(fog, x, y, FOG_W, 150);
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ */
/* Luces dinámicas                                                     */
/* ------------------------------------------------------------------ */

export type LightColor = 'warm' | 'gold' | 'pink' | 'orange' | 'white' | 'cyan';
const LIGHT_RGB: Record<LightColor, string> = {
  warm: '255,214,150',
  gold: '255,224,120',
  pink: '255,110,160',
  orange: '255,160,70',
  white: '255,255,255',
  cyan: '150,225,255',
};

export interface Light {
  x: number;
  y: number;
  r: number;
  color: LightColor;
  a: number;
}

/** Resplandores aditivos: se dibujan en el espacio del mundo (con el temblor de cámara) */
export function drawLights(ctx: C, lights: Light[], t: number) {
  if (tier < 1 || !lights.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    const flick = 1 + Math.sin(t * 9 + i * 1.7) * 0.06;
    const r = l.r * flick;
    ctx.globalAlpha = Math.min(1, l.a);
    ctx.drawImage(glowSprite(LIGHT_RGB[l.color]), l.x - r, l.y - r, r * 2, r * 2);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Partículas sutiles: polvo y destellos                               */
/* ------------------------------------------------------------------ */

export function drawAtmosphere(ctx: C, zone: number, t: number, scroll: number) {
  if (tier < 1) return;
  const l = look(zone);
  const motes = tier === 2 ? 34 : 16;
  const mote = moteSprite(l.mote);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < motes; i++) {
    const depth = 0.35 + h01(i * 1.7) * 0.65; // más cerca = más grande, rápida y suave
    const span = W + 60;
    const x = ((((h01(i * 3.9) * span * 1.6 - scroll * 0.55 * depth - t * 9 * depth) % span) + span) % span) - 30;
    const y = CEIL_Y + 26 + h01(i * 5.3 + 2) * (FLOOR_Y - CEIL_Y - 60) + Math.sin(t * 0.7 * depth + i) * 9;
    const tw = 0.55 + 0.45 * Math.sin(t * (0.8 + h01(i) * 1.4) + i * 2.1);
    const size = 5 + depth * depth * 15; // profundidad de campo: los cercanos salen desenfocados
    ctx.globalAlpha = (depth > 0.8 ? 0.2 : 0.3) * tw * depth;
    ctx.drawImage(mote, x - size / 2, y - size / 2, size, size);
  }
  // destellos
  const spark = sparkSprite();
  const nSpark = tier === 2 ? 9 : 4;
  for (let i = 0; i < nSpark; i++) {
    const span = W + 80;
    const x = ((((h01(i * 9.1 + 40) * span * 1.4 - scroll * 0.4 - t * 6) % span) + span) % span) - 40;
    const y = CEIL_Y + 34 + h01(i * 4.7 + 9) * (FLOOR_Y - CEIL_Y - 110);
    const ph = (t * (0.5 + h01(i * 2.9) * 0.5) + h01(i * 6.1)) % 1;
    const tw = Math.pow(Math.max(0, Math.sin(ph * Math.PI)), 6); // destello breve
    if (tw < 0.02) continue;
    const s = 12 + tw * 14;
    ctx.globalAlpha = tw * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ph * 1.2);
    ctx.drawImage(spark, -s / 2, -s / 2, s, s);
    ctx.restore();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Gradación final                                                     */
/* ------------------------------------------------------------------ */

/**
 * Gradación de color y contraste + grano de película (en pantalla completa, antes del HUD).
 * Con corte de zona (`cutX` > 0) la gradación cambia a la derecha del corte, igual que el fondo.
 */
export function drawGrade(ctx: C, zone: number, zoneFrom: number, cutX: number, t: number) {
  ctx.save();
  // tinte cálido arriba / frío-oscuro abajo, según la zona
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  if (cutX > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cutX, H);
    ctx.clip();
    ctx.drawImage(gradeSprite(zoneFrom), 0, 0, W, H);
    ctx.restore();
    ctx.beginPath();
    ctx.rect(cutX, 0, W - cutX, H);
    ctx.clip();
  }
  ctx.drawImage(gradeSprite(zone), 0, 0, W, H);
  ctx.restore();

  if (tier >= 2) {
    // más contraste y saturación equilibrada: la imagen mezclada consigo misma en 'overlay'
    const cv = ctx.canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.17;
    ctx.drawImage(cv, 0, 0);
    ctx.restore();

    // grano de película (cambia cada par de cuadros)
    const grain = grainSprite();
    const f = Math.floor(t * 30);
    const ox = -h01(f * 1.3) * GRAIN_W;
    const oy = -h01(f * 2.9 + 1) * GRAIN_H;
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.06;
    for (let y = oy; y < H; y += GRAIN_H) for (let x = ox; x < W; x += GRAIN_W) ctx.drawImage(grain, x, y, GRAIN_W, GRAIN_H);
    ctx.restore();
  }
}
