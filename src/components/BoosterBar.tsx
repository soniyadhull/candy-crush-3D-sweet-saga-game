import React from 'react';
import { PlayerProgress } from '../types';
import { Sparkles, Hammer, Disc, PlusCircle, Wand2 } from 'lucide-react';
import { audio } from '../services/audioService';

interface BoosterBarProps {
  progress: PlayerProgress;
  activeBooster: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped' | null;
  onSelectBooster: (b: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped') => void;
  onUseExtraMoves: () => void;
}

export const BoosterBar: React.FC<BoosterBarProps> = ({
  progress,
  activeBooster,
  onSelectBooster,
  onUseExtraMoves
}) => {
  const handleBoosterClick = (b: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped') => {
    audio.playSelect();
    if (b === 'extraMoves') {
      if (progress.boosters.extraMoves > 0) {
        onUseExtraMoves();
      }
    } else {
      if (progress.boosters[b] > 0) {
        onSelectBooster(b);
      }
    }
  };

  const boosters = [
    {
      id: 'lollipop' as const,
      name: 'Lollipop Hammer',
      icon: Hammer,
      count: progress.boosters.lollipop,
      color: 'from-pink-500 to-rose-600',
      tooltip: 'Smash any tile'
    },
    {
      id: 'colorBomb' as const,
      name: 'Color Bomb',
      icon: Disc,
      count: progress.boosters.colorBomb,
      color: 'from-amber-400 to-orange-500',
      tooltip: 'Create rainbow blast'
    },
    {
      id: 'striped' as const,
      name: 'Striped Candy',
      icon: Wand2,
      count: progress.boosters.striped,
      color: 'from-cyan-400 to-blue-600',
      tooltip: 'Make striped line'
    },
    {
      id: 'extraMoves' as const,
      name: '+5 Moves',
      icon: PlusCircle,
      count: progress.boosters.extraMoves,
      color: 'from-emerald-400 to-green-600',
      tooltip: 'Instantly add 5 moves'
    }
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-1.5 px-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 select-none">
      {boosters.map(b => {
        const Icon = b.icon;
        const isActive = activeBooster === b.id;
        const isDisabled = b.count <= 0;

        return (
          <button
            key={b.id}
            disabled={isDisabled}
            onClick={() => handleBoosterClick(b.id)}
            className={`relative flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all duration-200 ${
              isActive
                ? 'scale-110 bg-white text-pink-700 ring-4 ring-pink-400 shadow-lg'
                : 'hover:scale-105 active:scale-95 text-white bg-white/10 hover:bg-white/20'
            } ${isDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
            title={b.tooltip}
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${b.color} text-white shadow-sm`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold mt-1">
              {b.id === 'extraMoves' ? '+5' : b.count}
            </span>

            {/* Badge for available count */}
            <span className="absolute -top-1 -right-1 bg-amber-400 text-black font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white shadow">
              {b.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
