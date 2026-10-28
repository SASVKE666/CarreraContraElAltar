/**
 * Vehículos de boda y regalo. Cada vehículo se dibuja en dos capas para que el novio
 * quede sentado dentro: primero `drawVehicleBack`, luego el novio, y al final
 * `drawVehicleFront` (que tapa sus piernas).
 *
 * Coordenadas locales: origen en el centro del vehículo (el mismo punto que usa el
 * motor para colocarlo: x = GROOM_X, y = cy), mirando a la derecha (+X).
 */
import { COLORS, type VehicleKind } from '../constants';
import { circle, clamp, drawHeart, ellipse, ink, poly, rrect } from './core';

export interface VehicleAnim {
  t: number;
  /** 1 justo al aletear/saltar, baja a 0 */
  pulse: number;
  /** Ángulo acumulado de las ruedas */
  wheel: number;
  /** Velocidad vertical (para inclinar el vehículo) */
  vy: number;
  /** Se está apoyando en el piso (limusina) */
  grounded: boolean;
}

const WHITE = '#fffaf2';
const PINK = '#ffb3cc';
const PINK_DARK = '#f27fa6';

/* ------------------------------------------------------------------ */
/* Paletas (skins)                                                     */
/* ------------------------------------------------------------------ */

interface SwanPal { body: string; accent: string; accentDark: string; beak: string; seam: string; wing: string; wingFar: string; crown: string; heart: string }
interface LimoPal { body: string; stripe: string; seat: string; bow: string; bowDark: string; sign: string; signText: string; glass: string; burger?: boolean }
interface CupidPal { shell: string; rib: string; wing: string; wingLine: string; quiver: string; heart: string; edge: string; wheel: string }

const SWAN_SKINS: Record<string, SwanPal> = {
  classic: { body: WHITE, accent: PINK, accentDark: PINK_DARK, beak: '#ffa84a', seam: '#f2cfdd', wing: '#f5c3d4', wingFar: '#d9638c', crown: COLORS.gold, heart: COLORS.rose },
  bubblegum: { body: '#ffd1e3', accent: '#ff6fa5', accentDark: '#e0457f', beak: '#ffd24a', seam: '#f7a8c6', wing: '#ff9cc0', wingFar: '#b82f62', crown: COLORS.gold, heart: '#fffaf2' },
  ice: { body: '#eaf8ff', accent: '#8fd3f4', accentDark: '#4fa9d8', beak: '#ffb35a', seam: '#bfe3f3', wing: '#a8d8ee', wingFar: '#2f84b3', crown: '#fffaf2', heart: '#4fa9d8' },
  midnight: { body: '#4a4880', accent: '#25234d', accentDark: '#1a1938', beak: '#ffd24a', seam: '#6a68a8', wing: '#7573c4', wingFar: '#8a88dc', crown: COLORS.gold, heart: '#ffd24a' },
  gold: { body: '#ffe27a', accent: '#e9a82a', accentDark: '#b87912', beak: '#ff8a3d', seam: '#f0c24a', wing: '#e9b83a', wingFar: '#8a5a0a', crown: '#fffaf2', heart: '#fffaf2' },
};
const LIMO_SKINS: Record<string, LimoPal> = {
  classic: { body: WHITE, stripe: COLORS.gold, seat: COLORS.rose, bow: COLORS.rose, bowDark: COLORS.roseDark, sign: 'RECIÉN CASADOS', signText: COLORS.roseDark, glass: 'rgba(190,230,255,.75)' },
  candy: { body: '#ffc4dc', stripe: '#fffaf2', seat: '#ff7aa8', bow: '#fffaf2', bowDark: '#ff7aa8', sign: 'DULCE AMOR', signText: '#c2406f', glass: 'rgba(190,230,255,.75)' },
  taxi: { body: '#ffd21f', stripe: '#1d1b24', seat: '#3a3a48', bow: '#1d1b24', bowDark: '#fffaf2', sign: 'TAXI', signText: '#1d1b24', glass: 'rgba(190,230,255,.75)' },
  burger: { body: '#e9a23b', stripe: '#6ccf4a', seat: '#6ccf4a', bow: '#e0453a', bowDark: '#a82a22', sign: '', signText: '', glass: 'rgba(190,230,255,.75)', burger: true },
  midnight: { body: '#3a3858', stripe: '#c9a8ff', seat: '#6b4fa8', bow: '#c9a8ff', bowDark: '#8a63d8', sign: 'MEDIANOCHE', signText: '#e8d9ff', glass: 'rgba(60,70,120,.85)' },
  gold: { body: '#ffe08a', stripe: '#fffaf2', seat: '#e9a82a', bow: '#e9a82a', bowDark: '#b87912', sign: 'ORO PURO', signText: '#8a5a0a', glass: 'rgba(190,230,255,.75)' },
};
const CUPID_SKINS: Record<string, CupidPal> = {
  classic: { shell: '#9bd7ff', rib: '#6cb7ee', wing: WHITE, wingLine: '#cfe6f5', quiver: COLORS.goldDark, heart: COLORS.rose, edge: COLORS.gold, wheel: COLORS.gold },
  rose: { shell: '#ffb3cc', rib: '#f27fa6', wing: WHITE, wingLine: '#f5c3d4', quiver: COLORS.goldDark, heart: '#fffaf2', edge: COLORS.gold, wheel: COLORS.gold },
  jade: { shell: '#8fe3c0', rib: '#46b88c', wing: '#e9fff6', wingLine: '#a6e3c8', quiver: '#2f8f6a', heart: COLORS.rose, edge: COLORS.gold, wheel: COLORS.gold },
  pumpkin: { shell: '#ffa24d', rib: '#e4731a', wing: '#fff0d6', wingLine: '#ffcf8f', quiver: '#5a2f95', heart: '#fffaf2', edge: '#6a3fb0', wheel: '#7a4cc2' },
  gold: { shell: '#ffe27a', rib: '#e9a82a', wing: '#fffaf2', wingLine: '#f0d27a', quiver: '#b87912', heart: COLORS.rose, edge: '#fffaf2', wheel: '#e9a82a' },
};

/** Dos colores representativos de una skin (para las muestras de la tienda) */
export function vehicleSkinSwatch(kind: VehicleKind, key: string): [string, string] {
  if (kind === 'swan') {
    const c = SWAN_SKINS[key] ?? SWAN_SKINS.classic;
    return [c.body, c.accent];
  }
  if (kind === 'limo') {
    const c = LIMO_SKINS[key] ?? LIMO_SKINS.classic;
    return [c.body, c.stripe];
  }
  const c = CUPID_SKINS[key] ?? CUPID_SKINS.classic;
  return [c.shell, c.rib];
}

/** Ids de skin disponibles para cada vehículo */
export const VEHICLE_SKIN_KEYS: Record<VehicleKind, string[]> = {
  swan: Object.keys(SWAN_SKINS),
  limo: Object.keys(LIMO_SKINS),
  cupid: Object.keys(CUPID_SKINS),
};

/* ------------------------------------------------------------------ */
/* Cisne inflable                                                      */
/* ------------------------------------------------------------------ */

function swanWing(ctx: CanvasRenderingContext2D, a: VehicleAnim, far: boolean, c: SwanPal) {
  // 1 = recién aleteó (alas arriba) -> baja hasta reposar
  const ang = (far ? 0.25 : 0.1) + (a.pulse > 0 ? -1.15 * a.pulse : 0) + Math.sin(a.t * 6 + (far ? 1.3 : 0)) * 0.05;
  ctx.save();
  ctx.translate(-10 + (far ? -6 : 0), 6);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-8, -20, -34, -26, -48, -14);
  ctx.bezierCurveTo(-38, -10, -30, -6, -22, 0);
  ctx.bezierCurveTo(-30, 4, -24, 8, -12, 8);
  ctx.closePath();
  ink(ctx, far ? c.accentDark : c.body, 3);
  ctx.strokeStyle = far ? c.wingFar : c.wing;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.quadraticCurveTo(-26, -10, -40, -12);
  ctx.moveTo(-12, 3);
  ctx.quadraticCurveTo(-24, -1, -32, -4);
  ctx.stroke();
  ctx.restore();
}

function swanBack(ctx: CanvasRenderingContext2D, a: VehicleAnim, c: SwanPal) {
  swanWing(ctx, a, true, c);
  // cola
  poly(ctx, [-30, 12, -48, 0, -44, 12, -50, 18, -34, 24], c.accent, 3);
}

function swanFront(ctx: CanvasRenderingContext2D, a: VehicleAnim, c: SwanPal) {
  // cuello (trazo grueso con contorno)
  const neck = () => {
    ctx.beginPath();
    ctx.moveTo(20, 14);
    ctx.bezierCurveTo(40, 12, 40, -10, 30, -22);
  };
  neck();
  ctx.lineCap = 'round';
  ctx.lineWidth = 17;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  neck();
  ctx.lineWidth = 11;
  ctx.strokeStyle = c.body;
  ctx.stroke();
  // cuerpo inflable
  ellipse(ctx, -2, 16, 35, 18, c.body, 3.2);
  // costuras y brillo
  ctx.strokeStyle = c.seam;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-2, 16, 24, 11, 0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-14, 12, 15, Math.PI * 1.15, Math.PI * 1.55);
  ctx.stroke();
  // franja rosa
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-2, 16, 35, 18, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = c.accent;
  ctx.fillRect(-40, 21, 80, 14);
  ctx.restore();
  ellipse(ctx, -2, 16, 35, 18, null, 3.2);
  // válvula de aire
  rrect(ctx, -22, 0, 7, 5, 2, COLORS.gold, 2);
  // corazón
  drawHeart(ctx, 14, 19, 8, c.heart, 2.2);
  // cabeza
  circle(ctx, 31, -27, 11, c.body, 3);
  poly(ctx, [39, -31, 52, -25, 39, -21], c.beak, 2.6);
  circle(ctx, 34, -30, 2.4, COLORS.ink, 0);
  circle(ctx, 34.8, -30.8, 0.8, COLORS.white, 0);
  ellipse(ctx, 30, -23, 3.4, 2, 'rgba(255,90,130,.55)', 0);
  // coronita
  poly(ctx, [24, -37, 26, -44, 29, -38, 32, -45, 35, -38, 38, -44, 38, -37], c.crown, 2);
  swanWing(ctx, a, false, c);
}

/* ------------------------------------------------------------------ */
/* Limusina "Recién Casados"                                           */
/* ------------------------------------------------------------------ */

function can(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  rrect(ctx, -4.5, -1, 9, 11, 2, '#dfe8ef', 2);
  ctx.fillStyle = COLORS.rose;
  ctx.fillRect(-4.5, 3, 9, 3.5);
  ctx.restore();
}

function limoBack(ctx: CanvasRenderingContext2D, a: VehicleAnim, c: LimoPal) {
  // latas colgando del parachoques
  const swing = Math.sin(a.t * 9) * 0.25 + (a.grounded ? 0 : -0.5);
  const ends: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const len = 18 + i * 12;
    const ang = Math.PI * 0.62 + swing * (1 + i * 0.25) + Math.sin(a.t * 7 + i * 1.3) * 0.12;
    const ex = -54 + Math.cos(ang) * len;
    const ey = 20 + Math.sin(ang) * len * 0.8;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-54, 20);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ends.push([ex, ey]);
  }
  ends.forEach(([ex, ey], i) => can(ctx, ex, ey + 3, i * 0.6 + Math.sin(a.t * 8 + i) * 0.4));
  // respaldo del asiento trasero
  rrect(ctx, -34, -18, 13, 26, 5, c.seat, 3);
}

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
  circle(ctx, x, y, 14.5, '#2b2233', 3);
  circle(ctx, x, y, 8.5, '#dfe8ef', 2.2);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
  }
  ctx.restore();
  circle(ctx, x, y, 3, COLORS.gold, 1.8);
}

function limoBodyPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-54, 6);
  ctx.quadraticCurveTo(-56, -2, -48, -2);
  ctx.lineTo(24, -2);
  ctx.quadraticCurveTo(34, -3, 40, 2);
  ctx.lineTo(50, 6);
  ctx.quadraticCurveTo(56, 8, 56, 16);
  ctx.lineTo(56, 24);
  ctx.quadraticCurveTo(56, 29, 50, 29);
  ctx.lineTo(-48, 29);
  ctx.quadraticCurveTo(-56, 29, -56, 22);
  ctx.closePath();
}

/** Carrocería de hamburguesa: pan, lechuga, queso, carne y pan de abajo */
function burgerBody(ctx: CanvasRenderingContext2D, c: LimoPal) {
  limoBodyPath(ctx);
  ctx.save();
  ctx.clip();
  // pan de arriba con brillo y semillas de ajonjolí
  ctx.fillStyle = c.body;
  ctx.fillRect(-60, -6, 120, 17);
  ctx.fillStyle = 'rgba(255,238,190,.55)';
  ctx.beginPath();
  ctx.ellipse(-8, 0, 40, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff4d0';
  for (const [x, y, r] of [[-44, 3, 0.4], [-32, 6, -0.5], [-18, 3, 0.3], [-4, 6.5, -0.2], [10, 3.5, 0.5], [26, 6, -0.4], [40, 5, 0.3]] as const) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.3, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // lechuga ondulada
  ctx.fillStyle = c.stripe;
  ctx.beginPath();
  ctx.moveTo(-60, 9);
  for (let x = -60; x <= 60; x += 6) ctx.lineTo(x, 9 + (Math.round((x + 60) / 6) % 2 ? 4.5 : 0.5));
  ctx.lineTo(60, 16);
  ctx.lineTo(-60, 16);
  ctx.closePath();
  ctx.fill();
  // queso derretido con gotas
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(-60, 14, 120, 3.2);
  for (const x of [-38, -6, 22, 44]) {
    ctx.beginPath();
    ctx.moveTo(x - 4, 16.5);
    ctx.lineTo(x + 4, 16.5);
    ctx.lineTo(x, 23);
    ctx.closePath();
    ctx.fill();
  }
  // carne
  ctx.fillStyle = '#6b3a22';
  ctx.fillRect(-60, 17, 120, 6);
  ctx.fillStyle = '#4b2616';
  for (const x of [-48, -26, -2, 18, 36]) ctx.fillRect(x, 19, 6, 1.6);
  // pan de abajo
  ctx.fillStyle = '#d8932f';
  ctx.fillRect(-60, 23, 120, 10);
  ctx.restore();
  // contorno de toda la carrocería y líneas de separación
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.6;
  for (const y of [9.5, 16.5, 23]) {
    ctx.beginPath();
    ctx.moveTo(-55, y);
    ctx.lineTo(55, y);
    ctx.stroke();
  }
  limoBodyPath(ctx);
  ink(ctx, null, 3.2);
}

function limoFront(ctx: CanvasRenderingContext2D, a: VehicleAnim, c: LimoPal) {
  // carrocería
  if (c.burger) {
    burgerBody(ctx, c);
  } else {
    limoBodyPath(ctx);
    ink(ctx, c.body, 3.2);
    // franja y detalles
    ctx.fillStyle = c.stripe;
    ctx.fillRect(-55, 12, 110, 4);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-55, 12, 110, 4);
    // letrero (en la franja libre sobre las ruedas)
    ctx.fillStyle = c.signText;
    ctx.font = 'bold 6.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.sign, -15, 8.5);
  }
  // faro y moño del capó
  circle(ctx, 52, 11, 5, '#fff3b0', 2);
  poly(ctx, [36, 0, 28, -6, 28, 6], c.bow, 2);
  poly(ctx, [36, 0, 44, -6, 44, 6], c.bow, 2);
  circle(ctx, 36, 0, 2.6, c.bowDark, 1.6);
  // parabrisas
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(22, -22);
  ctx.lineTo(27, -22);
  ctx.lineTo(27, -2);
  ctx.closePath();
  ink(ctx, c.glass, 2.6);
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(17, -6);
  ctx.lineTo(21, -17);
  ctx.stroke();
  wheel(ctx, -32, 24.5, a.wheel);
  wheel(ctx, 32, 24.5, a.wheel);
}

/* ------------------------------------------------------------------ */
/* Carroza de Cupido                                                   */
/* ------------------------------------------------------------------ */

function featherWing(ctx: CanvasRenderingContext2D, flapA: number, scale: number, c: CupidPal) {
  ctx.save();
  ctx.rotate(flapA);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-6, -22, -36, -34, -56, -20);
  ctx.bezierCurveTo(-50, -14, -46, -10, -40, -8);
  ctx.bezierCurveTo(-46, -4, -40, 2, -30, 2);
  ctx.bezierCurveTo(-34, 8, -26, 12, -14, 10);
  ctx.closePath();
  ink(ctx, c.wing, 3);
  ctx.strokeStyle = c.wingLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.quadraticCurveTo(-28, -14, -48, -16);
  ctx.moveTo(-10, 4);
  ctx.quadraticCurveTo(-26, -2, -38, -4);
  ctx.stroke();
  ctx.restore();
}

function cupidBack(ctx: CanvasRenderingContext2D, a: VehicleAnim, c: CupidPal) {
  // alas
  ctx.save();
  ctx.translate(-26, -10);
  featherWing(ctx, -0.35 + Math.sin(a.t * 5) * 0.2 - a.pulse * 0.5, 1.15, c);
  ctx.restore();
  // carcaj con flechas
  ctx.save();
  ctx.translate(-40, 2);
  ctx.rotate(-0.25);
  for (let i = -1; i <= 1; i++) {
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(i * 5, 2);
    ctx.lineTo(i * 7, -22);
    ctx.stroke();
    drawHeart(ctx, i * 7, -25, 5, COLORS.rose, 1.6);
  }
  rrect(ctx, -9, -2, 18, 22, 4, c.quiver, 2.6);
  ctx.restore();
}

function cupidFront(ctx: CanvasRenderingContext2D, a: VehicleAnim, c: CupidPal) {
  // rueda (debajo de la concha)
  circle(ctx, -2, 31, 13, c.wheel, 3);
  ctx.save();
  ctx.translate(-2, 31);
  ctx.rotate(a.wheel);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
  }
  ctx.restore();
  circle(ctx, -2, 31, 3.5, COLORS.roseDark, 1.8);
  // concha
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.quadraticCurveTo(-48, 26, -22, 31);
  ctx.lineTo(20, 31);
  ctx.quadraticCurveTo(50, 26, 50, -2);
  ctx.quadraticCurveTo(56, -16, 44, -22);
  ctx.quadraticCurveTo(44, -8, 32, 2);
  ctx.closePath();
  ink(ctx, c.shell, 3.2);
  // nervaduras
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = c.rib;
  ctx.lineWidth = 2.2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(2 + i * 4, 31);
    ctx.lineTo(2 + i * 15, 0);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  ctx.fillRect(-48, 2, 100, 5);
  ctx.restore();
  // borde dorado
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.lineTo(32, 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = c.edge;
  ctx.stroke();
  drawHeart(ctx, 6, 18, 9, c.heart, 2.4);
  // arco de Cupido en el frente
  ctx.beginPath();
  ctx.arc(46, -10, 11, -Math.PI * 0.5, Math.PI * 0.5, false);
  ctx.lineWidth = 5.5;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = c.edge;
  ctx.stroke();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(46, -21);
  ctx.lineTo(46, 1);
  ctx.stroke();
  // destellos
  const s = (Math.sin(a.t * 8) + 1) / 2;
  ctx.fillStyle = `rgba(255,255,255,${0.5 + s * 0.5})`;
  ctx.beginPath();
  ctx.arc(-34, 8, 2 + s * 1.2, 0, Math.PI * 2);
  ctx.fill();
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export function drawVehicleBack(ctx: CanvasRenderingContext2D, kind: VehicleKind, x: number, y: number, a: VehicleAnim, skin = 'classic') {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'swan') swanBack(ctx, a, SWAN_SKINS[skin] ?? SWAN_SKINS.classic);
  else if (kind === 'limo') limoBack(ctx, a, LIMO_SKINS[skin] ?? LIMO_SKINS.classic);
  else cupidBack(ctx, a, CUPID_SKINS[skin] ?? CUPID_SKINS.classic);
  ctx.restore();
}

export function drawVehicleFront(ctx: CanvasRenderingContext2D, kind: VehicleKind, x: number, y: number, a: VehicleAnim, skin = 'classic') {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'swan') swanFront(ctx, a, SWAN_SKINS[skin] ?? SWAN_SKINS.classic);
  else if (kind === 'limo') limoFront(ctx, a, LIMO_SKINS[skin] ?? LIMO_SKINS.classic);
  else cupidFront(ctx, a, CUPID_SKINS[skin] ?? CUPID_SKINS.classic);
  ctx.restore();
}

/** Inclinación del vehículo según su velocidad vertical (en radianes) */
export function vehicleTilt(kind: VehicleKind, a: VehicleAnim): number {
  if (kind === 'limo') return a.grounded ? 0 : clamp(a.vy * 0.0004, -0.18, 0.2);
  if (kind === 'swan') return clamp(a.vy * 0.0005, -0.22, 0.28);
  return clamp(a.vy * 0.0002, -0.1, 0.1);
}

/** Vehículo solo (sin novio): para el HUD y el garaje. `size` = ancho aproximado en px */
export function drawVehicleIcon(ctx: CanvasRenderingContext2D, kind: VehicleKind, x: number, y: number, size: number, t = 0, skin = 'classic') {
  const base = kind === 'limo' ? 116 : 96;
  const k = size / base;
  const a: VehicleAnim = { t, pulse: 0, wheel: t * 6, vy: 0, grounded: true };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(0, kind === 'swan' ? -6 : kind === 'limo' ? -12 : -9);
  drawVehicleBack(ctx, kind, 0, 0, a, skin);
  drawVehicleFront(ctx, kind, 0, 0, a, skin);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Regalo de boda                                                      */
/* ------------------------------------------------------------------ */

export function drawGift(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, phase: number) {
  const bob = Math.sin(t * 3 + phase) * 5;
  const wob = Math.sin(t * 5 + phase) * 0.07;
  ctx.save();
  ctx.translate(x, y + bob);
  // resplandor
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
  g.addColorStop(0, 'rgba(255,240,170,.75)');
  g.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(wob);
  // caja
  rrect(ctx, -19, -9, 38, 28, 4, COLORS.rose, 3);
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(-15, -5, 8, 20);
  // tapa
  rrect(ctx, -22, -17, 44, 11, 4, '#ff7fa8', 3);
  // listón
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(-4, -17, 8, 36);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(-4, -17, 8, 36);
  // moño
  ellipse(ctx, -9, -22, 9, 6, COLORS.gold, 2.6, -0.5);
  ellipse(ctx, 9, -22, 9, 6, COLORS.gold, 2.6, 0.5);
  circle(ctx, 0, -20, 3.6, COLORS.goldDark, 2);
  // destellos
  for (let i = 0; i < 3; i++) {
    const k = (t * 1.3 + i / 3 + phase) % 1;
    const a = i * 2.1 + phase;
    const r = 26 + k * 10;
    const sx = Math.cos(a) * r;
    const sy = Math.sin(a) * r * 0.8 - 6;
    ctx.fillStyle = `rgba(255,255,255,${1 - k})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.4 * (1 - k) + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
