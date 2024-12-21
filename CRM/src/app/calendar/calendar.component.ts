import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatDialog, MatDialogActions } from '@angular/material/dialog';
import { SelectUserComponent } from './select-user/select-user.component';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import * as bootstrap from 'bootstrap';
import { EventDetailsComponent } from './event-details/event-details.component';
import { Event } from '../../models/events.class';


@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    FullCalendarModule,
     MatButtonModule,
      CommonModule,
      MatDialogActions,
    ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent implements OnInit, AfterViewInit {
  events: Event[] = [];
  showMonthViewButton: boolean = false;

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1,
    editable: true,
    selectable: true,
   
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
    },
    eventDidMount: (info) => {
      const userNames = info.event.extendedProps['users']?.join(', ') || 'No users';
      const tooltipTitle = `${info.event.extendedProps['type']} - Users: ${userNames}`;
      new bootstrap.Tooltip(info.el, {
        title: tooltipTitle,
        placement: 'top',
        trigger: 'hover',
      });
    },
  };

  constructor(private firestore: Firestore, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  ngAfterViewInit(): void {
    if (!this.calendarComponent) {
      console.error('Calendar component is not initialized.');
      return;
    }
  }

  loadEvents(): void {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      const calendarApi = this.calendarComponent.getApi();
      if (calendarApi) {
        calendarApi.removeAllEvents();
  
        const calendarEvents = data.map((eventData: any) => {
          const combinedDateTime = this.parseAndCombineDateTime(eventData.date, eventData.time);
          return {
            id: eventData.id,
            title: eventData.type,
            start: combinedDateTime, // Kombiniertes Datum + Uhrzeit
            extendedProps: {
              id: eventData.id,
              users: eventData.users || [],
              type: eventData.type,
              description: eventData.description || '',
              createdBy: eventData.createdBy || '',
              createdAt: eventData.createdAt || '',
              time: eventData.time || 'No time provided',
            },
          };
        });
  
        calendarEvents.forEach((event) => calendarApi.addEvent(event));
      }
    });
  }
  
  
  parseAndCombineDateTime(dateString: string, timeString: string): string {
    if (!dateString || !timeString) {
      console.warn('Missing date or time:', dateString, timeString);
      return ''; // Leere Zeichenkette zurückgeben, um Fehler zu vermeiden
    }
  
    try {
      // Datum umwandeln: Extrahiere Monat, Tag und Jahr
      const dateMatch = dateString.match(/(\w+) (\d{1,2}), (\d{4})/);
      if (!dateMatch) {
        console.error('Unable to parse date string:', dateString);
        return '';
      }
  
      const [_, month, day, year] = dateMatch;
      const formattedDate = `${month} ${day}, ${year}`;
  
      // Erstelle ein Datum aus dem umgewandelten Format
      const parsedDate = new Date(formattedDate);
      if (isNaN(parsedDate.getTime())) {
        console.error('Invalid parsed date:', formattedDate);
        return '';
      }
  
      // Uhrzeitteil parsen (z.B. 8:45 AM)
      const [timePart, period] = timeString.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
  
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
  
      // Uhrzeit im Datum hinzufügen
      parsedDate.setHours(hours, minutes, 0, 0);
  
      // Rückgabe im ISO-Format
      return parsedDate.toISOString();
    } catch (error) {
      console.error('Error parsing date/time:', dateString, timeString, error);
      return '';
    }
  }
  
  
  
  

  // Bei Klick auf ein Datum zur Wochenansicht wechseln
  handleDateClick(event: any): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView('timeGridWeek', event.date);
    this.showMonthViewButton = true;
  }

  // Zur Monatsansicht zurückkehren
  switchToMonthView(): void {
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView('dayGridMonth');
    this.showMonthViewButton = false;
  }

  // Event-Details anzeigen und bearbeiten
  handleEventClick(event: any): void {
    const time = event.event.extendedProps['time'] || 'No time provided';
    console.log('Time passed to dialog:', time);
    
    const dialogRef = this.dialog.open(EventDetailsComponent, {
      data: {
        id: event.event.extendedProps['id'],
        type: event.event.extendedProps['type'],
        description: event.event.extendedProps['description'],
        date: event.event.start,
        time: time, // Hier sicherstellen, dass die Zeit korrekt ist
        users: event.event.extendedProps['users'],
        createdBy: event.event.extendedProps['createdBy'],
        source: 'calendar',
      },
      autoFocus: false,
    });
    

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reload') {
        this.loadEvents();
      }
    });
  }

  // Öffne Dialog für Event-Erstellung
  openAddEventDialog(): void {
    const dialogRef = this.dialog.open(SelectUserComponent, {
      autoFocus: false, // AutoFocus auf false setzen
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reload') {
        this.loadEvents();
      }
    });
  }
  
}
