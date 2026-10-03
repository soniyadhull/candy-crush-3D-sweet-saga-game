import React from 'react';
import { PlayerProgress } from '../types';
import { audio } from '../services/audioService';
import { haptic } from '../services/hapticService';
import { Settings, Volume2, Music, Vibrate, Sparkles, X, RotateCcw, Play, Check } from 'lucide-react';

interface SettingsModalProps {
  progress: PlayerProgress;
  onUpdateSettings: (newSettings: PlayerProgress['settings']) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  progress,
  onUpdateSettings,
  onResetProgress,
  onClose
}) => {
  const settings = progress.settings;

  const handleBgmChange = (val: number) => {
    audio.setMusicVolume(val);
    onUpdateSettings({ ...settings, bgmVolume: val });
  };

  const handleSfxChange = (val: number) => {
    audio.setSfxVolume(val);
    onUpdateSettings({ ...settings, sfxVolume: val });
  };

  const handleTrackChange = (index: number) => {
    audio.setTrack(index);
    audio.startMusic();
    onUpdateSettings({ ...settings, musicTrackIndex: index });
  };

  const handleHapticToggle = () => {
    const next = !settings.hapticsEnabled;
    onUpdateSettings({ ...settings, hapticsEnabled: next });
    if (next) {
      haptic.specialExplode(true);
    }
  };

  const handleVoiceToggle = () => {
    const next = !settings.companionVoice;
    onUpdateSettings({ ...settings, companionVoice: next });
    audio.playSelect();
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all candy progress back to Level 1?')) {
      audio.playSelect();
      onResetProgress();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-950 via-rose-950 to-purple-950 rounded-3xl border-4 border-amber-300 shadow-2xl p-4 sm:p-6 flex flex-col overflow-hidden">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg mb-1">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-amber-200">Game Settings</h2>
          <p className="text-xs text-amber-300/80">Customize sound, dynamic tracks, and haptics</p>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Music Track Selector */}
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                <Music className="w-4 h-4 text-pink-400" />
                Dynamic Music Track
              </span>
              <span className="text-[10px] text-pink-300">Changes continuously</span>
            </div>
            <div className="space-y-1.5">
              {audio.trackNames.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => handleTrackChange(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    settings.musicTrackIndex === idx
                      ? 'bg-rose-600 text-white shadow ring-2 ring-yellow-300'
                      : 'bg-black/30 hover:bg-black/50 text-neutral-300'
                  }`}
                >
                  <span>{name}</span>
                  {settings.musicTrackIndex === idx && (
                    <Check className="w-4 h-4 text-yellow-300" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Music Volume */}
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
              <span className="flex items-center gap-1.5 text-amber-200">
                <Music className="w-4 h-4 text-pink-400" />
                BGM Volume
              </span>
              <span>{Math.round(settings.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.bgmVolume}
              onChange={e => handleBgmChange(parseFloat(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1.5">
              <span className="flex items-center gap-1.5 text-amber-200">
                <Volume2 className="w-4 h-4 text-yellow-400" />
                Sound FX Volume
              </span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={e => handleSfxChange(parseFloat(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
          </div>

          {/* Haptic Feedback Toggle */}
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Vibrate className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Haptic Vibration</div>
                <div className="text-[10px] text-neutral-300">Tactile buzz on candy swap & matches</div>
              </div>
            </div>
            <button
              onClick={handleHapticToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.hapticsEnabled ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Anime Companion Cheerful Voice Toggle */}
          <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              <div>
                <div className="text-xs font-bold text-white">Anime Companion Reacts</div>
                <div className="text-[10px] text-neutral-300">Chii cheers on combos & warns on moves</div>
              </div>
            </div>
            <button
              onClick={handleVoiceToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.companionVoice ? 'bg-pink-500 justify-end' : 'bg-neutral-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Reset Game Progress */}
          <button
            onClick={handleReset}
            className="w-full py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Progress to Level 1</span>
          </button>
        </div>
      </div>
    </div>
  );
};
