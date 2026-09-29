import { Pipe, PipeTransform } from '@angular/core';
import { AdminActionType } from '../types/civica-api.types';
import { StatusTone } from './status.pipe';

/**
 * Normalise an admin action key. The API sends lowercase `requestchanges`; older
 * payloads and the approval form use `request_changes`. Both map to one key.
 */
function actionKey(action: string | null | undefined): string {
  return (action || '').toLowerCase().replace(/_/g, '');
}

@Pipe({
  name: 'actionLabel',
  standalone: true,
  pure: true
})
export class ActionLabelPipe implements PipeTransform {
  private static readonly LABELS: Record<AdminActionType, string> = {
    approve: 'A aprobat',
    reject: 'A respins',
    requestchanges: 'A solicitat modificări'
  };

  transform(action: AdminActionType | string | null | undefined): string {
    return ActionLabelPipe.LABELS[actionKey(action) as AdminActionType] || action || '';
  }
}

/** `.c-status` tone of an admin action: `[attr.data-tone]="action | actionTone"`. */
@Pipe({
  name: 'actionTone',
  standalone: true,
  pure: true
})
export class ActionTonePipe implements PipeTransform {
  private static readonly TONES: Record<AdminActionType, StatusTone> = {
    approve: 'resolved',
    reject: 'rejected',
    requestchanges: 'pending'
  };

  transform(action: AdminActionType | string | null | undefined): StatusTone {
    return ActionTonePipe.TONES[actionKey(action) as AdminActionType] || 'neutral';
  }
}

@Pipe({
  name: 'targetLabel',
  standalone: true,
  pure: true
})
export class TargetLabelPipe implements PipeTransform {
  transform(entry: { issueTitle?: string; issueId: string }): string {
    return entry.issueTitle || `Problemă #${entry.issueId.slice(0, 8)}`;
  }
}
