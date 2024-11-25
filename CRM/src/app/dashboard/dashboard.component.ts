import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Event } from '../../models/events.class';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';
import { MatDialog } from '@angular/material/dialog';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule, EventDetailsComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  events: Event[] = [];
  upcomingEvents: Event[] = [];
  totalEvents: number = 0;
  eventsThisWeek: number = 0;
  eventsToday: number = 0;
  countdowns: { [eventId: string]: string } = {}; 

  constructor (private firestore: Firestore
    ,  private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.startLiveCountdown(); // Starte den Countdown
  }
  


  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      // Daten in Event-Objekte umwandeln und sicherstellen, dass jedes Event eine ID hat
      const events = data.map((eventData: any) => {
        if (!eventData.id) {
          console.warn('Firestore event without ID:', eventData);
        }
        return new Event(eventData);
      });
  
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Montag
  
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sonntag
  
      this.totalEvents = events.length;
  
      this.eventsToday = events.filter((event) => this.isEventToday(new Date(event.date))).length;
  
      this.eventsThisWeek = events.filter((event) =>
        new Date(event.date) >= startOfWeek && new Date(event.date) <= endOfWeek
      ).length;
  
      // Sortiere die Events nach Datum und weise sie upcomingEvents zu
      this.upcomingEvents = events
        .filter((event) => new Date(event.date) >= today) // Nur zukünftige Events
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Nach Datum sortieren
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
    interval(1000) // Aktualisiere jede Sekunde
      .pipe(
        map(() => {
          const now = new Date().getTime(); // Aktuelle Zeit in Millisekunden
          this.upcomingEvents.forEach((event) => {
            if (!event.id) {
              console.warn('Event without ID:', event);
              return; // Überspringe Events ohne ID
            }
  
            const eventTime = new Date(event.date).getTime(); // Event-Zeit in Millisekunden
            const timeDiff = eventTime - now; // Zeitdifferenz in Millisekunden
  
            if (timeDiff > 0) {
              // Berechne Stunden, Minuten, Sekunden
              const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
              const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
              const seconds = Math.floor((timeDiff / 1000) % 60);
  
              this.countdowns[event.id] = `${hours}h ${minutes}m ${seconds}s`; // Countdown speichern
            } else {
              this.countdowns[event.id] = 'Started'; // Wenn das Event begonnen hat
            }
          });
        })
      )
      .subscribe(); // Abonniere den Timer
  }
  


  openEventDetails(event: Event) {
    this.dialog.open(EventDetailsComponent, {
      data: event, // Übergabe der Event-Daten
      width: '500px', // Optional: Breite des Dialogs
      autoFocus: false,
    });
  }
}

