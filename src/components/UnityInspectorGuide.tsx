import React, { useState } from 'react';
import { UNITY_INSPECTOR_INSTRUCTIONS } from '../game/csharpCode.ts';
import {
  Layers,
  Box,
  Compass,
  Crosshair,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MousePointerClick,
  FastForward,
  Boxes,
  Cpu,
  Dices,
  ShieldCheck,
  Flame,
  ShieldAlert
} from 'lucide-react';

import {
  UNITY_INSPECTOR_MOVER_INSTRUCTIONS,
  UNITY_INSPECTOR_SPAWNER_INSTRUCTIONS,
  UNITY_INSPECTOR_BRIDE_INSTRUCTIONS,
  UNITY_INSPECTOR_COLLISION_INSTRUCTIONS
} from '../game/csharpCode.ts';

export const UnityInspectorGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'collision' | 'bride' | 'spawner' | 'mover' | 'rb' | 'collider' | 'layers' | 'pivot'>('all');

  return (
    <div className="flex flex-col gap-6">
      {/* Intro Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950/60 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            Guía de Configuración Paso a Paso en el Inspector de Unity
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Sigue estos pasos en tu proyecto Unity para configurar <code className="text-amber-400">ObstacleCollisionHandler</code>, <code className="text-rose-400">BridePursuer</code>, <code className="text-purple-300">ObstacleSpawner</code>, <code className="text-amber-300">EnvironmentMover</code> y <code className="text-blue-300">PlayerRunner</code> con físicas precisas.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-start md:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ver Todo
          </button>
          <button
            onClick={() => setActiveTab('collision')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'collision' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:text-white'
            }`}
          >
            Triggers & Obstáculos (Paso 5)
          </button>
          <button
            onClick={() => setActiveTab('bride')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'bride' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-white'
            }`}
          >
            BridePursuer (Paso 4)
          </button>
          <button
            onClick={() => setActiveTab('spawner')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'spawner' ? 'bg-purple-600 text-white font-bold' : 'text-purple-400 hover:text-white'
            }`}
          >
            ObstacleSpawner
          </button>
          <button
            onClick={() => setActiveTab('mover')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'mover' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:text-white'
            }`}
          >
            EnvironmentMover
          </button>
          <button
            onClick={() => setActiveTab('rb')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'rb' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Rigidbody2D
          </button>

          <button
            onClick={() => setActiveTab('collider')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'collider' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            CapsuleCollider2D
          </button>
          <button
            onClick={() => setActiveTab('layers')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'layers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Layers & Máscaras
          </button>
          <button
            onClick={() => setActiveTab('pivot')}
            className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
              activeTab === 'pivot' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pivote del Sprite
          </button>
        </div>
      </div>


      {/* Unity Inspector Mockup Card: The Player GameObject */}
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl overflow-hidden shadow-2xl text-xs font-sans">
        {/* Unity Inspector Title Bar */}
        <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#3c3c3c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="accent-blue-500 rounded" readOnly />
            <span className="font-bold text-[#e1e1e1]">Player (GameObject)</span>
            <span className="px-1.5 py-0.5 bg-[#3c3c3c] text-[10px] text-slate-300 rounded">Static: [ ]</span>
          </div>
          <div className="flex items-center gap-4 text-[#8a8a8a] text-[11px]">
            <span>Tag: <strong className="text-[#cccccc]">Player</strong></span>
            <span>Layer: <strong className="text-[#38bdf8]">Player</strong></span>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* SECTION 0000: OBSTACLE COLLISION & TRIGGERS (PASO 5) */}
          {(activeTab === 'all' || activeTab === 'collision') && (
            <div className="bg-[#282828] border border-amber-500/50 rounded-lg p-3.5 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/20">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>ObstacleCollisionHandler (Paso 5: Triggers de Obstáculos & Tropiezo)</span>
                </div>
                <span className="text-[10px] bg-amber-950/90 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  IsTrigger = True
                </span>
              </div>

              <div className="mb-3 p-2.5 bg-[#202020] rounded border border-[#333] text-[11px] text-slate-300 leading-relaxed">
                <p>{UNITY_INSPECTOR_COLLISION_INSTRUCTIONS.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                {UNITY_INSPECTOR_COLLISION_INSTRUCTIONS.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#202020] rounded border border-[#333333] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-slate-400 font-semibold">{item.param}:</span>
                      <span className="font-mono font-bold text-amber-300 bg-black/40 px-1.5 py-0.5 rounded text-[10px]">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2.5 bg-amber-950/30 border border-amber-500/30 rounded flex items-start gap-2 text-[11px] text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Regla de Oro en 2D Runners:</strong> Jamás uses colisiones sólidas (sin Trigger) para los obstáculos a esquivar, porque empujan o traban la posición X del Rigidbody2D. Al marcar <code className="bg-black/40 px-1 rounded">IsTrigger = true</code>, el novio atraviesa o impacta limpiamente mientras se ejecuta el abalanzamiento de la novia.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 000: BRIDE PURSUER (PASO 4) */}
          {(activeTab === 'all' || activeTab === 'bride') && (
            <div className="bg-[#282828] border border-rose-500/50 rounded-lg p-3.5 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/20">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>BridePursuer (Paso 4: IA de Persecución & Tensión)</span>
                </div>
                <span className="text-[10px] bg-rose-950/90 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  Elastic Tension AI
                </span>
              </div>

              <div className="mb-3 p-2.5 bg-[#202020] rounded border border-[#333] text-[11px] text-slate-300 leading-relaxed">
                <p>{UNITY_INSPECTOR_BRIDE_INSTRUCTIONS.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                {UNITY_INSPECTOR_BRIDE_INSTRUCTIONS.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#202020] rounded border border-[#333333] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-slate-400 font-semibold">{item.param}:</span>
                      <span className="font-mono font-bold text-rose-300 bg-black/40 px-1.5 py-0.5 rounded text-[10px]">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2.5 bg-rose-950/30 border border-rose-500/30 rounded flex items-start gap-2 text-[11px] text-rose-200">
                <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Mecánica Clave de Tensión:</strong> La novia corre detrás del jugador con distancia elástica (<code className="bg-black/40 px-1 rounded">Mathf.SmoothDamp</code>). Si el jugador tropieza con un obstáculo, el método <code className="text-amber-300">OnPlayerStumbled()</code> acorta la distancia <code className="bg-black/40 px-1 rounded">2.5m</code> de golpe. Si la distancia baja de <code className="bg-black/40 px-1 rounded">4m</code>, la novia entra en ataque frenético; si llega a <code className="bg-black/40 px-1 rounded">1m</code>, se dispara el Game Over.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 00: OBSTACLE SPAWNER */}
          {(activeTab === 'all' || activeTab === 'spawner') && (
            <div className="bg-[#282828] border border-rose-500/40 rounded-lg p-3 shadow-lg shadow-rose-950/20">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <Boxes className="w-4 h-4" />
                  <span>ObstacleSpawner (Generador Procedural)</span>
                </div>
                <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono">
                  Procedural Timed Spawner
                </span>
              </div>

              <div className="mb-3 p-2 bg-[#202020] rounded border border-[#333] text-[11px] text-slate-300">
                <p className="leading-relaxed">
                  {UNITY_INSPECTOR_SPAWNER_INSTRUCTIONS.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                {UNITY_INSPECTOR_SPAWNER_INSTRUCTIONS.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#202020] rounded border border-[#333333] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-slate-400 font-semibold">{item.param}:</span>
                      <span className="font-mono font-bold text-rose-300 bg-black/40 px-1.5 py-0.5 rounded">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2.5 bg-amber-950/30 border border-amber-600/30 rounded flex items-start gap-2 text-[11px] text-amber-200">
                <Dices className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Por qué la Variación Aleatoria es Vital:</strong> Un temporizador rígido crea patrones memorizables y aburridos. Añadir <code className="bg-black/40 px-1 rounded">+/- randomVariation</code> (ej. 2.0s ± 0.5s) crea sorpresa y tensión constante sin comprometer la jugabilidad gracias al candado <code className="bg-black/40 px-1 rounded">minSpawnInterval</code>.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 0: ENVIRONMENT MOVER */}
          {(activeTab === 'all' || activeTab === 'mover') && (
            <div className="bg-[#282828] border border-amber-500/40 rounded-lg p-3 shadow-lg shadow-amber-950/20">

              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <FastForward className="w-4 h-4" />
                  <span>EnvironmentMover (Suelo, Obstáculos y Monedas)</span>
                </div>
                <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  Object Pooling Ready
                </span>
              </div>

              <div className="mb-3 p-2 bg-[#202020] rounded border border-[#333] text-[11px] text-slate-300">
                <p className="leading-relaxed">
                  {UNITY_INSPECTOR_MOVER_INSTRUCTIONS.description}
                </p>
              </div>

              <div className="space-y-2.5">
                {UNITY_INSPECTOR_MOVER_INSTRUCTIONS.prefabs.map((p, idx) => (
                  <div key={idx} className="p-3 bg-[#1d1d1d] rounded-lg border border-[#303030]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-amber-400" />
                        {p.target}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 bg-black/40 text-amber-300 rounded border border-amber-500/20">
                          Move Speed: {p.speed}
                        </span>
                        <span className="px-1.5 py-0.5 bg-black/40 text-rose-300 rounded border border-rose-500/20">
                          Destruction X: {p.destructionX}
                        </span>
                        <span className="px-1.5 py-0.5 bg-black/40 text-emerald-300 rounded border border-emerald-500/20">
                          Use Pooling: {p.pooling}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{p.tip}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded text-emerald-200 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Ventaja Móvil de Object Pooling:</strong> En vez de llamar a <code>Destroy()</code> e <code>Instantiate()</code> (que disparan el Garbage Collector y provocan micro-tirones o caídas de FPS), el objeto se desactiva con <code>SetActive(false)</code> para que el generador lo vuelva a colocar a la derecha.
                  </div>
                </div>

                <div className="p-2.5 bg-blue-950/30 border border-blue-500/30 rounded text-blue-200 flex items-start gap-2">
                  <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Por qué Space.World:</strong> <code>Space.World</code> en <code>transform.Translate</code> asegura que el movimiento sea estrictamente a la izquierda global, incluso si un obstáculo tiene rotación en Z (ej. espina inclinada o moneda girando).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: RIGIDBODY 2D */}
          {(activeTab === 'all' || activeTab === 'rb') && (
            <div className="bg-[#282828] border border-[#3e3e3e] rounded-lg p-3">

              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-indigo-400 text-sm">
                  <Box className="w-4 h-4" />
                  <span>Rigidbody 2D</span>
                </div>
                <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  {UNITY_INSPECTOR_INSTRUCTIONS.rigidbody.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                {UNITY_INSPECTOR_INSTRUCTIONS.rigidbody.items.map((item, idx) => (
                  <div key={idx} className="p-2 bg-[#202020] rounded border border-[#333333] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-slate-400">{item.param}:</span>
                      <span className="font-mono font-bold text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2.5 bg-amber-950/30 border border-amber-600/30 rounded flex items-start gap-2 text-[11px] text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Pro-Tip de Físicas Móviles:</strong> Activa siempre <code className="bg-black/40 px-1 rounded">Collision Detection: Continuous</code> y <code className="bg-black/40 px-1 rounded">Interpolate: Interpolate</code>. Esto erradica el efecto 'tunneling' donde el jugador cae a gran velocidad y atraviesa el suelo debido a saltos de frames en smartphones.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CAPSULE COLLIDER 2D */}
          {(activeTab === 'all' || activeTab === 'collider') && (
            <div className="bg-[#282828] border border-[#3e3e3e] rounded-lg p-3">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
                  <Compass className="w-4 h-4" />
                  <span>Capsule Collider 2D</span>
                </div>
                <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {UNITY_INSPECTOR_INSTRUCTIONS.collider.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                {UNITY_INSPECTOR_INSTRUCTIONS.collider.items.map((item, idx) => (
                  <div key={idx} className="p-2 bg-[#202020] rounded border border-[#333333] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-slate-400">{item.param}:</span>
                      <span className="font-mono font-bold text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.note}</p>
                  </div>
                ))}
              </div>

              {/* Mathematical explanation of the slide shrink */}
              <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-700/60 text-slate-300 text-xs">
                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  ¿Por qué se modifica el Offset.Y además de la Altura al deslizarse?
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  En Unity, el CapsuleCollider2D escala su altura desde su propio centro. Si solo reducimos <code className="text-cyan-300">Size.Y</code> a la mitad, la base inferior del collider subiría en el aire, provocando que el personaje caiga y rebote. Para evitar esto, en la Corrutina del script restamos exactamente <code className="text-amber-300">(alturaOriginal - nuevaAltura) / 2</code> al <code className="text-cyan-300">Offset.Y</code>, manteniendo los pies perfectamente planos contra el suelo.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3: LAYERS & GROUND CHECK */}
          {(activeTab === 'all' || activeTab === 'layers') && (
            <div className="bg-[#282828] border border-[#3e3e3e] rounded-lg p-3">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <Layers className="w-4 h-4" />
                  <span>Layers y LayerMask 'Ground'</span>
                </div>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {UNITY_INSPECTOR_INSTRUCTIONS.layers.title}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                {UNITY_INSPECTOR_INSTRUCTIONS.layers.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-[#202020] rounded border border-[#333333] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white text-xs">{item.param}</span>
                        <p className="text-[11px] text-slate-400">{item.note}</p>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-300 bg-black/40 px-2 py-1 rounded text-right shrink-0">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: SPRITE PIVOT BOTTOM CENTER */}
          {(activeTab === 'all' || activeTab === 'pivot') && (
            <div className="bg-[#282828] border border-[#3e3e3e] rounded-lg p-3">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
                <div className="flex items-center gap-2 font-bold text-pink-400 text-sm">
                  <Crosshair className="w-4 h-4" />
                  <span>Pivote del Sprite en Bottom Center</span>
                </div>
                <span className="text-[10px] bg-pink-950/80 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded">
                  {UNITY_INSPECTOR_INSTRUCTIONS.spritePivot.title}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                {UNITY_INSPECTOR_INSTRUCTIONS.spritePivot.items.map((item, idx) => (
                  <div key={idx} className="p-2 bg-[#202020] rounded border border-[#333333] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-slate-400">{item.param}:</span>
                      <span className="font-mono font-bold text-pink-300 bg-black/40 px-1.5 py-0.5 rounded">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: PLAYER RUNNER SCRIPT IN THE INSPECTOR */}
          <div className="bg-[#282828] border border-[#3e3e3e] rounded-lg p-3">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#383838]">
              <div className="flex items-center gap-2 font-bold text-blue-400 text-sm">
                <MousePointerClick className="w-4 h-4" />
                <span>PlayerRunner (Script)</span>
              </div>
              <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                Inspector Fields
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center p-1.5 bg-[#1a1a1a] rounded px-3 border border-blue-500/30">
                <span className="text-blue-300 font-semibold">Jump Force (Subido para vencer Gravity Scale 3)</span>
                <span className="text-amber-300 font-bold bg-[#282828] px-2 py-0.5 rounded">18 (Rango 15 a 20)</span>
              </div>

              <div className="flex justify-between items-center p-1.5 bg-[#1a1a1a] rounded px-3 border border-purple-500/30">
                <span className="text-purple-300 font-semibold">Fall Multiplier (Game Feel)</span>
                <span className="text-purple-300 font-bold bg-[#282828] px-2 py-0.5 rounded">2.5</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-[#1a1a1a] rounded px-3 border border-[#333]">
                <span className="text-slate-400">Ground Check Radius</span>
                <span className="text-white font-bold bg-[#282828] px-2 py-0.5 rounded">0.2</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-[#1a1a1a] rounded px-3 border border-[#333]">
                <span className="text-slate-400">Ground Layer</span>
                <span className="text-emerald-400 font-bold bg-[#282828] px-2 py-0.5 rounded">Ground</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-[#1a1a1a] rounded px-3 border border-[#333]">
                <span className="text-slate-400">Ground Check Offset</span>
                <span className="text-white font-bold bg-[#282828] px-2 py-0.5 rounded">X: 0  Y: 0.05</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-[#1a1a1a] rounded px-3 border border-amber-500/30">
                <span className="text-amber-300 font-semibold">Slide Duration (Ajuste fino)</span>
                <span className="text-amber-400 font-bold bg-[#282828] px-2 py-0.5 rounded">0.4s (400 ms)</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
