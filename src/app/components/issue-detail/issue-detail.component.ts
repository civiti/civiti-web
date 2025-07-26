import { Component, inject, OnInit } from '@angular/core';
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
export class IssueDetailComponent implements OnInit {
    private _route = inject(ActivatedRoute);
    private _router = inject(Router);
    private _store = inject(Store<AppState>);
    private _dialog = inject(MatDialog);

    issue$: Observable<Issue | null | undefined>;
    isLoading$: Observable<boolean>;
    error$: Observable<string | null>;

    constructor() {
        this.issue$ = this._store.select(IssueSelectors.selectSelectedIssue);
        this.isLoading$ = this._store.select(IssueSelectors.selectIssuesLoading);
        this.error$ = this._store.select(IssueSelectors.selectIssuesError);
    }

    ngOnInit(): void {
        const issueId = this._route.snapshot.paramMap.get('id');
        if (issueId) {
            this._store.dispatch(IssueActions.loadIssue({ id: issueId }));
        } else {
            this.goBack();
        }
    }

    openEmailModal(authority: Authority, issue: Issue): void {
        const dialogRef = this._dialog.open(EmailModalComponent, {
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            disableClose: false,
            data: { issue, authority }
        });

        // Pass data to modal
        const modalInstance = dialogRef.componentInstance;
        modalInstance.issue = issue;
        modalInstance.authority = authority;
        modalInstance.ngOnInit();

        // Listen for form changes to regenerate email template
        modalInstance.emailForm.valueChanges.subscribe(() => {
            modalInstance.onFormChange();
        });

        // Refresh issue data after modal closes to update email count
        dialogRef.afterClosed().subscribe(() => {
            this._store.dispatch(IssueActions.loadIssue({ id: issue.id }));
        });
    }

    openPhotoGallery(index: number): void {
        // For now, just show a larger version of the image
        // In a real app, this would open a proper photo gallery modal
        console.log('Opening photo gallery at index:', index);
    }

    getPhotoUrl(photoPath: string): string {
        // Return placeholder for development
        return 'https://via.placeholder.com/400x300/E5E5E5/14213D?text=' +
            encodeURIComponent('Foto Problemă');
    }

    onImageError(event: any, index?: number): void {
        event.target.src = 'https://via.placeholder.com/400x300/E5E5E5/14213D?text=Foto+' + (index ? index + 1 : 'Problemă');
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