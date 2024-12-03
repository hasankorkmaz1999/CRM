import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Event } from '../../models/events.class';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';
import { MatDialog } from '@angular/material/dialog';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogDetailsComponent } from './log-details/log-details.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, EventDetailsComponent],
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

  constructor(private firestore: Firestore, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadEvents();
    this.startLiveCountdown();
    this.loadLogs();
  }

  openLogDetails(log: any) {
    this.dialog.open(LogDetailsComponent, {
      data: log,
      width: '500px',
      autoFocus: false,
    });
  }

  loadLogs() {
    const logsCollection = collection(this.firestore, 'logs');
    collectionData(logsCollection, { idField: 'id' }).subscribe((data) => {
      this.logs = data.map((log: any) => {
        if (log.timestamp) {
          try {
            log.timestamp = new Date(log.timestamp);
          } catch (error) {
            console.warn('Invalid timestamp format:', log.timestamp);
            log.timestamp = null;
          }
        } else {
          log.timestamp = null;
        }

        return log;
      });

      this.logs.sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      );
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
        return `New ${entityType} (${displayName}) has been added.`;
      case 'edit':
        return `${entityType} (${displayName}) has been edited.`;
      case 'delete':
        return `${entityType} (${displayName}) has been deleted.`;
      default:
        return `${entityType} (${displayName}) has been updated.`;
    }
  }

  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      const events = data.map((eventData: any) => new Event(eventData));

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      this.totalEvents = events.length;

      this.eventsToday = events.filter((event) =>
        this.isEventToday(new Date(event.date))
      ).length;

      this.eventsThisWeek = events.filter(
        (event) =>
          new Date(event.date) >= startOfWeek &&
          new Date(event.date) <= endOfWeek
      ).length;

      this.upcomingEvents = events
        .filter((event) => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
      },
      width: '500px',
      autoFocus: false,
    });
  }
}
