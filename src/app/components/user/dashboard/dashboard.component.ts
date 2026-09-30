import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { StatusTextPipe, StatusTonePipe, IsOwnerEditablePipe } from '../../../pipes/status.pipe';
import { ActivityIconPipe } from '../../../pipes/activity.pipe';
import { LevelTitlePipe } from '../../../pipes/dashboard.pipe';
import { TimeAgoPipe } from '../../../pipes/date.pipe';
import { RoPluralPipe, roCount } from '../../../pipes/plural.pipe';
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
  selectUserLoading,
  selectGamificationData
} from '../../../store/user/user.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    StatusTextPipe,
    StatusTonePipe,
    IsOwnerEditablePipe,
    ActivityIconPipe,
    LevelTitlePipe,
    TimeAgoPipe,
    RoPluralPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  // Observables - initialized as class fields
  user$ = this.store.select(selectAuthUser);
  userPoints$ = this.store.select(selectUserPoints);
  userLevel$ = this.store.select(selectUserLevel);
  userStats$ = this.store.select(selectUserStats);
  levelProgress$ = this.store.select(selectNextLevelProgress);
  earnedBadges$ = this.store.select(selectUserBadges);
  incompleteAchievements$ = this.store.select(selectIncompleteAchievements);
  isLoading$ = this.store.select(selectUserLoading);

  // Presentation helpers
  /** First word of the display name, for the greeting; null when it would be an email. */
  firstName$ = this.user$.pipe(
    map(user => {
      const first = user?.displayName?.trim().split(/\s+/)[0];
      return first && !first.includes('@') ? first : null;
    })
  );
  /** "260 de puncte" still needed for the next level. */
  pointsToNextLevel$ = this.store.select(selectGamificationData).pipe(
    map(g => g ? roCount(g.pointsToNextLevel ?? Math.max(0, g.nextLevelPoints - g.points), 'punct', 'puncte') : null)
  );
  /** Earned badges with their icon resolved once, instead of a method call per change detection. */
  badgeView$ = this.earnedBadges$.pipe(
    map(badges => badges.map(badge => ({
      badge,
      icon: this.getBadgeIcon(badge.category, badge.rarity),
      special: ['epic', 'legendary'].includes(badge.rarity?.toLowerCase() ?? '')
    })))
  );

  // User Issues Observables
  userIssuesSummary$ = this.store.select(UserIssuesSelectors.selectUserIssuesSummary);
  recentUserIssues$ = this.store.select(UserIssuesSelectors.selectRecentUserIssues);
  userIssuesLoading$ = this.store.select(UserIssuesSelectors.selectUserIssuesLoading);

  // Activity Observables
  recentActivity$ = this.store.select(ActivitySelectors.selectRecentActivities);
  activityLoading$ = this.store.select(ActivitySelectors.selectActivityLoading);

  ngOnInit(): void {
    // Load user data when component initializes
    // Profile now includes gamification data - single API call
    this.user$.pipe(
      map(user => user?.id ?? null),
      distinctUntilChanged(),
      takeUntilDestroyed(this._destroyRef)
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

  editIssue(issueId: string): void {
    this.router.navigate(['/edit-issue', issueId]);
  }

  onIssueImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholders/issue-placeholder.svg';
  }
}