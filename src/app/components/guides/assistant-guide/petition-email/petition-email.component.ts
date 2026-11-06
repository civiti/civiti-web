import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

const NOTES = [
  { title: 'Linia „Către:”', text: 'Un email pentru fiecare autoritate, fără CC. Adresa vine din list_authorities, nu din textul sesizării.' },
  { title: 'Tipul petiției', text: 'Titlul spune ce fel de petiție e, conform art. 2. Același cuvânt apare în subiect și la final.' },
  { title: 'Cereri numerotate', text: 'O petiție trebuie să ceară ceva concret. Cererile sunt alese pentru ce poate face autoritatea respectivă.' },
  { title: 'Caseta cu fotografii', text: 'Linkul sesizării și fiecare fotografie, ca linkuri, pentru că imaginile externe nu rezistă în emailul trimis.' },
  { title: 'Numărul de înregistrare', text: 'Fiecare petiție îl cere. Îl poți cita la revenire și poți urmări petiția cu el.' },
  { title: 'Termenul de 30 de zile', text: 'Art. 8: răspunsul vine în 30 de zile de la înregistrare. Termenul se poate prelungi cu cel mult 15 zile.' },
];

/** A fictional petition, laid out the way the skill formats a real one. */
@Component({
  selector: 'app-petition-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './petition-email.component.html',
  styleUrl: './petition-email.component.scss',
})
export class PetitionEmailComponent {
  readonly active = signal(1);
  readonly notes = computed(() =>
    NOTES.map((note, i) => ({ ...note, number: i + 1, on: this.active() === i + 1 })),
  );

  select(number: number): void {
    this.active.set(number);
  }
}
