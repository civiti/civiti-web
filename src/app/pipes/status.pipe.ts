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
  private static readonly STATUS_MAP: Record<string, string> = {
    'unspecified': 'NESPECIFICAT',
    'draft': 'CIORNĂ',
    'submitted': 'TRIMISĂ',
    'underreview': 'ÎN REVIZUIRE',
    'approved': 'APROBATĂ',
    'active': 'ACTIVĂ',
    'inprogress': 'ACTIVĂ', // Legacy mapping
    'rejected': 'RESPINSĂ',
    'changesrequested': 'MODIFICĂRI NECESARE',
    'resolved': 'REZOLVATĂ',
    'cancelled': 'ANULATĂ',
    'closed': 'ÎNCHISĂ'
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
  transform(status: string | null | undefined): string {
    if (!status) return 'default';

    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'approved':
        return 'warning';
      case 'active':
      case 'inprogress':
        return 'processing';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'processing';
    }
  }
}
