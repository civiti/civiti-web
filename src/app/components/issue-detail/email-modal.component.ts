import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgZorroModule } from '../../shared/ng-zorro.module';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import { IssueDetailResponse, IssueAuthorityResponse } from '../../types/civica-api.types';

export interface EmailModalData {
    issue: IssueDetailResponse;
    authorities: IssueAuthorityResponse[];
}

interface EmailTemplate {
    subject: string;
    body: string;
}

@Component({
    selector: 'app-email-modal',
    standalone: true,
    imports: [
        CommonModule,
        NgZorroModule
    ],
    templateUrl: './email-modal.component.html',
    styleUrl: './email-modal.component.scss'
})
export class EmailModalComponent implements OnInit {
    private _store = inject(Store<AppState>);
    private _message = inject(NzMessageService);
    private _modalRef = inject(NzModalRef);

    issue: IssueDetailResponse;
    authorities: IssueAuthorityResponse[];

    emailTemplate: EmailTemplate | null = null;

    // Copy state tracking for button feedback
    copyStates = {
        subject: false,
        body: false
    };

    // Per-authority copy state tracking
    emailCopyStates: boolean[] = [];

    constructor(@Inject(NZ_MODAL_DATA) public data: EmailModalData) {
        this.issue = data.issue;
        this.authorities = data.authorities;
        this.emailCopyStates = new Array(this.authorities.length).fill(false);
    }

    ngOnInit(): void {
        this.generateEmailTemplate();
    }

    /**
     * Generate read-only email template with placeholders for user to fill in their email client
     * Compliant with Romanian petition law (OG 27/2002 and Legii 233/2002)
     */
    private generateEmailTemplate(): void {
        if (!this.issue || !this.authorities.length) return;

        // Legally-compliant subject format
        const subject = `Petiție - [NUMELE TĂU COMPLET] - ${this.issue.title}`;

        // Build location string from available fields
        const locationParts = [this.issue.address];
        if (this.issue.district) locationParts.push(this.issue.district);
        const locationString = locationParts.filter(Boolean).join(', ') || 'Locație nespecificată';

        // Format dates as DD.MM.YYYY
        const createdDate = this.formatDateRomanian(this.issue.createdAt);
        const currentDate = this.formatDateRomanian(new Date().toISOString());

        // Build community impact section if available
        const communityImpactSection = this.issue.communityImpact?.trim()
            ? `\n${this.issue.communityImpact.trim()}`
            : '';

        // Build desired outcome section
        const desiredOutcomeText = this.issue.desiredOutcome?.trim()
            ? this.issue.desiredOutcome.trim()
            : 'Vă solicit să luați măsurile necesare pentru remedierea acestei probleme în cel mai scurt timp posibil.';

        // Build photos section
        const photoCount = this.issue.photos?.length || 0;
        const photosSection = photoCount > 0
            ? `La prezenta petiție anexez ${photoCount} ${photoCount === 1 ? 'fotografie care documentează' : 'fotografii care documentează'} problema semnalată.\n`
            : '';

        const body = `Către: [NUMELE AUTORITĂȚII]

Subsemnatul/a [NUMELE TĂU COMPLET], CNP: [CNP-UL TĂU], domiciliat(ă) în [ADRESA TA DE DOMICILIU], email: [ADRESA TA DE EMAIL], telefon: [NUMĂRUL TĂU DE TELEFON], vă adresez prezenta petiție prin care solicit să luați măsuri în legătură cu următoarea problemă:

${this.issue.title}

Locație: ${locationString}
Data sesizării: ${createdDate}

${this.issue.description}${communityImpactSection}

${desiredOutcomeText}

${photosSection}Link către documentația completă: https://civiti.ro/issues/${this.issue.id}

Conform O.G. 27/2002 privind reglementarea activității de soluționare a petițiilor, vă rog să îmi comunicați răspunsul la adresa de domiciliu menționată mai sus sau prin email la [ADRESA TA DE EMAIL], în termenul legal de 30 de zile.

De asemenea, vă rog să îmi comunicați numărul de înregistrare al acestei petiții pe adresa de email menționată mai sus, pentru a putea urmări soluționarea acesteia.

Cu stimă,
[NUMELE TĂU COMPLET]
${currentDate}`;

        this.emailTemplate = { subject, body };
    }

    /**
     * Format ISO date string to Romanian format DD.MM.YYYY
     */
    private formatDateRomanian(isoDate: string): string {
        const date = new Date(isoDate);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    /**
     * Copy specific authority email to clipboard
     */
    copyAuthorityEmail(index: number): void {
        const authority = this.authorities[index];
        if (!authority) return;

        navigator.clipboard.writeText(authority.email).then(() => {
            this._message.success(`Email copiat: ${authority.name}`);
            this.emailCopyStates[index] = true;
            setTimeout(() => {
                this.emailCopyStates[index] = false;
            }, 2000);
        }).catch(() => {
            this._message.error('Nu s-a putut copia în clipboard');
        });
    }

    /**
     * Copy email subject to clipboard
     */
    copySubject(): void {
        if (!this.emailTemplate) return;
        this.copyToClipboard(this.emailTemplate.subject, 'subject');
    }

    /**
     * Copy email body to clipboard
     */
    copyBody(): void {
        if (!this.emailTemplate) return;
        this.copyToClipboard(this.emailTemplate.body, 'body');
    }

    /**
     * Generic copy to clipboard with state feedback
     */
    private copyToClipboard(text: string, type: 'subject' | 'body'): void {
        navigator.clipboard.writeText(text).then(() => {
            this._message.success('Copiat în clipboard!');
            this.copyStates[type] = true;
            setTimeout(() => {
                this.copyStates[type] = false;
            }, 2000);
        }).catch(() => {
            this._message.error('Nu s-a putut copia în clipboard');
        });
    }

    /**
     * Called when user clicks "Am trimis email-ul" to confirm and track
     * Dispatches a single tracking action regardless of number of authorities
     */
    confirmEmailSent(): void {
        // Track email sent once - use first authority for logging purposes
        const primaryAuthority = this.authorities[0]?.email || '';
        this._store.dispatch(IssueActions.trackEmailSent({
            issueId: this.issue.id,
            targetAuthority: primaryAuthority
        }));

        // Close modal - effect will show appropriate message after API responds
        this._modalRef.close(true);
    }

    /**
     * Close modal without tracking
     */
    onCancel(): void {
        this._modalRef.close(false);
    }
}