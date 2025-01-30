import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';

@Component({
  selector: 'app-all-logs',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './all-logs.component.html',
  styleUrl: './all-logs.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class AllLogsComponent implements OnInit {
  logs: any[] = [];
  filteredLogs: any[] = [];
  selectedSort: string = 'newest';

  constructor(
    private firestore: Firestore,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadAllLogs();
  }

  loadAllLogs() {
    const logsCollection = collection(this.firestore, 'logs');
    collectionData(logsCollection, { idField: 'id' }).subscribe((data) => {
      console.log('Raw log data:', data); 
      this.logs = data.map((log) => ({
        ...log,
        timestamp: log['timestamp'] ? new Date(log['timestamp']) : null,
      }));

      this.applySortAndFilter();
    });
  }

  applySortAndFilter() {
    let sortedLogs = [...this.logs];

    switch (this.selectedSort) {
      case 'newest':
        sortedLogs.sort(
          (a, b) =>
            (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
        );
        break;
      case 'oldest':
        sortedLogs.sort(
          (a, b) =>
            (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
        );
        break;
      case 'users':
        sortedLogs = sortedLogs.filter(
          (log) => log.entityType?.toLowerCase() === 'user'
        );
        break;
      case 'customers':
        sortedLogs = sortedLogs.filter(
          (log) => log.entityType?.toLowerCase() === 'customer'
        );
        break;
      case 'events':
        sortedLogs = sortedLogs.filter(
          (log) => log.entityType?.toLowerCase() === 'event'
        );
        break;
      case 'purchases': 
        sortedLogs = sortedLogs.filter(
          (log) => log.entityType?.toLowerCase() === 'purchase'
        );
        break;
    }

    this.filteredLogs = sortedLogs.map((log, index) => ({
      ...log,
      animationDelay: `${index * 50}ms`,
    }));

    this.cdr.detectChanges();
  }

  onSortChange() {
    this.applySortAndFilter();
  }

  goBack() {
    this.location.back();
  }
}
