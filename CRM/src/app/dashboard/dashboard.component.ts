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
   
  ) {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  ngOnInit(): void {
    // Benutzerinformationen direkt aus localStorage laden
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.userId = currentUser.uid;
      this.currentUserName = currentUser.name;
      this.currentUserRole = currentUser.role;
      this.currentUserProfilePicture = currentUser.profilePicture;
  
      console.log('Benutzerdetails aus localStorage:', currentUser);
    }
    this.updateCurrentUser();
    this.loadThreads();
    this.loadEvents();
    this.startLiveCountdown();
    this.loadRecentLogs();
    this.loadTodos();
    this.updateProgressBar();
  }

  updateCurrentUser(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.userId = currentUser.uid;
      this.currentUserName = currentUser.name;
      this.currentUserRole = currentUser.role;
      this.currentUserProfilePicture = currentUser.profilePicture;
  
      console.log('Benutzerdetails aktualisiert aus localStorage:', currentUser);
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

  updateProgressBar(): void {
    const todos = this.todos$.getValue(); // Hole die aktuelle Liste aus todos$
    this.totalTasks = todos.length; // Gesamtanzahl der Aufgaben
    this.completedTasks = todos.filter((todo) => todo.completed).length; // Anzahl der erledigten Aufgaben
    this.progressValue =
      this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0; // Fortschrittswert berechnen
  }

  todos$ = new BehaviorSubject<Todo[]>([]);

  async loadTodos() {
    const todosCollection = collection(this.firestore, 'todos');
    collectionData(todosCollection, { idField: 'id' }).subscribe((data) => {
      const newTodos = (data as Todo[])
        .filter((todo) => todo.userId === this.userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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

  async loadEvents(): Promise<void> {
    const eventCollection = collection(this.firestore, 'events');
    const userCollection = collection(this.firestore, 'users');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
    if (!currentUser.uid) {
      console.warn('Kein Benutzer gefunden, Events werden nicht geladen.');
      return;
    }
  
    collectionData(eventCollection, { idField: 'id' }).subscribe(async (data) => {
      const eventsWithDetails = await Promise.all(
        data.map(async (eventData: any) => {
          const parsedDate = this.combineDateTime(eventData.date, eventData.time);
  
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
  
      // Sortiere nach dem nächstgelegenen Datum
      const sortedEvents = eventsWithDetails.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
  
      // Beschränke auf die ersten 6 Events
      this.upcomingEvents = sortedEvents.slice(0, 6);
  
      console.log('Sorted and limited upcoming events:', this.upcomingEvents);
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
