import React, { useState, useEffect } from 'react';
import { PlayerProgress, GameScreen, LevelConfig, DailyRewardItem, AnimeEmotion, FriendData } from './types';
import { storage } from './services/storageService';
import { generateLevelConfig, TOTAL_LEVELS } from './services/levelData';
import { audio } from './services/audioService';
import { haptic } from './services/hapticService';
import { CandyBoard } from './components/CandyBoard';
import { BoosterBar } from './components/BoosterBar';
import { AnimeCompanion } from './components/AnimeCompanion';
import { LevelMapModal } from './components/LevelMapModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AddFriendModal } from './components/AddFriendModal';
import { SettingsModal } from './components/SettingsModal';
import { ExitModal } from './components/ExitModal';

import {
  Play,
  Settings,
  UserPlus,
  Trophy,
  Gift,
  LogOut,
  MapPin,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Coins,
  Star,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';

import bgImage from './assets/images/candy_world_bg_1789537224912.jpg';

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>(() => storage.getProgress());
  const [friends, setFriends] = useState<FriendData[]>(() => storage.getFriends());
  const [screen, setScreen] = useState<GameScreen>('home');
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(progress.unlockedLevel);
  const [currentLevelConfig, setCurrentLevelConfig] = useState<LevelConfig>(() =>
    generateLevelConfig(progress.unlockedLevel)
  );

  // Active in-game booster selection
  const [activeBooster, setActiveBooster] = useState<'lollipop' | 'colorBomb' | 'extraMoves' | 'striped' | null>(null);

  // Anime companion state
  const [companionEmotion, setCompanionEmotion] = useState<AnimeEmotion>('happy');

  // Modals state
  const [showLevelMap, setShowLevelMap] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Audio track state
  const [currentTrackIndex, setCurrentTrackIndex] = useState(progress.settings.musicTrackIndex);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Check if daily reward is unclaimed today
  const isRewardUnclaimed = React.useMemo(() => {
    if (!progress.lastClaimDate) return true;
    const last = new Date(progress.lastClaimDate).toDateString();
    const today = new Date().toDateString();
    return last !== today;
  }, [progress.lastClaimDate]);

  // Sync settings with audio service on load and start background music immediately
  useEffect(() => {
    audio.setMusicVolume(progress.settings.bgmVolume);
    audio.setSfxVolume(progress.settings.sfxVolume);
    const initialTrack = progress.settings.musicTrackIndex ?? 0;
    audio.setTrack(initialTrack);
    audio.startMusic();
  }, []);

  // Save progress whenever it updates
  useEffect(() => {
    storage.saveProgress(progress);
  }, [progress]);

  // Start Level handler
  const handleStartGame = (lvl = progress.unlockedLevel) => {
    haptic.lightTap(progress.settings.hapticsEnabled);
    audio.startMusic();
    audio.playSwap();
    setCurrentLevelNumber(lvl);
    setCurrentLevelConfig(generateLevelConfig(lvl));
    setScreen('game');
    setShowLevelMap(false);
    setCompanionEmotion('happy');
  };

  // Next Track toggle
  const handleChangeTrack = () => {
    haptic.lightTap(progress.settings.hapticsEnabled);
    const nextIdx = audio.nextTrack();
    setCurrentTrackIndex(nextIdx);
    setProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, musicTrackIndex: nextIdx }
    }));
  };

  // Toggle Mute
  const handleToggleMute = () => {
    haptic.lightTap(progress.settings.hapticsEnabled);
    if (isAudioMuted) {
      audio.setMusicVolume(progress.settings.bgmVolume || 0.5);
      audio.setSfxVolume(progress.settings.sfxVolume || 0.7);
      setIsAudioMuted(false);
    } else {
      audio.setMusicVolume(0);
      audio.setSfxVolume(0);
      setIsAudioMuted(true);
    }
  };

  // Win Level Handler
  const handleLevelWin = (score: number, stars: number) => {
    const nextLvl = currentLevelNumber + 1;
    const isNewMax = nextLvl > progress.unlockedLevel && nextLvl <= TOTAL_LEVELS;

    setProgress(prev => {
      const prevStars = prev.stars[currentLevelNumber] || 0;
      const prevHighScore = prev.highScores[currentLevelNumber] || 0;

      return {
        ...prev,
        unlockedLevel: isNewMax ? nextLvl : prev.unlockedLevel,
        stars: {
          ...prev.stars,
          [currentLevelNumber]: Math.max(prevStars, stars)
        },
        highScores: {
          ...prev.highScores,
          [currentLevelNumber]: Math.max(prevHighScore, score)
        },
        coins: prev.coins + 150 + stars * 50
      };
    });
  };

  // Fail Level Handler
  const handleLevelFail = () => {
    setCompanionEmotion('worried');
  };

  // Restart Current Level
  const handleRestartLevel = () => {
    audio.playSwap();
    setCurrentLevelConfig(generateLevelConfig(currentLevelNumber));
    setActiveBooster(null);
  };

  // Advance to Next Level
  const handleNextLevel = () => {
    if (currentLevelNumber < TOTAL_LEVELS) {
      handleStartGame(currentLevelNumber + 1);
    } else {
      setShowLevelMap(true);
      setScreen('home');
    }
  };

  // Booster consumption
  const handleBoosterUsed = (booster: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped') => {
    setProgress(prev => ({
      ...prev,
      boosters: {
        ...prev.boosters,
        [booster]: Math.max(0, prev.boosters[booster] - 1)
      }
    }));
    setActiveBooster(null);
  };

  // Extra moves booster used
  const handleUseExtraMoves = () => {
    handleBoosterUsed('extraMoves');
  };

  // Daily Reward Claimed
  const handleClaimDailyReward = (reward: DailyRewardItem) => {
    const todayStr = new Date().toISOString();
    setProgress(prev => {
      const newStreak = prev.dailyRewardStreak + 1;
      const newBoosters = { ...prev.boosters };
      if (reward.boosterType !== 'coins') {
        newBoosters[reward.boosterType] = (newBoosters[reward.boosterType] || 0) + reward.boosterAmount;
      }
      return {
        ...prev,
        coins: prev.coins + reward.coins,
        dailyRewardStreak: newStreak,
        lastClaimDate: todayStr,
        boosters: newBoosters
      };
    });
  };

  // Add Friend Handler
  const handleAddFriend = (name: string) => {
    const newF = storage.addFriend(name);
    setFriends(storage.getFriends());
  };

  // Send Life to Friend
  const handleSendLife = (friendId: string) => {
    storage.sendLife(friendId);
    setFriends(storage.getFriends());
    // Give player sweet reward coins for being friendly!
    setProgress(prev => ({ ...prev, coins: prev.coins + 25 }));
  };

  // Settings update
  const handleUpdateSettings = (newSettings: PlayerProgress['settings']) => {
    setProgress(prev => ({ ...prev, settings: newSettings }));
    setCurrentTrackIndex(newSettings.musicTrackIndex);
  };

  // Reset Progress
  const handleResetProgress = () => {
    const resetData: PlayerProgress = {
      ...progress,
      unlockedLevel: 1,
      stars: {},
      highScores: {},
      coins: 500
    };
    setProgress(resetData);
    storage.saveProgress(resetData);
    setCurrentLevelNumber(1);
    setCurrentLevelConfig(generateLevelConfig(1));
    setScreen('home');
  };

  const totalStars = (Object.values(progress.stars) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-neutral-950 text-white select-none overflow-x-hidden font-sans">
      {/* Background Anime Candy Kingdom Art */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src={bgImage}
          alt="Candy Kingdom Background"
          className="w-full h-full object-cover object-center filter brightness-[0.7] blur-[1px]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Global Top Currency & Audio Bar */}
      <header className="relative z-30 w-full max-w-5xl mx-auto p-2.5 sm:p-4 flex items-center justify-between">
        {/* Logo / Brand or Level info */}
        <div
          onClick={() => {
            audio.playSelect();
            setScreen('home');
          }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-amber-500 p-0.5 shadow-lg shadow-pink-600/30 group-hover:scale-105 transition-transform flex items-center justify-center">
            <span className="text-xl animate-candy-pulse">🍬</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-pink-200">
              Candy Crush 3D
            </h1>
            <span className="text-[10px] text-amber-200/90 font-bold block -mt-1">
              Sweet Saga • 120 Levels
            </span>
          </div>
        </div>

        {/* Currency & Resources Chips */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stars Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-yellow-400/40 text-yellow-300 font-black text-xs shadow-sm">
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
            <span>{totalStars}</span>
          </div>

          {/* Coins Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-amber-400/40 text-amber-300 font-black text-xs shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span>{progress.coins.toLocaleString()}</span>
          </div>

          {/* Lives Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-rose-400/40 text-pink-300 font-black text-xs shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>{progress.lives}/{progress.maxLives}</span>
          </div>

          {/* Audio Mute & Music Change Button */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-transform active:scale-90"
            title="Mute/Unmute Audio"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </header>

      {/* ============================================================ */}
      {/* SCREEN 1: ENTER SCREEN (START, PLAY, SETTINGS, EXIT, ADD FRIEND) */}
      {/* ============================================================ */}
      {screen === 'home' && (
        <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full text-center">
          
          {/* Hero Candy 3D Title Card */}
          <div className="relative mb-6 animate-float">
            <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 text-[11px] sm:text-xs font-black tracking-wider uppercase mb-2 shadow-lg border border-white/40">
              ✨ 3D Match-3 Arcade Adventure ✨
            </div>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] leading-tight tracking-tight">
              CANDY <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-rose-400">CRUSH 3D</span>
            </h2>
            <p className="text-sm sm:text-base font-bold text-pink-100 max-w-md mx-auto drop-shadow-md mt-1">
              Sweet Saga with tactile 3D models, smooth cascading combos, dynamic music, & anime companions!
            </p>
          </div>

          {/* Main Action Buttons Grid */}
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            
            {/* BIG PLAY GAME / START BUTTON */}
            <button
              onClick={() => handleStartGame(progress.unlockedLevel)}
              className="group relative w-full py-4 sm:py-5 px-8 rounded-3xl font-black text-xl sm:text-2xl text-white bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:via-rose-400 hover:to-amber-400 shadow-[0_12px_32px_rgba(244,63,94,0.6)] border-4 border-yellow-300 flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Play className="w-6 h-6 fill-white" />
              </div>
              <span>PLAY GAME (LEVEL {progress.unlockedLevel})</span>
              <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" style={{ animationDuration: '4s' }} />
            </button>

            {/* SECONDARY ROW: 100+ LEVELS MAP & DAILY REWARDS */}
            <div className="w-full grid grid-cols-2 gap-3">
              {/* Level Road Button */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowLevelMap(true);
                }}
                className="py-3 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-2 border-cyan-300/80 shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-cyan-200" />
                <span>120+ Levels</span>
              </button>

              {/* Daily Rewards Button with Notification Dot */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowDailyRewards(true);
                }}
                className="relative py-3 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-2 border-yellow-200 shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Gift className="w-4 h-4 text-yellow-200" />
                <span>Daily Rewards</span>
                {isRewardUnclaimed && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 border-2 border-white animate-ping" />
                )}
              </button>
            </div>

            {/* TERTIARY ROW: LEADERBOARD & ADD FRIEND */}
            <div className="w-full grid grid-cols-2 gap-3">
              {/* Leaderboard Button */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowLeaderboard(true);
                }}
                className="py-3 px-4 rounded-2xl font-black text-sm text-white bg-white/15 hover:bg-white/25 border border-white/25 shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span>Leaderboard</span>
              </button>

              {/* Add Friend Button */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowAddFriend(true);
                }}
                className="py-3 px-4 rounded-2xl font-black text-sm text-white bg-white/15 hover:bg-white/25 border border-white/25 shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-pink-300" />
                <span>Add Friend</span>
              </button>
            </div>

            {/* BOTTOM ROW: SETTINGS & EXIT */}
            <div className="w-full grid grid-cols-2 gap-3 mt-1">
              {/* Settings Button */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowSettings(true);
                }}
                className="py-2.5 px-4 rounded-2xl font-bold text-xs text-neutral-200 bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-amber-300" />
                <span>Settings</span>
              </button>

              {/* Exit Button */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowExitModal(true);
                }}
                className="py-2.5 px-4 rounded-2xl font-bold text-xs text-neutral-200 bg-black/40 hover:bg-black/60 border border-white/20 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Exit Game</span>
              </button>
            </div>

            {/* Dynamic Music Track Switcher Chip */}
            <div
              onClick={handleChangeTrack}
              className="mt-3 py-1.5 px-3 rounded-full bg-black/50 border border-pink-400/40 hover:border-pink-300 text-[11px] font-bold text-pink-200 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Music className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Music: {audio.trackNames[currentTrackIndex]}</span>
              <span className="text-[9px] bg-pink-500/40 px-1.5 py-0.5 rounded text-white">
                Change ↻
              </span>
            </div>
          </div>

          {/* Anime Character Companion on Home Screen */}
          <div className="mt-8">
            <AnimeCompanion
              emotion="happy"
              comboCount={0}
              movesLeft={15}
              score={progress.coins}
              levelNumber={progress.unlockedLevel}
              customMessage="Welcome back, Senpai! Ready to crush sweets and climb the leaderboard? 🍬"
            />
          </div>
        </main>
      )}

      {/* ============================================================ */}
      {/* SCREEN 2: IN-GAME MATCH-3 PLAYING SCREEN                     */}
      {/* ============================================================ */}
      {screen === 'game' && (
        <main className="relative z-20 flex-1 flex flex-col items-center justify-between p-1.5 sm:p-4 max-w-4xl mx-auto w-full game-active-container overscroll-none">
          
          {/* In-Game Header Navigation & Objective Bar */}
          <div className="w-full flex items-center justify-between gap-2 p-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/15">
            <button
              onClick={() => {
                audio.playSelect();
                setScreen('home');
              }}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1"
            >
              ← Menu
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-black text-xs shadow">
                Level {currentLevelConfig.levelNumber}
              </span>
              <span className="text-xs font-bold text-amber-200 hidden sm:inline">
                {currentLevelConfig.worldName}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Music Switcher */}
              <button
                onClick={handleChangeTrack}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-pink-300"
                title="Change Music Track"
              >
                <Music className="w-4 h-4" />
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  audio.playSelect();
                  setShowSettings(true);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Restart */}
              <button
                onClick={handleRestartLevel}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300"
                title="Restart Level"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Game Center Layout: Candy Board + Anime Companion */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 my-auto py-2">
            
            {/* The 3D Match-3 Board */}
            <CandyBoard
              level={currentLevelConfig}
              hapticsEnabled={progress.settings.hapticsEnabled}
              activeBooster={activeBooster}
              onBoosterUsed={handleBoosterUsed}
              onLevelWin={handleLevelWin}
              onLevelFail={handleLevelFail}
              onEmotionChange={setCompanionEmotion}
              onRestartLevel={handleRestartLevel}
              onNextLevel={handleNextLevel}
              onOpenMap={() => setShowLevelMap(true)}
            />

            {/* Side Anime Companion */}
            <div className="hidden md:flex flex-col items-center">
              <AnimeCompanion
                emotion={companionEmotion}
                comboCount={0}
                movesLeft={currentLevelConfig.moves}
                score={0}
                levelNumber={currentLevelConfig.levelNumber}
              />
            </div>
          </div>

          {/* Mobile Bottom Companion Floating Mini */}
          <div className="md:hidden w-full flex justify-center py-1">
            <AnimeCompanion
              emotion={companionEmotion}
              comboCount={0}
              movesLeft={currentLevelConfig.moves}
              score={0}
              levelNumber={currentLevelConfig.levelNumber}
              isCompact
            />
          </div>

          {/* In-Game Boosters Inventory Bar */}
          <div className="w-full max-w-md mt-1">
            <BoosterBar
              progress={progress}
              activeBooster={activeBooster}
              onSelectBooster={b => setActiveBooster(prev => (prev === b ? null : b))}
              onUseExtraMoves={handleUseExtraMoves}
            />
          </div>
        </main>
      )}

      {/* ============================================================ */}
      {/* MODALS & OVERLAYS                                            */}
      {/* ============================================================ */}

      {/* 100+ Levels Map Modal */}
      {showLevelMap && (
        <LevelMapModal
          progress={progress}
          onSelectLevel={handleStartGame}
          onClose={() => setShowLevelMap(false)}
        />
      )}

      {/* Daily Rewards Calendar Modal */}
      {showDailyRewards && (
        <DailyRewardsModal
          progress={progress}
          onClaim={handleClaimDailyReward}
          onClose={() => setShowDailyRewards(false)}
        />
      )}

      {/* Leaderboard Friends Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          friends={friends}
          progress={progress}
          onSendLife={handleSendLife}
          onOpenAddFriend={() => {
            setShowLeaderboard(false);
            setShowAddFriend(true);
          }}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <AddFriendModal
          onAddFriend={handleAddFriend}
          onClose={() => setShowAddFriend(false)}
        />
      )}

      {/* Game Settings Modal */}
      {showSettings && (
        <SettingsModal
          progress={progress}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Exit Game Confirmation Modal */}
      {showExitModal && (
        <ExitModal
          progress={progress}
          onConfirmExit={() => {
            setShowExitModal(false);
            setScreen('home');
          }}
          onClose={() => setShowExitModal(false)}
        />
      )}
    </div>
  );
}
