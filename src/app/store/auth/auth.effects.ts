import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import * as AuthActions from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private message = inject(NzMessageService);

  // Google OAuth Effects
  loginWithGoogle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginWithGoogle),
      switchMap(() =>
        this.authService.loginWithGoogle().pipe(
          map(response => AuthActions.loginWithGoogleSuccess({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken
          })),
          catchError(error => {
            // Handle OAuth redirect case
            if (error.type === 'oauth_redirect') {
              // This is expected for OAuth flows
              this.message.info('Redirecting to Google for authentication...');
              return of({ type: '[Auth] OAuth Redirect' });
            }
            return of(AuthActions.loginWithGoogleFailure({ 
              error: error.message || 'Google login failed' 
            }));
          })
        )
      )
    )
  );

  // Email/Password Login Effects
  loginWithEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginWithEmail),
      switchMap(({ email, password }) =>
        this.authService.loginWithEmail(email, password).pipe(
          switchMap(response => {
            // After successful Supabase login, get user profile for display data
            // Role comes from Supabase app_metadata (already in response.user.role)
            return this.apiService.getUserProfile().pipe(
              map(profile => AuthActions.loginWithEmailSuccess({
                user: {
                  ...response.user,
                  // Merge profile data for display (displayName, photoUrl)
                  // Role stays from Supabase app_metadata (response.user.role)
                  displayName: profile.displayName,
                  photoUrl: profile.photoUrl ?? response.user.photoUrl
                },
                token: response.token,
                refreshToken: response.refreshToken
              })),
              catchError(() => {
                // If profile doesn't exist, we still have a valid auth
                return of(AuthActions.loginWithEmailSuccess({
                  user: response.user,
                  token: response.token,
                  refreshToken: response.refreshToken
                }));
              })
            );
          }),
          catchError(error => of(AuthActions.loginWithEmailFailure({ 
            error: error.message || 'Email login failed' 
          })))
        )
      )
    )
  );

  // Registration Effects
  registerWithEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerWithEmail),
      switchMap(({ email, password, displayName, county, city, district, residenceType }) =>
        this.authService.registerWithEmail(email, password, displayName).pipe(
          switchMap(response => {
            // After successful Supabase registration, create user profile in backend
            return this.apiService.createUserProfile({
              supabaseUserId: response.user.id,
              email: response.user.email || email,
              displayName: displayName || email.split('@')[0],
              county,
              city,
              district,
              residenceType
            }).pipe(
              map(profile => AuthActions.registerWithEmailSuccess({
                user: {
                  ...response.user,
                  // Merge profile data for display (displayName, photoUrl)
                  // Role stays from Supabase app_metadata (response.user.role)
                  displayName: profile.displayName,
                  photoUrl: profile.photoUrl ?? response.user.photoUrl
                },
                token: response.token,
                refreshToken: response.refreshToken
              })),
              catchError(() => {
                // If profile creation fails, we still have a valid auth
                return of(AuthActions.registerWithEmailSuccess({
                  user: response.user,
                  token: response.token,
                  refreshToken: response.refreshToken
                }));
              })
            );
          }),
          catchError(error => of(AuthActions.registerWithEmailFailure({ 
            error: error.message || 'Registration failed' 
          })))
        )
      )
    )
  );

  // Token Refresh Effects
  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() =>
        this.authService.refreshToken().pipe(
          map(response => AuthActions.refreshTokenSuccess({
            token: response.token,
            refreshToken: response.refreshToken
          })),
          catchError(error => of(AuthActions.refreshTokenFailure({ 
            error: error.message || 'Token refresh failed' 
          })))
        )
      )
    )
  );

  // Success Navigation Effects
  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthActions.loginWithGoogleSuccess,
        AuthActions.loginWithEmailSuccess,
        AuthActions.registerWithEmailSuccess
      ),
      tap(({ user }) => {
        this.message.success(`Bine ai venit, ${user.displayName}!`);
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  // Error Message Effects
  authError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthActions.loginWithGoogleFailure,
        AuthActions.loginWithEmailFailure,
        AuthActions.registerWithEmailFailure,
        AuthActions.refreshTokenFailure
      ),
      tap(({ error }) => {
        this.message.error(error);
      })
    ),
    { dispatch: false }
  );

  // Logout Effects
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          tap(() => {
            this.message.info('Ai fost deconectat');
            this.router.navigate(['/auth/register']);
          }),
          map(() => ({ type: '[Auth] Logout Complete' })),
          catchError(error => {
            console.error('Logout error:', error);
            this.router.navigate(['/auth/register']);
            return of({ type: '[Auth] Logout Error' });
          })
        )
      )
    )
  );

  // Load User from Storage on App Init
  loadUserFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      switchMap(() =>
        this.authService.getCurrentUser().pipe(
          switchMap(userData => {
            if (userData) {
              // Try to get user profile from backend
              return this.apiService.getUserProfile().pipe(
                map(profile => {
                  // Merge profile data for display (displayName, photoUrl)
                  // Role stays from Supabase app_metadata (userData.user.role)
                  return AuthActions.loadUserFromStorageSuccess({
                    user: {
                      ...userData.user,
                      displayName: profile.displayName,
                      photoUrl: profile.photoUrl ?? userData.user.photoUrl
                    },
                    token: userData.token,
                    refreshToken: userData.refreshToken
                  });
                }),
                catchError(() => {
                  // If profile fetch fails, use auth data only
                  return of(AuthActions.loadUserFromStorageSuccess({
                    user: userData.user,
                    token: userData.token,
                    refreshToken: userData.refreshToken
                  }));
                })
              );
            }
            return of(AuthActions.loadUserFromStorageFailure({ 
              error: 'No user found in storage' 
            }));
          }),
          catchError(error => {
            console.error('Load user error:', error);
            return of(AuthActions.loadUserFromStorageFailure({ 
              error: error.message || 'Failed to load user from storage' 
            }));
          })
        )
      )
    )
  );

  // Check Auth Status Effect
  checkAuthStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkAuthStatus),
      switchMap(() =>
        this.authService.isTokenValid().pipe(
          map(isValid => {
            if (!isValid) {
              return AuthActions.logout();
            }
            return { type: '[Auth] Auth Status Valid' };
          }),
          catchError(() => of(AuthActions.logout()))
        )
      )
    )
  );
}