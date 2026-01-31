
import React, { memo } from 'react';
import { Star, GameState } from '../types';
import { DECORATIVE_STARS } from '../constants';

interface StarMapProps {
  onStarClick?: (star: Star) => void;
  targetStarId?: string | null;
  gameState?: GameState;
  isInteractive?: boolean;
  transparent?: boolean;
}

export const StarMap: React.FC<StarMapProps> = memo(({ transparent = false }) => {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${transparent ? '' : 'bg-slate-950'}`}>
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full select-none"
        preserveAspectRatio="xMidYMid slice"
      >
        {DECORATIVE_STARS.map(s => (
          <circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.size * 0.45}
            fill="#ffffff"
            className="twinkle"
            style={{ 
              opacity: s.opacity * 0.8, // Increased opacity (dropped transparency)
              '--duration': `${s.duration * 1.5}s`,
              '--delay': `${s.delay}s`
            } as any}
          />
        ))}
      </svg>
    </div>
  );
});

StarMap.displayName = 'StarMap';
