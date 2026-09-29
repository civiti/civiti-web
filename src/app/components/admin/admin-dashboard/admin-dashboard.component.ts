import { Component, OnInit, Pipe, PipeTransform, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

// NG-ZORRO imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { ApiService } from '../../../services/api.service';
import { CategoryLabelPipe } from '../../../pipes/category.pipe';
import { AdminStatisticsResponse } from '../../../types/civica-api.types';

/** One bar of a horizontal CSS bar chart: its key, raw value and length relative to the largest value. */
interface BarRow {
  key: string;
  value: number;
  pct: number;
}

/**
 * Turns a `{ key: count }` map into bar-chart rows. Largest first, unless an explicit key
 * order is given (urgency reads better in severity order than in count order).
 */
@Pipe({
  name: 'barRows',
  standalone: true,
  pure: true
})
export class BarRowsPipe implements PipeTransform {
  transform(counts: Record<string, number> | null | undefined, order?: readonly string[]): BarRow[] {
    const entries = Object.entries(counts ?? {});
    const max = Math.max(1, ...entries.map(([, value]) => value));
    const rows = entries.map(([key, value]) => ({ key, value, pct: (value / max) * 100 }));
    if (!order) return rows.sort((a, b) => b.value - a.value);
    const rank = (key: string): number => {
      const i = order.indexOf(key.toLowerCase());
      return i === -1 ? order.length : i;
    };
    return rows.sort((a, b) => rank(a.key) - rank(b.key));
  }
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzIconModule,
    CategoryLabelPipe,
    BarRowsPipe
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

  /** Severity order for the urgency chart, most severe first. */
  readonly urgencyOrder: readonly string[] = ['urgent', 'high', 'medium', 'low', 'unspecified'];

  /** Romanian urgency labels, keyed lowercase to match the API's UrgencyLevel values. */
  readonly urgencyLabels: Record<string, string> = {
    unspecified: 'Nespecificată',
    low: 'Scăzută',
    medium: 'Medie',
    high: 'Ridicată',
    urgent: 'Urgentă'
  };

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
    this.router.navigate(['/bucuresti']);
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
