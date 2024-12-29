

import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserComponent } from './user/user.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CustomerComponent } from './customer/customer.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { CustomerDetailComponent } from './customer/customer-detail/customer-detail.component';
import { UserDetailComponent } from './user/user-detail/user-detail.component';
import { AllLogsComponent } from './all-logs/all-logs.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from './legal-notice/legal-notice.component';
import { AngularCalendarComponent } from './calendar/angular-calendar/angular-calendar.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Standardroute zur Login-Seite
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user', component: UserComponent },
  {path: 'user/:id', component: UserDetailComponent},
  { path: 'calendar', component: CalendarComponent },
  { path: 'customer', component: CustomerComponent },
  { path: 'statistics', component: StatisticsComponent },
  {path: 'user/:id', component: UserDetailComponent},
  { path: 'customer-details/:id', component: CustomerDetailComponent },
  {path: 'customer/:id', component: CustomerDetailComponent},
  { path: 'user-details/:id', component: UserDetailComponent },
  { path: 'logs', component: AllLogsComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'legal-notice', component: LegalNoticeComponent },
  { path: 'calendar-angular', component: AngularCalendarComponent },
  
];
