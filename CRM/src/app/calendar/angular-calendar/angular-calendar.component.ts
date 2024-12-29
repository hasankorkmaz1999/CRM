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
import { MatDialog } from '@angular/material/dialog';

import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-angular-calendar',
  standalone: true,
  imports: [CommonModule, CalendarModule, SharedModule],
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
        return {
          id: eventData.id,
          title: eventData.type,
          start: eventDateTime, 
          end: eventDateTime,
          color: {
            primary: eventData.type === 'Meeting' ? '#ff4081' : '#3f51b5', 
            secondary: eventData.type === 'Meeting' ? '#ff80ab' : '#7986cb',
          },
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


}
