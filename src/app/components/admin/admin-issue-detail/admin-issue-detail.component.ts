import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, EMPTY } from 'rxjs';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '../../../services/api.service';
import { CategoryColorPipe } from '../../../pipes/category.pipe';
import { UrgencyStatusPipe } from '../../../pipes/urgency.pipe';
import { StatusTextPipe, StatusColorPipe } from '../../../pipes/status.pipe';
import { TimeAgoPipe } from '../../../pipes/date.pipe';
import { ActionLabelPipe, ActionColorPipe, TimelineColorPipe } from '../../../pipes/admin.pipe';
import {
  AdminIssueDetailResponse,
  IssueApprovedSnapshot,
  ApproveIssueRequest,
  RejectIssueRequest
} from '../../../types/civica-api.types';

/** One field that changed between the last-approved snapshot and the pending edit. */
interface DiffRow {
  label: string;
  before: string;
  after: string;
}

@Component({
  selector: 'app-admin-issue-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzGridModule,
    NzDividerModule,
    NzTimelineModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzRadioModule,
    NzBadgeModule,
    NzTabsModule,
    CategoryColorPipe,
    UrgencyStatusPipe,
    StatusTextPipe,
    StatusColorPipe,
    TimeAgoPipe,
    ActionLabelPipe,
    ActionColorPipe,
    TimelineColorPipe
  ],
  templateUrl: './admin-issue-detail.component.html',
  styleUrls: ['./admin-issue-detail.component.scss']
})
export class AdminIssueDetailComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly message = inject(NzMessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  issue: AdminIssueDetailResponse | null = null;
  isLoading = true;
  error: string | null = null;

  // Re-review diff (set from approvedSnapshot on load)
  isReReview = false;
  diffRows: DiffRow[] = [];

  // Decision modal
  isDecisionModalVisible = false;
  isProcessing = false;
  decisionForm!: FormGroup;

  constructor() {
    this.decisionForm = this.fb.group({
      decision: ['', [Validators.required]],
      reason: [''],
      notes: ['']
    });

    this.decisionForm.get('decision')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
      const reasonControl = this.decisionForm.get('reason');
      if (val === 'reject') {
        reasonControl?.setValidators([Validators.required]);
      } else {
        reasonControl?.clearValidators();
        reasonControl?.reset();
      }
      reasonControl?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(params => {
          const issueId = params.get('id');
          if (!issueId) {
            this.error = 'ID-ul problemei lipsește';
            this.isLoading = false;
            return EMPTY;
          }
          this.isLoading = true;
          this.error = null;
          return this.apiService.getAdminIssueDetail(issueId).pipe(
            catchError(err => {
              console.error('[ADMIN] Failed to load issue detail:', err);
              this.error = err.error?.message || 'Nu s-au putut încărca detaliile problemei';
              this.isLoading = false;
              return EMPTY;
            })
          );
        })
      )
      .subscribe(issue => {
        this.issue = issue;
        this.isLoading = false;
        this.buildDiff(issue);
      });
  }

  // Romanian labels for enum values. Keyed lowercase so they match the camelCase the API
  // returns (e.g. "publicServices") as well as any PascalCase value.
  private static readonly CATEGORY_LABELS: Record<string, string> = {
    infrastructure: 'Infrastructură',
    environment: 'Mediu',
    transportation: 'Transport',
    publicservices: 'Servicii Publice',
    safety: 'Siguranță',
    other: 'Altele',
  };
  private static readonly URGENCY_LABELS: Record<string, string> = {
    unspecified: 'Nespecificată',
    low: 'Scăzută',
    medium: 'Medie',
    high: 'Ridicată',
    urgent: 'Urgentă',
  };

  /**
   * Build the re-review diff from the approved snapshot. Branch on the snapshot's PRESENCE
   * (not changedFields.length): a null snapshot means a genuine first review, so no diff.
   */
  private buildDiff(issue: AdminIssueDetailResponse): void {
    const snap: IssueApprovedSnapshot | null | undefined = issue.approvedSnapshot;
    this.isReReview = snap != null;
    this.diffRows = [];
    if (!snap) return;

    const changed = new Set(issue.changedFields ?? []);
    const known = new Set<string>();
    const row = (key: string, label: string, before: string, after: string): void => {
      known.add(key);
      if (changed.has(key)) this.diffRows.push({ label, before, after });
    };
    const catLabel = (v: string): string =>
      AdminIssueDetailComponent.CATEGORY_LABELS[(v || '').toLowerCase()] || v || '—';
    const urgLabel = (v: string): string =>
      AdminIssueDetailComponent.URGENCY_LABELS[(v || '').toLowerCase()] || v || '—';
    // Include the email so an email-only authority change is visible (name alone would hide it).
    const authList = (list: { name: string; email: string }[] | undefined): string =>
      (list ?? []).map(a => `${a.name} (${a.email})`).join('; ') || '—';

    row('title', 'Titlu', snap.title, issue.title);
    row('category', 'Categorie', catLabel(snap.category), catLabel(issue.category));
    row('urgency', 'Urgență', urgLabel(snap.urgency), urgLabel(issue.urgency));
    row('address', 'Adresă', snap.address, issue.address);
    row('district', 'Sector', snap.district || '—', issue.district || '—');
    row('location', 'Coordonate', `${snap.latitude}, ${snap.longitude}`, `${issue.latitude}, ${issue.longitude}`);
    row('description', 'Descriere', snap.description, issue.description);
    row('desiredOutcome', 'Rezultat dorit', snap.desiredOutcome || '—', issue.desiredOutcome || '—');
    row('communityImpact', 'Impact comunitar', snap.communityImpact || '—', issue.communityImpact || '—');

    // Photos: 'photos' is in changedFields for any change, incl. a same-count swap. Flag content
    // change explicitly so an equal count doesn't read as "nothing changed".
    const snapPhotos = snap.photoUrls?.length ?? 0;
    const issuePhotos = issue.photos?.length ?? 0;
    row('photos', 'Fotografii',
      `${snapPhotos} fotografii`,
      snapPhotos === issuePhotos ? `${issuePhotos} fotografii (conținut modificat)` : `${issuePhotos} fotografii`);

    row('authorities', 'Autorități', authList(snap.authorities), authList(issue.authorities));

    // Forward-compat: surface any changedFields value we don't explicitly map, so a real change
    // never silently vanishes (and the panel never wrongly reads "no changes detected").
    for (const key of changed) {
      if (!known.has(key)) {
        this.diffRows.push({ label: key, before: '—', after: 'Modificat' });
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/approval']);
  }

  openDecisionModal(): void {
    this.isDecisionModalVisible = true;
    this.decisionForm.reset({ decision: '', reason: '', notes: '' });
  }

  closeDecisionModal(): void {
    this.isDecisionModalVisible = false;
    this.isProcessing = false;
    this.decisionForm.reset();
  }

  submitDecision(): void {
    this.decisionForm.markAllAsTouched();
    if (!this.decisionForm.valid || !this.issue) return;

    const { decision, reason, notes } = this.decisionForm.value;
    const issueId = this.issue.id;

    if (decision !== 'approve' && decision !== 'reject') return;

    this.isProcessing = true;

    if (decision === 'approve') {
      const data: ApproveIssueRequest = { adminNotes: notes || undefined };
      this.apiService.approveIssue(issueId, data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.message.success('Problema a fost aprobata cu succes');
            this.handleDecisionSuccess();
          },
          error: (err) => {
            console.error('[ADMIN] Failed to approve:', err);
            this.message.error('Aprobarea a esuat. Incearca din nou.');
            this.isProcessing = false;
          }
        });
    } else if (decision === 'reject') {
      const data: RejectIssueRequest = {
        reason: reason,
        adminNotes: notes || undefined
      };
      this.apiService.rejectIssue(issueId, data)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.message.success('Problema a fost respinsa');
            this.handleDecisionSuccess();
          },
          error: (err) => {
            console.error('[ADMIN] Failed to reject:', err);
            this.message.error('Respingerea a esuat. Incearca din nou.');
            this.isProcessing = false;
          }
        });
    }
  }

  private handleDecisionSuccess(): void {
    this.isProcessing = false;
    this.closeDecisionModal();
    this.router.navigate(['/admin/approval']);
  }

  viewPhoto(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
