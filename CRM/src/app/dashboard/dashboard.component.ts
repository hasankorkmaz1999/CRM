import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Event } from '../../models/events.class';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Todo } from '../../models/todo.class';
import { Thread } from '../../models/thread.class';
import { TodoService } from '../shared/todo.service';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { TimerComponent } from './timer/timer.component';
import { User } from '../../models/user.class';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    SharedModule,
    EventDetailsComponent,
    RouterModule,
    NgxChartsModule,
    TimerComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DashboardComponent implements OnInit {
  events: Event[] = [];
  upcomingEvents: Event[] = [];
  totalEvents: number = 0;
  eventsThisWeek: number = 0;
  eventsToday: number = 0;
  user: User = new User();
  userEvents: any[] = [];
  logs: any[] = [];
  visibleLogs: any[] = [];
  maxVisibleLogs: number = 0;
  userId: string = '';
  currentUserName: string = 'Unknown User';
  currentUserRole: string = 'Unknown Role';
  currentUserProfilePicture: string = '/assets/img/user.png';
  threads: Thread[] = [];
  customColorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#E6511E', '#EFAB35', '#98DE4C'],
  };
  chartData: any[] = [];

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder,
    private todoService: TodoService
  ) {}

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.userId = currentUser.uid;
      this.currentUserName = currentUser.name;
      this.currentUserRole = currentUser.role;
      this.currentUserProfilePicture = currentUser.profilePicture;
    }
    this.updateCurrentUser();
    this.loadThreads();
    this.loadUserEvents();
    this.loadRecentLogs();
    this.updateKPICards();
    this.loadLogsForDashboard();
    this.todoService.chartData$.subscribe((data) => {
      this.chartData = data;
    });
  }

  updateCurrentUser(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.userId = currentUser.uid;
      this.currentUserName = currentUser.name;
      this.currentUserRole = currentUser.role;
      this.currentUserProfilePicture = currentUser.profilePicture;
    } else {
      console.warn('Kein Benutzer in localStorage gefunden.');
    }
  }

  loadThreads() {
    const threadCollection = collection(this.firestore, 'threads');
    collectionData(threadCollection, { idField: 'threadId' }).subscribe(
      (data) => {
        this.threads = (data as Thread[]).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    );
  }

  loadRecentLogs() {
    const logsCollection = collection(this.firestore, 'logs');
    collectionData(logsCollection, { idField: 'id' }).subscribe((data) => {
      const allLogs = data.map((log: any) => ({
        ...log,
        timestamp: log.timestamp ? new Date(log.timestamp) : null,
      }));
      const sortedLogs = allLogs.sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      );
      this.logs = sortedLogs;
    });
  }

  navigateToAllLogs() {
    this.router.navigate(['/logs']);
  }

  loadLogsForDashboard(): void {
    const logsCollection = collection(this.firestore, 'logs');
    const logsQuery = query(
      logsCollection,
      orderBy('timestamp', 'desc'),
      limit(4)
    );

    collectionData(logsQuery, { idField: 'id' }).subscribe((data) => {
      this.logs = data.map((log) => ({
        ...log,
        timestamp: log['timestamp'] ? new Date(log['timestamp']) : null,
      }));
    });
  }

  loadUserEvents(): void {
    const eventsCollection = collection(this.firestore, 'events');
    const now = new Date();
    collectionData(eventsCollection, { idField: 'id' }).subscribe((events: any[]) => {
      if (this.currentUserRole === 'guest') {
        this.userEvents = this.sortAndLimitEvents(events, now);
      } else {
        this.userEvents = this.filterSortAndLimitEvents(events, now, this.currentUserName);
      }
    });
  }
  
  private sortAndLimitEvents(events: any[], now: Date): any[] {
    return events
      .filter(event => this.parseAndCombineDateTime(event.date, event.time) > now)
      .sort((a, b) => this.parseAndCombineDateTime(a.date, a.time).getTime() - this.parseAndCombineDateTime(b.date, b.time).getTime())
      .slice(0, 6); 
  }
  
  private filterSortAndLimitEvents(events: any[], now: Date, userName: string): any[] {
    return events
      .filter(event =>
        event.users &&
        Array.isArray(event.users) &&
        event.users.includes(userName) &&
        this.parseAndCombineDateTime(event.date, event.time) > now
      )
      .sort((a, b) => this.parseAndCombineDateTime(a.date, a.time).getTime() - this.parseAndCombineDateTime(b.date, b.time).getTime())
      .slice(0, 6); 
  }
  
  parseAndCombineDateTime(dateString: string, timeString: string): Date {
    try {
      const [time, meridiem] = timeString.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const isPM = meridiem === 'PM';
      const parsedDate = new Date(dateString);
      parsedDate.setHours(isPM && hours !== 12 ? hours + 12 : hours === 12 ? 0 : hours);
      parsedDate.setMinutes(minutes || 0);
      parsedDate.setSeconds(0);
      parsedDate.setMilliseconds(0);
      return parsedDate;
    } catch (error) {
      console.error('Error parsing and combining date and time:', error);
      return new Date(NaN);
    }
  }

  updateKPICards(): void {
    const eventCollection = collection(this.firestore, 'events');
    const now = new Date();
    collectionData(eventCollection, { idField: 'id' }).subscribe(
      (events: any[]) => {
        const validEvents = events
          .map((event) => ({...event, date: this.combineDateTime(event.date, event.time),
          }))
          .filter((event) =>event.date instanceof Date && !isNaN(event.date.getTime()));
        this.totalEvents = validEvents.length;
        this.eventsToday = validEvents.filter((event) =>this.isEventToday(event.date)
        ).length;
        this.eventsThisWeek = validEvents.filter((event) =>
          this.isEventInThisWeek(event.date)
        ).length;
      }
    );
  }

  isEventToday(eventDate: Date): boolean {
    const today = new Date();
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
  }

  isEventInThisWeek(eventDate: Date): boolean {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    return eventDate >= startOfWeek && eventDate <= endOfWeek;
  }

  combineDateTime(dateString: string, timeString: string): Date {
    try {
      if (!dateString || !timeString) return new Date(NaN);
      const combinedString = `${dateString} ${timeString}`;
      const combinedDate = new Date(combinedString);
      return isNaN(combinedDate.getTime()) ? new Date(NaN) : combinedDate;
    } catch (error) {
      console.error('Error combining date and time:', error);
      return new Date(NaN);
    }
  }

  openEventDetails(event: Event) {
    const userNames = [...event.users, event.createdBy].filter(name => name !== undefined) as string[];
  
    this.loadUserProfilePictures(userNames).then((userProfileMap) => {
      this.dialog.open(EventDetailsComponent, {
        data: {
          id: event.id,
          type: event.type,
          description: event.description,
          date: event.date,
          time: event.time,
          users: this.formatUsers(event.users, userProfileMap),
          createdBy: this.formatCreatedBy(event.createdBy ?? 'Unknown', userProfileMap),
          source: 'dashboard',
        },
        autoFocus: false,
      });
    });
  }
  
  private async loadUserProfilePictures(userNames: string[]): Promise<Map<string, string>> {
    const usersFromFirestore = await this.getUsersFromFirestore();
    const userProfileMap = new Map<string, string>();
  
    userNames.forEach((name) => {
      const user = usersFromFirestore.find((u) => `${u.firstName} ${u.lastName}` === name);
      userProfileMap.set(name, user?.profilePicture || '/assets/img/user.png');
    });
  
    return userProfileMap;
  }
  
  private async getUsersFromFirestore(): Promise<any[]> {
    const userCollection = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(userCollection);
    return querySnapshot.docs.map((doc) => doc.data());
  }
  
  private formatUsers(userNames: string[], userProfiles: Map<string, string>): any[] {
    return userNames.map((name) => ({
      name: name || 'Unknown User',
      profilePicture: userProfiles.get(name) || '/assets/img/user.png',
    }));
  }
  
  private formatCreatedBy(createdBy: string, userProfiles: Map<string, string>): any {
    return {
      name: createdBy,
      profilePicture: userProfiles.get(createdBy) || '/assets/img/user.png',
    };
  }
  
  getEventClass(eventType: string): string {
    switch (eventType?.toLowerCase()) {
      case 'webinar':
        return 'event-webinar';
      case 'meeting':
        return 'event-meeting';
      case 'workshop':
        return 'event-workshop';
      default:
        return 'event-other';
    }
  }

  goToUserAndOpenDialog(): void {
    this.router.navigate(['/user'], { queryParams: { addUser: true } });
  }

  goToCustomerAndOpenDialog(): void {
    this.router.navigate(['/customer'], {
      queryParams: { addCustomer: 'true' },
    });
  }

  goToEventAndOpenDialog(): void {
    this.router.navigate(['/calendar-angular'], {
      queryParams: { addEvent: 'true' },
    });
  }
}
