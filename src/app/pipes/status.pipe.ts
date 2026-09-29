import { Pipe, PipeTransform } from '@angular/core';
import { isOwnerEditableStatus } from '../components/issue-creation/issue-field.constants';

/**
 * Pure pipe to transform issue status to display text.
 * Cached by Angular - only recalculates when input changes.
 */
@Pipe({
  name: 'statusText',
  standalone: true,
  pure: true
})
export class StatusTextPipe implements PipeTransform {
  // Maps to backend IssueStatus enum values. Sentence case: a surface that wants
  // capitals sets text-transform, which screen readers do not spell out.
  private static readonly STATUS_MAP: Record<string, string> = {
    'unspecified': 'Nespecificată',
    'draft': 'Ciornă',
    'submitted': 'Trimisă',
    'underreview': 'În evaluare',
    'active': 'Activă',
    'resolved': 'Rezolvată',
    'rejected': 'Respinsă',
    'cancelled': 'Anulată'
  };

  transform(status: string | null | undefined): string {
    if (!status) return 'Necunoscută';
    return StatusTextPipe.STATUS_MAP[status.toLowerCase()] || 'Necunoscută';
  }
}

/** Visual tone of a status, for the `.c-status` pill: `[attr.data-tone]="s | statusTone"`. */
export type StatusTone = 'active' | 'resolved' | 'pending' | 'rejected' | 'neutral';

@Pipe({
  name: 'statusTone',
  standalone: true,
  pure: true
})
export class StatusTonePipe implements PipeTransform {
  transform(status: string | null | undefined): StatusTone {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'active';
      case 'resolved':
        return 'resolved';
      case 'submitted':
      case 'underreview':
        return 'pending';
      case 'rejected':
        return 'rejected';
      default:
        return 'neutral';
    }
  }
}

/**
 * Pure pipe to transform issue status to nz-tag color.
 * Cached by Angular - only recalculates when input changes.
 */
@Pipe({
  name: 'statusColor',
  standalone: true,
  pure: true
})
export class StatusColorPipe implements PipeTransform {
  // Maps to backend IssueStatus enum values
  transform(status: string | null | undefined): string {
    if (!status) return 'default';

    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'underreview':
        return 'warning';
      case 'active':
        return 'processing';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
      case 'draft':
      case 'unspecified':
        return 'default';
      default:
        return 'default';
    }
  }
}

/**
 * Pure pipe to check if issue status is 'active'.
 * Cached by Angular - only recalculates when input changes.
 */
@Pipe({
  name: 'isActive',
  standalone: true,
  pure: true
})
export class IsActivePipe implements PipeTransform {
  transform(status: string | null | undefined): boolean {
    if (!status) return false;
    return status.toLowerCase() === 'active';
  }
}

/**
 * Pure pipe to check if issue status is 'resolved'.
 * Gates the owner's re-open affordance — the backend accepts a move back to Active only
 * from Resolved, so any other status must not offer the button.
 */
@Pipe({
  name: 'isResolved',
  standalone: true,
  pure: true
})
export class IsResolvedPipe implements PipeTransform {
  transform(status: string | null | undefined): boolean {
    if (!status) return false;
    return status.toLowerCase() === 'resolved';
  }
}

@Pipe({
  name: 'isCancelled',
  standalone: true,
  pure: true
})
export class IsCancelledPipe implements PipeTransform {
  transform(status: string | null | undefined): boolean {
    if (!status) return false;
    return status.toLowerCase() === 'cancelled';
  }
}

@Pipe({
  name: 'isRejected',
  standalone: true,
  pure: true
})
export class IsRejectedPipe implements PipeTransform {
  transform(status: string | null | undefined): boolean {
    if (!status) return false;
    return status.toLowerCase() === 'rejected';
  }
}

@Pipe({
  name: 'isTerminalState',
  standalone: true,
  pure: true
})
export class IsTerminalStatePipe implements PipeTransform {
  transform(status: string | null | undefined): boolean {
    if (!status) return false;
    const normalized = status.toLowerCase();
    return normalized === 'resolved' || normalized === 'cancelled';
  }
}

/**
 * Pure pipe: whether an issue in this status may be edited by its owner.
 * Drives the Edit affordance on issue-detail, my-issues and dashboard so no surface drifts.
 */
@Pipe({
  name: 'isOwnerEditable',
  standalone: true,
  pure: true
})
export class IsOwnerEditablePipe implements PipeTransform {
  transform(status: string | null | undefined): boolean {
    return isOwnerEditableStatus(status);
  }
}
