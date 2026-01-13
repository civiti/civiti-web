import { createReducer, on } from '@ngrx/store';
import { AuthState, initialAuthState } from './auth.state';
import * as AuthActions from './auth.actions';

export const authReducer = createReducer(
  initialAuthState,

  // Google OAuth Reducers
  on(AuthActions.loginWithGoogle, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loginWithGoogleSuccess, (state, { user, token, refreshToken }) => ({
    ...state,
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    user,
    token,
    refreshToken,
    loginMethod: 'google' as 'google' | 'email' | null,
    error: null
  })),

  on(AuthActions.loginWithGoogleFailure, (state, { error }) => ({
    ...state,
    isAuthenticated: false,
    isLoading: false,
    error,
    user: null,
    token: null,
    refreshToken: null,
    loginMethod: null
  })),

  // Email/Password Login Reducers
  on(AuthActions.loginWithEmail, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loginWithEmailSuccess, (state, { user, token, refreshToken }) => ({
    ...state,
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    user,
    token,
    refreshToken,
    loginMethod: 'email' as 'google' | 'email' | null,
    error: null
  })),

  on(AuthActions.loginWithEmailFailure, (state, { error }) => ({
    ...state,
    isAuthenticated: false,
    isLoading: false,
    error,
    user: null,
    token: null,
    refreshToken: null,
    loginMethod: null
  })),

  // Registration Reducers
  on(AuthActions.registerWithEmail, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.registerWithEmailSuccess, (state, { user, token, refreshToken }) => ({
    ...state,
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    user,
    token,
    refreshToken,
    loginMethod: 'email' as 'google' | 'email' | null,
    error: null
  })),

  on(AuthActions.registerWithEmailFailure, (state, { error }) => ({
    ...state,
    isAuthenticated: false,
    isLoading: false,
    error,
    user: null,
    token: null,
    refreshToken: null,
    loginMethod: null
  })),

  // Token Management Reducers
  on(AuthActions.refreshToken, (state) => ({
    ...state,
    isLoading: true
  })),

  on(AuthActions.refreshTokenSuccess, (state, { token, refreshToken }) => ({
    ...state,
    isLoading: false,
    token,
    refreshToken,
    error: null
  })),

  on(AuthActions.refreshTokenFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    loginMethod: null
  })),

  // Session Management Reducers
  // Keep isInitialized: true after logout since auth check was already done
  on(AuthActions.logout, () => ({
    ...initialAuthState,
    isInitialized: true
  })),

  on(AuthActions.clearAuthError, (state) => ({
    ...state,
    error: null
  })),

  on(AuthActions.loadUserFromStorage, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(AuthActions.loadUserFromStorageSuccess, (state, { user, token, refreshToken }) => ({
    ...state,
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    user,
    token,
    refreshToken,
    loginMethod: user?.authProvider || null,
    error: null
  })),

  on(AuthActions.loadUserFromStorageFailure, (state, { error }) => ({
    ...state,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
    error,
    user: null,
    token: null,
    refreshToken: null,
    loginMethod: null
  }))
);