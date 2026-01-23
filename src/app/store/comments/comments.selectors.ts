import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CommentsState, commentsAdapter } from './comments.state';
import { CommentNode, CommentResponse } from '../../types/civica-api.types';

export const selectCommentsState = createFeatureSelector<CommentsState>('comments');

export const {
  selectIds,
  selectEntities,
  selectAll: selectAllComments,
  selectTotal
} = commentsAdapter.getSelectors(selectCommentsState);

export const selectCommentsLoading = createSelector(
  selectCommentsState,
  (state) => state.loading
);

export const selectCommentsSubmitting = createSelector(
  selectCommentsState,
  (state) => state.submitting
);

export const selectCommentsError = createSelector(
  selectCommentsState,
  (state) => state.error
);

export const selectCommentsTotalCount = createSelector(
  selectCommentsState,
  (state) => state.totalCount
);

export const selectCurrentIssueId = createSelector(
  selectCommentsState,
  (state) => state.currentIssueId
);

export const selectEditingCommentId = createSelector(
  selectCommentsState,
  (state) => state.editingCommentId
);

export const selectReplyingToCommentId = createSelector(
  selectCommentsState,
  (state) => state.replyingToCommentId
);

export const selectSortBy = createSelector(
  selectCommentsState,
  (state) => state.sortBy
);

export const selectSortDescending = createSelector(
  selectCommentsState,
  (state) => state.sortDescending
);

/**
 * Build comment tree from flat list
 * Returns nested CommentNode[] for recursive rendering
 */
export const selectCommentTree = createSelector(
  selectAllComments,
  selectSortBy,
  selectSortDescending,
  (comments, sortBy, sortDescending): CommentNode[] => {
    const map = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    // First pass: create nodes with empty children
    comments.forEach(c => {
      map.set(c.id, { ...c, children: [], depth: 0 });
    });

    // Second pass: build tree
    comments.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentCommentId && map.has(c.parentCommentId)) {
        const parent = map.get(c.parentCommentId)!;
        node.depth = parent.depth + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort function based on sortBy
    const sortFn = (a: CommentNode, b: CommentNode): number => {
      if (sortBy === 'helpful') {
        const diff = sortDescending
          ? b.helpfulCount - a.helpfulCount
          : a.helpfulCount - b.helpfulCount;
        // Secondary sort by date if helpful counts are equal
        if (diff === 0) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return diff;
      }
      // Default: sort by date
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDescending ? dateB - dateA : dateA - dateB;
    };

    // Sort roots
    roots.sort(sortFn);

    // Sort children recursively (always by date ascending for replies)
    const sortChildren = (nodes: CommentNode[]) => {
      nodes.forEach(n => {
        n.children.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        sortChildren(n.children);
      });
    };
    sortChildren(roots);

    return roots;
  }
);

export const selectTopLevelCommentsCount = createSelector(
  selectCommentTree,
  (tree) => tree.length
);
