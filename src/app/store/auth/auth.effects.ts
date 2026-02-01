import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import * as AuthActions from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { clearIssueCreationSession } from '../../components/issue-creation/issue-session.util';

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
              this.message.info('Redirecționare către Google pentru autentificare...');
              return of({ type: '[Auth] OAuth Redirect' });
            }
            return of(AuthActions.loginWithGoogleFailure({ 
              error: error.message || 'Autentificarea cu Google a eșuat' 
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
            error: error.message || 'Autentificarea cu email a eșuat' 
          })))
        )
      )
    )
  );

  // Registration Effects
  registerWithEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerWithEmail),
      switchMap(({ email, password, displayName, county, city, district, residenceType, issueUpdatesEnabled, communityNewsEnabled, monthlyDigestEnabled, achievementsEnabled }) =>
        this.authService.registerWithEmail(email, password, displayName, {
          county,
          city,
          district,
          residence_type: residenceType,
          issue_updates_enabled: issueUpdatesEnabled,
          community_news_enabled: communityNewsEnabled,
          monthly_digest_enabled: monthlyDigestEnabled,
          achievements_enabled: achievementsEnabled
        }).pipe(
          switchMap(response => {
            // Check if email confirmation is required (no token returned)
            if (!response.token) {
              // Email confirmation required - profile data is stored in Supabase user_metadata.
              // On first login after confirmation, getUserProfile() triggers backend auto-creation
              // which reads user_metadata to populate the profile.
              return of(AuthActions.registerWithEmailPendingConfirmation({ email }));
            }

            // Email confirmation not required - user is logged in immediately
            return this.apiService.createUserProfile({
              supabaseUserId: response.user.id,
              email: response.user.email || email,
              displayName: displayName || email.split('@')[0],
              county,
              city,
              district,
              residenceType,
              issueUpdatesEnabled,
              communityNewsEnabled,
              monthlyDigestEnabled,
              achievementsEnabled
            }).pipe(
              map(profile => AuthActions.registerWithEmailSuccess({
                user: {
                  ...response.user,
                  displayName: profile.displayName,
                  photoUrl: profile.photoUrl ?? response.user.photoUrl
                },
                token: response.token,
                refreshToken: response.refreshToken
              })),
              catchError((error) => {
                // Profile creation failed but auth succeeded
                console.error('[Registration] Profile creation failed:', error);
                console.error('[Registration] Lost profile data:', { county, city, district, residenceType });
                this.message.warning('Profilul nu a putut fi salvat complet. Poți actualiza profilul din setări.');
                return of(AuthActions.registerWithEmailSuccess({
                  user: response.user,
                  token: response.token,
                  refreshToken: response.refreshToken
                }));
              })
            );
          }),
          catchError(error => of(AuthActions.registerWithEmailFailure({
            error: error.message || 'Înregistrarea a eșuat'
          })))
        )
      )
    )
  );

  // Show message when email confirmation is required
  emailConfirmationPending$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerWithEmailPendingConfirmation),
      tap(({ email }) => {
        this.message.success(`Verifică-ți email-ul (${email}) pentru a confirma contul.`);
      })
    ),
    { dispatch: false }
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
            error: error.message || 'Reîmprospătarea sesiunii a eșuat' 
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
        // Clear issue creation data if a different user logs in
        this.clearDataIfUserChanged(user.id);
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
            // Clear issue creation draft data to prevent data leakage between users
            this.clearIssueCreationData();
            this.message.info('Ai fost deconectat');
            this.router.navigate(['/auth/register']);
          }),
          map(() => ({ type: '[Auth] Logout Complete' })),
          catchError(error => {
            console.error('Logout error:', error);
            // Still clear draft data even on error to ensure privacy
            this.clearIssueCreationData();
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
            // No user in storage is expected for new visitors - not an error
            return of(AuthActions.loadUserFromStorageFailure({
              error: ''
            }));
          }),
          catchError(error => {
            console.error('Load user error:', error);
            return of(AuthActions.loadUserFromStorageFailure({ 
              error: error.message || 'Nu s-au putut încărca datele utilizatorului' 
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

  // Password Reset Effects
  forgotPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      switchMap(({ email }) =>
        this.authService.resetPassword(email).pipe(
          map(() => AuthActions.forgotPasswordSuccess({ email })),
          catchError(error => of(AuthActions.forgotPasswordFailure({
            error: error.message || 'Trimiterea email-ului de resetare a eșuat'
          })))
        )
      )
    )
  );

  forgotPasswordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPasswordSuccess),
      tap(({ email }) => {
        this.message.success(`Email-ul de resetare a fost trimis la ${email}`);
      })
    ),
    { dispatch: false }
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      switchMap(({ password }) =>
        this.authService.updatePassword(password).pipe(
          map(() => AuthActions.resetPasswordSuccess()),
          catchError(error => of(AuthActions.resetPasswordFailure({
            error: error.message || 'Actualizarea parolei a eșuat'
          })))
        )
      )
    )
  );

  resetPasswordSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPasswordSuccess),
      tap(() => {
        this.message.success('Parola a fost schimbată cu succes!');
        this.router.navigate(['/auth/login']);
      })
    ),
    { dispatch: false }
  );

  // Handle password reset errors
  passwordResetError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPasswordFailure, AuthActions.resetPasswordFailure),
      tap(({ error }) => {
        this.message.error(error);
      })
    ),
    { dispatch: false }
  );

  /**
   * Clear issue creation draft data from sessionStorage.
   * Called on logout to prevent data leakage between users.
   */
  private clearIssueCreationData(): void {
    clearIssueCreationSession();
    sessionStorage.removeItem('civica_last_user_id');
  }

  /**
   * Check if a different user is logging in and clear their draft data.
   * Prevents one user from seeing another user's issue creation progress.
   */
  private clearDataIfUserChanged(newUserId: string): void {
    const lastUserId = sessionStorage.getItem('civica_last_user_id');

    if (lastUserId && lastUserId !== newUserId) {
      console.log('[Auth] Different user detected, clearing issue creation data');
      this.clearIssueCreationData();
    }

    // Store current user ID for future comparisons
    sessionStorage.setItem('civica_last_user_id', newUserId);
  }
}