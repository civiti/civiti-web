// User Profile and Gamification State Interface
export interface UserState {
  profile: UserProfile | null;
  gamification: GamificationData | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserProfile {
  id: string;
  supabaseUserId: string;
  email: string;
  photoURL?: string;
  displayName: string;
  county: string;
  city: string;
  district?: string;
  residenceType: 'urban' | 'rural';
  birthYear?: number;
  points: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface GamificationData {
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  rank: number;
  recentBadges: Badge[];
  activeAchievements: Achievement[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  pointValue: number;
  requirement?: string;
  earnedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  pointReward: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'ro' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    showOnLeaderboard: boolean;
    shareLocation: boolean;
    publicProfile: boolean;
  };
}

export const initialUserState: UserState = {
  profile: null,
  gamification: null,
  preferences: null,
  isLoading: false,
  error: null
};