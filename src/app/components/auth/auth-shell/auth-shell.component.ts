import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * Shared frame for every /auth screen (these routes hide the global header).
 *
 * Desktop: an ink brand panel on the left (what Civiti does, in claims taken
 * from the landing page) and the form on paper on the right. Mobile: the panel
 * folds away and a compact brand link sits above the form.
 *
 * Projection slots:
 *   [authTop] — the screen's back link, shown in the bar above the form.
 *   default   — the screen itself.
 *
 * Styles are unencapsulated on purpose: the `auth-` classes below (heading
 * block, "sau" divider, field sizing, state blocks, footer links) are shared by
 * the projected templates of all six auth screens, so each screen's own SCSS
 * only carries what is specific to it. Every selector is prefixed `auth-` and
 * scoped under `.auth`, so nothing leaks outside these routes.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './auth-shell.component.scss',
  template: `
    <div class="auth" [class.auth--wide]="wide()">
      <aside class="auth-panel" aria-label="Despre Civiti">
        <div class="auth-panel__inner">
          <a class="auth-brand auth-brand--light" routerLink="/" aria-label="Civiti — pagina principală">
            <img src="/images/logo/civiti-mark-light.svg" alt="" width="34" height="34" />
            <span class="auth-brand__word">Civiti</span>
          </a>

          <div class="auth-pitch">
            <p class="c-eyebrow c-eyebrow--on-dark">Platformă civică pentru România</p>
            <p class="auth-pitch__title">O sesizare singură se pierde ușor. Cincizeci sunt greu de ignorat.</p>
            <ul class="auth-points">
              <li>
                <span class="auth-points__icon" aria-hidden="true"><span nz-icon nzType="send" nzTheme="outline"></span></span>
                <span>Sesizarea ajunge, prin email, direct la autoritatea responsabilă</span>
              </li>
              <li>
                <span class="auth-points__icon" aria-hidden="true"><span nz-icon nzType="team" nzTheme="outline"></span></span>
                <span>Problema rămâne publică: alți locuitori o pot vota și pot trimite același email</span>
              </li>
              <li>
                <span class="auth-points__icon" aria-hidden="true"><span nz-icon nzType="check-circle" nzTheme="outline"></span></span>
                <span>Online și gratuit</span>
              </li>
            </ul>
          </div>

          <p class="auth-deadline">
            <span class="auth-deadline__figure c-num">30</span>
            <span class="auth-deadline__text">de zile are autoritatea să îți răspundă — obligație legală, conform OG 27/2002</span>
          </p>
        </div>
      </aside>

      <div class="auth-main">
        <div class="auth-top">
          <a class="auth-brand auth-brand--compact" routerLink="/" aria-label="Civiti — pagina principală">
            <img src="/images/logo/civiti-mark.svg" alt="" width="30" height="30" />
            <span class="auth-brand__word">Civiti</span>
          </a>
          <ng-content select="[authTop]" />
        </div>

        <div class="auth-body">
          <ng-content />
        </div>
      </div>
    </div>
  `
})
export class AuthShellComponent {
  /** Wider, top-aligned column for the long sign-up form. */
  wide = input(false);
}
