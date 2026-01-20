import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated
} from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-registration-gateway',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzDividerModule,
    NzSpaceModule,
    NzTypographyModule,
    NzGridModule,
    NzAlertModule,
    NzSpinModule,
    NzModalModule
  ],
  templateUrl: './registration-gateway.component.html',
  styleUrls: ['./registration-gateway.component.scss']
})
export class RegistrationGatewayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  isAuthenticated$!: Observable<boolean>;
  returnUrl: string | null = null;

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute,
    private modal: NzModalService
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
        }
      });

    // Load any stored user data on component init
    this.store.dispatch(AuthActions.loadUserFromStorage());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loginWithGoogle(): void {
    console.log('[REGISTRATION GATEWAY] Initiating Google OAuth...');
    this.store.dispatch(AuthActions.loginWithGoogle());
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }

  showPrivacyPolicy(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Politica de Confidențialitate',
      nzContent: this.getPrivacyPolicyContent(),
      nzWidth: 700,
      nzCentered: true,
      nzFooter: [
        {
          label: 'Am înțeles',
          type: 'primary',
          onClick: () => modalRef.close()
        }
      ],
      nzBodyStyle: {
        'max-height': '60vh',
        'overflow-y': 'auto',
        'padding': '24px'
      }
    });
  }

  private getPrivacyPolicyContent(): string {
    return `
      <div style="font-family: 'Fira Sans', sans-serif; color: #14213D; line-height: 1.6;">
        <p style="margin-bottom: 16px;">
          Această politică descrie modul în care sunt colectate, utilizate și protejate datele cu caracter personal
          ale utilizatorilor platformei <strong>Civiti</strong>, în conformitate cu Regulamentul (UE) 2016/679 (GDPR).
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">1. Cine suntem</h3>
        <p>
          Platforma <strong>Civiti</strong> este o inițiativă civică independentă pentru îmbunătățirea comunităților locale.<br>
          Email de contact: <a href="mailto:contact@civiti.ro" style="color: #FCA311;">contact@civiti.ro</a>
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">2. Ce date colectăm</h3>
        <p>Colectăm doar datele strict necesare funcționării platformei:</p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Nume și adresă de email (la crearea contului sau la trimiterea de sesizări)</li>
          <li>Locația de rezidență (județ, oraș, sector - pentru a afișa probleme relevante)</li>
          <li>Conținut furnizat de utilizatori (descrieri de probleme, fotografii încărcate)</li>
          <li>Adresa IP și date tehnice (pentru securitate și funcționare)</li>
        </ul>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">3. Conținut public</h3>
        <p>
          Problemele publicate pe platformă (descrieri, fotografii, locații generale) sunt vizibile public.
        </p>
        <p style="background: #FFF3CD; padding: 12px; border-radius: 4px; margin-top: 8px;">
          <strong>⚠️ Atenție:</strong> Utilizatorii sunt responsabili să nu publice date personale sensibile,
          date ale altor persoane fără consimțământ sau informații care pot încălca dreptul la viață privată.
        </p>
        <p style="margin-top: 8px;">
          Administratorul își rezervă dreptul de a elimina conținutul care încalcă aceste reguli.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">4. Scopul prelucrării datelor</h3>
        <p>Datele sunt colectate și utilizate pentru:</p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Crearea și administrarea conturilor de utilizator</li>
          <li>Publicarea și gestionarea problemelor din comunitate</li>
          <li>Facilitarea transmiterii de mesaje către autorități</li>
          <li>Comunicarea cu utilizatorii</li>
          <li>Îmbunătățirea platformei și securitatea acesteia</li>
        </ul>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">5. Temeiul legal</h3>
        <p>Prelucrarea datelor se face în baza:</p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Consimțământului utilizatorului</li>
          <li>Interesului legitim al administratorului pentru funcționarea platformei</li>
          <li>Obligațiilor legale aplicabile</li>
        </ul>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">6. Trimiterea de emailuri către autorități</h3>
        <p>
          Utilizatorii pot trimite emailuri către autorități folosind platforma sau propriul client de email.
          Datele personale incluse în aceste mesaje sunt furnizate în mod voluntar de utilizator.
        </p>
        <p style="margin-top: 8px;">
          <em>Platforma nu este responsabilă pentru modul în care autoritățile prelucrează datele primite.</em>
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">7. Durata stocării</h3>
        <p>Datele sunt păstrate:</p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Pe durata existenței contului de utilizator</li>
          <li>Sau până la solicitarea ștergerii acestora</li>
          <li>Sau conform obligațiilor legale aplicabile</li>
        </ul>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">8. Drepturile utilizatorilor</h3>
        <p>Conform GDPR, ai următoarele drepturi:</p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Dreptul de acces la date</li>
          <li>Dreptul de rectificare</li>
          <li>Dreptul la ștergerea datelor („dreptul de a fi uitat")</li>
          <li>Dreptul la restricționarea prelucrării</li>
          <li>Dreptul de opoziție</li>
          <li>Dreptul de a-ți retrage consimțământul</li>
        </ul>
        <p style="margin-top: 8px;">
          Solicitările pot fi trimise la: <a href="mailto:contact@civiti.ro" style="color: #FCA311;">contact@civiti.ro</a>
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">9. Securitatea datelor</h3>
        <p>
          Aplicăm măsuri tehnice și organizatorice pentru protejarea datelor personale împotriva accesului
          neautorizat, pierderii sau modificării acestora. Folosim criptare SSL/TLS pentru toate comunicațiile
          și stocăm datele în servicii cloud securizate.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">10. Cookie-uri</h3>
        <p>
          Platforma utilizează cookie-uri esențiale pentru funcționare (autentificare, preferințe de sesiune).
          Nu folosim cookie-uri de tracking sau publicitate.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">11. Fotografii încărcate</h3>
        <p>
          Pentru protejarea confidențialității, fotografiile încărcate sunt procesate automat pentru a elimina
          metadatele EXIF (inclusiv locația GPS și informații despre dispozitiv) înainte de stocare.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">12. Modificări</h3>
        <p>
          Ne rezervăm dreptul de a actualiza această politică. Versiunea actualizată va fi publicată pe platformă
          și utilizatorii vor fi notificați prin email în cazul modificărilor semnificative.
        </p>

        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          <em>Ultima actualizare: Ianuarie 2025</em>
        </p>
      </div>
    `;
  }
}