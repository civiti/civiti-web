import { createReducer, on } from '@ngrx/store';
import { initialIssueState, issueAdapter } from './issue.state';
import * as IssueActions from './issue.actions';

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
  })
);