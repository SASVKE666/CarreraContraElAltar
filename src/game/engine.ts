/**
 * Motor de "Novio en Fuga": un runner de scroll lateral estilo Jetpack Joyride.
 * Lógica y dibujo viven aquí sin depender de React (se puede probar fuera del navegador).
 *
 * Mantén presionado = el novio sube con su jetpack de champaña; suelta = cae.
 * Cada golpe acerca a la novia; si te alcanza, se acabó.
 */
import {
  CEIL_Y,
  COLORS,
  FIRST_GIFT_M,
  FLOOR_Y,
  GIFT_MIN_PATTERNS,
  GROOM_MAX_Y,
  GROOM_MIN_Y,
  GROOM_X,
  H,
  HIT_PENALTY,
  MAX_GAP,
  PickupType,
  POWERUP,
  PX_PER_M,
  START_GAP,
  VEHICLES,
  W,
  ZONE_LENGTH_M,
  ZONES,
  type VehicleKind,
} from './constants';
import { sound } from './sound';
import { drawBackdropVeil, drawVignette, drawZone } from './art/backgrounds';
import { drawAmbientBack, drawAtmosphere, drawGrade, drawLights, fxTick, softShadow, type Light } from './art/fx';
import { drawChurch, drawChurchCarpet, DOOR_HALF_W } from './art/church';
import { drawBride, drawGroom, GROOM_SKIN, NOZZLES, type GroomPose } from './art/characters';
import { circle, clamp, drawHeart, drawText, lerp, poly, rrect } from './art/core';
import * as P from './art/props';
import {
  drawGift,
  drawVehicleBack,
  drawVehicleFront,
  drawVehicleIcon,
  vehicleTilt,
  type VehicleAnim,
} from './art/vehicles';
import { createVehicle, pickVehicle, stepVehicle, vehicleRect, type StepEvents, type Vehicle } from './vehicles';
import {
  ACHIEVEMENT_BY_ID,
  addRunToTotals,
  liveSnapshot,
  mergeRecords,
  newlyEarned,
  newRunStats,
  runRecords,
  type RunStats,
} from './achievements';
import { getSave, updateSave } from './save';

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  /** 0 = atrapado, 100 = lejos de la novia */
  brideDistancePct: number;
  shield: boolean;
  magnetTimer: number;
  turboTimer: number;
  isGameOver: boolean;
  isPaused: boolean;
  /** Vehículo en uso (o null) */
  vehicle: VehicleKind | null;
  /** Logros desbloqueados durante esta partida (ids) */
  unlocked: string[];
}

/**
 * title: pantalla de inicio (la puerta de la iglesia cerrada, temblando).
 * breakout: el novio toma impulso y la puerta está a punto de reventar.
 * playing / caught / over: la partida.
 */
export type GameState = 'title' | 'breakout' | 'playing' | 'caught' | 'over';

/** El primer nivel es el jardín (afuera de la iglesia); después el salón y por último la catedral */
const ZONE_ORDER = [1, 0, 2];
/** Segundos de tensión antes de que reviente la puerta */
const WINDUP = 0.42;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

interface Ring {
  x: number;
  y: number;
  phase: number;
  taken: boolean;
}
interface Zapper {
  cx: number;
  baseY: number;
  cy: number;
  len: number;
  angle: number;
  spin: number;
  oscAmp: number;
  oscSpeed: number;
  oscPhase: number;
  seed: number;
  dead: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface Tower {
  x: number;
  rows: number;
  dead: boolean;
}
interface Chandelier {
  x: number;
  len: number;
  dead: boolean;
}
interface Missile {
  x: number;
  y: number;
  dead: boolean;
  trail: number;
  dodged: boolean;
}
interface Gift {
  x: number;
  y: number;
  phase: number;
  taken: boolean;
}
interface Warning {
  y: number;
  age: number;
  announced: boolean;
}
interface Pickup {
  type: PickupType;
  x: number;
  y: number;
  phase: number;
  taken: boolean;
}
interface Particle {
  kind: 'foam' | 'spark' | 'confetti' | 'heart' | 'petal' | 'dust' | 'plank' | 'stone';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
  g: number;
}
// --- Parámetros de física del jetpack ---
const THRUST_ACC = 2700;
const GRAVITY = 1500;
const VY_UP = -480;
const VY_DOWN = 640;
const BASE_SPEED = 330;
/** Cada cuántos metros el marcador de distancia salta y cambia de color */
const MILESTONE_EVERY = 250;
/** Segundos que se muestra el título del vehículo (antes 3.8) y que dura la calma sin peligros */
const VEHICLE_TITLE_T = 2.3;
/** Segundos que se muestra "¡HUYE DE LA NOVIA!" al empezar (antes 4.2; ahora el 75 %) */
const START_TITLE_T = 3.15;
/** Segundos que se muestra cada aviso de logro */
const TOAST_T = 3.2;
/** Colores del marcador de distancia: uno nuevo en cada meta (el primero es el normal) */
const METER_COLORS = ['#fff4e0', '#ffd34d', '#ff8fc0', '#7fe0a0', '#8fdcff', '#c9a3ff'];
/**
 * Velocidad de scroll según los metros recorridos: sube de forma continua y suave,
 * rápido al principio y más despacio después (330 → ~775 a 2500 m → ~1000 a 6000 m).
 */
export function speedAt(m: number) {
  return BASE_SPEED + Math.min(m, 2500) * 0.178 + Math.max(0, Math.min(m, 6000) - 2500) * 0.065;
}
/** Segundos de invulnerabilidad tras un golpe (antes 1.6) */
const INVULN_HIT = 0.8;
const WARN_LOCK = 0.95;
const WARN_LAUNCH = 1.5;
const MISSILE_EXTRA = 420;

// Un camino es "libre" si el novio cabe por debajo o por encima del obstáculo con margen
const PASS_BELOW_MAX = 350;
const PASS_ABOVE_MIN = 194;
const isPassable = (minY: number, maxY: number) => maxY <= PASS_BELOW_MAX || minY >= PASS_ABOVE_MIN;

export interface GameOptions {
  best?: number;
  seed?: number;
}

export class Game {
  state: GameState = 'title';
  t = 0;

  // jugador
  cy = GROOM_MAX_Y;
  vy = 0;
  grounded = true;
  thrusting = false;
  invuln = 0;

  // progreso
  dist = 0;
  speed = BASE_SPEED;
  coins = 0;
  gap = START_GAP;
  shield = false;
  magnet = 0;
  turbo = 0;
  best: number;

  // entidades
  rings: Ring[] = [];
  zappers: Zapper[] = [];
  towers: Tower[] = [];
  chandeliers: Chandelier[] = [];
  missiles: Missile[] = [];
  warnings: Warning[] = [];
  pickups: Pickup[] = [];
  gifts: Gift[] = [];
  particles: Particle[] = [];

  // novia / ambiente
  brideY = GROOM_MAX_Y - 10;
  caughtT = 0;
  banner: { title: string; sub: string; t: number; dur?: number } | null = null;

  // vehículo y logros
  vehicle: Vehicle | null = null;
  run: RunStats = newRunStats();
  /** Ids de logros desbloqueados en esta partida */
  unlockedNow: string[] = [];
  toasts: { id: string; t: number }[] = [];
  // salida por la puerta de la iglesia
  doorShake = 0;
  doorBulge = 0;
  blown = false;
  blastT = 0;
  /** El novio sale de la puerta: empieza detrás (negativo) y llega a su sitio */
  introX = 0;
  private breakoutT = 0;
  private hintT = 0;
  private knockT = 0;
  private nextKnock = 1.6;
  zoneFrom = 0;
  zoneTo = 0;
  /** x de pantalla donde empieza el escenario nuevo (se acerca a 0 y entonces ocupa todo) */
  zoneCutX = 0;
  shake = 0;
  flash = 0;
  private lastHitAt = -99;
  private nextMilestone = MILESTONE_EVERY;
  private milestones = 0;
  private milestoneFx = 0;
  private ringsBonus = 0;
  private foamAcc = 0;
  private dustAcc = 0;
  private nextSpawn = 650;
  private patternIndex = 0;
  private lastWasHazard = false;
  private sincePowerup = 0;
  private lastPattern = '';
  private repeats = 0;
  private thrustSound = false;
  private overNotified = false;
  private prevThrust = false;
  private committed = false;
  private cleanStart = 0;
  private ceilT = 0;
  private nearMiss = false;
  private achTimer = 0;
  private sinceGift = 0;
  private giftsSpawned = 0;
  private lastKind: VehicleKind | null = null;
  private rnd: () => number;

  constructor(opts: GameOptions = {}) {
    this.best = opts.best ?? 0;
    if (opts.seed !== undefined) {
      let s = opts.seed >>> 0;
      this.rnd = () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    } else {
      this.rnd = Math.random;
    }
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                         */
  /* ------------------------------------------------------------------ */

  get distM() {
    return this.dist / PX_PER_M;
  }

  get isOver() {
    return this.state === 'over';
  }

  stats(): GameStats {
    // al guardarse la partida la distancia queda congelada (coincide con el récord guardado)
    const dist = Math.floor(this.committed ? this.run.distance : this.distM);
    return {
      score: dist + this.coins * 10,
      distance: dist,
      coins: this.coins,
      speed: Math.round(this.speed),
      brideDistancePct: clamp((this.gap / MAX_GAP) * 100, 0, 100),
      shield: this.shield,
      magnetTimer: this.magnet,
      turboTimer: this.turbo,
      isGameOver: this.state === 'over' || this.state === 'caught',
      isPaused: false,
      vehicle: this.vehicle?.kind ?? null,
      unlocked: [...this.unlockedNow],
    };
  }

  /** Devuelve true una sola vez cuando termina la animación de captura */
  consumeGameOver(): boolean {
    if (this.state === 'over' && !this.overNotified) {
      this.overNotified = true;
      return true;
    }
    return false;
  }

  /** Detiene el sonido del propulsor (al pausar o desmontar) */
  silence() {
    if (this.thrustSound) {
      sound.stopThrust();
      this.thrustSound = false;
    }
  }

  /** Al salir de la partida (menú, cerrar pestaña): guarda lo recorrido hasta ahora */
  dispose() {
    this.silence();
    if (this.state === 'playing' || this.state === 'caught') this.finishRun();
  }

  /* ------------------------------------------------------------------ */
  /* Logros y guardado                                                   */
  /* ------------------------------------------------------------------ */

  private checkAchievements() {
    const save = getSave();
    const earned = newlyEarned(save, liveSnapshot(save, this.run, this.committed));
    if (!earned.length) return;
    updateSave((d) => {
      for (const a of earned) d.unlocked[a.id] = Date.now();
    });
    for (const a of earned) {
      this.unlockedNow.push(a.id);
      this.toasts.push({ id: a.id, t: TOAST_T });
    }
    sound.playAchievement();
  }

  /** Suma esta partida a los totales y récords (una sola vez) */
  private commitRun() {
    if (this.committed || this.preRun) return;
    this.committed = true;
    const run = this.run;
    updateSave((d) => {
      d.wallet += run.rings; // los anillos de la partida se guardan en la cartera para la tienda
      d.totals = addRunToTotals(d.totals, run);
      d.totals.games += 1;
      if (run.caught) d.totals.caught += 1;
      d.records = mergeRecords(d.records, runRecords(run));
      d.best = Math.max(d.best, Math.floor(run.distance));
    });
    this.checkAchievements();
  }

  private finishRun() {
    this.run.distance = this.distM;
    this.checkAchievements();
    this.commitRun();
  }

  /** Contadores por partida que dependen del tiempo/distancia */
  private trackRun(dt: number, dx: number) {
    const run = this.run;
    run.distance = this.distM;
    if (this.vehicle) run.vehicleMeters += dx / PX_PER_M;
    run.maxClean = Math.max(run.maxClean, this.distM - this.cleanStart);
    const minY = this.vehicle ? VEHICLES[this.vehicle.kind].minY : GROOM_MIN_Y;
    if (this.cy <= minY + 0.5) {
      this.ceilT += dt;
      run.maxCeil = Math.max(run.maxCeil, this.ceilT);
    } else {
      this.ceilT = 0;
    }
    if (this.gap <= 30) this.nearMiss = true;
    else if (this.nearMiss && this.gap >= 110) run.closeCall = true;
    this.achTimer += dt;
    if (this.achTimer >= 0.25) {
      this.achTimer = 0;
      this.checkAchievements();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  private r(a = 0, b = 1) {
    return a + this.rnd() * (b - a);
  }
  private pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rnd() * arr.length)];
  }
  private get playerRect(): Rect {
    return { x: GROOM_X - 15, y: this.cy - 34, w: 30, h: 66 };
  }
  /** Caja de colisión actual: la del vehículo si va a bordo, si no la del novio */
  private get hitRect(): Rect {
    return this.vehicle ? vehicleRect(this.vehicle.kind, this.cy) : this.playerRect;
  }
  /** ¿Toca la caja de colisión un punto con radio r? */
  private touches(x: number, y: number, r: number) {
    const b = this.hitRect;
    return Math.hypot(x - clamp(x, b.x, b.x + b.w), y - clamp(y, b.y, b.y + b.h)) < r;
  }
  /** Antes de empezar a correr (pantalla de inicio o tomando impulso) */
  get preRun() {
    return this.state === 'title' || this.state === 'breakout';
  }
  /** Empieza la salida: el novio toma impulso y revienta la puerta */
  start() {
    if (this.state !== 'title') return;
    this.state = 'breakout';
    this.breakoutT = 0;
    this.knockT = 0;
    sound.playHit();
  }

  private blast() {
    this.state = 'playing';
    this.blown = true;
    this.blastT = 0;
    this.doorBulge = 0;
    this.doorShake = 0;
    this.speed = 520; // el empujón de la explosión, luego se asienta
    this.introX = -90;
    this.vy = -330;
    this.grounded = false;
    this.invuln = 0.6;
    this.shake = 0.7;
    this.flash = 0.8;
    sound.playExplosion();
    const dx = GROOM_X;
    for (let i = 0; i < 20; i++) {
      this.emit({
        kind: 'plank',
        x: dx + this.r(-60, 60),
        y: this.r(FLOOR_Y - 250, FLOOR_Y - 30),
        vx: this.r(120, 720),
        vy: this.r(-560, 80),
        life: 1.8,
        max: 1.8,
        size: this.r(5, 9),
        color: this.pick(['#6d3d27', '#8a5236', '#4a2616', '#a3683f']),
        rot: this.r(0, 6.28),
        vr: this.r(-14, 14),
        g: 1100,
      });
    }
    for (let i = 0; i < 16; i++) {
      this.emit({
        kind: 'stone',
        x: dx + this.r(-90, 90),
        y: this.r(FLOOR_Y - 260, FLOOR_Y - 60),
        vx: this.r(-260, 520),
        vy: this.r(-480, 40),
        life: 1.7,
        max: 1.7,
        size: this.r(5, 11),
        color: this.pick(['#dcc6a8', '#b99d79', '#ecdcc4', '#9c8362']),
        rot: this.r(0, 6.28),
        vr: this.r(-10, 10),
        g: 1200,
      });
    }
    for (let i = 0; i < 18; i++) {
      this.emit({
        kind: 'dust',
        x: dx + this.r(-70, 70),
        y: this.r(FLOOR_Y - 220, FLOOR_Y - 10),
        vx: this.r(-160, 380),
        vy: this.r(-150, 40),
        life: 1.3,
        max: 1.3,
        size: this.r(8, 14),
        color: this.pick(['#efe0cf', '#d9c3a6', '#ffffff']),
        rot: 0,
        vr: 0,
        g: -20,
      });
    }
    this.burst('spark', dx, FLOOR_Y - 120, 14, ['#fff3b8', '#ffffff', '#ffb347'], 460, 0.6, 0);
    this.burst('petal', dx, FLOOR_Y - 150, 14, ['#ffffff', COLORS.blush, COLORS.rose], 360, 1.4, 160);
    this.hintT = 1.1; // las instrucciones salen un momento después, para que se vea la explosión
  }

  /** Pantalla de inicio y toma de impulso (todavía no se juega) */
  private updateIntro(dt: number, thrust: boolean) {
    if (this.state === 'title') {
      if (thrust) this.start(); // atajo para pruebas; la app usa start()
      this.nextKnock -= dt;
      if (this.nextKnock <= 0) {
        this.nextKnock = this.r(2.6, 4.2);
        this.knockT = 0.4;
        for (let i = 0; i < 4; i++) {
          this.emit({
            kind: 'dust',
            x: GROOM_X + this.r(-DOOR_HALF_W, DOOR_HALF_W),
            y: FLOOR_Y - 250 + this.r(0, 40),
            vx: this.r(-20, 20),
            vy: this.r(10, 60),
            life: 0.9,
            max: 0.9,
            size: this.r(3, 6),
            color: '#efe0cf',
            rot: 0,
            vr: 0,
            g: 40,
          });
        }
      }
      this.knockT = Math.max(0, this.knockT - dt);
      this.doorShake = Math.sin(this.t * 70) * 3 * (this.knockT / 0.4);
      // pétalos flotando
      if (this.rnd() < dt * 2.2) {
        this.emit({
          kind: 'petal',
          x: W + 10,
          y: this.r(60, 380),
          vx: -this.r(50, 130),
          vy: this.r(8, 40),
          life: 11,
          max: 11,
          size: this.r(3, 5.5),
          color: this.pick(['#ffffff', COLORS.blush, '#ffd1e0']),
          rot: this.r(0, 6.28),
          vr: this.r(-3, 3),
          g: 0,
        });
      }
    } else {
      this.breakoutT += dt;
      const k = clamp(this.breakoutT / WINDUP, 0, 1);
      this.doorBulge = k;
      this.doorShake = Math.sin(this.t * 90) * (2 + k * 6);
      this.shake = Math.max(this.shake, 0.05 + k * 0.1);
      if (this.rnd() < dt * 40) {
        this.emit({
          kind: 'dust',
          x: GROOM_X + this.r(-DOOR_HALF_W - 10, DOOR_HALF_W + 10),
          y: this.r(FLOOR_Y - 260, FLOOR_Y - 10),
          vx: this.r(-40, 40),
          vy: this.r(-10, 50),
          life: 0.7,
          max: 0.7,
          size: this.r(3, 6),
          color: '#efe0cf',
          rot: 0,
          vr: 0,
          g: 120,
        });
      }
      if (this.breakoutT >= WINDUP) this.blast();
    }
    this.updateParticles(dt);
  }

  private get brideX() {
    return GROOM_X - this.gap - 36;
  }

  private emit(p: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y'>) {
    if (this.particles.length > 420) return;
    this.particles.push({
      vx: 0,
      vy: 0,
      life: 0.6,
      max: 0.6,
      size: 4,
      color: '#fff',
      rot: 0,
      vr: 0,
      g: 0,
      ...p,
    });
  }

  private burst(
    kind: Particle['kind'],
    x: number,
    y: number,
    n: number,
    colors: string[],
    speed: number,
    life = 0.9,
    g = 500
  ) {
    for (let i = 0; i < n; i++) {
      const a = this.r(0, Math.PI * 2);
      const s = this.r(0.3, 1) * speed;
      this.emit({
        kind,
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - speed * 0.25,
        life: life * this.r(0.6, 1),
        max: life,
        size: this.r(3, 7),
        color: this.pick(colors),
        rot: this.r(0, 6.28),
        vr: this.r(-9, 9),
        g,
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Generación de patrones                                              */
  /* ------------------------------------------------------------------ */

  private addRings(pts: [number, number][]) {
    for (const [x, y] of pts) {
      this.rings.push({ x, y: clamp(y, GROOM_MIN_Y, GROOM_MAX_Y), phase: this.r(0, 6), taken: false });
    }
  }

  private ringsLine(x: number, y: number, n: number, sp = 34) {
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) pts.push([x + i * sp, y]);
    this.addRings(pts);
    return (n - 1) * sp;
  }

  private pRingsLine() {
    const n = Math.floor(this.r(5, 9));
    return this.ringsLine(W + 80, this.r(150, 410), n);
  }

  private pRingsWave() {
    const x0 = W + 80;
    const yc = this.r(210, 350);
    const amp = this.r(45, 85);
    const n = 11;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) pts.push([x0 + i * 32, yc + Math.sin(i * 0.62) * amp]);
    this.addRings(pts);
    return (n - 1) * 32;
  }

  private pRingsHeart() {
    const x0 = W + 80;
    const yc = this.r(230, 330);
    const pts: [number, number][] = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(a), 3);
      const hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      pts.push([x0 + 100 + hx * 6.2, yc + hy * 6.2]);
    }
    this.addRings(pts);
    return 210;
  }

  private pRingsClimb() {
    const x0 = W + 80;
    const up = this.rnd() < 0.5;
    const n = 8;
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) pts.push([x0 + i * 36, (up ? 400 : 160) + (up ? -1 : 1) * i * 30]);
    this.addRings(pts);
    return (n - 1) * 36;
  }

  /** Elige un centro vertical tal que la zona bloqueada (±half) deje un camino libre */
  private pickCenter(half: number): { yc: number; below: boolean } {
    const lo = CEIL_Y + half + 12;
    const hi = FLOOR_Y - half - 12;
    for (let i = 0; i < 40; i++) {
      const yc = this.r(lo, Math.max(lo + 1, hi));
      if (isPassable(yc - half, yc + half)) {
        const canBelow = yc + half <= PASS_BELOW_MAX;
        const canAbove = yc - half >= PASS_ABOVE_MIN;
        return { yc, below: canBelow && (!canAbove || this.rnd() < 0.5) };
      }
    }
    // Plan B: pegado al techo, siempre se puede pasar por debajo
    return { yc: CEIL_Y + half + 12, below: true };
  }

  private rewardRoute(cx: number, yc: number, half: number, below: boolean) {
    const y = below ? Math.min(430, yc + half + 66) : Math.max(116, yc - half - 66);
    this.ringsLine(cx - 70, y, 5, 35);
  }

  private makeZapper(cx: number, baseY: number, len: number, angle: number, extra: Partial<Zapper> = {}): Zapper {
    const z: Zapper = {
      cx,
      baseY,
      cy: baseY,
      len,
      angle,
      spin: 0,
      oscAmp: 0,
      oscSpeed: 0,
      oscPhase: this.r(0, 6),
      seed: Math.floor(this.r(1, 999)),
      dead: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      ...extra,
    };
    this.placeZapper(z);
    this.zappers.push(z);
    return z;
  }

  private placeZapper(z: Zapper) {
    z.cy = z.baseY + Math.sin(this.t * z.oscSpeed + z.oscPhase) * z.oscAmp;
    const hx = (Math.cos(z.angle) * z.len) / 2;
    const hy = (Math.sin(z.angle) * z.len) / 2;
    z.x1 = z.cx - hx;
    z.y1 = z.cy - hy;
    z.x2 = z.cx + hx;
    z.y2 = z.cy + hy;
  }

  private pZapper(kind: 'v' | 'h' | 'd' | 'spin' | 'move', x0 = W + 80) {
    const NODE = 14;
    if (kind === 'h') {
      const len = this.r(140, 240);
      const yc = this.r(150, 400);
      this.makeZapper(x0 + len / 2, yc, len, 0);
      // recompensa en el lado más amplio
      const below = yc < 270;
      this.ringsLine(x0 + len / 2 - 70, below ? Math.min(430, yc + 66) : Math.max(116, yc - 66), 5, 35);
      return len;
    }
    if (kind === 'v') {
      const len = this.r(110, 190);
      const half = len / 2 + NODE;
      const { yc, below } = this.pickCenter(half);
      this.makeZapper(x0 + 30, yc, len, Math.PI / 2);
      this.rewardRoute(x0 + 30, yc, half, below);
      return 70;
    }
    if (kind === 'd') {
      const len = this.r(130, 210);
      const ang = (this.rnd() < 0.5 ? 1 : -1) * this.r(0.55, 0.95);
      const half = (Math.abs(Math.sin(ang)) * len) / 2 + NODE;
      const { yc, below } = this.pickCenter(half);
      this.makeZapper(x0 + 70, yc, len, ang);
      this.rewardRoute(x0 + 70, yc, half, below);
      return 150;
    }
    if (kind === 'spin') {
      const len = this.r(130, 180);
      const half = len / 2 + NODE;
      const { yc, below } = this.pickCenter(half);
      this.makeZapper(x0 + 60, yc, len, this.r(0, 3), { spin: (this.rnd() < 0.5 ? 1 : -1) * this.r(1.4, 2.1) });
      this.rewardRoute(x0 + 60, yc, half, below);
      return 120;
    }
    // move: sube y baja
    const len = this.r(100, 140);
    const amp = this.r(60, 95);
    const half = len / 2 + NODE + amp;
    const { yc, below } = this.pickCenter(half);
    this.makeZapper(x0 + 30, yc, len, Math.PI / 2, { oscAmp: amp, oscSpeed: this.r(1.5, 2.2) });
    this.rewardRoute(x0 + 30, yc, half, below);
    return 70;
  }

  private pZapperPair() {
    const w1 = this.pZapper(this.pick(['v', 'd', 'h'] as const));
    const off = w1 + 330 + this.speed * 0.25;
    const w2 = this.pZapper(this.pick(['v', 'd', 'spin'] as const), W + 80 + off);
    return off + w2;
  }

  private pTower() {
    const rows = Math.floor(this.r(3, 8));
    const w = P.towerWidth(rows);
    const cx = W + 80 + w / 2;
    this.towers.push({ x: cx, rows, dead: false });
    const top = FLOOR_Y - P.towerHeight(rows);
    this.ringsLine(cx - 70, Math.max(118, top - 70), 5, 35);
    return w;
  }

  private pChandelier() {
    // Máximo 185: la araña termina a ~359 px y siempre cabe el novio por debajo
    const len = this.r(70, 185);
    const cx = W + 80 + P.CHANDELIER_W / 2;
    this.chandeliers.push({ x: cx, len, dead: false });
    const bottom = CEIL_Y + len + P.CHANDELIER_H;
    this.ringsLine(cx - 70, Math.min(430, bottom + 62), 5, 35);
    return P.CHANDELIER_W;
  }

  /** Puerta: araña arriba + torre abajo con un hueco generoso entre ambas */
  private pGate() {
    const rows = this.rnd() < 0.5 ? 2 : 3;
    const w = Math.max(P.towerWidth(rows), P.CHANDELIER_W);
    const cx = W + 80 + w / 2;
    const towerTop = FLOOR_Y - P.towerHeight(rows);
    const bottom = Math.max(CEIL_Y + P.CHANDELIER_H + 10, towerTop - this.r(176, 205));
    const len = bottom - P.CHANDELIER_H - CEIL_Y;
    this.towers.push({ x: cx, rows, dead: false });
    this.chandeliers.push({ x: cx, len, dead: false });
    this.ringsLine(cx - 100, (bottom + towerTop) / 2, 7, 33);
    return w + 40;
  }

  private pMissiles() {
    const d = clamp(this.distM / 2000, 0, 1);
    const n = d < 0.3 ? 1 : d < 0.6 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      this.warnings.push({ y: this.cy, age: -i * 0.5, announced: false });
    }
    return this.speed * (2.2 + 0.5 * (n - 1));
  }

  private pPowerup() {
    const types: PickupType[] = [];
    if (!this.shield) types.push('shield', 'shield', 'shield');
    if (this.magnet <= 0) types.push('magnet', 'magnet');
    if (this.turbo <= 0 && this.rnd() < 0.5) types.push('turbo'); // la Luna de miel (invencible) sale la mitad de veces
    if (!types.length) return this.pRingsLine();
    const x0 = W + 80;
    const y = this.r(170, 390);
    this.pickups.push({ type: this.pick(types), x: x0 + 80, y, phase: this.r(0, 6), taken: false });
    this.ringsLine(x0 - 40, y, 3, 34);
    return 100;
  }

  private pGift() {
    const x0 = W + 80;
    const y = this.r(170, 390);
    this.gifts.push({ x: x0 + 80, y, phase: this.r(0, 6), taken: false });
    this.ringsLine(x0 - 40, y, 3, 34);
    return 100;
  }

  private spawnPattern() {
    const d = clamp(this.distM / 2000, 0, 1);
    const m = this.distM;
    let name: string;

    // Primeros patrones guiados
    const script = ['ringsLine', 'tower', 'ringsWave', 'zapperH', 'chandelier'];
    const giftDue =
      !this.vehicle &&
      m >= FIRST_GIFT_M &&
      (this.giftsSpawned === 0 || (this.sinceGift >= GIFT_MIN_PATTERNS && this.rnd() < 0.3));
    if (this.patternIndex < script.length) {
      name = script[this.patternIndex];
    } else if (giftDue) {
      name = 'gift';
    } else if (this.sincePowerup >= 7 && this.rnd() < 0.5) {
      name = 'powerup';
    } else {
      const c: [string, number][] = [
        ['ringsLine', this.lastWasHazard ? 4 : 1.2],
        ['ringsWave', this.lastWasHazard ? 3 : 1],
        ['ringsClimb', this.lastWasHazard ? 2 : 0.6],
        ['zapperV', 3 + 2 * d],
        ['zapperH', 2.4 + 2 * d],
        ['tower', 2.4],
        ['chandelier', 2.4],
      ];
      if (m > 120) c.push(['ringsHeart', 1]);
      if (m > 200) c.push(['zapperD', 2 + 2 * d], ['missile', 2 + 2 * d]);
      if (m > 260) c.push(['gate', 1.6 + d]);
      if (m > 350) c.push(['zapperSpin', 1.6 + 1.4 * d]);
      if (m > 450) c.push(['zapperMove', 1.4 + 1.2 * d]);
      if (m > 600) c.push(['zapperPair', 1 + 2 * d]);
      // evita repetir el mismo patrón más de 2 veces
      const filtered = c.filter(([n]) => !(n === this.lastPattern && this.repeats >= 2));
      const total = filtered.reduce((s, [, w]) => s + w, 0);
      let roll = this.rnd() * total;
      name = filtered[0][0];
      for (const [n, w] of filtered) {
        roll -= w;
        if (roll <= 0) {
          name = n;
          break;
        }
      }
    }

    let width = 0;
    let hazard = true;
    switch (name) {
      case 'ringsLine':
        width = this.pRingsLine();
        hazard = false;
        break;
      case 'ringsWave':
        width = this.pRingsWave();
        hazard = false;
        break;
      case 'ringsClimb':
        width = this.pRingsClimb();
        hazard = false;
        break;
      case 'ringsHeart':
        width = this.pRingsHeart();
        hazard = false;
        break;
      case 'powerup':
        width = this.pPowerup();
        hazard = false;
        break;
      case 'gift':
        width = this.pGift();
        hazard = false;
        this.giftsSpawned++;
        break;
      case 'zapperV':
        width = this.pZapper('v');
        break;
      case 'zapperH':
        width = this.pZapper('h');
        break;
      case 'zapperD':
        width = this.pZapper('d');
        break;
      case 'zapperSpin':
        width = this.pZapper('spin');
        break;
      case 'zapperMove':
        width = this.pZapper('move');
        break;
      case 'zapperPair':
        width = this.pZapperPair();
        break;
      case 'tower':
        width = this.pTower();
        break;
      case 'chandelier':
        width = this.pChandelier();
        break;
      case 'gate':
        width = this.pGate();
        break;
      case 'missile':
        width = this.pMissiles();
        break;
    }

    if (name === this.lastPattern) this.repeats++;
    else this.repeats = 1;
    this.lastPattern = name;
    this.patternIndex++;
    this.sincePowerup = name === 'powerup' ? 0 : this.sincePowerup + 1;
    this.sinceGift = name === 'gift' ? 0 : this.sinceGift + 1;
    this.lastWasHazard = hazard;

    const gapAfter = hazard ? 170 + this.speed * 0.55 : 70 + this.r(0, 90);
    this.nextSpawn += width + gapAfter;
  }

  /* ------------------------------------------------------------------ */
  /* Actualización                                                       */
  /* ------------------------------------------------------------------ */

  update(dtRaw: number, thrust: boolean) {
    const dt = Math.min(dtRaw, 1 / 30);
    this.t += dt;
    if (this.toasts.length) {
      // se muestran de uno en uno, en cola
      this.toasts[0].t -= dt;
      if (this.toasts[0].t <= 0) this.toasts.shift();
    }

    if (this.preRun) {
      this.thrusting = false;
      this.updateIntro(dt, thrust);
      return;
    }

    if (this.state === 'over') {
      this.updateParticles(dt);
      return;
    }

    if (this.state === 'caught') {
      this.updateCaught(dt);
      return;
    }

    // ---------------- playing ----------------
    const tap = thrust && !this.prevThrust; // flanco de subida: un toque nuevo
    this.prevThrust = thrust;
    this.thrusting = thrust && !this.vehicle;
    if (this.thrusting !== this.thrustSound) {
      this.thrustSound = this.thrusting;
      if (this.thrusting) sound.startThrust();
      else sound.stopThrust();
    }

    // el novio sale de la puerta
    this.introX += (0 - this.introX) * Math.min(1, dt * 7);
    this.blastT += dt;
    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT <= 0) {
        this.banner = {
          title: '¡HUYE DE LA NOVIA!',
          sub: 'MANTÉN PRESIONADO PARA VOLAR · SUELTA PARA CAER',
          t: START_TITLE_T,
          dur: START_TITLE_T,
        };
      }
    }

    // velocidad
    const base = speedAt(this.distM);
    const target = base + (this.turbo > 0 ? POWERUP.turboSpeedBonus : 0);
    this.speed += (target - this.speed) * Math.min(1, dt * 2.2);

    // física vertical
    if (this.vehicle) {
      const body = { cy: this.cy, vy: this.vy, grounded: this.grounded };
      const ev = stepVehicle(this.vehicle, body, { thrust, tap, speed: this.speed }, dt);
      this.cy = body.cy;
      this.vy = body.vy;
      this.grounded = body.grounded;
      this.vehicleFx(ev, dt);
    } else {
      this.stepJetpack(thrust, dt);
    }

    // espuma del propulsor
    if (this.thrusting) {
      this.foamAcc += dt * (this.turbo > 0 ? 170 : 110);
      while (this.foamAcc >= 1) {
        this.foamAcc -= 1;
        const nz = NOZZLES[Math.floor(this.rnd() * NOZZLES.length)];
        this.emit({
          kind: 'foam',
          x: GROOM_X + nz.x + this.r(-2, 2),
          y: this.cy + nz.y,
          vx: -this.speed * 0.35 + this.r(-70, 20),
          vy: this.r(160, 330),
          life: this.r(0.35, 0.7),
          max: 0.7,
          size: this.r(3, 7.5),
          color: this.pick(['#ffffff', '#fff6d6', '#ffe9a0', '#fdf3ff']),
          g: 120,
        });
      }
    }
    // polvo al correr
    if (this.grounded && !this.vehicle) {
      this.dustAcc += dt * 18;
      while (this.dustAcc >= 1) {
        this.dustAcc -= 1;
        this.emit({
          kind: 'dust',
          x: GROOM_X - 12,
          y: FLOOR_Y - 3,
          vx: -this.speed * 0.4 + this.r(-30, 10),
          vy: this.r(-40, -10),
          life: 0.4,
          max: 0.4,
          size: this.r(3, 5),
          color: '#efe0cf',
        });
      }
    }

    // avance del mundo
    const dx = this.speed * dt;
    this.dist += dx;

    // entidades
    for (const r of this.rings) r.x -= dx;
    for (const p of this.pickups) p.x -= dx;
    for (const g of this.gifts) g.x -= dx;
    for (const tw of this.towers) tw.x -= dx;
    for (const ch of this.chandeliers) ch.x -= dx;
    for (const z of this.zappers) {
      z.cx -= dx;
      z.angle += z.spin * dt;
      this.placeZapper(z);
    }
    for (const mi of this.missiles) {
      mi.x -= (this.speed + MISSILE_EXTRA) * dt;
      mi.trail += dt;
      if (!mi.dodged && !mi.dead && mi.x < GROOM_X - 70) {
        mi.dodged = true; // pasó de largo sin tocarte
        this.run.dodged++;
      }
      if (this.rnd() < dt * 40) {
        this.emit({
          kind: 'petal',
          x: mi.x + 40,
          y: mi.y + this.r(-8, 8),
          vx: this.r(10, 60),
          vy: this.r(-30, 30),
          life: 0.5,
          max: 0.5,
          size: this.r(3, 5),
          color: this.pick([COLORS.rose, COLORS.blush]),
          rot: this.r(0, 6),
          vr: this.r(-8, 8),
        });
      }
    }
    // advertencias → misiles
    for (const w of this.warnings) {
      w.age += dt;
      if (w.age >= 0 && !w.announced) {
        w.announced = true;
        sound.playWarning();
      }
      if (w.age >= 0 && w.age < WARN_LOCK) w.y += (this.cy - w.y) * Math.min(1, dt * 7);
      if (w.age >= WARN_LAUNCH) {
        this.missiles.push({ x: W + 60, y: w.y, dead: false, trail: 0, dodged: false });
        sound.playLaunch();
      }
    }
    this.warnings = this.warnings.filter((w) => w.age < WARN_LAUNCH);

    // generación
    while (this.dist >= this.nextSpawn) this.spawnPattern();

    // colisiones y recompensas
    this.collide(dt);
    this.trackRun(dt, dx);

    // limpieza fuera de pantalla
    this.rings = this.rings.filter((r) => !r.taken && r.x > -60);
    this.pickups = this.pickups.filter((p) => !p.taken && p.x > -60);
    this.gifts = this.gifts.filter((g) => !g.taken && g.x > -60);
    this.towers = this.towers.filter((o) => !o.dead && o.x > -200);
    this.chandeliers = this.chandeliers.filter((o) => !o.dead && o.x > -120);
    this.zappers = this.zappers.filter((z) => !z.dead && z.cx > -320);
    this.missiles = this.missiles.filter((m) => !m.dead && m.x > -140);

    // novia
    const targetY = clamp(this.cy - 8, CEIL_Y + 74, FLOOR_Y - 60);
    this.brideY += (targetY - this.brideY) * Math.min(1, dt * 3.2);
    if (this.turbo > 0) this.gap = Math.min(MAX_GAP, this.gap + 70 * dt);
    else if (this.t - this.lastHitAt > 2) this.gap = Math.min(MAX_GAP, this.gap + 5 * dt);

    // temporizadores
    this.invuln = Math.max(0, this.invuln - dt);
    this.magnet = Math.max(0, this.magnet - dt);
    if (this.turbo > 0) {
      this.turbo = Math.max(0, this.turbo - dt);
      if (this.turbo === 0) this.invuln = Math.max(this.invuln, 1);
    }
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt * 1.8);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }

    // zonas e hitos
    const zone = Math.floor(this.distM / ZONE_LENGTH_M) % ZONES.length;
    if (zone !== this.zoneTo) {
      // corte seco, como en Jetpack Joyride: el escenario nuevo entra por la derecha con un borde recto
      this.zoneFrom = this.zoneTo;
      this.zoneTo = zone;
      this.zoneCutX = W;
      sound.playZone();
    }
    if (this.zoneCutX > 0) this.zoneCutX -= this.speed * dt;
    if (this.distM >= this.nextMilestone) {
      this.nextMilestone += MILESTONE_EVERY;
      this.milestones++;
      this.milestoneFx = 1; // el marcador de metros salta y cambia de color
    }
    this.milestoneFx = Math.max(0, this.milestoneFx - dt / 0.7);

    this.updateParticles(dt);
  }

  /** Física del jetpack: mantener = sube, soltar = cae */
  private stepJetpack(thrust: boolean, dt: number) {
    this.vy += (thrust ? -THRUST_ACC : GRAVITY) * dt;
    this.vy = clamp(this.vy, VY_UP, VY_DOWN);
    this.cy += this.vy * dt;
    const wasGrounded = this.grounded;
    if (this.cy >= GROOM_MAX_Y) {
      this.cy = GROOM_MAX_Y;
      if (this.vy > 0) this.vy = 0;
    }
    if (this.cy <= GROOM_MIN_Y) {
      this.cy = GROOM_MIN_Y;
      if (this.vy < 0) this.vy = 0;
    }
    this.grounded = this.cy >= GROOM_MAX_Y - 0.5 && this.vy >= 0;
    if (this.grounded && !wasGrounded) {
      this.burst('dust', GROOM_X - 4, FLOOR_Y - 2, 5, ['#e9d3bd', '#f8ecdd'], 90, 0.5, -60);
    }
  }

  /** Sonidos y partículas de cada vehículo */
  private vehicleFx(ev: StepEvents, dt: number) {
    const v = this.vehicle;
    if (!v) return;
    if (ev.flap) {
      sound.playFlap();
      this.run.flaps++;
      this.burst('petal', GROOM_X - 34, this.cy + 4, 4, ['#ffffff', '#ffd1e0', '#fff0f5'], 120, 0.7, 120);
    }
    if (ev.hop) {
      sound.playHop();
      this.burst('dust', GROOM_X, FLOOR_Y - 4, 6, ['#efe0cf', '#ffffff'], 120, 0.5, -40);
    }
    if (ev.land) {
      this.burst('dust', GROOM_X, FLOOR_Y - 4, 8, ['#efe0cf', '#ffffff'], 140, 0.5, -40);
      if (v.kind === 'limo') this.shake = Math.max(this.shake, 0.06);
    }
    if (ev.flip) {
      sound.playFlip();
      this.run.flips++;
      this.burst('heart', GROOM_X, this.cy, 6, [COLORS.rose, COLORS.blush, '#ff6b9a'], 180, 0.8, -60);
    }
    if (v.kind === 'limo' && this.grounded && this.rnd() < dt * 24) {
      this.emit({
        kind: 'dust',
        x: GROOM_X - 60,
        y: this.cy + 30,
        vx: -this.speed * 0.4 + this.r(-30, 10),
        vy: this.r(-50, -15),
        life: 0.45,
        max: 0.45,
        size: this.r(3, 6),
        color: '#d9cbbd',
      });
    }
    if (v.kind === 'cupid' && this.rnd() < dt * 10) {
      this.emit({
        kind: 'heart',
        x: GROOM_X - 44,
        y: this.cy + this.r(-8, 8),
        vx: -this.speed * 0.4,
        vy: this.r(-20, 20),
        life: 0.7,
        max: 0.7,
        size: this.r(4, 6),
        color: this.pick([COLORS.rose, COLORS.blush]),
      });
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0 && p.x > -40 && p.x < W + 40 && p.y < H + 40);
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt * 1.8);
  }

  private updateCaught(dt: number) {
    this.caughtT += dt;
    this.speed = Math.max(0, this.speed - this.speed * Math.min(1, dt * 4));
    this.dist += this.speed * dt;
    // el novio se desploma suavemente hacia el piso
    this.vy = Math.min(VY_DOWN, this.vy + GRAVITY * 0.35 * dt);
    this.cy = clamp(this.cy + this.vy * dt, GROOM_MIN_Y, GROOM_MAX_Y);
    this.grounded = this.cy >= GROOM_MAX_Y - 0.5;
    this.gap = Math.max(0, this.gap - 260 * dt);
    this.brideY += (this.cy - 8 - this.brideY) * Math.min(1, dt * 6);
    if (this.rnd() < dt * 14) {
      this.emit({
        kind: 'heart',
        x: GROOM_X + this.r(-30, 30),
        y: this.cy - 30,
        vx: this.r(-40, 40),
        vy: this.r(-130, -60),
        life: 1.1,
        max: 1.1,
        size: this.r(7, 12),
        color: this.pick([COLORS.rose, COLORS.blush, '#ff6b9a']),
      });
    }
    for (const w of this.missiles) w.x -= (this.speed + MISSILE_EXTRA * 0.3) * dt;
    this.updateParticles(dt);
    if (this.caughtT >= 2.1) {
      this.state = 'over';
      this.silence();
    }
  }

  private collide(dt: number) {
    const pr = this.hitRect;
    const cxp = GROOM_X;
    const cyp = this.cy;

    // anillos
    for (const r of this.rings) {
      if (r.taken) continue;
      if (this.magnet > 0) {
        const dx = cxp - r.x;
        const dy = cyp - r.y;
        const dd = Math.hypot(dx, dy);
        if (dd < POWERUP.magnetRadius) {
          const k = Math.min(1, dt * 9);
          r.x += dx * k;
          r.y += dy * k;
        }
      }
      const nx = clamp(r.x, pr.x, pr.x + pr.w);
      const ny = clamp(r.y, pr.y, pr.y + pr.h);
      if (Math.hypot(r.x - nx, r.y - ny) < 17) {
        r.taken = true;
        this.coins++;
        this.run.rings++;
        if (this.magnet > 0) this.run.ringsMagnet++;
        this.ringsBonus++;
        sound.playCoin();
        this.burst('spark', r.x, r.y, 5, [COLORS.gold, '#fff3b8'], 140, 0.4, 0);
        if (this.ringsBonus % 12 === 0) {
          this.gap = Math.min(MAX_GAP, this.gap + 14);
        }
      }
    }

    // power-ups
    for (const p of this.pickups) {
      if (p.taken) continue;
      if (this.touches(p.x, p.y, 30)) {
        p.taken = true;
        sound.playPowerup();
        this.burst('confetti', p.x, p.y, 16, [COLORS.rose, COLORS.gold, COLORS.blush, '#9bd7ff'], 260, 0.9, 600);
        if (p.type === 'shield') {
          this.shield = true;
        } else if (p.type === 'magnet') {
          this.magnet = POWERUP.magnetDuration;
        } else {
          this.turbo = POWERUP.turboDuration;
          this.flash = 0.5;
        }
      }
    }

    // regalos de boda -> vehículo
    for (const g of this.gifts) {
      if (g.taken || this.vehicle) continue;
      if (this.touches(g.x, g.y, 30)) this.openGift(g);
    }

    // peligros
    const test = (hit: boolean, obj: { dead: boolean }, ex: number, ey: number) => {
      if (!hit || obj.dead) return;
      if (this.turbo > 0) {
        this.run.smashTurbo++;
        obj.dead = true;
        this.burst('confetti', ex, ey, 14, [COLORS.rose, COLORS.gold, '#fff', COLORS.blush], 300, 0.9, 700);
        sound.playExplosion();
        this.shake = Math.max(this.shake, 0.12);
        return;
      }
      if (this.invuln > 0) return;
      this.takeHit(ex, ey);
    };

    for (const z of this.zappers) {
      if (z.x2 < pr.x - 40 && z.x1 < pr.x - 40) continue;
      const n = Math.max(2, Math.ceil(z.len / 10));
      let hit = false;
      for (let i = 0; i <= n && !hit; i++) {
        const k = i / n;
        const px = lerp(z.x1, z.x2, k);
        const py = lerp(z.y1, z.y2, k);
        hit = px > pr.x - 6 && px < pr.x + pr.w + 6 && py > pr.y - 6 && py < pr.y + pr.h + 6;
      }
      test(hit, z, GROOM_X, this.cy);
    }
    for (const tw of this.towers) {
      if (Math.abs(tw.x - GROOM_X) > 160) continue;
      const hit = P.towerRects(tw.x, tw.rows).some((r) => overlap(pr, r));
      if (hit && !tw.dead && this.vehicle?.kind === 'limo') {
        this.crushTower(tw); // la limusina aplasta las torres de copas sin daño
        continue;
      }
      test(hit, tw, GROOM_X + 10, this.cy);
    }
    for (const ch of this.chandeliers) {
      if (Math.abs(ch.x - GROOM_X) > 120) continue;
      test(P.chandelierRects(ch.x, CEIL_Y, ch.len).some((r) => overlap(pr, r)), ch, GROOM_X + 10, this.cy);
    }
    for (const mi of this.missiles) {
      test(overlap(pr, P.missileRect(mi.x, mi.y)), mi, mi.x - 20, mi.y);
    }
  }

  private openGift(g: Gift) {
    g.taken = true;
    const kind = pickVehicle(this.rnd, this.lastKind);
    this.lastKind = kind;
    this.vehicle = createVehicle(kind);
    const d = VEHICLES[kind];
    this.run.gifts++;
    this.run.kinds[kind] = true;
    this.cy = clamp(this.cy, d.minY, d.maxY);
    this.vy = 0;
    this.grounded = false;
    this.invuln = Math.max(this.invuln, 0.5);
    this.flash = Math.max(this.flash, 0.3);
    sound.playGift();
    this.burst('confetti', g.x, g.y, 22, [COLORS.rose, COLORS.gold, COLORS.blush, '#9bd7ff', '#ffffff'], 300, 1, 600);
    this.banner = { title: d.name.toUpperCase(), sub: d.how, t: VEHICLE_TITLE_T, dur: VEHICLE_TITLE_T };
    // como en Jetpack Joyride: se destruyen las trampas y misiles que hay en pantalla y no llegan más
    // hasta que el título termine, para poder leer los controles sin que te golpeen
    this.clearHazards();
    this.nextSpawn = Math.max(this.nextSpawn, this.dist + this.speed * VEHICLE_TITLE_T - (W + 80 - GROOM_X));
  }

  /** Destruye todos los peligros que existen ahora (con chispas los que se ven en pantalla) */
  private clearHazards() {
    const pop = (x: number, y: number) => {
      if (x < -30 || x > W + 30) return;
      this.burst('confetti', x, y, 10, [COLORS.rose, COLORS.gold, '#ffffff', COLORS.blush], 280, 0.8, 600);
      this.burst('spark', x, y, 5, ['#ffffff', '#fff3b8'], 240, 0.45, 0);
    };
    for (const z of this.zappers) pop((z.x1 + z.x2) / 2, (z.y1 + z.y2) / 2);
    for (const tw of this.towers) pop(tw.x, FLOOR_Y - 60);
    for (const ch of this.chandeliers) pop(ch.x, CEIL_Y + ch.len + 50);
    for (const mi of this.missiles) pop(mi.x, mi.y);
    const any = this.zappers.length + this.towers.length + this.chandeliers.length + this.missiles.length + this.warnings.length;
    this.zappers = [];
    this.towers = [];
    this.chandeliers = [];
    this.missiles = [];
    this.warnings = [];
    if (any > 0) {
      sound.playExplosion();
      this.shake = Math.max(this.shake, 0.15);
    }
  }

  private crushTower(tw: Tower) {
    tw.dead = true;
    this.run.towersCrushed++;
    sound.playCrush();
    this.shake = Math.max(this.shake, 0.18);
    this.burst('confetti', tw.x, FLOOR_Y - 50, 22, ['#eaf6ff', '#f7d36a', '#ffffff', '#cfe9ff'], 340, 0.9, 700);
    this.burst('spark', tw.x, FLOOR_Y - 70, 8, ['#ffffff', '#fff3b8'], 260, 0.5, 0);
  }

  /** El vehículo absorbe el golpe y se destruye; el novio sigue con el jetpack, sin castigo */
  private breakVehicle(ex: number, ey: number) {
    const v = this.vehicle;
    if (!v) return;
    v.hp--;
    if (v.hp > 0) return;
    const d = VEHICLES[v.kind];
    this.vehicle = null;
    this.invuln = INVULN_HIT;
    this.shake = 0.4;
    this.flash = 0.35;
    sound.playHit();
    sound.playExplosion();
    const colors =
      v.kind === 'swan'
        ? ['#ffffff', '#ffb3cc', '#ffd1e0']
        : v.kind === 'limo'
          ? ['#dfe8ef', COLORS.rose, COLORS.gold, '#ffffff']
          : ['#9bd7ff', COLORS.gold, '#ffffff', COLORS.blush];
    this.burst('confetti', GROOM_X, this.cy, 26, colors, 380, 1, 700);
    this.burst('petal', GROOM_X, this.cy, 12, colors, 300, 0.9, 400);
    this.burst('spark', ex, ey, 10, ['#fff3b8', '#ff8fc0'], 260, 0.5, 0);
    this.cy = clamp(this.cy, GROOM_MIN_Y, GROOM_MAX_Y);
    this.vy = -220;
    this.grounded = false;
  }

  private takeHit(ex: number, ey: number) {
    this.run.hits++;
    this.cleanStart = this.distM;
    if (this.vehicle) {
      this.breakVehicle(ex, ey);
      return;
    }
    if (this.shield) {
      this.run.shieldsUsed++;
      this.shield = false;
      this.invuln = 0.5;
      sound.playShieldBreak();
      this.burst('spark', GROOM_X, this.cy, 22, ['#ffffff', COLORS.blush, '#bfe3ff'], 320, 0.7, 200);
      this.shake = 0.2;
      return;
    }
    this.gap -= HIT_PENALTY;
    this.invuln = INVULN_HIT;
    this.shake = 0.45;
    this.flash = 0.45;
    this.lastHitAt = this.t;
    sound.playHit();
    this.burst('petal', ex, ey, 14, [COLORS.rose, COLORS.blush, '#ffffff'], 300, 0.9, 400);
    this.burst('spark', ex, ey, 10, ['#fff3b8', '#ff8fc0'], 260, 0.5, 0);
    this.vy = Math.min(this.vy, -120);
    if (this.gap <= 0) {
      this.catchGroom();
    }
  }

  private catchGroom() {
    this.gap = Math.max(this.gap, 0);
    this.run.caught = true;
    this.state = 'caught';
    this.caughtT = 0;
    this.thrusting = false;
    this.silence();
    sound.playGameOver();
    this.burst('heart', GROOM_X, this.cy - 20, 18, [COLORS.rose, COLORS.blush, '#ff6b9a'], 220, 1.4, -40);
    this.finishRun();
  }

  /* ------------------------------------------------------------------ */
  /* Dibujo                                                              */
  /* ------------------------------------------------------------------ */

  /** Luces dinámicas de la escena (resplandores aditivos): jugador, anillos, peligros y regalos */
  private collectLights(): Light[] {
    const L: Light[] = [];
    if (!this.preRun) {
      const gx = GROOM_X + this.introX;
      const turbo = this.turbo > 0;
      L.push({ x: gx, y: this.cy, r: turbo ? 170 : 100, color: turbo ? 'gold' : 'warm', a: turbo ? 0.55 : 0.26 });
      if (this.thrusting && !this.vehicle) L.push({ x: gx - 22, y: this.cy + 26, r: 58, color: 'orange', a: 0.42 });
      if (this.shield) L.push({ x: gx, y: this.cy, r: 90, color: 'white', a: 0.2 });
    }
    let nr = 0;
    for (const r of this.rings) {
      if (r.x > -20 && r.x < W + 20 && nr++ < 14) L.push({ x: r.x, y: r.y, r: 30, color: 'gold', a: 0.3 });
    }
    for (const p of this.pickups) if (p.x > -30 && p.x < W + 30) L.push({ x: p.x, y: p.y, r: 44, color: 'white', a: 0.4 });
    for (const g of this.gifts) if (g.x > -40 && g.x < W + 40) L.push({ x: g.x, y: g.y, r: 66, color: 'gold', a: 0.55 });
    for (const z of this.zappers) {
      if (z.x2 < -60 || z.x1 > W + 60) continue;
      L.push({ x: z.x1, y: z.y1, r: 44, color: 'pink', a: 0.5 });
      L.push({ x: z.x2, y: z.y2, r: 44, color: 'pink', a: 0.5 });
      L.push({ x: (z.x1 + z.x2) / 2, y: (z.y1 + z.y2) / 2, r: 38, color: 'pink', a: 0.32 });
    }
    for (const mi of this.missiles) if (mi.x > -60 && mi.x < W + 100) L.push({ x: mi.x + 32, y: mi.y, r: 62, color: 'orange', a: 0.5 });
    for (const ch of this.chandeliers) if (ch.x > -120 && ch.x < W + 120) L.push({ x: ch.x, y: CEIL_Y + ch.len + 44, r: 110, color: 'warm', a: 0.28 });
    return L;
  }

  render(ctx: CanvasRenderingContext2D) {
    fxTick();
    ctx.save();
    if (this.shake > 0) {
      const a = Math.min(1, this.shake * 2.2) * 6;
      ctx.translate((this.rnd() - 0.5) * a * 2, (this.rnd() - 0.5) * a * 2);
    }

    // fondo
    const sc = this.dist;
    if (this.zoneCutX > 0) {
      drawZone(ctx, ZONE_ORDER[this.zoneFrom], sc, 1);
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.zoneCutX, 0, W - this.zoneCutX + 2, H);
      ctx.clip();
      drawZone(ctx, ZONE_ORDER[this.zoneTo], sc, 1);
      ctx.restore();
    } else {
      drawZone(ctx, ZONE_ORDER[this.zoneTo], sc, 1);
    }
    // fachada de la iglesia (se aleja con el scroll al empezar)
    const doorX = GROOM_X - this.dist;
    drawChurchCarpet(ctx, doorX);
    drawChurch(ctx, doorX, {
      shake: this.doorShake,
      bulge: this.doorBulge,
      blown: this.blown,
      blastT: this.blastT,
      t: this.t,
    });
    drawBackdropVeil(ctx);
    const zoneIdx = ZONE_ORDER[this.zoneTo];
    drawAmbientBack(ctx, zoneIdx, this.t, this.dist); // oclusión, haces de luz y niebla

    // sombras suaves de contacto
    if (!this.preRun) softShadow(ctx, GROOM_X + this.introX, FLOOR_Y - this.cy - 36, this.vehicle ? 46 : 24);
    for (const tw of this.towers) {
      if (tw.x < -140 || tw.x > W + 140) continue;
      const base = P.towerRects(tw.x, tw.rows)[0];
      softShadow(ctx, base.x + base.w / 2, 0, base.w / 2 + 8, 0.9);
    }
    if (!this.preRun) softShadow(ctx, this.brideX, FLOOR_Y - this.brideY - 40, 30, 0.8);
    for (const g of this.gifts) softShadow(ctx, g.x, FLOOR_Y - g.y, 16, 0.7);

    // anillos y power-ups
    for (const r of this.rings) {
      if (r.x > -30 && r.x < W + 30) P.drawRing(ctx, r.x, r.y, this.t, r.phase);
    }
    for (const p of this.pickups) P.drawPickup(ctx, p.type, p.x, p.y, this.t, p.phase);
    for (const g of this.gifts) drawGift(ctx, g.x, g.y, this.t, g.phase);

    // obstáculos
    for (const tw of this.towers) P.drawTower(ctx, tw.x, tw.rows);
    for (const ch of this.chandeliers) P.drawChandelier(ctx, ch.x, CEIL_Y, ch.len, this.t);
    for (const z of this.zappers) P.drawZapper(ctx, z.x1, z.y1, z.x2, z.y2, this.t, z.seed);
    for (const mi of this.missiles) P.drawMissile(ctx, mi.x, mi.y, this.t);

    // novia
    const closeness = 1 - clamp(this.gap / MAX_GAP, 0, 1);
    const grabbing = this.state === 'caught' || this.gap < 55;
    if (!this.preRun) drawBride(ctx, this.brideX, this.brideY, this.t, closeness, grabbing);

    // novio (con o sin vehículo); durante el inicio sigue escondido detrás de la puerta
    const fear = clamp(0.2 + closeness * 1.1, 0, 1);
    if (!this.preRun) this.drawPlayer(ctx, fear);

    // partículas
    this.drawParticles(ctx);
    drawLights(ctx, this.collectLights(), this.t);

    // advertencias de misil (encima de todo, sin temblor propio)
    for (const w of this.warnings) {
      if (w.age >= 0) P.drawWarning(ctx, W - 48, w.y, this.t, w.age >= WARN_LOCK);
    }
    ctx.restore();

    // efectos de pantalla completa
    drawAtmosphere(ctx, zoneIdx, this.t, this.dist); // polvo y destellos
    if (this.turbo > 0) this.drawSpeedLines(ctx);
    drawVignette(ctx);
    drawGrade(ctx, zoneIdx, ZONE_ORDER[this.zoneFrom], this.zoneCutX, this.t); // color, contraste y grano
    if (closeness > 0.65 && !this.preRun) {
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 9);
      ctx.fillStyle = `rgba(255,30,70,${(closeness - 0.65) * 0.55 * (0.5 + pulse * 0.5)})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, this.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (!this.preRun) {
      this.drawHud(ctx);
      this.drawBanner(ctx);
      this.drawToasts(ctx);
    }
    this.drawOverlays(ctx);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, fear: number) {
    const v = this.vehicle;
    const pose: GroomPose = {
      t: this.t,
      thrusting: this.thrusting,
      grounded: this.grounded,
      vy: this.vy,
      fear,
      stunned: !v && this.invuln > 0 && this.turbo <= 0 && this.introX > -1 && this.blastT > 0.7,
      shield: this.shield,
      turbo: this.turbo > 0,
      caught: this.state === 'caught' || this.state === 'over',
      outfit: getSave().outfit, // lo que compraste en la tienda
    };
    if (!v) {
      drawGroom(ctx, GROOM_X + this.introX, this.cy, pose);
      return;
    }
    const d = VEHICLES[v.kind];
    const anim: VehicleAnim = { t: this.t, pulse: v.pulse, wheel: v.wheel, vy: this.vy, grounded: this.grounded };
    ctx.save();
    ctx.translate(GROOM_X, this.cy);
    if (v.kind === 'cupid') ctx.scale(1, v.flip); // la carroza se voltea con la gravedad
    ctx.rotate(vehicleTilt(v.kind, anim));
    ctx.translate(-GROOM_X, -this.cy);
    const vskin = getSave().vehicleSkins[v.kind];
    drawVehicleBack(ctx, v.kind, GROOM_X, this.cy, anim, vskin);
    drawGroom(ctx, GROOM_X + d.riderX, this.cy + d.riderY, { ...pose, rider: true, thrusting: false, grounded: false });
    drawVehicleFront(ctx, v.kind, GROOM_X, this.cy, anim, vskin);
    ctx.restore();
  }

  /** Aviso de logro: cabe en la franja del marcador, entre la barra de los novios y los anillos */
  private drawToasts(ctx: CanvasRenderingContext2D) {
    const tst = this.toasts[0];
    const a = tst && ACHIEVEMENT_BY_ID[tst.id];
    if (!a) return;
    const inK = clamp((TOAST_T - tst.t) * 5, 0, 1);
    const outK = clamp(tst.t * 3, 0, 1);
    const k = Math.min(inK, outK);
    const e = 1 - Math.pow(1 - inK, 3);
    const w = 176;
    const h = 42;
    const x = 648 + (1 - e) * 14;
    const y = 10;
    ctx.save();
    ctx.globalAlpha = k;
    rrect(ctx, x, y, w, h, 13, 'rgba(42,11,29,.94)', 3);
    ctx.beginPath();
    ctx.roundRect(x + 3.5, y + 3.5, w - 7, h - 7, 10);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = COLORS.gold;
    ctx.stroke();
    ctx.font = '24px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(a.icon, x + 23, y + h / 2 + 1);
    drawText(ctx, '¡LOGRO!', x + 42, y + 17, 10, COLORS.gold, { strokeW: 2.5 });
    // el nombre se encoge si no cabe
    let fs = 15;
    ctx.font = `${fs}px "Titan One", "Arial Black", system-ui, sans-serif`;
    const maxW = w - 50;
    const tw = ctx.measureText(a.name).width;
    if (tw > maxW) fs = Math.max(9, Math.floor((fs * maxW) / tw));
    drawText(ctx, a.name, x + 42, y + 35, fs, COLORS.cream, { strokeW: 3 });
    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const k = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.4);
      ctx.translate(p.x, p.y);
      switch (p.kind) {
        case 'foam':
        case 'dust': {
          if (p.size > 7) ctx.globalAlpha *= 0.5; // nubes grandes de la explosión: más suaves
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (p.kind === 'foam' ? 0.6 + (1 - k) * 0.7 : 0.7 + (1 - k)), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'spark': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.5, -1.4, p.size, 2.8);
          ctx.fillRect(-1.4, -p.size * 0.5, 2.8, p.size);
          break;
        }
        case 'confetti': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.6, -p.size * 0.3, p.size * 1.2, p.size * 0.6);
          break;
        }
        case 'petal': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'heart': {
          drawHeart(ctx, 0, 0, p.size, p.color, 2);
          break;
        }
        case 'plank': {
          // astilla de la puerta
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = COLORS.ink;
          ctx.lineWidth = 2.2;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-p.size * 1.9, -p.size * 0.5);
          ctx.lineTo(p.size * 1.7, -p.size * 0.7);
          ctx.lineTo(p.size * 2.1, p.size * 0.1);
          ctx.lineTo(p.size * 1.4, p.size * 0.6);
          ctx.lineTo(-p.size * 1.9, p.size * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
        case 'stone': {
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = COLORS.ink;
          ctx.lineWidth = 2.2;
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size * 0.4);
          ctx.lineTo(-p.size * 0.2, -p.size);
          ctx.lineTo(p.size, -p.size * 0.5);
          ctx.lineTo(p.size * 0.8, p.size * 0.7);
          ctx.lineTo(-p.size * 0.5, p.size * 0.8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    }
  }

  private drawSpeedLines(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) {
      const y = CEIL_Y + 10 + ((i * 97 + 31) % (FLOOR_Y - CEIL_Y - 20));
      const x = ((i * 211 - this.t * 2300 * (0.6 + (i % 3) * 0.3)) % (W + 300)) + W;
      const xx = ((x % (W + 300)) + (W + 300)) % (W + 300);
      ctx.beginPath();
      ctx.moveTo(xx - 140, y);
      ctx.lineTo(xx, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private miniFace(ctx: CanvasRenderingContext2D, x: number, y: number, bride: boolean) {
    circle(ctx, x, y, 13, bride ? COLORS.skin : GROOM_SKIN, 2.8);
    ctx.beginPath();
    ctx.arc(x, y - 1, 13, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineTo(x + 6, y - 5);
    ctx.closePath();
    ctx.fillStyle = bride ? '#2f1b1b' : COLORS.hair;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    circle(ctx, x + 4, y + 1, 2, COLORS.ink, 0);
    if (bride) {
      poly(ctx, [x - 6, y - 12, x - 3, y - 19, x, y - 12, x + 3, y - 19, x + 6, y - 12], COLORS.gold, 1.8);
      ctx.beginPath();
      ctx.moveTo(x - 1, y - 5);
      ctx.lineTo(x + 8, y - 2);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();
    } else {
      poly(ctx, [x + 1, y + 13, x - 7, y + 9, x - 7, y + 17], COLORS.rose, 1.6);
      poly(ctx, [x + 1, y + 13, x + 9, y + 9, x + 9, y + 17], COLORS.rose, 1.6);
    }
  }

  private drawHud(ctx: CanvasRenderingContext2D) {
    const m = Math.floor(this.distM);
    // distancia: salta unos pixeles y cambia de color al llegar a cada meta
    const fx = this.milestoneFx;
    const hop = fx > 0 ? Math.abs(Math.sin((1 - fx) * Math.PI * 2.5)) * 9 * fx : 0;
    const tier = this.milestones === 0 ? 0 : 1 + ((this.milestones - 1) % (METER_COLORS.length - 1));
    ctx.save();
    ctx.translate(0, -hop);
    drawText(ctx, `${m} m`, 22, 44, 34, fx > 0.55 ? '#ffffff' : METER_COLORS[tier]);
    ctx.restore();
    if (this.best > 0) {
      drawText(ctx, `MEJOR ${this.best} m`, 24, 61, 13, '#ffd9e4', { strokeW: 3.5 });
    }
    // anillos
    drawText(ctx, String(this.coins), W - 24, 44, 32, COLORS.gold, { align: 'right' });
    P.drawRing(ctx, W - 40 - String(this.coins).length * 17, 33, 0.2, 0);

    // medidor de la novia
    const cx = W / 2;
    const bw = 240;
    const x0 = cx - bw / 2;
    const frac = clamp(this.gap / MAX_GAP, 0, 1);
    rrect(ctx, x0, 22, bw, 18, 9, '#2a1420', 3.2);
    const col = frac > 0.55 ? '#6fdc8c' : frac > 0.28 ? '#ffc545' : '#ff4466';
    if (frac > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x0 + 2, 24, (bw - 4) * frac, 14, 7);
      ctx.fillStyle = col;
      ctx.globalAlpha = frac < 0.28 ? 0.6 + 0.4 * Math.sin(this.t * 14) : 1;
      ctx.fill();
      ctx.restore();
    }
    this.miniFace(ctx, x0 - 22, 31, true);
    this.miniFace(ctx, x0 + bw + 22, 31, false);
    drawHeart(ctx, cx, 31, 7, 'rgba(255,255,255,.8)', 1.6);

    // power-ups activos
    let ix = 34;
    const iy = 92;
    if (this.vehicle) {
      rrect(ctx, 10, iy - 24, 84, 48, 14, 'rgba(42,20,32,.6)', 2.6);
      drawVehicleIcon(ctx, this.vehicle.kind, 52, iy + 4, 56, this.t, getSave().vehicleSkins[this.vehicle.kind]);
      ix += 92;
    }
    const bar = (type: PickupType, frac2: number) => {
      P.drawPickupIcon(ctx, type, ix, iy, 17);
      if (frac2 >= 0) {
        rrect(ctx, ix - 17, iy + 22, 34, 7, 3.5, '#2a1420', 2);
        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(ix - 15, iy + 24, 30 * clamp(frac2, 0, 1), 3);
      }
      ix += 46;
    };
    if (this.shield) bar('shield', -1);
    if (this.magnet > 0) bar('magnet', this.magnet / POWERUP.magnetDuration);
    if (this.turbo > 0) bar('turbo', this.turbo / POWERUP.turboDuration);
  }

  private drawBanner(ctx: CanvasRenderingContext2D) {
    if (!this.banner) return;
    const b = this.banner;
    const inK = clamp(((b.dur ?? 3) - b.t) * 4, 0, 1);
    const outK = clamp(b.t * 2.5, 0, 1);
    const a = Math.min(inK, outK);
    const y = 150 + (1 - inK) * -20;
    drawText(ctx, b.title, W / 2, y, 52, COLORS.gold, { align: 'center', alpha: a, strokeW: 9 });
    drawText(ctx, b.sub, W / 2, y + 34, 21, COLORS.cream, { align: 'center', alpha: a, strokeW: 5 });
  }

  private drawOverlays(ctx: CanvasRenderingContext2D) {
    if (this.state === 'caught') {
      const k = clamp(this.caughtT * 3, 0, 1);
      ctx.fillStyle = `rgba(120,10,50,${0.3 * k})`;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, 210);
      ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      drawText(ctx, '¡ATRAPADO!', 0, 0, 72, COLORS.rose, { align: 'center', strokeW: 12, alpha: k });
      ctx.restore();
    }
  }
}
