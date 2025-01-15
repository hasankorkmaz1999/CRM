import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { LogDetailsComponent } from './log-details/log-details.component';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';
import { Log } from '../../models/logs.class';

@Component({
  selector: 'app-all-logs',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './all-logs.component.html',
  styleUrl: './all-logs.component.scss',
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
      console.log('Raw log data:', data); // Debug-Ausgabe
  
      this.logs = data.map((log) => {
        console.log('Processing log:', log); // Debug-Ausgabe für jedes Log
        return {
          ...log,
          timestamp: log['timestamp'] ? new Date(log['timestamp']) : null,
        };
      });
  
      this.applySortAndFilter();
    });
  }
  
  
  
  

  applySortAndFilter() {
    let sortedLogs = [...this.logs];

    
    switch (this.selectedSort) {
      case 'newest':
        sortedLogs.sort(
          (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
        );
        break;
      case 'oldest':
        sortedLogs.sort(
          (a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
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

  generateLogMessage(log: any): string {
    const entityType = log.entityType
      ? log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)
      : 'Entity';
    const action = log.action || 'updated';
    const name = log.details?.name || 'Unknown'; // Prüfe, ob `details.name` korrekt verarbeitet wird
  
    switch (action) {
      case 'add':
        return `New ${entityType} ${name} has been added.`;
      case 'edit':
        return `${entityType} ${name} has been edited.`;
      case 'delete':
        return `${entityType} ${name} has been deleted.`;
      default:
        return `${entityType} ${name} has been updated.`;
    }
  }
  

  goBack() {
    this.location.back();
  }

  

  
  
  
}
