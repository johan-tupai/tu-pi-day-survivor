import React from 'react';
import { Upgrade } from '@/game/types';

interface UpgradeCardsProps {
  choices: Upgrade[];
  onPick: (id: string) => void;
}

const UpgradeCards: React.FC<UpgradeCardsProps> = ({ choices, onPick }) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'hsla(0,0%,0%,0.75)' }}>
      <div className="text-center max-w-lg mx-auto px-4">
        <h2 className="font-display text-4xl text-accent mb-2">⬆️ LEVEL UP!</h2>
        <p className="text-muted-foreground mb-6">Pick an upgrade</p>

        <div className="flex flex-col gap-3">
          {choices.map((upgrade) => (
            <button
              key={upgrade.id}
              onClick={() => onPick(upgrade.id)}
              className="flex items-center gap-4 px-5 py-4 rounded-lg border-2 border-border transition-all duration-200 hover:scale-105 hover:border-primary"
              style={{ background: 'hsla(30,12%,14%,0.95)' }}
            >
              <span className="text-3xl">{upgrade.icon}</span>
              <div className="text-left">
                <div className="font-display text-xl text-primary">{upgrade.name}</div>
                <div className="text-sm text-muted-foreground">{upgrade.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeCards;
