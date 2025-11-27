import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
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
            totalCount: response.totalCount 
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
      mergeMap(({ issueId, emailAddress, targetAuthority }) =>
        this.apiService.trackEmailSent(issueId, { emailAddress, targetAuthority }).pipe(
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
            this.message.error('Eroare la înregistrarea email-ului');
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
      })
    ),
    { dispatch: false }
  );
}