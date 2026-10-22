import React, { useState } from 'react';
import { RunnerCanvas, InspectorParams } from './game/RunnerCanvas.tsx';
import { CodeViewer } from './components/CodeViewer.tsx';
import { UnityInspectorGuide } from './components/UnityInspectorGuide.tsx';
import { ArchitectureRoadmap } from './components/ArchitectureRoadmap.tsx';
import { SpriteSheetViewer } from './components/SpriteSheetViewer.tsx';
import {
  Gamepad2,
  Code2,
  SlidersHorizontal,
  Compass,
  Sparkles,
  ExternalLink,
  Flame,
  Layers,
  ChevronRight,
  Film
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sim' | 'code' | 'sprites' | 'inspector' | 'roadmap'>('sim');

  // Shared Inspector physics parameters calibrated in real-time
  const [inspectorParams, setInspectorParams] = useState<InspectorParams>({
    jumpForce: 18.0,
    groundCheckRadius: 0.2,
    slideDuration: 0.4,
    gravityScale: 3.0,
    fallMultiplier: 2.5,
    showGizmos: true,

    gameSpeed: 320,
    spawnRate: 2.0,
    randomVariation: 0.5,
    useSprites: true,
  });


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  Escape from the Bride
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Unity 2D Auto-Runner
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Paso 1: <strong className="text-slate-200">PlayerRunner</strong> · Paso 2: <strong className="text-amber-400">EnvironmentMover</strong> · Paso 3: <strong className="text-rose-400">ObstacleSpawner</strong>
              </p>
            </div>
          </div>



          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('sim')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'sim'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulador</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código C#</span>
            </button>

            <button
              onClick={() => setActiveTab('sprites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'sprites'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Sprites & Animator</span>
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspector Unity</span>
            </button>

            <button
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'roadmap'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hoja de Ruta</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Banner with Context / Game Design Highlights */}
        <section className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Game Design & Arquitectura 2D
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  Personaje con Posición Fija en Eje X + Tensión de Persecución
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                En este género de runner (tipo <em>Rayman Jungle Run</em> / <em>Jetpack Joyride</em>), el jugador salta y se agacha en su columna fija, mientras el suelo y los obstáculos avanzan a velocidad constante. La perseguidora (La Novia) genera tensión: un error en salto o deslizamiento reduce la distancia de escape.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setActiveTab('code')}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              Ver Script
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Configurar Inspector
            </button>
          </div>
        </section>

        {/* Tab 1: Interactive 2D Runner Simulator */}
        {activeTab === 'sim' && (
          <div className="space-y-6">
            <RunnerCanvas
              inspectorParams={inspectorParams}
              onParamsChange={setInspectorParams}
            />

            {/* Quick reference guide underneath the simulation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Salto: Rigidbody2D.AddForce
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aplica un impulso vertical con <code className="text-slate-200 bg-slate-800 px-1 rounded">ForceMode2D.Impulse</code>. El script pone a cero <code className="text-slate-200 bg-slate-800 px-1 rounded">rb.velocity.y</code> antes de saltar para asegurar que el salto alcance siempre la misma altura milimétrica.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Detección: OverlapCircle
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calcula una esfera en el pivote inferior con radio configurable y máscara <code className="text-emerald-300">Ground</code>. En pantalla puedes ver el Gizmo circular verde cuando toca el suelo y rojo al elevarse.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Deslizamiento: CapsuleCollider2D
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Reduce la altura del collider al 50% durante 1 segundo mediante una corrutina optimizada y ajusta su <code className="text-slate-200 bg-slate-800 px-1 rounded">offset.y</code> para evitar que el personaje flote sobre el piso.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Complete C# Script Code Viewer */}
        {activeTab === 'code' && <CodeViewer />}

        {/* Tab 3: Sprite Sheets & Animator Setup Guide */}
        {activeTab === 'sprites' && <SpriteSheetViewer />}

        {/* Tab 4: Detailed Step-by-Step Inspector Configuration Guide */}
        {activeTab === 'inspector' && <UnityInspectorGuide />}

        {/* Tab 5: Architecture Roadmap (Next Steps for Object Pooling, Pursuer AI, Touch) */}
        {activeTab === 'roadmap' && <ArchitectureRoadmap />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Arquitectura Unity 2D & Game Design para Auto-Runner Móvil · Animator & Sprites integrados con éxito
        </p>
      </footer>
    </div>
  );
}
