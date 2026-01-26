import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AppState } from '../../../store/app.state';
import * as UserActions from '../../../store/user/user.actions';
import { ApiService } from '../../../services/api.service';
import {
  CreateIssueRequest,
  UrgencyLevel,
  IssueCategory,
  IssueAuthorityInput,
  URGENCY_LEVELS,
  URGENCY_COLORS
} from '../../../types/civica-api.types';

interface SelectedAuthority {
  /** Server authority ID (only for predefined authorities) */
  authorityId?: string;
  email: string;
  name: string;
  isCustom: boolean;
}

@Component({
  selector: 'app-issue-review',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzTypographyModule,
    NzTagModule,
    NzResultModule,
    NzGridModule,
    NzBadgeModule
  ],
  templateUrl: './issue-review.component.html',
  styleUrls: ['./issue-review.component.scss']
})
export class IssueReviewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  issueData: any = null;
  selectedAuthorities: SelectedAuthority[] = [];
  isSubmitting = false;
  isSubmitted = false;

  constructor(
    private router: Router,
    private message: NzMessageService,
    private store: Store<AppState>,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadCompleteIssueData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCompleteIssueData(): void {
    const issueDataString = sessionStorage.getItem('civica_complete_issue_data');
    if (issueDataString) {
      this.issueData = JSON.parse(issueDataString);
      console.log('[ISSUE REVIEW] Loaded complete issue data:', this.issueData);
    } else {
      console.warn('[ISSUE REVIEW] No complete issue data found, redirecting...');
      this.router.navigate(['/create-issue']);
      return;
    }

    // Load selected authorities
    const authoritiesString = sessionStorage.getItem('civica_selected_authorities');
    if (authoritiesString) {
      this.selectedAuthorities = JSON.parse(authoritiesString);
      console.log('[ISSUE REVIEW] Loaded authorities:', this.selectedAuthorities);
    }

    // Validate at least one authority is selected (empty array '[]' is truthy)
    if (this.selectedAuthorities.length === 0) {
      console.warn('[ISSUE REVIEW] No authorities selected, redirecting...');
      this.router.navigate(['/create-issue/authorities']);
      return;
    }
  }

  getUrgencyStatus(urgency: string): 'default' | 'processing' | 'success' | 'error' | 'warning' {
    return (URGENCY_COLORS[urgency as UrgencyLevel] || 'default') as 'default' | 'processing' | 'success' | 'error' | 'warning';
  }

  getWhenLabel(when: string): string {
    const labels: { [key: string]: string } = {
      'now': 'Chiar acum',
      'today': 'Mai devreme astăzi',
      'yesterday': 'Ieri',
      'this-week': 'Săptămâna aceasta',
      'longer': 'Acum mai mult de o săptămână'
    };
    return labels[when] || when;
  }


  getUrgencyLabel(urgency: string): string {
    return URGENCY_LEVELS[urgency as UrgencyLevel] || urgency;
  }

  viewPhoto(photoUrl: string): void {
    console.log('[ISSUE REVIEW] View photo:', photoUrl);
    window.open(photoUrl, '_blank');
  }

  submitIssue(): void {
    if (!this.issueData) {
      this.message.error('Nu există date despre problemă de trimis');
      return;
    }

    if (this.selectedAuthorities.length === 0) {
      this.message.error('Trebuie să selectezi cel puțin o autoritate');
      this.router.navigate(['/create-issue/authorities']);
      return;
    }

    console.log('[ISSUE REVIEW] Submitting issue...');
    this.isSubmitting = true;

    // Convert selected authorities to IssueAuthorityInput format
    // For predefined authorities, use authorityId; for custom, use customName/customEmail
    const authorities: IssueAuthorityInput[] = this.selectedAuthorities.map(auth => {
      if (auth.authorityId && !auth.isCustom) {
        // Predefined authority - use the server ID
        return { authorityId: auth.authorityId };
      } else {
        // Custom authority - use name and email
        return {
          customName: auth.name,
          customEmail: auth.email
        };
      }
    });

    // Sort photos so primary photo comes first (used as thumbnail in issue list)
    const sortedPhotos = [...this.issueData.photos].sort((a: any, b: any) =>
      (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
    );

    // Prepare issue data for submission using the API format
    const issueToSubmit: CreateIssueRequest = {
      title: this.generateIssueTitle(),
      description: this.issueData.description,
      category: this.issueData.category.id as IssueCategory,
      address: this.issueData.location.address,
      district: this.issueData.location.district || '',
      latitude: this.issueData.location.coordinates?.lat || 0,
      longitude: this.issueData.location.coordinates?.lng || 0,
      urgency: this.issueData.urgency as UrgencyLevel,
      desiredOutcome: this.issueData.desiredOutcome,
      communityImpact: this.issueData.communityImpact,
      photoUrls: sortedPhotos.map((photo: any) => photo.url),
      authorities
    };

    this.apiService.createIssue(issueToSubmit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('[ISSUE REVIEW] Issue submitted successfully:', result);
          
          this.isSubmitting = false;
          this.isSubmitted = true;
          
          // Award points and badge to user
          this.store.dispatch(UserActions.updatePoints({ 
            points: 50, 
            reason: 'Problemă raportată cu succes' 
          }));
          
          this.store.dispatch(UserActions.awardBadge({ 
            badgeId: 'civic-starter', 
            reason: 'Prima problemă raportată' 
          }));

          // Clear session data
          this.clearSessionData();
          
          this.message.success('Problema a fost trimisă cu succes!');
        },
        error: (error) => {
          console.error('[ISSUE REVIEW] Failed to submit issue:', error);
          this.message.error('Nu s-a putut trimite problema. Vă rugăm să încercați din nou.');
          this.isSubmitting = false;
        }
      });
  }

  private generateIssueTitle(): string {
    const category = this.issueData.category.name;
    const location = this.issueData.location.address.split(',')[0]; // Get street name
    return `Problemă de ${category} pe ${location}`;
  }

  private clearSessionData(): void {
    sessionStorage.removeItem('civica_selected_category');
    sessionStorage.removeItem('civica_uploaded_photos');
    sessionStorage.removeItem('civica_current_location');
    sessionStorage.removeItem('civica_complete_issue_data');
    sessionStorage.removeItem('civica_selected_authorities');
  }

  createAnotherIssue(): void {
    console.log('[ISSUE REVIEW] Create another issue');
    this.clearSessionData();
    this.router.navigate(['/create-issue']);
  }
}