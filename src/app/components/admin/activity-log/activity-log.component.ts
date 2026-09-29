import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// NG-ZORRO imports
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../../services/api.service';
import { AdminActivityLogEntry, AdminActionType, PagedResult } from '../../../types/civica-api.types';
import { ActionLabelPipe, ActionTonePipe, TargetLabelPipe } from '../../../pipes/admin.pipe';
import { StatusTextPipe } from '../../../pipes/status.pipe';
import { FormatDateTimePipe } from '../../../pipes/date.pipe';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzPaginationModule,
    ActionLabelPipe,
    ActionTonePipe,
    TargetLabelPipe,
    StatusTextPipe,
    FormatDateTimePipe
  ],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss']
})
export class ActivityLogComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);
  private readonly _destroyRef = inject(DestroyRef);

  // Subject to trigger activity loading - switchMap cancels pending requests
  private readonly loadTrigger$ = new Subject<void>();

  // Filters
  selectedAction: AdminActionType | '' = '';
  dateRange: Date[] | null = [];

  // Data
  activities: AdminActivityLogEntry[] = [];
  isLoading = false;
  totalItems = 0;
  pageSize = 20;
  pageIndex = 1;

  // Action options - match backend: approve, reject, requestchanges (lowercase)
  actionOptions = [
    { value: 'approve', label: 'Aprobare' },
    { value: 'reject', label: 'Respingere' },
    { value: 'requestchanges', label: 'Cerere modificări' }
  ];

  ngOnInit(): void {
    // Set up the load pipeline with switchMap to cancel stale requests
    this.loadTrigger$.pipe(
      takeUntilDestroyed(this._destroyRef),
      switchMap(() => {
        this.isLoading = true;

        const params: Record<string, unknown> = {
          page: this.pageIndex,
          pageSize: this.pageSize
        };

        if (this.selectedAction) {
          params['actionType'] = this.selectedAction;
        }

        if (this.dateRange?.length === 2) {
          params['startDate'] = this.dateRange[0].toISOString();
          params['endDate'] = this.dateRange[1].toISOString();
        }

        return this.apiService.getAdminActions(params as Record<string, string>).pipe(
          catchError(error => {
            this.message.error('Eroare la încărcarea jurnalului de activitate');
            console.error('[ADMIN] Eroare la încărcarea jurnalului de activitate:', error);
            return of({
              items: [],
              totalItems: 0,
              page: 1,
              pageSize: this.pageSize,
              totalPages: 0
            } as PagedResult<AdminActivityLogEntry>);
          })
        );
      })
    ).subscribe((result: PagedResult<AdminActivityLogEntry>) => {
      this.activities = result.items;
      this.totalItems = result.totalItems;
      this.isLoading = false;
    });

    // Trigger initial load
    this.loadTrigger$.next();
  }

  loadActivities(): void {
    this.loadTrigger$.next();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadActivities();
  }

  onPageChange(page: number): void {
    this.pageIndex = page;
    this.loadActivities();
  }

  resetFilters(): void {
    this.selectedAction = '';
    this.dateRange = [];
    this.pageIndex = 1;
    this.loadActivities();
  }
}
