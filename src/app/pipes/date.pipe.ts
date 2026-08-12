import { Pipe, PipeTransform } from '@angular/core';

// These pipes use new Date() internally, making them technically impure.
// Kept pure intentionally: inputs are immutable timestamps, values are
// correct at render time, and pure: false would run on every change
// detection cycle — negating the performance benefit over method calls.

@Pipe({
  name: 'daysSince',
  standalone: true
})
export class DaysSincePipe implements PipeTransform {
  transform(date: string | Date | null | undefined): number {
    if (!date) return 0;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(date: string | null | undefined): string {
    if (!date) return '';
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Acum câteva minute';
    if (diffInHours < 24) return `Acum ${diffInHours}h`;
    const days = Math.floor(diffInHours / 24);
    if (days === 1) return 'Ieri';
    if (days < 7) return `Acum ${days} zile`;
    return new Date(date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  }
}

@Pipe({
  name: 'formatDateTime',
  standalone: true
})
export class FormatDateTimePipe implements PipeTransform {
  transform(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Chiar acum';
    if (diffMinutes < 60) return `Acum ${diffMinutes} min`;
    if (diffHours < 24) return `Acum ${diffHours}h`;
    if (diffDays < 7) return `Acum ${diffDays} zile`;

    return date.toLocaleDateString('ro-RO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

/**
 * How long an issue took to resolve, as a complete Romanian fragment INCLUDING the preposition:
 * "în 153 de zile" / "într-o zi" / "în mai puțin de o zi".
 *
 * The preposition is part of the output for a grammar reason rather than a stylistic one:
 * Romanian contracts "în" + "o zi" into "într-o zi", so a fixed label plus a bare value would
 * render the broken "în o zi" at exactly one day. Callers print a label that stands alone
 * ("Rezolvată") and let this supply the whole fragment.
 *
 * The plural takes "de" when the last two digits are 00 or 20-99: 19 zile, 20 de zile,
 * 100 de zile, 101 zile, 120 de zile.
 *
 * Unlike its neighbours above this one never reads the clock — it compares two server-supplied
 * timestamps — so it cannot render differently on the server and on the client after hydration.
 *
 * Returns '' when either end is missing, so the caller's @if drops the sentence entirely, and
 * clamps a negative span (clock skew, or a backfilled resolvedAt) to the sub-day phrasing so it
 * can never print "în -1 zile".
 */
@Pipe({
  name: 'resolutionSpan',
  standalone: true
})
export class ResolutionSpanPipe implements PipeTransform {
  transform(from: string | Date | null | undefined, to: string | Date | null | undefined): string {
    if (!from || !to) return '';

    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return '';

    const days = Math.floor((end - start) / 86_400_000);
    if (days < 1) return 'în mai puțin de o zi';
    if (days === 1) return 'într-o zi';

    const mod100 = days % 100;
    return `în ${days} ${mod100 === 0 || mod100 >= 20 ? 'de zile' : 'zile'}`;
  }
}
