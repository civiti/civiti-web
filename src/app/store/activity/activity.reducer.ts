import { createReducer, on } from '@ngrx/store';
import { initialActivityState, activityAdapter } from './activity.state';
import * as ActivityActions from './activity.actions';

export const activityReducer = createReducer(
  initialActivityState,

  on(ActivityActions.loadMyActivity, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(ActivityActions.loadMyActivitySuccess, (state, { activities, totalCount }) =>
    activityAdapter.setAll(activities, {
      ...state,
      loading: false,
      error: null,
      totalCount
    })
  ),

  on(ActivityActions.loadMyActivityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  on(ActivityActions.clearActivity, () => initialActivityState)
);
