import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Authority {
  id: string;
  name: string;
  email: string;
  type: 'primarie' | 'politie' | 'administratie' | 'other';
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  photos: string[];
  dateCreated: Date;
  status: 'open' | 'in-progress' | 'resolved';
  emailsSent: number;
  authorities: Authority[];
  currentSituation: string;
  desiredOutcome: string;
  communityImpact: string;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  // Mock issues for Sector 5, București (from Implementation.md)
  private mockIssues: Issue[] = [
    {
      id: 'ISS-001',
      title: 'Trotuar deteriorat pe Strada Libertății',
      description: 'Trotuarul este grav deteriorat cu gropi mari care pun în pericol siguranța pietonilor.',
      location: {
        address: 'Strada Libertății nr. 45, Sector 5, București',
        lat: 44.4268,
        lng: 26.1025
      },
      photos: [
        '/assets/mock-images/issue-001-main.jpg',
        '/assets/mock-images/issue-001-detail1.jpg'
      ],
      dateCreated: new Date('2024-01-15'),
      status: 'open',
      emailsSent: 47,
      authorities: [
        {
          id: 'AUTH-001',
          name: 'Primăria Sector 5',
          email: 'contact@primarie5.ro',
          type: 'primarie'
        },
        {
          id: 'AUTH-002',
          name: 'Administrația Străzilor București',
          email: 'sesizari@asb.ro',
          type: 'administratie'
        }
      ],
      currentSituation: 'Trotuarul prezintă multiple gropi și fisuri care fac deplasarea periculoasă.',
      desiredOutcome: 'Refacerea completă a trotuarului pe o lungime de 100m.',
      communityImpact: 'Peste 500 de locuitori folosesc zilnic acest trotuar pentru acces la școală și magazine.'
    },
    {
      id: 'ISS-002',
      title: 'Lipsă iluminat public în Parcul Copiilor',
      description: 'Parcul nu are iluminat funcțional, creând probleme de siguranță după lăsarea serii.',
      location: {
        address: 'Parcul Copiilor, Strada Primăverii, Sector 5',
        lat: 44.4150,
        lng: 26.0800
      },
      photos: [
        '/assets/mock-images/issue-002-main.jpg'
      ],
      dateCreated: new Date('2024-01-20'),
      status: 'open',
      emailsSent: 128,
      authorities: [
        {
          id: 'AUTH-001',
          name: 'Primăria Sector 5',
          email: 'contact@primarie5.ro',
          type: 'primarie'
        },
        {
          id: 'AUTH-003',
          name: 'Luxten Lighting',
          email: 'sesizari@luxten.ro',
          type: 'other'
        }
      ],
      currentSituation: 'Toate lămpile din parc sunt nefuncționale de peste 3 luni.',
      desiredOutcome: 'Instalarea unui sistem modern de iluminat LED în tot parcul.',
      communityImpact: 'Parcul este folosit de peste 200 de familii, dar devine inutilizabil după ora 17:00 în sezonul rece.'
    },
    {
      id: 'ISS-003',
      title: 'Gunoi necolectat pe Strada Mărgeanului',
      description: 'Gunoiul s-a adunat timp de o săptămână și creează probleme de igienă și miros neplăcut.',
      location: {
        address: 'Strada Mărgeanului nr. 23-25, Sector 5, București',
        lat: 44.4201,
        lng: 26.0912
      },
      photos: [
        '/assets/mock-images/issue-003-main.jpg',
        '/assets/mock-images/issue-003-detail1.jpg',
        '/assets/mock-images/issue-003-detail2.jpg'
      ],
      dateCreated: new Date('2024-01-25'),
      status: 'open',
      emailsSent: 73,
      authorities: [
        {
          id: 'AUTH-004',
          name: 'Compania de Salubritate Sector 5',
          email: 'reclamatii@salubritate5.ro',
          type: 'administratie'
        },
        {
          id: 'AUTH-001',
          name: 'Primăria Sector 5',
          email: 'contact@primarie5.ro',
          type: 'primarie'
        }
      ],
      currentSituation: 'Gunoiul s-a strâns pe o suprafață de aproximativ 50mp și atrage insecte și rozătoare.',
      desiredOutcome: 'Colectarea imediată a gunoiului și stabilirea unui program regulat de ridicare.',
      communityImpact: 'Afectează sănătatea a peste 300 de locuitori din zonă, incluzând copii și vârstnici.'
    },
    {
      id: 'ISS-004',
      title: 'Semaforul defect la intersecția Eroilor - Păcii',
      description: 'Semaforul nu funcționează de 3 zile, creând probleme grave de trafic și siguranță.',
      location: {
        address: 'Intersecția Eroilor cu Păcii, Sector 5, București',
        lat: 44.4186,
        lng: 26.0865
      },
      photos: [
        '/assets/mock-images/issue-004-main.jpg'
      ],
      dateCreated: new Date('2024-01-28'),
      status: 'open',
      emailsSent: 256,
      authorities: [
        {
          id: 'AUTH-005',
          name: 'Poliția Rutieră Sector 5',
          email: 'rutiera@politia5.ro',
          type: 'politie'
        },
        {
          id: 'AUTH-001',
          name: 'Primăria Sector 5',
          email: 'contact@primarie5.ro',
          type: 'primarie'
        },
        {
          id: 'AUTH-006',
          name: 'Administrația Drumurilor București',
          email: 'urgente@adb.ro',
          type: 'administratie'
        }
      ],
      currentSituation: 'Intersecția este complet necontrolată, cu risc major de accidente.',
      desiredOutcome: 'Repararea imediată a semaforului sau instalarea unui polițist pentru dirijarea traficului.',
      communityImpact: 'Această intersecție este folosită zilnic de peste 2000 de vehicule și 500 de pietoni.'
    }
  ];

  // Mock location data (hardcoded for MVP)
  private mockLocationData = {
    counties: [{ id: 'B', name: 'București' }],
    cities: [{ id: 'BUCURESTI', name: 'București' }],
    districts: [
      { id: 'SECTOR1', name: 'Sector 1' },
      { id: 'SECTOR2', name: 'Sector 2' },
      { id: 'SECTOR3', name: 'Sector 3' },
      { id: 'SECTOR4', name: 'Sector 4' },
      { id: 'SECTOR5', name: 'Sector 5' },
      { id: 'SECTOR6', name: 'Sector 6' }
    ]
  };

  // Simulate API delay for realistic experience
  private simulateDelay(): Observable<any> {
    return of(null).pipe(delay(300 + Math.random() * 700));
  }

  getIssues(): Observable<Issue[]> {
    return of(this.mockIssues).pipe(delay(500));
  }

  getIssueById(id: string): Observable<Issue | undefined> {
    const issue = this.mockIssues.find(i => i.id === id);
    return of(issue).pipe(delay(300));
  }

  incrementEmailCount(issueId: string): Observable<boolean> {
    const issue = this.mockIssues.find(i => i.id === issueId);
    if (issue) {
      issue.emailsSent++;
      // In real app, this would call backend
      console.log(`[MOCK] Email count incremented for issue ${issueId}. New count: ${issue.emailsSent}`);
    }
    return of(!!issue).pipe(delay(200));
  }

  getLocationData(): Observable<any> {
    return of(this.mockLocationData).pipe(delay(100));
  }

  // Generate email template based on issue and authority
  generateEmailTemplate(issue: Issue, authority: Authority, userData: any): EmailTemplate {
    const subject = `[URGENT] Solicitare de intervenție - ${issue.title} - Sector 5, București`;
    
    const body = `Stimate reprezentant ${authority.name},

Vă scriu pentru a vă aduce la cunoștință o problemă care necesită intervenția dumneavoastră urgentă în comunitatea noastră.

Detalii problemă:
- Locație: ${issue.location.address}
- Problemă: ${issue.description}
- Impact: ${issue.communityImpact}
- Acțiune solicitată: ${issue.desiredOutcome}

Această problemă a fost raportată la data de ${issue.dateCreated.toLocaleDateString('ro-RO')} și a fost adusă deja la cunoștința dumneavoastră de ${issue.emailsSent} cetățeni îngrijorați.

${userData.additionalComments ? `\nComentarii suplimentare:\n${userData.additionalComments}` : ''}

Vă rog să luați măsurile necesare pentru rezolvarea acestei probleme cât mai rapid posibil.

Date de contact:
Nume: ${userData.name}
Email: ${userData.email}
${userData.phone ? `Telefon: ${userData.phone}` : ''}

Vă mulțumesc pentru atenția acordată acestei probleme.

Cu respect,
${userData.name}

---
ID Problemă: ${issue.id}
Raportat prin platforma Civica`;

    return {
      to: authority.email,
      subject: subject,
      body: body
    };
  }

  // Track email sent - in production would call API
  trackEmailSent(issueId: string, authorityId: string): Observable<boolean> {
    console.log(`[MOCK] Tracking email sent for issue ${issueId} to authority ${authorityId}`);
    return this.incrementEmailCount(issueId);
  }
} 