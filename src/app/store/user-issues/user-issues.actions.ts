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

/**
 * Correlates one resolve request with its own outcome.
 *
 * The issue id alone cannot: the effect runs these with mergeMap, so nothing stops two resolves
 * for the same issue being in flight, and a caller waiting on `issueId` would act on whichever
 * finished first. That matters only for the resolve, because it is the only one of these
 * actions whose caller decides something irreversible from the outcome — the solve modal closes
 * itself, triggers a refetch, and stops deleting the storage objects it uploaded. Re-open and
 * cancel have no such caller, so they stay keyed on the issue.
 *
 * A counter rather than a UUID: correlation only has to hold within one running app instance,
 * which is exactly the scope of the in-memory action stream, and this needs no crypto and is
 * safe if it is ever reached during server rendering.
 */
let solveRequestSeq = 0;
export const nextSolveRequestId = (): string => `solve-${++solveRequestSeq}`;

export const markIssueAsSolved = createAction(
  '[User Issues] Mark Issue As Solved',
  /**
   * resolutionPhotoUrls carries the optional "after" photos the owner attached in the resolve
   * modal — already uploaded to storage by then, so these are public URLs, not files. Optional
   * because resolving without proof is the plain case and the my-issues card offers no picker.
   *
   * requestId comes from nextSolveRequestId() and is echoed on the outcome; see above.
   */
  props<{ issueId: string; requestId: string; resolutionPhotoUrls?: string[] }>()
);

export const markIssueAsSolvedSuccess = createAction(
  '[User Issues] Mark Issue As Solved Success',
  props<{ issueId: string; requestId: string }>()
);

export const markIssueAsSolvedFailure = createAction(
  '[User Issues] Mark Issue As Solved Failure',
  props<{ issueId: string; requestId: string; error: string }>()
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
