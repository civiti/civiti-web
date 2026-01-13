import { UserRole } from '../../types/civica-api.types';

// Authentication State Interface
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // True after initial auth check completes (success or failure)
  token: string | null;
  refreshToken: string | null;
  error: string | null;
  user: AuthUser | null;
  loginMethod: 'google' | 'email' | null;
}

// AuthUser type that matches what the API returns
export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  authProvider: 'google' | 'email';
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  role: UserRole;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  token: null,
  refreshToken: null,
  error: null,
  user: null,
  loginMethod: null
};