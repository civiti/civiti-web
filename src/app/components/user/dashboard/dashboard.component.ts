import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';

import { StatusTextPipe, StatusColorPipe } from '../../../pipes/status.pipe';
import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import * as UserActions from '../../../store/user/user.actions';
import * as UserIssuesActions from '../../../store/user-issues/user-issues.actions';
import * as UserIssuesSelectors from '../../../store/user-issues/user-issues.selectors';
import { AuthUser } from '../../../store/auth/auth.state';
import {
  selectAuthUser,
  selectUserDisplayName
} from '../../../store/auth/auth.selectors';
import {
  GamificationData,
  Achievement,
  UserProfile
} from '../../../store/user/user.state';
import {
  BadgeResponse,
  IssueItem
} from '../../../types/civica-api.types';

// Interface for user statistics from gamification data
interface UserStats {
  issuesReported: number;
  issuesResolved: number;
  communityVotes: number;
}
import {
  selectGamificationData,
  selectUserPoints,
  selectUserLevel,
  selectUserBadges,
  selectUserStats,
  selectNextLevelProgress,
  selectRecentBadges,
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
    NzDropDownModule,
    NzMenuModule,
    StatusTextPipe,
    StatusColorPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables - initialized in constructor
  user$!: Observable<AuthUser | null>;
  displayName$!: Observable<string>;
  gamificationData$!: Observable<GamificationData | null>;
  userPoints$!: Observable<number>;
  userLevel$!: Observable<number>;
  userBadges$!: Observable<BadgeResponse[]>;
  userStats$!: Observable<UserStats | null>;
  levelProgress$!: Observable<{ current: number; required: number; percentage: number }>;
  recentBadges$!: Observable<BadgeResponse[]>;
  incompleteAchievements$!: Observable<Achievement[]>;
  isLoading$!: Observable<boolean>;

  // User Issues Observables
  userIssuesSummary$!: Observable<{ active: number; resolved: number; rejected: number; total: number }>;
  recentUserIssues$!: Observable<IssueItem[]>;
  userIssuesLoading$!: Observable<boolean>;
  hasUserIssues$!: Observable<boolean>;

  // Mock data for demonstration
  mockActivity = [
    {
      title: 'Raportul despre groapă a primit 5 noi susținători',
      description: 'Problemă #ISS-001 - Trotuar deteriorat pe Strada Libertății',
      icon: 'like',
      color: '#FCA311',
      time: 'Acum 2 ore'
    },
    {
      title: 'Iluminat stradal defect marcat "În curs"',
      description: 'Problemă #ISS-002 - Raportul dumneavoastră este în curs de soluționare',
      icon: 'tool',
      color: '#28A745',
      time: 'Acum 1 zi'
    },
    {
      title: 'Comentariu nou la problema curățeniei parcului',
      description: 'Un membru al comunității a furnizat informații suplimentare',
      icon: 'message',
      color: '#14213D',
      time: 'Acum 2 zile'
    }
  ];


  constructor(
    private store: Store<AppState>,
    private router: Router
  ) {
    // Initialize observables
    this.user$ = this.store.select(selectAuthUser);
    this.displayName$ = this.store.select(selectUserDisplayName);
    this.gamificationData$ = this.store.select(selectGamificationData);
    this.userPoints$ = this.store.select(selectUserPoints);
    this.userLevel$ = this.store.select(selectUserLevel);
    this.userBadges$ = this.store.select(selectUserBadges);
    this.userStats$ = this.store.select(selectUserStats);
    this.levelProgress$ = this.store.select(selectNextLevelProgress);
    this.recentBadges$ = this.store.select(selectRecentBadges);
    this.incompleteAchievements$ = this.store.select(selectIncompleteAchievements);
    this.isLoading$ = this.store.select(selectUserLoading);

    // User Issues observables
    this.userIssuesSummary$ = this.store.select(UserIssuesSelectors.selectUserIssuesSummary);
    this.recentUserIssues$ = this.store.select(UserIssuesSelectors.selectRecentUserIssues);
    this.userIssuesLoading$ = this.store.select(UserIssuesSelectors.selectUserIssuesLoading);
    this.hasUserIssues$ = this.store.select(UserIssuesSelectors.selectHasUserIssues);
  }

  ngOnInit(): void {
    // Load user data when component initializes
    // Profile now includes gamification data - single API call
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        // loadUserProfile now returns profile WITH gamification
        this.store.dispatch(UserActions.loadUserProfile({ userId: user.id }));
        this.store.dispatch(UserActions.loadUserPreferences({ userId: user.id }));

        // Load user's own issues
        this.store.dispatch(UserIssuesActions.loadUserIssues({}));

        // Update login streak
        this.store.dispatch(UserActions.updateStreak({ streakType: 'login', increment: true }));
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

  getBadgeColor(rarity: string): string {
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

    return colors[rarity?.toLowerCase()] || 'default';
  }

  viewMyIssues(): void {
    this.router.navigate(['/my-issues']);
  }

  logout(): void {
    console.log('[DASHBOARD] User logout requested');
    this.store.dispatch(AuthActions.logout());
  }

  navigateToIssues(): void {
    this.router.navigate(['/issues']);
  }

  viewIssueDetails(issueId: string): void {
    this.router.navigate(['/issue', issueId]);
  }

  onIssueImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholders/issue-placeholder.svg';
  }
}