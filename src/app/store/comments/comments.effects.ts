import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, exhaustMap, mergeMap, tap, groupBy } from 'rxjs/operators';
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

  // Use groupBy + exhaustMap to allow concurrent votes on different comments
  // while preventing duplicate votes on the same comment
  voteHelpful$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.voteHelpful),
      groupBy(action => action.commentId),
      mergeMap(group$ =>
        group$.pipe(
          exhaustMap((action) =>
            this.apiService.voteCommentHelpful(action.commentId).pipe(
              map(() => CommentsActions.voteHelpfulSuccess({ commentId: action.commentId })),
              catchError(error => of(CommentsActions.voteHelpfulFailure({
                error: error.message || 'Eroare la votare'
              })))
            )
          )
        )
      )
    )
  );

  removeVote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.removeVote),
      groupBy(action => action.commentId),
      mergeMap(group$ =>
        group$.pipe(
          exhaustMap((action) =>
            this.apiService.removeCommentVote(action.commentId).pipe(
              map(() => CommentsActions.removeVoteSuccess({ commentId: action.commentId })),
              catchError(error => of(CommentsActions.removeVoteFailure({
                error: error.message || 'Eroare la anularea votului'
              })))
            )
          )
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
