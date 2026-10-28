/**
 * Lógica de los vehículos de boda (se consiguen con los regalos).
 * Cada uno cambia cómo se controla el novio y aguanta un golpe antes de destruirse:
 *
 *  - swan  (Cisne Inflable):    cada toque da un aletazo; mantener sigue aleteando.
 *  - limo  (Limusina):          rueda por el piso; mantener salta (más tiempo = más alto).
 *                               Aplasta las torres de copas sin recibir daño.
 *  - cupid (Carroza de Cupido): cada toque invierte la gravedad (piso <-> techo).
 */
import { GROOM_X, VEHICLES, type VehicleKind } from './constants';
import { clamp } from './art/core';

export interface Vehicle {
  kind: VehicleKind;
  hp: number;
  age: number;
  /** 1 justo al aletear/saltar/invertir, baja a 0 (para animar) */
  pulse: number;
  wheel: number;
  /** Cupido: dirección de la gravedad (1 = hacia el piso, -1 = hacia el techo) */
  gravDir: 1 | -1;
  /** Cupido: 1 = derecho, -1 = invertido (suavizado, para dibujar) */
  flip: number;
  /** Cisne: segundos desde el último aletazo */
  holdT: number;
}

export interface Body {
  cy: number;
  vy: number;
  grounded: boolean;
}

export interface StepEvents {
  flap?: boolean;
  hop?: boolean;
  flip?: boolean;
  land?: boolean;
}

// --- Cisne ---
const SWAN_GRAVITY = 1250;
const SWAN_FLAP = -430;
const SWAN_REPEAT = 0.26;
const SWAN_MAX = 520;
// --- Limusina ---
const LIMO_JUMP = -780;
const LIMO_G_DOWN = 3000;
const LIMO_G_HOLD = 1250;
// --- Cupido ---
const CUPID_G = 3200;
const CUPID_MAX = 1100;
const CUPID_FLIP_KICK = 160;

export function createVehicle(kind: VehicleKind): Vehicle {
  return { kind, hp: 1, age: 0, pulse: 1, wheel: 0, gravDir: 1, flip: 1, holdT: 0 };
}

/** Elige un vehículo al azar, sin repetir el último */
export function pickVehicle(rnd: () => number, last: VehicleKind | null, owned?: VehicleKind[]): VehicleKind {
  const all = owned && owned.length ? owned : (Object.keys(VEHICLES) as VehicleKind[]);
  const pool = all.filter((k) => k !== last);
  const from = pool.length ? pool : all; // si solo tienes uno, siempre ese
  return from[Math.floor(rnd() * from.length)];
}

/** Caja de colisión actual del vehículo (incluye al novio) */
export function vehicleRect(kind: VehicleKind, cy: number) {
  const d = VEHICLES[kind];
  return { x: GROOM_X + d.ox - d.w / 2, y: cy + d.oy - d.h / 2, w: d.w, h: d.h };
}

/** Avanza la física de un vehículo. Modifica `body` y devuelve los eventos ocurridos. */
export function stepVehicle(v: Vehicle, body: Body, input: { thrust: boolean; tap: boolean; speed: number }, dt: number): StepEvents {
  const d = VEHICLES[v.kind];
  const ev: StepEvents = {};
  v.age += dt;
  v.pulse = Math.max(0, v.pulse - dt * 3.5);
  v.wheel += (input.speed * dt) / 13;
  const wasGrounded = body.grounded;

  if (v.kind === 'swan') {
    v.holdT += dt;
    if (input.tap || (input.thrust && v.holdT >= SWAN_REPEAT)) {
      body.vy = SWAN_FLAP;
      v.holdT = 0;
      v.pulse = 1;
      ev.flap = true;
    }
    body.vy = clamp(body.vy + SWAN_GRAVITY * dt, -SWAN_MAX, SWAN_MAX);
  } else if (v.kind === 'limo') {
    if (body.grounded && input.thrust) {
      body.vy = LIMO_JUMP;
      body.grounded = false;
      v.pulse = 1;
      ev.hop = true;
    }
    const g = input.thrust && body.vy < 0 ? LIMO_G_HOLD : LIMO_G_DOWN;
    body.vy = Math.min(body.vy + g * dt, 900);
  } else {
    if (input.tap) {
      v.gravDir = v.gravDir === 1 ? -1 : 1;
      body.vy = v.gravDir * CUPID_FLIP_KICK;
      v.pulse = 1;
      ev.flip = true;
    }
    body.vy = clamp(body.vy + CUPID_G * v.gravDir * dt, -CUPID_MAX, CUPID_MAX);
    v.flip += (v.gravDir - v.flip) * Math.min(1, dt * 14);
  }

  body.cy += body.vy * dt;

  // límites verticales del vehículo
  let onFloor = false;
  if (body.cy >= d.maxY) {
    body.cy = d.maxY;
    if (body.vy > 0) body.vy = 0;
    onFloor = true;
  }
  if (body.cy <= d.minY) {
    body.cy = d.minY;
    if (body.vy < 0) body.vy = 0;
  }

  // "grounded" = apoyado en una superficie (piso, o techo si Cupido va invertido)
  if (v.kind === 'cupid') {
    body.grounded = v.gravDir === 1 ? onFloor : body.cy <= d.minY;
  } else {
    body.grounded = onFloor && body.vy >= 0;
  }
  if (body.grounded && !wasGrounded && v.age > 0.3) ev.land = true;
  return ev;
}
