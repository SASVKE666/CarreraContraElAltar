/**
 * Objetos del mundo: anillos, power-ups, obstáculos (luces eléctricas, torre de
 * copas, araña de cristal, ramo-misil) y señal de advertencia.
 */
import { COLORS, FLOOR_Y, PickupType } from '../constants';
import { circle, drawHeart, drawText, ellipse, getHaloSprite, getSprite, ink, poly, rand01, rrect } from './core';

/* ------------------------------------------------------------------ */
/* Anillos                                                             */
/* ------------------------------------------------------------------ */

export function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, phase: number) {
  const spin = Math.abs(Math.cos(t * 4 + phase));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.max(0.28, spin), 1);
  // aro
  ctx.beginPath();
  ctx.arc(0, 3, 9.5, 0, Math.PI * 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.lineWidth = 4.2;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 3, 9.5, Math.PI * 1.05, Math.PI * 1.45);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#fff3b8';
  ctx.stroke();
  // diamante
  poly(ctx, [0, -15.5, 5.5, -10, 0, -3.5, -5.5, -10], '#dff6ff', 2.2);
  ctx.beginPath();
  ctx.moveTo(-5.5, -10);
  ctx.lineTo(5.5, -10);
  ink(ctx, null, 1.4);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Power-ups                                                           */
/* ------------------------------------------------------------------ */

const PICKUP_COLOR: Record<PickupType, string> = {
  shield: '#bfe3ff',
  magnet: '#ffd0da',
  turbo: '#ffe7a0',
};

/** Icono dentro de un círculo. `size` = radio. Sirve para el mundo y el HUD. */
export function drawPickupIcon(ctx: CanvasRenderingContext2D, type: PickupType, x: number, y: number, size = 21) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 21, size / 21);
  circle(ctx, 0, 0, 20, PICKUP_COLOR[type], 3.2);
  ctx.beginPath();
  ctx.arc(0, 0, 15.5, Math.PI * 1.1, Math.PI * 1.6);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = 'rgba(255,255,255,.9)';
  ctx.lineCap = 'round';
  ctx.stroke();

  if (type === 'shield') {
    // velo: corazón con encaje
    drawHeart(ctx, 0, 0.5, 11, COLORS.white, 2.6);
    ctx.strokeStyle = COLORS.rose;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -2.2, 3.2, Math.PI, 0);
    ctx.stroke();
  } else if (type === 'magnet') {
    // imán en U
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(0, 1, 9, Math.PI, 0);
    ctx.lineTo(9, 9);
    ctx.moveTo(-9, 1);
    ctx.lineTo(-9, 9);
    ctx.lineWidth = 10.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    ctx.lineWidth = 6.3;
    ctx.strokeStyle = COLORS.rose;
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(-12.2, 8, 6.4, 6.6);
    ctx.fillRect(5.8, 8, 6.4, 6.6);
    ctx.fillStyle = '#eef3ff';
    ctx.fillRect(-11, 9, 4, 4.6);
    ctx.fillRect(7, 9, 4, 4.6);
  } else {
    // luna de miel: luna creciente + estrella
    ctx.beginPath();
    ctx.arc(-1, 0, 11, -Math.PI * 0.62, Math.PI * 0.62, false);
    ctx.arc(4.5, 0, 9, Math.PI * 0.5, -Math.PI * 0.5, true);
    ctx.closePath();
    ink(ctx, COLORS.gold, 2.4);
    poly(ctx, [7, -9, 8.4, -5.8, 11.8, -5.5, 9.2, -3.4, 10, 0, 7, -2, 4, 0, 4.8, -3.4, 2.2, -5.5, 5.6, -5.8], '#fff6c8', 1.4);
  }
  ctx.restore();
}

export function drawPickup(ctx: CanvasRenderingContext2D, type: PickupType, x: number, y: number, t: number, phase: number) {
  const bob = Math.sin(t * 3 + phase) * 5;
  const pulse = 1 + Math.sin(t * 6 + phase) * 0.06;
  ctx.save();
  ctx.translate(x, y + bob);
  const g = ctx.createRadialGradient(0, 0, 16, 0, 0, 40);
  g.addColorStop(0, 'rgba(255,255,255,.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(pulse, pulse);
  drawPickupIcon(ctx, type, 0, 0, 22);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Luces eléctricas (zapper)                                           */
/* ------------------------------------------------------------------ */

function lampNode(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number) {
  const g = ctx.createRadialGradient(x, y, 3, x, y, 24);
  g.addColorStop(0, 'rgba(255,170,210,.8)');
  g.addColorStop(1, 'rgba(255,100,170,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, x, y, 11.5, COLORS.gold, 3);
  circle(ctx, x, y, 6, '#fff7d1', 2);
  // chispas
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const a = rand01(seed * 7 + i + Math.floor(t * 14)) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
    ctx.lineTo(x + Math.cos(a) * 21, y + Math.sin(a) * 21);
    ctx.stroke();
  }
}

export function drawZapper(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
  seed: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const n = Math.max(4, Math.round(len / 20));
  const frame = Math.floor(t * 18);
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const amp = i === 0 || i === n ? 0 : (rand01(seed * 13 + i * 3.1 + frame * 1.7) - 0.5) * 20;
    pts.push(x1 + dx * k + nx * amp, y1 + dy * k + ny * amp);
  }
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  path();
  ctx.lineWidth = 19;
  ctx.strokeStyle = 'rgba(42,20,32,.5)'; // base oscura para despegarlo del fondo
  ctx.stroke();
  path();
  ctx.lineWidth = 14;
  ctx.strokeStyle = 'rgba(255,90,160,.28)';
  ctx.stroke();
  path();
  ctx.lineWidth = 6.5;
  ctx.strokeStyle = '#ff8fc0';
  ctx.stroke();
  path();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
  lampNode(ctx, x1, y1, t, seed);
  lampNode(ctx, x2, y2, t, seed + 5);
}

/* ------------------------------------------------------------------ */
/* Torre de copas de champaña (suelo)                                  */
/* ------------------------------------------------------------------ */

export const GLASS_W = 26;
export const TOWER_ROW_H = 28;
const TOWER_BASE_H = 16;

export function towerHeight(rows: number) {
  return rows * TOWER_ROW_H + TOWER_BASE_H + 8;
}
export function towerWidth(rows: number) {
  return rows * GLASS_W + 20;
}

function glass(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // foot + stem
  ellipse(ctx, x + 13, y + 30, 8.5, 2.8, COLORS.white, 2.2);
  rrect(ctx, x + 11.8, y + 19, 2.6, 11, 1, COLORS.white, 2);
  // bowl
  ctx.beginPath();
  ctx.moveTo(x + 2.5, y + 2);
  ctx.quadraticCurveTo(x + 2.5, y + 20, x + 13, y + 20);
  ctx.quadraticCurveTo(x + 23.5, y + 20, x + 23.5, y + 2);
  ctx.closePath();
  ink(ctx, 'rgba(235,248,255,.95)', 2.4);
  // champagne
  ctx.beginPath();
  ctx.moveTo(x + 3.5, y + 8);
  ctx.lineTo(x + 22.5, y + 8);
  ctx.quadraticCurveTo(x + 22, y + 18.3, x + 13, y + 18.6);
  ctx.quadraticCurveTo(x + 4, y + 18.3, x + 3.5, y + 8);
  ctx.fillStyle = '#f7d36a';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (const [bx, by, r] of [
    [9, 13, 1.3],
    [14, 15, 1.1],
    [17, 11, 1.3],
  ]) {
    ctx.beginPath();
    ctx.arc(x + bx, y + by, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTower(ctx: CanvasRenderingContext2D, cx: number, rows: number) {
  const w = towerWidth(rows);
  const h = towerHeight(rows);
  const { sprite, pad } = getHaloSprite(`tower${rows}`, w, h, (c) => {
    const mid = w / 2;
    // mesa
    poly(c, [4, h - TOWER_BASE_H, w - 4, h - TOWER_BASE_H, w - 1, h - 1, 1, h - 1], COLORS.cream, 3);
    c.fillStyle = COLORS.gold;
    c.fillRect(6, h - TOWER_BASE_H + 1, w - 12, 4);
    // copas (de abajo hacia arriba para que las superiores queden delante)
    for (let r = rows - 1; r >= 0; r--) {
      const y = 4 + r * TOWER_ROW_H;
      const count = r + 1;
      const x0 = mid - (count * GLASS_W) / 2;
      for (let i = 0; i < count; i++) glass(c, x0 + i * GLASS_W, y);
    }
  });
  ctx.drawImage(sprite, cx - w / 2 - pad, FLOOR_Y - h - pad, w + pad * 2, h + pad * 2);
}

export function towerRects(cx: number, rows: number) {
  const h = towerHeight(rows);
  const top = FLOOR_Y - h;
  const rects: { x: number; y: number; w: number; h: number }[] = [
    { x: cx - towerWidth(rows) / 2 + 4, y: FLOOR_Y - TOWER_BASE_H, w: towerWidth(rows) - 8, h: TOWER_BASE_H },
  ];
  for (let r = 0; r < rows; r++) {
    const rw = (r + 1) * GLASS_W - 6;
    rects.push({ x: cx - rw / 2, y: top + 6 + r * TOWER_ROW_H, w: rw, h: TOWER_ROW_H + 2 });
  }
  return rects;
}

/* ------------------------------------------------------------------ */
/* Araña de cristal (techo)                                            */
/* ------------------------------------------------------------------ */

export const CHANDELIER_W = 96;
export const CHANDELIER_H = 112;

export function drawChandelier(ctx: CanvasRenderingContext2D, cx: number, ceilY: number, len: number, t: number) {
  const top = ceilY + len;
  // cadena (plateada, con brillo claro y resplandor de peligro: no se confunde con los dorados del fondo)
  ctx.lineCap = 'butt';
  const chain = (lw: number, color: string, dash?: number[]) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.setLineDash(dash ?? []);
    ctx.beginPath();
    ctx.moveTo(cx, ceilY - 4);
    ctx.lineTo(cx, top + 2);
    ctx.stroke();
  };
  chain(17, 'rgba(255,47,109,.3)');
  chain(12, 'rgba(255,92,141,.4)');
  chain(10, '#fff6e8');
  chain(7, COLORS.ink);
  chain(3.4, '#dfeaf5', [6, 4]);
  ctx.setLineDash([]);

  const { sprite, pad } = getHaloSprite('chandelier', CHANDELIER_W, CHANDELIER_H, (c) => {
    const m = CHANDELIER_W / 2;
    const SILVER = '#cfdcea';
    poly(c, [m - 9, 0, m + 9, 0, m + 6, 13, m - 6, 13], SILVER, 2.6);
    rrect(c, m - 3.5, 12, 7, 24, 2, SILVER, 2.4);
    ellipse(c, m, 36, 18, 9, SILVER, 2.6);
    // brazos
    c.beginPath();
    c.moveTo(m - 6, 40);
    c.quadraticCurveTo(m - 30, 40, m - 38, 56);
    c.moveTo(m + 6, 40);
    c.quadraticCurveTo(m + 30, 40, m + 38, 56);
    ink(c, null, 4.6);
    c.strokeStyle = SILVER;
    c.lineWidth = 2.2;
    c.stroke();
    // plato inferior
    ellipse(c, m, 62, 40, 11, SILVER, 2.8);
    ellipse(c, m, 60, 33, 5.5, '#f2f8ff', 0); // brillo del plato
    // velas
    for (let i = -2; i <= 2; i++) {
      const bx = m + i * 15;
      const by = 62 - 10 + Math.abs(i) * 1.5;
      rrect(c, bx - 3, by - 13, 6, 14, 2, COLORS.cream, 2);
    }
    // cristales
    for (let i = -4; i <= 4; i++) {
      const bx = m + i * 9.2;
      const L = 8 + (4 - Math.abs(i)) * 5.5;
      const yy = 72 + L;
      c.beginPath();
      c.moveTo(bx, 70);
      c.lineTo(bx, yy);
      ink(c, null, 1.6);
      poly(c, [bx, yy - 1, bx + 4.2, yy + 5.5, bx, yy + 13, bx - 4.2, yy + 5.5], '#8fdcff', 1.8);
      c.beginPath();
      c.moveTo(bx - 0.5, yy + 1);
      c.lineTo(bx - 2, yy + 5);
      ink(c, null, 1.2, '#ffffff');
    }
  });
  ctx.drawImage(sprite, cx - CHANDELIER_W / 2 - pad, top - pad, CHANDELIER_W + pad * 2, CHANDELIER_H + pad * 2);
  // llamas animadas
  for (let i = -2; i <= 2; i++) {
    const bx = cx + i * 15;
    const by = top + 62 - 10 + Math.abs(i) * 1.5 - 13;
    const f = 1 + Math.sin(t * 14 + i * 2) * 0.18;
    ctx.beginPath();
    ctx.moveTo(bx, by - 11 * f);
    ctx.quadraticCurveTo(bx + 5, by - 3, bx, by + 0.5);
    ctx.quadraticCurveTo(bx - 5, by - 3, bx, by - 11 * f);
    ink(ctx, '#ffb347', 1.6);
  }
}

export function chandelierRects(cx: number, ceilY: number, len: number) {
  const top = ceilY + len;
  return [
    { x: cx - 5, y: ceilY, w: 10, h: len + 36 },
    { x: cx - 40, y: top + 40, w: 80, h: 30 },
    { x: cx - 34, y: top + 70, w: 68, h: 40 },
  ];
}

/* ------------------------------------------------------------------ */
/* Ramo-misil                                                          */
/* ------------------------------------------------------------------ */

export const MISSILE_W = 92;
export const MISSILE_H = 46;

export function drawMissile(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const { sprite, pad } = getHaloSprite('bouquet', MISSILE_W, MISSILE_H, (c) => {
    // papel de envolver
    poly(c, [34, 8, 80, 23, 34, 38], COLORS.cream, 2.8);
    c.beginPath();
    c.moveTo(40, 15);
    c.lineTo(66, 23);
    c.moveTo(40, 31);
    c.lineTo(66, 23);
    ink(c, null, 1.6, '#e7c9a8');
    // lazo
    poly(c, [62, 23, 74, 14, 74, 32], COLORS.rose, 2.2);
    circle(c, 62, 23, 3.8, COLORS.roseDark, 2);
    // hojas
    ellipse(c, 30, 7, 10, 5, COLORS.green, 2.2, -0.4);
    ellipse(c, 30, 39, 10, 5, COLORS.green, 2.2, 0.4);
    // rosas
    circle(c, 18, 12, 9, COLORS.blush, 2.6);
    circle(c, 18, 34, 9, COLORS.blush, 2.6);
    circle(c, 20, 23, 13.5, COLORS.rose, 2.8);
    c.strokeStyle = COLORS.roseDark;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(20, 23, 7.5, 0.3, Math.PI * 1.6);
    c.stroke();
    c.beginPath();
    c.arc(20, 23, 3, 0.5, Math.PI * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(18, 12, 4, 0.3, Math.PI * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(18, 34, 4, 0.3, Math.PI * 1.5);
    c.stroke();
  });
  const wob = Math.sin(t * 22) * 0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(wob);
  // cintas ondeando
  ctx.strokeStyle = COLORS.rose;
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(MISSILE_W / 2 - 14, 0);
    ctx.quadraticCurveTo(MISSILE_W / 2 + 6, s * (6 + Math.sin(t * 20) * 3), MISSILE_W / 2 + 22, s * 12);
    ctx.stroke();
  }
  ctx.drawImage(sprite, -MISSILE_W / 2 - pad, -MISSILE_H / 2 - pad, MISSILE_W + pad * 2, MISSILE_H + pad * 2);
  ctx.restore();
}

export function missileRect(x: number, y: number) {
  return { x: x - 40, y: y - 15, w: 76, h: 30 };
}

/* ------------------------------------------------------------------ */
/* Advertencia de misil                                                */
/* ------------------------------------------------------------------ */

export function drawWarning(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, locked: boolean) {
  const blink = locked ? Math.floor(t * 14) % 2 === 0 : Math.floor(t * 6) % 2 === 0;
  const s = 1 + Math.sin(t * (locked ? 30 : 12)) * 0.1;
  ctx.save();
  if (locked) {
    ctx.strokeStyle = 'rgba(255,60,100,.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 12]);
    ctx.beginPath();
    ctx.moveTo(x - 24, y);
    ctx.lineTo(-20, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawHeart(ctx, 0, 0, 28, blink ? '#ff355f' : '#ffd1dc', 3.2);
  drawText(ctx, '!', 0, 10, 28, blink ? COLORS.white : COLORS.rose, { align: 'center', strokeW: 4 });
  ctx.restore();
}
