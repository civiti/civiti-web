import { createAction, props } from '@ngrx/store';
import { IssueItem, IssueQueryParams, IssueStatus } from '../../types/civica-api.types';
import { UserIssuesStatusFilter } from './user-issues.state';

// ============================================
// Load User Issues
// ============================================

export const loadUserIssues = createAction(
  '[User Issues] Load User Issues',
  props<{ params?: IssueQueryParams }>()
);

export const loadUserIssuesSuccess = createAction(
  '[User Issues] Load User Issues Success',
  props<{ issues: IssueItem[]; totalCount: number }>()
);

export const loadUserIssuesFailure = createAction(
  '[User Issues] Load User Issues Failure',
  props<{ error: string }>()
);

// ============================================
// Mark Issue As Solved
// ============================================

export const markIssueAsSolved = createAction(
  '[User Issues] Mark Issue As Solved',
  /**
   * resolutionPhotoUrls carries the optional "after" photos the owner attached in the resolve
   * modal — already uploaded to storage by then, so these are public URLs, not files. Optional
   * because resolving without proof is the plain case and the my-issues card offers no picker.
   */
  props<{ issueId: string; resolutionPhotoUrls?: string[] }>()
);

export const markIssueAsSolvedSuccess = createAction(
  '[User Issues] Mark Issue As Solved Success',
  props<{ issueId: string }>()
);

export const markIssueAsSolvedFailure = createAction(
  '[User Issues] Mark Issue As Solved Failure',
  props<{ issueId: string; error: string }>()
);

// ============================================
// Reopen Issue
// ============================================

export const reopenIssue = createAction(
  '[User Issues] Reopen Issue',
  props<{ issueId: string }>()
);

export const reopenIssueSuccess = createAction(
  '[User Issues] Reopen Issue Success',
  props<{ issueId: string }>()
);

export const reopenIssueFailure = createAction(
  '[User Issues] Reopen Issue Failure',
  props<{ issueId: string; error: string }>()
);

// ============================================
// Cancel Issue
// ============================================

export const cancelIssue = createAction(
  '[User Issues] Cancel Issue',
  props<{ issueId: string }>()
);

export const cancelIssueSuccess = createAction(
  '[User Issues] Cancel Issue Success',
  props<{ issueId: string }>()
);

export const cancelIssueFailure = createAction(
  '[User Issues] Cancel Issue Failure',
  props<{ error: string }>()
);

// ============================================
// Filter & UI Actions
// ============================================

export const setStatusFilter = createAction(
  '[User Issues] Set Status Filter',
  props<{ filter: UserIssuesStatusFilter }>()
);

export const clearUserIssues = createAction(
  '[User Issues] Clear User Issues'
);

// ============================================
// Refresh after issue creation
// ============================================

export const refreshUserIssues = createAction(
  '[User Issues] Refresh User Issues'
);
