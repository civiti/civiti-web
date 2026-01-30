import { Component, OnInit, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-comment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule
  ],
  templateUrl: './comment-form.component.html',
  styleUrl: './comment-form.component.scss'
})
export class CommentFormComponent implements OnInit {
  initialContent = input('');
  placeholder = input('Scrie un comentariu...');
  submitLabel = input('Trimite');
  isReply = input(false);
  isEdit = input(false);
  submitting = input(false);
  resetKey = input(0);

  submitted = output<string>();
  cancelled = output<void>();

  content = '';
  readonly maxLength = 2000;
  private previousResetKey = 0;

  constructor() {
    effect(() => {
      const currentResetKey = this.resetKey();
      if (currentResetKey !== this.previousResetKey) {
        this.content = this.initialContent();
        this.previousResetKey = currentResetKey;
      }
    });
  }

  ngOnInit(): void {
    this.content = this.initialContent();
    this.previousResetKey = this.resetKey();
  }

  get remainingChars(): number {
    return this.maxLength - this.content.length;
  }

  get isValid(): boolean {
    return this.content.trim().length > 0 && this.content.length <= this.maxLength;
  }

  onSubmit(): void {
    if (this.isValid && !this.submitting()) {
      this.submitted.emit(this.content.trim());
    }
  }

  onCancel(): void {
    this.content = this.initialContent();
    this.cancelled.emit();
  }
}
