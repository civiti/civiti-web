import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, exhaustMap, concatMap, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '../../services/api.service';
import * as CommentsActions from './comments.actions';

@Injectable()
export class CommentsEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);
  private message = inject(NzMessageService);

  loadComments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.loadComments),
      switchMap((action) =>
        this.apiService.getIssueComments(action.issueId, action.params).pipe(
          map(response => CommentsActions.loadCommentsSuccess({
            comments: response.items,
            totalCount: response.totalItems
          })),
          catchError(error => of(CommentsActions.loadCommentsFailure({
            error: error.message || 'Eroare la încărcarea comentariilor'
          })))
        )
      )
    )
  );

  createComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.createComment),
      exhaustMap((action) =>
        this.apiService.createComment(action.issueId, {
          content: action.content,
          parentCommentId: action.parentCommentId
        }).pipe(
          tap(() => this.message.success('Comentariu adăugat cu succes!')),
          map(comment => CommentsActions.createCommentSuccess({ comment })),
          catchError(error => of(CommentsActions.createCommentFailure({
            error: error.message || 'Eroare la adăugarea comentariului'
          })))
        )
      )
    )
  );

  updateComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.updateComment),
      exhaustMap((action) =>
        this.apiService.updateComment(action.commentId, { content: action.content }).pipe(
          tap(() => this.message.success('Comentariu actualizat!')),
          map(() => CommentsActions.updateCommentSuccess({
            commentId: action.commentId,
            content: action.content,
            updatedAt: new Date().toISOString()
          })),
          catchError(error => of(CommentsActions.updateCommentFailure({
            error: error.message || 'Eroare la actualizarea comentariului'
          })))
        )
      )
    )
  );

  deleteComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.deleteComment),
      exhaustMap((action) =>
        this.apiService.deleteComment(action.commentId).pipe(
          tap(() => this.message.success('Comentariu șters!')),
          map(() => CommentsActions.deleteCommentSuccess({ commentId: action.commentId })),
          catchError(error => of(CommentsActions.deleteCommentFailure({
            error: error.message || 'Eroare la ștergerea comentariului'
          })))
        )
      )
    )
  );

  // Use concatMap to queue vote actions sequentially
  // - No lost votes (all are queued, unlike exhaustMap)
  // - No memory leak (unlike groupBy)
  // - Slight serialization is acceptable since vote API calls are fast
  // - "Already voted" errors are treated as success (intended state achieved)
  voteHelpful$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.voteHelpful),
      concatMap((action) =>
        this.apiService.voteCommentHelpful(action.commentId).pipe(
          map(() => CommentsActions.voteHelpfulSuccess({ commentId: action.commentId })),
          catchError(error => {
            // Treat "already voted" as success - the intended state was achieved
            // Check error.error?.message first (API response), then error.message (HttpClient generic)
            const errorMsg = error.error?.message || error.message || '';
            if (errorMsg.toLowerCase().includes('already voted')) {
              return of(CommentsActions.voteHelpfulSuccess({ commentId: action.commentId }));
            }
            return of(CommentsActions.voteHelpfulFailure({
              error: errorMsg || 'Eroare la votare'
            }));
          })
        )
      )
    )
  );

  removeVote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.removeVote),
      concatMap((action) =>
        this.apiService.removeCommentVote(action.commentId).pipe(
          map(() => CommentsActions.removeVoteSuccess({ commentId: action.commentId })),
          catchError(error => {
            // Treat "not voted" / "vote not found" as success - the intended state was achieved
            // Check error.error?.message first (API response), then error.message (HttpClient generic)
            const errorMsg = error.error?.message || error.message || '';
            if (errorMsg.toLowerCase().includes('not voted') ||
                errorMsg.toLowerCase().includes('vote not found') ||
                errorMsg.toLowerCase().includes('no vote')) {
              return of(CommentsActions.removeVoteSuccess({ commentId: action.commentId }));
            }
            return of(CommentsActions.removeVoteFailure({
              error: errorMsg || 'Eroare la anularea votului'
            }));
          })
        )
      )
    )
  );

  showError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CommentsActions.loadCommentsFailure,
        CommentsActions.createCommentFailure,
        CommentsActions.updateCommentFailure,
        CommentsActions.deleteCommentFailure,
        CommentsActions.voteHelpfulFailure,
        CommentsActions.removeVoteFailure
      ),
      tap((action) => this.message.error(action.error))
    ),
    { dispatch: false }
  );
}
