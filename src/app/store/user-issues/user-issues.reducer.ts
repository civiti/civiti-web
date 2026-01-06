import { createReducer, on } from '@ngrx/store';
import { initialUserIssuesState, userIssuesAdapter } from './user-issues.state';
import * as UserIssuesActions from './user-issues.actions';

export const userIssuesReducer = createReducer(
  initialUserIssuesState,

  // Load User Issues
  on(UserIssuesActions.loadUserIssues, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserIssuesActions.loadUserIssuesSuccess, (state, { issues, totalCount }) =>
    userIssuesAdapter.setAll(issues, {
      ...state,
      loading: false,
      error: null,
      totalCount
    })
  ),

  on(UserIssuesActions.loadUserIssuesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Mark Issue As Solved
  on(UserIssuesActions.markIssueAsSolvedSuccess, (state, { issueId }) =>
    userIssuesAdapter.updateOne({
      id: issueId,
      changes: { status: 'Resolved' }
    }, state)
  ),

  // Cancel Issue - update status to Cancelled
  on(UserIssuesActions.cancelIssueSuccess, (state, { issueId }) =>
    userIssuesAdapter.updateOne({
      id: issueId,
      changes: { status: 'Cancelled' }
    }, state)
  ),

  // Set Status Filter
  on(UserIssuesActions.setStatusFilter, (state, { filter }) => ({
    ...state,
    statusFilter: filter
  })),

  // Clear User Issues (on logout)
  on(UserIssuesActions.clearUserIssues, () => initialUserIssuesState)
);
