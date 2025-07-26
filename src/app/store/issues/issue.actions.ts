import { createAction, props } from '@ngrx/store';
import { Issue } from '../../services/mock-data.service';

// Load Issues
export const loadIssues = createAction('[Issues] Load Issues');

export const loadIssuesSuccess = createAction(
  '[Issues] Load Issues Success',
  props<{ issues: Issue[] }>()
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
  props<{ issue: Issue }>()
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
  props<{ sortBy: 'date' | 'emails' | 'urgency' }>()
);

// Increment Email Count
export const incrementEmailCount = createAction(
  '[Issue Detail] Increment Email Count',
  props<{ issueId: string }>()
);

export const incrementEmailCountSuccess = createAction(
  '[Issue Detail] Increment Email Count Success',
  props<{ issueId: string }>()
);

export const incrementEmailCountFailure = createAction(
  '[Issue Detail] Increment Email Count Failure',
  props<{ error: string }>()
);