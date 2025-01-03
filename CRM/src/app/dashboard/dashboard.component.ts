import { Component, OnInit } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, updateDoc, doc } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Event } from '../../models/events.class';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';
import { MatDialog } from '@angular/material/dialog';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogDetailsComponent } from './log-details/log-details.component';
import { UserDetailComponent } from '../user/user-detail/user-detail.component';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, EventDetailsComponent, RouterModule],
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
  selectedLog: string | null = null;
  filteredLogs: any[] = []; // Begrenzte Logs mit Animation
  maxLogs: number = 6; // Begrenze auf 5 Logs

  todos: any[] = []; // To-Do-Liste
  todoForm: FormGroup; // Formular für neue Aufgaben
  userId: string = ''; // ID des aktuellen Benutzers
  progressValue: number = 0; // Fortschrittswert für die Progress-Bar
  completedTasks: number = 0; // Erledigte Aufgaben
  totalTasks: number = 0;


  constructor(
    private firestore: Firestore,
     private dialog: MatDialog,
      private router: Router,
      private fb: FormBuilder,
      private authService: AuthService
    ) {
      this.todoForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(1)]],
      });
    }

    ngOnInit(): void {
      this.loadEvents();
      this.startLiveCountdown();
      this.loadRecentLogs();
      this.updateProgressBar();
    
      this.authService.currentUser$.subscribe((user) => {
        if (user && user.uid) {
          this.userId = user.uid;
          this.loadTodos();
        } else {
          console.warn('No user or invalid user UID.');
        }
      });
      
    }
    
    
    updateProgressBar(): void {
      this.totalTasks = this.todos.length; // Gesamtanzahl der Aufgaben
      this.completedTasks = this.todos.filter((todo) => todo.completed).length; // Anzahl der erledigten Aufgaben
      this.progressValue = this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
    }
  
    trackByTodoId(index: number, todo: any): string {
      return todo.id; // Eindeutige ID für jedes To-Do
    }
    


    loadTodos() {
      const todosCollection = collection(this.firestore, 'todos');
      collectionData(todosCollection, { idField: 'id' }).subscribe((data) => {
        this.todos = data.filter((todo: any) => todo.userId === this.userId); // Benutzerbezogene To-Dos
        this.updateProgressBar(); // Fortschritt aktualisieren
      });
    }
    

  // Neue Aufgabe hinzufügen
  addTodo() {
    const newTodo = {
      title: this.todoForm.value.title,
      completed: false,
      userId: this.userId,
      createdAt: new Date(),
    };

    const todosCollection = collection(this.firestore, 'todos');
    addDoc(todosCollection, newTodo).then(() => {
      this.todoForm.reset(); // Formular zurücksetzen
    });
  }

  // Aufgabe als erledigt markieren
  toggleTodoCompletion(todo: any) {
    const todoDoc = doc(this.firestore, `todos/${todo.id}`);
    updateDoc(todoDoc, { completed: !todo.completed });
  }
  

  // Aufgabe löschen
  deleteTodo(todoId: string) {
    const todoDoc = doc(this.firestore, `todos/${todoId}`);
    deleteDoc(todoDoc);
    this.updateProgressBar(); 
  }

 

  navigateToAllLogs() {
    this.router.navigate(['/logs']); 
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

      // Begrenze auf die letzten 5 Logs
      this.filteredLogs = sortedLogs.slice(0, this.maxLogs).map((log, index) => ({
        ...log,
      }));
    });
  }


  generateLogMessage(log: any): string {
    const entityType = log.entityType
      ? log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)
      : 'Entity';
    const action = log.action || 'updated';
    const type = log.details?.type || '';
    const firstName = log.details?.firstName || '';
    const lastName = log.details?.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const displayName = type || fullName || 'Unknown';

    switch (action) {
      case 'add':
        return `New ${entityType} ${displayName} has been added.`;
      case 'edit':
        return `${entityType} ${displayName} has been edited.`;
      case 'delete':
        return `${entityType} ${displayName} has been deleted.`;
      default:
        return `${entityType} ${displayName} has been updated.`;
    }
  }

  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      const events = data.map((eventData: any) => {
        const parsedDate = this.combineDateTime(eventData.date, eventData.time); // Datum & Zeit kombinieren
        return new Event({ ...eventData, date: parsedDate });
      });
  
      const now = new Date(); // Aktuelle Zeit berücksichtigen
  
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
  
      this.totalEvents = events.length;
  
      this.eventsToday = events.filter((event) =>
        this.isEventToday(event.date)
      ).length;
  
      this.eventsThisWeek = events.filter(
        (event) => event.date >= startOfWeek && event.date <= endOfWeek
      ).length;
  
      this.upcomingEvents = events
        .filter((event) => event.date >= now) // Hier "now" statt "today" verwenden
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 6);
    });
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
  
  
  

  isEventToday(eventDate: Date): boolean {
    if (!(eventDate instanceof Date) || isNaN(eventDate.getTime())) {
      console.warn('Invalid eventDate:', eventDate);
      return false;
    }
  
    const today = new Date();
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    );
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
        type: event.type, // Typ des Events
        description: event.description,
        date: event.date,
        users: event.users,
        time: event.time,
        createdBy: event.createdBy,
        source: 'dashboard',
      },
      width: '500px',
      autoFocus: false,
    });
  }

  openLogDetails(log: any) {
    this.dialog.open(LogDetailsComponent, {
      data: log,
      width: '500px',
      autoFocus: false,
    });
  }

  
  openAddedEventDetails(log: any) {
    console.log('Log details:', log.details); // Prüfe, was in log.details enthalten ist
    const event = {
      id: log.details?.id || '',
      type: log.details?.type || 'Unknown',
      description: log.details?.description || '',
      date: log.details?.date || '',
      time: log.details?.time || '',
      users: log.details?.users || [],
      createdBy: log.details?.createdBy || '',
    };
    
    this.dialog.open(EventDetailsComponent, {
      data: {
        ...event,
        source: 'dashboard', // Hier als Indikator für Anzeige ohne Bearbeiten/Löschen
      },
      width: '500px',
      autoFocus: false,
    });
  }
  
  

  navigateToUserDetails(log: any) {
    if (log.entityType === 'user' && log.details?.id) {
      // Navigiere zur Benutzer-Detailansicht
      this.router.navigate(['/user-details', log.details.id]);
    } else {
      console.warn('Log does not contain valid user details or ID.');
    }
  }


  navigateToCustomerDetails(log: any) {
    if (log.entityType === 'customer' && log.details?.id) {
      // Navigiere zur Kunden-Detailansicht
      this.router.navigate(['/customer-details', log.details.id]);
    } else {
      console.warn('Log does not contain valid customer details or ID.');
    }
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
    this.router.navigate(['/customer'], { queryParams: { addCustomer: 'true' } });
  }
  
  // Methode für Add New Event
  goToEventAndOpenDialog(): void {
    this.router.navigate(['/calendar-angular'], { queryParams: { addEvent: 'true' } });
  }
  
  
  
}
