import { Component, OnInit, DestroyRef, PLATFORM_ID, computed, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { DismissalService } from '../../../services/dismissal.service';
import {
  CreateIssueRequest,
  UrgencyLevel,
  IssueCategory,
  IssueAuthorityInput,
  URGENCY_LEVELS,
  URGENCY_COLORS
} from '../../../types/civica-api.types';
import { generateIssueTitle } from '../issue-title.util';
import { clearIssueCreationSession } from '../issue-session.util';
import { APP_STORE_URL } from '../../../constants/urls';

interface SelectedAuthority {
  /** Server authority ID (only for predefined authorities) */
  authorityId?: string;
  email: string;
  name: string;
  isCustom: boolean;
}

const APP_NUDGE_KEY = 'app_nudge_post_submit';

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
export class IssueReviewComponent implements OnInit {
  private _destroyRef = inject(DestroyRef);
  private _dismissal = inject(DismissalService);
  private _platformId = inject(PLATFORM_ID);

  issueData: any = null;
  selectedAuthorities: SelectedAuthority[] = [];
  isSubmitting = false;
  isSubmitted = false;
  issueTitle = '';

  readonly appStoreUrl = APP_STORE_URL;

  /**
   * iPadOS 13+ reports a Mac-like user agent, so also check for touch capability
   * to catch iPads running desktop-mode Safari.
   */
  private readonly isIOS = isPlatformBrowser(this._platformId)
    ? (() => {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/i.test(ua)) return true;
        return /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
      })()
    : false;

  private readonly nudgeDismissed = this._dismissal.isDismissed(APP_NUDGE_KEY);
  readonly showAppNudge = computed(() => this.isIOS && !this.nudgeDismissed());

  constructor(
    private router: Router,
    private message: NzMessageService,
    private store: Store<AppState>,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadCompleteIssueData();
  }

  private loadCompleteIssueData(): void {
    const issueDataString = sessionStorage.getItem('civica_complete_issue_data');
    if (issueDataString) {
      this.issueData = JSON.parse(issueDataString);
      this.issueTitle = this.resolveIssueTitle();
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

  dismissAppNudge(): void {
    this._dismissal.dismiss(APP_NUDGE_KEY);
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
      title: this.issueTitle,
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
      .pipe(takeUntilDestroyed(this._destroyRef))
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

  private resolveIssueTitle(): string {
    const savedTitle = sessionStorage.getItem('civica_issue_title');
    if (savedTitle) return savedTitle;

    return generateIssueTitle(
      this.issueData.category.name,
      this.issueData.location.address
    );
  }

  private clearSessionData(): void {
    clearIssueCreationSession();
  }

  createAnotherIssue(): void {
    console.log('[ISSUE REVIEW] Create another issue');
    this.clearSessionData();
    this.router.navigate(['/create-issue']);
  }
}