import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { ApiService } from '../../../services/api.service';
import { AdminStatisticsResponse } from '../../../types/civica-api.types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzSpinModule,
    NzAvatarModule,
    NzBadgeModule,
    NzListModule,
    NzEmptyModule,
    NzTagModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Stats
  statistics$: Observable<AdminStatisticsResponse | null> = of(null);
  isLoading = true;

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.statistics$ = this.apiService.getAdminStatistics().pipe(
      map(stats => {
        this.isLoading = false;
        return stats;
      }),
      catchError(() => {
        this.isLoading = false;
        return of(null);
      }),
      // Share the result across multiple async pipe subscriptions
      shareReplay(1)
    );
  }

  navigateToApproval(): void {
    this.router.navigate(['/admin/approval']);
  }

  navigateToActivity(): void {
    this.router.navigate(['/admin/activity']);
  }

  navigateToIssues(): void {
    this.router.navigate(['/issues']);
  }

  getApprovalRateColor(rate: number): string {
    if (rate >= 80) return '#28A745';
    if (rate >= 60) return '#FCA311';
    return '#DC3545';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      Infrastructure: 'Infrastructură',
      Environment: 'Mediu',
      Transportation: 'Transport',
      PublicServices: 'Servicii Publice',
      Safety: 'Siguranță',
      Other: 'Altele'
    };
    return labels[category] || category;
  }

  getUrgencyLabel(urgency: string): string {
    const labels: Record<string, string> = {
      Unspecified: 'Nespecificat',
      Low: 'Scăzută',
      Medium: 'Medie',
      High: 'Ridicată',
      Urgent: 'Urgentă'
    };
    return labels[urgency] || urgency;
  }

  getUrgencyColor(urgency: string): string {
    const colors: Record<string, string> = {
      Unspecified: 'default',
      Low: 'green',
      Medium: 'blue',
      High: 'orange',
      Urgent: 'red'
    };
    return colors[urgency] || 'default';
  }
}
