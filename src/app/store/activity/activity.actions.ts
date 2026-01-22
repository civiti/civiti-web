import { createAction, props } from '@ngrx/store';
import { ActivityFeedItem, ActivityQueryParams } from '../../types/civica-api.types';

export const loadMyActivity = createAction(
  '[Activity] Load My Activity',
  props<{ params?: ActivityQueryParams }>()
);

export const loadMyActivitySuccess = createAction(
  '[Activity] Load My Activity Success',
  props<{ activities: ActivityFeedItem[]; totalCount: number }>()
);

export const loadMyActivityFailure = createAction(
  '[Activity] Load My Activity Failure',
  props<{ error: string }>()
);

export const clearActivity = createAction('[Activity] Clear Activity');
