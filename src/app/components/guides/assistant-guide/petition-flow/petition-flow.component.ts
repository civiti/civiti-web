import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface FlowStep {
  title: string;
  detail: string;
}

const STEPS: readonly FlowStep[] = [
  {
    title: 'Problema de pe Civiti',
    detail: 'Asistentul citește sesizarea cu get_issue și ia emailurile autorităților din list_authorities, sursa verificată, nu din textul sesizării.',
  },
  {
    title: 'Abilitatea',
    detail: 'civiti-petitions alege tipul de petiție și temeiul legal, rescrie faptele în registru formal și nu inventează date, cifre sau articole de lege.',
  },
  {
    title: 'O petiție per autoritate',
    detail: 'Fiecare autoritate primește propriul email, cu ce i se poate cere ei. Nu există CC între autorități, pentru că fiecare trebuie să își înregistreze petiția.',
  },
  {
    title: 'Verificare',
    detail: 'Înainte de orice trimitere, fiecare petiție trece prin opt controale: destinatar, datele tale, fapte, istoric, potrivire, conținut obligatoriu, formă și termen.',
  },
  {
    title: 'Gmailul tău',
    detail: 'Aprobi, iar emailul pleacă din contul tău, formatat HTML și cu variantă text. Dacă nu ai Gmail conectat, primești textul gata de copiat.',
  },
  {
    title: 'Număr de înregistrare',
    detail: 'Fiecare petiție îl cere. Autoritatea are 30 de zile de la înregistrare să îți răspundă, iar cu numărul poți urmări petiția.',
  },
  {
    title: 'Revenire',
    detail: 'La cel puțin 5 săptămâni, cât timp problema e activă: citează petițiile și răspunsurile anterioare, urmează redirecționările și cere ceva nou.',
  },
];

/**
 * An ordered list rather than an SVG: it has to reflow from a rail of seven on
 * desktop to a vertical list on a phone, with the text readable at both sizes.
 * Every description is in the DOM, and the desktop rail shows one at a time.
 */
@Component({
  selector: 'app-petition-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './petition-flow.component.html',
  styleUrl: './petition-flow.component.scss',
})
export class PetitionFlowComponent {
  readonly active = signal(0);
  readonly steps = computed(() =>
    STEPS.map((step, i) => ({ ...step, number: i + 1, index: i, on: this.active() === i })),
  );

  select(index: number): void {
    this.active.set(index);
  }
}
