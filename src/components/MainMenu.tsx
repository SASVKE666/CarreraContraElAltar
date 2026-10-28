import React from 'react';
import { HelpCircle, Play, ShoppingBag, Trophy } from 'lucide-react';

interface MainMenuProps {
  onPlay: () => void;
  onHowToPlay: () => void;
  onAchievements: () => void;
  onShop: () => void;
  /** Anillos guardados en la cartera */
  wallet: number;
  best: number;
  achDone: number;
  achTotal: number;
}

/**
 * Menú de inicio: va encima de la escena del juego (la puerta de la iglesia), como en Jetpack Joyride.
 * Todo el tamaño se calcula con unidades del contenedor (cqw) para que escale con el escenario 16:9.
 */
export const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onHowToPlay, onAchievements, onShop, wallet, best, achDone, achTotal }) => {
  return (
    <div className="menu-panel">
      <h1 className="menu-logo font-display text-amber-300 [-webkit-text-stroke:0.5cqw_#2a1420] [paint-order:stroke_fill]">
        NOVIO
        <br />
        <span className="text-rose-400">EN FUGA</span>
      </h1>
      {best > 0 && <div className="menu-best font-display">🏆 MEJOR: {best} m</div>}
      <div className="menu-buttons">
        <button onClick={onPlay} className="btn-primary menu-play flex items-center justify-center gap-[1cqw]">
          <Play className="menu-icon fill-current" /> ¡CORRER!
        </button>
        <div className="flex gap-[1.2cqw] w-full">
          <button onClick={onShop} className="btn-secondary menu-small flex-1 flex items-center justify-center gap-[0.8cqw]">
            <ShoppingBag className="menu-icon" /> Tienda <span className="text-amber-200">💍{wallet.toLocaleString()}</span>
          </button>
          <button onClick={onAchievements} className="btn-secondary menu-small flex-1 flex items-center justify-center gap-[0.8cqw]">
            <Trophy className="menu-icon" /> Logros <span className="text-amber-200">{achDone}/{achTotal}</span>
          </button>
        </div>
        <button onClick={onHowToPlay} className="btn-secondary menu-small flex items-center justify-center gap-[0.8cqw]">
          <HelpCircle className="menu-icon" /> Cómo jugar
        </button>
      </div>
      <p className="menu-hint">
        Pulsa <kbd>Enter</kbd> o <kbd>Espacio</kbd> para empezar
      </p>
    </div>
  );
};
