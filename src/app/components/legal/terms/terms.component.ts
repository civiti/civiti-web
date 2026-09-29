import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, NzIconModule],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent {
  private readonly document = inject(DOCUMENT);

  /**
   * Table-of-contents jump. A bare fragment link would become a router
   * navigation, and `scrollPositionRestoration: 'top'` would then throw the
   * reader back to the top of the page. Modified clicks (new tab, etc.) keep
   * the default so the `href` still works as a shareable deep link.
   */
  scrollToSection(event: MouseEvent, id: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = this.document.getElementById(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }
}
