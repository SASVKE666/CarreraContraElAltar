/**
 * Componente React que monta el canvas del juego, captura la entrada
 * (teclado, mouse, toque) y ejecuta el bucle principal.
 */
import React, { useEffect, useRef } from 'react';
import { setRenderScale } from './art/core';
import { H, W } from './constants';
import { Game, GameStats } from './engine';
import { sound } from './sound';

export type { GameStats };

interface RunnerCanvasProps {
  /** 'title': pantalla de inicio (la puerta cerrada). 'run': el novio revienta la puerta y se corre. */
  mode: 'title' | 'run';
  isPaused: boolean;
  /** Mejor distancia (m) para mostrarla en el HUD */
  best: number;
  onGameOver: (stats: GameStats) => void;
}

const THRUST_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);

export const RunnerCanvas: React.FC<RunnerCanvasProps> = ({ mode, isPaused, best, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(isPaused);
  const gameOverRef = useRef(onGameOver);
  const gameRef = useRef<Game | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  pausedRef.current = isPaused;
  gameOverRef.current = onGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    setRenderScale(dpr);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const game = new Game({ best });
    gameRef.current = game;
    if (modeRef.current === 'run') game.start(); // reintentar: directo a reventar la puerta
    let keyHeld = false;
    let pointerHeld = false;
    // Un toque más corto que un fotograma igual cuenta (vehículos que reaccionan al toque)
    let tapLatch = false;
    let last = performance.now();
    let raf = 0;
    let finished = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (THRUST_KEYS.has(e.code)) {
        e.preventDefault();
        if (!e.repeat) {
          keyHeld = true;
          tapLatch = true;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (THRUST_KEYS.has(e.code)) keyHeld = false;
    };
    const release = () => {
      keyHeld = false;
      pointerHeld = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      pointerHeld = true;
      tapLatch = true;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura de puntero */
      }
    };
    const onPointerUp = () => {
      pointerHeld = false;
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', release);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('contextmenu', onContextMenu);

    if (modeRef.current === 'run') sound.startMusic();

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && !finished) {
        // en la pantalla de inicio los toques no cuentan (el menú arranca la partida)
        const input = modeRef.current === 'run' && (keyHeld || pointerHeld || tapLatch);
        game.update(dt, input);
        tapLatch = false;
      } else {
        game.silence();
      }
      game.render(ctx);
      if (!finished && game.consumeGameOver()) {
        finished = true;
        sound.stopMusic();
        gameOverRef.current(game.stats());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      gameRef.current = null;
      game.dispose(); // guarda lo recorrido si sales a mitad de partida
      sound.stopMusic();
    };
    // El juego se crea una sola vez por montaje (App cambia la `key` para reiniciar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // del menú a la partida: se mantiene la misma escena y el novio revienta la puerta
  useEffect(() => {
    if (mode === 'run' && gameRef.current && gameRef.current.state === 'title') {
      gameRef.current.start();
      sound.startMusic();
    }
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full touch-none select-none cursor-pointer"
      style={{ touchAction: 'none' }}
      aria-label="Novio en Fuga: mantén presionado para volar"
    />
  );
};
