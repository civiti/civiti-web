import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, concatMap, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../services/api.service';
import * as IssueActions from './issue.actions';

@Injectable()
export class IssueEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private message = inject(NzMessageService);

  // Load Issues Effect
  loadIssues$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.loadIssues),
      mergeMap(({ params }) =>
        this.apiService.getIssues(params).pipe(
          map(response => IssueActions.loadIssuesSuccess({
            issues: response.items,
            totalItems: response.totalItems,
            page: response.page,
            pageSize: response.pageSize,
            totalPages: response.totalPages
          })),
          catchError(error => {
            console.error('[Issues Effects] Failed to load issues:', error);
            return of(IssueActions.loadIssuesFailure({
              error: error.message || 'Failed to load issues'
            }));
          })
        )
      )
    )
  );

  // Load Single Issue Effect
  loadIssue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.loadIssue),
      mergeMap(({ id }) =>
        this.apiService.getIssueById(id).pipe(
          map(issue => {
            if (issue) {
              return IssueActions.loadIssueSuccess({ issue });
            } else {
              return IssueActions.loadIssueFailure({ error: 'Issue not found' });
            }
          }),
          catchError(error => {
            console.error(`[Issues Effects] Failed to load issue ${id}:`, error);
            return of(IssueActions.loadIssueFailure({ 
              error: error.message || 'Failed to load issue details' 
            }));
          })
        )
      )
    )
  );

  // Track Email Sent Effect
  trackEmailSent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.trackEmailSent),
      mergeMap(({ issueId, targetAuthority }) =>
        this.apiService.trackEmailSent(issueId, { targetAuthority }).pipe(
          map(response => {
            this.message.success(`Email trimis! +${response.pointsEarned} puncte câștigate!`);
            return IssueActions.trackEmailSentSuccess({
              issueId,
              pointsEarned: response.pointsEarned,
              newTotalEmails: response.newTotalEmails
            });
          }),
          catchError(error => {
            console.error(`[Issues Effects] Failed to track email for issue ${issueId}:`, error);
            if (error.status === 429) {
              this.message.info('Ai contribuit deja la această problemă. Mulțumim!');
            } else {
              this.message.error('Eroare la înregistrarea email-ului');
            }
            return of(IssueActions.trackEmailSentFailure({
              error: error.message || 'Failed to track email'
            }));
          })
        )
      )
    )
  );

  // Create Issue Effect
  createIssue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.createIssue),
      mergeMap(({ issue }) =>
        this.apiService.createIssue(issue).pipe(
          tap(response => {
            console.log('[Issues Effects] Issue created successfully:', response);
            this.message.success('Problema a fost raportată cu succes!');
            // Navigate to the newly created issue or issues list
            this.router.navigate(['/issues', response.id]);
          }),
          map(response => IssueActions.createIssueSuccess({ response })),
          catchError(error => {
            console.error('[Issues Effects] Failed to create issue:', error);
            this.message.error('Eroare la crearea problemei. Vă rugăm încercați din nou.');
            return of(IssueActions.createIssueFailure({ 
              error: error.message || 'Failed to create issue' 
            }));
          })
        )
      )
    )
  );

  // Success Navigation Effect
  createIssueSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.createIssueSuccess),
      tap(({ response }) => {
        // Clear session storage after successful creation
        sessionStorage.removeItem('civica_selected_category');
        sessionStorage.removeItem('civica_uploaded_photos');
        sessionStorage.removeItem('civica_current_location');
        sessionStorage.removeItem('civica_complete_issue_data');
        sessionStorage.removeItem('civica_selected_authorities');
      })
    ),
    { dispatch: false }
  );

  // Vote for Issue Effect
  voteForIssue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.voteForIssue),
      concatMap(({ issueId }) =>
        this.apiService.voteForIssue(issueId).pipe(
          map(() => {
            this.message.success('Votul tău a fost înregistrat!');
            return IssueActions.voteForIssueSuccess({ issueId });
          }),
          catchError(error => {
            console.error(`[Issues Effects] Failed to vote for issue ${issueId}:`, error);
            // Handle "already voted" by syncing state without modifying count
            if (error.status === 409 || error.error?.message?.toLowerCase().includes('already voted')) {
              return of(IssueActions.syncVoteState({ issueId, hasVoted: true }));
            }
            // Map API errors to Romanian messages
            let errorMessage = 'Eroare la înregistrarea votului';
            if (error.error?.message) {
              const msg = error.error.message.toLowerCase();
              if (msg.includes('cannot vote on own issue')) {
                errorMessage = 'Nu poți vota pentru propria problemă';
              } else if (msg.includes('only vote on active')) {
                errorMessage = 'Poți vota doar pentru probleme active';
              }
            }
            this.message.error(errorMessage);
            return of(IssueActions.voteForIssueFailure({ issueId, error: errorMessage }));
          })
        )
      )
    )
  );

  // Remove Vote from Issue Effect
  removeVoteFromIssue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.removeVoteFromIssue),
      concatMap(({ issueId }) =>
        this.apiService.removeIssueVote(issueId).pipe(
          map(() => {
            this.message.success('Votul tău a fost retras');
            return IssueActions.removeVoteFromIssueSuccess({ issueId });
          }),
          catchError(error => {
            console.error(`[Issues Effects] Failed to remove vote for issue ${issueId}:`, error);
            // Handle "not voted" by syncing state without modifying count
            if (error.status === 404 || error.error?.message?.toLowerCase().includes('not voted')) {
              return of(IssueActions.syncVoteState({ issueId, hasVoted: false }));
            }
            this.message.error('Eroare la retragerea votului');
            return of(IssueActions.removeVoteFromIssueFailure({
              issueId,
              error: error.message || 'Failed to remove vote'
            }));
          })
        )
      )
    )
  );
}