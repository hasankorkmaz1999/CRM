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
import { addHours, addMonths, subMonths } from 'date-fns';
import { SelectUserComponent } from '../select-user/select-user.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SharedModule } from '../../shared/shared.module';
import { EventDetailsComponent } from '../event-details/event-details.component';

@Component({
  selector: 'app-angular-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, SharedModule, MatDialogModule, EventDetailsComponent],
  providers: [
    CalendarUtils,
    CalendarA11y, 
    CalendarEventTitleFormatter, 
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
  selectedEvent: any = null;

  constructor(private firestore: Firestore, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadEvents(); 
  }

  loadEvents(): void {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      console.log('Original Data from Firestore:', data);
      this.events = data.map((eventData: any) => {
        const eventDateTime = this.parseAndCombineDateTime(eventData.date, eventData.time); // Datum und Zeit kombinieren
        const eventType = eventData.type; // Event-Typ ermitteln
  
        // Farben basierend auf Event-Typ
        let eventColor = { primary: '#3f51b5', secondary: '#7986cb' }; // Standardfarbe
        if (eventType === 'Meeting') {
          eventColor = { primary: '#ff4081', secondary: '#ff80ab' };
        } else if (eventType === 'Webinar') {
          eventColor = { primary: '#3f51b5', secondary: '#81c784' };
        } else if (eventType === 'Workshop') {
          eventColor = { primary: '#fff', secondary: '#ffb74d' };
        } else if (eventType === 'Other') {
          eventColor = { primary: '#a3a3a6', secondary: '#ba68c8' };
        }
  
        return {
          id: eventData.id,
          title: eventData.type,
          start: eventDateTime, 
          end: eventDateTime,
          color: eventColor, // Dynamische Farbzuweisung
          meta: {
            users: eventData.users || [],
            description: eventData.description || '',
            createdBy: eventData.createdBy || '',
            createdAt: eventData.createdAt || '',
            time: eventData.time || 'No time provided',
          },
        } as CalendarEvent;
      });
      console.log('Processed Events:', this.events);
    });
  }
  
  
  
  
  parseAndCombineDateTime(dateString: string, timeString: string): Date {
    if (!dateString || !timeString) {
      console.warn('Invalid date or time:', dateString, timeString);
      return new Date(); 
    }
  
    try {
      
      const formattedDate = new Date(dateString).toISOString().split('T')[0]; 
      const [time, meridiem] = timeString.split(' '); 
      let [hours, minutes] = time.split(':').map(Number);
  
      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }
  
      const combinedDateTime = `${formattedDate}T${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:00`;
  
      return new Date(combinedDateTime);
    } catch (error) {
      console.error('Error parsing date/time:', error);
      return new Date();
    }
  }
  
  


  

  previousMonth(): void {
    this.viewDate = subMonths(this.viewDate, 1); 
  }

  nextMonth(): void {
    this.viewDate = addMonths(this.viewDate, 1); 
  }


  openAddEventDialog(): void {
    const dialogRef = this.dialog.open(SelectUserComponent, {
      autoFocus: false, 
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reload') {
        this.loadEvents();
      }
    });
  }


  handleEventClick(event: any): void {
    console.log('Clicked Event:', event); // Debugging
    this.selectedEvent = {
      id: event?.id || 'Unknown ID',
      type: event?.title || 'Unknown Type',
      description: event?.meta?.description || 'No description provided',
      date: event?.start || new Date(),
      time: event?.meta?.time || 'No time provided',
      users: event?.meta?.users || [],
      createdBy: event?.meta?.createdBy || 'Unknown',
    };
  }
  

  closeSidebar(): void {
    this.selectedEvent = null;
  }
  
  

}
