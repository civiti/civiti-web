import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { issueReducer } from './issues/issue.reducer';
import { locationReducer } from './location/location.reducer';
import { uiReducer } from './ui/ui.reducer';
import { authReducer } from './auth/auth.reducer';
import { userReducer } from './user/user.reducer';
import { userIssuesReducer } from './user-issues/user-issues.reducer';

export const reducers: ActionReducerMap<AppState> = {
  issues: issueReducer,
  location: locationReducer,
  ui: uiReducer,
  auth: authReducer,
  user: userReducer,
  userIssues: userIssuesReducer
};