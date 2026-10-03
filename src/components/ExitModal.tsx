import React from 'react';
import { LogOut, Award, Star, Trophy, X } from 'lucide-react';
import { PlayerProgress } from '../types';
import { audio } from '../services/audioService';

interface ExitModalProps {
  progress: PlayerProgress;
  onConfirmExit: () => void;
  onClose: () => void;
}

export const ExitModal: React.FC<ExitModalProps> = ({
  progress,
  onConfirmExit,
  onClose
}) => {
  const totalStars = (Object.values(progress.stars) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-amber-950 via-rose-950 to-purple-950 rounded-3xl border-4 border-amber-300 shadow-2xl p-5 text-center overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg mx-auto flex items-center justify-center mb-3">
          <LogOut className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-2xl font-black text-amber-200">Quit to Main Menu?</h3>
        <p className="text-xs text-amber-300/80 mt-1">Your sweet candy progress is auto-saved locally!</p>

        {/* Stats card */}
        <div className="my-4 p-3 bg-white/10 rounded-2xl border border-white/15 grid grid-cols-2 gap-2 text-xs font-bold text-white">
          <div className="p-2 rounded-xl bg-black/30">
            <span className="text-pink-300">Level Reached:</span>
            <div className="text-lg font-black">{progress.unlockedLevel}</div>
          </div>
          <div className="p-2 rounded-xl bg-black/30">
            <span className="text-yellow-300">Total Stars:</span>
            <div className="text-lg font-black flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {totalStars}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            Keep Playing
          </button>
          <button
            onClick={() => {
              audio.playSelect();
              onConfirmExit();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-black shadow-lg transition-all"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};
