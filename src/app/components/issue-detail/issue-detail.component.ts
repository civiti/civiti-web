import { Component, inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import * as IssueSelectors from '../../store/issues/issue.selectors';
import { Issue, Authority } from '../../services/mock-data.service';
import { EmailModalComponent } from './email-modal.component';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-issue-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatToolbarModule,
        MatDialogModule,
        MatTabsModule,
        MatExpansionModule,
    ],
    templateUrl: './issue-detail.component.html',
    styleUrl: './issue-detail.component.scss'
})
export class IssueDetailComponent implements OnInit, OnDestroy, AfterViewInit {
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _store = inject(Store<AppState>);
    private _dialog = inject(MatDialog);
    private _imageErrorCount: Map<string, number> = new Map();
    private _lightbox: any;

    issue$: Observable<Issue | null | undefined>;
    isLoading$: Observable<boolean>;
    error$: Observable<string | null>;

    constructor() {
        this.issue$ = this._store.select(IssueSelectors.selectSelectedIssue);
        this.isLoading$ = this._store.select(IssueSelectors.selectIssuesLoading);
        this.error$ = this._store.select(IssueSelectors.selectIssuesError);

        // Reinitialize gallery when issue data changes
        this.issue$.subscribe(issue => {
            if (issue && this._lightbox) {
                setTimeout(() => this.refreshGallery(), 100);
            }
        });
    }

    ngOnInit(): void {
        const issueId = this._route.snapshot.paramMap.get('id');
        if (issueId) {
            this._store.dispatch(IssueActions.loadIssue({ id: issueId }));
        } else {
            this.goBack();
        }
    }

    ngAfterViewInit(): void {
        // Initialize GLightbox after view is ready
        this.initializeGallery();
    }

    ngOnDestroy(): void {
        // Clean up the lightbox instance
        if (this._lightbox) {
            this._lightbox.destroy();
        }
    }

    private initializeGallery(): void {
        // Initialize GLightbox for photo gallery
        this._lightbox = GLightbox({
            selector: '.photo-gallery-item',
            touchNavigation: true,
            loop: true,
            autoplayVideos: false,
            closeOnOutsideClick: true,
            moreText: 'Vezi mai multe',
            moreLength: 60,
            slideEffect: 'slide',
            skin: 'clean',
            cssEffects: {
                fade: { in: 'fadeIn', out: 'fadeOut' },
                zoom: { in: 'zoomIn', out: 'zoomOut' }
            }
        });
    }

    openEmailModal(authority: Authority, issue: Issue): void {
        const dialogRef = this._dialog.open(EmailModalComponent, {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: false,
            data: { issue, authority }
        });

        // Refresh issue data after modal closes to update email count
        dialogRef.afterClosed().subscribe(() => {
            this._store.dispatch(IssueActions.loadIssue({ id: issue.id }));
        });
    }

    refreshGallery(): void {
        // Refresh the lightbox after content changes
        if (this._lightbox) {
            this._lightbox.reload();
        }
    }

    getPhotoUrl(photoPath: string): string {
        // Use local placeholder for development
        // In production, this would return the actual photo URL from backend
        return '/images/placeholders/issue-placeholder.svg';
    }

    onImageError(event: any, index?: number): void {
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

    getUrgencyLevel(issue: Issue): 'urgent' | 'normal' {
        return issue.emailsSent > 100 ? 'urgent' : 'normal';
    }

    getDaysSince(date: Date): string {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays.toString();
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'open': return 'DESCHISĂ';
            case 'in-progress': return 'ÎN PROGRES';
            case 'resolved': return 'REZOLVATĂ';
            default: return 'NECUNOSCUTĂ';
        }
    }

    goBack(): void {
        this._router.navigate(['/issues']);
    }
}