import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { CommentResponse } from '../../types/civica-api.types';

export interface CommentsState extends EntityState<CommentResponse> {
  loading: boolean;
  submitting: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  sortBy: 'date' | 'helpful';
  sortDescending: boolean;
  currentIssueId: string | null;
  editingCommentId: string | null;
  replyingToCommentId: string | null;
}

export const commentsAdapter: EntityAdapter<CommentResponse> = createEntityAdapter<CommentResponse>({
  selectId: (comment: CommentResponse) => comment.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

export const initialCommentsState: CommentsState = commentsAdapter.getInitialState({
  loading: false,
  submitting: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 50,
  sortBy: 'date',
  sortDescending: true,
  currentIssueId: null,
  editingCommentId: null,
  replyingToCommentId: null
});
