import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, createInitialState, UPGRADES } from '@/game/types';
import { updateGame, applyUpgrade } from '@/game/engine';
import { render } from '@/game/renderer';
import GameHUD from './GameHUD';
import GameMenu from './GameMenu';
import GameOver from './GameOver';
import UpgradeCards from './UpgradeCards';
import VirtualJoystick from './VirtualJoystick';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const inputRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState<GameState['gamePhase']>('menu');
  const [hudData, setHudData] = useState({ time: 180, kills: 0, level: 1, xp: 0, xpToNext: 20, hp: 100, maxHp: 100 });
  const [upgradeChoices, setUpgradeChoices] = useState<typeof UPGRADES>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const popSoundRef = useRef<AudioContext | null>(null);

  const playPopSound = useCallback(() => {
    try {
      if (!popSoundRef.current) {
        popSoundRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = popSoundRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available
    }
  }, []);

  const startGame = useCallback(() => {
    const s = createInitialState();
    s.gamePhase = 'playing';
    s.lastTime = performance.now();
    stateRef.current = s;
    setPhase('playing');
  }, []);

  const handleUpgrade = useCallback((upgradeId: string) => {
    applyUpgrade(stateRef.current, upgradeId);
    setPhase('playing');
  }, []);

  // Keyboard input
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const state = stateRef.current;

      if (state.gamePhase === 'playing') {
        const dt = Math.min((now - state.lastTime) / 1000, 0.05);
        state.lastTime = now;

        // Keyboard input
        const keys = keysRef.current;
        const kbInput = { x: 0, y: 0 };
        if (keys.has('a') || keys.has('arrowleft')) kbInput.x -= 1;
        if (keys.has('d') || keys.has('arrowright')) kbInput.x += 1;
        if (keys.has('w') || keys.has('arrowup')) kbInput.y -= 1;
        if (keys.has('s') || keys.has('arrowdown')) kbInput.y += 1;

        // Combine keyboard + joystick
        const combinedInput = {
          x: kbInput.x || inputRef.current.x,
          y: kbInput.y || inputRef.current.y,
        };

        const result = updateGame(state, dt, combinedInput, canvas.width, canvas.height, playPopSound);

        if (result.levelUp) {
          // Pick 3 random upgrades
          const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
          setUpgradeChoices(shuffled.slice(0, 3));
          setPhase('levelup');
        }

        const currentPhase = state.gamePhase as GameState['gamePhase'];
        if (currentPhase === 'gameover' || currentPhase === 'victory') {
          setPhase(currentPhase);
        }

        // Update HUD data periodically
        setHudData({
          time: state.timeRemaining,
          kills: state.killCount,
          level: state.player.level,
          xp: state.player.xp,
          xpToNext: state.player.xpToNext,
          hp: state.player.hp,
          maxHp: state.player.maxHp,
        });
      }

      render(ctx, state, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [playPopSound]);

  const handleJoystick = useCallback((x: number, y: number) => {
    inputRef.current = { x, y };
  }, []);

  const state = stateRef.current;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {phase === 'menu' && <GameMenu onStart={startGame} />}

      {phase === 'playing' && (
        <>
          <GameHUD {...hudData} />
          {isMobile && <VirtualJoystick onMove={handleJoystick} />}
        </>
      )}

      {phase === 'levelup' && (
        <>
          <GameHUD {...hudData} />
          <UpgradeCards choices={upgradeChoices} onPick={handleUpgrade} />
        </>
      )}

      {(phase === 'gameover' || phase === 'victory') && (
        <GameOver
          victory={phase === 'victory'}
          kills={state.killCount}
          timeSurvived={180 - state.timeRemaining}
          level={state.player.level}
          onRestart={startGame}
        />
      )}
    </div>
  );
};

export default GameCanvas;
