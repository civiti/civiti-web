import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ActivityFeedItem } from '../../types/civica-api.types';

export interface ActivityState extends EntityState<ActivityFeedItem> {
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export const activityAdapter: EntityAdapter<ActivityFeedItem> = createEntityAdapter<ActivityFeedItem>({
  selectId: (activity: ActivityFeedItem) => activity.id,
  sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
});

export const initialActivityState: ActivityState = activityAdapter.getInitialState({
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10
});
