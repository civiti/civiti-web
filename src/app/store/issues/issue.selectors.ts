import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IssueState, issueAdapter } from './issue.state';
import { Issue } from '../../services/mock-data.service';

export const selectIssueState = createFeatureSelector<IssueState>('issues');

// Entity selectors
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = issueAdapter.getSelectors(selectIssueState);

// Custom selectors
export const selectIssuesLoading = createSelector(
  selectIssueState,
  (state: IssueState) => state.loading
);

export const selectIssuesError = createSelector(
  selectIssueState,
  (state: IssueState) => state.error
);

export const selectSortBy = createSelector(
  selectIssueState,
  (state: IssueState) => state.sortBy
);

export const selectSelectedIssueId = createSelector(
  selectIssueState,
  (state: IssueState) => state.selectedIssueId
);

export const selectSelectedIssue = createSelector(
  selectEntities,
  selectSelectedIssueId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

// Sorted issues selector
export const selectSortedIssues = createSelector(
  selectAll,
  selectSortBy,
  (issues: Issue[], sortBy: string) => {
    const sortedIssues = [...issues];
    
    switch (sortBy) {
      case 'emails':
        return sortedIssues.sort((a, b) => b.emailsSent - a.emailsSent);
      
      case 'urgency':
        return sortedIssues.sort((a, b) => {
          const urgencyA = getUrgencyScore(a);
          const urgencyB = getUrgencyScore(b);
          return urgencyB - urgencyA;
        });
      
      default: // 'date'
        return sortedIssues.sort((a, b) => 
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        );
    }
  }
);

// Helper function for urgency calculation
function getUrgencyScore(issue: Issue): number {
  const daysSince = Math.ceil(
    Math.abs(new Date().getTime() - new Date(issue.dateCreated).getTime()) / (1000 * 60 * 60 * 24)
  );
  const emailRatio = issue.emailsSent / 100;
  return emailRatio + (daysSince / 10);
}