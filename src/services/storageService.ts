import { PlayerProgress, FriendData, DailyRewardItem } from '../types';

const STORAGE_KEY = 'candy_crush_3d_player_data';
const FRIENDS_KEY = 'candy_crush_3d_friends';

const INITIAL_PROGRESS: PlayerProgress = {
  unlockedLevel: 1,
  stars: {},
  highScores: {},
  coins: 850,
  lives: 5,
  maxLives: 5,
  boosters: {
    lollipop: 3,
    colorBomb: 2,
    extraMoves: 2,
    striped: 3
  },
  dailyRewardStreak: 0,
  lastClaimDate: null,
  settings: {
    bgmVolume: 0.5,
    sfxVolume: 0.7,
    hapticsEnabled: true,
    musicTrackIndex: 0,
    companionVoice: true
  }
};

const DEFAULT_FRIENDS: FriendData[] = [
  { id: 'friend_1', name: 'Sakura Mochi', avatar: '🌸', level: 34, score: 98450, isOnline: true, lastActive: 'Just now' },
  { id: 'friend_2', name: 'GummyKen', avatar: '🐻', level: 27, score: 76200, isOnline: true, lastActive: '5m ago' },
  { id: 'friend_3', name: 'ChocoQueen', avatar: '🍫', level: 48, score: 145900, isOnline: false, lastActive: '2h ago' },
  { id: 'friend_4', name: 'LollipopDan', avatar: '🍭', level: 19, score: 48100, isOnline: true, lastActive: 'Just now' },
  { id: 'friend_5', name: 'BobaFairy', avatar: '🧋', level: 62, score: 218400, isOnline: false, lastActive: '1d ago' },
  { id: 'friend_6', name: 'SugarKnight', avatar: '⚔️', level: 15, score: 38900, isOnline: false, lastActive: '3d ago' },
];

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, coins: 200, boosterName: 'Extra Moves', boosterType: 'extraMoves', boosterAmount: 1, description: '+5 Extra Moves' },
  { day: 2, coins: 350, boosterName: 'Striped Candy', boosterType: 'striped', boosterAmount: 1, description: 'Line Clearing Candy' },
  { day: 3, coins: 500, boosterName: 'Lollipop Hammer', boosterType: 'lollipop', boosterAmount: 1, description: 'Crush Any Candy Tile' },
  { day: 4, coins: 700, boosterName: 'Color Bomb', boosterType: 'colorBomb', boosterAmount: 1, description: 'Rainbow Disco Blast' },
  { day: 5, coins: 1000, boosterName: 'Super Pack', boosterType: 'extraMoves', boosterAmount: 2, description: 'Double Extra Moves + 1,000 Coins' },
  { day: 6, coins: 1500, boosterName: 'Lollipop Pack', boosterType: 'lollipop', boosterAmount: 2, description: '2x Lollipop Hammers' },
  { day: 7, coins: 3000, boosterName: 'Grand Crown', boosterType: 'colorBomb', boosterAmount: 3, description: '3x Color Bombs + 3,000 Coins!' },
];

export const storage = {
  getProgress(): PlayerProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...INITIAL_PROGRESS, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return INITIAL_PROGRESS;
  },

  saveProgress(progress: PlayerProgress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  },

  getFriends(): FriendData[] {
    try {
      const data = localStorage.getItem(FRIENDS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return DEFAULT_FRIENDS;
  },

  saveFriends(friends: FriendData[]) {
    try {
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    } catch {}
  },

  addFriend(name: string): FriendData {
    const friends = this.getFriends();
    const avatars = ['🎀', '🧁', '🍬', '🦊', '⚡', '✨', '🍓', '🥞', '🍡'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    const newFriend: FriendData = {
      id: `friend_${Date.now()}`,
      name: name.trim(),
      avatar: randomAvatar,
      level: Math.floor(Math.random() * 25) + 1,
      score: Math.floor(Math.random() * 45000) + 10000,
      isOnline: true,
      lastActive: 'Just now'
    };
    friends.unshift(newFriend);
    this.saveFriends(friends);
    return newFriend;
  },

  sendLife(friendId: string): boolean {
    const friends = this.getFriends();
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      friend.hasSentLifeToday = true;
      this.saveFriends(friends);
      return true;
    }
    return false;
  }
};
