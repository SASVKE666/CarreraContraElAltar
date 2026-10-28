import React, { useCallback, useEffect, useRef, useState } from 'react';
import { INTRO_SOURCES, INTRO_POSTER } from '../game/introSources';

interface IntroSequenceProps {
  onComplete: () => void;
}

const CANDIDATES = INTRO_SOURCES;
const introPoster = INTRO_POSTER;

type Problem = null | 'tap' | 'failed';

/**
 * Secuencia de intro: tarjeta de título -> video -> menú.
 * La tarjeta existe porque los navegadores (sobre todo en móvil) solo permiten audio
 * tras un toque; ese toque llama a play() directamente, que es lo que exige iOS.
 * El video se precarga mientras se ve la tarjeta. Nunca se salta el video en silencio:
 * si no se puede reproducir, se avisa y se ofrece reintentar o continuar.
 */
export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'title' | 'video'>('title');
  const [canSkip, setCanSkip] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const indexRef = useRef(-1);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  }, [onComplete]);

  /** Carga el siguiente formato que el navegador declare reproducible. false si ya no quedan. */
  const loadNext = useCallback((): boolean => {
    const v = videoRef.current;
    if (!v) return false;
    for (let i = indexRef.current + 1; i < CANDIDATES.length; i++) {
      const c = CANDIDATES[i];
      if (v.canPlayType(c.type) !== '') {
        indexRef.current = i;
        v.src = c.url;
        v.load();
        return true;
      }
    }
    indexRef.current = CANDIDATES.length;
    return false;
  }, []);

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (!p) return;
    p.then(() => setProblem(null)).catch((err: unknown) => {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return; // un load() interrumpió esta petición; ya hay otra en curso
      if (name === 'NotAllowedError') {
        if (!v.muted) {
          // Sin permiso para audio: reproducir en silencio es mejor que no mostrar nada
          v.muted = true;
          v.play().then(() => setProblem(null)).catch(() => setProblem('tap'));
        } else {
          setProblem('tap');
        }
        return;
      }
      console.warn('[intro] play() falló:', err);
      if (loadNext()) tryPlay();
      else setProblem('failed');
    });
  }, [loadNext]);

  // Precarga: elegir formato y empezar a descargarlo mientras se ve la tarjeta de título
  useEffect(() => {
    const v = videoRef.current;
    if (indexRef.current < 0 && !loadNext()) setProblem('failed');
    return () => {
      if (v) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    };
  }, [loadNext]);

  const start = useCallback(() => {
    if (stage !== 'title') return;
    setStage('video');
    setTimeout(() => setCanSkip(true), 1500);
    if (indexRef.current >= CANDIDATES.length) {
      setProblem('failed');
      return;
    }
    // Dentro del gesto del usuario: requisito de iOS Safari y Android
    tryPlay();
  }, [stage, tryPlay]);

  /** Botón "Reproducir": gesto nuevo del usuario, así que se intenta de nuevo con audio */
  const retry = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setProblem(null);
    tryPlay();
  }, [tryPlay]);

  /** "Reintentar" tras un fallo total: vuelve a probar todos los formatos desde el primero */
  const retryAll = useCallback(() => {
    const v = videoRef.current;
    indexRef.current = -1;
    setProblem(null);
    if (v && loadNext()) {
      v.muted = false;
      tryPlay();
    } else {
      setProblem('failed');
    }
  }, [loadNext, tryPlay]);

  // Teclado: en el título Enter/Espacio inicia; en el video Esc/Enter/Espacio salta
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (stage === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        start();
      } else if (stage === 'video' && canSkip && (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, canSkip, start, finish]);

  const onVideoError = () => {
    const v = videoRef.current;
    console.warn(
      `[intro] error de video (código ${v?.error?.code ?? '?'}) con ${CANDIDATES[indexRef.current]?.url ?? '?'}`
    );
    if (loadNext()) {
      if (stage === 'video') tryPlay();
    } else {
      setProblem('failed');
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black">
      {/* El <video> está siempre montado para precargar y poder llamar a play() dentro del toque */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={introPoster}
        playsInline
        preload="auto"
        onPlaying={() => setPlaying(true)}
        onEnded={finish}
        onError={onVideoError}
      />

      {stage === 'title' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center cursor-pointer bg-gradient-to-b from-black via-[#2a0b1d] to-black"
          onClick={start}
        >
          <div className="text-7xl sm:text-8xl">🤵💨👰‍♀️</div>
          <h1 className="font-display text-5xl sm:text-7xl leading-[0.95] text-amber-300 tracking-wide drop-shadow-[0_5px_0_#2a1420] [-webkit-text-stroke:3px_#2a1420] [paint-order:stroke_fill]">
            NOVIO
            <br />
            <span className="text-rose-400">EN FUGA</span>
          </h1>
          <p className="text-rose-100/80 italic">Una historia de amor... y de huida.</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              start();
            }}
            className="btn-primary mt-4 animate-pulse"
          >
            ▶ Toca para empezar
          </button>
        </div>
      )}

      {stage === 'video' && problem === 'tap' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/55 px-4 text-center">
          <p className="text-rose-50 text-sm sm:text-base">Tu navegador necesita un toque para reproducir el video.</p>
          <button onClick={retry} className="btn-primary">▶ Reproducir</button>
        </div>
      )}

      {stage === 'video' && problem === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 px-4 text-center">
          <p className="text-rose-50 text-sm sm:text-base">No se pudo reproducir el video en este dispositivo.</p>
          <div className="flex gap-3">
            <button onClick={retryAll} className="btn-secondary">Reintentar</button>
            <button onClick={finish} className="btn-primary">Continuar ▶</button>
          </div>
        </div>
      )}

      {stage === 'video' && !problem &&
        (canSkip ? (
          <button
            onClick={finish}
            className="absolute bottom-6 right-6 px-5 py-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white font-bold border border-white/30 transition"
          >
            Saltar ▶
          </button>
        ) : (
          !playing && <div className="absolute bottom-6 right-6 text-white/50 text-sm">Cargando...</div>
        ))}
    </div>
  );
};
