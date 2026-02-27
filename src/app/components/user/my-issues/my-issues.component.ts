import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  IssueItem
} from '../../../types/civica-api.types';
import { StatusTextPipe, StatusColorPipe, IsActivePipe, IsCancelledPipe, IsRejectedPipe } from '../../../pipes/status.pipe';
import { DaysSincePipe } from '../../../pipes/date.pipe';

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
    StatusColorPipe,
    IsActivePipe,
    IsCancelledPipe,
    IsRejectedPipe,
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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/placeholders/issue-placeholder.svg';
  }

  retryLoad(): void {
    this.store.dispatch(UserIssuesActions.loadUserIssues({}));
  }
}
