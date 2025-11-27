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
  
  on(IssueActions.loadIssuesSuccess, (state, { issues, totalCount }) => 
    issueAdapter.setAll(issues, {
      ...state,
      loading: false,
      error: null
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
  
  // Change Sort
  on(IssueActions.changeSortBy, (state, { sortBy }) => ({
    ...state,
    sortBy
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
  }))
);