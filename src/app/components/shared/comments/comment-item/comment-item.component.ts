import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { CommentNode } from '../../../../types/civica-api.types';
import { CommentFormComponent } from '../comment-form/comment-form.component';

@Component({
  selector: 'app-comment-item',
  standalone: true,
  imports: [
    CommonModule,
    NzCommentModule,
    NzAvatarModule,
    NzIconModule,
    NzToolTipModule,
    NzPopconfirmModule,
    NzBadgeModule,
    CommentFormComponent
  ],
  templateUrl: './comment-item.component.html',
  styleUrl: './comment-item.component.scss'
})
export class CommentItemComponent {
  comment = input.required<CommentNode>();
  currentUserId = input<string | null>(null);
  isAdmin = input(false);
  isAuthenticated = input(false);
  canComment = input(false);
  editingCommentId = input<string | null>(null);
  replyingToCommentId = input<string | null>(null);
  submitting = input(false);

  reply = output<string>();
  edit = output<{ commentId: string; content: string }>();
  delete = output<string>();
  vote = output<{ commentId: string; hasVoted: boolean }>();
  setEditing = output<string | null>();
  setReplying = output<string | null>();

  get isOwner(): boolean {
    return this.currentUserId() === this.comment().user.id;
  }

  get canDelete(): boolean {
    return this.isOwner || this.isAdmin();
  }

  get canVote(): boolean {
    return this.isAuthenticated() && !this.isOwner;
  }

  get isEditing(): boolean {
    return this.editingCommentId() === this.comment().id;
  }

  get isReplying(): boolean {
    return this.replyingToCommentId() === this.comment().id;
  }

  get formattedDate(): string {
    const date = new Date(this.comment().createdAt);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onReplyClick(): void {
    if (this.isReplying) {
      this.setReplying.emit(null);
    } else {
      this.setReplying.emit(this.comment().id);
    }
  }

  onEditClick(): void {
    if (this.isEditing) {
      this.setEditing.emit(null);
    } else {
      this.setEditing.emit(this.comment().id);
    }
  }

  onVoteClick(): void {
    this.vote.emit({
      commentId: this.comment().id,
      hasVoted: this.comment().hasVoted
    });
  }

  onDeleteConfirm(): void {
    this.delete.emit(this.comment().id);
  }

  onReplySubmit(content: string): void {
    this.reply.emit(content);
  }

  onReplyCancel(): void {
    this.setReplying.emit(null);
  }

  onEditSubmit(content: string): void {
    this.edit.emit({ commentId: this.comment().id, content });
  }

  onEditCancel(): void {
    this.setEditing.emit(null);
  }
}
