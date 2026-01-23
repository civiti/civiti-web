import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map, take } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
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
    NzCardModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzSelectModule,
    NzAlertModule,
    CommentFormComponent,
    CommentItemComponent
  ],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class CommentsComponent implements OnInit, OnDestroy {
  @Input() issueId!: string;
  @Input() issueStatus = '';

  private store = inject(Store<AppState>);
  private destroy$ = new Subject<void>();

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

  sortValue = 'date-desc';

  get canComment(): boolean {
    // Only allow comments on Active issues
    const status = (this.issueStatus || '').toLowerCase();
    return status === 'active';
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

    this.currentUserId$ = this.store.select(selectAuthUser).pipe(
      map(user => user?.id || null)
    );
    this.isAdmin$ = this.store.select(selectIsAdmin);
    this.isAuthenticated$ = this.store.select(selectAuthUser).pipe(
      map(user => !!user)
    );

    // Sync sortValue with store
    combineLatest([this.sortBy$, this.sortDescending$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([sortBy, sortDescending]) => {
      this.sortValue = `${sortBy}-${sortDescending ? 'desc' : 'asc'}`;
    });

    // Load comments
    if (this.issueId) {
      this.store.dispatch(CommentsActions.loadComments({ issueId: this.issueId }));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      issueId: this.issueId,
      content,
      parentCommentId: null
    }));
  }

  onReply(content: string, parentCommentId: string): void {
    this.store.dispatch(CommentsActions.createComment({
      issueId: this.issueId,
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
