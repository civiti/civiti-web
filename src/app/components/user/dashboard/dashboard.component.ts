import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

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

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import * as UserActions from '../../../store/user/user.actions';
import { AuthUser } from '../../../store/auth/auth.state';
import { 
  selectAuthUser,
  selectUserDisplayName 
} from '../../../store/auth/auth.selectors';
import {
  GamificationData,
  Badge,
  Achievement,
  UserStats
} from '../../../store/user/user.state';
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
    NzMenuModule
  ],
  template: `
    <nz-spin [nzSpinning]="(isLoading$ | async) || false">
      <div class="dashboard-container">
      
      <!-- Header Section -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="user-welcome">
            <nz-avatar 
              [nzSrc]="(user$ | async)?.photoURL" 
              [nzText]="(displayName$ | async)?.charAt(0)" 
              nzSize="large"
              class="user-avatar">
            </nz-avatar>
            <div class="welcome-text">
              <h1>Hello, {{ displayName$ | async }}!</h1>
              <p>Welcome back to your civic dashboard</p>
            </div>
          </div>
          
          <div class="header-actions">
            <nz-dropdown [nzTrigger]="'click'">
              <button nz-button nzType="text" nzSize="large" nz-dropdown>
                <span nz-icon nzType="user"></span>
                <span nz-icon nzType="down"></span>
              </button>
              <ul nz-menu nz-dropdown-menu>
                <li nz-menu-item>
                  <span nz-icon nzType="setting"></span>
                  Profile Settings
                </li>
                <li nz-menu-item>
                  <span nz-icon nzType="notification"></span>
                  Notifications
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item (click)="logout()">
                  <span nz-icon nzType="logout"></span>
                  Sign Out
                </li>
              </ul>
            </nz-dropdown>
          </div>
        </div>
      </div>

      <!-- Gamification Progress Section -->
      <div class="gamification-section" *ngIf="levelProgress$ | async as progress">
        <nz-card nzTitle="Your Civic Impact" class="impact-card">
          <div class="impact-overview">
            <div class="level-info">
              <div class="level-badge">
                <span class="level-number">{{ userLevel$ | async }}</span>
                <span class="level-label">Level</span>
              </div>
              <div class="level-title">
                <h3>{{ getLevelTitle(userLevel$ | async) }}</h3>
                <p>{{ userPoints$ | async }} community points</p>
              </div>
            </div>
            
            <div class="progress-info">
              <nz-progress 
                [nzPercent]="progress.percentage" 
                nzStrokeColor="#FCA311"
                nzSize="small"
                class="level-progress">
              </nz-progress>
              <p class="progress-text">
                {{ progress.current }} / {{ progress.required }} points to Level {{ (userLevel$ | async)! + 1 }}
              </p>
            </div>
          </div>
        </nz-card>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div nz-row [nzGutter]="[16, 16]" *ngIf="userStats$ | async as stats">
          
          <div nz-col [nzSpan]="12" [nzSm]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="stats.issuesReported"
                nzTitle="Issues Reported"
                [nzPrefix]="statIcons.reported"
                [nzValueStyle]="{ color: '#FCA311' }">
              </nz-statistic>
            </nz-card>
          </div>

          <div nz-col [nzSpan]="12" [nzSm]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="stats.issuesResolved"
                nzTitle="Issues Resolved"
                [nzPrefix]="statIcons.resolved"
                [nzValueStyle]="{ color: '#28A745' }">
              </nz-statistic>
            </nz-card>
          </div>

          <div nz-col [nzSpan]="12" [nzSm]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="stats.communityVotes"
                nzTitle="Community Votes"
                [nzPrefix]="statIcons.votes"
                [nzValueStyle]="{ color: '#14213D' }">
              </nz-statistic>
            </nz-card>
          </div>

          <div nz-col [nzSpan]="12" [nzSm]="6">
            <nz-card class="stat-card">
              <nz-statistic
                [nzValue]="stats.approvalRate"
                nzSuffix="%"
                nzTitle="Approval Rate"
                [nzPrefix]="statIcons.approval"
                [nzValueStyle]="{ color: '#6c757d' }">
              </nz-statistic>
            </nz-card>
          </div>

        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-content">
        <div nz-row [nzGutter]="[24, 24]">
          
          <!-- Left Column -->
          <div nz-col [nzSpan]="24" [nzLg]="16">
            
            <!-- Quick Actions -->
            <nz-card nzTitle="Quick Actions" class="quick-actions-card">
              <div class="quick-actions">
                
                <div class="action-item primary" routerLink="/create-issue">
                  <div class="action-icon">
                    <span nz-icon nzType="plus-circle" nzTheme="outline"></span>
                  </div>
                  <div class="action-content">
                    <h4>Report New Issue</h4>
                    <p>Document a problem in your community</p>
                  </div>
                  <span nz-icon nzType="arrow-right" class="action-arrow"></span>
                </div>

                <div class="action-item" routerLink="/issues">
                  <div class="action-icon">
                    <span nz-icon nzType="search" nzTheme="outline"></span>
                  </div>
                  <div class="action-content">
                    <h4>Browse Issues</h4>
                    <p>Explore and support community issues</p>
                  </div>
                  <span nz-icon nzType="arrow-right" class="action-arrow"></span>
                </div>

                <div class="action-item" (click)="viewMyIssues()">
                  <div class="action-icon">
                    <span nz-icon nzType="file-text" nzTheme="outline"></span>
                  </div>
                  <div class="action-content">
                    <h4>My Issues</h4>
                    <p>Track your reported issues</p>
                  </div>
                  <span nz-icon nzType="arrow-right" class="action-arrow"></span>
                </div>

              </div>
            </nz-card>

            <!-- Recent Activity -->
            <nz-card nzTitle="Recent Activity" class="activity-card">
              <nz-list 
                [nzDataSource]="mockActivity" 
                [nzRenderItem]="activityItem"
                [nzLoading]="false">
                <ng-template #activityItem let-item>
                  <nz-list-item>
                    <nz-list-item-meta
                      [nzAvatar]="activityAvatar"
                      [nzTitle]="item.title"
                      [nzDescription]="item.description">
                      <ng-template #activityAvatar>
                        <nz-avatar [nzIcon]="item.icon" [style.backgroundColor]="item.color"></nz-avatar>
                      </ng-template>
                    </nz-list-item-meta>
                    <div class="activity-time">{{ item.time }}</div>
                  </nz-list-item>
                </ng-template>
              </nz-list>
              
              <div *ngIf="mockActivity.length === 0" class="empty-activity">
                <nz-empty 
                  nzNotFoundImage="simple" 
                  nzNotFoundContent="No recent activity. Start by reporting an issue!">
                </nz-empty>
              </div>
            </nz-card>

          </div>

          <!-- Right Column -->
          <div nz-col [nzSpan]="24" [nzLg]="8">
            
            <!-- Recent Badges -->
            <nz-card nzTitle="Recent Badges" class="badges-card" *ngIf="recentBadges$ | async as badges">
              <div class="badges-grid" *ngIf="badges.length > 0; else noBadges">
                <div 
                  *ngFor="let badge of badges" 
                  class="badge-item"
                  [title]="badge.description">
                  <div class="badge-icon">
                    <img [src]="badge.iconUrl" [alt]="badge.name" onerror="this.style.display='none'">
                    <span *ngIf="!badge.iconUrl" class="badge-emoji">🏆</span>
                  </div>
                  <div class="badge-info">
                    <h5>{{ badge.name }}</h5>
                    <nz-tag [nzColor]="getBadgeColor(badge.rarity)">{{ badge.rarity }}</nz-tag>
                  </div>
                </div>
              </div>
              <ng-template #noBadges>
                <nz-empty 
                  nzNotFoundImage="simple" 
                  nzNotFoundContent="No badges yet. Keep participating to earn your first badge!">
                </nz-empty>
              </ng-template>
            </nz-card>

            <!-- Achievements Progress -->
            <nz-card nzTitle="Achievements" class="achievements-card" *ngIf="incompleteAchievements$ | async as achievements">
              <div class="achievements-list" *ngIf="achievements.length > 0; else noAchievements">
                <div 
                  *ngFor="let achievement of achievements.slice(0, 3)" 
                  class="achievement-item">
                  <div class="achievement-info">
                    <h5>{{ achievement.title }}</h5>
                    <p>{{ achievement.description }}</p>
                  </div>
                  <div class="achievement-progress">
                    <nz-progress 
                      [nzPercent]="(achievement.progress / achievement.maxProgress) * 100"
                      nzStrokeColor="#FCA311"
                      nzSize="small"
                      [nzShowInfo]="false">
                    </nz-progress>
                    <span class="progress-text">{{ achievement.progress }}/{{ achievement.maxProgress }}</span>
                  </div>
                </div>
              </div>
              <ng-template #noAchievements>
                <nz-empty 
                  nzNotFoundImage="simple" 
                  nzNotFoundContent="All achievements completed! Great work!">
                </nz-empty>
              </ng-template>
            </nz-card>

          </div>

        </div>
      </div>

      </div>
    </nz-spin>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 1.5rem;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #14213D 0%, #1a2b4f 100%);
      color: white;
      padding: 2rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      box-shadow: 0 8px 24px rgba(20, 33, 61, 0.15);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .user-welcome {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar {
      border: 3px solid rgba(255, 255, 255, 0.2);
    }

    .welcome-text h1 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0;
      color: white;
    }

    .welcome-text p {
      margin: 0;
      opacity: 0.9;
      font-size: 1rem;
    }

    .header-actions button {
      color: white !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .gamification-section {
      margin-bottom: 2rem;
    }

    .impact-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
    }

    .impact-overview {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .level-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .level-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(135deg, #FCA311 0%, #e8930f 100%);
      color: white;
      padding: 1rem;
      border-radius: 12px;
      min-width: 80px;
    }

    .level-number {
      font-size: 2rem;
      font-weight: 800;
    }

    .level-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .level-title h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #14213D;
    }

    .level-title p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }

    .progress-info {
      flex: 1;
      margin-left: 1rem;
    }

    .level-progress {
      margin-bottom: 0.5rem;
    }

    .progress-text {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
    }

    .stats-grid {
      margin-bottom: 2rem;
    }

    .stat-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(20, 33, 61, 0.08);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(20, 33, 61, 0.15);
    }

    .main-content {
      margin-bottom: 2rem;
    }

    .quick-actions-card,
    .activity-card,
    .badges-card,
    .achievements-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(20, 33, 61, 0.1);
      margin-bottom: 1.5rem;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .action-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border: 2px solid #f0f0f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      color: inherit;
    }

    .action-item:hover {
      border-color: #FCA311;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(252, 163, 17, 0.15);
      color: inherit;
      text-decoration: none;
    }

    .action-item.primary {
      background: linear-gradient(135deg, #FCA311 0%, #e8930f 100%);
      border-color: #FCA311;
      color: white;
    }

    .action-item.primary:hover {
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(252, 163, 17, 0.3);
    }

    .action-icon {
      font-size: 2rem;
      min-width: 48px;
      text-align: center;
    }

    .action-content {
      flex: 1;
    }

    .action-content h4 {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
    }

    .action-content p {
      margin: 0;
      opacity: 0.8;
      font-size: 0.95rem;
    }

    .action-arrow {
      font-size: 1.2rem;
      opacity: 0.6;
    }

    .activity-time {
      color: #666;
      font-size: 0.9rem;
    }

    .empty-activity {
      text-align: center;
      padding: 2rem;
    }

    .badges-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .badge-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .badge-item:hover {
      background: #e9ecef;
      transform: translateY(-1px);
    }

    .badge-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .badge-icon img {
      width: 24px;
      height: 24px;
    }

    .badge-emoji {
      font-size: 1.5rem;
    }

    .badge-info h5 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #14213D;
    }

    .achievements-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .achievement-item {
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .achievement-item:last-child {
      border-bottom: none;
    }

    .achievement-info h5 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #14213D;
    }

    .achievement-info p {
      font-size: 0.9rem;
      color: #666;
      margin: 0 0 0.75rem 0;
      line-height: 1.4;
    }

    .achievement-progress {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .achievement-progress .ant-progress {
      flex: 1;
    }

    .progress-text {
      font-size: 0.85rem;
      color: #666;
      min-width: 60px;
      text-align: right;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .impact-overview {
        flex-direction: column;
        gap: 1rem;
      }

      .progress-info {
        margin-left: 0;
        width: 100%;
      }

      .welcome-text h1 {
        font-size: 1.5rem;
      }

      .action-item {
        padding: 1rem;
      }

      .action-content h4 {
        font-size: 1.1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables - initialized in constructor
  user$!: Observable<AuthUser | null>;
  displayName$!: Observable<string>;
  gamificationData$!: Observable<GamificationData | null>;
  userPoints$!: Observable<number>;
  userLevel$!: Observable<number>;
  userBadges$!: Observable<Badge[]>;
  userStats$!: Observable<UserStats | null>;
  levelProgress$!: Observable<{ current: number; required: number; percentage: number }>;
  recentBadges$!: Observable<Badge[]>;
  incompleteAchievements$!: Observable<Achievement[]>;
  isLoading$!: Observable<boolean>;

  // Mock data for demonstration
  mockActivity = [
    {
      title: 'Your pothole report got 5 new supporters',
      description: 'Issue #ISS-001 - Trotuar deteriorat pe Strada Libertății',
      icon: 'like',
      color: '#FCA311',
      time: '2 hours ago'
    },
    {
      title: 'Broken streetlight marked "In Progress"',
      description: 'Issue #ISS-002 - Your report is being addressed',
      icon: 'tool',
      color: '#28A745',
      time: '1 day ago'
    },
    {
      title: 'New comment on park cleanup issue',
      description: 'Community member provided additional information',
      icon: 'message',
      color: '#14213D',
      time: '2 days ago'
    }
  ];

  statIcons = {
    reported: '<span nz-icon nzType="plus-circle"></span>',
    resolved: '<span nz-icon nzType="check-circle"></span>',
    votes: '<span nz-icon nzType="heart"></span>',
    approval: '<span nz-icon nzType="like"></span>'
  };

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
  }

  ngOnInit(): void {
    // Load user data when component initializes
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.store.dispatch(UserActions.loadUserProfile({ userId: user.id }));
        this.store.dispatch(UserActions.loadGamificationData({ userId: user.id }));
        this.store.dispatch(UserActions.loadUserPreferences({ userId: user.id }));
        
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
    if (!level) return 'Civic Newcomer';
    
    const titles = [
      'Civic Newcomer',
      'Community Contributor', 
      'Neighborhood Advocate',
      'Community Champion',
      'Civic Leader',
      'Community Hero'
    ];
    
    return titles[Math.min(level - 1, titles.length - 1)];
  }

  getBadgeColor(rarity: string): string {
    const colors: { [key: string]: string } = {
      'common': 'default',
      'uncommon': 'blue',
      'rare': 'purple',
      'epic': 'orange',
      'legendary': 'gold'
    };
    
    return colors[rarity] || 'default';
  }

  viewMyIssues(): void {
    // TODO: Navigate to user's issues page
    console.log('[DASHBOARD] View My Issues clicked');
    this.router.navigate(['/issues'], { queryParams: { filter: 'my-issues' } });
  }

  logout(): void {
    console.log('[DASHBOARD] User logout requested');
    this.store.dispatch(AuthActions.logout());
  }
}