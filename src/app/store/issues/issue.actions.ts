import { createAction, props } from '@ngrx/store';
import { IssueItem, IssueDetailResponse, CreateIssueRequest, CreateIssueResponse, IssueQueryParams } from '../../types/civica-api.types';

// Load Issues
export const loadIssues = createAction(
  '[Issues] Load Issues',
  props<{ params?: IssueQueryParams }>()
);

export const loadIssuesSuccess = createAction(
  '[Issues] Load Issues Success',
  props<{
    issues: IssueItem[];
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>()
);

export const loadIssuesFailure = createAction(
  '[Issues] Load Issues Failure',
  props<{ error: string }>()
);

// Load Single Issue
export const loadIssue = createAction(
  '[Issue Detail] Load Issue',
  props<{ id: string }>()
);

export const loadIssueSuccess = createAction(
  '[Issue Detail] Load Issue Success',
  props<{ issue: IssueDetailResponse }>()
);

export const loadIssueFailure = createAction(
  '[Issue Detail] Load Issue Failure',
  props<{ error: string }>()
);

// Select Issue
export const selectIssue = createAction(
  '[Issues] Select Issue',
  props<{ id: string }>()
);

// Change Sort
export const changeSortBy = createAction(
  '[Issues] Change Sort By',
  props<{ sortBy: 'date' | 'emails' | 'urgency' | 'votes' }>()
);

// Track Email Sent
export const trackEmailSent = createAction(
  '[Issue Detail] Track Email Sent',
  props<{ issueId: string, targetAuthority: string }>()
);

export const trackEmailSentSuccess = createAction(
  '[Issue Detail] Track Email Sent Success',
  props<{ issueId: string, pointsEarned: number, newTotalEmails: number }>()
);

export const trackEmailSentFailure = createAction(
  '[Issue Detail] Track Email Sent Failure',
  props<{ error: string }>()
);

// Create Issue
export const createIssue = createAction(
  '[Issue Creation] Create Issue',
  props<{ issue: CreateIssueRequest }>()
);

export const createIssueSuccess = createAction(
  '[Issue Creation] Create Issue Success',
  props<{ response: CreateIssueResponse }>()
);

export const createIssueFailure = createAction(
  '[Issue Creation] Create Issue Failure',
  props<{ error: string }>()
);

// Vote for Issue
export const voteForIssue = createAction(
  '[Issue Detail] Vote For Issue',
  props<{ issueId: string }>()
);

export const voteForIssueSuccess = createAction(
  '[Issue Detail] Vote For Issue Success',
  props<{ issueId: string }>()
);

export const voteForIssueFailure = createAction(
  '[Issue Detail] Vote For Issue Failure',
  props<{ issueId: string; error: string }>()
);

// Remove Vote from Issue
export const removeVoteFromIssue = createAction(
  '[Issue Detail] Remove Vote From Issue',
  props<{ issueId: string }>()
);

export const removeVoteFromIssueSuccess = createAction(
  '[Issue Detail] Remove Vote From Issue Success',
  props<{ issueId: string }>()
);

export const removeVoteFromIssueFailure = createAction(
  '[Issue Detail] Remove Vote From Issue Failure',
  props<{ issueId: string; error: string }>()
);

// Sync Vote State (for conflict resolution - only updates hasVoted without modifying count)
export const syncVoteState = createAction(
  '[Issue Detail] Sync Vote State',
  props<{ issueId: string; hasVoted: boolean }>()
);