import React from 'react';
import {
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Smartphone,
  Cpu,
  Boxes,
  ShieldAlert,
  FastForward
} from 'lucide-react';

export const ArchitectureRoadmap: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Paso 1: PlayerRunner.cs (Salto, Deslizamiento, Detección de Suelo)',
      status: 'completed',
      tag: '¡Completado!',
      description:
        'Controlador C# con Rigidbody2D.AddForce, OverlapCircle en pivote inferior con Gizmo visual, corrutina de reducción de CapsuleCollider2D a la mitad con compensación de offset vertical y posición X fija.',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    {
      step: 2,
      title: 'Paso 2: EnvironmentMover.cs (Movimiento de Entorno & Desactivación)',
      status: 'completed',
      tag: '¡Implementado en este turno!',
      description:
        'Script de traslación con transform.Translate(Vector3.left * speed * dt, Space.World), caché de transform para alto rendimiento móvil, límite X de destrucción/reciclaje y compatibilidad inmediata con Object Pooling (SetActive(false) vs Destroy).',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    {
      step: 3,
      title: 'Paso 3: ObstacleSpawner.cs (Generador Procedural de Obstáculos)',
      status: 'completed',
      tag: '¡Implementado en este turno!',
      description:
        'Instancia prefabs aleatorios del array fuera de pantalla por la derecha (spawnX) con cadencia base (baseSpawnRate) y variación aleatoria controlada (+/- randomVariation) para lograr un ritmo impredecible y dinámico.',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    {
      step: 4,
      title: 'Paso 4: BridePursuer.cs (IA de Persecución & Tensión de la Novia)',
      status: 'completed',
      tag: '¡Completado en este turno!',
      description:
        'Controlador de la perseguidora con física de distancia elástica (Mathf.SmoothDamp), abalanzamiento instantáneo al tropezar (OnPlayerStumbled), recuperación paulatina de distancia, cálculo de tensión normalizada (0 a 1) para UI/audio y disparo de Game Over.',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    {
      step: 5,
      title: 'Paso 5: ObstacleCollisionHandler & GameManager (Tropiezos, Monedas y Game Over)',
      status: 'completed',
      tag: '¡Completado en este turno!',
      description:
        'Script asignado a los prefabs de obstáculos con Collider2D (IsTrigger = true) que notifica a BridePursuer.Instance.OnPlayerStumbled(), suma puntuación y GameManager centralizado con eventos de Game Over y reinicio limpio.',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    {
      step: 6,
      title: 'Paso 6: Fondo Infinito Parallax & Partículas de Polvo',
      status: 'pending',
      tag: 'Game Feel & Jugabilidad',
      description:
        'Efecto Parallax de 3 planos a diferentes velocidades para profundidad visual a 60 FPS en móviles, y ParticleSystem2D al saltar, correr y deslizarse.',
      icon: Sparkles,
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-base">
            Arquitectura Modular del Auto-Runner 2D (Unity C#)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Diseño arquitectónico profesional por componentes independientes, optimizado para rendimiento en smartphones iOS y Android (Zero Garbage Collection durante el gameplay).
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((item) => {
          const Icon = item.icon;
          const isDone = item.status === 'completed';

          return (
            <div
              key={item.step}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isDone ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-white">{item.title}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isDone
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-center justify-between">
        <div>
          <span className="font-bold text-white block mb-0.5">Esperando tus instrucciones para el siguiente paso:</span>
          <span>¿Deseas que implementemos el <strong>Paso 2: Object Pooling de Terreno y Obstáculos</strong> o prefieres profundizar en el <strong>Paso 3: IA de La Novia</strong>?</span>
        </div>
      </div>
    </div>
  );
};
