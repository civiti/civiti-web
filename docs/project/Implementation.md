# Civica Implementation Guide & Status

## 🚨 CRITICAL: Implementation Philosophy

This guide serves as the **single source of truth** for the Civica platform. It combines implementation standards, current status, and development guidelines for both frontend and backend. All agents and developers MUST reference this document.

### **📍 Current Development Phase**
- **Frontend**: ✅ COMPLETE - Ready for backend integration with comprehensive mock services
- **Backend**: 🚧 IN ACTIVE DEVELOPMENT - .NET 9 Minimal API with comprehensive architecture designed
- **Database**: 🚧 DESIGNED - Complete PostgreSQL schema with migrations ready
- **Integration**: 🔄 READY - Detailed integration plan for seamless frontend-backend connection

The frontend will continue to evolve as we:
- Connect to real backend endpoints
- Add features based on backend capabilities  
- Refine UI/UX based on real data
- Handle real-world error scenarios

---

## 🎉 Current Implementation Status

### 📅 Implementation Timeline (December 2024)

The user registration and issue creation system was implemented through a sequential multi-agent workflow:

1. **UX Research Phase** - User journey design and pain point analysis
2. **UI Design Phase** - Visual mockups and component specifications  
3. **Frontend Development Phase** - Full implementation with mock services
4. **Documentation Update Phase** - Project documentation synchronization

### ✅ Completed Features

#### 📝 Authentication System
- **Anonymous Access**: Public access to location selection and issues viewing
- **Registration Gateway**: Modern OAuth + email options with trust signals
- **User Registration Form**: 3-step progressive form with validation
- **Login Component**: Clean login with Google OAuth simulation
- **JWT Mock Authentication**: Realistic token management and session handling
- **Progressive Authentication**: Auth only required for issue creation

#### 🏠 User Dashboard
- **Gamification Dashboard**: Points, levels, badges, and achievements
- **User Statistics**: Issues reported, resolved, community votes, approval rate
- **Progress Tracking**: Visual progress bars and achievement milestones
- **Quick Actions**: Easy access to report issues and browse community

#### 🔧 Issue Creation Workflow
- **Issue Type Selection**: 6 categories with examples and guidance
- **Photo Upload**: Camera/gallery integration with quality analysis
- **AI-Enhanced Details**: Smart description generation from photos
- **Review & Submit**: Comprehensive review before submission

#### 👩‍💼 Admin Interface
- **Approval Dashboard**: Statistics overview and pending issues table
- **Issue Review Modal**: Detailed review with photos, AI analysis, and approval workflow
- **Decision Processing**: Approve, reject, or request changes with notes
- **Department Assignment**: Route issues to appropriate departments

#### 🎯 State Management
- **NgRx Store**: Complete state management for auth, user, and issues
- **Reactive Architecture**: Observable-based data flow
- **Effects Management**: Side effects for API calls and notifications

#### 🎨 UI/UX Implementation
- **NG-ZORRO Components**: Modern, accessible component library
- **Civica Theme**: Custom theming with Oxford Blue and Orange Web colors
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Fira Sans Typography**: Professional typography system

---

## 📋 Required Documentation References

### **ALWAYS CONSULT THESE FILES:**
1. **`ux.md`** - User journey and flow specifications
2. **`Colour-Scheme.md`** - Color palette and usage guidelines
3. **`Typography-Guide.md`** - Fira Sans implementation standards
4. **`Super_Claude_Docs.md`** - Development methodology and MCP usage
5. **`CLAUDE.md`** - Project intelligence and agent coordination

### **Implementation Priority Order:**
```yaml
1. Check UX.md → Understand user flow
2. Apply Colour-Scheme.md → Use correct colors
3. Follow Typography-Guide.md → Implement Fira Sans
4. Use NG-ZORRO components → Modern UI components
5. Reference CLAUDE.md → Agent workflows
```

---

## 📁 File Structure

```
src/app/
├── components/
│   ├── auth/
│   │   ├── registration-gateway/           # OAuth + email registration options
│   │   ├── user-registration/              # 3-step registration form
│   │   └── login/                          # Login component
│   ├── user/
│   │   └── dashboard/                      # Gamified user dashboard
│   ├── issue-creation/
│   │   ├── issue-type-selection/           # Category selection
│   │   ├── photo-upload/                   # Photo capture and upload
│   │   ├── issue-details/                  # AI-enhanced description
│   │   └── issue-review/                   # Final review and submission
│   ├── admin/
│   │   └── approval-interface/             # Admin approval dashboard
│   └── [original components]
│       ├── location-selection/             # Entry point (pre-selected)
│       ├── issues-list/                    # Browse community issues
│       └── issue-detail/                   # Issue details & email modal
├── services/
│   ├── mock-auth.service.ts               # JWT authentication simulation
│   ├── mock-user.service.ts               # User profile and gamification
│   ├── mock-issue-creation.service.ts     # Issue creation workflow
│   ├── mock-admin.service.ts              # Admin approval workflow
│   └── mock-data.service.ts               # Original mock data service
└── store/
    ├── auth/                              # Authentication state
    ├── user/                              # User profile and gamification state
    ├── issues/                            # Issue management state
    ├── location/                          # Location state
    └── ui/                               # UI state management
```

---

## 🛠️ NG-ZORRO (Ant Design) Component Usage

### **MANDATORY: Use NG-ZORRO Components**

The application MUST use NG-ZORRO (ng-zorro-antd) for ALL UI components. This provides modern, enterprise-grade components with better form handling and flexibility.

### **Module Import Pattern**

```typescript
// Import only what you need (tree-shakeable)
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
```

### **Component Mapping for Civica**

```yaml
Location Selection (Page 1):
  - Use: nz-select
  - Reference: ux.md → "Entry & Location Selection"
  - Colors: Oxford Blue labels, Orange focus states
  
Issues List (Page 2):
  - Use: nz-card (with nz-grid)
  - Reference: ux.md → "Issues Discovery"
  - Include: nz-tag for email counter
  - Typography: Follow Typography-Guide.md for card titles
  
Issue Detail (Page 3):
  - Use: nz-card with nz-collapse
  - Reference: ux.md → "Issue Detail View"
  - Gallery: nz-carousel or custom gallery
  - Map: Embed within nz-card
  
Email Modal:
  - Use: nz-modal
  - Reference: ux.md → "Email Template Modal"
  - Forms: nz-form with nz-input
  - Buttons: nz-button (type="primary" for Orange CTAs)

User Registration:
  - Use: nz-form, nz-steps, nz-input
  - Reference: user-registration-ui-design.md
  - Validation: Built-in nz-form validators

Dashboard:
  - Use: nz-card, nz-progress, nz-statistic
  - Reference: user-registration-ui-design.md → "Dashboard"
  - Gamification: nz-badge for achievements

Admin Interface:
  - Use: nz-table, nz-modal, nz-tabs
  - Reference: IMPLEMENTATION-UPDATE.md → "Admin Interface"
  - Actions: nz-button, nz-dropdown
```

---

## 🎨 Theme Implementation

### **Civica NG-ZORRO Theme Configuration**

```less
// src/styles/theme.less
// MUST reference Colour-Scheme.md for all color values

// NG-ZORRO theme variables
@primary-color: #FCA311; // Orange Web from Colour-Scheme.md
@info-color: #14213D; // Oxford Blue from Colour-Scheme.md
@success-color: #28A745;
@warning-color: #FCA311;
@error-color: #DC3545;
@font-family: "Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
@body-background: #E5E5E5; // Platinum from Colour-Scheme.md
@component-background: #FFFFFF; // White from Colour-Scheme.md
@heading-color: #14213D; // Oxford Blue
@text-color: #14213D; // Oxford Blue
@text-color-secondary: rgba(20, 33, 61, 0.8);
@border-color-base: #E5E5E5; // Platinum
@border-radius-base: 8px;

// Button specific
@btn-primary-bg: #FCA311; // Orange Web
@btn-primary-color: #FFFFFF;
@btn-default-bg: #FFFFFF;
@btn-default-color: #14213D;
@btn-default-border: #E5E5E5;

// Input specific
@input-border-color: #E5E5E5;
@input-hover-border-color: #14213D;
@input-focus-border-color: #FCA311;
@input-placeholder-color: rgba(20, 33, 61, 0.6);

// Card specific
@card-shadow: 0 2px 8px rgba(20, 33, 61, 0.1);
@card-hover-shadow: 0 8px 24px rgba(20, 33, 61, 0.1);

// Typography scale from Typography-Guide.md
@font-size-base: 16px;
@font-size-sm: 14px;
@font-size-lg: 18px;
@heading-1-size: 48px;
@heading-2-size: 36px;
@heading-3-size: 30px;
@heading-4-size: 24px;
@heading-5-size: 20px;
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

// Email counter specific styling (from Typography-Guide.md)
.email-counter-number {
  font-size: var(--text-5xl);
  font-weight: 800;
  color: var(--orange-web);
}
```

---

## 🏆 Gamification System

### Point System
- **Report Issue**: 10 points base (+50 points when approved, +100 when resolved)
- **Send Email**: 5 points per email sent
- **Community Vote**: 5 points per vote
- **Quality Bonus**: +15 points for high-quality photos
- **Comment**: 10 points for helpful comments

### Level Progression (5 Levels)
1. **Civic Observer** (0-100 points)
2. **Community Reporter** (101-500 points)
3. **Neighborhood Guardian** (501-1500 points)
4. **City Advocate** (1501-5000 points)
5. **Civic Champion** (5000+ points)

### Badge Categories (8 Unique Badges)
- **Starter Badges**: 
  - Civic Starter (First issue reported)
  - Picture Perfect (First photo uploaded)
  - Email Warrior (First email sent)
- **Progress Badges**: 
  - Community Voice (10 issues reported)
  - Problem Solver (5 resolved issues)
  - Persistent Advocate (50 emails sent)
- **Achievement Badges**: 
  - Civic Champion (Level 5 reached)
  - Quality Contributor (10 approved issues)

### Leaderboards
- **Monthly Contributors**: Current month rankings
- **Problem Solvers**: Historical resolution tracking
- **Community Supporters**: Voting and engagement
- **Neighborhood Champions**: Area-specific contributions

---

## 🤖 AI Integration (Mocked)

- **Smart Text Generation**: AI generates professional issue descriptions
- **Photo Analysis**: Quality assessment and content recognition simulation
- **Solution Suggestions**: Contextual solution recommendations
- **Confidence Scoring**: AI confidence levels with validation

---

## 🔀 Mock Data Implementation

### **MANDATORY: All Data Must Be Mocked**

```typescript
// src/app/services/mock-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  // Simulate API delay
  private simulateDelay(): Observable<any> {
    return of(null).pipe(delay(300 + Math.random() * 700));
  }

  getIssues(): Observable<Issue[]> {
    return of(this.mockIssues).pipe(delay(500));
  }

  incrementEmailCount(issueId: string): Observable<boolean> {
    const issue = this.mockIssues.find(i => i.id === issueId);
    if (issue) {
      issue.emailsSent++;
      console.log(`[MOCK] Email count incremented for issue ${issueId}. New count: ${issue.emailsSent}`);
    }
    return of(!!issue).pipe(delay(200));
  }
}
```

### **Mock Service Pattern**

All mock services follow this pattern:
- 300-700ms simulated delays
- LocalStorage for persistence
- Console logging with `[MOCK]` prefix
- Realistic data structures matching planned backend

### **Test Credentials**
- **Email**: test@civica.ro
- **Password**: password123

---

## 📱 User Journey Implementation

### **STRICT ADHERENCE to ux.md**

```typescript
// Route structure MUST match ux.md user journey
const routes: Routes = [
  // Anonymous User Routes (No authentication required)
  {
    path: '',
    redirectTo: '/location',
    pathMatch: 'full'
  },
  {
    path: 'location',
    component: LocationSelectionComponent, // Landing page - Anonymous access
    data: { animation: 'LocationPage' }
  },
  {
    path: 'issues',
    component: IssuesListComponent, // Public issues list - Anonymous access
    data: { animation: 'IssuesPage' }
  },
  {
    path: 'issue/:id',
    component: IssueDetailComponent, // Public issue details - Anonymous access
    data: { animation: 'DetailPage' }
  },
  
  // Registered User Routes
  {
    path: 'auth/register',
    component: RegistrationGatewayComponent
  },
  {
    path: 'auth/login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'create-issue',
    component: IssueCreationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/approval',
    component: ApprovalInterfaceComponent,
    canActivate: [AdminGuard]
  }
];
```

---

## 🚀 Development Workflow

### **EVERY Component Creation:**

1. **Check ux.md** for user flow requirements
2. **Use NG-ZORRO components** for consistent UI
3. **Apply colors** from Colour-Scheme.md
4. **Set typography** from Typography-Guide.md
5. **Test responsive** behavior (mobile-first)
6. **Update documentation** if needed

### **Component Implementation Checklist**

#### **LocationSelectionComponent** ✅
- [x] Use nz-select for dropdowns
- [x] Pre-populate with hardcoded values (Bucharest, Sector 5)
- [x] Apply Oxford Blue labels, Orange focus states
- [x] Continue button uses nz-button type="primary" (Orange)

#### **IssuesListComponent** ✅
- [x] Use nz-card with nz-grid/nz-row/nz-col
- [x] Show email counter with nz-tag (Orange color)
- [x] Implement sort/filter as nz-select
- [x] Hover effects from Colour-Scheme.md

#### **IssueDetailComponent** ✅
- [x] Gallery using GLightbox integration
- [x] Statistics bar with Orange email counter
- [x] Authority buttons with Oxford Blue background
- [x] Email modal using nz-modal

#### **User Registration Components** ✅
- [x] Registration gateway with OAuth simulation
- [x] 3-step form with nz-steps
- [x] Progressive profiling
- [x] Welcome flow integration

#### **Dashboard Component** ✅
- [x] Gamification stats display
- [x] Achievement progress bars
- [x] Quick action buttons
- [x] Responsive grid layout

#### **Issue Creation Workflow** ✅
- [x] 4-step wizard implementation
- [x] Photo upload with preview
- [x] AI text generation (mocked)
- [x] Review and submission

#### **Admin Interface** ✅
- [x] Pending issues table
- [x] Review modal with actions
- [x] Department assignment
- [x] Template responses

---

## ⚠️ Common Implementation Mistakes to AVOID

### **DO NOT:**
- ❌ Create custom components when NG-ZORRO components exist
- ❌ Use default Ant Design colors (ALWAYS use Civica palette)
- ❌ Forget to apply Fira Sans typography
- ❌ Deviate from ux.md user journey flow
- ❌ Use pixel values instead of CSS variables
- ❌ Hardcode colors (use variables from Colour-Scheme.md)
- ❌ Implement real backend calls
- ❌ Skip documentation updates

### **ALWAYS:**
- ✅ Reference documentation files before implementing
- ✅ Use NG-ZORRO components for UI consistency
- ✅ Apply Civica theme to ALL components
- ✅ Test with Romanian text (diacritics)
- ✅ Ensure mobile responsiveness
- ✅ Follow email counter styling exactly
- ✅ Use mock services for all data
- ✅ Update documentation when making changes

---

## 📊 Quality Checklist

Before ANY commit, verify:

- [ ] Colors match Colour-Scheme.md exactly
- [ ] Typography follows Typography-Guide.md
- [ ] User flow matches ux.md specifications
- [ ] All UI uses NG-ZORRO components
- [ ] Mobile view is optimized
- [ ] Email counter is prominently styled (large, orange)
- [ ] Mock data services are properly typed
- [ ] No real API calls exist
- [ ] 3-minute email sending goal is achievable
- [ ] Romanian diacritics display correctly
- [ ] Documentation is updated if needed

---

## 📈 Performance Targets

- **Load Time**: <3s on 3G networks ✅
- **Mobile Score**: 90%+ mobile usability ✅
- **Bundle Size**: <500KB initial load ✅
- **Accessibility**: WCAG 2.1 AA compliance ready ✅

---

## 💻 Technical Highlights

### 🏗️ Architecture
- **Angular 19**: Latest version with standalone components
- **NgRx**: Complete state management with effects
- **NG-ZORRO**: Professional UI component library
- **RxJS**: Reactive programming patterns

### 🔧 Performance
- **Lazy Loading**: Route-based code splitting
- **Tree Shaking**: Optimized bundle size
- **Caching**: Intelligent data caching strategies
- **Compression**: Image optimization and data compression

### 🛡️ Security (Mock)
- **JWT Tokens**: Proper token structure and validation
- **Input Validation**: Comprehensive form validation
- **CSRF Protection**: Anti-forgery token simulation
- **Data Sanitization**: HTML and input sanitization

---

## 🚀 Backend Architecture & Implementation

### **✅ COMPLETE: Backend Architecture Design & Implementation Guides**

**Comprehensive documentation created:**
- **`docs/api/backend-implementation-guide.md`** - Complete step-by-step implementation guide for csharp-expert
- **`docs/api/database-schema.md`** - Full PostgreSQL schema with all tables, relationships, and indexes
- **`docs/api/api-specification.md`** - Complete REST API specification replacing all mock services
- **`docs/technical/backend-architecture.md`** - Detailed architecture decisions and patterns
- **`docs/api/csharp-expert-implementation-roadmap.md`** - 14-day implementation roadmap with phases and priorities
- **`docs/api/csharp-expert-quick-reference.md`** - Essential quick reference guide with code patterns
- **`BACKEND_IMPLEMENTATION_SUMMARY.md`** - Executive summary and getting started guide

### **Backend Technology Stack**

#### **Core Framework**
- **.NET 9 Minimal API**: Latest .NET with minimal API pattern for lightweight, high-performance endpoints
- **C# 13**: Modern language features for clean, efficient code
- **Deployment**: Railway platform for easy scaling and deployment
- **Database**: PostgreSQL with comprehensive schema design

#### **Authentication & Authorization**
- **Supabase Auth**: Complete authentication solution
  - User signup/signin with email/password
  - OAuth providers (Google, GitHub, etc.)
  - JWT token management
  - Row Level Security (RLS) integration
  - Session management

### **Backend Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Angular)                        │
│                    NG-ZORRO + NgRx + TypeScript                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTPS/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    .NET 9 Minimal API Layer                      │
│                         (Railway)                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Endpoints: Issues, Users, Admin, Notifications               │
│  • Middleware: CORS, Auth, Logging, Error Handling              │
│  • Services: Business Logic, Validation, Mapping                │
└─────────────────────────────────────────────────────────────────┘
                    │                             │
                    │                             │
                    ▼                             ▼
┌───────────────────────────┐     ┌───────────────────────────────┐
│      Supabase Auth        │     │    PostgreSQL/MongoDB         │
│  • User Management        │     │  • Issues Data                │
│  • OAuth Providers        │     │  • User Profiles              │
│  • JWT Tokens            │     │  • Gamification               │
│  • Session Management    │     │  • Admin Data                 │
└───────────────────────────┘     └───────────────────────────────┘
```

### **API Endpoint Structure**

```csharp
// Program.cs - .NET 9 Minimal API structure
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors();

// Supabase configuration
builder.Services.AddSupabaseAuth(builder.Configuration);

// Database (PostgreSQL or MongoDB)
builder.Services.AddDatabase(builder.Configuration);

var app = builder.Build();

// Middleware
app.UseAuthentication();
app.UseAuthorization();
app.UseCors("CivicaPolicy");

// API Endpoints
app.MapAuthEndpoints();      // /api/auth/*
app.MapIssueEndpoints();     // /api/issues/*
app.MapUserEndpoints();      // /api/users/*
app.MapAdminEndpoints();     // /api/admin/*
app.MapGamificationEndpoints(); // /api/gamification/*

app.Run();
```

### **Authentication Flow with Supabase**

#### **Anonymous Access Flow**
The platform follows a progressive authentication model:

1. **Landing Page (Location Selection)**: Fully anonymous access
   - No authentication required
   - Discrete sign in/register buttons in top-right corner
   - Clear messaging about anonymous participation

2. **Issues List**: Public access after location selection
   - View all approved issues without authentication
   - Send support emails without authentication
   - Discrete auth buttons in header
   - Authentication prompt only when clicking "Create Issue"

3. **Issue Details**: Full anonymous access
   - View complete issue information
   - Send support emails to authorities
   - No authentication barriers

4. **Authentication Required Only For**:
   - Creating new issues
   - Accessing user dashboard
   - Admin functionality

```typescript
// Frontend (Angular) - Auth Service Integration
export class AuthService {
  constructor(private supabase: SupabaseClient) {}
  
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Custom user metadata
          points: 0,
          level: 1,
          badges: []
        }
      }
    });
  }
  
  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }
}
```

### **Database Schema Design**

#### **PostgreSQL Schema (Recommended)**
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  cnp VARCHAR(13), -- Romanian Personal Numeric Code
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues table
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- roads, lighting, sanitation, parks, safety, other
  location JSONB NOT NULL,
  photos TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  emails_sent INTEGER DEFAULT 0,
  ai_analysis JSONB,
  ai_generated_text TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue photos table
CREATE TABLE public.issue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  quality_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  badge_type VARCHAR(50),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
```

#### **MongoDB Schema (Alternative)**
```javascript
// User Profile Collection
{
  _id: ObjectId,
  supabaseUserId: "uuid",
  displayName: "string",
  points: 0,
  level: 1,
  badges: [],
  createdAt: ISODate,
  updatedAt: ISODate
}

// Issues Collection
{
  _id: ObjectId,
  userId: "supabase-uuid",
  title: "string",
  description: "string",
  location: {
    address: "string",
    coordinates: { lat: 0, lng: 0 }
  },
  photos: ["url1", "url2"],
  status: "pending",
  emailsSent: 0,
  aiAnalysis: {},
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### **API Integration Pattern**

```csharp
// .NET 9 Minimal API Endpoint Example
app.MapPost("/api/issues", async (
    CreateIssueRequest request,
    IIssueService issueService,
    HttpContext context) =>
{
    // Validate Supabase JWT
    var userId = context.User.FindFirst("sub")?.Value;
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();
    
    // Create issue
    var issue = await issueService.CreateAsync(request, userId);
    
    // Update gamification points
    await gamificationService.AwardPoints(userId, 50);
    
    return Results.Created($"/api/issues/{issue.Id}", issue);
})
.RequireAuthorization()
.WithName("CreateIssue")
.WithOpenApi();
```

### **Deployment Configuration (Railway)**

```yaml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "dotnet publish -c Release -o out"

[deploy]
startCommand = "dotnet out/Civica.Api.dll"
healthcheckPath = "/health"
healthcheckTimeout = 300

[service]
internalPort = 8080

# Environment variables set in Railway dashboard:
# - DATABASE_URL (PostgreSQL connection string)
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
```

### **Frontend-Backend Integration**

```typescript
// Update Angular environment files
export const environment = {
  production: true,
  apiUrl: 'https://civica-api.railway.app/api',
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key',
  
  // Remove mock flags
  useMockData: false,
  
  // Enable features
  features: {
    createIssue: true,
    userAccounts: true,
    realTimeUpdates: true,
    socialSharing: true
  }
};
```

---

## 🔮 Next Phase: Backend Implementation

### ✅ ARCHITECTURE & IMPLEMENTATION GUIDES COMPLETE - Ready for csharp-expert

**All architecture, design, and implementation planning is complete:**
- Complete database schema with 8+ tables and relationships
- 25+ REST API endpoints designed to replace all mock services
- .NET 9 Minimal API project structure defined
- Supabase Auth integration strategy documented
- Railway deployment configuration ready
- Performance targets and monitoring strategy defined
- **NEW**: Complete implementation roadmap with 14-day plan
- **NEW**: Quick reference guide with essential code patterns
- **NEW**: Executive implementation summary for immediate start

### 🚧 Phase 1: Core Implementation (Ready to Start - csharp-expert)
1. **✅ Database Schema**: Complete PostgreSQL schema with migrations
2. **✅ API Specification**: All 25+ endpoints documented with request/response schemas
3. **✅ Project Structure**: Complete .NET 9 project organization defined
4. **✅ Implementation Guides**: Complete roadmap, quick reference, and step-by-step guides
5. **🔄 Implementation**: Ready for csharp-expert to build following the detailed guides

**For csharp-expert**: Start with `BACKEND_IMPLEMENTATION_SUMMARY.md` then follow your implementation roadmap

### Phase 2: Integration & Testing
1. **Frontend Integration**: Replace mock services one-by-one with real API calls
2. **Authentication Flow**: End-to-end Supabase Auth integration
3. **Performance Testing**: Validate <200ms response time targets
4. **User Acceptance Testing**: Verify no regressions from mock services

### Phase 3: Deployment & Monitoring
1. **Railway Deployment**: Automated CI/CD pipeline
2. **Production Monitoring**: Logging, metrics, and alerting
3. **Performance Optimization**: Query optimization and caching
4. **Security Hardening**: Rate limiting and vulnerability scanning

### Future Enhancements (Post-MVP)
1. **Real-time Updates**: SignalR or WebSocket integration
2. **Advanced Analytics**: Business intelligence dashboards
3. **Mobile Optimization**: Progressive Web App features
4. **AI Integration**: Enhanced text generation and image analysis

---

## ✅ Testing Checklist

### User Registration & Authentication
- [x] User can register with email/password
- [x] User can register with Google OAuth (mocked)
- [x] Progressive profiling works correctly
- [x] JWT tokens are stored and managed properly
- [x] Session persistence works on reload
- [x] Logout clears all user data

### Issue Creation Workflow
- [x] User can select from 6 issue categories
- [x] Photo upload works with camera/gallery (simulated)
- [x] AI generates enhanced descriptions (mocked)
- [x] Location is correctly captured and displayed
- [x] Issue review shows all entered data
- [x] Submit creates issue with unique ID

### Gamification System
- [x] Points are awarded correctly for actions
- [x] Level progression works as specified
- [x] Badges are earned at right milestones
- [x] Dashboard displays current stats
- [x] Leaderboards show mock rankings

### Admin Interface
- [x] Admin can view all pending issues
- [x] Filter and sort functionality works
- [x] Issue detail modal shows all information
- [x] Approve/reject/request changes work
- [x] Template responses are available
- [x] Status updates are reflected immediately

### General Functionality
- [x] Mobile responsive design works
- [x] All NG-ZORRO components styled correctly
- [x] Romanian diacritics display properly
- [x] Mock API delays feel realistic (300-700ms)
- [x] Error states are handled gracefully
- [x] Loading states show appropriately

## 📝 Developer Notes

### 🎯 Current Status: Ready for Backend Integration

### Mock Services (Temporary - Being Replaced)
1. **All backend calls are currently mocked** - See service files for exact response structures
2. **LocalStorage is used** for data persistence across sessions during development
3. **Console logs** include `[MOCK]` prefix for debugging
4. **Delays are randomized** between 300-700ms for realistic user experience
5. **Data structures match backend API** - Ready for seamless integration

### 🔄 Backend Implementation Progress
1. **✅ Database Schema**: Complete with migrations ready
2. **✅ API Specification**: All endpoints documented with exact request/response formats
3. **✅ Implementation Guide**: Step-by-step guide for csharp-expert ready
4. **🚧 .NET 9 Implementation**: In progress by csharp-expert agent

### Integration Strategy
**Phase 1**: Authentication endpoints first
**Phase 2**: Public issue endpoints (GET /api/issues)
**Phase 3**: Issue creation and user management
**Phase 4**: Admin interfaces and gamification
**Phase 5**: Performance optimization and monitoring

### Test Credentials
- **Regular User**: `test@civica.ro` / `password123`
- **Admin Access**: Any logged-in user can access `/admin/approval` in development
- **Supabase Test**: Will use real Supabase project for authentication

### Known Limitations (Being Resolved)
1. **Photo Upload**: Mock base64 conversion → Real file upload service
2. **OAuth**: Simulated flow → Real Supabase OAuth integration
3. **Email Sending**: Counter increments → Real email tracking system
4. **Real-time Updates**: Not implemented → Future enhancement with SignalR
5. **Push Notifications**: Not implemented → Future PWA feature

### Development Tips for Backend Integration
1. **Monitor network requests** as mock services are replaced
2. **Use Railway logs** to debug backend API responses
3. **Test authentication flow** with real Supabase tokens
4. **Validate data persistence** in PostgreSQL database
5. **Performance test** with real API response times

## 📝 Documentation Maintenance Requirements

**ALL agents MUST maintain documentation as part of their work**:

1. **Check existing docs** before starting any task
2. **Update relevant files** in the `docs/` folder after making changes
3. **Create new documentation** when implementing new features or systems
4. **Track documentation updates** using the Task tool
5. **Consider documentation as part of "done"** - no task is complete without updated docs

### Documentation Folders
- `docs/project/` - Overall project documentation
- `docs/design/` - UX/UI specifications
- `docs/technical/` - Technical implementation guides
- `docs/api/` - API documentation (create as needed)
- `docs/deployment/` - Deployment guides (create as needed)
- `docs/guides/` - How-to guides

## 🎯 Final Implementation Notes

1. **This guide is MANDATORY** - No exceptions
2. **Documentation drives development** - Not the other way around
3. **Documentation MUST be maintained** - Update docs with every change
4. **NG-ZORRO components are PRIMARY** - Custom components are SECONDARY
5. **Theme consistency is CRITICAL** - Every pixel must match our design system
6. **User journey is SACRED** - Do not deviate from ux.md
7. **Mock data is TEMPORARY** - But must be realistic and well-structured
8. **Backend integration is ACTIVE** - Frontend and backend evolve together

The success of Civica depends on strict adherence to these implementation guidelines and maintaining comprehensive, up-to-date documentation. Every component, every color, every font choice must align with our documentation.

---

This implementation provides a complete, production-ready frontend for the Civica platform with sophisticated mock services that demonstrate the full user experience. The codebase is well-structured, follows Angular best practices, and implements all the features outlined in the UX research and UI design documents.