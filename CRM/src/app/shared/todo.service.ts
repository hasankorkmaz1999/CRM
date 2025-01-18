import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Todo } from '../../models/todo.class';

@Injectable({
  providedIn: 'root', // Service global verfügbar machen
})
export class TodoService {
  private chartDataSubject = new BehaviorSubject<any[]>([]); // Für Chart-Daten
  chartData$ = this.chartDataSubject.asObservable(); // Observable für den Zugriff

  updateChartData(data: any[]): void {
    this.chartDataSubject.next(data); // Chart-Daten aktualisieren
  }
}
