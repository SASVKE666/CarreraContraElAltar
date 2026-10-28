/**
 * Fachada de la iglesia: es el decorado de la pantalla de inicio. El novio revienta la puerta,
 * sale corriendo y el muro se aleja con el scroll (como la pared del laboratorio en Jetpack Joyride).
 *
 * Coordenadas "locales": x = 0 es el centro de la puerta; y son coordenadas de pantalla (el piso está en FLOOR_Y).
 */
import { COLORS, FLOOR_Y } from '../constants';
import { circle, ellipse, getSprite, ink, poly, rand01, rrect } from './core';

export const DOOR_HALF_W = 88;
const SPRING_Y = FLOOR_Y - 190; // donde empieza el arco
const PEAK_Y = FLOOR_Y - 262; // punta del arco
const WALL_X0 = -780; // el muro empieza (a la izquierda) en este x local
const WALL_X1 = 345; // y termina (buttress a la derecha)
export const CHURCH_RIGHT = WALL_X1;
const WALL_W = WALL_X1 - WALL_X0;
const STONE = '#dcc6a8';
const STONE_DARK = '#b99d79';
const STONE_LIGHT = '#ecdcc4';
const WOOD = '#6d3d27';
const WOOD_DARK = '#4a2616';

/** Trazado del arco gótico (apuntado) de la puerta, centrado en cx */
function archPath(c: CanvasRenderingContext2D, cx: number, dw: number, base: number, spring: number, peak: number) {
  c.beginPath();
  c.moveTo(cx - dw, base);
  c.lineTo(cx - dw, spring);
  c.quadraticCurveTo(cx - dw, (spring + peak) / 2 + 6, cx, peak);
  c.quadraticCurveTo(cx + dw, (spring + peak) / 2 + 6, cx + dw, spring);
  c.lineTo(cx + dw, base);
  c.closePath();
}

/* ------------------------------------------------------------------ */
/* Muro                                                                */
/* ------------------------------------------------------------------ */

function lancet(c: CanvasRenderingContext2D, cx: number, top: number, bottom: number, hw: number) {
  // marco
  archPath(c, cx, hw + 7, bottom + 6, top + 44, top - 8);
  ink(c, STONE_LIGHT, 3.2);
  // vitral
  archPath(c, cx, hw, bottom, top + 44, top);
  const g = c.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, '#7fb6e8');
  g.addColorStop(0.55, '#8a74d8');
  g.addColorStop(1, '#d56aa8');
  c.fillStyle = g;
  c.fill();
  c.save();
  archPath(c, cx, hw, bottom, top + 44, top);
  c.clip();
  // cuarterones
  c.strokeStyle = 'rgba(42,20,32,.85)';
  c.lineWidth = 2;
  for (let y = top + 30; y < bottom; y += 34) {
    c.beginPath();
    c.moveTo(cx - hw, y);
    c.lineTo(cx + hw, y);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(cx, top);
  c.lineTo(cx, bottom);
  c.stroke();
  // brillos de colores
  for (let i = 0; i < 6; i++) {
    c.fillStyle = ['rgba(255,226,120,.55)', 'rgba(255,255,255,.35)', 'rgba(255,120,160,.45)'][i % 3];
    c.fillRect(cx - hw + 4 + (i % 2) * hw, top + 40 + i * 24, hw - 8, 14);
  }
  c.restore();
  archPath(c, cx, hw, bottom, top + 44, top);
  ink(c, null, 3);
  // alféizar
  rrect(c, cx - hw - 9, bottom + 3, hw * 2 + 18, 9, 3, STONE_LIGHT, 2.6);
}

function roseWindow(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  circle(c, cx, cy, r + 9, STONE_LIGHT, 3.4);
  circle(c, cx, cy, r, '#2a1420', 3);
  const cols = ['#e63e6d', '#f6c453', '#6fb4ee', '#ffffff', '#b08cf0', '#ff8fc0', '#7fe0a0', '#ffd9a0'];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, r - 3, a0, a1);
    c.closePath();
    ink(c, cols[i], 2.2);
  }
  // pétalos interiores
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    ellipse(c, cx + Math.cos(a) * (r * 0.52), cy + Math.sin(a) * (r * 0.52), r * 0.2, r * 0.11, 'rgba(255,255,255,.55)', 0, a);
  }
  circle(c, cx, cy, r * 0.26, COLORS.gold, 2.6);
  circle(c, cx, cy, r * 0.1, '#fff7d1', 1.6);
}

function lantern(c: CanvasRenderingContext2D, x: number, y: number) {
  const g = c.createRadialGradient(x, y, 2, x, y, 46);
  g.addColorStop(0, 'rgba(255,214,120,.55)');
  g.addColorStop(1, 'rgba(255,214,120,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, 46, 0, Math.PI * 2);
  c.fill();
  rrect(c, x - 3, y - 26, 6, 12, 2, COLORS.ink, 0);
  rrect(c, x - 11, y - 14, 22, 28, 5, '#ffe9a8', 3);
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y - 14);
  c.lineTo(x, y + 14);
  c.stroke();
  poly(c, [x - 13, y - 14, x + 13, y - 14, x, y - 24], COLORS.gold, 2.6);
}

function buttress(c: CanvasRenderingContext2D, cx: number) {
  const w = 52;
  poly(c, [cx - w / 2, FLOOR_Y, cx - w / 2, 90, cx - w / 2 + 6, 66, cx + w / 2 - 6, 66, cx + w / 2, 90, cx + w / 2, FLOOR_Y], STONE_LIGHT, 3.6);
  // sillares
  c.strokeStyle = 'rgba(138,108,79,.7)';
  c.lineWidth = 2;
  for (let y = 100; y < FLOOR_Y - 10; y += 34) {
    c.beginPath();
    c.moveTo(cx - w / 2 + 3, y);
    c.lineTo(cx + w / 2 - 3, y);
    c.stroke();
  }
  // remate
  poly(c, [cx - w / 2 - 6, 66, cx + w / 2 + 6, 66, cx, 36], STONE_DARK, 3.2);
}

function drawWallSprite(c: CanvasRenderingContext2D) {
  c.translate(-WALL_X0, 0); // x local -> x del sprite
  const g = c.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, '#cfb694');
  g.addColorStop(1, STONE);
  c.fillStyle = g;
  c.fillRect(WALL_X0, 0, WALL_W, FLOOR_Y);
  // sillares escalonados
  const rowH = 34;
  let row = 0;
  for (let y = 0; y < FLOOR_Y; y += rowH, row++) {
    const bw = 76;
    const off = (row % 2) * (bw / 2);
    for (let x = WALL_X0 - off; x < WALL_X1; x += bw) {
      const v = rand01(row * 91.7 + x * 0.173);
      if (v < 0.22) {
        c.fillStyle = `rgba(150,112,74,${0.1 + v * 0.35})`;
        c.fillRect(x + 1, y + 1, bw - 2, rowH - 2);
      } else if (v > 0.86) {
        c.fillStyle = 'rgba(255,248,230,.22)';
        c.fillRect(x + 1, y + 1, bw - 2, rowH - 2);
      }
      c.strokeStyle = 'rgba(112,82,54,.55)';
      c.lineWidth = 2;
      c.strokeRect(x, y, bw, rowH);
    }
  }
  // cornisa con modillones
  c.fillStyle = STONE_DARK;
  c.fillRect(WALL_X0, 78, WALL_W, 26);
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(WALL_X0, 78);
  c.lineTo(WALL_X1, 78);
  c.moveTo(WALL_X0, 104);
  c.lineTo(WALL_X1, 104);
  c.stroke();
  c.fillStyle = STONE_LIGHT;
  for (let x = WALL_X0 + 8; x < WALL_X1; x += 30) {
    c.beginPath();
    c.rect(x, 82, 16, 18);
    ink(c, STONE_LIGHT, 2);
  }
  // zócalo
  c.fillStyle = STONE_DARK;
  c.fillRect(WALL_X0, FLOOR_Y - 20, WALL_W, 20);
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(WALL_X0, FLOOR_Y - 20);
  c.lineTo(WALL_X1, FLOOR_Y - 20);
  c.stroke();

  // vitrales
  for (const x of [-210, 210, -420, -630]) lancet(c, x, 176, 348, 27);
  // rosetón
  roseWindow(c, 0, 142, 44);
  // farolas junto a la puerta
  lantern(c, -138, 300);
  lantern(c, 138, 300);
  // contrafuerte a la derecha (el muro termina aquí)
  buttress(c, WALL_X1 - 26);

  // marco de piedra de la puerta (el hueco se pinta aparte)
  archPath(c, 0, DOOR_HALF_W + 24, FLOOR_Y, SPRING_Y - 4, PEAK_Y - 30);
  ink(c, STONE_LIGHT, 3.6);
  c.save();
  archPath(c, 0, DOOR_HALF_W + 24, FLOOR_Y, SPRING_Y - 4, PEAK_Y - 30);
  c.clip();
  // dovelas
  c.strokeStyle = 'rgba(112,82,54,.8)';
  c.lineWidth = 2.4;
  for (let i = 0; i < 13; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    c.beginPath();
    c.moveTo(Math.cos(a) * (DOOR_HALF_W + 2), SPRING_Y - 4 + Math.sin(a) * (SPRING_Y - PEAK_Y) * 0.95);
    c.lineTo(Math.cos(a) * (DOOR_HALF_W + 24), SPRING_Y - 4 + Math.sin(a) * (SPRING_Y - PEAK_Y + 22));
    c.stroke();
  }
  c.restore();
}

/* ------------------------------------------------------------------ */
/* Puerta cerrada e interior                                           */
/* ------------------------------------------------------------------ */

const DOOR_H = FLOOR_Y - PEAK_Y; // alto del sprite de la puerta

function drawDoorSprite(c: CanvasRenderingContext2D) {
  const dw = DOOR_HALF_W;
  c.translate(dw, -PEAK_Y); // sprite: x local + dw, y de pantalla - PEAK_Y
  archPath(c, 0, dw, FLOOR_Y, SPRING_Y, PEAK_Y);
  c.save();
  c.clip();
  c.fillStyle = WOOD;
  c.fillRect(-dw, PEAK_Y, dw * 2, DOOR_H);
  // tablones
  for (let i = 0; i < 9; i++) {
    const x = -dw + (i / 9) * dw * 2;
    c.fillStyle = i % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,200,140,.08)';
    c.fillRect(x, PEAK_Y, (dw * 2) / 9, DOOR_H);
    c.strokeStyle = WOOD_DARK;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, PEAK_Y);
    c.lineTo(x, FLOOR_Y);
    c.stroke();
  }
  // herrajes
  for (const y of [SPRING_Y + 6, SPRING_Y + 78, FLOOR_Y - 34]) {
    c.fillStyle = '#34202c';
    c.fillRect(-dw, y - 7, dw * 2, 14);
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    c.strokeRect(-dw, y - 7, dw * 2, 14);
    for (let x = -dw + 14; x < dw; x += 26) {
      circle(c, x, y, 2.8, COLORS.gold, 1.4);
    }
  }
  // corazón tallado en cada hoja
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * dw * 0.5, SPRING_Y - 22);
    c.beginPath();
    c.moveTo(0, 10);
    c.bezierCurveTo(-18, -4, -10, -20, 0, -9);
    c.bezierCurveTo(10, -20, 18, -4, 0, 10);
    ink(c, COLORS.rose, 2.6);
    c.restore();
  }
  c.restore();
  // junta central y aldabas
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(0, PEAK_Y + 2);
  c.lineTo(0, FLOOR_Y);
  c.stroke();
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(s * 17, FLOOR_Y - 118, 9, 0, Math.PI * 2);
    ink(c, null, 4.4);
    c.strokeStyle = COLORS.gold;
    c.lineWidth = 2.4;
    c.stroke();
  }
  // corona de rosas en el centro
  c.beginPath();
  c.arc(0, SPRING_Y + 34, 30, 0, Math.PI * 2);
  c.lineWidth = 9;
  c.strokeStyle = COLORS.ink;
  c.stroke();
  c.lineWidth = 5.5;
  c.strokeStyle = COLORS.green;
  c.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    circle(c, Math.cos(a) * 30, SPRING_Y + 34 + Math.sin(a) * 30, 6.4, i % 2 ? COLORS.blush : COLORS.rose, 2);
  }
  poly(c, [-12, SPRING_Y + 62, 0, SPRING_Y + 52, 12, SPRING_Y + 62, 6, SPRING_Y + 78, -6, SPRING_Y + 78], COLORS.rose, 2.2);
  // borde del hueco
  archPath(c, 0, dw, FLOOR_Y, SPRING_Y, PEAK_Y);
  ink(c, null, 4.6);
}

function drawInsideSprite(c: CanvasRenderingContext2D) {
  const dw = DOOR_HALF_W;
  c.translate(dw, -PEAK_Y);
  archPath(c, 0, dw, FLOOR_Y, SPRING_Y, PEAK_Y);
  c.save();
  c.clip();
  const g = c.createLinearGradient(0, PEAK_Y, 0, FLOOR_Y);
  g.addColorStop(0, '#1c0613');
  g.addColorStop(0.65, '#4a1230');
  g.addColorStop(1, '#8a2a4a');
  c.fillStyle = g;
  c.fillRect(-dw, PEAK_Y, dw * 2, DOOR_H);
  // luz del altar al fondo
  const gl = c.createRadialGradient(0, FLOOR_Y - 110, 4, 0, FLOOR_Y - 110, 120);
  gl.addColorStop(0, 'rgba(255,226,150,.9)');
  gl.addColorStop(1, 'rgba(255,226,150,0)');
  c.fillStyle = gl;
  c.fillRect(-dw, PEAK_Y, dw * 2, DOOR_H);
  // bancas en perspectiva
  c.fillStyle = '#2b0f1f';
  for (const s of [-1, 1]) {
    poly(c, [s * 20, FLOOR_Y - 70, s * dw, FLOOR_Y - 120, s * dw, FLOOR_Y, s * 36, FLOOR_Y], '#2b0f1f', 0);
  }
  // alfombra roja
  poly(c, [-8, FLOOR_Y - 96, 8, FLOOR_Y - 96, 34, FLOOR_Y, -34, FLOOR_Y], '#c92c58', 0);
  c.strokeStyle = COLORS.gold;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-8, FLOOR_Y - 96);
  c.lineTo(-34, FLOOR_Y);
  c.moveTo(8, FLOOR_Y - 96);
  c.lineTo(34, FLOOR_Y);
  c.stroke();
  // velas
  for (const [x, y] of [
    [-52, FLOOR_Y - 100],
    [52, FLOOR_Y - 100],
    [-30, FLOOR_Y - 112],
    [30, FLOOR_Y - 112],
  ]) {
    c.fillStyle = '#fff4e0';
    c.fillRect(x - 2, y, 4, 10);
    c.fillStyle = '#ffb347';
    c.beginPath();
    c.ellipse(x, y - 3, 2.6, 5, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Borde irregular del hueco cuando la puerta ya voló en pedazos */
function drawBrokenFrame(c: CanvasRenderingContext2D) {
  const dw = DOOR_HALF_W;
  c.translate(dw + 40, -PEAK_Y + 40);
  // dientes de piedra rotos siguiendo el contorno real del arco
  const ctl = (SPRING_Y + PEAK_Y) / 2 + 6;
  const pt = (side: number, k: number): [number, number] => {
    const u = 1 - k;
    return [side * (u * u * dw + 2 * u * k * dw), u * u * SPRING_Y + 2 * u * k * ctl + k * k * PEAK_Y];
  };
  const N = 11;
  c.beginPath();
  c.moveTo(-dw, FLOOR_Y);
  c.lineTo(-dw, SPRING_Y);
  const jag = (i: number, side: number, k: number): [number, number] => {
    const [x, y] = pt(side, k);
    const o = (i % 2 ? 1 : -1) * (2 + rand01(i * 5.3 + side) * 8);
    return [x - side * o, y + o * 0.5];
  };
  for (let i = 1; i <= N; i++) {
    const [x, y] = jag(i, -1, i / N);
    c.lineTo(x, y);
  }
  for (let i = N - 1; i >= 0; i--) {
    const [x, y] = jag(i + 40, 1, i / N);
    c.lineTo(x, y);
  }
  c.lineTo(dw, SPRING_Y);
  c.lineTo(dw, FLOOR_Y);
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 5;
  c.lineJoin = 'round';
  c.stroke();
  // grietas que salen del arco hacia el muro
  c.strokeStyle = 'rgba(42,20,32,.8)';
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + 0.2 + (i / 8) * (Math.PI - 0.4);
    const r0 = dw + 6;
    const r1 = dw + 26 + rand01(i * 3.7) * 26;
    c.beginPath();
    c.moveTo(Math.cos(a) * r0, SPRING_Y + Math.sin(a) * (SPRING_Y - PEAK_Y + 6));
    c.lineTo(Math.cos(a) * (r0 + r1) * 0.55 + 4, SPRING_Y + Math.sin(a) * (SPRING_Y - PEAK_Y + 6 + r1) * 0.8);
    c.lineTo(Math.cos(a) * (r0 + r1) * 0.8 - 5, SPRING_Y + Math.sin(a) * (SPRING_Y - PEAK_Y + 10 + r1) * 0.95);
    c.stroke();
  }
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export interface ChurchState {
  /** Temblor horizontal de la puerta (px) */
  shake: number;
  /** 0..1: la puerta se abomba antes de reventar */
  bulge: number;
  /** La puerta ya voló en pedazos */
  blown: boolean;
  /** Segundos desde que reventó */
  blastT: number;
  t: number;
}

/** ¿Se ve algo de la fachada con la puerta en este x de pantalla? */
export const churchVisible = (doorX: number) => doorX + WALL_X1 > -10 && doorX + WALL_X0 < 960;

export function drawChurch(ctx: CanvasRenderingContext2D, doorX: number, o: ChurchState) {
  if (!churchVisible(doorX)) return;
  const wall = getSprite('church_wall', WALL_W, FLOOR_Y, drawWallSprite);
  ctx.drawImage(wall, doorX + WALL_X0, 0, WALL_W, FLOOR_Y);

  const dw = DOOR_HALF_W;
  if (!o.blown) {
    const door = getSprite('church_door', dw * 2, DOOR_H, drawDoorSprite);
    const sx = 1 + o.bulge * 0.035;
    ctx.save();
    ctx.translate(doorX + o.shake, PEAK_Y);
    ctx.scale(sx, 1);
    ctx.drawImage(door, -dw, 0, dw * 2, DOOR_H);
    ctx.restore();
  } else {
    const inside = getSprite('church_inside', dw * 2, DOOR_H, drawInsideSprite);
    ctx.drawImage(inside, doorX - dw, PEAK_Y, dw * 2, DOOR_H);
    // resplandor cálido que sale del interior
    const k = 0.55 + 0.1 * Math.sin(o.t * 6);
    const g = ctx.createRadialGradient(doorX, FLOOR_Y - 20, 6, doorX, FLOOR_Y - 20, 190);
    g.addColorStop(0, `rgba(255,214,140,${0.28 * k})`);
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.fillRect(doorX - 200, FLOOR_Y - 210, 400, 230);
    const frame = getSprite('church_broken', dw * 2 + 80, DOOR_H + 80, drawBrokenFrame);
    ctx.drawImage(frame, doorX - dw - 40, PEAK_Y - 40, dw * 2 + 80, DOOR_H + 80);
    // restos de las hojas colgando de las bisagras
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(doorX + s * (dw - 2), SPRING_Y + 20);
      ctx.rotate(s * (0.12 + Math.min(1, o.blastT * 2) * 0.1));
      poly(ctx, [0, 0, -s * 15, 6, -s * 11, 70, -s * 16, 110, -s * 3, 150, s * 3, 90], WOOD, 3);
      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 8, 12);
      ctx.lineTo(-s * 9, 130);
      ctx.stroke();
      ctx.restore();
    }
  }
  // arco de piedra y corona de rosas en la clave
  ctx.save();
  ctx.translate(doorX, PEAK_Y - 28);
  poly(ctx, [-12, 16, 12, 16, 8, -4, -8, -4], STONE_LIGHT, 3);
  ctx.restore();
}

/** Alfombra roja que sale por la puerta (se aleja con el muro) */
export function drawChurchCarpet(ctx: CanvasRenderingContext2D, doorX: number) {
  if (doorX > 960 || doorX + 300 < 0) return;
  const w = 300;
  const s = getSprite('church_carpet', w, 22, (c) => {
    poly(c, [0, 3, w - 16, 3, w, 19, 0, 19], '#c92c58', 3);
    c.strokeStyle = COLORS.gold;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, 7);
    c.lineTo(w - 12, 7);
    c.moveTo(0, 15);
    c.lineTo(w - 6, 15);
    c.stroke();
  });
  ctx.drawImage(s, doorX - 20, FLOOR_Y - 2, w, 22);
}
