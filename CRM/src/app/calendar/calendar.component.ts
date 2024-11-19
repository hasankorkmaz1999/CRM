import { Component,CUSTOM_ELEMENTS_SCHEMA,OnInit, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule, MatDialogActions, MatButtonModule, CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
  
})
export class CalendarComponent implements OnInit {
  events: any[] = [];

  showMonthViewButton: boolean = false;

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent; // Zugriff auf FullCalendar-Instanz

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    events: this.events,
    dateClick: this.handleDateClick.bind(this), // Aufruf handleDateClick
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(private firestore: Firestore, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      this.events = data.map((event: any) => ({
        title: `${event.users.join(', ')} - ${event.title}`,
        start: event.date.toDate(),
        extendedProps: {
          users: event.users,
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