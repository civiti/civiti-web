import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AppState } from '../../../store/app.state';
import * as UserIssuesActions from '../../../store/user-issues/user-issues.actions';
import * as UserIssuesSelectors from '../../../store/user-issues/user-issues.selectors';
import { UserIssuesStatusFilter } from '../../../store/user-issues/user-issues.state';
import {
  IssueItem
} from '../../../types/civica-api.types';
import { StatusTextPipe, StatusTonePipe, StatusTone, IsActivePipe, IsResolvedPipe, IsCancelledPipe, IsRejectedPipe, IsOwnerEditablePipe } from '../../../pipes/status.pipe';
import { DaysSincePipe } from '../../../pipes/date.pipe';

/** One status filter chip: label and count kept apart so the count can be styled. */
interface FilterChip {
  value: UserIssuesStatusFilter;
  label: string;
  count: number;
  tone: StatusTone | null;
}

@Component({
  selector: 'app-my-issues',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzToolTipModule,
    StatusTextPipe,
    StatusTonePipe,
    IsActivePipe,
    IsResolvedPipe,
    IsCancelledPipe,
    IsRejectedPipe,
    IsOwnerEditablePipe,
    DaysSincePipe
  ],
  templateUrl: './my-issues.component.html',
  styleUrls: ['./my-issues.component.scss']
})
export class MyIssuesComponent implements OnInit {
  private _destroyRef = inject(DestroyRef);
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
  filterChips$: Observable<FilterChip[]>;

  selectedFilter: UserIssuesStatusFilter = 'all';

  constructor() {
    this.issues$ = this.store.select(UserIssuesSelectors.selectFilteredUserIssues);
    this.isLoading$ = this.store.select(UserIssuesSelectors.selectUserIssuesLoading);
    this.error$ = this.store.select(UserIssuesSelectors.selectUserIssuesError);
    this.statusFilter$ = this.store.select(UserIssuesSelectors.selectStatusFilter);
    this.summary$ = this.store.select(UserIssuesSelectors.selectUserIssuesSummary);
    this.filterChips$ = this.summary$.pipe(
      map((summary): FilterChip[] => [
        { value: 'all', label: 'Toate', count: summary.total, tone: null },
        { value: 'active', label: 'Active', count: summary.active, tone: 'active' },
        { value: 'resolved', label: 'Rezolvate', count: summary.resolved, tone: 'resolved' },
        { value: 'rejected', label: 'Respinse', count: summary.rejected, tone: 'rejected' },
        { value: 'cancelled', label: 'Anulate', count: summary.cancelled, tone: 'neutral' }
      ])
    );
  }

  ngOnInit(): void {
    this.store.dispatch(UserIssuesActions.loadUserIssues({}));

    // Sync filter state
    this.statusFilter$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(filter => {
      this.selectedFilter = filter;
    });
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
        // This surface offers no photo picker and waits on no outcome, so the request id is
        // only here to satisfy the contract the solve modal depends on.
        this.store.dispatch(UserIssuesActions.markIssueAsSolved({
          issueId: issue.id,
          requestId: UserIssuesActions.nextSolveRequestId()
        }));
      }
    });
  }

  reopenIssue(issue: IssueItem): void {
    this.modal.confirm({
      nzTitle: 'Redeschide problema',
      nzContent: `Problema "${issue.title}" va reveni în starea activă și va fi din nou vizibilă public ca nerezolvată. Continui?`,
      nzOkText: 'Da, redeschide',
      nzCancelText: 'Înapoi',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.store.dispatch(UserIssuesActions.reopenIssue({ issueId: issue.id }));
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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholders/issue-placeholder.svg';
  }

  retryLoad(): void {
    this.store.dispatch(UserIssuesActions.loadUserIssues({}));
  }
}
