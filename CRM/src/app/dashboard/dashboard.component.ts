import {Component,OnInit,} from '@angular/core';
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
import { NgxChartsModule,  Color, ScaleType } from '@swimlane/ngx-charts';
import { TimerComponent } from "./timer/timer.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, EventDetailsComponent, RouterModule, NgxChartsModule, TimerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  events: Event[] = [];
  upcomingEvents: Event[] = [];
  totalEvents: number = 0;
  eventsThisWeek: number = 0;
  eventsToday: number = 0;
  countdowns: { [eventId: string]: string } = {};
  logs: any[] = [];
  visibleLogs: any[] = []; // Logs, die aktuell angezeigt werden
  maxVisibleLogs: number = 0; // Maximale Logs, die in den Bereich passen

 
  userId: string = ''; // ID des aktuellen Benutzers
 
  customColorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF5733', '#FFC300', '#28A745'], // Beispiel-Farben
  };
  
  
  currentUserName: string = 'Unknown User'; // Name des aktuellen Benutzers
  currentUserRole: string = 'Unknown Role'; // Rolle des aktuellen Benutzers
  currentUserProfilePicture: string = '/assets/img/user.png'; // Profilbild des aktuellen Benutzers

 
  threads: Thread[] = [];

  chartData: any[] = [];

  constructor(
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder,
    private todoService: TodoService
  ) {}

  ngOnInit(): void {
    // Lade Benutzerinformationen
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.userId = currentUser.uid;
      this.currentUserName = currentUser.name;
      this.currentUserRole = currentUser.role;
      this.currentUserProfilePicture = currentUser.profilePicture;
    }
  
    this.updateCurrentUser();
    this.loadThreads();
    this.loadEvents();
    this.startLiveCountdown();
    this.loadRecentLogs();
    this.updateKPICards();
    this.loadLogsForDashboard();
  
    // Abonniere die Chart-Daten
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
        // Sortiere die Threads nach Erstellungsdatum
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

      // Sortiere nach Timestamp (neueste zuerst)
      const sortedLogs = allLogs.sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      );

      this.logs = sortedLogs; // Speichere alle Logs
    });
  }

 
 

  navigateToAllLogs() {
    this.router.navigate(['/logs']);
  }

  loadLogsForDashboard(): void {
    const logsCollection = collection(this.firestore, 'logs');
    const logsQuery = query(logsCollection, orderBy('timestamp', 'desc'), limit(5)); // Neuesten 5 Logs abrufen

    collectionData(logsQuery, { idField: 'id' }).subscribe((data) => {
      this.logs = data.map((log) => ({
        ...log,
        timestamp: log['timestamp'] ? new Date(log['timestamp']) : null,
      }));
    });
  }

  async loadEvents(): Promise<void> {
    const eventCollection = collection(this.firestore, 'events');
    const userCollection = collection(this.firestore, 'users');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
    if (!currentUser.uid) {
      console.warn('Kein Benutzer gefunden, Events werden nicht geladen.');
      return;
    }
  
    collectionData(eventCollection, { idField: 'id' }).subscribe(async (data) => {
      const now = new Date(); // Aktuelles Datum und Uhrzeit
  
      const eventsWithDetails = await Promise.all(
        data.map(async (eventData: any) => {
          const parsedDate = this.combineDateTime(eventData.date, eventData.time);
  
          // Nur Events in der Zukunft
          if (parsedDate < now) return null;
  
          const formattedUsers = await Promise.all(
            (eventData.users || []).map(async (userName: string) => {
              try {
                const userQuery = query(
                  userCollection,
                  where('firstName', '==', userName.split(' ')[0]),
                  where('lastName', '==', userName.split(' ')[1])
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
  
          const creatorQuery = query(
            userCollection,
            where('firstName', '==', eventData.createdBy.split(' ')[0]),
            where('lastName', '==', eventData.createdBy.split(' ')[1])
          );
          const creatorSnapshot = await getDocs(creatorQuery);
          const creatorDetails = !creatorSnapshot.empty
            ? creatorSnapshot.docs[0].data()
            : { profilePicture: '/assets/img/user.png' };
  
          return {
            ...eventData,
            date: parsedDate,
            users: formattedUsers,
            createdBy: {
              name: eventData.createdBy || 'Unknown',
              profilePicture: creatorDetails['profilePicture'] || '/assets/img/user.png',
            },
          };
        })
      );
  
      // Filtere ungültige Events heraus
      const validEvents = eventsWithDetails.filter((event) => event !== null);
  
      // Sortiere nach dem nächstgelegenen Datum
      const sortedEvents = validEvents.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
  
      // Beschränke auf die ersten 6 Events
      this.upcomingEvents = sortedEvents.slice(0, 6);
  
     
    });
  }

  updateKPICards(): void {
    const eventCollection = collection(this.firestore, 'events');
    const now = new Date(); // Aktuelles Datum und Uhrzeit
  
    collectionData(eventCollection, { idField: 'id' }).subscribe((events: any[]) => {
      // Filtere Events basierend auf ihren Daten
      const validEvents = events.map((event) => ({
        ...event,
        date: this.combineDateTime(event.date, event.time),
      })).filter((event) => event.date instanceof Date && !isNaN(event.date.getTime()));
  
      // Aktualisiere die KPI-Variablen
      this.totalEvents = validEvents.length;
  
      this.eventsToday = validEvents.filter((event) => this.isEventToday(event.date)).length;
  
      this.eventsThisWeek = validEvents.filter((event) => this.isEventInThisWeek(event.date)).length;
  
     
    });
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

  
  

  startLiveCountdown() {
    interval(1000)
      .pipe(
        map(() => {
          const now = new Date().getTime();
          this.upcomingEvents.forEach((event) => {
            if (!event.id) {
              console.warn('Event without ID:', event);
              return;
            }

            const eventTime = new Date(event.date).getTime();
            const timeDiff = eventTime - now;

            if (timeDiff > 0) {
              const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
              const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
              const seconds = Math.floor((timeDiff / 1000) % 60);

              this.countdowns[event.id] = `${hours}h ${minutes}m ${seconds}s`;
            } else {
              this.countdowns[event.id] = 'Started';
            }
          });
        })
      )
      .subscribe();
  }

  openEventDetails(event: Event) {
    this.dialog.open(EventDetailsComponent, {
      data: {
        id: event.id,
        type: event.type,
        description: event.description,
        date: event.date,
        users: event.users, // Benutzerinformationen mit Profilbildern
        time: event.time,
        createdBy: event.createdBy, // Creator mit Profilbild
        source: 'dashboard',
      },
     
      autoFocus: false,
    });
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

  // Methode für Add New Event
  goToEventAndOpenDialog(): void {
    this.router.navigate(['/calendar-angular'], {
      queryParams: { addEvent: 'true' },
    });
  }






  
}
