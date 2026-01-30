import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { StatusTextPipe, StatusColorPipe } from '../../../pipes/status.pipe';
import { ActivityIconPipe, ActivityColorPipe } from '../../../pipes/activity.pipe';
import { AppState } from '../../../store/app.state';
import * as UserActions from '../../../store/user/user.actions';
import * as UserIssuesActions from '../../../store/user-issues/user-issues.actions';
import * as UserIssuesSelectors from '../../../store/user-issues/user-issues.selectors';
import * as ActivityActions from '../../../store/activity/activity.actions';
import * as ActivitySelectors from '../../../store/activity/activity.selectors';
import { AuthUser } from '../../../store/auth/auth.state';
import { selectAuthUser } from '../../../store/auth/auth.selectors';
import {
  Achievement
} from '../../../store/user/user.state';
import {
  BadgeResponse,
  IssueItem,
  ActivityFeedItem
} from '../../../types/civica-api.types';

// Interface for user statistics from gamification data
interface UserStats {
  issuesReported: number;
  issuesResolved: number;
  communityVotes: number;
}
import {
  selectUserPoints,
  selectUserLevel,
  selectUserBadges,
  selectUserStats,
  selectNextLevelProgress,
  selectIncompleteAchievements,
  selectUserLoading
} from '../../../store/user/user.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzProgressModule,
    NzStatisticModule,
    NzGridModule,
    NzAvatarModule,
    NzTagModule,
    NzListModule,
    NzBadgeModule,
    NzSpinModule,
    NzTypographyModule,
    NzEmptyModule,
    StatusTextPipe,
    StatusColorPipe,
    ActivityIconPipe,
    ActivityColorPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables - initialized in constructor
  user$!: Observable<AuthUser | null>;
  userPoints$!: Observable<number>;
  userLevel$!: Observable<number>;
  userStats$!: Observable<UserStats | null>;
  levelProgress$!: Observable<{ current: number; required: number; percentage: number }>;
  earnedBadges$!: Observable<BadgeResponse[]>;
  incompleteAchievements$!: Observable<Achievement[]>;
  isLoading$!: Observable<boolean>;

  // User Issues Observables
  userIssuesSummary$!: Observable<{ active: number; resolved: number; rejected: number; total: number }>;
  recentUserIssues$!: Observable<IssueItem[]>;
  userIssuesLoading$!: Observable<boolean>;

  // Activity Observables
  recentActivity$!: Observable<ActivityFeedItem[]>;
  activityLoading$!: Observable<boolean>;


  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    // Initialize observables
    this.user$ = this.store.select(selectAuthUser);
    this.userPoints$ = this.store.select(selectUserPoints);
    this.userLevel$ = this.store.select(selectUserLevel);
    this.userStats$ = this.store.select(selectUserStats);
    this.levelProgress$ = this.store.select(selectNextLevelProgress);
    this.earnedBadges$ = this.store.select(selectUserBadges);
    this.incompleteAchievements$ = this.store.select(selectIncompleteAchievements);
    this.isLoading$ = this.store.select(selectUserLoading);

    // User Issues observables
    this.userIssuesSummary$ = this.store.select(UserIssuesSelectors.selectUserIssuesSummary);
    this.recentUserIssues$ = this.store.select(UserIssuesSelectors.selectRecentUserIssues);
    this.userIssuesLoading$ = this.store.select(UserIssuesSelectors.selectUserIssuesLoading);

    // Activity observables
    this.recentActivity$ = this.store.select(ActivitySelectors.selectRecentActivities);
    this.activityLoading$ = this.store.select(ActivitySelectors.selectActivityLoading);
  }

  ngOnInit(): void {
    // Load user data when component initializes
    // Profile now includes gamification data - single API call
    this.user$.pipe(
      map(user => user?.id ?? null),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      if (userId) {
        // loadUserProfile now returns profile WITH gamification
        this.store.dispatch(UserActions.loadUserProfile({ userId }));
        this.store.dispatch(UserActions.loadUserPreferences({ userId }));

        // Load user's own issues
        this.store.dispatch(UserIssuesActions.loadUserIssues({}));

        // Load user's activity feed
        this.store.dispatch(ActivityActions.loadMyActivity({ params: { pageSize: 5 } }));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getLevelTitle(level: number | null): string {
    if (!level) return 'Începător civic';

    const titles = [
      'Începător civic',
      'Contribuitor comunitar',
      'Avocat de cartier',
      'Campion comunitar',
      'Lider civic',
      'Erou comunitar'
    ];

    return titles[Math.min(level - 1, titles.length - 1)];
  }

  getBadgeColor(rarity: string | null): string {
    // Map rarity values to colors
    // The backend uses string rarity values, we'll map common rarities
    const colors: { [key: string]: string } = {
      'common': 'default',
      'uncommon': 'blue',
      'rare': 'gold',
      'epic': 'purple',
      'legendary': 'red',
      // Also keep old tier mappings for backward compatibility
      'bronze': 'default',
      'silver': 'blue',
      'gold': 'gold',
      'platinum': 'purple'
    };

    return colors[rarity?.toLowerCase() ?? ''] || 'default';
  }

  getBadgeIcon(category: string, rarity: string | null): string {
    // Override with rarity for special badges
    const rarityLower = rarity?.toLowerCase();
    if (rarityLower === 'legendary') return 'trophy';
    if (rarityLower === 'epic') return 'crown';

    // Map by badge category (Starter, Progress, Achievement, Special)
    const categoryIcons: Record<string, string> = {
      'starter': 'star',
      'progress': 'fire',
      'achievement': 'check-circle',
      'special': 'crown'
    };

    return categoryIcons[category?.toLowerCase()] || 'star';
  }

  viewMyIssues(): void {
    this.router.navigate(['/my-issues']);
  }

  viewIssueDetails(issueId: string): void {
    this.router.navigate(['/issue', issueId]);
  }

  onIssueImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholders/issue-placeholder.svg';
  }
}