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
import { Firestore, collection, collectionData, getDocs, query, where } from '@angular/fire/firestore';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SharedModule } from '../../shared/shared.module';
import { EventDetailsComponent } from '../event-details/event-details.component';

import { ActivatedRoute } from '@angular/router';
import { formatTimeTo12Hour } from '../../shared/formattime.service';

@Component({
  selector: 'app-angular-calendar',
  standalone: true,
  imports: [CommonModule ,CommonModule, CalendarModule, SharedModule, MatDialogModule, EventDetailsComponent],
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

  constructor(private firestore: Firestore,private route: ActivatedRoute, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadEvents(); 
    this.route.queryParams.subscribe((params) => {
      if (params['addEvent'] === 'true') {
        this.openAddEventDialog();
      }
    });
    
  }

  async loadEvents(): Promise<void> {
    const eventCollection = collection(this.firestore, 'events');
    const userCollection = collection(this.firestore, 'users');
  
    collectionData(eventCollection, { idField: 'id' }).subscribe(async (data) => {
      const eventsWithDetails = await Promise.all(
        data.map(async (eventData: any) => {
          // Datum und Zeit kombinieren
          const eventDateTime = this.parseAndCombineDateTime(eventData.date, eventData.time);
          const eventType = eventData.type;
  
          // Farben basierend auf Event-Typ
          let eventColor = { primary: '#3f51b5', secondary: '#7986cb' };
          if (eventType === 'Meeting') {
            eventColor = { primary: '#68d391', secondary: '#ff80ab' };
          } else if (eventType === 'Webinar') {
            eventColor = { primary: '#3f51b5', secondary: '#81c784' };
          } else if (eventType === 'Workshop') {
            eventColor = { primary: '#ee00ff', secondary: '#ffb74d' };
          } else if (eventType === 'Other') {
            eventColor = { primary: '#e9bc09', secondary: '#ba68c8' };
          }
  
          // Benutzerinformationen für die Teilnehmer abrufen
          const formattedUsers = await Promise.all(
            (eventData.users || []).map(async (userName: string) => {
              try {
                const trimmedFirstName = userName.split(' ')[0].trim();
                const trimmedLastName = userName.split(' ')[1]?.trim() || '';
  
                const userQuery = query(
                  userCollection,
                  where('firstName', '==', trimmedFirstName),
                  where('lastName', '==', trimmedLastName)
                );
                const userSnapshot = await getDocs(userQuery);
  
                if (!userSnapshot.empty) {
                  const userData = userSnapshot.docs[0].data();
                  return {
                    name: `${userData['firstName']} ${userData['lastName']}`.trim(),
                    profilePicture: userData['profilePicture'] || '/assets/img/user.png',
                  };
                } else {
                  return { name: userName, profilePicture: '/assets/img/user.png' };
                }
              } catch (error) {
                console.error(`Error fetching user with name ${userName}:`, error);
                return { name: userName, profilePicture: '/assets/img/user.png' };
              }
            })
          );
  
          // Benutzerinformationen für `createdBy` abrufen
          const creatorQuery = query(
            userCollection,
            where('firstName', '==', eventData.createdBy.split(' ')[0]),
            where('lastName', '==', eventData.createdBy.split(' ')[1])
          );
          const creatorSnapshot = await getDocs(creatorQuery);
          const creatorDetails = !creatorSnapshot.empty
            ? creatorSnapshot.docs[0].data()
            : { profilePicture: '/assets/img/user.png' };
  
          // Zeit formatieren
          const formattedTime = formatTimeTo12Hour(eventData.time || 'No time provided');
  
          return {
            id: eventData.id,
            title: eventData.type,
            start: eventDateTime,
            end: eventDateTime,
            color: eventColor,
            meta: {
              users: formattedUsers,
              description: eventData.description || '',
              createdBy: {
                name: eventData.createdBy || 'Unknown',
                profilePicture: creatorDetails['profilePicture'] || '/assets/img/user.png',
              },
              createdAt: eventData.createdAt || '',
              time: formattedTime, // Zeit formatiert setzen
            },
          } as CalendarEvent;
        })
      );
  
      // Sortiere die Events nach der Startzeit
      this.events = eventsWithDetails.sort((a, b) => a.start.getTime() - b.start.getTime());
    });
  }
  
  
  
  
  
  parseAndCombineDateTime(dateString: string, timeString: string): Date {
    const parsedDate = new Date(dateString); // Datum wird geparst
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date format:', dateString);
      return new Date(); // Rückgabe des aktuellen Datums bei ungültigem Format
    }
  
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth(); // 0-basiert
    const day = parsedDate.getDate();
  
    if (!/^\d{1,2}:\d{2} (AM|PM)$/.test(timeString)) {
      console.error('Invalid time format:', timeString);
      return new Date(); // Rückgabe des aktuellen Datums bei ungültigem Format
    }
  
    const formattedTime = formatTimeTo12Hour(timeString); // Zeit formatieren
    const [time, meridiem] = formattedTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
  
    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  
    const combinedDate = new Date(year, month, day, hours, minutes);
    return combinedDate;
  }
  
  
  
  
  
  


  

  previousMonth(): void {
    this.viewDate = subMonths(this.viewDate, 1); 
  }

  nextMonth(): void {
    this.viewDate = addMonths(this.viewDate, 1); 
  }


  openAddEventDialog(): void {
    const buttonElement = document.activeElement as HTMLElement; // Get the currently focused element
    if (buttonElement) {
      buttonElement.blur(); // Remove focus from the button
    }
  
    const dialogRef = this.dialog.open(SelectUserComponent, {
      autoFocus: false,
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reload') {
       
        this.loadEvents(); // Reload events
      }
    });
  }
  


  

  handleEventClick(event: any): void {
    this.selectedEvent = null;
  
    setTimeout(() => {
      const users = event?.meta?.users || [];
      const formattedUsers = users.map((user: any) => ({
        name: user.name || 'Unknown User',
        profilePicture: user.profilePicture || '/assets/img/user.png',
      }));
  
      const formattedTime = formatTimeTo12Hour(event?.meta?.time || 'No time provided');
  
      this.selectedEvent = {
        id: event?.id || 'Unknown ID',
        type: event?.title || 'Unknown Type',
        description: event?.meta?.description || 'No description provided',
        date: event?.start || new Date(),
        time: formattedTime, // Zeit formatiert setzen
        users: formattedUsers,
        createdBy: event?.meta?.createdBy || 'Unknown',
      };
    }, 50);
  }
  

  closeSidebar(): void {
    this.selectedEvent = null;
  }
  
  

}
