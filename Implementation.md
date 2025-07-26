# Civica Implementation Guide

## 🚨 CRITICAL: Agent Implementation Rules

This guide establishes mandatory implementation standards for the Civica **FRONTEND APPLICATION**. The agent MUST constantly reference and adhere to ALL project documentation files during development.

### **⚠️ FRONTEND ONLY - NO BACKEND IMPLEMENTATION**
- This is strictly a frontend Angular application
- Backend API will be developed separately
- ALL data MUST use mock services until API is ready
- NO real API endpoints or database connections
- NO authentication implementation (mock only)

---

## 📋 Required Documentation References

### **ALWAYS CONSULT THESE FILES:**
1. **`ux.md`** - User journey and flow specifications
2. **`Colour-Scheme.md`** - Color palette and usage guidelines
3. **`Typography-Guide.md`** - Fira Sans implementation standards
4. **`Super_Claude_Docs.md`** - Development methodology and MCP usage

### **Implementation Priority Order:**
```yaml
1. Check UX.md → Understand user flow
2. Apply Colour-Scheme.md → Use correct colors
3. Follow Typography-Guide.md → Implement Fira Sans
4. Use ngm-dev-blocks MCP → Generate Material components
```

---

## 🛠️ Angular Material Component Usage

### **MANDATORY: Use ngm-dev-blocks MCP**

The agent MUST use the `ngm-dev-blocks` MCP server for ALL UI components. DO NOT write custom components when Angular Material blocks are available.

### **Component Mapping for Civica**

```yaml
Location Selection (Page 1):
  - Use: mat-select-block
  - Reference: ux.md → "Entry & Location Selection"
  - Colors: Oxford Blue labels, Orange focus states
  
Issues List (Page 2):
  - Use: mat-card-block (grid layout)
  - Reference: ux.md → "Issues Discovery"
  - Include: mat-chip for email counter
  - Typography: Follow Typography-Guide.md for card titles
  
Issue Detail (Page 3):
  - Use: mat-card-block with expansion panels
  - Reference: ux.md → "Issue Detail View"
  - Gallery: mat-image-gallery-block
  - Map: Embed within mat-card
  
Email Modal:
  - Use: mat-dialog-block
  - Reference: ux.md → "Email Template Modal"
  - Forms: mat-form-field-block
  - Buttons: mat-button-block (raised, Orange for primary)
```

### **Component Customization Rules**

```typescript
// ALWAYS apply Civica theming to Material components
@use '@angular/material' as mat;
@use './civica-theme' as civica;

// Example: Customizing mat-card for issue cards
.issue-card {
  // Reference: Colour-Scheme.md
  background-color: var(--white);
  border: 1px solid var(--platinum);
  
  // Reference: Typography-Guide.md
  .mat-card-title {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: var(--text-xl);
    color: var(--oxford-blue);
  }
  
  // Email counter styling
  .email-counter {
    .count {
      color: var(--orange-web);
      font-weight: 800;
      font-size: var(--text-2xl);
    }
  }
}
```

---

## 🎨 Theme Implementation

### **Civica Material Theme Configuration**

```typescript
// src/styles/civica-theme.scss
// MUST reference Colour-Scheme.md for all color values

@use '@angular/material' as mat;

// Define Civica palettes from Colour-Scheme.md
$civica-primary: mat.define-palette((
  50: #e3e5ea,
  100: #b9bfcb,
  200: #8b95a9,
  300: #5c6a86,
  400: #394a6c,
  500: #14213d, // Oxford Blue from Colour-Scheme.md
  600: #122037,
  700: #0e1d2f,
  800: #0b1927,
  900: #06111a,
  contrast: (
    50: black,
    100: black,
    200: black,
    300: white,
    400: white,
    500: white,
    600: white,
    700: white,
    800: white,
    900: white,
  )
));

$civica-accent: mat.define-palette((
  50: #fff3e0,
  100: #ffe0b2,
  200: #ffcc80,
  300: #ffb74d,
  400: #ffa726,
  500: #fca311, // Orange Web from Colour-Scheme.md
  600: #fb8c00,
  700: #f57c00,
  800: #ef6c00,
  900: #e65100,
  contrast: (
    50: black,
    100: black,
    200: black,
    300: black,
    400: black,
    500: white,
    600: white,
    700: white,
    800: white,
    900: white,
  )
));

// Create theme
$civica-theme: mat.define-light-theme((
  color: (
    primary: $civica-primary,
    accent: $civica-accent,
  ),
  typography: mat.define-typography-config(
    $font-family: '"Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ),
));

// Apply theme
@include mat.all-component-themes($civica-theme);

// Override Material defaults to match Civica style
.mat-mdc-card {
  --mdc-elevated-card-box-shadow: 0 2px 8px rgba(20, 33, 61, 0.1);
  --mdc-elevated-card-hover-box-shadow: 0 8px 24px rgba(20, 33, 61, 0.1);
}

.mat-mdc-button.mat-accent {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
}
```

---

## 🔤 Typography Implementation

### **MUST Follow Typography-Guide.md**

```scss
// src/styles/typography.scss
// Import Fira Sans as specified in Typography-Guide.md

@import url('https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700;800&display=swap');

// Apply typography scale from Typography-Guide.md
:root {
  --font-primary: "Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  // Size scale from Typography-Guide.md
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
}

// Apply to Material components
.mat-typography {
  font-family: var(--font-primary);
}

// Email counter specific styling (from Typography-Guide.md)
.email-counter-number {
  font-size: var(--text-5xl);
  font-weight: 800;
  color: var(--orange-web);
}
```

---

## 📱 User Journey Implementation

### **STRICT ADHERENCE to ux.md**

```typescript
// Route structure MUST match ux.md user journey
const routes: Routes = [
  {
    path: '',
    redirectTo: '/location',
    pathMatch: 'full'
  },
  {
    path: 'location',
    component: LocationSelectionComponent, // Page 1 from ux.md
    data: { animation: 'LocationPage' }
  },
  {
    path: 'issues',
    component: IssuesListComponent, // Page 2 from ux.md
    data: { animation: 'IssuesPage' }
  },
  {
    path: 'issue/:id',
    component: IssueDetailComponent, // Page 3 from ux.md
    data: { animation: 'DetailPage' }
  }
];
```

### **Component Implementation Checklist**

#### **LocationSelectionComponent**
- [ ] Use mat-select-block for dropdowns
- [ ] Pre-populate with hardcoded values (Bucharest, Sector 5)
- [ ] Apply Oxford Blue labels, Orange focus states
- [ ] Continue button uses Orange (accent) color

#### **IssuesListComponent**
- [ ] Use mat-card-block in responsive grid
- [ ] Show email counter with Orange color (Typography-Guide.md)
- [ ] Implement sort/filter as mat-select
- [ ] Hover effects from Colour-Scheme.md

#### **IssueDetailComponent**
- [ ] Gallery using mat-image-gallery-block
- [ ] Statistics bar with Orange email counter
- [ ] Authority buttons with Oxford Blue background
- [ ] Email modal using mat-dialog-block

#### **EmailTemplateModal**
- [ ] Form fields using mat-form-field-block
- [ ] Copy buttons with mat-icon
- [ ] Template formatting from ux.md
- [ ] Success toast using mat-snack-bar

---

## 🚀 Development Workflow

### **EVERY Component Creation:**

1. **Check ux.md** for user flow requirements
2. **Use ngm-dev-blocks MCP** to generate Material component
3. **Apply colors** from Colour-Scheme.md
4. **Set typography** from Typography-Guide.md
5. **Test responsive** behavior (mobile-first)

### **MCP Usage Pattern:**

```bash
# Example: Creating issue card component
/build --feature issue-card --ngm-dev-blocks --material

# The agent MUST:
# 1. Use mat-card-block as base
# 2. Apply Civica theme colors
# 3. Implement email counter with correct typography
# 4. Follow hover states from Colour-Scheme.md
```

---

## ⚠️ Common Implementation Mistakes to AVOID

### **DO NOT:**
- ❌ Create custom components when Material blocks exist
- ❌ Use default Material colors (ALWAYS use Civica palette)
- ❌ Forget to apply Fira Sans typography
- ❌ Deviate from ux.md user journey flow
- ❌ Use pixel values instead of CSS variables
- ❌ Hardcode colors (use variables from Colour-Scheme.md)

### **ALWAYS:**
- ✅ Reference documentation files before implementing
- ✅ Use ngm-dev-blocks MCP for UI generation
- ✅ Apply Civica theme to ALL components
- ✅ Test with Romanian text (diacritics)
- ✅ Ensure mobile responsiveness
- ✅ Follow email counter styling exactly

---

## 📊 Quality Checklist

Before ANY commit, verify:

- [ ] Colors match Colour-Scheme.md exactly
- [ ] Typography follows Typography-Guide.md
- [ ] User flow matches ux.md specifications
- [ ] All UI uses Angular Material components
- [ ] Mobile view is optimized
- [ ] Email counter is prominently styled
- [ ] CTAs use Orange Web color
- [ ] Headers use Oxford Blue
- [ ] Mock data services are properly typed
- [ ] No real API calls exist

---

## 🔀 Mock Data Implementation

### **MANDATORY: All Data Must Be Mocked**

```typescript
// src/app/services/mock-data.service.ts
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

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  // Mock issues for Sector 5
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
    }
  ];

  // Simulate API delay
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

  // Mock location data (hardcoded for MVP)
  getLocationData(): Observable<any> {
    return of({
      counties: [{ id: 'B', name: 'București' }],
      cities: [{ id: 'BUCURESTI', name: 'București' }],
      districts: [{ id: 'SECTOR5', name: 'Sector 5' }]
    }).pipe(delay(100));
  }
}
```

### **Mock Images Setup**

```typescript
// src/app/config/mock-assets.config.ts
export const MOCK_IMAGE_CONFIG = {
  // Placeholder images for issues
  placeholders: {
    issueThumbnail: '/assets/placeholders/issue-thumb.jpg',
    issueMain: '/assets/placeholders/issue-main.jpg',
    authorityLogo: '/assets/placeholders/authority-logo.png'
  },
  
  // Mock image service for development
  generateMockImage: (type: 'issue' | 'authority', id: string): string => {
    // In development, return placeholder
    // In production, will return real image URLs from API
    return `/assets/mock/${type}-${id}.jpg`;
  }
};
```

### **Email Service (Mock Implementation)**

```typescript
// src/app/services/email.service.ts
@Injectable({
  providedIn: 'root'
})
export class EmailService {
  
  generateEmailContent(issue: Issue, authority: Authority, userData: any): EmailTemplate {
    // This generates the email template
    // In production, template might come from backend
    return {
      to: authority.email,
      subject: `[URGENT] Solicitare de intervenție - ${issue.title} - Sector 5, București`,
      body: this.createEmailBody(issue, authority, userData)
    };
  }
  
  private createEmailBody(issue: Issue, authority: Authority, userData: any): string {
    // Template generation logic
    // Matches format from ux.md
    return `Stimate reprezentant ${authority.name},

Vă scriu pentru a vă aduce la cunoștință o problemă care necesită intervenția dumneavoastră urgentă în comunitatea noastră.

Detalii problemă:
- Locație: ${issue.location.address}
- Problemă: ${issue.description}
- Impact: ${issue.communityImpact}
- Acțiune solicitată: ${issue.desiredOutcome}

Această problemă a fost raportată la data de ${issue.dateCreated.toLocaleDateString('ro-RO')} și a fost adusă deja la cunoștința dumneavoastră de ${issue.emailsSent} cetățeni îngrijorați.

[... rest of template ...]`;
  }
  
  // Mock tracking - in production would call API
  trackEmailSent(issueId: string, authorityId: string): Observable<boolean> {
    console.log(`[MOCK] Tracking email sent for issue ${issueId} to authority ${authorityId}`);
    return of(true).pipe(delay(200));
  }
}
```

### **Environment Configuration**

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  // Make it clear this is frontend only
  apiUrl: 'MOCK_ONLY', // Will be replaced with real API URL
  useMockData: true,
  mockDataDelay: 500, // Simulate network delay
  
  // Feature flags for frontend
  features: {
    createIssue: false, // Disabled until backend ready
    userAccounts: false, // Disabled until backend ready
    realTimeUpdates: false, // Disabled until backend ready
    socialSharing: false // Disabled until backend ready
  }
};
```

### **HTTP Interceptor for Development**

```typescript
// src/app/interceptors/mock.interceptor.ts
@Injectable()
export class MockInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (environment.useMockData) {
      console.warn(`[MOCK] Intercepted API call to: ${req.url}`);
      console.warn('[MOCK] Returning mock data instead of real API call');
      
      // Prevent any real HTTP calls in development
      throw new Error('Real API calls are disabled. Backend not implemented yet.');
    }
    
    return next.handle(req);
  }
}
```

---

## 🔧 Debug Helpers

```typescript
// Development environment checks
export const environment = {
  production: false,
  // Enable to verify documentation compliance
  checkDocumentation: true,
  // Log Material component usage
  logComponentUsage: true,
  // Validate color usage
  validateColors: true
};

// Helper service to validate implementation
@Injectable()
export class CivicaValidationService {
  validateColors(element: HTMLElement): boolean {
    // Check against Colour-Scheme.md values
    const computedStyle = window.getComputedStyle(element);
    const validColors = ['#14213D', '#FCA311', '#E5E5E5', '#FFFFFF', '#000000'];
    // Implementation validation logic
  }
  
  validateTypography(element: HTMLElement): boolean {
    // Check against Typography-Guide.md
    const fontFamily = window.getComputedStyle(element).fontFamily;
    return fontFamily.includes('Fira Sans');
  }
}
```

---

## 🎯 Final Implementation Notes

1. **This guide is MANDATORY** - No exceptions
2. **Documentation drives development** - Not the other way around
3. **ngm-dev-blocks is PRIMARY** - Custom components are SECONDARY
4. **Theme consistency is CRITICAL** - Every pixel must match our design system
5. **User journey is SACRED** - Do not deviate from ux.md

The success of Civica depends on strict adherence to these implementation guidelines. Every component, every color, every font choice must align with our documentation.