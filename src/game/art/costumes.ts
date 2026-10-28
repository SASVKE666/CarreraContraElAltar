/**
 * Disfraces del runner (skins de personaje). Son diseños originales del juego:
 * cada uno cambia colores del cuerpo y añade piezas (cola, casco, orejas...) sobre
 * el mismo esqueleto del novio. Se dibujan en coordenadas locales de `drawGroom`
 * (origen en el centro del torso, cabeza = círculo r15 en (6,-33), mirando a +X).
 */
import { COLORS } from '../constants';
import { circle, ellipse, ink, poly, rrect } from './core';

export interface CostumeCtx {
  t: number;
  fear: number;
  caught: boolean;
}

export interface CostumeDef {
  /** Color de la cabeza y sombra de la oreja */
  skin: string;
  shade: string;
  /** Traje: torso, piernas y mangas */
  main: string;
  sash: string;
  hand: string;
  shoe: string;
  /** Conserva camisa blanca / cabello del novio */
  shirt: boolean;
  hair: boolean;
  noLegs?: boolean;
  /** Manos en forma de pinza */
  claws?: boolean;
  /** Objeto que lleva en la mano delantera (se dibuja en el origen de la mano, 'colgando') */
  item?: (ctx: CanvasRenderingContext2D) => void;
  /** Detrás del cuerpo (colas, espadas...) */
  back?: (ctx: CanvasRenderingContext2D, c: CostumeCtx) => void;
  /** Sobre el torso, bajo la cabeza */
  body?: (ctx: CanvasRenderingContext2D, c: CostumeCtx) => void;
  /** Sobre la cabeza y la cara */
  head?: (ctx: CanvasRenderingContext2D, c: CostumeCtx) => void;
}

function mini(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  poly(ctx, pts, fill, 1.4);
}

/** Ojo del novio, para redibujarlo encima de capuchas */
function eye(ctx: CanvasRenderingContext2D, fear: number) {
  ellipse(ctx, 13, -34, 5.3, 6.5, COLORS.white, 2.2);
  circle(ctx, 14.8, -33.6, 3.4, '#8e44ad', 0);
  circle(ctx, 15.2, -33.4, 1.7, COLORS.ink, 0);
  circle(ctx, 16.1, -35.2, 1.1, COLORS.white, 0);
  ctx.beginPath();
  ctx.moveTo(8, -41.5 + fear * 1.5);
  ctx.lineTo(19, -43.5 - fear * 3.5);
  ink(ctx, null, 3.2);
}

export const COSTUMES: Record<string, CostumeDef> = {
  /* ---------------------------- Fantasma ---------------------------- */
  ghost: {
    skin: '#f4f4ff',
    shade: '#d7d9ee',
    main: '#f4f4ff',
    sash: '#d7d9ee',
    hand: '#f4f4ff',
    shoe: '#d7d9ee',
    shirt: false,
    hair: false,
    noLegs: true,
    head: (ctx, { t, fear }) => {
      const w = Math.sin(t * 6) * 2;
      ctx.beginPath();
      ctx.moveTo(-15, 22 + w);
      ctx.lineTo(-17, -30);
      ctx.bezierCurveTo(-17, -58, 29, -58, 29, -30);
      ctx.lineTo(27, 22 - w);
      // dobladillo ondulado
      ctx.quadraticCurveTo(21, 34 + w, 15, 24);
      ctx.quadraticCurveTo(9, 34 - w, 3, 24);
      ctx.quadraticCurveTo(-3, 34 + w, -9, 24);
      ctx.quadraticCurveTo(-12, 30, -15, 22 + w);
      ctx.closePath();
      ink(ctx, '#fbfbff', 3);
      // pliegues
      ctx.strokeStyle = '#d7d9ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.quadraticCurveTo(-10, 6, -8, 18);
      ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(10, 8, 9, 20);
      ctx.stroke();
      // agujeros de los ojos y boca
      ellipse(ctx, 14, -34, 4.6, 6.4 + fear * 1.5, '#1b1320', 0);
      ellipse(ctx, 1, -34, 4, 6, '#1b1320', 0);
      circle(ctx, 15.4, -35.6, 1.4, COLORS.white, 0);
      ellipse(ctx, 15, -22, 3.2, 3.4 + fear * 2.2, '#1b1320', 0);
      // mejilla
      ellipse(ctx, 22, -26, 3, 1.8, 'rgba(255,130,160,.55)', 0);
    },
  },

  /* ----------------------------- Conejo ------------------------------ */
  bunny: {
    skin: '#fdf0f5',
    shade: '#f3c4d6',
    main: '#f6e8ef',
    sash: '#ffb3cc',
    hand: '#ffffff',
    shoe: '#ffb3cc',
    shirt: false,
    hair: false,
    back: (ctx) => {
      circle(ctx, -17, 10, 7.5, '#ffffff', 2.6); // colita de algodón
      circle(ctx, -19, 8, 2.4, '#f3e1ea', 0);
    },
    body: (ctx) => {
      ellipse(ctx, 4, -1, 7.5, 12, '#ffffff', 2); // pancita
    },
    head: (ctx, { t }) => {
      const sway = Math.sin(t * 4) * 0.08;
      for (const [x, rot, len] of [
        [-2, -0.35 + sway, 30],
        [10, 0.12 - sway, 32],
      ] as const) {
        ctx.save();
        ctx.translate(x, -44);
        ctx.rotate(rot);
        ellipse(ctx, 0, -len / 2 - 2, 6, len / 2, '#fdf0f5', 2.8);
        ellipse(ctx, 0, -len / 2 - 1, 3, len / 2 - 5, '#ffb3cc', 0);
        ctx.restore();
      }
      circle(ctx, 22.6, -29, 3.4, '#ff8fb4', 2); // nariz
      ctx.strokeStyle = '#d9a3b8';
      ctx.lineWidth = 1.4;
      for (const dy of [-2, 2]) {
        ctx.beginPath();
        ctx.moveTo(24, -27 + dy);
        ctx.lineTo(33, -28 + dy * 2.2);
        ctx.stroke();
      }
      // dientes de conejo
      rrect(ctx, 16, -22, 3.4, 4.4, 1, COLORS.white, 1.4);
      rrect(ctx, 19.6, -22.5, 3.4, 4.4, 1, COLORS.white, 1.4);
    },
  },

  /* ------------------------------ Pirata ----------------------------- */
  pirate: {
    skin: '#f4cf45',
    shade: '#d9a92c',
    main: '#2c4a7a',
    sash: '#d63a4a',
    hand: '#f4cf45',
    shoe: '#4a2f1a',
    shirt: true,
    hair: false,
    body: (ctx) => {
      // botones dorados y cinturón con hebilla
      circle(ctx, -6, -10, 1.8, COLORS.gold, 1.2);
      circle(ctx, -6, -2, 1.8, COLORS.gold, 1.2);
      rrect(ctx, 3, 5, 7, 9, 1.5, COLORS.gold, 1.8);
    },
    head: (ctx) => {
      // parche
      ctx.beginPath();
      ctx.moveTo(-8, -43);
      ctx.lineTo(13, -34);
      ctx.lineTo(24, -42);
      ink(ctx, null, 2, '#1b1320');
      ellipse(ctx, 13, -34, 6.6, 7.4, '#1b1320', 2);
      // tricornio
      poly(ctx, [-13, -43, -6, -55, 6, -66, 18, -55, 27, -43, 14, -39, 0, -39], '#2a2433', 3);
      poly(ctx, [-13, -43, 0, -39, 14, -39, 27, -43, 14, -45, 0, -45], '#3c3446', 2);
      circle(ctx, 6, -54, 3.4, COLORS.white, 1.6);
      circle(ctx, 4.8, -54.4, 0.9, '#1b1320', 0);
      circle(ctx, 7.4, -54.4, 0.9, '#1b1320', 0);
      rrect(ctx, 4.5, -51.4, 3, 1.8, 0.5, '#1b1320', 0);
      // arito dorado
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-7, -27, 3, 0, Math.PI * 2);
      ctx.stroke();
    },
  },

  /* ---------------------------- Dinosaurio --------------------------- */
  dino: {
    skin: '#7fd18a',
    shade: '#4fae61',
    main: '#62c474',
    sash: '#3f9a52',
    hand: '#7fd18a',
    shoe: '#3f9a52',
    shirt: false,
    hair: false,
    back: (ctx, { t }) => {
      const w = Math.sin(t * 7) * 3;
      // cola con espinas
      poly(ctx, [-12, 4, -34, 8 + w, -52, 20 + w * 1.6, -30, 18 + w * 0.5, -10, 20], '#62c474', 3);
      for (let i = 0; i < 3; i++) {
        const x = -16 - i * 10;
        poly(ctx, [x, 8 + w * 0.3 * i, x - 4, 1 + w * 0.3 * i, x - 8, 9 + w * 0.5 * i], '#ffb04a', 2);
      }
    },
    body: (ctx) => {
      ellipse(ctx, 5, 0, 7.5, 13, '#d8f5c9', 2); // panza clara
      for (let i = 0; i < 3; i++) poly(ctx, [-15, -12 + i * 8, -22, -7 + i * 8, -15, -3 + i * 8], '#ffb04a', 2);
    },
    head: (ctx) => {
      // capucha con espinas y nariz con fosas
      for (let i = 0; i < 3; i++) {
        const x = -4 + i * 9;
        poly(ctx, [x - 4, -46, x + 1, -60 + (i === 1 ? -3 : 0), x + 6, -46], '#ffb04a', 2.2);
      }
      circle(ctx, 25.5, -29.5, 1.2, '#2e6f3c', 0);
      circle(ctx, 22, -29.5, 1.2, '#2e6f3c', 0);
      // dientitos
      for (let i = 0; i < 3; i++) poly(ctx, [11 + i * 4, -26.5, 13 + i * 4, -22.8, 15 + i * 4, -26.5], COLORS.white, 1.2);
    },
  },

  /* --------------------------- Astronauta ---------------------------- */
  astro: {
    skin: '#f4cf45',
    shade: '#d9a92c',
    main: '#eef1f6',
    sash: '#3d7bd9',
    hand: '#c9d0de',
    shoe: '#c9d0de',
    shirt: false,
    hair: true,
    body: (ctx, { t }) => {
      rrect(ctx, -9, -13, 15, 11, 3, '#c9d0de', 2);
      circle(ctx, -5.5, -9.5, 1.7, '#e8553d', 0);
      circle(ctx, -0.5, -9.5, 1.7, Math.sin(t * 5) > 0 ? '#58d68d' : '#2f9e62', 0);
      circle(ctx, -5.5, -5, 1.7, '#3d7bd9', 0);
      rrect(ctx, 9, -12, 7, 5, 1, '#e8553d', 1.6); // parche
    },
    head: (ctx) => {
      rrect(ctx, -9, -20, 30, 8, 4, '#c9d0de', 2.6); // aro del cuello
      ctx.beginPath();
      ctx.arc(6, -33, 19.5, 0, Math.PI * 2);
      ink(ctx, 'rgba(190,230,255,.32)', 3);
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(6, -33, 14.5, Math.PI * 1.12, Math.PI * 1.45);
      ctx.stroke();
      mini(ctx, 24, -50, 3.2, '#fff3b0');
    },
  },

  /* ----------------------------- Robot ------------------------------- */
  robot: {
    skin: '#bcc7d8',
    shade: '#8e9bb2',
    main: '#8d9db5',
    sash: '#ffcf3a',
    hand: '#6f7f99',
    shoe: '#4b566b',
    shirt: false,
    hair: false,
    body: (ctx, { t }) => {
      rrect(ctx, -9, -14, 16, 16, 3, '#2d3a4f', 2);
      circle(ctx, -4.5, -9, 2.2, Math.floor(t * 3) % 2 ? '#ff5a5a' : '#7a2e2e', 0);
      circle(ctx, 2.5, -9, 2.2, '#58d6ff', 0);
      ctx.strokeStyle = '#58d6ff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-7, -3);
      ctx.lineTo(-4, -5);
      ctx.lineTo(-1, -2);
      ctx.lineTo(4, -5);
      ctx.stroke();
    },
    head: (ctx, { t, fear }) => {
      // antena
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(6, -48);
      ctx.lineTo(6, -60);
      ctx.stroke();
      circle(ctx, 6, -62, 3.4, Math.floor(t * 2.5) % 2 ? '#ff5a5a' : '#ffb0b0', 2);
      // cabeza cuadrada
      rrect(ctx, -10, -49, 32, 32, 7, '#c3cddb', 3);
      circle(ctx, -10, -33, 4, '#8e9bb2', 2.2); // tornillo / oreja
      rrect(ctx, -2, -43, 22, 14, 5, '#1b2a3a', 2.4); // pantalla
      const r = 3.6 + fear * 1.4;
      circle(ctx, 14, -36, r, '#58d6ff', 0);
      circle(ctx, 5, -36, r, '#58d6ff', 0);
      circle(ctx, 15, -37, 1.2, COLORS.white, 0);
      // rejilla de la boca
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(3 + i * 4, -26);
        ctx.lineTo(3 + i * 4, fear > 0.45 ? -20 : -23);
        ctx.stroke();
      }
    },
  },

  /* ------------------------------- Mago ------------------------------ */
  wizard: {
    skin: '#f4cf45',
    shade: '#d9a92c',
    main: '#5b3fa8',
    sash: '#ffd24a',
    hand: '#f4cf45',
    shoe: '#3a2a6a',
    shirt: false,
    hair: false,
    body: (ctx) => {
      mini(ctx, -5, -8, 4.2, '#ffd24a');
      mini(ctx, 6, 0, 3, '#ffd24a');
      mini(ctx, -6, 14 - 6, 2.4, '#ffd24a');
    },
    head: (ctx, { t }) => {
      // barba blanca
      poly(ctx, [0, -22, 10, -17.5, 24, -21, 22, -9, 13, 4, 5, -6], '#f4f1ea', 2.6);
      // sombrero puntiagudo
      ctx.beginPath();
      ctx.moveTo(-6, -46);
      ctx.quadraticCurveTo(0, -72, 24, -94);
      ctx.quadraticCurveTo(22, -68, 20, -46);
      ctx.closePath();
      ink(ctx, '#5b3fa8', 3);
      ellipse(ctx, 7, -46, 25, 5.5, '#4a3290', 3);
      rrect(ctx, -3, -54, 20, 5, 1.5, '#ffd24a', 2);
      mini(ctx, 11, -68, 4, '#ffd24a');
      mini(ctx, 5, -58, 2.6, '#fff3b0');
      // destello mágico
      const s = (Math.sin(t * 8) + 1) / 2;
      ctx.fillStyle = `rgba(255,243,176,${0.4 + s * 0.6})`;
      ctx.beginPath();
      ctx.arc(24, -96, 2 + s * 1.5, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  /* ------------------------------ Ninja ------------------------------ */
  ninja: {
    skin: '#f4cf45',
    shade: '#d9a92c',
    main: '#2b2b3a',
    sash: '#d63a4a',
    hand: '#2b2b3a',
    shoe: '#16161f',
    shirt: false,
    hair: false,
    back: (ctx) => {
      // katana a la espalda
      ctx.save();
      ctx.rotate(-0.8);
      rrect(ctx, -4, -34, 8, 26, 2, '#d6dbe6', 2.2);
      rrect(ctx, -5, -12, 10, 7, 2, '#3a2a1a', 2);
      rrect(ctx, -7, -9, 14, 3, 1, COLORS.gold, 1.8);
      ctx.restore();
    },
    head: (ctx, { t, fear }) => {
      // cintas de la cabeza ondeando
      const w = Math.sin(t * 10) * 3;
      poly(ctx, [-8, -42, -22, -40 + w, -32, -46 + w * 1.4, -24, -36 + w, -9, -37], '#d63a4a', 2.4);
      // capucha
      circle(ctx, 6, -33, 15.6, '#2b2b3a', 3);
      // franja de la cara
      rrect(ctx, -6, -41, 31, 13, 6, '#f4cf45', 2.4);
      eye(ctx, fear);
      // banda frontal
      rrect(ctx, -9, -47, 30, 6, 2, '#d63a4a', 2.4);
      circle(ctx, 6, -44, 2.2, '#f2d35a', 1.2);
    },
  },
};

COSTUMES.crab = {
  skin: '#f4cf45',
  shade: '#d9a92c',
  main: '#e8502a',
  sash: '#b5361c',
  hand: '#e8502a',
  shoe: '#b5361c',
  shirt: false,
  hair: false,
  claws: true,
  back: (ctx, { t }) => {
    // patitas de cangrejo asomando por detrás
    const w = Math.sin(t * 10) * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      for (const [lw, col] of [
        [6.6, COLORS.ink],
        [3.6, '#e8502a'],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(-12, -4 + i * 9);
        ctx.lineTo(-24 - i * 2, 2 + i * 9 + w * (i % 2 ? -1 : 1));
        ctx.lineTo(-30 - i * 2, 14 + i * 9);
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        ctx.stroke();
      }
    }
  },
  body: (ctx) => {
    // caparazón de la panza con cierre
    ellipse(ctx, 2, 3, 10.5, 14, '#8a3b1f', 2.4);
    ctx.strokeStyle = '#6b2a14';
    ctx.lineWidth = 1.6;
    for (const y of [-2, 5, 12]) {
      ctx.beginPath();
      ctx.moveTo(-6, y);
      ctx.quadraticCurveTo(2, y + 3, 10, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(2, -17);
    ctx.lineTo(2, 16);
    ink(ctx, null, 2);
    rrect(ctx, 0, -16, 4, 6, 1, '#d9d9d9', 1.6);
  },
  head: (ctx, { t, fear }) => {
    // capucha roja alrededor de la cara
    ctx.lineCap = 'round';
    for (const [lw, col] of [
      [10, COLORS.ink],
      [6, '#e8502a'],
    ] as const) {
      ctx.beginPath();
      ctx.arc(6, -33, 16.4, -0.5, 2.3, true);
      ctx.lineWidth = lw;
      ctx.strokeStyle = col;
      ctx.stroke();
    }
    // ojos saltones sobre tallos
    const sw = Math.sin(t * 5) * 3 + fear * 2;
    for (const [bx, tx, ph] of [
      [-1, -4, 0],
      [12, 16, 1.4],
    ] as const) {
      const ex = tx + sw * (ph ? -1 : 1);
      for (const [lw, col] of [
        [6.4, COLORS.ink],
        [3.6, '#e8502a'],
      ] as const) {
        ctx.beginPath();
        ctx.moveTo(bx, -48);
        ctx.quadraticCurveTo(bx + (ex - bx) * 0.2, -60, ex, -68);
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        ctx.stroke();
      }
      circle(ctx, ex, -70, 5.6, COLORS.white, 2.4);
      circle(ctx, ex + 1, -70.4, 2.2, COLORS.ink, 0);
    }
    // flequillo marrón asomando por la capucha
    poly(ctx, [-4, -45, 3, -53, 14, -53, 21, -45, 17, -42, 12, -47, 8, -42, 3, -46, 0, -41], COLORS.hair, 2.4);
  },
};

COSTUMES.office = {
  skin: '#fbfbfb',
  shade: '#dcdcdc',
  main: '#1f2a52',
  sash: '#12183a',
  hand: '#ffffff',
  shoe: '#14141c',
  shirt: true,
  hair: false,
  item: (ctx) => {
    // maletín
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 4, 4, Math.PI, 0);
    ctx.stroke();
    rrect(ctx, -9, 4, 18, 13, 2.4, '#8a5a2b', 2.4);
    rrect(ctx, -1.5, 8, 3, 3.6, 0.8, COLORS.gold, 1.4);
  },
  body: (ctx) => {
    // corbata azul
    poly(ctx, [4.2, -17, 11, -17, 10, -13, 5.2, -13], '#2a3bff', 2);
    poly(ctx, [5.2, -13, 10, -13, 12.5, 4, 7.6, 8.5, 3.4, 4], '#3a4bff', 2.2);
    rrect(ctx, -11, -6, 7, 3.4, 1, '#3a4a80', 1.4); // bolsillo
  },
  head: (ctx, { fear }) => {
    // cara lisa: ojos grandes y vacíos
    ellipse(ctx, 11, -26.5, 4.2, 2.8, '#fbfbfb', 0);
    ellipse(ctx, 13, -34, 6.4, 7.6 + fear, '#ffffff', 2.2);
    circle(ctx, 14.8, -33.4, 1.5, COLORS.ink, 0);
    ctx.beginPath();
    ctx.moveTo(7, -43.5 + fear * 1.5);
    ctx.quadraticCurveTo(13, -46, 19, -43.5 - fear * 3);
    ink(ctx, null, 1.8);
    // parche en la boca
    poly(ctx, [10, -26.5, 22, -27.5, 23, -21, 11, -20], '#e9e9e9', 1.8);
    ctx.beginPath();
    ctx.moveTo(12.5, -23);
    ctx.lineTo(14.5, -25);
    ctx.lineTo(16.5, -22.5);
    ctx.lineTo(18.5, -25);
    ctx.lineTo(20.5, -22.5);
    ink(ctx, null, 1.2);
  },
};

export const COSTUME_KEYS = Object.keys(COSTUMES);
