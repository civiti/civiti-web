import { createReducer, on } from '@ngrx/store';
import { UserState, initialUserState } from './user.state';
import * as UserActions from './user.actions';

export const userReducer = createReducer(
  initialUserState,

  // Profile Management Reducers
  on(UserActions.loadUserProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(UserActions.loadUserProfileSuccess, (state, { profile, gamification }) => ({
    ...state,
    profile,
    gamification: gamification ?? state.gamification,
    isLoading: false,
    error: null
  })),

  on(UserActions.loadUserProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  on(UserActions.updateUserProfile, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(UserActions.updateUserProfileSuccess, (state, { profile, gamification }) => ({
    ...state,
    profile,
    gamification: gamification ?? state.gamification,
    isLoading: false,
    error: null
  })),

  on(UserActions.updateUserProfileFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // Gamification Reducers
  on(UserActions.loadGamificationData, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(UserActions.loadGamificationDataSuccess, (state, { gamification }) => ({
    ...state,
    gamification,
    isLoading: false,
    error: null
  })),

  on(UserActions.loadGamificationDataFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  on(UserActions.updatePointsSuccess, (state, { earnedPoints }) => ({
    ...state,
    gamification: state.gamification ? {
      ...state.gamification,
      points: state.gamification.points + earnedPoints
    } : null
  })),

  on(UserActions.awardBadgeSuccess, (state, { gamification }) => ({
    ...state,
    gamification
  })),

  // Preferences Reducers
  on(UserActions.loadUserPreferences, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(UserActions.loadUserPreferencesSuccess, (state, { preferences }) => ({
    ...state,
    preferences,
    isLoading: false,
    error: null
  })),

  on(UserActions.loadUserPreferencesFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  on(UserActions.updateUserPreferences, (state) => ({
    ...state,
    isLoading: true,
    error: null
  })),

  on(UserActions.updateUserPreferencesSuccess, (state, { preferences }) => ({
    ...state,
    preferences,
    isLoading: false,
    error: null
  })),

  on(UserActions.updateUserPreferencesFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error
  })),

  // Clear User Data
  on(UserActions.clearUserData, () => initialUserState)
);