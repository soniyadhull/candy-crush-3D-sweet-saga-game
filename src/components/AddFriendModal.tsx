import React, { useState } from 'react';
import { UserPlus, Copy, Check, X, Search, Sparkles, Users } from 'lucide-react';
import { audio } from '../services/audioService';

interface AddFriendModalProps {
  onAddFriend: (name: string) => void;
  onClose: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  onAddFriend,
  onClose
}) => {
  const [friendName, setFriendName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const playerFriendCode = "SWEET-8824";

  const handleCopyCode = () => {
    audio.playSelect();
    navigator.clipboard?.writeText?.(playerFriendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendName.trim()) return;

    audio.playSelect();
    onAddFriend(friendName.trim());
    setSuccessMessage(`Added ${friendName.trim()} to your Candy Friend List! 🎉`);
    setFriendName('');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const suggestedFriends = [
    { name: 'KannaChan', avatar: '🎀', level: 23 },
    { name: 'BerryBlast', avatar: '🍓', level: 31 },
    { name: 'ChocoMaster', avatar: '🍫', level: 42 },
    { name: 'StarPanda', avatar: '🐼', level: 18 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-950 via-rose-950 to-purple-950 rounded-3xl border-4 border-amber-300 shadow-2xl p-4 sm:p-6 flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg mb-1">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-black text-amber-200">Add Candy Friends</h2>
          <p className="text-xs text-amber-300/80">Send lives, exchange boosters & challenge each other!</p>
        </div>

        {/* Your Friend Code */}
        <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] text-pink-300 uppercase tracking-wider font-bold">Your Friend Code</span>
            <div className="text-base font-black text-white">{playerFriendCode}</div>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all active:scale-95 shadow"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddSubmit} className="space-y-2 mb-4">
          <label className="text-xs font-bold text-amber-200 block">
            Enter Friend Name or Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={friendName}
              onChange={e => setFriendName(e.target.value)}
              placeholder="e.g. Yuki, SugarHero, SWEET-1234"
              className="flex-1 bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-neutral-500"
            />
            <button
              type="submit"
              disabled={!friendName.trim()}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-bold text-xs text-white hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow"
            >
              Add
            </button>
          </div>
        </form>

        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold text-center mb-3">
            {successMessage}
          </div>
        )}

        {/* Suggested Friends */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 mb-2">
            <Users className="w-3.5 h-3.5 text-pink-400" />
            <span>Recommended Candy Crushers</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {suggestedFriends.map(s => (
              <div
                key={s.name}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.avatar}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{s.name}</div>
                    <div className="text-[10px] text-amber-300">Level {s.level}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audio.playSelect();
                    onAddFriend(s.name);
                    setSuccessMessage(`Added ${s.name}!`);
                    setTimeout(() => setSuccessMessage(null), 2500);
                  }}
                  className="py-1 px-2.5 rounded-lg bg-pink-500 hover:bg-pink-400 text-white text-[11px] font-bold active:scale-95"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
