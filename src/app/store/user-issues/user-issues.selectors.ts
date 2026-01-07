import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserIssuesState, userIssuesAdapter, UserIssuesStatusFilter } from './user-issues.state';
import { IssueItem, IssueStatus, ACTIVE_ISSUE_STATUSES } from '../../types/civica-api.types';

export const selectUserIssuesState = createFeatureSelector<UserIssuesState>('userIssues');

// Entity adapter selectors
export const {
  selectIds,
  selectEntities,
  selectAll: selectAllUserIssues,
  selectTotal
} = userIssuesAdapter.getSelectors(selectUserIssuesState);

// Basic state selectors
export const selectUserIssuesLoading = createSelector(
  selectUserIssuesState,
  (state) => state.loading
);

export const selectUserIssuesError = createSelector(
  selectUserIssuesState,
  (state) => state.error
);

export const selectStatusFilter = createSelector(
  selectUserIssuesState,
  (state) => state.statusFilter
);

export const selectTotalCount = createSelector(
  selectUserIssuesState,
  (state) => state.totalCount
);

// Helper: Normalize status to handle case differences from backend
const normalizeStatus = (status: string | null | undefined): IssueStatus => {
  if (!status) return 'Unspecified';

  const statusMap: Record<string, IssueStatus> = {
    'unspecified': 'Unspecified',
    'draft': 'Draft',
    'submitted': 'Submitted',
    'underreview': 'UnderReview',
    'approved': 'Approved',
    'active': 'Active',
    'inprogress': 'Active', // Legacy mapping
    'resolved': 'Resolved',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled'
  };
  return statusMap[status.toLowerCase()] || 'Unspecified';
};

// Helper: Map internal status to display category
const getDisplayCategory = (status: IssueStatus | string): 'active' | 'resolved' | 'rejected' | 'cancelled' | 'hidden' => {
  const normalized = normalizeStatus(status);
  if (ACTIVE_ISSUE_STATUSES.includes(normalized)) return 'active';
  if (normalized === 'Resolved') return 'resolved';
  if (normalized === 'Rejected') return 'rejected';
  if (normalized === 'Cancelled') return 'cancelled';
  return 'hidden'; // Draft, Unspecified
};

// Filter out Draft and Unspecified issues (truly hidden statuses)
export const selectVisibleUserIssues = createSelector(
  selectAllUserIssues,
  (issues) => issues.filter(issue => {
    const normalized = normalizeStatus(issue.status);
    return !['Draft', 'Unspecified'].includes(normalized);
  })
);

// Apply status filter
export const selectFilteredUserIssues = createSelector(
  selectVisibleUserIssues,
  selectStatusFilter,
  (issues, filter): IssueItem[] => {
    if (filter === 'all') return issues;
    return issues.filter(issue => getDisplayCategory(issue.status) === filter);
  }
);

// Count selectors for summary
export const selectActiveIssuesCount = createSelector(
  selectVisibleUserIssues,
  (issues) => issues.filter(issue => getDisplayCategory(issue.status) === 'active').length
);

export const selectResolvedIssuesCount = createSelector(
  selectVisibleUserIssues,
  (issues) => issues.filter(issue => getDisplayCategory(issue.status) === 'resolved').length
);

export const selectRejectedIssuesCount = createSelector(
  selectVisibleUserIssues,
  (issues) => issues.filter(issue => getDisplayCategory(issue.status) === 'rejected').length
);

export const selectCancelledIssuesCount = createSelector(
  selectVisibleUserIssues,
  (issues) => issues.filter(issue => getDisplayCategory(issue.status) === 'cancelled').length
);

// Combined summary for dashboard
export const selectUserIssuesSummary = createSelector(
  selectActiveIssuesCount,
  selectResolvedIssuesCount,
  selectRejectedIssuesCount,
  selectCancelledIssuesCount,
  (active, resolved, rejected, cancelled) => ({
    active,
    resolved,
    rejected,
    cancelled,
    total: active + resolved + rejected + cancelled
  })
);

// Recent issues for dashboard preview (last 3)
export const selectRecentUserIssues = createSelector(
  selectVisibleUserIssues,
  (issues) => issues.slice(0, 3)
);

// Check if user has any issues
export const selectHasUserIssues = createSelector(
  selectVisibleUserIssues,
  (issues) => issues.length > 0
);
