import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Issue } from '../../services/mock-data.service';

export interface IssueState extends EntityState<Issue> {
  selectedIssueId: string | null;
  loading: boolean;
  error: string | null;
  sortBy: 'date' | 'emails' | 'urgency';
}

export const issueAdapter: EntityAdapter<Issue> = createEntityAdapter<Issue>({
  selectId: (issue: Issue) => issue.id,
  sortComparer: false
});

export const initialIssueState: IssueState = issueAdapter.getInitialState({
  selectedIssueId: null,
  loading: false,
  error: null,
  sortBy: 'date'
});