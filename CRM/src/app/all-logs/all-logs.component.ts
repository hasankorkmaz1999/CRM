import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { LogDetailsComponent } from '../dashboard/log-details/log-details.component';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import { EventDetailsComponent } from '../calendar/event-details/event-details.component';

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
      this.logs = data.map((log: any) => ({
        ...log,
        timestamp: log.timestamp ? new Date(log.timestamp) : null,
      }));

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
    const type = log.details?.type || '';
    const firstName = log.details?.firstName || '';
    const lastName = log.details?.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    const displayName = type || fullName || 'Unknown';

    switch (action) {
      case 'add':
        return `New ${entityType} (${displayName}) has been added.`;
      case 'edit':
        return `${entityType} (${displayName}) has been edited.`;
      case 'delete':
        return `${entityType} (${displayName}) has been deleted.`;
      default:
        return `${entityType} (${displayName}) has been updated.`;
    }
  }

  goBack() {
    this.location.back();
  }

  navigateToCustomerDetails(log: any) {
    if (log.entityType === 'customer' && log.details?.id) {
      this.router.navigate(['/customer-details', log.details.id]);
    }
  }

  navigateToUserDetails(log: any) {
    if (log.entityType === 'user' && log.details?.id) {
      this.router.navigate(['/user-details', log.details.id]);
    }
  }

  isEventEditLog(log: any): boolean {
    return log.action === 'edit' && log.entityType === 'event';
  }

  openLogDetails(log: any) {
    this.dialog.open(LogDetailsComponent, {
      data: log,
      width: '500px',
      autoFocus: false,
    });
  }


  openAddedEventDetails(log: any) {
    const event = {
      id: log.details?.id || '',
      type: log.details?.type || 'Unknown',
      description: log.details?.description || '',
      date: log.details?.date || '',
      time: log.details?.time || '',
      users: log.details?.users || [],
      createdBy: log.details?.createdBy || '',
    };
  
    this.dialog.open(EventDetailsComponent, {
      data: {
        ...event,
        readOnly: true // Hier als Indikator für Anzeige ohne Bearbeiten/Löschen
      },
      width: '500px',
      autoFocus: false,
    });
  }
}
