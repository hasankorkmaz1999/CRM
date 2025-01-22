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
import { extractTimeFromString } from '../../shared/formattime.service';


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

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

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
    collectionData(eventCollection, { idField: 'id' }).subscribe(async (data) => {
      const eventsWithDetails = await Promise.all(
        data.map(async (eventData: any) => {
          const eventColor = this.getEventColor(eventData.type);
          const formattedUsers = await this.fetchUsersDetails(eventData.users || []);
          const creatorDetails = await this.fetchCreatorDetails(eventData.createdBy);
          return this.createCalendarEvent(eventData, eventColor, formattedUsers, creatorDetails);
        })
      );
      this.events = eventsWithDetails.sort((a, b) => a.start.getTime() - b.start.getTime());
    });
  }




  
  private getEventColor(eventType: string): { primary: string } {
    switch (eventType) {
      case 'Meeting':
        return { primary: '#9bd414' };
      case 'Webinar':
        return { primary: '#3f51b5' };
      case 'Workshop':
        return { primary: '#3BADEB' };
      case 'Other':
        return { primary: '#53504f' };
      default:
        return { primary: '#3f51b5' };
    }
  }


  
  private async fetchUsersDetails(users: string[]): Promise<any[]> {
    const userCollection = collection(this.firestore, 'users');
  
    return Promise.all(
      users.map(async (userName: string) => {
        try {
          const [firstName, lastName] = userName.split(' ').map((name) => name.trim());
          const userQuery = query(
            userCollection,
            where('firstName', '==', firstName),
            where('lastName', '==', lastName || '')
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
  }
  


  private async fetchCreatorDetails(createdBy: string): Promise<any> {
    const userCollection = collection(this.firestore, 'users');
    try {
      const [firstName, lastName] = createdBy.split(' ').map((name) => name.trim());
      const creatorQuery = query(
        userCollection,
        where('firstName', '==', firstName),
        where('lastName', '==', lastName || '')
      );
      const creatorSnapshot = await getDocs(creatorQuery);
  
      if (!creatorSnapshot.empty) {
        return creatorSnapshot.docs[0].data();
      } else {
        return { profilePicture: '/assets/img/user.png' };
      }
    } catch (error) {
      console.error(`Error fetching creator with name ${createdBy}:`, error);
      return { profilePicture: '/assets/img/user.png' };
    }
  }
  



  private createCalendarEvent(
    eventData: any,
    eventColor: { primary: string },
    formattedUsers: any[],
    creatorDetails: any
  ): CalendarEvent {
    const [hours, minutes] = extractTimeFromString(eventData.time);
    const startDateTime = new Date(eventData.date);
    startDateTime.setHours(hours, minutes);
    return {
      id: eventData.id,
      title: eventData.type,
      start: startDateTime,
      color: eventColor,
      meta: {
        users: formattedUsers,
        description: eventData.description || '',
        createdBy: {
          name: eventData.createdBy || 'Unknown',
          profilePicture: creatorDetails['profilePicture'] || '/assets/img/user.png',
        },
        createdAt: eventData.createdAt || '',
        time: eventData.time || 'No time provided', 
      },
    } as CalendarEvent;
  }
  
  

  





  previousMonth(): void {
    this.viewDate = subMonths(this.viewDate, 1);
  }

  nextMonth(): void {
    this.viewDate = addMonths(this.viewDate, 1);
  }



  openAddEventDialog(): void {
    const buttonElement = document.activeElement as HTMLElement; 
    if (buttonElement) {
      buttonElement.blur(); 
    }
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
    this.selectedEvent = null;

    setTimeout(() => {
      const users = event?.meta?.users || [];
      const formattedUsers = users.map((user: any) => ({
        name: user.name || 'Unknown User',
        profilePicture: user.profilePicture || '/assets/img/user.png',
      }));
      this.selectedEvent = {
        id: event?.id || 'Unknown ID',
        type: event?.title || 'Unknown Type',
        description: event?.meta?.description || 'No description provided',
        date: event?.start || new Date(),
        time: event?.meta?.time || 'No time provided',
        users: formattedUsers,
        createdBy: event?.meta?.createdBy || 'Unknown',
      };
    }, 50);
  }

  closeSidebar(): void {
    this.selectedEvent = null;
  }
}

