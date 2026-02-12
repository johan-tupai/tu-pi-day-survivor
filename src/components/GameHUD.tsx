import React from 'react';

interface GameHUDProps {
  time: number;
  kills: number;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
}

const GameHUD: React.FC<GameHUDProps> = ({ time, kills, level, xp, xpToNext, hp, maxHp }) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const xpPercent = Math.min((xp / xpToNext) * 100, 100);
  const hpPercent = Math.min((hp / maxHp) * 100, 100);

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2" style={{ background: 'hsla(0,0%,0%,0.6)' }}>
        {/* Kill count */}
        <div className="flex items-center gap-2">
          <span className="text-lg">💀</span>
          <span className="font-display text-xl text-foreground">{kills}</span>
        </div>

        {/* Timer */}
        <div className="text-center">
          <span className={`font-display text-3xl ${time < 30 ? 'text-destructive' : 'text-foreground'}`}>
            {timeStr}
          </span>
        </div>

        {/* Level */}
        <div className="flex items-center gap-2">
          <span className="font-display text-xl text-accent">Lv.{level}</span>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mx-4 h-2 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,0%,0.5)' }}>
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${xpPercent}%`, background: 'hsl(45,100%,55%)' }}
        />
      </div>

      {/* HP Bar */}
      <div className="mx-4 mt-1 h-3 rounded-full overflow-hidden" style={{ background: 'hsla(0,0%,0%,0.5)' }}>
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{
            width: `${hpPercent}%`,
            background: hpPercent > 50 ? 'hsl(145,70%,38%)' : hpPercent > 25 ? 'hsl(38,95%,55%)' : 'hsl(0,72%,51%)',
          }}
        />
      </div>
    </div>
  );
};

export default GameHUD;
