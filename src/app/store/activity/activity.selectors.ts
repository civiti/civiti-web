import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ActivityState, activityAdapter } from './activity.state';

export const selectActivityState = createFeatureSelector<ActivityState>('activity');

export const {
  selectIds,
  selectEntities,
  selectAll: selectAllActivities,
  selectTotal
} = activityAdapter.getSelectors(selectActivityState);

export const selectActivityLoading = createSelector(
  selectActivityState,
  (state) => state.loading
);

export const selectActivityError = createSelector(
  selectActivityState,
  (state) => state.error
);

export const selectRecentActivities = createSelector(
  selectAllActivities,
  (activities) => activities.slice(0, 5)
);
