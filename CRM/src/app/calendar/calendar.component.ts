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
import { Event } from '../../models/events.class';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, MatDialogActions, MatButtonModule, CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  encapsulation: ViewEncapsulation.None,
  
})
export class CalendarComponent implements OnInit {
  events: Event[] = [];


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
      this.events = data.map((eventData) => new Event(eventData)); // Konvertierung zu Event-Objekten
    
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.events.map((event) => ({
          title: event.title,
          start: event.date, // Date-Objekt aus der Klasse
          extendedProps: {
            users: event.users,
            description: event.description,
            location: event.location,
          },
        })),
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
        const newEvent = new Event({
          title: result.title?.trim(),
          date: result.date,
          users: result.users.map((user: User) => `${user.firstName} ${user.lastName}`),
        });
  
        // Validierung
        if (!newEvent.title || !newEvent.date || newEvent.users.length === 0) {
          console.error('Invalid event data:', newEvent);
          return;
        }
  
        this.events.push(newEvent);
        this.saveEventToFirestore(newEvent);
      }
    });
  }
  
  

  saveEventToFirestore(event: Event) {
    const eventCollection = collection(this.firestore, 'events');
    const eventToSave = {
      ...event,
      date: event.date.toISOString(), // Firestore benötigt ein ISO-Format
      createdAt: new Date().toISOString(),
    };
  
    addDoc(eventCollection, eventToSave)
      .then(() => console.log('Event saved successfully!'))
      .catch((error) => console.error('Error saving event:', error));
  }
}  