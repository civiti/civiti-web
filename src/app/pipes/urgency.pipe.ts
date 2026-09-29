import { Pipe, PipeTransform } from '@angular/core';
import { URGENCY_LEVELS, UrgencyLevel } from '../types/civica-api.types';

/**
 * Pure pipe to check if an issue urgency is 'Urgent'.
 * Returns true for 'Urgent' level, false otherwise.
 * Cached by Angular - only recalculates when input changes.
 */
@Pipe({
  name: 'isUrgent',
  standalone: true,
  pure: true
})
export class IsUrgentPipe implements PipeTransform {
  transform(urgency: UrgencyLevel | null | undefined): boolean {
    return urgency === 'urgent';
  }
}

/** Urgency levels arrive lowercase from the issue API and PascalCase from some admin payloads. */
function urgencyKey(urgency: string | null | undefined): UrgencyLevel {
  return (urgency || '').toLowerCase() as UrgencyLevel;
}

/**
 * Romanian label of an urgency level. `form`:
 * - `'level'` (default): the level alone, "Ridicată";
 * - `'tag'`: a self-describing tag, "Urgență ridicată" (and just "Urgentă" for urgent).
 * Unknown values pass through unchanged.
 */
export function urgencyLabel(urgency: string | null | undefined, form: 'level' | 'tag' = 'level'): string {
  const key = urgencyKey(urgency);
  const level = URGENCY_LEVELS[key];
  if (!level) return urgency ?? '';
  if (form === 'level' || key === 'urgent') return level;
  return `Urgență ${level.toLowerCase()}`;
}

/** `{{ issue.urgency | urgencyLabel }}` → "Ridicată"; `{{ issue.urgency | urgencyLabel:'tag' }}` → "Urgență ridicată". */
@Pipe({
  name: 'urgencyLabel',
  standalone: true,
  pure: true
})
export class UrgencyLabelPipe implements PipeTransform {
  transform(urgency: string | null | undefined, form: 'level' | 'tag' = 'level'): string {
    return urgencyLabel(urgency, form);
  }
}

/** Tone of an urgency level for `.c-tag`: urgent in red, high in the signal wash, medium in info. */
export type UrgencyTone = 'urgent' | 'signal' | 'info' | 'neutral';

@Pipe({
  name: 'urgencyTone',
  standalone: true,
  pure: true
})
export class UrgencyTonePipe implements PipeTransform {
  private static readonly TONES: Record<UrgencyLevel, UrgencyTone> = {
    unspecified: 'neutral',
    low: 'neutral',
    medium: 'info',
    high: 'signal',
    urgent: 'urgent'
  };

  transform(urgency: string | null | undefined): UrgencyTone {
    return UrgencyTonePipe.TONES[urgencyKey(urgency)] ?? 'neutral';
  }
}
