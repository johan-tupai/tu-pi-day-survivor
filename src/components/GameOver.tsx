import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GameOverProps {
  victory: boolean;
  kills: number;
  timeSurvived: number;
  level: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ victory, kills, timeSurvived, level, onRestart }) => {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const score = kills * 10 + Math.floor(timeSurvived) * 5;
  const minutes = Math.floor(timeSurvived / 60);
  const seconds = Math.floor(timeSurvived % 60);

  const submitScore = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('tupai_survivor_scores').insert({
        player_name: name.trim(),
        enemies_killed: kills,
        time_survived: Math.floor(timeSurvived),
        level_reached: level,
        score,
      });
      setSubmitted(true);
    } catch {
      // Silently fail
    }
    setSubmitting(false);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'hsla(30,15%,10%,0.92)' }}>
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-5xl mb-3">{victory ? '🏆' : '💀'}</div>
        <h1 className="font-display text-5xl mb-1" style={{ color: victory ? 'hsl(45,100%,55%)' : 'hsl(0,72%,51%)' }}>
          {victory ? 'VICTORY!' : 'GAME OVER'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {victory ? 'You survived the Glitch Bug invasion!' : 'The bugs got you...'}
        </p>

        {/* Stats */}
        <div className="rounded-lg p-4 mb-6 space-y-2" style={{ background: 'hsla(0,0%,0%,0.4)' }}>
          <h2 className="font-display text-xl text-foreground mb-3">📋 MISSION REPORT</h2>
          <div className="flex justify-between text-foreground">
            <span>⏱ Time</span>
            <span className="font-bold">{minutes}:{String(seconds).padStart(2, '0')}</span>
          </div>
          <div className="flex justify-between text-foreground">
            <span>💀 Kills</span>
            <span className="font-bold">{kills}</span>
          </div>
          <div className="flex justify-between text-foreground">
            <span>⭐ Level</span>
            <span className="font-bold">{level}</span>
          </div>
          <div className="flex justify-between text-accent font-bold text-lg pt-2 border-t border-border">
            <span>🏅 Score</span>
            <span>{score}</span>
          </div>
        </div>

        {/* Submit */}
        {!submitted ? (
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg text-center font-bold text-lg bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => e.key === 'Enter' && submitScore()}
            />
            <button
              onClick={submitScore}
              disabled={!name.trim() || submitting}
              className="w-full px-6 py-3 rounded-lg font-display text-xl text-primary-foreground disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, hsl(145,70%,38%), hsl(145,70%,30%))' }}
            >
              {submitting ? '⏳ Saving...' : '📤 SUBMIT SCORE'}
            </button>
          </div>
        ) : (
          <p className="text-secondary font-bold mb-4">✅ Score submitted!</p>
        )}

        <button
          onClick={onRestart}
          className="w-full px-6 py-3 rounded-lg font-display text-xl text-primary-foreground transition-all"
          style={{ background: 'linear-gradient(135deg, hsl(24,100%,50%), hsl(38,95%,55%))' }}
        >
          🔄 PLAY AGAIN
        </button>
      </div>
    </div>
  );
};

export default GameOver;
