import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, updateDoc, doc } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Event } from '../../models/events.class';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogDetailsComponent } from './log-details/log-details.component';
import { UserDetailComponent } from '../user/user-detail/user-detail.component';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { Todo } from '../../models/todo.class';
import { Thread } from '../../models/thread.class';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, EventDetailsComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
 



  todos: any[] = []; // To-Do-Liste
  todoForm: FormGroup; // Formular für neue Aufgaben
  userId: string = ''; // ID des aktuellen Benutzers
  progressValue: number = 0; // Fortschrittswert für die Progress-Bar
  completedTasks: number = 0; // Erledigte Aufgaben
  totalTasks: number = 0;


  currentUserName: string = 'Unknown User'; // Name des aktuellen Benutzers
  currentUserRole: string = 'Unknown Role'; // Rolle des aktuellen Benutzers
  currentUserProfilePicture: string = '/assets/img/user.png'; // Profilbild des aktuellen Benutzers


  isNewTodo: boolean = false;
  todoInputValue: string = ''; 
  selectedPriority: string = 'medium'; 


  threads: Thread[] = []; 



  constructor(
    private firestore: Firestore,
     private dialog: MatDialog,
      private router: Router,
      private fb: FormBuilder,
      private authService: AuthService,
      private cdr: ChangeDetectorRef
    ) {
      this.todoForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(1)]],
      });
    }

    ngOnInit(): void {
      // Benutzerinformationen abonnieren
      this.authService.currentUser$.subscribe((currentUser) => {
        if (currentUser) {
          this.userId = currentUser.uid;
          console.log('Benutzer-ID abgerufen:', this.userId);
        } 
      });
    
      // Benutzerdetails abonnieren
      this.authService.currentUserDetails$.subscribe((details) => {
        this.currentUserName = details.name;
        this.currentUserRole = details.role;
        this.currentUserProfilePicture = details.profilePicture;
    
        console.log('Benutzerdetails:', details);
      });
      this.loadThreads();
      this.loadEvents();
      this.startLiveCountdown();
      this.loadRecentLogs();
      this.loadTodos();
      this.todos$.subscribe(() => {
        this.updateProgressBar();
      });
   
    }
    


   

    

    loadThreads() {
      const threadCollection = collection(this.firestore, 'threads');
      collectionData(threadCollection, { idField: 'threadId' }).subscribe((data) => {
        // Sortiere die Threads nach Erstellungsdatum
        this.threads = (data as Thread[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
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
    
    
    
    
    
    updateProgressBar(): void {
      const todos = this.todos$.getValue(); // Hole die aktuelle Liste aus todos$
      this.totalTasks = todos.length; // Gesamtanzahl der Aufgaben
      this.completedTasks = todos.filter((todo) => todo.completed).length; // Anzahl der erledigten Aufgaben
      this.progressValue = this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0; // Fortschrittswert berechnen
    }
    
    
    


    todos$ = new BehaviorSubject<Todo[]>([]);

    async loadTodos() {
      const todosCollection = collection(this.firestore, 'todos');
      collectionData(todosCollection, { idField: 'id' }).subscribe((data) => {
        const newTodos = (data as Todo[])
          .filter((todo) => todo.userId === this.userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
        const currentTodos = this.todos$.getValue();
    
        // Aktualisiere nur, wenn sich die Liste geändert hat
        if (JSON.stringify(newTodos) !== JSON.stringify(currentTodos)) {
          this.todos$.next(newTodos);
          this.updateProgressBar();
        }
      });
    }
    
    
    
    
    
    
    setPriority(priority: string): void {
      this.selectedPriority = priority;
    }
    
    
    
   
    newTodo: Partial<Todo> = { description: '' };

    addTodo() {
      if (!this.userId || !this.todoInputValue.trim()) return;
    
      const newTodo: Omit<Todo, 'id'> = {
        description: this.todoInputValue.trim(),
        completed: false,
        userId: this.userId,
        createdAt: new Date().toISOString(),
        priority: this.selectedPriority,
      };
    
      const todosCollection = collection(this.firestore, 'todos');
      addDoc(todosCollection, newTodo).then(() => {
        
    
        this.todoInputValue = '';
        this.selectedPriority = 'medium';
    
        // Füge das neue Todo lokal an den Anfang hinzu
       
    
        this.isNewTodo = true; // Animation aktivieren
        setTimeout(() => (this.isNewTodo = false), 800);
      });
    }
    
    
    
    
    
    
    
    
    
    trackByTodoId(index: number, todo: any): string {
      return todo.id; // Nutzt die eindeutige ID des Todos
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
