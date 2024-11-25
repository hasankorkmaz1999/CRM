import { Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Event } from '../../models/events.class';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  events: Event[] = [];
  upcomingEvents: Event[] = [];
  totalEvents: number = 0;
  eventsThisWeek: number = 0;
  eventsToday: number = 0;

  constructor (private firestore: Firestore) {}

  ngOnInit(): void {
    this.loadEvents();
  }


  loadEvents() {
    const eventCollection = collection(this.firestore, 'events');
    collectionData(eventCollection, { idField: 'id' }).subscribe((data) => {
      // Daten in Event-Objekte umwandeln
      const events = data.map((eventData: any) => new Event(eventData));
  
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
}

