import { Pipe, PipeTransform } from '@angular/core';

/**
 * Romanian count agreement: the singular for exactly one, the plural up to 19,
 * and "de" before the plural from 20 on, unless the last two digits are 01–19.
 *   roCount(1, 'punct', 'puncte')   → "1 punct"
 *   roCount(19, 'punct', 'puncte')  → "19 puncte"
 *   roCount(20, 'punct', 'puncte')  → "20 de puncte"
 *   roCount(101, 'punct', 'puncte') → "101 puncte"
 * The number is formatted for ro-RO ("1.500 de puncte").
 */
export function roCount(n: number, one: string, many: string): string {
  const count = n.toLocaleString('ro-RO');
  if (n === 1) return `${count} ${one}`;
  const lastTwo = Math.abs(n) % 100;
  const needsDe = Number.isInteger(n) && Math.abs(n) >= 20 && (lastTwo === 0 || lastTwo >= 20);
  return needsDe ? `${count} de ${many}` : `${count} ${many}`;
}

/**
 * `{{ points | roPlural:'punct':'puncte' }}` → "1 punct", "20 de puncte".
 * The forms can be whole phrases that agree with the noun:
 * `{{ photos.length | roPlural:'fotografie încărcată':'fotografii încărcate' }}`.
 */
@Pipe({
  name: 'roPlural',
  standalone: true,
  pure: true
})
export class RoPluralPipe implements PipeTransform {
  transform(n: number | null | undefined, one: string, many: string): string {
    return roCount(n ?? 0, one, many);
  }
}
