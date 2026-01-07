import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { IssueItem } from '../../types/civica-api.types';

export type UserIssuesStatusFilter = 'all' | 'active' | 'resolved' | 'rejected' | 'cancelled';

export interface UserIssuesState extends EntityState<IssueItem> {
  loading: boolean;
  error: string | null;
  statusFilter: UserIssuesStatusFilter;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export const userIssuesAdapter: EntityAdapter<IssueItem> = createEntityAdapter<IssueItem>({
  selectId: (issue: IssueItem) => issue.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

export const initialUserIssuesState: UserIssuesState = userIssuesAdapter.getInitialState({
  loading: false,
  error: null,
  statusFilter: 'all',
  totalCount: 0,
  currentPage: 1,
  pageSize: 20
});
