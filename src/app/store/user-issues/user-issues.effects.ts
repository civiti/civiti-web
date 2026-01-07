import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, switchMap, mergeMap, catchError, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../services/api.service';
import * as UserIssuesActions from './user-issues.actions';
import * as AuthActions from '../auth/auth.actions';

@Injectable()
export class UserIssuesEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private message = inject(NzMessageService);

  // Load User Issues - use switchMap to cancel pending requests when new load is triggered
  loadUserIssues$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserIssuesActions.loadUserIssues, UserIssuesActions.refreshUserIssues),
      switchMap((action) => {
        const params = 'params' in action ? action.params : undefined;
        return this.apiService.getUserIssues(params).pipe(
          map(response => UserIssuesActions.loadUserIssuesSuccess({
            issues: response.items,
            totalCount: response.totalCount
          })),
          catchError(error => {
            console.error('[UserIssues Effects] Failed to load user issues:', error);
            return of(UserIssuesActions.loadUserIssuesFailure({
              error: error.message || 'Eroare la incarcarea problemelor'
            }));
          })
        );
      })
    )
  );

  // Mark Issue As Solved
  markIssueAsSolved$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserIssuesActions.markIssueAsSolved),
      mergeMap(({ issueId }) =>
        this.apiService.updateIssueStatus(issueId, 'resolved').pipe(
          tap(() => this.message.success('Problema a fost marcată ca rezolvată!')),
          map(() => UserIssuesActions.markIssueAsSolvedSuccess({ issueId })),
          catchError(error => {
            console.error('[UserIssues Effects] Failed to mark issue as solved:', error);
            const errorMsg = error.error?.error || 'Eroare la actualizarea statusului';
            this.message.error(errorMsg);
            return of(UserIssuesActions.markIssueAsSolvedFailure({
              error: error.message || 'Failed to update status'
            }));
          })
        )
      )
    )
  );

  // Cancel Issue
  cancelIssue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserIssuesActions.cancelIssue),
      mergeMap(({ issueId }) =>
        this.apiService.updateIssueStatus(issueId, 'cancelled').pipe(
          tap(() => this.message.success('Problema a fost anulată')),
          map(() => UserIssuesActions.cancelIssueSuccess({ issueId })),
          catchError(error => {
            console.error('[UserIssues Effects] Failed to cancel issue:', error);
            const errorMsg = error.error?.error || 'Eroare la anularea problemei';
            this.message.error(errorMsg);
            return of(UserIssuesActions.cancelIssueFailure({
              error: error.message || 'Failed to cancel issue'
            }));
          })
        )
      )
    )
  );

  // Clear user issues on logout to prevent data leakage between sessions
  clearOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => UserIssuesActions.clearUserIssues())
    )
  );
}
