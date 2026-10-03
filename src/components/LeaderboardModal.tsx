import React, { useState } from 'react';
import { FriendData, PlayerProgress } from '../types';
import { Trophy, Heart, UserPlus, Sparkles, X, Medal, ShieldCheck } from 'lucide-react';
import { audio } from '../services/audioService';

interface LeaderboardModalProps {
  friends: FriendData[];
  progress: PlayerProgress;
  onSendLife: (friendId: string) => void;
  onOpenAddFriend: () => void;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  friends,
  progress,
  onSendLife,
  onOpenAddFriend,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('friends');

  // Calculate user's total score
  const userTotalScore = (Object.values(progress.highScores) as number[]).reduce((a: number, b: number) => a + b, 0);

  // Combine user into friends ranking list
  const userEntry: FriendData = {
    id: 'user_player',
    name: 'You (Player)',
    avatar: '👑',
    level: progress.unlockedLevel,
    score: Math.max(userTotalScore, progress.unlockedLevel * 2400),
    isOnline: true,
    lastActive: 'Now'
  };

  const rankedList = [...friends, userEntry].sort((a, b) => b.score - a.score);
  const userRank = rankedList.findIndex(p => p.id === 'user_player') + 1;

  const handleSendLifeClick = (friendId: string) => {
    audio.playSelect();
    onSendLife(friendId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-950 via-rose-950 to-purple-950 rounded-3xl border-4 border-amber-300 shadow-2xl p-4 sm:p-6 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg mb-1">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-200">Candy Championship</h2>
          <p className="text-xs text-amber-300/80">Compete with friends & climb the sweetest ranks!</p>
        </div>

        {/* Tabs & Add Friend Shortcut */}
        <div className="flex items-center justify-between gap-2 p-1 bg-black/40 rounded-2xl border border-white/15 my-2">
          <div className="flex items-center gap-1 flex-1">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'friends'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'global'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Global Top 100
            </button>
          </div>

          <button
            onClick={onOpenAddFriend}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow hover:brightness-110 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* User Rank Card Highlight */}
        <div className="my-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/30 to-pink-500/30 border border-amber-300/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400 text-black font-black flex items-center justify-center text-sm shadow">
              #{userRank}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm">Your Standing</span>
                <span className="text-[10px] bg-yellow-400/20 text-yellow-300 px-1.5 rounded font-bold">You</span>
              </div>
              <p className="text-xs text-pink-200">Level {progress.unlockedLevel} • {userEntry.score.toLocaleString()} pts</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-black text-yellow-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Top {Math.max(1, Math.round((userRank / rankedList.length) * 100))}%</span>
          </div>
        </div>

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {rankedList.map((player, index) => {
            const isUser = player.id === 'user_player';
            const rank = index + 1;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isUser
                    ? 'bg-rose-500/30 border-yellow-400 shadow-md ring-1 ring-yellow-400'
                    : 'bg-white/10 border-white/10 hover:bg-white/15'
                }`}
              >
                {/* Rank & Avatar */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 flex items-center justify-center font-black text-sm">
                    {rank === 1 ? (
                      <span className="text-xl">🥇</span>
                    ) : rank === 2 ? (
                      <span className="text-xl">🥈</span>
                    ) : rank === 3 ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="text-neutral-400">#{rank}</span>
                    )}
                  </div>

                  <div className="relative text-2xl">
                    {player.avatar}
                    {player.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{player.name}</span>
                      {player.isOnline && (
                        <span className="text-[9px] text-emerald-400 font-semibold">Online</span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-300">
                      Level {player.level} • {player.score.toLocaleString()} pts
                    </p>
                  </div>
                </div>

                {/* Send Heart / Energy action for friends */}
                {!isUser && (
                  <button
                    disabled={player.hasSentLifeToday}
                    onClick={() => handleSendLifeClick(player.id)}
                    className={`flex items-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all ${
                      player.hasSentLifeToday
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-500 text-white active:scale-95 shadow cursor-pointer'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>{player.hasSentLifeToday ? 'Sent' : 'Send Life'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
