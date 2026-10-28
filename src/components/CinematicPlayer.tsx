import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { sound } from '../game/sound';
import type { Cinematic } from '../game/cinematics';

/** Reproductor a pantalla completa de una cinemática (con controles nativos) */
export const CinematicPlayer: React.FC<{ cinematic: Cinematic; onClose: () => void }> = ({ cinematic, onClose }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const idx = useRef(-1);
  const [failed, setFailed] = useState(false);

  // la música de fondo se calla mientras se ve la cinemática
  useEffect(() => {
    sound.setPaused(true);
    return () => sound.setPaused(false);
  }, []);

  const loadNext = useCallback((): boolean => {
    const v = ref.current;
    if (!v) return false;
    for (let i = idx.current + 1; i < cinematic.sources.length; i++) {
      const s = cinematic.sources[i];
      if (v.canPlayType(s.type) !== '') {
        idx.current = i;
        v.src = s.url;
        v.load();
        v.play().catch(() => {
          /* si el navegador pide un toque, los controles nativos permiten reproducir */
        });
        return true;
      }
    }
    idx.current = cinematic.sources.length;
    return false;
  }, [cinematic]);

  useEffect(() => {
    if (!loadNext()) setFailed(true);
    const v = ref.current;
    return () => {
      if (v) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    };
  }, [loadNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center" role="dialog" aria-label={cinematic.title} data-testid="cinematic-player">
      <video
        ref={ref}
        className="w-full h-full object-contain"
        poster={cinematic.poster}
        controls
        playsInline
        onError={() => {
          if (!loadNext()) setFailed(true);
        }}
        onEnded={onClose}
      />
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center" data-testid="cinematic-failed">
          <p className="text-rose-50 text-sm sm:text-base">No se pudo reproducir este video en este dispositivo.</p>
          <button onClick={onClose} className="btn-primary">
            Cerrar
          </button>
        </div>
      )}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 border-2 border-white/40 text-white hover:bg-black/80"
        aria-label="Cerrar cinemática"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
