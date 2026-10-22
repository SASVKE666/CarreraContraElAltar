import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from './audio.ts';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sliders,
  Eye,
  Zap,
  ArrowUp,
  ArrowDown,
  Flame,
  ShieldAlert,
  Film,
  Sparkles
} from 'lucide-react';
import {
  RUNNER_SPRITE_URL,
  BRIDE_SPRITE_URL,
  RUNNER_FRAMES,
  BRIDE_FRAMES,
  drawSpriteBottomCenter
} from './spriteAtlas.ts';

export interface InspectorParams {
  jumpForce: number;
  groundCheckRadius: number;
  slideDuration: number;
  gravityScale: number;
  fallMultiplier: number;
  showGizmos: boolean;
  gameSpeed: number;
  spawnRate: number;
  randomVariation: number;
  useSprites?: boolean;
}



interface RunnerCanvasProps {
  inspectorParams: InspectorParams;
  onParamsChange: (newParams: InspectorParams) => void;
}

interface Obstacle {
  id: number;
  x: number;
  type: 'low' | 'high'; // low requires jump, high requires slide
  width: number;
  height: number;
  y: number;
  cleared: boolean;
  hit: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const RunnerCanvas: React.FC<RunnerCanvasProps> = ({
  inspectorParams,
  onParamsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio mute state
  const [muted, setMuted] = useState(false);
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
  };

  // Live HUD states
  const [gameState, setGameState] = useState<'idle' | 'running' | 'gameover'>('running');
  const [distanceTraveled, setDistanceTraveled] = useState(0);
  const [pursuitDistance, setPursuitDistance] = useState(160); // Distance between bride and player
  const [isGroundedDisplay, setIsGroundedDisplay] = useState(true);
  const [isSlidingDisplay, setIsSlidingDisplay] = useState(false);
  const [hitStumble, setHitStumble] = useState(false);

  // References to keep game loop running at 60fps without React re-renders
  const paramsRef = useRef(inspectorParams);
  paramsRef.current = inspectorParams;

  // Real Sprite Sheet Image References
  const runnerImgRef = useRef<HTMLImageElement | null>(null);
  const brideImgRef = useRef<HTMLImageElement | null>(null);
  const [spritesLoaded, setSpritesLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const rImg = new Image();
    rImg.src = RUNNER_SPRITE_URL;
    const bImg = new Image();
    bImg.src = BRIDE_SPRITE_URL;

    let loaded = 0;
    const handleLoad = () => {
      loaded++;
      if (loaded >= 2 && active) {
        runnerImgRef.current = rImg;
        brideImgRef.current = bImg;
        setSpritesLoaded(true);
      }
    };

    rImg.onload = handleLoad;
    bImg.onload = handleLoad;

    if (rImg.complete && bImg.complete) {
      runnerImgRef.current = rImg;
      brideImgRef.current = bImg;
      setSpritesLoaded(true);
    }

    return () => {
      active = false;
    };
  }, []);

  // Game internal states
  const simRef = useRef({
    playerX: 250,
    playerY: 0, // 0 = on ground, >0 = in air
    velocityY: 0,
    isSliding: false,
    slideTimer: 0,
    brideDistance: 165, // Max safe is 220, Min catch is 40
    stumbleTimer: 0,
    distanceMeters: 0,
    obstacles: [] as Obstacle[],
    nextObstacleTimer: 1.2,
    particles: [] as Particle[],
    bgScroll: 0,
    runAnimFrame: 0,
    brideAnimFrame: 0,
    lastTime: performance.now(),
    gameOver: false,
    heartbeatTimer: 0,
  });

  const jump = useCallback(() => {
    const sim = simRef.current;
    const params = paramsRef.current;

    // Check if grounded (sim.playerY === 0)
    if (sim.playerY === 0 && !sim.isSliding && !sim.gameOver) {
      // Rigidbody2D.linearVelocity = Vector2.zero; AddForce(Vector2.up * jumpForce, Impulse);
      sim.velocityY = params.jumpForce * 42;
      sim.playerY = 0.5; // Lift off ground
      sound.playJump();

      // Jump dust burst
      for (let i = 0; i < 8; i++) {
        sim.particles.push({
          x: sim.playerX + (Math.random() * 20 - 10),
          y: 350,
          vx: -(Math.random() * 100 + 40),
          vy: -(Math.random() * 80 + 20),
          life: 0.35,
          maxLife: 0.35,
          color: 'rgba(255, 255, 255, 0.7)',
          size: Math.random() * 4 + 2,
        });
      }
    }
  }, []);

  const slide = useCallback(() => {
    const sim = simRef.current;
    const params = paramsRef.current;

    if (!sim.isSliding && sim.playerY === 0 && !sim.gameOver) {
      sim.isSliding = true;
      sim.slideTimer = params.slideDuration;
      sound.playSlide();

      // Slide sparks and dirt
      for (let i = 0; i < 12; i++) {
        sim.particles.push({
          x: sim.playerX + (Math.random() * 10),
          y: 348,
          vx: -(Math.random() * 200 + 80),
          vy: -(Math.random() * 40),
          life: 0.4,
          maxLife: 0.4,
          color: '#fbbf24',
          size: Math.random() * 3 + 2,
        });
      }
    }
  }, []);

  const resetGame = useCallback(() => {
    const sim = simRef.current;
    sim.playerY = 0;
    sim.velocityY = 0;
    sim.isSliding = false;
    sim.slideTimer = 0;
    sim.brideDistance = 160;
    sim.stumbleTimer = 0;
    sim.distanceMeters = 0;
    sim.obstacles = [];
    sim.nextObstacleTimer = 1.0;
    sim.particles = [];
    sim.gameOver = false;
    setGameState('running');
    setHitStumble(false);
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        e.preventDefault();
        jump();
      } else if (['KeyS', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
        slide();
      } else if (e.code === 'KeyR' && simRef.current.gameOver) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, slide, resetGame]);

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (now: number) => {
      const dt = Math.min((now - simRef.current.lastTime) / 1000, 0.05);
      simRef.current.lastTime = now;

      const sim = simRef.current;
      const params = paramsRef.current;
      const groundY = 350; // Ground surface Y coordinate
      const currentSpeed = sim.stumbleTimer > 0 ? params.gameSpeed * 0.4 : params.gameSpeed;

      if (!sim.gameOver) {
        // --- 1. Distance & Score Tracking ---
        sim.distanceMeters += (currentSpeed * dt) / 10;
        sim.bgScroll += currentSpeed * dt;
        sim.runAnimFrame += dt * (currentSpeed / 40);
        sim.brideAnimFrame += dt * 10;

        // --- 2. Physics: Jump & Gravity (Rigidbody2D + fallMultiplier Game Feel) ---
        if (sim.playerY > 0 || sim.velocityY !== 0) {
          const baseGravity = 9.81 * 85 * params.gravityScale;
          // Si el personaje está cayendo (velocityY < 0), multiplicamos la gravedad por fallMultiplier
          const effectiveGravity = sim.velocityY < 0 ? baseGravity * params.fallMultiplier : baseGravity;
          sim.velocityY -= effectiveGravity * dt;
          sim.playerY += sim.velocityY * dt;

          if (sim.playerY <= 0) {
            sim.playerY = 0;
            sim.velocityY = 0;
            sound.playLand();


            // Landing dust
            for (let i = 0; i < 6; i++) {
              sim.particles.push({
                x: sim.playerX + (Math.random() * 20 - 10),
                y: groundY,
                vx: -(Math.random() * 80 + 30),
                vy: -(Math.random() * 40 + 10),
                life: 0.25,
                maxLife: 0.25,
                color: 'rgba(255, 255, 255, 0.6)',
                size: Math.random() * 3 + 2,
              });
            }
          }
        }

        // --- 3. Slide Coroutine Timer (CapsuleCollider2D shrink) ---
        if (sim.isSliding) {
          sim.slideTimer -= dt;
          if (sim.slideTimer <= 0) {
            sim.isSliding = false;
            sim.slideTimer = 0;
          }
        }

        // --- 4. Stumble Recovery & Bride Pursuit AI ---
        if (sim.stumbleTimer > 0) {
          sim.stumbleTimer -= dt;
          // Bride closes in fast when player stumbles!
          sim.brideDistance -= 65 * dt;
        } else {
          // Player gradually regains lead when running cleanly
          if (sim.brideDistance < 200) {
            sim.brideDistance += 12 * dt;
          }
        }

        // Check if Bride caught the player
        if (sim.brideDistance <= 42) {
          sim.gameOver = true;
          setGameState('gameover');
          sound.playHit();
        }

        // Heartbeat warning when bride is close
        if (sim.brideDistance < 90) {
          sim.heartbeatTimer += dt;
          if (sim.heartbeatTimer > 0.45) {
            sound.playHeartbeat();
            sim.heartbeatTimer = 0;
          }
        }

        // --- 5. Obstacle Spawning & Movement ---
        sim.nextObstacleTimer -= dt;
        if (sim.nextObstacleTimer <= 0) {
          const type: 'low' | 'high' = Math.random() > 0.45 ? 'low' : 'high';
          const obsWidth = type === 'low' ? 36 : 48;
          const obsHeight = type === 'low' ? 42 : 55;
          // low obstacle rests on ground; high obstacle hangs at head height (requires slide)
          const obsY = type === 'low' ? groundY - obsHeight : groundY - 110;

          sim.obstacles.push({
            id: Date.now() + Math.random(),
            x: 820,
            type,
            width: obsWidth,
            height: obsHeight,
            y: obsY,
            cleared: false,
            hit: false,
          });

          // Calculate next spawn interval using baseSpawnRate + randomVariation
          const variation = (Math.random() * 2 - 1) * params.randomVariation;
          sim.nextObstacleTimer = Math.max(0.9, params.spawnRate + variation);
        }

        // --- 6. Obstacle Collision Checking ---

        // Player hitbox based on standing vs sliding
        const playerColliderHeight = sim.isSliding ? 32 : 64;
        const playerColliderWidth = 26;
        const playerFeetY = groundY - sim.playerY;
        const playerBox = {
          x: sim.playerX - playerColliderWidth / 2,
          y: playerFeetY - playerColliderHeight,
          width: playerColliderWidth,
          height: playerColliderHeight,
        };

        for (const obs of sim.obstacles) {
          obs.x -= currentSpeed * dt;

          if (!obs.hit && !obs.cleared) {
            const obsBox = {
              x: obs.x,
              y: obs.y,
              width: obs.width,
              height: obs.height,
            };

            // AABB Collision
            const isColliding =
              playerBox.x < obsBox.x + obsBox.width &&
              playerBox.x + playerBox.width > obsBox.x &&
              playerBox.y < obsBox.y + obsBox.height &&
              playerBox.y + playerBox.height > obsBox.y;

            if (isColliding) {
              obs.hit = true;
              sim.stumbleTimer = 0.8;
              sim.brideDistance -= 35; // Bride lunges closer!
              sound.playHit();
              setHitStumble(true);
              setTimeout(() => setHitStumble(false), 500);

              // Stumble impact particles
              for (let i = 0; i < 15; i++) {
                sim.particles.push({
                  x: obs.x + obs.width / 2,
                  y: obs.y + obs.height / 2,
                  vx: (Math.random() * 200 - 100),
                  vy: -(Math.random() * 150 + 50),
                  life: 0.5,
                  maxLife: 0.5,
                  color: '#ef4444',
                  size: Math.random() * 4 + 2,
                });
              }
            } else if (obs.x + obs.width < playerBox.x) {
              obs.cleared = true;
            }
          }
        }

        // Clean up off-screen obstacles
        sim.obstacles = sim.obstacles.filter((obs) => obs.x > -100);

        // --- 7. Particle Simulation ---
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const p = sim.particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            sim.particles.splice(i, 1);
          }
        }
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Sky & Gothic Wedding Cathedral Parallax
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(0.8, '#311042');
      grad.addColorStop(1, '#180e29');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant Parallax: Stained Glass Windows & Archways (0.2x speed)
      ctx.save();
      const farScroll = (sim.bgScroll * 0.2) % 300;
      for (let x = -farScroll - 300; x < canvas.width + 300; x += 180) {
        // Archway silhouette
        ctx.fillStyle = 'rgba(76, 29, 149, 0.25)';
        ctx.beginPath();
        ctx.arc(x + 50, 160, 40, Math.PI, 0, false);
        ctx.lineTo(x + 90, 350);
        ctx.lineTo(x + 10, 350);
        ctx.closePath();
        ctx.fill();

        // Stained glass glow
        ctx.fillStyle = 'rgba(236, 72, 153, 0.18)';
        ctx.beginPath();
        ctx.arc(x + 50, 160, 24, Math.PI, 0, false);
        ctx.fill();
      }
      ctx.restore();

      // Midground Parallax: Church Chandeliers & Gothic Pillars (0.5x speed)
      ctx.save();
      const midScroll = (sim.bgScroll * 0.5) % 260;
      for (let x = -midScroll - 260; x < canvas.width + 260; x += 220) {
        // Pillars
        ctx.fillStyle = 'rgba(30, 27, 75, 0.6)';
        ctx.fillRect(x + 15, 80, 24, 270);

        // Chandelier candles
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + 27, 95, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Ground Surface & Red Wedding Carpet
      ctx.fillStyle = '#450a0a'; // Dark velvet floor
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

      // Red carpet strip
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(0, groundY, canvas.width, 10);

      // Carpet gold borders
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, groundY + 10, canvas.width, 3);

      // Moving floor tiles (1.0x speed)
      const floorScroll = sim.bgScroll % 40;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let x = -floorScroll; x < canvas.width + 40; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 20, canvas.height);
        ctx.stroke();
      }

      // --- RENDER PARTICLES ---
      for (const p of sim.particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      }

      // --- RENDER OBSTACLES ---
      for (const obs of sim.obstacles) {
        ctx.save();
        if (obs.type === 'low') {
          // Low obstacle: Spiked Wedding Cake / Thorny Rose Barricade
          ctx.fillStyle = '#f43f5e';
          // Multi-tiered wedding cake with thorns
          ctx.fillRect(obs.x + 4, obs.y + 18, obs.width - 8, obs.height - 18);
          ctx.fillStyle = '#fb7185';
          ctx.fillRect(obs.x + 8, obs.y + 6, obs.width - 16, 14);
          ctx.fillStyle = '#ffe4e6';
          ctx.fillRect(obs.x + 12, obs.y, obs.width - 24, 8);

          // Danger Spikes on top
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(obs.x + 10, obs.y);
          ctx.lineTo(obs.x + 18, obs.y - 8);
          ctx.lineTo(obs.x + 26, obs.y);
          ctx.fill();
        } else {
          // High obstacle: Heavy Crystal Chandelier / Floral Guillotine Hanging Arch
          // Chain
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.width / 2, 0);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + 10);
          ctx.stroke();

          // Chandelier body
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + 20, obs.width / 2, 0, Math.PI);
          ctx.fill();

          // Crystals
          ctx.fillStyle = '#38bdf8';
          for (let c = 0; c < 5; c++) {
            ctx.fillRect(obs.x + 6 + c * 8, obs.y + 20, 4, 18);
          }

          // Warning indicator: Must Slide!
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('▼ SLIDE', obs.x + 2, obs.y + 50);
        }

        // Draw Obstacle Collider Gizmo if enabled
        if (params.showGizmos) {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // --- RENDER PURSUER: "LA NOVIA" (The Bride) ---
      const brideX = sim.playerX - sim.brideDistance;
      const brideGroundY = groundY;
      const brideBob = Math.sin(sim.brideAnimFrame * 1.5) * 4;

      ctx.save();
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(brideX + 10, brideGroundY + 2, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      const brideImg = brideImgRef.current;
      const useSprites = params.useSprites !== false;

      if (useSprites && brideImg && brideImg.complete) {
        // Evaluate attack / danger state (matches BrideController.cs isAttacking)
        const isAttacking = sim.brideDistance <= 95;
        if (isAttacking) {
          // 7 Attack frames (zancada furiosa y rodillo en mano)
          const attackIdx = Math.floor((sim.brideAnimFrame * 9) % BRIDE_FRAMES.attack.length);
          const frame = BRIDE_FRAMES.attack[attackIdx];
          // Bottom Center anchor at feet
          drawSpriteBottomCenter(ctx, brideImg, frame, brideX + 10, brideGroundY + brideBob, 115, 85);
        } else {
          // 10 Running frames
          const runIdx = Math.floor((sim.brideAnimFrame * 10) % BRIDE_FRAMES.run.length);
          const frame = BRIDE_FRAMES.run[runIdx];
          // Bottom Center anchor at feet
          drawSpriteBottomCenter(ctx, brideImg, frame, brideX + 10, brideGroundY + brideBob, 105, 80);
        }
      } else {
        // Fallback procedural bride (vector shapes)
        const dressY = brideGroundY - 68 + brideBob;

        // Veil blowing backwards
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(brideX - 10, dressY + 12);
        ctx.quadraticCurveTo(brideX - 50, dressY + 20, brideX - 70, dressY + 45);
        ctx.lineTo(brideX - 10, dressY + 30);
        ctx.fill();

        // Huge wedding dress silhouette
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(brideX + 12, dressY + 24);
        ctx.bezierCurveTo(brideX + 45, dressY + 40, brideX + 42, brideGroundY, brideX + 38, brideGroundY);
        ctx.lineTo(brideX - 18, brideGroundY);
        ctx.bezierCurveTo(brideX - 25, dressY + 50, brideX - 5, dressY + 30, brideX + 12, dressY + 24);
        ctx.fill();

        // Corset ribbon
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(brideX + 2, dressY + 32);
        ctx.lineTo(brideX + 22, dressY + 32);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(brideX + 12, dressY + 14, 14, 0, Math.PI * 2);
        ctx.fill();

        // Blonde bridal bun / veil tiara
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(brideX + 8, dressY + 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0'; // Tiara
        ctx.fillRect(brideX + 7, dressY + 2, 12, 4);

        // Fierce determination expression & lipstick
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(brideX + 18, dressY + 17, 6, 3);
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(brideX + 20, dressY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Rolling pin / Wedding bouquet held forward
        ctx.fillStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(brideX + 22, dressY + 28);
        ctx.lineTo(brideX + 44, dressY + 20);
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.fillRect(brideX + 42, dressY + 14, 18, 10);
      }

      // Speech bubble when very close
      if (sim.brideDistance < 90) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(brideX - 20, brideGroundY - 80 + brideBob, 95, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('¡CASATE YA! 💍', brideX - 12, brideGroundY - 64 + brideBob);
      }
      ctx.restore();

      // --- RENDER PLAYER: THE RUNNER ---
      const playerFeetYActual = groundY - sim.playerY;
      const playerX = sim.playerX;

      ctx.save();
      // Player shadow
      const shadowScale = Math.max(0.2, 1 - sim.playerY / 200);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(playerX, groundY + 1, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      const runnerImg = runnerImgRef.current;

      if (useSprites && runnerImg && runnerImg.complete) {
        if (sim.isSliding) {
          // Slide frames (6 frames de deslizamiento)
          const slideProgress = (params.slideDuration - sim.slideTimer) / Math.max(0.01, params.slideDuration);
          const slideIdx = Math.min(
            RUNNER_FRAMES.slide.length - 1,
            Math.max(0, Math.floor(slideProgress * RUNNER_FRAMES.slide.length))
          );
          const frame = RUNNER_FRAMES.slide[slideIdx];
          // Bottom Center pivot: base of sprite stays on ground
          drawSpriteBottomCenter(ctx, runnerImg, frame, playerX, playerFeetYActual, 110, 58);
        } else if (sim.playerY > 0) {
          if (sim.velocityY > 0) {
            // Ascending Jump frames (3 frames de salto)
            const jumpIdx = Math.min(RUNNER_FRAMES.jump.length - 1, Math.floor(sim.playerY / 65));
            const frame = RUNNER_FRAMES.jump[jumpIdx];
            drawSpriteBottomCenter(ctx, runnerImg, frame, playerX, playerFeetYActual, 90, 72);
          } else {
            // Descending Fall frames (3 frames de caída rápida)
            const fallIdx = Math.min(RUNNER_FRAMES.fall.length - 1, Math.floor(Math.abs(sim.velocityY) / 100));
            const frame = RUNNER_FRAMES.fall[fallIdx];
            drawSpriteBottomCenter(ctx, runnerImg, frame, playerX, playerFeetYActual, 90, 65);
          }
        } else {
          // Running on ground (10 frames en loop)
          const runIdx = Math.floor((sim.runAnimFrame * 12) % RUNNER_FRAMES.run.length);
          const frame = RUNNER_FRAMES.run[runIdx];
          drawSpriteBottomCenter(ctx, runnerImg, frame, playerX, playerFeetYActual, 88, 68);
        }
      } else {
        // Fallback procedural runner (vector shapes)
        if (sim.isSliding) {
          const slideY = playerFeetYActual - 24;

          // Slide spark trail
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(playerX - 22, playerFeetYActual - 4, 14, 4);

          // Body leaning forward flat
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.roundRect(playerX - 18, slideY, 36, 18, 6);
          ctx.fill();

          // Head looking ahead low
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.arc(playerX + 20, slideY + 8, 8, 0, Math.PI * 2);
          ctx.fill();

          // Runner cap
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(playerX + 16, slideY + 2, 14, 5);

          // Sneaker dragging
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(playerX - 20, playerFeetYActual - 6, 12, 6);
        } else {
          const bodyY = playerFeetYActual - 56;
          const runCycle = Math.sin(sim.runAnimFrame * 4);

          // Torso / Suit jacket
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(playerX - 9, bodyY + 14, 18, 22);

          // White shirt & tie
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(playerX - 4, bodyY + 15, 8, 12);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(playerX - 2, bodyY + 18, 4, 12);

          // Head
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.arc(playerX, bodyY + 7, 9, 0, Math.PI * 2);
          ctx.fill();

          // Hair
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(playerX - 2, bodyY + 4, 8, Math.PI, 0, false);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(playerX - 6, bodyY + 6, 4, 4);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(playerX - 7, bodyY + 7, 2, 2);

          // Sweat droplet
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(playerX - 9, bodyY + 2, 2, 0, Math.PI * 2);
          ctx.fill();

          // Legs
          ctx.fillStyle = '#0f172a';
          if (sim.playerY > 0) {
            ctx.fillRect(playerX - 8, bodyY + 36, 6, 12);
            ctx.fillRect(playerX + 2, bodyY + 34, 6, 14);
          } else {
            ctx.fillRect(playerX - 7, bodyY + 36, 6, 16 + runCycle * 4);
            ctx.fillRect(playerX + 2, bodyY + 36, 6, 16 - runCycle * 4);
          }

          // Shoes
          ctx.fillStyle = '#000000';
          ctx.fillRect(playerX - 8, playerFeetYActual - 4, 8, 4);
          ctx.fillRect(playerX + 2, playerFeetYActual - 4, 8, 4);
        }
      }
      ctx.restore();

      // --- UNITY GIZMOS OVERLAY (Accurate Scene View visualizer) ---
      if (params.showGizmos) {
        ctx.save();
        // 1. CapsuleCollider2D Visualizer
        const capHeight = sim.isSliding ? 32 : 64;
        const capWidth = 24;
        const capX = playerX - capWidth / 2;
        const capY = playerFeetYActual - capHeight;

        ctx.strokeStyle = '#06b6d4'; // Cyan
        ctx.lineWidth = 2;
        ctx.strokeRect(capX, capY, capWidth, capHeight);

        // Label
        ctx.fillStyle = '#06b6d4';
        ctx.font = '9px monospace';
        ctx.fillText(
          sim.isSliding ? 'Capsule (50% Height)' : 'CapsuleCollider2D',
          capX - 10,
          capY - 6
        );

        // 2. OverlapCircle Ground Check Gizmo (Requested in Prompt)
        // Green if touching ground, Red if in the air!
        const checkPos = { x: playerX, y: playerFeetYActual };
        const checkRadiusPx = params.groundCheckRadius * 70; // 0.2f * 70 = 14px
        const isGroundedNow = sim.playerY === 0;

        ctx.strokeStyle = isGroundedNow ? '#22c55e' : '#ef4444'; // Green or Red
        ctx.fillStyle = isGroundedNow ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(checkPos.x, checkPos.y, checkRadiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gizmo label
        ctx.fillStyle = isGroundedNow ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(
          `OverlapCircle: ${isGroundedNow ? 'GROUNDED' : 'AIR'} (r=${params.groundCheckRadius.toFixed(2)})`,
          checkPos.x + checkRadiusPx + 4,
          checkPos.y + 3
        );

        // 3. Ground Layer reference line
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvas.width, groundY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#eab308';
        ctx.font = '9px monospace';
        ctx.fillText('Layer: "Ground" (Y=350)', 10, groundY - 4);

        // 4. EnvironmentMover destruction boundary line (destructionX = -15)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(35, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('destructionX (-15) ➜ Reciclado (Pool)', 40, 25);
        ctx.restore();
      }


      // Synchronize HUD readouts with React periodically (not every single frame)
      if (Math.random() < 0.2) {
        setDistanceTraveled(Math.floor(sim.distanceMeters));
        setPursuitDistance(Math.max(0, Math.floor(sim.brideDistance)));
        setIsGroundedDisplay(sim.playerY === 0);
        setIsSlidingDisplay(sim.isSliding);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pursuit danger percentage (0% to 100%)
  const dangerPercent = Math.min(100, Math.max(0, Math.round((1 - (pursuitDistance - 40) / 160) * 100)));

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
      {/* Top Simulation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 z-10 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            SIMULADOR UNITY 2D
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono">
            Distancia: <strong className="text-white tabular-nums">{distanceTraveled} m</strong>
          </span>
        </div>

        {/* Pursuer Tension Bar */}
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${dangerPercent > 70 ? 'text-red-500 animate-bounce' : 'text-amber-400'}`} />
          <span className="text-slate-300 text-[11px] font-semibold hidden sm:inline">
            Tensión de la Novia:
          </span>
          <div className="w-28 sm:w-36 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                dangerPercent > 75
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500'
              }`}
              style={{ width: `${dangerPercent}%` }}
            />
          </div>
          <span className="font-mono text-xs text-white tabular-nums w-8">
            {dangerPercent}%
          </span>
        </div>

        {/* Audio Mute & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={muted ? 'Activar Sonido' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
            title="Reiniciar Simulación"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full aspect-[16/9] max-h-[460px] bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full block object-contain select-none"
        />

        {/* Stumble screen flash */}
        {hitStumble && (
          <div className="absolute inset-0 bg-red-600/20 pointer-events-none animate-ping" />
        )}

        {/* State Badges in Viewport */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${
              isGroundedDisplay
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50'
                : 'bg-indigo-950/80 text-indigo-400 border-indigo-500/50'
            }`}
          >
            {isGroundedDisplay ? '● Grounded' : '▲ In Air (Salto)'}
          </span>
          {isSlidingDisplay && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-amber-950/80 text-amber-400 border border-amber-500/50 animate-pulse">
              ▼ Deslizando (Collider 50%)
            </span>
          )}
          {inspectorParams.useSprites !== false && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-950/80 text-purple-300 border border-purple-500/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Sprites 2D Reales
            </span>
          )}
        </div>

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="text-4xl mb-2">👰💍👰</div>
            <h2 className="text-2xl font-black text-rose-500 tracking-tight mb-1">
              ¡TE HA ATRAPADO LA NOVIA!
            </h2>
            <p className="text-slate-300 text-sm max-w-md mb-4">
              La distancia se redujo a cero tras tropezar con los obstáculos. ¡No lograste escapar hacia el altar!
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar Escape (Presiona R o Clic Aquí)
            </button>
          </div>
        )}
      </div>

      {/* Mobile Interactive Touch Action Buttons & Control Bar */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 border-t border-slate-800">
        <button
          onClick={jump}
          disabled={gameState === 'gameover'}
          className="group relative flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-extrabold rounded-xl shadow-lg shadow-blue-900/30 transition-all cursor-pointer select-none"
        >
          <ArrowUp className="w-5 h-5 group-active:-translate-y-1 transition-transform" />
          <div className="text-left">
            <div className="text-sm tracking-wide">SALTAR</div>
            <div className="text-[10px] font-normal text-blue-200">Espacio / W / ↑</div>
          </div>
        </button>

        <button
          onClick={slide}
          disabled={gameState === 'gameover'}
          className="group relative flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-white font-extrabold rounded-xl shadow-lg shadow-orange-900/30 transition-all cursor-pointer select-none"
        >
          <ArrowDown className="w-5 h-5 group-active:translate-y-1 transition-transform" />
          <div className="text-left">
            <div className="text-sm tracking-wide">DESLIZAR</div>
            <div className="text-[10px] font-normal text-amber-200">S / Flecha Abajo / 1.0s</div>
          </div>
        </button>
      </div>

      {/* Inspector Live Parameter Tuner */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sliders className="w-4 h-4 text-indigo-400" />
            CALIBRADOR DE PARÁMETROS [SerializeField] EN VIVO:
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onParamsChange({
                  ...inspectorParams,
                  useSprites: inspectorParams.useSprites === false,
                })
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                inspectorParams.useSprites !== false
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-900/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Alternar entre sprites reales de la hoja de sprites y formas geométricas de depuración"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>Sprites: {inspectorParams.useSprites !== false ? 'Reales 2D [✓]' : 'Debug Vector'}</span>
            </button>

            <button
              onClick={() =>
                onParamsChange({
                  ...inspectorParams,
                  showGizmos: !inspectorParams.showGizmos,
                })
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                inspectorParams.showGizmos
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Gizmos: {inspectorParams.showGizmos ? 'Visibles' : 'Ocultos'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Jump Force */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono">jumpForce</span>
              <span className="font-bold text-blue-400">{inspectorParams.jumpForce.toFixed(1)}f</span>
            </div>
            <input
              type="range"
              min="10"
              max="25"
              step="0.5"
              value={inspectorParams.jumpForce}

              onChange={(e) =>
                onParamsChange({ ...inspectorParams, jumpForce: parseFloat(e.target.value) })
              }
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Impulso AddForce vertical</div>
          </div>

          {/* Ground Check Radius */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono">groundCheckRadius</span>
              <span className="font-bold text-emerald-400">{inspectorParams.groundCheckRadius.toFixed(2)}f</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.45"
              step="0.02"
              value={inspectorParams.groundCheckRadius}
              onChange={(e) =>
                onParamsChange({
                  ...inspectorParams,
                  groundCheckRadius: parseFloat(e.target.value),
                })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Radio del OverlapCircle en pies</div>
          </div>

          {/* Slide Duration */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono">slideDuration</span>
              <span className="font-bold text-amber-400">{inspectorParams.slideDuration.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={inspectorParams.slideDuration}
              onChange={(e) =>
                onParamsChange({ ...inspectorParams, slideDuration: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Tiempo de collider reducido a 50%</div>
          </div>


          {/* Gravity Scale */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono">gravityScale (RB2D)</span>
              <span className="font-bold text-indigo-400">{inspectorParams.gravityScale.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="6.0"
              step="0.2"
              value={inspectorParams.gravityScale}
              onChange={(e) =>
                onParamsChange({ ...inspectorParams, gravityScale: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Elimina salto flotante en móviles</div>
          </div>

          {/* Fall Multiplier (Game Feel) */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-purple-900/40">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono text-purple-300">fallMultiplier</span>
              <span className="font-bold text-purple-400">{inspectorParams.fallMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={inspectorParams.fallMultiplier}
              onChange={(e) =>
                onParamsChange({ ...inspectorParams, fallMultiplier: parseFloat(e.target.value) })
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Caída pesada y rápida al descender</div>
          </div>


          {/* Base Spawn Rate */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/40">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono text-rose-300">baseSpawnRate</span>
              <span className="font-bold text-rose-400">{inspectorParams.spawnRate.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="3.5"
              step="0.1"
              value={inspectorParams.spawnRate}
              onChange={(e) =>
                onParamsChange({ ...inspectorParams, spawnRate: parseFloat(e.target.value) })
              }
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Intervalo base de ObstacleSpawner</div>
          </div>

          {/* Random Variation */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/40">
            <div className="flex justify-between text-slate-300 mb-1">
              <span className="font-mono text-rose-300">randomVariation</span>
              <span className="font-bold text-amber-400">±{inspectorParams.randomVariation.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={inspectorParams.randomVariation}
              onChange={(e) =>
                onParamsChange({ ...inspectorParams, randomVariation: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-[10px] text-slate-500 mt-1">Desfase aleatorio para ritmo impredecible</div>
          </div>
        </div>
      </div>
    </div>
  );
};

