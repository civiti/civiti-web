import { IssueState } from './issues/issue.state';
import { LocationState } from './location/location.state';
import { UIState } from './ui/ui.state';

export interface AppState {
  issues: IssueState;
  location: LocationState;
  ui: UIState;
}