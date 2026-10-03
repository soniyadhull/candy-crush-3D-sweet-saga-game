import React, { useState, useRef, useEffect } from 'react';
import { LevelConfig, PlayerProgress } from '../types';
import { WORLDS, TOTAL_LEVELS, generateLevelConfig } from '../services/levelData';
import { Star, Lock, Play, X, Compass, ChevronRight, Award, Trophy } from 'lucide-react';
import { audio } from '../services/audioService';

interface LevelMapModalProps {
  progress: PlayerProgress;
  onSelectLevel: (lvl: number) => void;
  onClose: () => void;
}

export const LevelMapModal: React.FC<LevelMapModalProps> = ({
  progress,
  onSelectLevel,
  onClose
}) => {
  const [selectedLvl, setSelectedLvl] = useState<number>(progress.unlockedLevel);
  const [previewLevel, setPreviewLevel] = useState<LevelConfig | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate preview for selected level
  useEffect(() => {
    setPreviewLevel(generateLevelConfig(selectedLvl));
  }, [selectedLvl]);

  // Scroll to current level on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const node = document.getElementById(`level-node-${progress.unlockedLevel}`);
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [progress.unlockedLevel]);

  const handleNodeClick = (lvl: number) => {
    if (lvl > progress.unlockedLevel) {
      audio.playSelect();
      return;
    }
    audio.playSelect();
    setSelectedLvl(lvl);
  };

  const handleStartLevel = () => {
    audio.playSwap();
    onSelectLevel(selectedLvl);
  };

  const jumpToWorld = (startLevel: number) => {
    audio.playSelect();
    const targetLvl = Math.min(startLevel, progress.unlockedLevel);
    setSelectedLvl(targetLvl);
    const node = document.getElementById(`level-node-${startLevel}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[92vh] bg-gradient-to-b from-amber-950 via-rose-950 to-purple-950 rounded-3xl border-4 border-amber-300/80 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3 sm:p-4 bg-black/40 border-b border-amber-300/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-300" />
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-200">Candy World Road</h2>
              <p className="text-xs text-amber-300/80">120 Sweet Levels • Current Level: {progress.unlockedLevel}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full border border-yellow-400/40 text-yellow-300 font-bold text-xs">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>
                Total Stars: {(Object.values(progress.stars) as number[]).reduce((a: number, b: number) => a + b, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* World Quick Nav Tabs */}
        <div className="flex items-center gap-1.5 p-2 bg-black/30 overflow-x-auto no-scrollbar border-b border-white/10">
          {WORLDS.map(w => (
            <button
              key={w.id}
              onClick={() => jumpToWorld(w.start)}
              className="px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap bg-white/10 hover:bg-pink-500/40 text-pink-100 hover:text-white transition-all border border-pink-400/20"
            >
              {w.name} (Lv {w.start}-{w.end})
            </button>
          ))}
        </div>

        {/* Main Map Content (Scrollable Winding Path + Level Details Drawer) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Level Nodes Grid / Path */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 relative overscroll-contain scroll-smooth touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {WORLDS.map(world => (
              <div key={world.id} className="relative">
                {/* World Separator Banner */}
                <div className="sticky top-0 z-20 my-3 py-1.5 px-4 rounded-xl bg-gradient-to-r from-pink-600/90 to-purple-600/90 backdrop-blur-md text-white font-black text-sm flex items-center justify-between shadow-lg border border-pink-300/40">
                  <span>{world.name}</span>
                  <span className="text-xs text-yellow-200">Levels {world.start} - {world.end}</span>
                </div>

                {/* Level Nodes in World */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 py-2">
                  {Array.from({ length: world.end - world.start + 1 }, (_, i) => {
                    const lvl = world.start + i;
                    const isUnlocked = lvl <= progress.unlockedLevel;
                    const isCurrent = lvl === progress.unlockedLevel;
                    const isSelected = lvl === selectedLvl;
                    const stars = progress.stars[lvl] || 0;

                    return (
                      <div
                        id={`level-node-${lvl}`}
                        key={lvl}
                        onClick={() => handleNodeClick(lvl)}
                        className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                          isUnlocked
                            ? 'bg-gradient-to-b from-amber-400 to-rose-500 hover:scale-105 shadow-md border-2 border-yellow-200'
                            : 'bg-neutral-800/80 border border-neutral-700 opacity-60 cursor-not-allowed'
                        } ${isSelected ? 'ring-4 ring-white shadow-xl scale-105' : ''} ${
                          isCurrent ? 'animate-bounce ring-2 ring-yellow-300' : ''
                        }`}
                      >
                        {/* Level Number or Lock */}
                        {isUnlocked ? (
                          <span className="font-black text-lg sm:text-xl text-white drop-shadow">
                            {lvl}
                          </span>
                        ) : (
                          <Lock className="w-5 h-5 text-neutral-400" />
                        )}

                        {/* Star Rating Display */}
                        {isUnlocked && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3].map(s => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= stars
                                    ? 'text-yellow-300 fill-yellow-300'
                                    : 'text-amber-900/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Milestone Gift Chest icon every 10 levels */}
                        {lvl % 10 === 0 && (
                          <span className="absolute -top-2 -right-1 text-sm animate-pulse">
                            🎁
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Level Details Panel */}
          {previewLevel && (
            <div className="w-full md:w-80 bg-black/60 backdrop-blur-md p-4 sm:p-6 border-t md:border-t-0 md:border-l border-amber-300/30 flex flex-col justify-between">
              <div>
                <div className="text-center pb-4 border-b border-white/15">
                  <span className="text-xs uppercase tracking-wider text-pink-300 font-bold">
                    {previewLevel.worldName}
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    Level {previewLevel.levelNumber}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        className={`w-6 h-6 ${
                          s <= (progress.stars[previewLevel.levelNumber] || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Target Objective Box */}
                <div className="my-4 p-3.5 rounded-2xl bg-white/10 border border-white/15">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                    Level Objective
                  </h4>
                  <p className="text-sm font-semibold text-white mt-1">
                    {previewLevel.objective.description}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-pink-200">
                    <div className="p-2 rounded-xl bg-black/40">
                      <span>Moves: </span>
                      <span className="text-white text-sm">{previewLevel.moves}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40">
                      <span>Target: </span>
                      <span className="text-white text-sm">{previewLevel.objective.targetScore.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* High Score */}
                {progress.highScores[previewLevel.levelNumber] && (
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-between text-xs font-bold text-amber-200">
                    <span>Your Best Score:</span>
                    <span className="text-white text-sm">
                      {progress.highScores[previewLevel.levelNumber].toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Play Action Button */}
              <button
                disabled={previewLevel.levelNumber > progress.unlockedLevel}
                onClick={handleStartLevel}
                className="w-full mt-4 py-3.5 px-6 rounded-2xl font-black text-base text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-xl shadow-green-900/40 border-2 border-emerald-300 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-white" />
                PLAY LEVEL {previewLevel.levelNumber}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
