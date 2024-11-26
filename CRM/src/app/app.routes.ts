import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserComponent } from './user/user.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CustomerComponent } from './customer/customer.component';
import { CustomerDetailComponent } from './customer/customer-detail/customer-detail.component';

export const routes: Routes = [
    {path: '', component: DashboardComponent},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'user', component: UserComponent},
    {path: 'user/:id', component: UserDetailComponent},
    { path: 'calendar', component: CalendarComponent },
    { path: 'customer', component: CustomerComponent },
    {path: 'customer/:id', component: CustomerDetailComponent},

];
