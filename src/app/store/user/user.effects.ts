import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import * as UserActions from './user.actions';
import { ApiService } from '../../services/api.service';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private message = inject(NzMessageService);

  // Load User Profile Effects
  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUserProfile),
      switchMap(() =>
        this.apiService.getUserProfile().pipe(
          map(profile => UserActions.loadUserProfileSuccess({ profile })),
          catchError(error => of(UserActions.loadUserProfileFailure({
            error: error.message || 'Failed to load user profile'
          })))
        )
      )
    )
  );

  // Update User Profile Effects
  updateUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUserProfile),
      switchMap(({ updates }) =>
        this.apiService.updateUserProfile(updates).pipe(
          map(profile => UserActions.updateUserProfileSuccess({ profile })),
          catchError(error => of(UserActions.updateUserProfileFailure({
            error: error.message || 'Failed to update user profile'
          })))
        )
      )
    )
  );

  // Load Gamification Data Effects
  loadGamificationData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadGamificationData),
      switchMap(() =>
        this.apiService.getUserFullProfile().pipe(
          map(fullProfile => UserActions.loadGamificationDataSuccess({
            gamification: fullProfile.gamification
          })),
          catchError(error => of(UserActions.loadGamificationDataFailure({
            error: error.message || 'Failed to load gamification data'
          })))
        )
      )
    )
  );

  // Update Points Effects
  updatePoints$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updatePoints),
      switchMap(({ points, reason }) => {
        // For now, simulate point update since backend may not have this specific endpoint
        // This will be replaced when backend implements point tracking
        this.message.success(`+${points} points earned! ${reason}`);
        return of(UserActions.updatePointsSuccess({
          newPoints: points,
          totalPoints: points // This should be updated once we have real data
        }));
      })
    )
  );

  // Award Badge Effects
  awardBadge$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.awardBadge),
      switchMap(({ badgeId, reason }) => {
        // For now, simulate badge award since backend may not have this specific endpoint
        this.message.success(`🏆 New badge earned! ${reason}`, { nzDuration: 5000 });

        // Return updated gamification data by fetching full profile
        return this.apiService.getUserFullProfile().pipe(
          map(fullProfile => UserActions.awardBadgeSuccess({
            gamification: fullProfile.gamification
          })),
          catchError(error => {
            this.message.error('Failed to award badge');
            return of({ type: '[User] Award Badge Error' });
          })
        );
      })
    )
  );

  // Update Streak Effects
  updateStreak$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateStreak),
      switchMap(({ streakType, increment }) => {
        // For now, simulate streak update since backend may not have this specific endpoint
        console.log(`Updated ${streakType} streak by ${increment}`);

        // Return updated gamification data by fetching full profile
        return this.apiService.getUserFullProfile().pipe(
          map(fullProfile => UserActions.updateStreakSuccess({
            gamification: fullProfile.gamification
          })),
          catchError(error => {
            console.error('Failed to update streak:', error);
            return of({ type: '[User] Update Streak Error' });
          })
        );
      })
    )
  );

  // Load User Preferences Effects
  loadUserPreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUserPreferences),
      switchMap(() => {
        // For now, return default preferences since backend may not have this endpoint yet
        const defaultPreferences = {
          language: 'ro' as const,
          theme: 'light' as const,
          notifications: { email: true, push: true, inApp: false },
          privacy: { showOnLeaderboard: true, shareLocation: false, publicProfile: true }
        };

        return of(UserActions.loadUserPreferencesSuccess({
          preferences: defaultPreferences
        }));
      })
    )
  );

  // Update User Preferences Effects
  updateUserPreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUserPreferences),
      switchMap(({ preferences }) => {
        // For now, simulate preferences update since backend may not have this endpoint yet
        this.message.success('Preferences updated successfully');

        return of(UserActions.updateUserPreferencesSuccess({
          preferences: {
            language: 'ro' as const,
            theme: 'light' as const,
            notifications: { email: true, push: true, inApp: false },
            privacy: { showOnLeaderboard: true, shareLocation: false, publicProfile: true },
            ...preferences
          }
        }));
      })
    )
  );

  // Profile Update Success Message
  updateProfileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUserProfileSuccess),
      tap(() => {
        this.message.success('Profile updated successfully');
      })
    ),
    { dispatch: false }
  );

  // Error Message Effects
  userError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        UserActions.loadUserProfileFailure,
        UserActions.updateUserProfileFailure,
        UserActions.loadGamificationDataFailure,
        UserActions.loadUserPreferencesFailure,
        UserActions.updateUserPreferencesFailure
      ),
      tap(({ error }) => {
        this.message.error(error);
      })
    ),
    { dispatch: false }
  );
}