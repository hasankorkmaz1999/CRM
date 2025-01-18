import { Component, OnDestroy, OnInit} from '@angular/core';

import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  
})
export class TimerComponent implements OnInit, OnDestroy {
  timeZones = [
    { name: 'Deutschland', timeZone: 'Europe/Berlin' },
    { name: 'USA (New York)', timeZone: 'America/New_York' },
    { name: 'Indien', timeZone: 'Asia/Kolkata' }, // Optional: Weitere Zeitzonen hinzufügen
    { name: 'Australien', timeZone: 'Australia/Sydney' },
  ];
  currentIndex: number = 0;
  currentZoneName: string = this.timeZones[0].name;
  currentTime: string = '';
  interval: any;

  ngOnInit() {
    this.updateTime();
    this.interval = setInterval(() => this.updateTime(), 1000); // Zeit jede Sekunde aktualisieren
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval); // Timer entfernen
    }
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      timeZone: this.timeZones[this.currentIndex].timeZone,
    });
    this.currentZoneName = this.timeZones[this.currentIndex].name;
  }

  nextZone() {
    this.currentIndex = (this.currentIndex + 1) % this.timeZones.length; // Zum nächsten Land wechseln
    this.updateTime();
  }

  previousZone() {
    this.currentIndex =
      (this.currentIndex - 1 + this.timeZones.length) % this.timeZones.length; // Zum vorherigen Land wechseln
    this.updateTime();
  }
}
