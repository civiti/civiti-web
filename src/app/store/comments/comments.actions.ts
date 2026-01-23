import { createAction, props } from '@ngrx/store';
import { CommentResponse, CommentQueryParams } from '../../types/civica-api.types';

// Load Comments
export const loadComments = createAction(
  '[Comments] Load Comments',
  props<{ issueId: string; params?: CommentQueryParams }>()
);

export const loadCommentsSuccess = createAction(
  '[Comments] Load Comments Success',
  props<{ comments: CommentResponse[]; totalCount: number }>()
);

export const loadCommentsFailure = createAction(
  '[Comments] Load Comments Failure',
  props<{ error: string }>()
);

// Create Comment (top-level or reply)
export const createComment = createAction(
  '[Comments] Create Comment',
  props<{ issueId: string; content: string; parentCommentId?: string | null }>()
);

export const createCommentSuccess = createAction(
  '[Comments] Create Comment Success',
  props<{ comment: CommentResponse }>()
);

export const createCommentFailure = createAction(
  '[Comments] Create Comment Failure',
  props<{ error: string }>()
);

// Update Comment
export const updateComment = createAction(
  '[Comments] Update Comment',
  props<{ commentId: string; content: string }>()
);

export const updateCommentSuccess = createAction(
  '[Comments] Update Comment Success',
  props<{ commentId: string; content: string; updatedAt: string }>()
);

export const updateCommentFailure = createAction(
  '[Comments] Update Comment Failure',
  props<{ error: string }>()
);

// Delete Comment
export const deleteComment = createAction(
  '[Comments] Delete Comment',
  props<{ commentId: string }>()
);

export const deleteCommentSuccess = createAction(
  '[Comments] Delete Comment Success',
  props<{ commentId: string }>()
);

export const deleteCommentFailure = createAction(
  '[Comments] Delete Comment Failure',
  props<{ error: string }>()
);

// Vote Helpful
export const voteHelpful = createAction(
  '[Comments] Vote Helpful',
  props<{ commentId: string }>()
);

export const voteHelpfulSuccess = createAction(
  '[Comments] Vote Helpful Success',
  props<{ commentId: string }>()
);

export const voteHelpfulFailure = createAction(
  '[Comments] Vote Helpful Failure',
  props<{ error: string }>()
);

// Remove Vote
export const removeVote = createAction(
  '[Comments] Remove Vote',
  props<{ commentId: string }>()
);

export const removeVoteSuccess = createAction(
  '[Comments] Remove Vote Success',
  props<{ commentId: string }>()
);

export const removeVoteFailure = createAction(
  '[Comments] Remove Vote Failure',
  props<{ error: string }>()
);

// UI State
export const setEditingComment = createAction(
  '[Comments] Set Editing Comment',
  props<{ commentId: string | null }>()
);

export const setReplyingToComment = createAction(
  '[Comments] Set Replying To Comment',
  props<{ commentId: string | null }>()
);

export const setSortBy = createAction(
  '[Comments] Set Sort By',
  props<{ sortBy: 'date' | 'helpful'; sortDescending: boolean }>()
);

export const clearComments = createAction('[Comments] Clear Comments');
