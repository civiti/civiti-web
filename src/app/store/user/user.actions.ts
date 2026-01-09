import { createAction, props } from '@ngrx/store';
import { UserProfile, GamificationData, UserPreferences } from './user.state';
import { UpdateUserProfileRequest } from '../../types/civica-api.types';

// Profile Management Actions
export const loadUserProfile = createAction(
  '[User] Load User Profile',
  props<{ userId: string }>()
);

export const loadUserProfileSuccess = createAction(
  '[User] Load User Profile Success',
  props<{ profile: UserProfile; gamification?: GamificationData }>()
);

export const loadUserProfileFailure = createAction(
  '[User] Load User Profile Failure',
  props<{ error: string }>()
);

export const updateUserProfile = createAction(
  '[User] Update User Profile',
  props<{ updates: UpdateUserProfileRequest }>()
);

export const updateUserProfileSuccess = createAction(
  '[User] Update User Profile Success',
  props<{ profile: UserProfile; gamification?: GamificationData }>()
);

export const updateUserProfileFailure = createAction(
  '[User] Update User Profile Failure',
  props<{ error: string }>()
);

// Gamification Actions
export const loadGamificationData = createAction(
  '[User] Load Gamification Data',
  props<{ userId: string }>()
);

export const loadGamificationDataSuccess = createAction(
  '[User] Load Gamification Data Success',
  props<{ gamification: GamificationData }>()
);

export const loadGamificationDataFailure = createAction(
  '[User] Load Gamification Data Failure',
  props<{ error: string }>()
);

export const updatePoints = createAction(
  '[User] Update Points',
  props<{ points: number; reason: string }>()
);

export const updatePointsSuccess = createAction(
  '[User] Update Points Success',
  props<{ earnedPoints: number }>()
);

export const awardBadge = createAction(
  '[User] Award Badge',
  props<{ badgeId: string; reason: string }>()
);

export const awardBadgeSuccess = createAction(
  '[User] Award Badge Success',
  props<{ gamification: GamificationData }>()
);

// Preferences Actions
export const loadUserPreferences = createAction(
  '[User] Load User Preferences',
  props<{ userId: string }>()
);

export const loadUserPreferencesSuccess = createAction(
  '[User] Load User Preferences Success',
  props<{ preferences: UserPreferences }>()
);

export const loadUserPreferencesFailure = createAction(
  '[User] Load User Preferences Failure',
  props<{ error: string }>()
);

export const updateUserPreferences = createAction(
  '[User] Update User Preferences',
  props<{ preferences: Partial<UserPreferences> }>()
);

export const updateUserPreferencesSuccess = createAction(
  '[User] Update User Preferences Success',
  props<{ preferences: UserPreferences }>()
);

export const updateUserPreferencesFailure = createAction(
  '[User] Update User Preferences Failure',
  props<{ error: string }>()
);

// Clear User Data
export const clearUserData = createAction('[User] Clear User Data');