import React, { useState } from 'react';
import { UNITY_ANIMATOR_SETUP_INSTRUCTIONS } from '../game/csharpCode.ts';
import {
  Sparkles,
  Layers,
  ArrowRight,
  Activity,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Maximize2
} from 'lucide-react';

export const SpriteSheetViewer: React.FC = () => {
  const [selectedSheet, setSelectedSheet] = useState<'runner' | 'bride'>('runner');
  const [activeTab, setActiveTab] = useState<'guide' | 'animator' | 'sheets'>('guide');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-slate-900 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              SISTEMA DE ANIMACIÓN 2D & SPRITE SHEETS
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">Pivote: Bottom Center</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Guía de Sprite Editor & Animator Controller
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Instrucciones paso a paso para configurar las hojas de sprites del corredor y la novia monstruosa, asegurando transiciones instantáneas (0ms Has Exit Time) y anclaje al suelo sin saltos de altura al deslizarse.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Guía Paso a Paso
          </button>
          <button
            onClick={() => setActiveTab('animator')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'animator'
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Estructura Animator
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hojas de Sprites
          </button>
        </div>
      </div>

      {/* TAB 1: GUÍA PASO A PASO EN FORMATO DE VIÑETAS */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Sprite Editor Instructions */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Compass className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm text-white">
                1. Configuración en el Sprite Editor (Regla de Oro: Bottom Center)
              </h3>
            </div>

            <div className="space-y-3">
              {UNITY_ANIMATOR_SETUP_INSTRUCTIONS.spriteEditor.map((sec, idx) => (
                <div key={idx} className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
                  <h4 className="font-semibold text-purple-300 mb-2">{sec.title}</h4>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed text-[11px]">
                    {sec.steps.map((s, sIdx) => (
                      <li key={sIdx} className="text-slate-300">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-200 text-[11px] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>¿Por qué el pivote DEBE ser Bottom Center (X: 0.5, Y: 0)?</strong>
                <p className="text-slate-300 mt-1 leading-normal">
                  En la hoja del corredor, el personaje de pie mide unos 90px de alto, pero al deslizarse se tiende en el piso midiendo solo 40px. Si el pivote estuviera en el centro (0.5, 0.5), Unity centraría el sprite en la mitad, haciendo que el personaje parezca flotar 25 píxeles en el aire al agacharse. Al usar <strong>Bottom Center</strong>, la base de los pies y del cuerpo coinciden siempre con el suelo.
                </p>
              </div>
            </div>
          </div>

          {/* Animator Controller PlayerRunner Instructions */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">
                2. Animator Controller: Corredor (PlayerRunner)
              </h3>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <h4 className="font-semibold text-blue-300 mb-2">Parámetros a crear en la pestaña Parameters:</h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  <span className="text-white">isGrounded</span>
                  <span className="text-emerald-400 font-bold">Bool</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  <span className="text-white">yVelocity</span>
                  <span className="text-purple-400 font-bold">Float</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  <span className="text-white">isSliding</span>
                  <span className="text-amber-400 font-bold">Bool</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <h4 className="font-semibold text-blue-300 mb-2">Transiciones Clave entre Estados:</h4>
              <ul className="space-y-2 text-[11px] text-slate-300">
                <li className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                    <span>Correr</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Saltar</span>
                  </div>
                  <div className="text-slate-400">Condición: <code className="text-blue-300">isGrounded == false</code> AND <code className="text-purple-300">yVelocity &gt; 0.1</code></div>
                  <div className="text-slate-500 text-[10px]">Has Exit Time: Desmarcado | Transition Duration: 0.05s</div>
                </li>

                <li className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                    <span>Saltar</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    <span>Caer</span>
                  </div>
                  <div className="text-slate-400">Condición: <code className="text-purple-300">yVelocity &lt; -0.1</code></div>
                  <div className="text-slate-500 text-[10px]">Has Exit Time: Desmarcado | Transition Duration: 0.05s (Transición al ápice del salto)</div>
                </li>

                <li className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                    <span>Caer</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Correr</span>
                  </div>
                  <div className="text-slate-400">Condición: <code className="text-emerald-300">isGrounded == true</code></div>
                  <div className="text-slate-500 text-[10px]">Has Exit Time: Desmarcado | Transition Duration: 0.05s (Aterrizaje firme)</div>
                </li>

                <li className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                    <span>Correr</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deslizarse</span>
                  </div>
                  <div className="text-slate-400">Condición: <code className="text-amber-300">isSliding == true</code></div>
                  <div className="text-slate-500 text-[10px]">Has Exit Time: Desmarcado | Transition Duration: 0.02s (Cero latencia al agacharse)</div>
                </li>

                <li className="p-2 bg-slate-900 rounded border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                    <span>Deslizarse</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Correr</span>
                  </div>
                  <div className="text-slate-400">Condición: <code className="text-amber-300">isSliding == false</code></div>
                  <div className="text-slate-500 text-[10px]">Has Exit Time: Desmarcado | Transition Duration: 0.05s (Recupera postura erguida)</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANIMATOR CONTROLLER DIAGRAM & BRIDE STRUCTURE */}
      {activeTab === 'animator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Player Animator Visual Box */}
          <div className="p-4 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-bold text-white text-sm">Player_AnimatorController</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                Base Layer
              </span>
            </div>

            <div className="relative p-6 bg-[#161616] rounded-xl border border-[#292929] min-h-[380px] flex flex-col justify-between">
              {/* Jump state */}
              <div className="flex justify-center">
                <div className="p-3 bg-blue-950/80 border-2 border-blue-500 text-blue-200 rounded-lg text-center font-bold shadow-lg w-40">
                  <div className="text-xs">SALTAR (Jump)</div>
                  <div className="text-[10px] font-normal text-blue-300">yVelocity &gt; 0</div>
                </div>
              </div>

              {/* Middle Row: Run and Slide */}
              <div className="flex items-center justify-between gap-4 my-6">
                <div className="p-3 bg-amber-950/80 border-2 border-amber-500 text-amber-200 rounded-lg text-center font-bold shadow-lg w-40">
                  <div className="text-xs">DESLIZARSE (Slide)</div>
                  <div className="text-[10px] font-normal text-amber-300">isSliding == true</div>
                </div>

                <div className="p-3.5 bg-emerald-950 border-2 border-emerald-500 text-emerald-200 rounded-lg text-center font-bold shadow-xl w-44 ring-2 ring-emerald-500/30">
                  <div className="text-xs">CORRER (Default)</div>
                  <div className="text-[10px] font-normal text-emerald-300">isGrounded == true</div>
                </div>

                <div className="p-3 bg-purple-950/80 border-2 border-purple-500 text-purple-200 rounded-lg text-center font-bold shadow-lg w-40">
                  <div className="text-xs">CAER (Fall)</div>
                  <div className="text-[10px] font-normal text-purple-300">yVelocity &lt; 0</div>
                </div>
              </div>

              {/* Bottom notes */}
              <div className="p-2.5 bg-black/50 rounded border border-[#333] text-[10px] text-slate-400">
                💡 Todas las transiciones tienen <strong>Has Exit Time: False</strong> y <strong>Transition Duration: 0.05s</strong> para asegurar respuesta instantánea a los controles móviles.
              </div>
            </div>
          </div>

          {/* Bride Animator Visual Box */}
          <div className="p-4 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="font-bold text-white text-sm">Bride_AnimatorController</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                Base Layer
              </span>
            </div>

            <div className="relative p-6 bg-[#161616] rounded-xl border border-[#292929] min-h-[380px] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="p-4 bg-slate-900 border-2 border-slate-600 text-slate-200 rounded-lg text-center font-bold">
                  <div className="text-sm text-white">1. PERSECUCIÓN / CORRER (Default)</div>
                  <p className="text-[11px] font-normal text-slate-400 mt-1">
                    Clip de la fila CORRER (10 frames en loop). Novia corriendo en persecución estándar.
                  </p>
                </div>

                <div className="flex justify-center items-center gap-2 text-rose-400 font-mono text-xs">
                  <span>isAttacking == true (X &lt;= 4.0m)</span>
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>

                <div className="p-4 bg-rose-950/80 border-2 border-rose-500 text-rose-200 rounded-lg text-center font-bold shadow-xl shadow-rose-950/40 animate-pulse">
                  <div className="text-sm text-white flex items-center justify-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    2. ATAQUE FRENÉTICO / DANGER
                  </div>
                  <p className="text-[11px] font-normal text-rose-300 mt-1">
                    Clip de la fila ATAQUE (7 frames de carrera desquiciada con la lengua fuera). Se activa cuando la distancia se acorta peligrosamente.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-black/50 rounded border border-[#333] text-[10px] text-slate-400 mt-4">
                👰 Cuando la distancia llega a <strong>catchDistanceThreshold (1.0m)</strong>, el script <code className="text-rose-300">BrideController.cs</code> invoca el evento <code className="text-rose-300">OnPlayerCaught</code> para lanzar el Game Over.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOJAS DE SPRITES CON FRAME PREVIEWS */}
      {activeTab === 'sheets' && (
        <div className="flex flex-col gap-4">
          {/* Sheet Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800 text-xs w-fit">
            <button
              onClick={() => setSelectedSheet('runner')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedSheet === 'runner'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Corredor (Player)
            </button>
            <button
              onClick={() => setSelectedSheet('bride')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedSheet === 'bride'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Novia Monstruosa (Enemiga)
            </button>
          </div>

          {/* Sprite Sheet Render */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">
                  {selectedSheet === 'runner'
                    ? 'Hoja de Sprites: Corredor 2D (Hoja_de_sprites_de_corredor_2D_76a6e2d4.png)'
                    : 'Hoja de Sprites: Novia Monstruosa (Hoja_de_sprites_de_novia_monstruosa_bad5798d.png)'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedSheet === 'runner'
                    ? 'Estados: Idle (8f), Correr (10f), Saltar (6f), Caer (6f), Deslizarse (6f) en ambas orientaciones.'
                    : 'Estados: Idle (8f), Correr (10f), Saltar (6f), Deslizarse (4f), Ataque/Persecución (7f).'}
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Pivote: Bottom Center
              </span>
            </div>

            {/* Image viewer with transparent checkered background */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 flex items-center justify-center max-h-[520px] overflow-auto">
              <img
                src={
                  selectedSheet === 'runner'
                    ? '/assets/aistudio/Hoja_de_sprites_de_corredor_2D_76a6e2d4.png'
                    : '/assets/aistudio/Hoja_de_sprites_de_novia_monstruosa_bad5798d.png'
                }
                alt="Sprite Sheet"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
