import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

export const selectAuthUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectAuthToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.token
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

export const selectLoginMethod = createSelector(
  selectAuthState,
  (state: AuthState) => state.loginMethod
);

export const selectUserDisplayName = createSelector(
  selectAuthUser,
  (user) => user?.displayName || ''
);

export const selectUserEmail = createSelector(
  selectAuthUser,
  (user) => user?.email || ''
);

export const selectIsEmailVerified = createSelector(
  selectAuthUser,
  (user) => user?.emailVerified || false
);

// Role-based selectors for admin access control
export const selectUserRole = createSelector(
  selectAuthUser,
  (user) => user?.role || 'user'
);

export const selectIsAdmin = createSelector(
  selectUserRole,
  (role) => role === 'admin'
);

export const selectCanAccessAdminPanel = createSelector(
  selectIsAuthenticated,
  selectIsAdmin,
  (isAuthenticated, isAdmin) => isAuthenticated && isAdmin
);