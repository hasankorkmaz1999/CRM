import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Todo } from '../../models/todo.class';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private chartDataSubject = new BehaviorSubject<any[]>([]); 
  chartData$ = this.chartDataSubject.asObservable(); 

  updateChartData(data: any[]): void {
    this.chartDataSubject.next(data); 
  }
}
