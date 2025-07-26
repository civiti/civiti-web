import { createReducer, on } from '@ngrx/store';
import { initialIssueState, issueAdapter } from './issue.state';
import * as IssueActions from './issue.actions';

export const issueReducer = createReducer(
  initialIssueState,
  
  // Load Issues
  on(IssueActions.loadIssues, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(IssueActions.loadIssuesSuccess, (state, { issues }) => 
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
  
  on(IssueActions.loadIssueSuccess, (state, { issue }) => 
    issueAdapter.upsertOne(issue, {
      ...state,
      loading: false,
      error: null
    })
  ),
  
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
  
  // Increment Email Count
  on(IssueActions.incrementEmailCountSuccess, (state, { issueId }) => {
    const issue = state.entities[issueId];
    if (!issue) return state;
    
    return issueAdapter.updateOne({
      id: issueId,
      changes: { emailsSent: issue.emailsSent + 1 }
    }, state);
  })
);