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
  // Maps to backend IssueStatus enum values
  private static readonly STATUS_MAP: Record<string, string> = {
    'unspecified': 'NESPECIFICAT',
    'draft': 'CIORNĂ',
    'submitted': 'TRIMISĂ',
    'underreview': 'ÎN REVIZUIRE',
    'active': 'ACTIVĂ',
    'resolved': 'REZOLVATĂ',
    'rejected': 'RESPINSĂ',
    'cancelled': 'ANULATĂ'
  };

  transform(status: string | null | undefined): string {
    if (!status) return 'NECUNOSCUTĂ';
    return StatusTextPipe.STATUS_MAP[status.toLowerCase()] || 'NECUNOSCUTĂ';
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
