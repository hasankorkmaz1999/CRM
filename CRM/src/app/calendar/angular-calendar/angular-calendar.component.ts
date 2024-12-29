import { Component, OnInit } from '@angular/core';
import { CalendarEvent, CalendarView, CalendarModule } from 'angular-calendar';  // Kalender-Komponenten
import { addHours } from 'date-fns';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-angular-calendar',
  standalone: true,
  imports: [CalendarModule, CommonModule],  // CalendarModule importieren
  templateUrl: './angular-calendar.component.html',
  styleUrls: ['./angular-calendar.component.scss']
})
export class AngularCalendarComponent implements OnInit {
  view: CalendarView = CalendarView.Month;  // Standardansicht auf Monat setzen
  viewDate: Date = new Date();  // Aktuelles Datum
  events: CalendarEvent[] = [];  // Kalenderereignisse

  constructor() {}

  ngOnInit(): void {
    // Beispiel-Ereignis hinzufügen
    this.events = [
      {
        start: addHours(new Date(), 1),  // Startzeit
        end: addHours(new Date(), 2),    // Endzeit
        title: 'Event 1',                // Titel des Ereignisses
      },
    ];
  }
}
