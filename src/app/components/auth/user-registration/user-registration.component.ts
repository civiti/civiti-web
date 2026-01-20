import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// NG-ZORRO imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { AppState } from '../../../store/app.state';
import * as AuthActions from '../../../store/auth/auth.actions';
import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectEmailConfirmationPending,
  selectPendingEmail
} from '../../../store/auth/auth.selectors';
import { 
  ROMANIAN_COUNTIES, 
  BUCHAREST_DISTRICTS, 
  RESIDENCE_TYPES,
  getCitiesForCounty,
  hasDistricts,
  County
} from '../../../data/romanian-locations';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  location: {
    county: string;
    city: string;
    district?: string;
  };
  residenceType: 'Apartment' | 'House' | 'Business';
  communicationPrefs: {
    issueUpdates: boolean;
    communityNews: boolean;
    monthlyDigest: boolean;
    achievements: boolean;
  };
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzSelectModule,
    NzIconModule,
    NzAlertModule,
    NzSpinModule,
    NzDividerModule,
    NzTypographyModule,
    NzStepsModule,
    NzModalModule
  ],
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.scss']
})
export class UserRegistrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registrationForm!: FormGroup;
  currentStep = 0;
  passwordVisible = false;

  // Location data
  counties = ROMANIAN_COUNTIES;
  cities: string[] = [];
  districts = BUCHAREST_DISTRICTS;
  residenceTypes = RESIDENCE_TYPES;
  showDistricts = false;
  

  isLoading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  isAuthenticated$!: Observable<boolean>;
  emailConfirmationPending$!: Observable<boolean>;
  pendingEmail$!: Observable<string | null>;

  constructor(
    private fb: FormBuilder,
    private store: Store<AppState>,
    private router: Router,
    private route: ActivatedRoute,
    private modal: NzModalService
  ) {
    this.isLoading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
    this.isAuthenticated$ = this.store.select(selectIsAuthenticated);
    this.emailConfirmationPending$ = this.store.select(selectEmailConfirmationPending);
    this.pendingEmail$ = this.store.select(selectPendingEmail);

    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.navigateAfterRegistration();
        }
      });

    // Watch for county changes to update cities
    this.registrationForm.get('county')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(countyCode => {
        this.onCountyChange(countyCode);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      // Step 1: Account
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],

      // Step 2: Location
      county: ['', [Validators.required]],
      city: ['', [Validators.required]],
      district: [''],
      residenceType: ['Apartment', [Validators.required]],

      // Step 3: Preferences
      issueUpdates: [true],
      communityNews: [true],
      monthlyDigest: [false],
      achievements: [true],
      agreeToTerms: [false, [Validators.requiredTrue]],
      agreeToPrivacy: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  onCountyChange(countyCode: string): void {
    if (countyCode) {
      // Update cities based on selected county
      this.cities = getCitiesForCounty(countyCode);
      
      // Show districts only for București
      this.showDistricts = hasDistricts(countyCode);
      
      // Reset city and district selections
      this.registrationForm.patchValue({
        city: '',
        district: ''
      });
      
      // Update district validators
      const districtControl = this.registrationForm.get('district');
      if (this.showDistricts) {
        districtControl?.setValidators([Validators.required]);
      } else {
        districtControl?.clearValidators();
      }
      districtControl?.updateValueAndValidity();
    }
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!(this.registrationForm.get('displayName')?.valid &&
          this.registrationForm.get('email')?.valid &&
          this.registrationForm.get('password')?.valid &&
          this.registrationForm.get('confirmPassword')?.valid &&
          !this.registrationForm.hasError('passwordMismatch'));

      case 1:
        return !!(this.registrationForm.get('county')?.valid &&
          this.registrationForm.get('city')?.valid &&
          this.registrationForm.get('residenceType')?.valid &&
          (!this.showDistricts || this.registrationForm.get('district')?.valid));

      case 2:
        return !!(this.registrationForm.get('agreeToTerms')?.valid &&
          this.registrationForm.get('agreeToPrivacy')?.valid);

      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.isCurrentStepValid() && this.currentStep < 2) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      const formValue = this.registrationForm.value;
      const selectedCounty = this.counties.find(c => c.code === formValue.county);

      console.log('[USER REGISTRATION] Submitting registration:', {
        email: formValue.email,
        displayName: formValue.displayName,
        location: {
          county: selectedCounty?.name || formValue.county,
          city: formValue.city,
          district: formValue.district,
          residenceType: formValue.residenceType
        }
      });

      this.store.dispatch(AuthActions.registerWithEmail({
        email: formValue.email,
        password: formValue.password,
        displayName: formValue.displayName,
        county: selectedCounty?.name || formValue.county,
        city: formValue.city,
        district: formValue.district || undefined,
        residenceType: formValue.residenceType
      }));
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.get(key)?.markAsTouched();
      });
    }
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearAuthError());
  }

  navigateToLogin(): void {
    this.store.dispatch(AuthActions.clearEmailConfirmationPending());
    this.router.navigate(['/auth/login']);
  }

  retryRegistration(): void {
    this.store.dispatch(AuthActions.clearEmailConfirmationPending());
  }

  private navigateAfterRegistration(): void {
    // Check for return URL in query params
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      // Default to dashboard for direct registration
      this.router.navigate(['/dashboard']);
    }
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

  showTermsAndConditions(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Termeni și Condiții',
      nzContent: this.getTermsContent(),
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

  private getTermsContent(): string {
    return `
      <div style="font-family: 'Fira Sans', sans-serif; color: #14213D; line-height: 1.6;">
        <p style="margin-bottom: 16px;">
          Acești termeni și condiții reglementează utilizarea platformei <strong>Civiti</strong>.
          Prin crearea unui cont și utilizarea platformei, acceptați acești termeni.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">1. Scopul platformei</h3>
        <p>
          Civiti este o platformă civică care permite cetățenilor să raporteze probleme din comunitate
          și să coordoneze eforturi pentru rezolvarea acestora prin comunicare cu autoritățile locale.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">2. Contul de utilizator</h3>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Trebuie să furnizezi informații corecte și actualizate</li>
          <li>Ești responsabil pentru securitatea contului tău</li>
          <li>Un singur cont per persoană</li>
          <li>Trebuie să ai cel puțin 16 ani pentru a utiliza platforma</li>
        </ul>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">3. Conținut acceptabil</h3>
        <p>Când raportezi probleme, te angajezi să:</p>
        <ul style="margin-left: 20px; margin-top: 8px;">
          <li>Furnizezi informații corecte și verificabile</li>
          <li>Nu publici conținut fals, defăimător sau ilegal</li>
          <li>Nu incluzi date personale ale terților fără consimțământ</li>
          <li>Nu folosești platformă pentru spam sau publicitate</li>
          <li>Respecți drepturile de autor pentru fotografii</li>
        </ul>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">4. Comunicarea cu autoritățile</h3>
        <p>
          Platforma facilitează trimiterea de emailuri către autorități. Ești responsabil pentru
          conținutul mesajelor tale. Platforma nu garantează răspunsul sau acțiunea autorităților.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">5. Proprietate intelectuală</h3>
        <p>
          Prin încărcarea de conținut pe platformă, acorzi Civiti o licență neexclusivă de a afișa
          și distribui acest conținut în scopul funcționării platformei. Păstrezi drepturile de autor
          asupra conținutului tău.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">6. Moderare și eliminare conținut</h3>
        <p>
          Ne rezervăm dreptul de a elimina conținut care încalcă acești termeni sau care este
          considerat inadecvat, fără notificare prealabilă.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">7. Limitarea răspunderii</h3>
        <p>
          Platforma este oferită „ca atare". Nu garantăm disponibilitatea continuă, rezolvarea
          problemelor raportate sau acuratețea informațiilor furnizate de utilizatori.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">8. Suspendarea contului</h3>
        <p>
          Putem suspenda sau șterge contul tău în caz de încălcare a acestor termeni sau utilizare
          abuzivă a platformei.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">9. Modificări</h3>
        <p>
          Putem modifica acești termeni. Continuarea utilizării platformei după modificări
          constituie acceptarea noilor termeni.
        </p>

        <h3 style="color: #14213D; margin-top: 24px; margin-bottom: 12px;">10. Contact</h3>
        <p>
          Pentru întrebări: <a href="mailto:contact@civiti.ro" style="color: #FCA311;">contact@civiti.ro</a>
        </p>

        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          <em>Ultima actualizare: Ianuarie 2025</em>
        </p>
      </div>
    `;
  }
}