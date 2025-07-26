import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import * as IssueActions from '../../store/issues/issue.actions';
import { MockDataService, Issue, Authority, EmailTemplate } from '../../services/mock-data.service';
import { CustomValidators } from '../../validators/custom-validators';
import { SanitizationService } from '../../services/sanitization.service';

@Component({
    selector: 'app-email-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
    ],
    templateUrl: './email-modal.component.html',
    styleUrl: './email-modal.component.scss'
})
export class EmailModalComponent implements OnInit {
    private _fb = inject(FormBuilder);
    private _store = inject(Store<AppState>);
    private _mockDataService = inject(MockDataService);
    private _snackBar = inject(MatSnackBar);
    private _dialog = inject(MatDialog);
    private _sanitizer = inject(SanitizationService);

    @Input() issue!: Issue;
    @Input() authority!: Authority;

    emailTemplate: EmailTemplate | null = null;
    isGenerating = false;

    emailForm = this._fb.group({
        name: ['', [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
            CustomValidators.noSpecialCharsValidator()
        ]],
        email: ['', [
            Validators.required,
            CustomValidators.emailValidator()
        ]],
        phone: ['', [
            CustomValidators.phoneValidator()
        ]],
        additionalComments: ['', [
            Validators.maxLength(500),
            CustomValidators.noScriptTagsValidator(),
            CustomValidators.maxLengthTrimmedValidator(500)
        ]]
    });

    ngOnInit(): void {
        this.generateEmailTemplate();
    }

    onFormChange(): void {
        this.generateEmailTemplate();
    }

    private generateEmailTemplate(): void {
        if (this.emailForm.valid && this.issue && this.authority) {
            const rawData = this.emailForm.value;
            
            // Sanitize all inputs before generating template
            const userData = {
                name: this._sanitizer.sanitizeName(rawData.name || ''),
                email: this._sanitizer.sanitizeEmail(rawData.email || ''),
                phone: this._sanitizer.sanitizePhone(rawData.phone || ''),
                additionalComments: this._sanitizer.sanitizeMultilineText(rawData.additionalComments || '', 500)
            };
            
            this.emailTemplate = this._mockDataService.generateEmailTemplate(
                this.issue,
                this.authority,
                userData
            );
        }
    }
    
    getErrorMessage(fieldName: string): string {
        const control = this.emailForm.get(fieldName);
        if (!control?.errors || !control.touched) return '';
        
        if (control.errors['required']) {
            return `${this.getFieldLabel(fieldName)} este obligatoriu`;
        }
        if (control.errors['minlength']) {
            return `${this.getFieldLabel(fieldName)} trebuie să aibă minim ${control.errors['minlength'].requiredLength} caractere`;
        }
        if (control.errors['maxlength'] || control.errors['maxLengthTrimmed']) {
            const max = control.errors['maxlength']?.requiredLength || control.errors['maxLengthTrimmed']?.max;
            return `${this.getFieldLabel(fieldName)} trebuie să aibă maxim ${max} caractere`;
        }
        if (control.errors['invalidEmail']) {
            return 'Adresa de email nu este validă';
        }
        if (control.errors['invalidPhone']) {
            return 'Numărul de telefon nu este valid (format: 07XXXXXXXX)';
        }
        if (control.errors['invalidCharacters']) {
            return 'Numele poate conține doar litere, spații și cratime';
        }
        if (control.errors['dangerousContent']) {
            return 'Conținutul nu este permis din motive de securitate';
        }
        return '';
    }
    
    private getFieldLabel(fieldName: string): string {
        switch(fieldName) {
            case 'name': return 'Numele';
            case 'email': return 'Email-ul';
            case 'phone': return 'Telefonul';
            case 'additionalComments': return 'Comentariile';
            default: return 'Câmpul';
        }
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            this._snackBar.open('Copiat în clipboard!', 'OK', { duration: 2000 });
        });
    }

    openEmailClient(): void {
        if (!this.emailTemplate || !this.emailForm.valid) return;

        // Dispatch action to increment email count
        this._store.dispatch(IssueActions.incrementEmailCount({ issueId: this.issue.id }));

        // Create mailto link
        const subject = encodeURIComponent(this.emailTemplate.subject);
        const body = encodeURIComponent(this.emailTemplate.body);
        const mailtoLink = `mailto:${this.emailTemplate.to}?subject=${subject}&body=${body}`;

        // Open email client
        window.location.href = mailtoLink;

        // Show success message
        this._snackBar.open('Email deschis în clientul tău de email!', 'OK', {
            duration: 3000,
            panelClass: ['success-snackbar']
        });

        // Close modal after a short delay
        setTimeout(() => {
            this._dialog.closeAll();
        }, 1000);
    }

    onCancel(): void {
        this._dialog.closeAll();
    }
}