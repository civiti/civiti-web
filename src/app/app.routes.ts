import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards';

// Route structure based on ux.md user journey with lazy loading
// Header config: headerTitle, showBackButton, backUrl, hideHeader
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/location',
    pathMatch: 'full'
  },
  // Authentication routes - hide header on auth pages
  {
    path: 'auth',
    children: [
      {
        path: 'register',
        loadComponent: () => import('./components/auth/registration-gateway/registration-gateway.component').then(m => m.RegistrationGatewayComponent),
        data: { animation: 'AuthPage', hideHeader: true }
      },
      {
        path: 'signup',
        loadComponent: () => import('./components/auth/user-registration/user-registration.component').then(m => m.UserRegistrationComponent),
        data: { animation: 'SignupPage', hideHeader: true }
      },
      {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
        data: { animation: 'LoginPage', hideHeader: true }
      },
      {
        path: 'callback',
        loadComponent: () => import('./components/auth/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent),
        data: { animation: 'CallbackPage', hideHeader: true }
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./components/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        data: { animation: 'ForgotPasswordPage', hideHeader: true }
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./components/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        data: { animation: 'ResetPasswordPage', hideHeader: true }
      }
    ]
  },
  // User dashboard routes - requires authentication
  {
    path: 'dashboard',
    loadComponent: () => import('./components/user/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { animation: 'DashboardPage', headerTitle: 'Panou de Control', showBackButton: true, backUrl: '/bucuresti' }
  },
  {
    path: 'my-issues',
    loadComponent: () => import('./components/user/my-issues/my-issues.component').then(m => m.MyIssuesComponent),
    canActivate: [authGuard],
    data: { animation: 'MyIssuesPage', headerTitle: 'Problemele Mele', showBackButton: true, backUrl: '/dashboard' }
  },
  {
    path: 'edit-issue/:id',
    loadComponent: () => import('./components/user/edit-issue/edit-issue.component').then(m => m.EditIssueComponent),
    canActivate: [authGuard],
    data: { animation: 'EditIssuePage', headerTitle: 'Editează Problema', showBackButton: true, backUrl: '/my-issues' }
  },
  // Issue creation routes - requires authentication
  {
    path: 'create-issue',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/issue-creation/issue-type-selection/issue-type-selection.component').then(m => m.IssueTypeSelectionComponent),
        data: { animation: 'CreateIssuePage', headerTitle: 'Raportează o Problemă', showBackButton: true, backUrl: '/bucuresti' }
      },
      {
        path: 'photo',
        loadComponent: () => import('./components/issue-creation/photo-upload/photo-upload.component').then(m => m.PhotoUploadComponent),
        data: { animation: 'PhotoUploadPage', headerTitle: 'Documentează Problema', showBackButton: true, backUrl: '/create-issue' }
      },
      {
        path: 'details',
        loadComponent: () => import('./components/issue-creation/issue-details/issue-details.component').then(m => m.IssueDetailsComponent),
        data: { animation: 'IssueDetailsPage', headerTitle: 'Detalii Problemă', showBackButton: true, backUrl: '/create-issue/photo' }
      },
      {
        path: 'authorities',
        loadComponent: () => import('./components/issue-creation/authority-selection/authority-selection.component').then(m => m.AuthoritySelectionComponent),
        data: { animation: 'AuthoritySelectionPage', headerTitle: 'Selectează Autorități', showBackButton: true, backUrl: '/create-issue/details' }
      },
      {
        path: 'review',
        loadComponent: () => import('./components/issue-creation/issue-review/issue-review.component').then(m => m.IssueReviewComponent),
        data: { animation: 'IssueReviewPage', headerTitle: 'Verificare Finală', showBackButton: true, backUrl: '/create-issue/authorities' }
      }
    ]
  },
  // Admin routes - requires admin role
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        data: { animation: 'AdminDashboardPage', headerTitle: 'Panou de Administrare', showBackButton: true, backUrl: '/bucuresti' }
      },
      {
        path: 'approval',
        loadComponent: () => import('./components/admin/approval-interface/approval-interface.component').then(m => m.ApprovalInterfaceComponent),
        data: { animation: 'AdminApprovalPage', headerTitle: 'Aprobare Probleme', showBackButton: true, backUrl: '/admin/dashboard', headerSubtitle: 'Revizuiește și aprobă sesizările comunității' }
      },
      {
        path: 'issue/:id',
        loadComponent: () => import('./components/admin/admin-issue-detail/admin-issue-detail.component').then(m => m.AdminIssueDetailComponent),
        data: { animation: 'AdminIssueDetailPage', headerTitle: 'Înapoi', showBackButton: true, backUrl: '/admin/approval' }
      },
      {
        path: 'activity',
        loadComponent: () => import('./components/admin/activity-log/activity-log.component').then(m => m.ActivityLogComponent),
        data: { animation: 'AdminActivityPage', headerTitle: 'Jurnal Activitate', showBackButton: true, backUrl: '/admin/dashboard' }
      }
    ]
  },
  // Location selection route (landing page) - hide header on landing
  {
    path: 'location',
    loadComponent: () => import('./components/location-selection/location-selection.component').then(m => m.LocationSelectionComponent),
    data: {
      animation: 'LocationPage',
      hideHeader: true,
      showFooter: true,
      seo: {
        title: 'Selectează Localitatea',
        description: 'Alege orașul tău pentru a vedea și raporta probleme locale. Platforma de participare civică pentru cetățenii din România.',
      }
    }
  },
  {
    path: 'issues',
    redirectTo: '/bucuresti',
    pathMatch: 'full'
  },
  {
    path: 'bucuresti',
    loadComponent: () => import('./components/city-hub/city-hub.component').then(m => m.CityHubComponent),
    data: {
      animation: 'CityHubPage',
      headerTitle: 'Probleme Active',
      showFooter: true,
      seo: {
        title: 'Probleme Civice în București',
        description: 'Vezi și raportează probleme locale în București. Infrastructură, mediu, siguranță publică și alte probleme raportate de cetățeni.',
      }
    }
  },
  {
    path: 'ghid',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/guides/guide-list/guide-list.component').then(m => m.GuideListComponent),
        data: {
          animation: 'GuideListPage',
          headerTitle: 'Ghid Civic',
          showFooter: true,
          seo: {
            title: 'Ghid Civic',
            description: 'Ghid de participare civică. Află-ți drepturile și cum poți raporta probleme în comunitatea ta.',
          }
        }
      },
      {
        path: ':slug',
        loadComponent: () => import('./components/guides/guide-detail/guide-detail.component').then(m => m.GuideDetailComponent),
        data: {
          animation: 'GuideDetailPage',
          headerTitle: 'Ghid Civic',
          showBackButton: true,
          backUrl: '/ghid',
          showFooter: true,
        }
      }
    ]
  },
  {
    path: 'issue/:id',
    loadComponent: () => import('./components/issue-detail/issue-detail.component').then(m => m.IssueDetailComponent),
    data: {
      animation: 'DetailPage',
      headerTitle: 'Detalii Problemă',
      showBackButton: true,
      backUrl: '/bucuresti',
    }
  },
  {
    path: 'despre',
    loadComponent: () => import('./components/about/despre.component').then(m => m.DespreComponent),
    data: {
      animation: 'DesprePage',
      headerTitle: 'Despre Civiti',
      showBackButton: true,
      backUrl: '/location',
      showFooter: true,
      seo: {
        title: 'Despre Civiti — Povestea platformei',
        description: 'Cine este în spatele Civiti, de ce a fost creată platforma, cum funcționează și cum poți contribui. Proiect independent, open source, pentru cetățenii din România.',
      }
    }
  },
  // Legal pages - public, no auth required (linked from mobile app for App Store review)
  {
    path: 'privacy',
    loadComponent: () => import('./components/legal/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    data: {
      animation: 'PrivacyPage',
      hideHeader: true,
      showFooter: true,
      seo: {
        title: 'Politica de Confidențialitate',
        description: 'Politica de confidențialitate a platformei Civiti. Află cum colectăm, utilizăm și protejăm datele tale personale.'
      }
    }
  },
  {
    path: 'terms',
    loadComponent: () => import('./components/legal/terms/terms.component').then(m => m.TermsComponent),
    data: {
      animation: 'TermsPage',
      hideHeader: true,
      showFooter: true,
      seo: {
        title: 'Termeni și Condiții',
        description: 'Termenii și condițiile de utilizare a platformei Civiti pentru cetățeni și comunități.'
      }
    }
  },
  // Fallback route
  {
    path: '**',
    redirectTo: '/location'
  }
];
