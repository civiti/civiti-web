import { Component, DestroyRef, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take, timeout } from 'rxjs';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgZorroModule } from '../../shared/ng-zorro.module';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { ApiService } from '../../services/api.service';
import { IssueDetailResponse, IssueAuthorityResponse } from '../../types/civica-api.types';

/** Max wait for the AI petition-body call before falling back to the template. */
const AI_TIMEOUT_MS = 15000;

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
        FormsModule,
        NgZorroModule
    ],
    templateUrl: './email-modal.component.html',
    styleUrl: './email-modal.component.scss'
})
export class EmailModalComponent implements OnInit {
    private _store = inject(Store<AppState>);
    private _message = inject(NzMessageService);
    private _modalRef = inject(NzModalRef);
    private _api = inject(ApiService);
    private _destroyRef = inject(DestroyRef);

    issue: IssueDetailResponse;
    authorities: IssueAuthorityResponse[];

    emailTemplate: EmailTemplate | null = null;

    /** The editable body shown in the textarea (AI-generated, or the template fallback). */
    bodyModel = '';

    /** Whether an AI generation request is in flight (drives the spinner). */
    isGenerating = false;

    /** True once the AI-composed body has replaced the deterministic template. */
    aiGenerated = false;

    /** True once the user has manually edited the body since the last generation. */
    userHasEdited = false;

    /** Only authenticated users can call the auth-gated AI endpoint. */
    canUseAI = false;

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
        // Build the deterministic template first so there is always a valid,
        // legally-compliant body to copy — even for anonymous users or if the
        // AI call fails/times out.
        this.generateEmailTemplate();
        this.bodyModel = this.emailTemplate?.body ?? '';

        // Authenticated users get the AI-composed body layered on top.
        this._store.select(selectIsAuthenticated)
            .pipe(take(1), takeUntilDestroyed(this._destroyRef))
            .subscribe(isAuthenticated => {
                this.canUseAI = isAuthenticated;
                if (isAuthenticated) {
                    this.generateWithAI(false);
                }
            });
    }

    /**
     * Request an AI-composed petition body from the backend and swap it into the
     * editable field. On any failure (error, timeout, empty response) the existing
     * deterministic template already in `bodyModel` is kept — the user is never
     * left without a valid body.
     * @param isRegenerate whether this is a user-triggered regenerate (vs. initial load)
     */
    generateWithAI(isRegenerate: boolean): void {
        if (this.isGenerating || !this.issue?.id) return;
        this.isGenerating = true;

        this._api.generatePetitionBody(this.issue.id, { regenerate: isRegenerate })
            .pipe(timeout(AI_TIMEOUT_MS), takeUntilDestroyed(this._destroyRef))
            .subscribe({
                next: (response) => {
                    this.isGenerating = false;

                    // nz-spin overlays but does not lock the textarea, so the user can start
                    // typing during the in-flight initial call. Never clobber a draft they've
                    // begun. Regenerate is an explicit action (guarded by a popconfirm when the
                    // body has been edited), so it is allowed to replace the current text.
                    if (!isRegenerate && this.userHasEdited) {
                        return;
                    }

                    if (response?.body?.trim()) {
                        this.bodyModel = response.body;
                        this.aiGenerated = true;
                        this.userHasEdited = false;
                        if (isRegenerate) {
                            this._message.success('Textul a fost regenerat.');
                        }
                    } else if (isRegenerate) {
                        this._message.info('Nu s-a primit un text nou. Am păstrat varianta curentă.');
                    }
                },
                error: (error) => {
                    this.isGenerating = false;
                    // Silent fallback: keep whatever body is already in the field.
                    console.error('[EMAIL MODAL] AI petition body generation failed:', error);
                    if (isRegenerate) {
                        this._message.error('Nu s-a putut regenera textul. Am păstrat varianta curentă.');
                    }
                }
            });
    }

    /** Called by the editable textarea; marks the body as user-modified. */
    onBodyChange(value: string): void {
        this.bodyModel = value;
        this.userHasEdited = true;
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
     * Copy email body to clipboard (the current, possibly user-edited, text)
     */
    copyBody(): void {
        if (!this.bodyModel?.trim()) return;
        this.copyToClipboard(this.bodyModel, 'body');
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