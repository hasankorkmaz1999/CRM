import { Component, OnInit } from '@angular/core';
import {
  CalendarEvent,
  CalendarView,
  CalendarModule,
  CalendarDateFormatter,
  DateAdapter,
  CalendarUtils,
  CalendarA11y,
  CalendarEventTitleFormatter,
} from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { CommonModule } from '@angular/common';
import { addHours } from 'date-fns';

@Component({
  selector: 'app-angular-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule],
  providers: [
    CalendarUtils, // Provider für CalendarUtils
    CalendarA11y, // Provider für CalendarA11y
    CalendarEventTitleFormatter, // Provider für CalendarEventTitleFormatter hinzufügen
    {
      provide: CalendarDateFormatter,
      useClass: CalendarDateFormatter,
    },
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
  ],
  templateUrl: './angular-calendar.component.html',
  styleUrls: ['./angular-calendar.component.scss'],
})
export class AngularCalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];

  constructor() {}

  ngOnInit(): void {
    this.events = [
      {
        start: addHours(new Date(), 1),
        end: addHours(new Date(), 2),
        title: 'Event 1',
      },
    ];
  }
}
