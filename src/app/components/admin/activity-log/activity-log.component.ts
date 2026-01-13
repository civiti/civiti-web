import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';

import { ApiService } from '../../../services/api.service';
import { AdminActivityLogEntry, AdminActionType, PagedResult } from '../../../types/civica-api.types';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzTimelineModule,
    NzTagModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzPaginationModule,
    NzAvatarModule
  ],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss']
})
export class ActivityLogComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly message = inject(NzMessageService);

  // Filters
  selectedAction: AdminActionType | '' = '';
  dateRange: Date[] = [];

  // Data
  activities: AdminActivityLogEntry[] = [];
  isLoading = false;
  totalItems = 0;
  pageSize = 20;
  pageIndex = 1;

  // Action options
  actionOptions = [
    { value: 'approve_issue', label: 'Aprobare problemă' },
    { value: 'reject_issue', label: 'Respingere problemă' },
    { value: 'request_changes', label: 'Cerere modificări' },
    { value: 'bulk_approve', label: 'Aprobare în masă' }
  ];

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading = true;

    const params: Record<string, unknown> = {
      page: this.pageIndex,
      pageSize: this.pageSize
    };

    if (this.selectedAction) {
      params['action'] = this.selectedAction;
    }

    if (this.dateRange && this.dateRange.length === 2) {
      params['startDate'] = this.dateRange[0].toISOString();
      params['endDate'] = this.dateRange[1].toISOString();
    }

    this.apiService.getAdminActions(params as Record<string, string>).pipe(
      catchError(error => {
        this.message.error('Eroare la încărcarea jurnalului de activitate');
        console.error('Error loading activity log:', error);
        return of({
          items: [],
          totalItems: 0,
          page: 1,
          pageSize: this.pageSize,
          totalPages: 0
        } as PagedResult<AdminActivityLogEntry>);
      })
    ).subscribe((result: PagedResult<AdminActivityLogEntry>) => {
      this.activities = result.items;
      this.totalItems = result.totalItems;
      this.isLoading = false;
    });
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

  getActionLabel(action: AdminActionType): string {
    const labels: Record<AdminActionType, string> = {
      approve_issue: 'A aprobat',
      reject_issue: 'A respins',
      request_changes: 'A cerut modificări pentru',
      bulk_approve: 'A aprobat în masă'
    };
    return labels[action] || action;
  }

  getActionColor(action: AdminActionType): string {
    const colors: Record<AdminActionType, string> = {
      approve_issue: 'green',
      reject_issue: 'red',
      request_changes: 'orange',
      bulk_approve: 'green'
    };
    return colors[action] || 'default';
  }

  getTimelineColor(action: AdminActionType): string {
    const colors: Record<AdminActionType, string> = {
      approve_issue: 'green',
      reject_issue: 'red',
      request_changes: 'orange',
      bulk_approve: 'green'
    };
    return colors[action] || 'gray';
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `Acum ${diffMins} min`;
    if (diffHours < 24) return `Acum ${diffHours} ore`;
    if (diffDays < 7) return `Acum ${diffDays} zile`;

    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTargetLabel(entry: AdminActivityLogEntry): string {
    return entry.targetTitle || `Problemă #${entry.targetId.slice(0, 8)}`;
  }
}
