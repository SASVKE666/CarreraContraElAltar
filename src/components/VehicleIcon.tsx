import React, { useEffect, useRef } from 'react';
import type { VehicleKind } from '../game/constants';
import { drawVehicleIcon } from '../game/art/vehicles';
import { setRenderScale } from '../game/art/core';

/** Icono animado de un vehículo (se oscurece si `locked`) */
export const VehicleIcon: React.FC<{ kind: VehicleKind; locked?: boolean; skin?: string }> = ({ kind, locked, skin = 'classic' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    setRenderScale(dpr);
    c.width = 120 * dpr;
    c.height = 84 * dpr;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    const draw = (now: number) => {
      ctx.clearRect(0, 0, 120, 84);
      if (locked) ctx.filter = 'brightness(0.35) saturate(0.5)';
      drawVehicleIcon(ctx, kind, 60, 44, 96, now / 1000, skin);
      ctx.filter = 'none';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [kind, locked, skin]);
  return <canvas ref={ref} style={{ width: 120, height: 84 }} aria-hidden />;
};
