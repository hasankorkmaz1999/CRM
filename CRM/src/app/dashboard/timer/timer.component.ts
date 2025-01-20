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
    { name: 'Indien', timeZone: 'Asia/Kolkata' },
    { name: 'Australien', timeZone: 'Australia/Sydney' },
  ];
  currentIndex: number = 0;
  currentZoneName: string = this.timeZones[0].name;
  hours: string = '';
  minutes: string = '';
  seconds: string = '';
  period: string = ''; // AM oder PM
  currentDate: string = ''; // Neues Feld für Datum und Wochentag
  isDaytime: boolean = true;
  interval: any;

  ngOnInit() {
    this.updateTime();
    this.interval = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      timeZone: this.timeZones[this.currentIndex].timeZone,
    });

    const [hours, minutes, secondsWithPeriod] = timeString.split(':');
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = secondsWithPeriod.split(' ')[0]; // Sekunden
    this.period = secondsWithPeriod.split(' ')[1]; // AM/PM

    this.currentDate = now.toLocaleDateString('en-US', {
      timeZone: this.timeZones[this.currentIndex].timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Bestimmen, ob es Tag oder Nacht ist
    const currentHour = now.toLocaleTimeString('en-US', {
      timeZone: this.timeZones[this.currentIndex].timeZone,
      hour: '2-digit',
      hour12: false,
    });
    this.isDaytime = +currentHour >= 6 && +currentHour < 18;

    this.currentZoneName = this.timeZones[this.currentIndex].name;
  }

  nextZone() {
    this.currentIndex = (this.currentIndex + 1) % this.timeZones.length;
    this.updateTime();
  }

  previousZone() {
    this.currentIndex =
      (this.currentIndex - 1 + this.timeZones.length) % this.timeZones.length;
    this.updateTime();
  }
}