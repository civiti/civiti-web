import { Component, OnInit, OnDestroy, DestroyRef, inject, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { AppState } from '../../../store/app.state';
import * as CommentsActions from '../../../store/comments/comments.actions';
import * as CommentsSelectors from '../../../store/comments/comments.selectors';
import { selectAuthUser, selectIsAdmin } from '../../../store/auth/auth.selectors';
import { CommentNode } from '../../../types/civica-api.types';
import { CommentFormComponent } from './comment-form/comment-form.component';
import { CommentItemComponent } from './comment-item/comment-item.component';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzSpinModule,
    NzSelectModule,
    CommentFormComponent,
    CommentItemComponent
  ],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent implements OnInit, OnDestroy {
  // Input signals (Angular 19+)
  issueId = input.required<string>();
  issueStatus = input<string>('');

  private store = inject(Store<AppState>);
  private _destroyRef = inject(DestroyRef);
  private previousIssueId: string | null = null;

  commentTree$!: Observable<CommentNode[]>;
  loading$!: Observable<boolean>;
  submitting$!: Observable<boolean>;
  error$!: Observable<string | null>;
  totalCount$!: Observable<number>;
  sortBy$!: Observable<'date' | 'helpful'>;
  sortDescending$!: Observable<boolean>;
  editingCommentId$!: Observable<string | null>;
  replyingToCommentId$!: Observable<string | null>;
  currentUserId$!: Observable<string | null>;
  isAdmin$!: Observable<boolean>;
  isAuthenticated$!: Observable<boolean>;
  formResetCounter$!: Observable<number>;

  sortValue = 'date-desc';

  constructor() {
    // React to issueId changes using effect
    effect(() => {
      const currentIssueId = this.issueId();
      if (currentIssueId) {
        // Clear comments when switching to a different issue
        if (this.previousIssueId && this.previousIssueId !== currentIssueId) {
          this.store.dispatch(CommentsActions.clearComments());
        }
        this.store.dispatch(CommentsActions.loadComments({ issueId: currentIssueId }));
        this.previousIssueId = currentIssueId;
      }
    });
  }

  get canComment(): boolean {
    // Only allow comments on Active issues
    const status = (this.issueStatus() || '').toLowerCase();
    return status === 'active';
  }

  get commentDisabledMessage(): string {
    const status = (this.issueStatus() || '').toLowerCase();
    switch (status) {
      case 'draft':
        return 'Problema este în stadiu de ciornă. Comentariile vor fi disponibile după publicare.';
      case 'submitted':
        return 'Problema este în curs de verificare. Comentariile vor fi disponibile după aprobare.';
      case 'underreview':
        return 'Problema este în analiză. Comentariile vor fi disponibile după aprobare.';
      case 'resolved':
        return 'Această problemă a fost rezolvată. Nu se mai acceptă comentarii noi.';
      case 'cancelled':
        return 'Această problemă a fost anulată. Nu se mai acceptă comentarii noi.';
      case 'rejected':
        return 'Această problemă a fost respinsă. Nu se mai acceptă comentarii.';
      default:
        return 'Comentariile nu sunt disponibile pentru această problemă.';
    }
  }

  ngOnInit(): void {
    // Initialize selectors
    this.commentTree$ = this.store.select(CommentsSelectors.selectCommentTree);
    this.loading$ = this.store.select(CommentsSelectors.selectCommentsLoading);
    this.submitting$ = this.store.select(CommentsSelectors.selectCommentsSubmitting);
    this.error$ = this.store.select(CommentsSelectors.selectCommentsError);
    this.totalCount$ = this.store.select(CommentsSelectors.selectCommentsTotalCount);
    this.sortBy$ = this.store.select(CommentsSelectors.selectSortBy);
    this.sortDescending$ = this.store.select(CommentsSelectors.selectSortDescending);
    this.editingCommentId$ = this.store.select(CommentsSelectors.selectEditingCommentId);
    this.replyingToCommentId$ = this.store.select(CommentsSelectors.selectReplyingToCommentId);
    this.formResetCounter$ = this.store.select(CommentsSelectors.selectFormResetCounter);

    this.currentUserId$ = this.store.select(selectAuthUser).pipe(
      map(user => user?.id || null)
    );
    this.isAdmin$ = this.store.select(selectIsAdmin);
    this.isAuthenticated$ = this.store.select(selectAuthUser).pipe(
      map(user => !!user)
    );

    // Sync sortValue with store
    combineLatest([this.sortBy$, this.sortDescending$]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([sortBy, sortDescending]) => {
      this.sortValue = `${sortBy}-${sortDescending ? 'desc' : 'asc'}`;
    });
  }

  ngOnDestroy(): void {
    this.store.dispatch(CommentsActions.clearComments());
  }

  onSortChange(value: string): void {
    const [sortBy, direction] = value.split('-') as ['date' | 'helpful', string];
    this.store.dispatch(CommentsActions.setSortBy({
      sortBy,
      sortDescending: direction === 'desc'
    }));
  }

  onNewComment(content: string): void {
    this.store.dispatch(CommentsActions.createComment({
      issueId: this.issueId(),
      content,
      parentCommentId: null
    }));
  }

  onReply(content: string, parentCommentId: string): void {
    this.store.dispatch(CommentsActions.createComment({
      issueId: this.issueId(),
      content,
      parentCommentId
    }));
  }

  onEdit(event: { commentId: string; content: string }): void {
    this.store.dispatch(CommentsActions.updateComment({
      commentId: event.commentId,
      content: event.content
    }));
  }

  onDelete(commentId: string): void {
    this.store.dispatch(CommentsActions.deleteComment({ commentId }));
  }

  onVote(event: { commentId: string; hasVoted: boolean }): void {
    if (event.hasVoted) {
      this.store.dispatch(CommentsActions.removeVote({ commentId: event.commentId }));
    } else {
      this.store.dispatch(CommentsActions.voteHelpful({ commentId: event.commentId }));
    }
  }

  setEditing(commentId: string | null): void {
    this.store.dispatch(CommentsActions.setEditingComment({ commentId }));
  }

  setReplying(commentId: string | null): void {
    this.store.dispatch(CommentsActions.setReplyingToComment({ commentId }));
  }

  handleReplyFromItem(content: string): void {
    // Get the currently replying-to comment ID from the store
    this.replyingToCommentId$.pipe(
      take(1)
    ).subscribe(parentId => {
      if (parentId) {
        this.onReply(content, parentId);
      }
    });
  }
}
