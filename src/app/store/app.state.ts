import { IssueState } from './issues/issue.state';
import { LocationState } from './location/location.state';
import { UIState } from './ui/ui.state';
import { AuthState } from './auth/auth.state';
import { UserState } from './user/user.state';
import { UserIssuesState } from './user-issues/user-issues.state';
import { ActivityState } from './activity/activity.state';
import { CommentsState } from './comments/comments.state';

export interface AppState {
  issues: IssueState;
  location: LocationState;
  ui: UIState;
  auth: AuthState;
  user: UserState;
  userIssues: UserIssuesState;
  activity: ActivityState;
  comments: CommentsState;
}