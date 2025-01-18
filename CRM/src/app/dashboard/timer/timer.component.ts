import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule, NgxChartsModule, MatSliderModule, FormsModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TimerComponent {
  duration: number = 1; // Initialdauer in Minuten
  remainingTime: number = 1; // Verbleibende Zeit in Minuten
  elapsed: number = 0; // Verstrichene Zeit in Minuten
  interval: any;
  isRunning: boolean = false;

  colorScheme = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#FF6347', '#90EE90'], // Farben für das Diagramm
  };

  chartData = [
    { name: 'Verbleibende Zeit', value: this.remainingTime },
    { name: 'Abgelaufene Zeit', value: this.elapsed },
  ];

  // Timer starten
  startTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.interval = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime = Math.max(0, this.remainingTime - 1 / 60); // Zeit reduzieren
        this.elapsed = this.duration - this.remainingTime; // Verstrichene Zeit berechnen
        this.updateChartData();
      } else {
        this.pauseTimer(); // Timer stoppen, wenn Zeit abgelaufen ist
      }
    }, 1000);
  }

  // Timer pausieren
  pauseTimer() {
    clearInterval(this.interval);
    this.isRunning = false;
  }

  // Timer zurücksetzen
  resetTimer() {
    this.pauseTimer();
    this.remainingTime = this.duration; // Verbleibende Zeit anpassen
    this.elapsed = 0; // Verstrichene Zeit zurücksetzen
    this.updateChartData();
  }

  // Aktualisiert die Diagrammdaten
  updateChartData() {
    this.chartData = [
      { name: 'Verbleibende Zeit', value: Math.max(0, this.remainingTime) },
      { name: 'Abgelaufene Zeit', value: Math.max(0, this.elapsed) },
    ];
  }

  // Slider-Änderung verarbeiten
  onSliderChange(): void {
    this.remainingTime = this.duration; // Verbleibende Zeit anpassen
    this.resetTimer(); // Timer zurücksetzen
  }
}
