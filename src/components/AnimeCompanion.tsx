import React, { useState, useEffect } from 'react';
import { AnimeEmotion } from '../types';
import { Sparkles, Heart } from 'lucide-react';
import companionImage from '../assets/images/anime_companion_girl_1789537201560.jpg';
import { audio } from '../services/audioService';

interface AnimeCompanionProps {
  emotion: AnimeEmotion;
  comboCount: number;
  movesLeft: number;
  score: number;
  levelNumber: number;
  customMessage?: string;
  isCompact?: boolean;
}

export const AnimeCompanion: React.FC<AnimeCompanionProps> = ({
  emotion,
  comboCount,
  movesLeft,
  customMessage,
  isCompact = false
}) => {
  const [speech, setSpeech] = useState<string>("Let's crush some sweet candies together!");
  const [isTapped, setIsTapped] = useState(false);

  useEffect(() => {
    if (customMessage) {
      setSpeech(customMessage);
      return;
    }

    if (movesLeft <= 3 && movesLeft > 0) {
      setSpeech("Hurry Senpai! Only " + movesLeft + " moves left! You can do it! 💖");
    } else if (comboCount >= 4) {
      setSpeech("✨ SUGOI!! Divine " + comboCount + "x Combo! You're unstoppable! ✨");
    } else if (comboCount >= 2) {
      setSpeech("Tasty combo! Keep crushing! 🍬");
    } else {
      switch (emotion) {
        case 'celebrating':
          setSpeech("🎉 Omedetou! Sweet victory!! 3 Stars cleared! 🌟");
          break;
        case 'worried':
          setSpeech("Don't give up! We can clear this level! 🌸");
          break;
        case 'excited':
          setSpeech("Wah! That special candy looks magical! 🌈");
          break;
        case 'surprised':
          setSpeech("Divine sugar crush!! 💖");
          break;
        default:
          // Random cheerful companion tips
          const tips = [
            "Match 4 in a line for a Striped Candy! ⚡",
            "T-shapes make a Wrapped Blast Candy! 💥",
            "5-in-a-row creates the rainbow Color Bomb! 🌈",
            "Swap a Color Bomb with a Striped Candy for chaos! 🍭",
            "Cheering for you, Senpai! 💖",
          ];
          const randomTip = tips[Math.floor(Math.random() * tips.length)];
          setSpeech(randomTip);
          break;
      }
    }
  }, [emotion, comboCount, movesLeft, customMessage]);

  const handleCompanionTap = () => {
    setIsTapped(true);
    audio.playSelect();
    const greetings = [
      "Konnichiwa! Ready to crush more sweets? 🍬",
      "Hehe, ticklish! Let's get 3 stars! ✨",
      "I believe in your candy matching skills! 💖",
      "Candy Kingdom will be proud of you! 👑"
    ];
    setSpeech(greetings[Math.floor(Math.random() * greetings.length)]);
    setTimeout(() => setIsTapped(false), 600);
  };

  return (
    <div
      className={`relative flex items-end select-none pointer-events-auto transition-all duration-300 ${
        isCompact ? 'scale-85' : ''
      }`}
    >
      {/* Anime Speech Bubble */}
      <div
        className="absolute -top-14 left-4 z-40 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-pink-200 text-xs sm:text-sm font-bold text-pink-700 max-w-[200px] sm:max-w-[240px] animate-float"
        style={{
          boxShadow: '0 8px 24px -4px rgba(244, 114, 182, 0.35)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{speech}</span>
        </div>
        {/* Speech triangle pointing to companion */}
        <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white/95 rotate-45 border-b border-r border-pink-200" />
      </div>

      {/* Companion Character Card / Sprite */}
      <div
        onClick={handleCompanionTap}
        className={`relative group cursor-pointer transition-transform duration-200 ${
          isTapped ? 'scale-95 rotate-2' : 'hover:scale-105'
        }`}
      >
        {/* Glow Aura */}
        <div className="absolute -inset-1.5 bg-gradient-to-t from-pink-500 via-purple-400 to-amber-300 rounded-3xl opacity-40 blur-md group-hover:opacity-75 transition-opacity" />

        {/* Character Portrait Frame */}
        <div className="relative w-24 sm:w-32 h-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/80 shadow-xl bg-gradient-to-b from-pink-200 to-purple-100 flex items-center justify-center">
          <img
            src={companionImage}
            alt="Anime Candy Companion - Chii"
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />

          {/* Sweet Mascot Badge */}
          <div className="absolute bottom-1.5 inset-x-1.5 bg-black/60 backdrop-blur-md rounded-xl py-0.5 px-1.5 flex items-center justify-between text-[10px] text-white font-semibold">
            <span className="flex items-center gap-1 text-pink-300">
              <Heart className="w-2.5 h-2.5 fill-pink-400 text-pink-400" />
              Chii
            </span>
            <span className="text-amber-300 text-[9px]">Tap Me!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
