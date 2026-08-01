import { createReducer, on } from '@ngrx/store';
import { IssueState, initialIssueState, issueAdapter } from './issue.state';
import * as IssueActions from './issue.actions';
import * as UserIssuesActions from '../user-issues/user-issues.actions';
import { IssueStatus, isPubliclyViewableStatus } from '../../types/civica-api.types';

/**
 * Applies a status change to both the public list entity and the selected detail, whichever
 * of them is currently holding this issue. Mirrors the shape used by the vote and email-count
 * updates below.
 */
function patchIssueStatus(state: IssueState, issueId: string, status: IssueStatus): IssueState {
  let newState = state;

  if (state.entities[issueId]) {
    newState = issueAdapter.updateOne({ id: issueId, changes: { status } }, newState);
  }

  if (state.selectedIssueDetail && state.selectedIssueDetail.id === issueId) {
    newState = {
      ...newState,
      selectedIssueDetail: { ...state.selectedIssueDetail, status }
    };
  }

  return newState;
}

export const issueReducer = createReducer(
  initialIssueState,
  
  // Load Issues
  on(IssueActions.loadIssues, (state, { params }) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(IssueActions.loadIssuesSuccess, (state, { issues, totalItems, page, pageSize, totalPages }) =>
    issueAdapter.setAll(issues, {
      ...state,
      loading: false,
      error: null,
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages
    })
  ),
  
  on(IssueActions.loadIssuesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Single Issue
  on(IssueActions.loadIssue, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(IssueActions.loadIssueSuccess, (state, { issue }) => ({
    ...state,
    selectedIssueDetail: issue,
    selectedIssueId: issue.id,
    loading: false,
    error: null
  })),
  
  on(IssueActions.loadIssueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Select Issue
  on(IssueActions.selectIssue, (state, { id }) => ({
    ...state,
    selectedIssueId: id
  })),
  
  // Change Sort - reset to page 1
  on(IssueActions.changeSortBy, (state, { sortBy }) => ({
    ...state,
    sortBy,
    currentPage: 1
  })),
  
  // Track Email Sent
  on(IssueActions.trackEmailSentSuccess, (state, { issueId, newTotalEmails }) => {
    // Skip store update if backend didn't return the new count (empty response).
    // The loadIssue refresh will provide the actual value.
    if (!newTotalEmails) return state;

    const issue = state.entities[issueId];
    let newState = state;

    // Update the list item if it exists
    if (issue) {
      newState = issueAdapter.updateOne({
        id: issueId,
        changes: { emailsSent: newTotalEmails }
      }, state);
    }

    // Also update the detailed issue if it's the selected one
    if (state.selectedIssueDetail && state.selectedIssueDetail.id === issueId) {
      newState = {
        ...newState,
        selectedIssueDetail: {
          ...state.selectedIssueDetail,
          emailsSent: newTotalEmails
        }
      };
    }

    return newState;
  }),
  
  // Create Issue
  on(IssueActions.createIssue, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(IssueActions.createIssueSuccess, (state) => ({
    ...state,
    loading: false,
    error: null
  })),
  
  on(IssueActions.createIssueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Vote for Issue Success - idempotent update
  on(IssueActions.voteForIssueSuccess, (state, { issueId }) => {
    let newState = state;

    // Update the list item if it exists (idempotent check)
    const issue = state.entities[issueId];
    if (issue && !issue.hasVoted) {
      newState = issueAdapter.updateOne({
        id: issueId,
        changes: {
          communityVotes: issue.communityVotes + 1,
          hasVoted: true
        }
      }, newState);
    }

    // Also update the detailed issue if it's the selected one (idempotent check)
    if (state.selectedIssueDetail && state.selectedIssueDetail.id === issueId && !state.selectedIssueDetail.hasVoted) {
      newState = {
        ...newState,
        selectedIssueDetail: {
          ...state.selectedIssueDetail,
          communityVotes: state.selectedIssueDetail.communityVotes + 1,
          hasVoted: true
        }
      };
    }

    return newState;
  }),

  // Remove Vote from Issue Success - idempotent update
  on(IssueActions.removeVoteFromIssueSuccess, (state, { issueId }) => {
    let newState = state;

    // Update the list item if it exists (idempotent check)
    const issue = state.entities[issueId];
    if (issue && issue.hasVoted) {
      newState = issueAdapter.updateOne({
        id: issueId,
        changes: {
          communityVotes: Math.max(0, issue.communityVotes - 1),
          hasVoted: false
        }
      }, newState);
    }

    // Also update the detailed issue if it's the selected one (idempotent check)
    if (state.selectedIssueDetail && state.selectedIssueDetail.id === issueId && state.selectedIssueDetail.hasVoted) {
      newState = {
        ...newState,
        selectedIssueDetail: {
          ...state.selectedIssueDetail,
          communityVotes: Math.max(0, state.selectedIssueDetail.communityVotes - 1),
          hasVoted: false
        }
      };
    }

    return newState;
  }),

  // Sync Vote State - only updates hasVoted without modifying count (for conflict resolution)
  on(IssueActions.syncVoteState, (state, { issueId, hasVoted }) => {
    let newState = state;

    // Update the list item if it exists
    const issue = state.entities[issueId];
    if (issue && issue.hasVoted !== hasVoted) {
      newState = issueAdapter.updateOne({
        id: issueId,
        changes: { hasVoted }
      }, newState);
    }

    // Also update the detailed issue if it's the selected one
    if (state.selectedIssueDetail && state.selectedIssueDetail.id === issueId && state.selectedIssueDetail.hasVoted !== hasVoted) {
      newState = {
        ...newState,
        selectedIssueDetail: {
          ...state.selectedIssueDetail,
          hasVoted
        }
      };
    }

    return newState;
  }),

  // Issue Edited (owner resubmit) - reconcile the public list + selected detail
  on(IssueActions.issueEdited, (state, { issue }) => {
    let newState = state;

    // An owner edit sends the issue back to moderation (Submitted/UnderReview), which is not
    // publicly viewable. Drop it from the public list slice if it was there (e.g. an edited
    // Active issue) so it doesn't linger as a stale "Activ" card until the next refetch.
    if (state.entities[issue.id] && !isPubliclyViewableStatus(issue.status)) {
      newState = issueAdapter.removeOne(issue.id, newState);
    }

    // Keep the selected detail in sync with the server's returned version.
    if (state.selectedIssueDetail && state.selectedIssueDetail.id === issue.id) {
      newState = {
        ...newState,
        selectedIssueDetail: issue
      };
    }

    return newState;
  }),

  // Owner status changes are dispatched from the userIssues slice, but they are now triggered
  // from the issue detail page too — where the status on screen comes from this slice. Without
  // these, marking an issue solved at /issue/:id would leave the page showing "ACTIVĂ" until a
  // refetch. Both Active and Resolved are publicly viewable, so the list membership is unchanged.
  on(UserIssuesActions.markIssueAsSolvedSuccess, (state, { issueId }) =>
    patchIssueStatus(state, issueId, 'Resolved')
  ),

  on(UserIssuesActions.reopenIssueSuccess, (state, { issueId }) =>
    patchIssueStatus(state, issueId, 'Active')
  )
);