/**
 * Fondos con parallax. Cada zona tiene 4 capas pre-renderizadas que se repiten
 * en mosaico: lejana, media, techo y piso.
 */
import { CEIL_Y, COLORS, FLOOR_Y, H, W } from '../constants';
import { circle, ellipse, getSprite, ink, makeCanvas, poly, rand01, rrect } from './core';

interface Layer {
  key: string;
  tileW: number;
  y: number;
  h: number;
  speed: number;
  /** Profundidad de campo: 0..1 = cuánto se desenfoca (solo capas lejanas) */
  blur?: number;
  draw: (c: CanvasRenderingContext2D) => void;
}

interface ZoneDef {
  far: Layer;
  mid: Layer;
  ceil: Layer;
  floor: Layer;
}

type C = CanvasRenderingContext2D;

/* ------------------------------------------------------------------ */
/* Zona 0 — Salón de Fiestas                                           */
/* ------------------------------------------------------------------ */

function salonFar(c: C) {
  const tw = 480;
  const g = c.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, '#45102c');
  g.addColorStop(1, '#8a2347');
  c.fillStyle = g;
  c.fillRect(0, 0, tw, H);
  // papel tapiz con rayas
  c.fillStyle = 'rgba(255,255,255,.045)';
  for (let x = 0; x < tw; x += 48) c.fillRect(x, 0, 22, FLOOR_Y);
  // zócalo
  c.fillStyle = '#34091f';
  c.fillRect(0, 392, tw, H - 392);
  c.fillStyle = COLORS.gold;
  c.fillRect(0, 390, tw, 4);
  c.fillStyle = 'rgba(255,255,255,.07)';
  for (let x = 0; x < tw; x += 80) c.fillRect(x + 8, 404, 64, 52);

  // ventanal con cortinas
  const cx = 240;
  c.beginPath();
  c.moveTo(cx - 66, 345);
  c.lineTo(cx - 66, 168);
  c.arc(cx, 168, 66, Math.PI, 0);
  c.lineTo(cx + 66, 345);
  c.closePath();
  const sky = c.createLinearGradient(0, 100, 0, 345);
  sky.addColorStop(0, '#16224f');
  sky.addColorStop(1, '#3e4f96');
  ink(c, sky as unknown as string, 5);
  c.save();
  c.clip();
  c.fillStyle = '#fff6c8';
  for (let i = 0; i < 14; i++) {
    c.beginPath();
    c.arc(cx - 60 + rand01(i + 1) * 120, 110 + rand01(i + 9) * 200, 1 + rand01(i + 4) * 1.6, 0, Math.PI * 2);
    c.fill();
  }
  circle(c, cx + 26, 168, 14, '#fff3b8', 0);
  c.restore();
  c.strokeStyle = COLORS.gold;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(cx, 102);
  c.lineTo(cx, 345);
  c.moveTo(cx - 66, 240);
  c.lineTo(cx + 66, 240);
  c.stroke();
  // cortinas
  for (const s of [-1, 1]) {
    const x0 = cx + s * 66;
    c.beginPath();
    c.moveTo(x0 - s * 6, 96);
    c.lineTo(x0 + s * 54, 96);
    c.bezierCurveTo(x0 + s * 50, 180, x0 + s * 62, 260, x0 + s * 50, 350);
    c.lineTo(x0 - s * 24, 350);
    c.bezierCurveTo(x0 - s * 8, 260, x0 - s * 20, 180, x0 - s * 6, 96);
    ink(c, '#b02a55', 3.5);
    c.strokeStyle = 'rgba(0,0,0,.25)';
    c.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      c.beginPath();
      c.moveTo(x0 + s * (i * 14 - 4), 100);
      c.bezierCurveTo(x0 + s * (i * 14 - 2), 190, x0 + s * (i * 14 + 8), 260, x0 + s * (i * 14), 346);
      c.stroke();
    }
    rrect(c, x0 + s * 10 - 5, 250, 10, 12, 3, COLORS.gold, 2.5);
  }
  // cenefa
  rrect(c, cx - 118, 88, 236, 18, 6, COLORS.gold, 3.5);
  // araña lejana
  const lx = 0;
  c.strokeStyle = COLORS.gold;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(lx + 8, 0);
  c.lineTo(lx + 8, 70);
  c.stroke();
}

function salonMid(c: C) {
  const tw = 640;
  const table = (cx: number) => {
    // mantel
    c.beginPath();
    c.moveTo(cx - 62, 408);
    c.bezierCurveTo(cx - 70, 440, cx - 78, 462, cx - 82, FLOOR_Y);
    c.lineTo(cx + 82, FLOOR_Y);
    c.bezierCurveTo(cx + 78, 462, cx + 70, 440, cx + 62, 408);
    c.closePath();
    ink(c, '#f3e4d0', 3.2);
    c.strokeStyle = '#d9bda0';
    c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(cx + i * 22, 414);
      c.quadraticCurveTo(cx + i * 28, 445, cx + i * 32, FLOOR_Y - 3);
      c.stroke();
    }
    ellipse(c, cx, 408, 66, 13, '#fffaf0', 3.2);
    // florero
    rrect(c, cx - 7, 378, 14, 28, 5, COLORS.gold, 2.8);
    for (const [dx, dy, r, col] of [
      [-12, -8, 11, COLORS.rose],
      [11, -10, 11, COLORS.blush],
      [0, -20, 12, COLORS.rose],
      [-2, -4, 9, '#ffffff'],
    ] as [number, number, number, string][]) {
      circle(c, cx + dx, 372 + dy, r, col, 2.6);
    }
    // sillas
    for (const s of [-1, 1]) {
      rrect(c, cx + s * 92 - 12, 424, 24, 46, 6, '#3a0e26', 0);
      rrect(c, cx + s * 92 - 14, 418, 28, 8, 3, '#5a1633', 0);
    }
  };
  table(150);
  table(470);
  // globos en forma de corazón
  const balloon = (x: number, y: number, col: string, sw: number) => {
    c.strokeStyle = 'rgba(42,20,32,.7)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(x, y + 12);
    c.quadraticCurveTo(x + sw, y + 80, 150 + sw * 0.2, 372);
    c.stroke();
    c.save();
    c.translate(x, y);
    c.beginPath();
    c.moveTo(0, 16);
    c.bezierCurveTo(-22, 0, -14, -22, 0, -10);
    c.bezierCurveTo(14, -22, 22, 0, 0, 16);
    ink(c, col, 3);
    c.restore();
  };
  balloon(168, 288, COLORS.rose, 4);
  balloon(132, 300, COLORS.gold, -4);
  balloon(150, 266, COLORS.blush, 0);
  // columna decorativa con flores
  rrect(c, 330, 320, 36, 150, 6, '#e9d8c4', 3);
  rrect(c, 324, 310, 48, 14, 5, COLORS.gold, 3);
  rrect(c, 324, 462, 48, 10, 4, COLORS.gold, 3);
  for (let i = 0; i < 5; i++) circle(c, 330 + i * 9, 304 - (i % 2) * 8, 9, i % 2 ? COLORS.rose : COLORS.blush, 2.5);
  c.strokeStyle = COLORS.gold;
  c.lineWidth = 2;
  void tw;
}

function salonCeil(c: C) {
  const tw = 160;
  const g = c.createLinearGradient(0, 0, 0, CEIL_Y);
  g.addColorStop(0, '#2a0b1d');
  g.addColorStop(1, '#5a1630');
  c.fillStyle = g;
  c.fillRect(0, 0, tw, CEIL_Y);
  c.fillStyle = 'rgba(255,255,255,.06)';
  for (let x = 0; x < tw; x += 40) c.fillRect(x + 4, 8, 32, CEIL_Y - 24);
  c.fillStyle = COLORS.gold;
  c.fillRect(0, CEIL_Y - 9, tw, 6);
  c.fillStyle = '#f3e4d0';
  c.fillRect(0, CEIL_Y - 14, tw, 4);
  c.fillStyle = COLORS.ink;
  c.fillRect(0, CEIL_Y - 3, tw, 4);
  // guirnalda de banderines
  const cols = [COLORS.rose, COLORS.cream, COLORS.gold, COLORS.blush];
  const sag = (k: number) => CEIL_Y + 6 + 13 * Math.sin(Math.PI * k);
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 2.2;
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const k = i / 40;
    if (i === 0) c.moveTo(k * tw, sag(k));
    else c.lineTo(k * tw, sag(k));
  }
  c.stroke();
  const n = 8;
  for (let i = 0; i < n; i++) {
    const k = (i + 0.5) / n;
    const x = k * tw;
    const y = sag(k);
    poly(c, [x - 8, y, x + 8, y, x, y + 20], cols[i % cols.length], 2.2);
  }
}

function salonFloor(c: C) {
  const tw = 120;
  const g = c.createLinearGradient(0, FLOOR_Y, 0, H);
  g.addColorStop(0, '#a85a33');
  g.addColorStop(1, '#5e2e1c');
  c.fillStyle = g;
  c.fillRect(0, FLOOR_Y, tw, H - FLOOR_Y);
  c.fillStyle = 'rgba(255,255,255,.18)';
  c.fillRect(0, FLOOR_Y, tw, 8);
  c.strokeStyle = 'rgba(40,16,8,.55)';
  c.lineWidth = 2;
  let row = 0;
  for (let y = FLOOR_Y + 8; y < H; y += 24) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(tw, y);
    c.stroke();
    const off = row % 2 ? 30 : 0;
    for (let x = off; x < tw + 1; x += 60) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 24);
      c.stroke();
    }
    row++;
  }
  c.fillStyle = COLORS.gold;
  c.fillRect(0, FLOOR_Y, tw, 4);
  c.fillStyle = COLORS.ink;
  c.fillRect(0, FLOOR_Y - 2, tw, 3);
}

/* ------------------------------------------------------------------ */
/* Zona 1 — Jardín de Rosas                                            */
/* ------------------------------------------------------------------ */

function gardenFar(c: C) {
  const tw = 640;
  const g = c.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, '#79c8ff');
  g.addColorStop(0.7, '#cfeeff');
  g.addColorStop(1, '#fff0cf');
  c.fillStyle = g;
  c.fillRect(0, 0, tw, H);
  // sol
  const sg = c.createRadialGradient(470, 130, 6, 470, 130, 110);
  sg.addColorStop(0, 'rgba(255,248,200,1)');
  sg.addColorStop(0.25, 'rgba(255,240,170,.9)');
  sg.addColorStop(1, 'rgba(255,240,170,0)');
  c.fillStyle = sg;
  c.fillRect(350, 20, 240, 240);
  // nubes
  const cloud = (x: number, y: number, s: number) => {
    c.fillStyle = 'rgba(255,255,255,.95)';
    for (const [dx, dy, r] of [
      [0, 0, 22],
      [24, -8, 28],
      [54, 2, 22],
      [28, 8, 24],
    ]) {
      c.beginPath();
      c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      c.fill();
    }
  };
  cloud(70, 110, 1);
  cloud(300, 70, 0.8);
  cloud(560, 180, 1.1);
  // colinas
  c.fillStyle = '#a6dca2';
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= tw; x += 8) c.lineTo(x, 340 + Math.sin((x / tw) * Math.PI * 4) * 22);
  c.lineTo(tw, H);
  c.closePath();
  c.fill();
  c.fillStyle = '#74c47c';
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= tw; x += 8) c.lineTo(x, 392 + Math.sin((x / tw) * Math.PI * 6 + 1) * 18);
  c.lineTo(tw, H);
  c.closePath();
  c.fill();
  // árboles lejanos
  for (const [x, y, r] of [
    [90, 352, 26],
    [250, 372, 20],
    [420, 346, 30],
    [590, 376, 22],
  ]) {
    c.fillStyle = '#4a8a56';
    c.fillRect(x - 3, y, 6, 30);
    c.fillStyle = '#58a864';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
}

function gardenMid(c: C) {
  // seto
  const top = 362;
  c.fillStyle = '#2a7a44';
  c.beginPath();
  c.moveTo(0, FLOOR_Y);
  c.lineTo(0, top + 10);
  for (let x = 0; x <= 480; x += 24) c.arc(x + 12, top + 10, 14, Math.PI, 0);
  c.lineTo(480, FLOOR_Y);
  c.closePath();
  ink(c, '#34914f', 3);
  c.fillStyle = 'rgba(0,0,0,.14)';
  c.fillRect(0, top + 56, 480, FLOOR_Y - top - 56);
  for (let i = 0; i < 40; i++) {
    const x = rand01(i + 3) * 480;
    const y = top + 14 + rand01(i + 77) * 80;
    circle(c, x, y, 4 + rand01(i + 5) * 2.4, [COLORS.rose, COLORS.blush, '#ffffff', '#ffd36a'][i % 4], 1.6);
  }
  // arco de rosas
  const cx = 240;
  rrect(c, cx - 62, 232, 12, FLOOR_Y - 232, 4, '#fbf3e6', 3);
  rrect(c, cx + 50, 232, 12, FLOOR_Y - 232, 4, '#fbf3e6', 3);
  c.beginPath();
  c.arc(cx, 240, 56, Math.PI, 0);
  c.lineWidth = 13;
  c.strokeStyle = COLORS.ink;
  c.stroke();
  c.lineWidth = 7;
  c.strokeStyle = '#fbf3e6';
  c.stroke();
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    const x = cx + Math.cos(a) * 56;
    const y = 240 + Math.sin(a) * 56;
    circle(c, x, y, 7.5, i % 3 === 0 ? COLORS.blush : i % 3 === 1 ? COLORS.rose : '#3f9a58', 2.2);
  }
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) circle(c, cx + s * 56, 262 + i * 34, 6, i % 2 ? COLORS.rose : COLORS.blush, 2);
  }
}

function gardenCeil(c: C) {
  const tw = 200;
  const g = c.createLinearGradient(0, 0, 0, CEIL_Y);
  g.addColorStop(0, '#6e4527');
  g.addColorStop(1, '#a8703c');
  c.fillStyle = g;
  c.fillRect(0, 0, tw, CEIL_Y);
  c.strokeStyle = 'rgba(40,20,8,.35)';
  c.lineWidth = 2;
  for (let y = 14; y < CEIL_Y; y += 16) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(tw, y);
    c.stroke();
  }
  // vigas verticales
  for (const x of [20, 120]) {
    rrect(c, x - 9, 0, 18, CEIL_Y + 14, 5, '#8a5a34', 3);
  }
  c.fillStyle = COLORS.ink;
  c.fillRect(0, CEIL_Y - 3, tw, 4);
  // enredadera con hojas
  c.strokeStyle = '#2f7a46';
  c.lineWidth = 3;
  const vine = (x0: number, len: number, sw: number) => {
    c.beginPath();
    c.moveTo(x0, CEIL_Y - 2);
    c.bezierCurveTo(x0 + sw, CEIL_Y + len * 0.3, x0 - sw, CEIL_Y + len * 0.7, x0 + sw * 0.4, CEIL_Y + len);
    c.stroke();
    for (let i = 0; i < 5; i++) {
      const k = (i + 1) / 6;
      ellipse(c, x0 + Math.sin(k * 6) * sw * 0.6, CEIL_Y + len * k, 6, 3.4, '#3f9a58', 1.8, i % 2 ? 0.6 : -0.6);
    }
    circle(c, x0 + sw * 0.4, CEIL_Y + len + 3, 5, COLORS.rose, 2);
  };
  vine(60, 30, 6);
  vine(170, 22, -6);
  // luces de hadas
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 1.8;
  c.beginPath();
  for (let i = 0; i <= 30; i++) {
    const k = i / 30;
    const y = CEIL_Y + 8 + 10 * Math.sin(Math.PI * k);
    if (i === 0) c.moveTo(0, y);
    else c.lineTo(k * tw, y);
  }
  c.stroke();
  for (let i = 0; i < 6; i++) {
    const k = (i + 0.5) / 6;
    const y = CEIL_Y + 8 + 10 * Math.sin(Math.PI * k);
    const g2 = c.createRadialGradient(k * tw, y + 5, 1, k * tw, y + 5, 11);
    g2.addColorStop(0, 'rgba(255,240,150,.9)');
    g2.addColorStop(1, 'rgba(255,240,150,0)');
    c.fillStyle = g2;
    c.fillRect(k * tw - 12, y - 6, 24, 24);
    circle(c, k * tw, y + 5, 3.4, '#fff3b0', 1.6);
  }
}

function gardenFloor(c: C) {
  const tw = 120;
  const g = c.createLinearGradient(0, FLOOR_Y, 0, H);
  g.addColorStop(0, '#6ac26f');
  g.addColorStop(1, '#2f7a46');
  c.fillStyle = g;
  c.fillRect(0, FLOOR_Y, tw, H - FLOOR_Y);
  // sendero de piedras
  c.fillStyle = '#e8d4ae';
  c.fillRect(0, FLOOR_Y + 22, tw, H - FLOOR_Y - 22);
  c.strokeStyle = '#b79a6c';
  c.lineWidth = 2.2;
  for (let r = 0; r < 3; r++) {
    const y = FLOOR_Y + 22 + r * 18;
    const off = r % 2 ? 20 : 0;
    for (let x = off; x < tw + 40; x += 40) {
      c.beginPath();
      c.roundRect(x - 40 + 2, y + 2, 36, 14, 5);
      c.stroke();
    }
  }
  // hierba
  c.fillStyle = '#4fae5e';
  for (let x = 0; x < tw; x += 10) poly(c, [x, FLOOR_Y + 22, x + 5, FLOOR_Y + 2, x + 10, FLOOR_Y + 22], '#4fae5e', 0);
  c.fillStyle = '#7fd68a';
  c.fillRect(0, FLOOR_Y, tw, 6);
  for (const [x, col] of [
    [14, COLORS.blush],
    [58, '#ffffff'],
    [96, COLORS.gold],
  ] as [number, string][]) {
    circle(c, x, FLOOR_Y + 13, 4, col, 1.6);
  }
  c.fillStyle = COLORS.ink;
  c.fillRect(0, FLOOR_Y - 2, tw, 3);
}

/* ------------------------------------------------------------------ */
/* Zona 2 — La Catedral                                                */
/* ------------------------------------------------------------------ */

function cathedralFar(c: C) {
  const tw = 560;
  const g = c.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, '#2c1f45');
  g.addColorStop(1, '#6b5689');
  c.fillStyle = g;
  c.fillRect(0, 0, tw, H);
  // bloques de piedra
  c.strokeStyle = 'rgba(0,0,0,.14)';
  c.lineWidth = 2;
  let row = 0;
  for (let y = 0; y < FLOOR_Y; y += 38) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(tw, y);
    c.stroke();
    const off = row % 2 ? 70 : 0;
    for (let x = off; x < tw + 140; x += 140) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 38);
      c.stroke();
    }
    row++;
  }
  // rayos de luz
  const beam = c.createLinearGradient(0, 100, 0, FLOOR_Y);
  beam.addColorStop(0, 'rgba(255,230,180,.28)');
  beam.addColorStop(1, 'rgba(255,230,180,0)');
  c.fillStyle = beam;
  c.beginPath();
  c.moveTo(250, 150);
  c.lineTo(310, 150);
  c.lineTo(420, FLOOR_Y);
  c.lineTo(250, FLOOR_Y);
  c.closePath();
  c.fill();
  // vitral gótico
  const cx = 280;
  const arch = () => {
    c.beginPath();
    c.moveTo(cx - 56, 350);
    c.lineTo(cx - 56, 170);
    c.quadraticCurveTo(cx - 56, 92, cx, 46);
    c.quadraticCurveTo(cx + 56, 92, cx + 56, 170);
    c.lineTo(cx + 56, 350);
    c.closePath();
  };
  arch();
  ink(c, '#1c1230', 6);
  c.save();
  arch();
  c.clip();
  const pal = ['#e63e6d', '#4a86e8', '#f6c453', '#3fae6a', '#a35ad8', '#ff8f4a'];
  const cell = 28;
  for (let yy = 40; yy < 352; yy += cell) {
    for (let xx = cx - 56; xx < cx + 56; xx += cell) {
      c.fillStyle = pal[Math.floor(rand01(xx * 0.37 + yy * 1.13) * pal.length)];
      c.fillRect(xx, yy, cell, cell);
    }
  }
  c.strokeStyle = '#1c1230';
  c.lineWidth = 3;
  for (let yy = 40; yy < 352; yy += cell) {
    c.beginPath();
    c.moveTo(cx - 56, yy);
    c.lineTo(cx + 56, yy);
    c.stroke();
  }
  for (let xx = cx - 56; xx <= cx + 56; xx += cell) {
    c.beginPath();
    c.moveTo(xx, 40);
    c.lineTo(xx, 352);
    c.stroke();
  }
  // brillo
  const shine = c.createLinearGradient(cx - 56, 0, cx + 56, 0);
  shine.addColorStop(0, 'rgba(255,255,255,.28)');
  shine.addColorStop(0.5, 'rgba(255,255,255,0)');
  c.fillStyle = shine;
  c.fillRect(cx - 56, 40, 112, 312);
  c.restore();
  arch();
  c.lineWidth = 3;
  c.strokeStyle = '#1c1230';
  c.stroke();
  // alféizar
  rrect(c, cx - 66, 346, 132, 14, 4, '#d8c7a8', 3);
}

function cathedralMid(c: C) {
  const column = (cx: number) => {
    // fuste
    rrect(c, cx - 25, 70, 50, 396, 4, '#eadfca', 3);
    c.fillStyle = 'rgba(80,50,30,.14)';
    c.fillRect(cx + 6, 72, 17, 392);
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.fillRect(cx - 18, 72, 6, 392);
    // capitel y base
    rrect(c, cx - 36, 56, 72, 18, 5, '#d8c7a8', 3);
    rrect(c, cx - 31, 48, 62, 10, 4, '#cdb78f', 3);
    rrect(c, cx - 36, 452, 72, 18, 5, '#d8c7a8', 3);
  };
  column(70);
  column(330);
  // candelabro de pie
  const cx = 200;
  rrect(c, cx - 4, 380, 8, 90, 3, COLORS.gold, 2.8);
  ellipse(c, cx, 468, 18, 6, COLORS.gold, 2.8);
  c.beginPath();
  c.moveTo(cx, 396);
  c.quadraticCurveTo(cx - 28, 396, cx - 28, 372);
  c.moveTo(cx, 396);
  c.quadraticCurveTo(cx + 28, 396, cx + 28, 372);
  ink(c, null, 5.5);
  c.strokeStyle = COLORS.gold;
  c.lineWidth = 2.4;
  c.stroke();
  for (const dx of [-28, 0, 28]) {
    const y = dx === 0 ? 372 : 372;
    rrect(c, cx + dx - 4, y - 14, 8, 16, 2, COLORS.cream, 2.2);
    c.beginPath();
    c.moveTo(cx + dx, y - 32);
    c.quadraticCurveTo(cx + dx + 6, y - 20, cx + dx, y - 15);
    c.quadraticCurveTo(cx + dx - 6, y - 20, cx + dx, y - 32);
    ink(c, '#ffb347', 1.8);
  }
  // bancas
  rrect(c, 380, 428, 90, 42, 6, '#4a2a1c', 3);
  rrect(c, 380, 396, 90, 36, 6, '#6a3c26', 3);
}

function cathedralCeil(c: C) {
  const tw = 200;
  const g = c.createLinearGradient(0, 0, 0, CEIL_Y);
  g.addColorStop(0, '#1f1530');
  g.addColorStop(1, '#46345f');
  c.fillStyle = g;
  c.fillRect(0, 0, tw, CEIL_Y);
  // arcos apuntados
  for (let i = 0; i < 2; i++) {
    const x0 = i * 100;
    c.beginPath();
    c.moveTo(x0, CEIL_Y);
    c.quadraticCurveTo(x0, 14, x0 + 50, 6);
    c.quadraticCurveTo(x0 + 100, 14, x0 + 100, CEIL_Y);
    ink(c, null, 4, '#cdb78f');
    c.strokeStyle = '#cdb78f';
    c.lineWidth = 5;
    c.stroke();
  }
  c.fillStyle = COLORS.gold;
  c.fillRect(0, CEIL_Y - 8, tw, 5);
  c.fillStyle = COLORS.ink;
  c.fillRect(0, CEIL_Y - 3, tw, 4);
  // farol colgante
  const lx = 100;
  c.strokeStyle = COLORS.ink;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(lx, CEIL_Y - 4);
  c.lineTo(lx, CEIL_Y + 18);
  c.stroke();
  const lg = c.createRadialGradient(lx, CEIL_Y + 30, 3, lx, CEIL_Y + 30, 32);
  lg.addColorStop(0, 'rgba(255,220,130,.8)');
  lg.addColorStop(1, 'rgba(255,220,130,0)');
  c.fillStyle = lg;
  c.fillRect(lx - 34, CEIL_Y - 4, 68, 68);
  poly(c, [lx - 9, CEIL_Y + 18, lx + 9, CEIL_Y + 18, lx + 12, CEIL_Y + 40, lx - 12, CEIL_Y + 40], '#ffe6a0', 2.6);
  rrect(c, lx - 11, CEIL_Y + 14, 22, 6, 2, COLORS.gold, 2.4);
  rrect(c, lx - 12, CEIL_Y + 38, 24, 6, 2, COLORS.gold, 2.4);
}

function cathedralFloor(c: C) {
  const tw = 120;
  const g = c.createLinearGradient(0, FLOOR_Y, 0, H);
  g.addColorStop(0, '#b32347');
  g.addColorStop(1, '#6a1228');
  c.fillStyle = g;
  c.fillRect(0, FLOOR_Y, tw, H - FLOOR_Y);
  c.fillStyle = COLORS.gold;
  c.fillRect(0, FLOOR_Y + 5, tw, 4);
  c.fillRect(0, H - 14, tw, 4);
  for (let x = 0; x < tw; x += 60) {
    poly(c, [x + 30, FLOOR_Y + 22, x + 46, FLOOR_Y + 40, x + 30, FLOOR_Y + 58, x + 14, FLOOR_Y + 40], 'rgba(246,196,83,.85)', 2);
  }
  c.fillStyle = 'rgba(255,255,255,.15)';
  c.fillRect(0, FLOOR_Y, tw, 5);
  c.fillStyle = COLORS.ink;
  c.fillRect(0, FLOOR_Y - 2, tw, 3);
}

/* ------------------------------------------------------------------ */

const ZONE_DEFS: ZoneDef[] = [
  {
    far: { key: 'salon_far', tileW: 480, y: 0, h: H, speed: 0.22, blur: 0.5, draw: salonFar },
    mid: { key: 'salon_mid', tileW: 640, y: 250, h: 230, speed: 0.55, draw: salonMid },
    ceil: { key: 'salon_ceil', tileW: 160, y: 0, h: 112, speed: 1, draw: salonCeil },
    floor: { key: 'salon_floor', tileW: 120, y: FLOOR_Y - 4, h: H - FLOOR_Y + 4, speed: 1, draw: salonFloor },
  },
  {
    far: { key: 'garden_far', tileW: 640, y: 0, h: H, speed: 0.15, blur: 0.5, draw: gardenFar },
    mid: { key: 'garden_mid', tileW: 480, y: 170, h: 310, speed: 0.5, draw: gardenMid },
    ceil: { key: 'garden_ceil', tileW: 200, y: 0, h: 110, speed: 1, draw: gardenCeil },
    floor: { key: 'garden_floor', tileW: 120, y: FLOOR_Y - 4, h: H - FLOOR_Y + 4, speed: 1, draw: gardenFloor },
  },
  {
    far: { key: 'cath_far', tileW: 560, y: 0, h: H, speed: 0.2, blur: 0.5, draw: cathedralFar },
    mid: { key: 'cath_mid', tileW: 400, y: 40, h: 440, speed: 0.55, draw: cathedralMid },
    ceil: { key: 'cath_ceil', tileW: 200, y: 0, h: 120, speed: 1, draw: cathedralCeil },
    floor: { key: 'cath_floor', tileW: 120, y: FLOOR_Y - 4, h: H - FLOOR_Y + 4, speed: 1, draw: cathedralFloor },
  },
];

function layerSprite(l: Layer) {
  return getSprite(l.key, l.tileW, l.h, (c) => {
    c.translate(0, -l.y);
    c.save();
    c.beginPath();
    c.rect(0, l.y, l.tileW, l.h);
    c.clip();
    l.draw(c);
    c.restore();
    if (l.blur) softenTile(c, l.blur);
  });
}

/**
 * Desenfoque ligero de una capa lejana (profundidad de campo), calculado una sola vez al crear
 * el sprite: se reduce y se vuelve a ampliar. Se hace con la capa repetida 3 veces para que el
 * borde del mosaico no marque costuras.
 */
function softenTile(c: CanvasRenderingContext2D, amount: number) {
  const cv = c.canvas;
  const pw = cv.width;
  const ph = cv.height;
  const k = Math.max(0.25, 1 - amount); // 0.5 = mitad de resolución
  const wide = makeCanvas(pw * 3, ph);
  const wctx = wide.getContext('2d');
  const small = makeCanvas(Math.max(1, Math.round(pw * 3 * k)), Math.max(1, Math.round(ph * k)));
  const sctx = small.getContext('2d');
  if (!wctx || !sctx) return;
  for (let i = 0; i < 3; i++) wctx.drawImage(cv, i * pw, 0);
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(wide, 0, 0, small.width, small.height);
  // de vuelta al tamaño original, quedándose con la franja central
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, pw, ph);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(small, small.width / 3, 0, small.width / 3, small.height, 0, 0, pw, ph);
  // bruma atmosférica: lo lejano pierde contraste hacia el piso
  const g = c.createLinearGradient(0, 0, 0, ph);
  g.addColorStop(0, 'rgba(255,225,235,0)');
  g.addColorStop(1, 'rgba(255,225,235,.1)');
  c.fillStyle = g;
  c.fillRect(0, 0, pw, ph);
  c.restore();
}

function drawLayer(ctx: CanvasRenderingContext2D, l: Layer, scroll: number) {
  const sprite = layerSprite(l);
  const off = -Math.floor((scroll * l.speed) % l.tileW);
  for (let x = off; x < W; x += l.tileW) ctx.drawImage(sprite, x, l.y, l.tileW, l.h);
}

export function drawZone(ctx: CanvasRenderingContext2D, zone: number, scroll: number, alpha = 1) {
  const z = ZONE_DEFS[zone % ZONE_DEFS.length];
  ctx.save();
  ctx.globalAlpha = alpha;
  drawLayer(ctx, z.far, scroll);
  drawLayer(ctx, z.mid, scroll);
  drawLayer(ctx, z.ceil, scroll);
  drawLayer(ctx, z.floor, scroll);
  ctx.restore();
}

/** Velo oscuro sobre el decorado: lo baja de contraste para que los obstáculos y anillos destaquen */
export function drawBackdropVeil(ctx: CanvasRenderingContext2D) {
  const s = getSprite('backdrop_veil', W, H, (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(26,6,20,.40)');
    g.addColorStop(1, 'rgba(26,6,20,.30)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });
  ctx.drawImage(s, 0, 0, W, H);
}

/** Sombra suave bajo el novio / objetos pegados al piso */
export function drawFloorShadow(ctx: CanvasRenderingContext2D, x: number, heightAboveFloor: number, w: number) {
  const k = Math.max(0.25, 1 - heightAboveFloor / 340);
  ctx.save();
  ctx.fillStyle = `rgba(30,10,20,${0.3 * k})`;
  ctx.beginPath();
  ctx.ellipse(x, FLOOR_Y + 14, w * k, 6 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Viñeta oscura pre-renderizada */
export function drawVignette(ctx: CanvasRenderingContext2D) {
  const s = getSprite('vignette', W, H, (c) => {
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.98);
    g.addColorStop(0, 'rgba(20,5,15,0)');
    g.addColorStop(1, 'rgba(20,5,15,.38)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  });
  ctx.drawImage(s, 0, 0, W, H);
}
