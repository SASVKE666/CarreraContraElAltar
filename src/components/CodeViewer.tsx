import React, { useState } from 'react';
import {
  PLAYER_RUNNER_CS_CODE,
  ENVIRONMENT_MOVER_CS_CODE,
  OBSTACLE_SPAWNER_CS_CODE,
  BRIDE_CONTROLLER_CS_CODE,
  OBSTACLE_COLLISION_CS_CODE,
  GAME_MANAGER_CS_CODE
} from '../game/csharpCode.ts';
import {
  Check,
  Copy,
  Download,
  Code2,
  Sparkles,
  FileCode,
  Info,
  FastForward,
  Cpu,
  ShieldCheck,
  Boxes,
  Dices,
  Flame,
  Activity,
  Zap,
  ShieldAlert,
  Gamepad2
} from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<'player' | 'bride' | 'collision' | 'gamemanager' | 'spawner' | 'mover'>('collision');
  const [copied, setCopied] = useState(false);

  let activeCode = PLAYER_RUNNER_CS_CODE;
  let activeFileName = 'PlayerRunner.cs';

  if (selectedScript === 'bride') {
    activeCode = BRIDE_CONTROLLER_CS_CODE;
    activeFileName = 'BridePursuer.cs';
  } else if (selectedScript === 'collision') {
    activeCode = OBSTACLE_COLLISION_CS_CODE;
    activeFileName = 'ObstacleCollisionHandler.cs';
  } else if (selectedScript === 'gamemanager') {
    activeCode = GAME_MANAGER_CS_CODE;
    activeFileName = 'GameManager.cs';
  } else if (selectedScript === 'spawner') {
    activeCode = OBSTACLE_SPAWNER_CS_CODE;
    activeFileName = 'ObstacleSpawner.cs';
  } else if (selectedScript === 'mover') {
    activeCode = ENVIRONMENT_MOVER_CS_CODE;
    activeFileName = 'EnvironmentMover.cs';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = activeCode.trim().split('\n');

  return (
    <div className="flex flex-col gap-4">
      {/* Script Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedScript('player')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedScript === 'player'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4 text-blue-300" />
            <span>PlayerRunner.cs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono text-cyan-300">
              Input + Anim
            </span>
          </button>

          <button
            onClick={() => setSelectedScript('bride')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedScript === 'bride'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-300" />
            <span>BridePursuer.cs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 uppercase font-mono text-rose-200">
              Paso 4
            </span>
          </button>

          <button
            onClick={() => setSelectedScript('collision')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedScript === 'collision'
                ? 'bg-amber-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-300" />
            <span>ObstacleCollisionHandler.cs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 uppercase font-mono text-amber-200">
              Paso 5
            </span>
          </button>

          <button
            onClick={() => setSelectedScript('gamemanager')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedScript === 'gamemanager'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-emerald-300" />
            <span>GameManager.cs</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 uppercase font-mono text-emerald-200">
              Paso 5
            </span>
          </button>

          <button
            onClick={() => setSelectedScript('spawner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedScript === 'spawner'
                ? 'bg-amber-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>ObstacleSpawner.cs</span>
          </button>

          <button
            onClick={() => setSelectedScript('mover')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedScript === 'mover'
                ? 'bg-slate-700 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FastForward className="w-4 h-4" />
            <span>EnvironmentMover.cs</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar {activeFileName}</span>
          </button>
        </div>
      </div>

      {/* Script Explanations Cards */}
      {selectedScript === 'player' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-cyan-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> 1. Animator: isGrounded & yVelocity
            </span>
            <p className="text-slate-400">
              Envía continuamente <code className="text-slate-200 bg-slate-800 px-1 rounded">animator.SetBool("isGrounded", isGrounded)</code> y <code className="text-slate-200 bg-slate-800 px-1 rounded">SetFloat("yVelocity", verticalVelocity)</code> para alternar limpiamente entre <em>Correr</em>, <em>Saltar</em> (subiendo) y <em>Caer</em> (bajando).
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> 2. Animator: isSliding en Corrutina
            </span>
            <p className="text-slate-400">
              Activa <code className="text-slate-200 bg-slate-800 px-1 rounded">isSliding = true</code> al agacharse durante <code className="text-slate-200 bg-slate-800 px-1 rounded">slideDuration = 0.4s</code> y lo apaga al finalizar, sincronizado con la reducción del collider a la mitad.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-purple-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> 3. StringToHash (Optimización Móvil)
            </span>
            <p className="text-slate-400">
              Los parámetros se envían mediante identificadores enteros precalculados (<code className="text-slate-200 bg-slate-800 px-1 rounded">Animator.StringToHash</code>) para erradicar cualquier coste de strings en el garbage collector.
            </p>
          </div>
        </div>
      )}

      {selectedScript === 'bride' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> 1. Animator: isAttacking Trigger/Bool
            </span>
            <p className="text-slate-400">
              Cuando la distancia horizontal X respecto al novio baja de <code className="text-slate-200 bg-slate-800 px-1 rounded">dangerDistanceThreshold (4.0m)</code>, activa <code className="text-slate-200 bg-slate-800 px-1 rounded">isAttacking = true</code>, activando los 7 frames de sprint con la lengua fuera.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 2. Catch Zone & Game Over
            </span>
            <p className="text-slate-400">
              Si la distancia en X llega a <code className="text-slate-200 bg-slate-800 px-1 rounded">catchDistanceThreshold (1.0m)</code>, dispara el evento <code className="text-slate-200 bg-slate-800 px-1 rounded">OnPlayerCaught</code> para activar la pantalla de fin de partida.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-blue-400 flex items-center gap-1">
              <FastForward className="w-3.5 h-3.5" /> 3. LungeForward al Tropezar
            </span>
            <p className="text-slate-400">
              Método público <code className="text-slate-200 bg-slate-800 px-1 rounded">LungeForward(distance)</code> para que cuando el corredor choque contra un obstáculo o pastel, la novia se abalance instantáneamente recortando distancia.
            </p>
          </div>
        </div>
      )}

      {selectedScript === 'spawner' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5" /> 1. Array de Prefabs Aleatorio
            </span>
            <p className="text-slate-400">
              Soporta múltiples tipos de obstáculos (bajos para saltar, altos para deslizarse) instanciando un índice aleatorio con <code className="text-slate-200 bg-slate-800 px-1 rounded">Random.Range(0, prefabs.Length)</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <Dices className="w-3.5 h-3.5" /> 2. Variación Aleatoria de Tiempo
            </span>
            <p className="text-slate-400">
              Añade <code className="text-slate-200 bg-slate-800 px-1 rounded">+/- randomVariation</code> a cada intervalo, creando un ritmo orgánico que evita que el jugador anticipe mecánicamente los obstáculos.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 3. Candado de Separación Mínima
            </span>
            <p className="text-slate-400">
              Aplica <code className="text-slate-200 bg-slate-800 px-1 rounded">Mathf.Max(minSpawnInterval, ...)</code> para garantizar que dos obstáculos nunca nazcan demasiado juntos.
            </p>
          </div>
        </div>
      )}

      {selectedScript === 'mover' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <FastForward className="w-3.5 h-3.5" /> 1. Translate en Espacio Mundo
            </span>
            <p className="text-slate-400">
              Usa <code className="text-slate-200 bg-slate-800 px-1 rounded">transform.Translate(Vector3.left * speed * dt, Space.World)</code> para garantizar trayectoria horizontal perfecta sin importar rotaciones locales.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 2. Object Pooling Ready (Cero GC)
            </span>
            <p className="text-slate-400">
              Al rebasar <code className="text-slate-200 bg-slate-800 px-1 rounded">destructionX = -15f</code>, ejecuta <code className="text-slate-200 bg-slate-800 px-1 rounded">SetActive(false)</code> para reciclarlo sin invocar al Garbage Collector en móviles.
            </p>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="font-semibold text-purple-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> 3. Caché de Transform en Awake
            </span>
            <p className="text-slate-400">
              Guarda <code className="text-slate-200 bg-slate-800 px-1 rounded">cachedTransform</code> en Awake para eliminar el micro-overhead del puente nativo de Unity.
            </p>
          </div>
        </div>
      )}

      {/* Code Editor Box */}
      <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0d1117] text-slate-300 font-mono text-xs shadow-xl">
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-mono text-slate-300 font-semibold">
              Assets/Scripts/{activeFileName}
            </span>
          </div>
          <span>C# · Unity 2D · Optimizado Móvil</span>
        </div>

        <div className="overflow-x-auto max-h-[580px] p-4 text-[12px] leading-relaxed">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                let coloredLine = <span className="text-slate-300">{line}</span>;

                if (line.trim().startsWith('//') || line.trim().startsWith('///') || line.trim().startsWith('*')) {
                  coloredLine = <span className="text-slate-500 italic">{line}</span>;
                } else if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
                  coloredLine = <span className="text-yellow-400">{line}</span>;
                } else if (
                  line.includes('public class') ||
                  line.includes('private void') ||
                  line.includes('public void') ||
                  line.includes('private IEnumerator') ||
                  line.includes('private bool')
                ) {
                  coloredLine = <span className="text-purple-300 font-semibold">{line}</span>;
                } else if (line.includes('using ')) {
                  coloredLine = <span className="text-slate-400">{line}</span>;
                }

                return (
                  <tr key={lineNum} className="hover:bg-slate-800/40">
                    <td className="w-10 pr-4 text-right text-slate-600 select-none font-mono text-[11px]">
                      {lineNum}
                    </td>
                    <td className="whitespace-pre font-mono">{coloredLine}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
