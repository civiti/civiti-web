import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { MockDataService } from '../../services/mock-data.service';
import * as IssueActions from './issue.actions';

@Injectable()
export class IssueEffects {
  private actions$ = inject(Actions);
  private mockDataService = inject(MockDataService);

  loadIssues$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.loadIssues),
      mergeMap(() =>
        this.mockDataService.getIssues().pipe(
          map(issues => IssueActions.loadIssuesSuccess({ issues })),
          catchError(error => of(IssueActions.loadIssuesFailure({ error: error.message })))
        )
      )
    )
  );

  loadIssue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.loadIssue),
      mergeMap(({ id }) =>
        this.mockDataService.getIssueById(id).pipe(
          map(issue => {
            if (issue) {
              return IssueActions.loadIssueSuccess({ issue });
            } else {
              return IssueActions.loadIssueFailure({ error: 'Issue not found' });
            }
          }),
          catchError(error => of(IssueActions.loadIssueFailure({ error: error.message })))
        )
      )
    )
  );

  incrementEmailCount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IssueActions.incrementEmailCount),
      mergeMap(({ issueId }) =>
        this.mockDataService.incrementEmailCount(issueId).pipe(
          map(() => IssueActions.incrementEmailCountSuccess({ issueId })),
          catchError(error => of(IssueActions.incrementEmailCountFailure({ error: error.message })))
        )
      )
    )
  );
}