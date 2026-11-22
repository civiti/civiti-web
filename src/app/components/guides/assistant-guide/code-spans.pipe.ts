import { Pipe, PipeTransform } from '@angular/core';

export interface TextSpan {
  text: string;
  code: boolean;
}

/**
 * Splits text on backticks so the template can wrap error strings and commands in
 * `<code>` without binding HTML: "Apare `429`" -> ["Apare ", "429" as code].
 */
@Pipe({ name: 'codeSpans', standalone: true })
export class CodeSpansPipe implements PipeTransform {
  transform(value: string): TextSpan[] {
    return value
      .split('`')
      .map((text, i) => ({ text, code: i % 2 === 1 }))
      .filter((span) => span.text.length > 0);
  }
}
