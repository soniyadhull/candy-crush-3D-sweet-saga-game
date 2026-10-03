import React, { useState } from 'react';
import { PlayerProgress, DailyRewardItem } from '../types';
import { DAILY_REWARDS } from '../services/storageService';
import { Gift, Sparkles, Check, X, Coins, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../services/audioService';
import { haptic } from '../services/hapticService';

interface DailyRewardsModalProps {
  progress: PlayerProgress;
  onClaim: (reward: DailyRewardItem) => void;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  progress,
  onClaim,
  onClose
}) => {
  const [claimedToday, setClaimedToday] = useState<boolean>(() => {
    if (!progress.lastClaimDate) return false;
    const lastDate = new Date(progress.lastClaimDate).toDateString();
    const today = new Date().toDateString();
    return lastDate === today;
  });

  const currentDayIndex = progress.dailyRewardStreak % 7;

  const handleClaimReward = (reward: DailyRewardItem) => {
    if (claimedToday) return;
    audio.playWinFanfare();
    haptic.levelWin(progress.settings.hapticsEnabled);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setClaimedToday(true);
    onClaim(reward);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-900 via-rose-950 to-purple-950 rounded-3xl border-4 border-amber-300 shadow-2xl p-4 sm:p-6 flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg mb-2">
            <Gift className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-200">Daily Sweet Rewards</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-orange-500/30 border border-orange-400/40 text-orange-300 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Streak: {progress.dailyRewardStreak} Days</span>
          </div>
        </div>

        {/* 7-Day Rewards Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 my-2">
          {DAILY_REWARDS.map((reward, idx) => {
            const isToday = idx === currentDayIndex && !claimedToday;
            const isPastClaimed = idx < currentDayIndex || (idx === currentDayIndex && claimedToday);
            const isDay7 = reward.day === 7;

            return (
              <div
                key={reward.day}
                className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between border-2 transition-all ${
                  isDay7 ? 'col-span-3 sm:col-span-1 bg-gradient-to-br from-amber-500 to-yellow-600 text-black border-yellow-200' : ''
                } ${
                  isToday
                    ? 'bg-gradient-to-b from-rose-500 to-pink-600 border-white ring-4 ring-yellow-400 shadow-lg scale-105 z-10'
                    : isPastClaimed
                    ? 'bg-black/30 border-green-500/50 opacity-75'
                    : 'bg-white/10 border-white/20 text-white'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${isToday ? 'text-yellow-200' : 'text-neutral-300'}`}>
                  Day {reward.day}
                </span>

                <div className="my-1.5 flex flex-col items-center">
                  <span className="text-2xl">
                    {reward.boosterType === 'coins' ? '💰' : reward.boosterType === 'lollipop' ? '🍭' : reward.boosterType === 'colorBomb' ? '🌈' : '⚡'}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 text-xs font-black text-amber-300">
                    <Coins className="w-3 h-3 text-amber-300" />
                    <span>+{reward.coins}</span>
                  </div>
                </div>

                <span className="text-[10px] text-center font-bold line-clamp-1">
                  {reward.boosterName}
                </span>

                {isPastClaimed && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <div className="mt-4 pt-2">
          {claimedToday ? (
            <div className="w-full py-3.5 px-4 rounded-2xl bg-white/10 border border-white/20 text-center text-sm font-bold text-neutral-300">
              🎉 Today's sweet reward claimed! Come back tomorrow for Day {((currentDayIndex + 1) % 7) + 1}!
            </div>
          ) : (
            <button
              onClick={() => handleClaimReward(DAILY_REWARDS[currentDayIndex])}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-base text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 shadow-xl shadow-rose-900/40 border-2 border-yellow-300 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-yellow-200" />
              CLAIM DAY {currentDayIndex + 1} REWARD!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
