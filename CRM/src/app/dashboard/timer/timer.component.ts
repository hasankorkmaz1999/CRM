import { Component, OnDestroy, OnInit } from '@angular/core';
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
    { name: 'Germany', timeZone: 'Europe/Berlin' },
    { name: 'USA (New York)', timeZone: 'America/New_York' },
    { name: 'India', timeZone: 'Asia/Kolkata' },
    { name: 'Australia', timeZone: 'Australia/Sydney' },
  ];
  currentIndex: number = 0;
  currentZoneName: string = this.timeZones[0].name;
  hours: string = '';
  minutes: string = '';
  seconds: string = '';
  period: string = '';
  currentDate: string = '';
  animationState: string = '';
  animationDirection: string = '';
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
    this.seconds = secondsWithPeriod.split(' ')[0];
    this.period = secondsWithPeriod.split(' ')[1];
    this.currentDate = now.toLocaleDateString('en-US', {
      timeZone: this.timeZones[this.currentIndex].timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.currentZoneName = this.timeZones[this.currentIndex].name;
  }

  nextZone() {
    this.triggerAnimation('exiting', 'right');
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.timeZones.length;
      this.triggerAnimation('entering', 'right');
      this.updateTime();
    }, 200);
  }

  previousZone() {
    this.triggerAnimation('exiting', 'left');
    setTimeout(() => {
      this.currentIndex =
        (this.currentIndex - 1 + this.timeZones.length) % this.timeZones.length;
      this.triggerAnimation('entering', 'left');
      this.updateTime();
    }, 200);
  }

  triggerAnimation(state: string, direction: string) {
    this.animationState = `${state} ${direction}`;
    setTimeout(() => {
      this.animationState = '';
    }, 200);
  }
}
