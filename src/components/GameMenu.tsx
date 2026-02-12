import React from 'react';

interface GameMenuProps {
  onStart: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'hsla(30,15%,10%,0.92)' }}>
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-7xl mb-4">🐿️</div>
        <h1 className="font-display text-6xl text-primary mb-2 drop-shadow-lg" style={{ textShadow: '0 0 20px hsl(24 100% 50% / 0.5)' }}>
          TUPAI SURVIVOR
        </h1>
        <p className="text-muted-foreground text-lg mb-8 font-body">
          Survive 3 minutes against the Glitch Bugs!
        </p>

        <button
          onClick={onStart}
          className="px-10 py-4 rounded-lg font-display text-2xl transition-all duration-200 animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, hsl(24,100%,50%), hsl(38,95%,55%))',
            color: 'white',
          }}
        >
          🌰 START GAME
        </button>

        <div className="mt-8 text-sm text-muted-foreground space-y-1">
          <p>🎮 <strong>WASD / Arrows</strong> to move</p>
          <p>⚔️ Attacks are <strong>automatic!</strong></p>
          <p>🥜 Collect <strong>Golden Nuts</strong> to level up</p>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
