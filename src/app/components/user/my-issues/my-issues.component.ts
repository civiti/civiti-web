import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';

import { AppState } from '../../../store/app.state';
import * as UserIssuesActions from '../../../store/user-issues/user-issues.actions';
import * as UserIssuesSelectors from '../../../store/user-issues/user-issues.selectors';
import { UserIssuesStatusFilter } from '../../../store/user-issues/user-issues.state';
import {
  IssueItem,
  IssueStatus,
  isActiveStatus
} from '../../../types/civica-api.types';
import { StatusTextPipe, StatusColorPipe } from '../../../pipes/status.pipe';

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzGridModule,
    NzEmptyModule,
    NzSpinModule,
    NzStatisticModule,
    NzSegmentedModule,
    NzModalModule,
    NzToolTipModule,
    NzAlertModule,
    StatusTextPipe,
    StatusColorPipe
  ],
  templateUrl: './my-issues.component.html',
  styleUrls: ['./my-issues.component.scss']
})
export class MyIssuesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private store = inject(Store<AppState>);
  private router = inject(Router);
  private modal = inject(NzModalService);

  // Observables
  issues$: Observable<IssueItem[]>;
  isLoading$: Observable<boolean>;
  error$: Observable<string | null>;
  statusFilter$: Observable<UserIssuesStatusFilter>;
  summary$: Observable<{ active: number; resolved: number; rejected: number; cancelled: number; total: number }>;

  // Filter options will be computed dynamically based on summary counts

  selectedFilter: UserIssuesStatusFilter = 'all';

  constructor() {
    this.issues$ = this.store.select(UserIssuesSelectors.selectFilteredUserIssues);
    this.isLoading$ = this.store.select(UserIssuesSelectors.selectUserIssuesLoading);
    this.error$ = this.store.select(UserIssuesSelectors.selectUserIssuesError);
    this.statusFilter$ = this.store.select(UserIssuesSelectors.selectStatusFilter);
    this.summary$ = this.store.select(UserIssuesSelectors.selectUserIssuesSummary);
  }

  ngOnInit(): void {
    this.store.dispatch(UserIssuesActions.loadUserIssues({}));

    // Sync filter state
    this.statusFilter$.pipe(takeUntil(this.destroy$)).subscribe(filter => {
      this.selectedFilter = filter;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterChange(value: string | number): void {
    const filter = value as UserIssuesStatusFilter;
    this.store.dispatch(UserIssuesActions.setStatusFilter({ filter }));
  }

  getFilterOptions(summary: { active: number; resolved: number; rejected: number; cancelled: number; total: number }) {
    return [
      { label: `Toate (${summary.total})`, value: 'all' },
      { label: `Active (${summary.active})`, value: 'active' },
      { label: `Rezolvate (${summary.resolved})`, value: 'resolved' },
      { label: `Respinse (${summary.rejected})`, value: 'rejected' },
      { label: `Anulate (${summary.cancelled})`, value: 'cancelled' }
    ];
  }

  private normalizeStatus(status: string): IssueStatus {
    // Map backend status values to our IssueStatus type (case-insensitive)
    const statusMap: Record<string, IssueStatus> = {
      'unspecified': 'Unspecified',
      'draft': 'Draft',
      'submitted': 'Submitted',
      'underreview': 'UnderReview',
      'approved': 'Approved',
      'active': 'Active',
      'inprogress': 'Active', // Legacy mapping
      'resolved': 'Resolved',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusMap[status.toLowerCase()] || 'Unspecified';
  }

  isActive(status: IssueStatus | string): boolean {
    const normalized = this.normalizeStatus(status);
    return isActiveStatus(normalized);
  }

  isRejected(status: IssueStatus | string): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized === 'Rejected';
  }

  isCancelled(status: IssueStatus | string): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized === 'Cancelled';
  }

  viewIssueDetails(issueId: string): void {
    this.router.navigate(['/issue', issueId]);
  }

  editIssue(issue: IssueItem): void {
    // Navigate to edit page (for rejected issues)
    this.router.navigate(['/edit-issue', issue.id]);
  }

  markAsSolved(issue: IssueItem): void {
    this.modal.confirm({
      nzTitle: 'Marchează ca rezolvată',
      nzContent: `Ești sigur că problema "${issue.title}" a fost rezolvată de autorități?`,
      nzOkText: 'Da, rezolvă',
      nzCancelText: 'Înapoi',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.store.dispatch(UserIssuesActions.markIssueAsSolved({ issueId: issue.id }));
      }
    });
  }

  cancelIssue(issue: IssueItem): void {
    this.modal.confirm({
      nzTitle: 'Anulează problema',
      nzContent: `Ești sigur că vrei să anulezi problema "${issue.title}"? Această acțiune nu poate fi anulată.`,
      nzOkText: 'Da, anulează',
      nzCancelText: 'Păstrează',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.store.dispatch(UserIssuesActions.cancelIssue({ issueId: issue.id }));
      }
    });
  }

  navigateToCreateIssue(): void {
    this.router.navigate(['/create-issue']);
  }

  getDaysSinceCreation(createdAt: string): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(createdAt).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholders/issue-placeholder.svg';
  }

  retryLoad(): void {
    this.store.dispatch(UserIssuesActions.loadUserIssues({}));
  }
}
