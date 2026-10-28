import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { RunnerCanvas, GameStats } from './game/RunnerCanvas';
import { sound } from './game/sound';
import { MainMenu } from './components/MainMenu';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { IntroSequence } from './components/IntroSequence';
import { AchievementsModal } from './components/AchievementsModal';
import { ShopModal } from './components/ShopModal';
import { ACHIEVEMENTS } from './game/achievements';
import { getSave, subscribeSave } from './game/save';

type Phase = 'intro' | 'menu' | 'playing' | 'gameover';

const STORAGE_MUTED = 'novio_en_fuga_muted';

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [gameKey, setGameKey] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const save = useSyncExternalStore(subscribeSave, getSave, getSave);
  const best = save.best;
  const bestAtStart = useRef(best);
  const phaseRef = useRef<Phase>('intro');
  phaseRef.current = phase;
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_MUTED) === '1';
    } catch {
      return false;
    }
  });
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [newRecord, setNewRecord] = useState(false);

  useEffect(() => {
    sound.enabled = !muted;
    try {
      localStorage.setItem(STORAGE_MUTED, muted ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
  }, [muted]);

  const play = useCallback(() => {
    setPaused(false);
    setNewRecord(false);
    bestAtStart.current = getSave().best;
    // desde el menú se sigue en la misma escena (el novio revienta la puerta);
    // al reintentar se crea una partida nueva que arranca directo en la salida
    if (phaseRef.current !== 'menu') setGameKey((k) => k + 1);
    setPhase('playing');
  }, []);

  const goMenu = useCallback(() => {
    setPaused(false);
    setGameKey((k) => k + 1); // escena de inicio nueva (puerta cerrada)
    setPhase('menu');
  }, []);

  const handleGameOver = useCallback((stats: GameStats) => {
    setLastStats(stats);
    // el motor ya guardó la partida; el récord se compara con el de antes de empezar
    setNewRecord(bestAtStart.current > 0 && stats.distance > bestAtStart.current);
    setPhase('gameover');
  }, []);

  // Atajos globales: pausa, y Enter para jugar / reintentar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showHelp) {
        if (e.code === 'Escape') setShowHelp(false);
        return;
      }
      if (showAch || showShop) return; // los modales manejan sus propias teclas
      if (phase === 'playing' && (e.code === 'KeyP' || e.code === 'Escape')) {
        setPaused((p) => !p);
      } else if (phase === 'menu' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        play();
      } else if (phase === 'gameover' && e.code === 'Enter') {
        play();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, showHelp, showAch, showShop, play]);

  // Pausa automática al cambiar de pestaña
  useEffect(() => {
    const onHide = () => {
      if (document.hidden && phase === 'playing') setPaused(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [phase]);

  const showStage = phase !== 'intro';

  return (
    <div className="fixed inset-0 bg-[#1b0a14] flex items-center justify-center overflow-hidden select-none">
      {showStage && (
        <div className={`relative w-full h-full flex items-center justify-center${phase === 'menu' ? ' menu-top' : ''}`}>
          <div
            className="relative max-w-full max-h-full w-full"
            style={{ aspectRatio: '16 / 9', maxWidth: 'calc(100vh * 16 / 9)', containerType: 'inline-size' }}
          >
            <RunnerCanvas
              key={gameKey}
              mode={phase === 'menu' ? 'title' : 'run'}
              isPaused={paused || phase === 'gameover'}
              best={best}
              onGameOver={handleGameOver}
            />

            {phase === 'menu' && (
              <MainMenu
                onPlay={play}
                onHowToPlay={() => setShowHelp(true)}
                onAchievements={() => setShowAch(true)}
                onShop={() => setShowShop(true)}
                wallet={save.wallet}
                best={best}
                achDone={ACHIEVEMENTS.filter((a) => save.unlocked[a.id]).length}
                achTotal={ACHIEVEMENTS.length}
              />
            )}

            {phase === 'playing' && (
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMuted((m) => !m)}
                  className="p-2 rounded-full bg-black/45 hover:bg-black/65 text-white/90 transition"
                  aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setPaused((p) => !p)}
                  className="p-2 rounded-full bg-black/45 hover:bg-black/65 text-white/90 transition"
                  aria-label={paused ? 'Continuar' : 'Pausar'}
                >
                  {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>
              </div>
            )}

            {paused && phase === 'playing' && (
              <div className="absolute inset-0 bg-[#2a0b1d]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
                <h2 className="font-display text-4xl sm:text-5xl text-amber-300 drop-shadow-[0_3px_0_#2a1420]">PAUSA</h2>
                <p className="text-rose-100/90 text-sm sm:text-base text-center">La novia se detuvo a arreglarse el velo...</p>
                <button onClick={() => setPaused(false)} className="btn-primary w-64">Seguir huyendo</button>
                <button onClick={() => setShowHelp(true)} className="btn-secondary w-64">Cómo jugar</button>
                <button onClick={goMenu} className="btn-secondary w-64">Menú principal</button>
              </div>
            )}
          </div>

          {phase === 'gameover' && lastStats && (
            <GameOverModal stats={lastStats} best={best} wallet={save.wallet} newRecord={newRecord} onRetry={play} onMenu={goMenu} onShop={() => setShowShop(true)} />
          )}
        </div>
      )}

      {phase === 'intro' && <IntroSequence onComplete={goMenu} />}

      {showAch && <AchievementsModal save={save} onClose={() => setShowAch(false)} />}
      {showShop && <ShopModal save={save} onClose={() => setShowShop(false)} />}
      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
