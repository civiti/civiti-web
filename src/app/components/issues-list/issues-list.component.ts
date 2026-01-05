import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import * as IssueSelectors from '../../store/issues/issue.selectors';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { IssueItem } from '../../types/civica-api.types';

@Component({
  selector: 'app-issues-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzStatisticModule,
    NzEmptyModule,
    NzToolTipModule,
    NzModalModule,
  ],
  templateUrl: './issues-list.component.html',
  styleUrl: './issues-list.component.scss'
})
export class IssuesListComponent implements OnInit {
  private _router = inject(Router);
  private _store = inject(Store<AppState>);
  private _modal = inject(NzModalService);
  private _imageErrorCount: Map<string, number> = new Map();

  issues$!: Observable<IssueItem[]>;
  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  sortBy$!: Observable<string>;
  totalIssues$!: Observable<number>;
  isAuthenticated$!: Observable<boolean>;

  sortBy = 'date';

  constructor() {
    this.issues$ = this._store.select(IssueSelectors.selectSortedIssues);
    this.isLoading$ = this._store.select(IssueSelectors.selectIssuesLoading);
    this.error$ = this._store.select(IssueSelectors.selectIssuesError);
    this.sortBy$ = this._store.select(IssueSelectors.selectSortBy);
    this.totalIssues$ = this._store.select(IssueSelectors.selectTotal);
    this.isAuthenticated$ = this._store.select(selectIsAuthenticated);

    // Sync local sortBy with store state using takeUntilDestroyed (Angular 19 best practice)
    this.sortBy$
      .pipe(takeUntilDestroyed())
      .subscribe(sortBy => {
        if (sortBy && this.sortBy !== sortBy) {
          this.sortBy = sortBy;
        }
      });
  }

  ngOnInit(): void {
    // Load issues without filters initially
    this._store.dispatch(IssueActions.loadIssues({ params: undefined }));
  }

  onSortChange(): void {
    this._store.dispatch(IssueActions.changeSortBy({
      sortBy: this.sortBy as 'date' | 'emails' | 'urgency'
    }));
  }

  getUrgencyLevel(issue: IssueItem): 'urgent' | 'normal' {
    return (issue.emailsSent || 0) > 100 ? 'urgent' : 'normal';
  }

  getDaysSince(date: string | Date): string {
    const days = this.getDaysSinceNumber(date);
    return days.toString();
  }

  private getDaysSinceNumber(date: string | Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusText(status: string): string {
    // Case-insensitive matching for backend camelCase enum serialization
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'unspecified': return 'NESPECIFICAT';
      case 'draft': return 'CIORNĂ';
      case 'submitted': return 'TRIMISĂ';
      case 'underreview': return 'ÎN REVIZUIRE';
      case 'approved': return 'APROBATĂ';
      case 'rejected': return 'RESPINSĂ';
      case 'changesrequested': return 'MODIFICĂRI NECESARE';
      case 'inprogress': return 'ÎN PROGRES';
      case 'resolved': return 'REZOLVATĂ';
      case 'closed': return 'ÎNCHISĂ';
      default: return 'NECUNOSCUTĂ';
    }
  }

  getStatusColor(status: string): string {
    const normalizedStatus = (status || '').toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'approved':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'processing';
    }
  }

  getIssueImage(issue: IssueItem): string {
    if (issue.mainPhotoUrl) {
      return issue.mainPhotoUrl;
    }
    return '/images/placeholders/issue-placeholder.svg';
  }

  onImageError(event: any): void {
    const imgElement = event.target;
    const currentSrc = imgElement.src;

    // Track error count per image to prevent infinite loops
    const errorCount = this._imageErrorCount.get(currentSrc) || 0;
    if (errorCount >= 1) {
      // Already tried fallback, hide the image to prevent further errors
      imgElement.style.display = 'none';
      return;
    }

    this._imageErrorCount.set(currentSrc, errorCount + 1);

    // Try local fallback image
    imgElement.src = '/images/placeholders/issue-placeholder.svg';
  }

  viewIssueDetails(issueId: string): void {
    this._store.dispatch(IssueActions.selectIssue({ id: issueId }));
    this._router.navigate(['/issue', issueId]);
  }

  promptToCreateIssue(): void {
    // Check auth state and navigate directly if authenticated
    this.isAuthenticated$
      .pipe(take(1))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this._router.navigate(['/create-issue']);
        } else {
          // Show auth modal for unauthenticated users
          this._modal.create({
            nzTitle: 'Conectare necesară pentru crearea unei probleme',
            nzContent: 'Pentru a raporta o problemă nouă, este necesar să ai un cont. Poți să te conectezi dacă ai deja unul sau să îți creezi un cont nou.',
            nzFooter: [
              {
                label: 'Mai târziu',
                type: 'text',
                onClick: () => {
                  // Modal closes automatically
                }
              },
              {
                label: 'Am deja cont',
                type: 'default',
                onClick: () => {
                  this._router.navigate(['/auth/login'], { queryParams: { returnUrl: '/create-issue' } });
                  return Promise.resolve();
                }
              },
              {
                label: 'Creează cont nou',
                type: 'primary',
                onClick: () => {
                  this._router.navigate(['/auth/register'], { queryParams: { returnUrl: '/create-issue' } });
                  return Promise.resolve();
                }
              }
            ],
            nzIconType: 'user',
            nzWidth: 500,
            nzCentered: true
          });
        }
      });
  }
} 