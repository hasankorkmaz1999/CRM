import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserComponent } from './user/user.component';
import { UserDetailComponent } from './user/user-detail/user-detail.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CustomerComponent } from './customer/customer.component';
import { CustomerDetailComponent } from './customer/customer-detail/customer-detail.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { LoginComponent } from './login/login.component';
import { RoleGuard } from './login/roleguard/roleguard.component';


export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' }, // Standard-Weiterleitung zur Login-Seite
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [RoleGuard] },
    { path: 'user', component: UserComponent, canActivate: [RoleGuard] },
    { path: 'user/:id', component: UserDetailComponent, canActivate: [RoleGuard] },
    { path: 'calendar', component: CalendarComponent, canActivate: [RoleGuard] },
    { path: 'customer', component: CustomerComponent, canActivate: [RoleGuard] },
    { path: 'customer/:id', component: CustomerDetailComponent, canActivate: [RoleGuard] },
    { path: 'statistics', component: StatisticsComponent, canActivate: [RoleGuard] },
    { path: '**', redirectTo: '/login' }, // Fallback für unbekannte Routen
  ];
  