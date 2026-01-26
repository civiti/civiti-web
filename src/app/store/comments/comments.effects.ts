import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, concatMap, tap, withLatestFrom } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '../../services/api.service';
import * as CommentsActions from './comments.actions';
import { selectCurrentIssueId } from './comments.selectors';

// Maps backend error messages to user-friendly Romanian messages
const CREATE_COMMENT_ERROR_MAP: Record<string, string> = {
  'Content violates community guidelines': 'Comentariul tău conține conținut nepotrivit și nu poate fi postat.',
  'Comment content cannot be empty or whitespace only': 'Te rugăm să introduci un comentariu.',
  'User not found': 'Te rugăm să îți completezi mai întâi profilul.',
  'Cannot comment on non-active issues': 'Comentariile sunt dezactivate pentru această problemă.',
  'Parent comment belongs to a different issue': 'Nu se poate răspunde la acest comentariu.',
  'Issue not found': 'Problema nu a fost găsită.',
  'Parent comment not found': 'Comentariul la care încerci să răspunzi nu mai există.',
  'You have already posted this comment': 'Ai postat deja acest comentariu.',
  'Please wait before posting another comment': 'Te rugăm să aștepți puțin înainte de a posta din nou.',
};

const UPDATE_COMMENT_ERROR_MAP: Record<string, string> = {
  'Content violates community guidelines': 'Editarea conține conținut nepotrivit.',
  'Comment content cannot be empty or whitespace only': 'Te rugăm să introduci un comentariu.',
  'Comment not found': 'Comentariul nu a fost găsit.',
};

const VOTE_ERROR_MAP: Record<string, string> = {
  'You cannot vote on your own comment': 'Nu poți vota propriul comentariu.',
  'Comment not found': 'Comentariul nu a fost găsit.',
};

function mapCreateCommentError(error: HttpErrorResponse): string {
  // Check for 403 Forbidden (user trying to do something unauthorized)
  if (error.status === 403) {
    return 'Nu ai permisiunea să efectuezi această acțiune.';
  }

  const backendMessage = error.error?.message || error.error?.error || error.message || '';
  return CREATE_COMMENT_ERROR_MAP[backendMessage] || 'Eroare la adăugarea comentariului.';
}

function mapUpdateCommentError(error: HttpErrorResponse): string {
  // 403 Forbidden means user is not the author
  if (error.status === 403) {
    return 'Poți edita doar propriile comentarii.';
  }

  const backendMessage = error.error?.message || error.error?.error || error.message || '';
  return UPDATE_COMMENT_ERROR_MAP[backendMessage] || 'Eroare la actualizarea comentariului.';
}

@Injectable()
export class CommentsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
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
            error: error.error?.message || error.message || 'Eroare la încărcarea comentariilor'
          })))
        )
      )
    )
  );

  // Use concatMap to queue comment actions sequentially
  // - No lost comments (all are queued, unlike exhaustMap which drops actions during in-flight requests)
  // - Critical for issue navigation: user can submit on Issue A, navigate to Issue B, submit there too
  // - Reducer guards already handle stale responses (comments for wrong issueId are discarded)
  createComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.createComment),
      concatMap((action) =>
        this.apiService.createComment(action.issueId, {
          content: action.content,
          parentCommentId: action.parentCommentId
        }).pipe(
          tap(() => this.message.success('Comentariu adăugat cu succes!')),
          map(comment => CommentsActions.createCommentSuccess({ comment })),
          catchError((error: HttpErrorResponse) => of(CommentsActions.createCommentFailure({
            error: mapCreateCommentError(error),
            issueId: action.issueId
          })))
        )
      )
    )
  );

  updateComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.updateComment),
      concatMap((action) =>
        this.apiService.updateComment(action.commentId, { content: action.content }).pipe(
          tap(() => this.message.success('Comentariu actualizat!')),
          map(() => CommentsActions.updateCommentSuccess({
            commentId: action.commentId,
            content: action.content,
            updatedAt: new Date().toISOString()
          })),
          catchError((error: HttpErrorResponse) => of(CommentsActions.updateCommentFailure({
            error: mapUpdateCommentError(error)
          })))
        )
      )
    )
  );

  deleteComment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CommentsActions.deleteComment),
      concatMap((action) =>
        this.apiService.deleteComment(action.commentId).pipe(
          tap(() => this.message.success('Comentariu șters!')),
          map(() => CommentsActions.deleteCommentSuccess({ commentId: action.commentId })),
          catchError(error => of(CommentsActions.deleteCommentFailure({
            error: error.error?.message || error.message || 'Eroare la ștergerea comentariului'
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
            // Check error.error?.message first (API response), then error.error?.error, then error.message (HttpClient generic)
            const errorMsg = error.error?.message || error.error?.error || error.message || '';
            if (errorMsg.toLowerCase().includes('already voted')) {
              return of(CommentsActions.voteHelpfulSuccess({ commentId: action.commentId }));
            }
            const userMessage = VOTE_ERROR_MAP[errorMsg] || errorMsg || 'Eroare la votare';
            return of(CommentsActions.voteHelpfulFailure({ error: userMessage }));
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
            // Check error.error?.message first (API response), then error.error?.error, then error.message (HttpClient generic)
            const errorMsg = error.error?.message || error.error?.error || error.message || '';
            if (errorMsg.toLowerCase().includes('not voted') ||
                errorMsg.toLowerCase().includes('vote not found') ||
                errorMsg.toLowerCase().includes('no vote')) {
              return of(CommentsActions.removeVoteSuccess({ commentId: action.commentId }));
            }
            const userMessage = VOTE_ERROR_MAP[errorMsg] || errorMsg || 'Eroare la anularea votului';
            return of(CommentsActions.removeVoteFailure({ error: userMessage }));
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
      withLatestFrom(this.store.select(selectCurrentIssueId)),
      tap(([action, currentIssueId]) => {
        // For actions with issueId (e.g., createCommentFailure), suppress toast if user navigated away
        if ('issueId' in action && action.issueId !== currentIssueId) {
          return;
        }
        this.message.error(action.error);
      })
    ),
    { dispatch: false }
  );
}
