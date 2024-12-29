import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'angular-calendar';

@NgModule({
  imports: [
    CommonModule,
    CalendarModule.forRoot(),  // Konfiguration des Kalenders
  ],
  exports: [CalendarModule],   // Exportiere das CalendarModule
})
export class CalendarModule {}
