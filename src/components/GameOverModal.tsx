import React, { useMemo } from 'react';
import { GameStats } from '../game/engine';
import { ACHIEVEMENT_BY_ID } from '../game/achievements';

interface GameOverModalProps {
  stats: GameStats;
  best: number;
  /** Anillos guardados en la cartera (ya incluyen los de esta partida) */
  wallet: number;
  newRecord: boolean;
  onRetry: () => void;
  onMenu: () => void;
  onShop: () => void;
}

function verdict(m: number): string {
  if (m < 100) return 'Ni siquiera llegaste al brindis. La novia ni sudó.';
  if (m < 300) return '"Solo iba por cigarros", dijiste. Nadie te creyó.';
  if (m < 600) return 'Casi sales del salón... La suegra ya te tenía vigilado.';
  if (m < 1000) return 'Llegaste hasta el jardín, pero las rosas tenían espinas.';
  if (m < 1600) return 'Pisaste la catedral. El cura ya te estaba esperando.';
  return '¡Leyenda! Pero igual hubo boda... y muy bonita.';
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, best, wallet, newRecord, onRetry, onMenu, onShop }) => {
  const text = useMemo(() => verdict(stats.distance), [stats.distance]);
  return (
    <div className="absolute inset-0 z-40 bg-[#2a0b1d]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border-4 border-[#2a1420] bg-gradient-to-b from-[#fff4e0] to-[#f9c5d3] p-5 sm:p-7 text-center shadow-[0_8px_0_#2a1420]">
        <div className="text-5xl mb-1">💒</div>
        <h2 className="font-display text-3xl sm:text-4xl text-rose-600 drop-shadow-[0_2px_0_#fff]">¡SÍ, ACEPTO!</h2>
        <p className="mt-1 text-[#4a1230] text-sm font-semibold">{text}</p>

        {newRecord && (
          <div className="mt-3 inline-block px-3 py-1 rounded-full bg-amber-300 border-2 border-[#2a1420] font-display text-[#2a1420] text-sm animate-bounce">
            ★ ¡NUEVO RÉCORD! ★
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-[#2a1420]">
          <div className="rounded-xl bg-white/70 border-2 border-[#2a1420] py-2">
            <div className="text-[10px] font-bold uppercase text-rose-700">Distancia</div>
            <div className="font-display text-xl">{stats.distance} m</div>
          </div>
          <div className="rounded-xl bg-white/70 border-2 border-[#2a1420] py-2">
            <div className="text-[10px] font-bold uppercase text-rose-700">Anillos</div>
            <div className="font-display text-xl">💍 {stats.coins}</div>
          </div>
          <div className="rounded-xl bg-white/70 border-2 border-[#2a1420] py-2">
            <div className="text-[10px] font-bold uppercase text-rose-700">Mejor</div>
            <div className="font-display text-xl">{best} m</div>
          </div>
        </div>
        <div className="mt-2 text-sm font-semibold text-[#4a1230]" data-testid="gameover-wallet">
          💍 +{stats.coins} guardados · Cartera: <b>{wallet.toLocaleString()}</b>
          <button onClick={onShop} className="ml-2 underline text-rose-700">Ir a la tienda</button>
        </div>
        <div className="mt-3 font-display text-[#2a1420]">
          PUNTOS: <span className="text-rose-600 text-2xl">{stats.score.toLocaleString()}</span>
        </div>

        {stats.unlocked.length > 0 && (
          <div className="mt-3 rounded-2xl bg-amber-200 border-[3px] border-[#2a1420] p-2 text-left" data-testid="gameover-unlocked">
            <div className="font-display text-[#7a1f3d] text-xs text-center">🏆 LOGROS DESBLOQUEADOS</div>
            <ul className="mt-1 space-y-0.5 max-h-24 overflow-y-auto">
              {stats.unlocked.map((id) => {
                const a = ACHIEVEMENT_BY_ID[id];
                return a ? (
                  <li key={id} className="text-xs text-[#2a1420]">
                    <span className="mr-1">{a.icon}</span>
                    <b>{a.name}</b>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          <button onClick={onRetry} className="btn-primary">¡Intentar escapar otra vez!</button>
          <button onClick={onMenu} className="btn-secondary-light">Menú principal</button>
        </div>
        <p className="mt-3 text-xs text-[#4a1230]/70">
          Pulsa <kbd className="px-1 rounded bg-white/70 border border-[#2a1420]/30">Enter</kbd> para reintentar
        </p>
      </div>
    </div>
  );
};
