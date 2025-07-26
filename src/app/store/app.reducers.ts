import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { issueReducer } from './issues/issue.reducer';
import { locationReducer } from './location/location.reducer';
import { uiReducer } from './ui/ui.reducer';

export const reducers: ActionReducerMap<AppState> = {
  issues: issueReducer,
  location: locationReducer,
  ui: uiReducer
};