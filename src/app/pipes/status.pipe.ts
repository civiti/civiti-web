import { Pipe, PipeTransform } from '@angular/core';

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
    'approved': 'APROBATĂ',
    'active': 'ACTIVĂ',
    'inprogress': 'ACTIVĂ', // Legacy frontend mapping
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
      case 'approved':
        return 'warning';
      case 'active':
      case 'inprogress': // Legacy frontend mapping
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
