import { createAction, props } from '@ngrx/store';
import { AuthUser } from './auth.state';

// Google OAuth Actions
export const loginWithGoogle = createAction('[Auth] Login with Google');

export const loginWithGoogleSuccess = createAction(
  '[Auth] Login with Google Success',
  props<{ user: AuthUser; token: string; refreshToken: string }>()
);

export const loginWithGoogleFailure = createAction(
  '[Auth] Login with Google Failure',
  props<{ error: string }>()
);

// Email/Password Actions
export const loginWithEmail = createAction(
  '[Auth] Login with Email',
  props<{ email: string; password: string }>()
);

export const loginWithEmailSuccess = createAction(
  '[Auth] Login with Email Success',
  props<{ user: AuthUser; token: string; refreshToken: string }>()
);

export const loginWithEmailFailure = createAction(
  '[Auth] Login with Email Failure',
  props<{ error: string }>()
);

// Registration Actions
export const registerWithEmail = createAction(
  '[Auth] Register with Email',
  props<{ 
    email: string; 
    password: string; 
    displayName: string;
    county: string;
    city: string;
    district?: string;
    residenceType: 'urban' | 'rural';
    birthYear?: number;
  }>()
);

export const registerWithEmailSuccess = createAction(
  '[Auth] Register with Email Success',
  props<{ user: AuthUser; token: string; refreshToken: string }>()
);

export const registerWithEmailFailure = createAction(
  '[Auth] Register with Email Failure',
  props<{ error: string }>()
);

// Token Management
export const refreshToken = createAction('[Auth] Refresh Token');

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ token: string; refreshToken: string }>()
);

export const refreshTokenFailure = createAction(
  '[Auth] Refresh Token Failure',
  props<{ error: string }>()
);

// Session Management
export const logout = createAction('[Auth] Logout');

export const loadUserFromStorage = createAction('[Auth] Load User from Storage');

export const loadUserFromStorageSuccess = createAction(
  '[Auth] Load User from Storage Success',
  props<{ user: AuthUser; token: string; refreshToken: string }>()
);

export const loadUserFromStorageFailure = createAction(
  '[Auth] Load User from Storage Failure',
  props<{ error: string }>()
);

export const clearAuthError = createAction('[Auth] Clear Auth Error');

export const checkAuthStatus = createAction('[Auth] Check Auth Status');