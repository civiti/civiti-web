import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() comment!: CommentNode;
  @Input() currentUserId: string | null = null;
  @Input() isAdmin = false;
  @Input() isAuthenticated = false;
  @Input() editingCommentId: string | null = null;
  @Input() replyingToCommentId: string | null = null;
  @Input() submitting = false;

  @Output() reply = new EventEmitter<string>();
  @Output() edit = new EventEmitter<{ commentId: string; content: string }>();
  @Output() delete = new EventEmitter<string>();
  @Output() vote = new EventEmitter<{ commentId: string; hasVoted: boolean }>();
  @Output() setEditing = new EventEmitter<string | null>();
  @Output() setReplying = new EventEmitter<string | null>();

  get isOwner(): boolean {
    return this.currentUserId === this.comment.user.id;
  }

  get canDelete(): boolean {
    return this.isOwner || this.isAdmin;
  }

  get canVote(): boolean {
    return this.isAuthenticated && !this.isOwner;
  }

  get isEditing(): boolean {
    return this.editingCommentId === this.comment.id;
  }

  get isReplying(): boolean {
    return this.replyingToCommentId === this.comment.id;
  }

  get formattedDate(): string {
    const date = new Date(this.comment.createdAt);
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get indentStyle(): { [key: string]: string } {
    // Cap visual indent at depth 5
    const visualDepth = Math.min(this.comment.depth, 5);
    return {
      'margin-left': `${visualDepth * 24}px`
    };
  }

  onReplyClick(): void {
    if (this.isReplying) {
      this.setReplying.emit(null);
    } else {
      this.setReplying.emit(this.comment.id);
    }
  }

  onEditClick(): void {
    if (this.isEditing) {
      this.setEditing.emit(null);
    } else {
      this.setEditing.emit(this.comment.id);
    }
  }

  onVoteClick(): void {
    this.vote.emit({
      commentId: this.comment.id,
      hasVoted: this.comment.hasVoted
    });
  }

  onDeleteConfirm(): void {
    this.delete.emit(this.comment.id);
  }

  onReplySubmit(content: string): void {
    this.reply.emit(content);
  }

  onReplyCancel(): void {
    this.setReplying.emit(null);
  }

  onEditSubmit(content: string): void {
    this.edit.emit({ commentId: this.comment.id, content });
  }

  onEditCancel(): void {
    this.setEditing.emit(null);
  }
}
