import { Component,CUSTOM_ELEMENTS_SCHEMA,OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { MatDialog, MatDialogActions } from '@angular/material/dialog';
import { SelectUserComponent } from './select-user/select-user.component';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid'; // Tagesansicht
import interactionPlugin from '@fullcalendar/interaction'; // Ermöglicht Drag & Drop und Klick-Interaktionen
import timeGridPlugin from '@fullcalendar/timegrid'; 
import { User } from '../../models/user.class';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { EventDetailsComponent } from './event-details/event-details.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, MatDialogActions, MatButtonModule, CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  encapsulation: ViewEncapsulation.None,
  
})
export class CalendarComponent implements OnInit {
  events: any[] = [];

  showMonthViewButton: boolean = false;

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent; // Zugriff auf FullCalendar-Instanz

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1, // Montag als erster Tag der Woche
    editable: true,
    selectable: true,
    events: this.events,
    dateClick: this.handleDateClick.bind(this), // Aufruf handleDateClick
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: { // Formatierung der Event-Zeit
      hour: 'numeric',
      minute: '2-digit', // Fügt Minuten hinzu, falls nötig
      meridiem: 'short' // Zeigt am/pm statt nur p oder a
    },
    eventDidMount: (info) => {
      const userNames = info.event.extendedProps['users'].join(', ');
      let tooltipTitle = info.event.title;
    
      // Prüfen, ob die Benutzernamen bereits im Titel enthalten sind
      if (!tooltipTitle.includes(userNames)) {
        tooltipTitle = `${userNames} - ${tooltipTitle}`;
      }
    
      const tooltip = new bootstrap.Tooltip(info.el, {
        title: tooltipTitle, // Verhindert doppelte Benutzernamen
        placement: 'top',
        trigger: 'hover',
      });
    },
    
  };

  constructor(private firestore: Firestore, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      this.events = data.map((event: any) => ({
        title: event.title, // Nur der Titel, ohne Benutzernamen
        start: event.date.toDate(),
        extendedProps: {
          users: event.users, // Benutzernamen separat speichern
        },
      }));
  
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.events,
      };
    });
  }
  

  handleDateClick(event: any) {
    console.log('Date clicked:', event.dateStr);
    
    // Verwende die FullCalendar API, um die Ansicht zu wechseln
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView('timeGridWeek', event.date);
    this.showMonthViewButton = true;  // Wechsel zur Wochenansicht
  }


  switchToMonthView() {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView('dayGridMonth'); 
    this.showMonthViewButton = false;// Zur Monatsansicht wechseln
  }


  handleEventClick(event: any) {
    console.log('Event clicked:', event.event);
    
    const dialogRef = this.dialog.open(EventDetailsComponent, {
      data: {
        title: event.event.title, // Nur der Event-Titel
        date: event.event.start,
        users: event.event.extendedProps['users'], // Benutzer separat
      },
    });
  }
  

  addEvent() {
    const dialogRef = this.dialog.open(SelectUserComponent);
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newEvent = {
          title: result.title,
          date: result.date,
          users: result.users.map((user: User) => `${user.firstName} ${user.lastName}`),
        };

        this.events.push(newEvent);
        this.saveEventToFirestore(newEvent);
      }
    });
  }

  saveEventToFirestore(event: any) {
    const eventCollection = collection(this.firestore, 'events');
    addDoc(eventCollection, event)
      .then(() => console.log('Event saved'))
      .catch((error) => console.error('Error saving event:', error));
  }
}