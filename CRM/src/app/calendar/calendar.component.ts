import { AfterViewInit, Component,CUSTOM_ELEMENTS_SCHEMA,OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, updateDoc } from '@angular/fire/firestore';
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
import { LoggingService } from '../shared/logging.service';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, MatDialogActions, MatButtonModule, CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  encapsulation: ViewEncapsulation.None,
  
})
export class CalendarComponent implements OnInit, AfterViewInit {
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
      const tooltipTitle = `${info.event.extendedProps['type']} - Users: ${userNames}`;
      const tooltip = new bootstrap.Tooltip(info.el, {
        title: tooltipTitle,
        placement: 'top',
        trigger: 'hover',
      });
    },
  };

  constructor(
    private firestore: Firestore,
    public dialog: MatDialog,
    private loggingService: LoggingService 
  ) {}

  ngOnInit(): void {
    // Andere Initialisierungen
  }

  ngAfterViewInit(): void {
    this.loadEvents(); // Events erst nach der Initialisierung laden
  }


  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      this.events = data.map((eventData) => new Event(eventData));
  
      console.log('Loaded Events:', this.events);
  
      const calendarEvents = this.events.map((event) => ({
        id: event.id,
        title: event.type, // Nur der Typ des Events wird als Titel gesetzt
        start: event.date,
        extendedProps: {
          id: event.id,
          users: event.users,
          type: event.type, // Event-Typ
          description: event.description, // Event-Beschreibung
        },
      }));
  
      console.log('Updated Calendar Events:', calendarEvents);
  
      this.calendarOptions.events = calendarEvents;
  
      if (this.calendarComponent && this.calendarComponent.getApi()) {
        const calendarApi = this.calendarComponent.getApi();
        calendarApi.removeAllEvents();
        calendarEvents.forEach((event) => calendarApi.addEvent(event));
      } else {
        console.warn('calendarComponent is not initialized or not available.');
      }
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
    console.log('Clicked Event:', event.event);
  
    const dialogRef = this.dialog.open(EventDetailsComponent, {
      data: {
        id: event.event.extendedProps['id'],
        type: event.event.extendedProps['type'], // Nur der Typ des Events
        description: event.event.extendedProps['description'], // Beschreibung
        date: event.event.start,
        users: event.event.extendedProps['users'],
      },
      autoFocus: false,
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reload') {
        this.loadEvents(); // Events neu laden
      }
    });
  }
  
  
  

  addEvent() {
    const dialogRef = this.dialog.open(SelectUserComponent);
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newEvent = new Event({
          type: result.type || 'Other', // Standardwert 'Other' verwenden
          description: result.description?.trim() || '',
          date: result.date,
          users: result.users.map((user: User) => `${user.firstName} ${user.lastName}`),
        });
  
        // Validierung
        if (!newEvent.type || !newEvent.date || newEvent.users.length === 0) {
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
      date: event.date.toISOString(),
      createdAt: new Date().toISOString(),
    };

    addDoc(eventCollection, eventToSave)
      .then((docRef) => {
        console.log('Event saved successfully with ID:', docRef.id);

        updateDoc(docRef, { id: docRef.id })
          .then(() => {
            console.log('ID added to event document');
            this.logEventAction('add', docRef.id, event.type, event.date.toISOString());
            this.loadEvents();
          })
          .catch((error) => console.error('Error updating document with ID:', error));
      })
      .catch((error) => console.error('Error saving event:', error));
  }

  logEventAction(action: string, eventId: string, type: string, timestamp: string) {
    this.loggingService.log(action, 'event', {
      id: eventId,
      type: type,
      timestamp: timestamp,
    });
  }
}