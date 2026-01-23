import { createReducer, on } from '@ngrx/store';
import { initialCommentsState, commentsAdapter } from './comments.state';
import * as CommentsActions from './comments.actions';

export const commentsReducer = createReducer(
  initialCommentsState,

  // Load Comments
  on(CommentsActions.loadComments, (state, { issueId }) => ({
    ...state,
    loading: true,
    error: null,
    currentIssueId: issueId
  })),

  on(CommentsActions.loadCommentsSuccess, (state, { comments, totalCount }) =>
    commentsAdapter.setAll(comments, {
      ...state,
      loading: false,
      error: null,
      totalCount
    })
  ),

  on(CommentsActions.loadCommentsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create Comment
  on(CommentsActions.createComment, (state) => ({
    ...state,
    submitting: true,
    error: null
  })),

  on(CommentsActions.createCommentSuccess, (state, { comment }) => {
    // Ignore stale responses from different issues - only reset submitting state
    if (state.currentIssueId && comment.issueId !== state.currentIssueId) {
      return {
        ...state,
        submitting: false,
        error: null
      };
    }
    // Only increment formResetCounter for top-level comments, not replies
    const isTopLevelComment = !comment.parentCommentId;
    return commentsAdapter.addOne(comment, {
      ...state,
      submitting: false,
      error: null,
      replyingToCommentId: null,
      totalCount: state.totalCount + 1,
      formResetCounter: isTopLevelComment ? state.formResetCounter + 1 : state.formResetCounter
    });
  }),

  on(CommentsActions.createCommentFailure, (state, { error }) => ({
    ...state,
    submitting: false,
    error
  })),

  // Update Comment
  on(CommentsActions.updateComment, (state) => ({
    ...state,
    submitting: true,
    error: null
  })),

  on(CommentsActions.updateCommentSuccess, (state, { commentId, content, updatedAt }) =>
    commentsAdapter.updateOne(
      {
        id: commentId,
        changes: { content, updatedAt, isEdited: true }
      },
      {
        ...state,
        submitting: false,
        error: null,
        editingCommentId: null
      }
    )
  ),

  on(CommentsActions.updateCommentFailure, (state, { error }) => ({
    ...state,
    submitting: false,
    error
  })),

  // Delete Comment
  on(CommentsActions.deleteComment, (state) => ({
    ...state,
    submitting: true,
    error: null
  })),

  on(CommentsActions.deleteCommentSuccess, (state, { commentId }) =>
    commentsAdapter.updateOne(
      {
        id: commentId,
        changes: { isDeleted: true, content: '' }
      },
      {
        ...state,
        submitting: false,
        error: null
      }
    )
  ),

  on(CommentsActions.deleteCommentFailure, (state, { error }) => ({
    ...state,
    submitting: false,
    error
  })),

  // Vote Helpful
  on(CommentsActions.voteHelpfulSuccess, (state, { commentId }) => {
    const comment = state.entities[commentId];
    if (!comment) return state;

    return commentsAdapter.updateOne(
      {
        id: commentId,
        changes: {
          hasVoted: true,
          helpfulCount: comment.helpfulCount + 1
        }
      },
      state
    );
  }),

  // Remove Vote
  on(CommentsActions.removeVoteSuccess, (state, { commentId }) => {
    const comment = state.entities[commentId];
    if (!comment) return state;

    return commentsAdapter.updateOne(
      {
        id: commentId,
        changes: {
          hasVoted: false,
          helpfulCount: Math.max(0, comment.helpfulCount - 1)
        }
      },
      state
    );
  }),

  // UI State
  on(CommentsActions.setEditingComment, (state, { commentId }) => ({
    ...state,
    editingCommentId: commentId,
    replyingToCommentId: null // Clear reply when editing
  })),

  on(CommentsActions.setReplyingToComment, (state, { commentId }) => ({
    ...state,
    replyingToCommentId: commentId,
    editingCommentId: null // Clear edit when replying
  })),

  on(CommentsActions.setSortBy, (state, { sortBy, sortDescending }) => ({
    ...state,
    sortBy,
    sortDescending
  })),

  on(CommentsActions.clearComments, () => initialCommentsState)
);
