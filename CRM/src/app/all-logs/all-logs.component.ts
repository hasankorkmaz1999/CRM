import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { SharedModule } from '../shared/shared.module';
import { Router, RouterModule } from '@angular/router';
import { LogDetailsComponent } from '../dashboard/log-details/log-details.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-all-logs',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './all-logs.component.html',
  styleUrl: './all-logs.component.scss',
  
  
  
})
export class AllLogsComponent implements OnInit {
  logs: any[] = [];

  constructor(
    private firestore: Firestore,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef, 
  ) {}

  ngOnInit(): void {
    this.loadAllLogs();
  }

  loadAllLogs() {
    const logsCollection = collection(this.firestore, 'logs');
    collectionData(logsCollection, { idField: 'id' }).subscribe((data) => {
      const sortedLogs = data
        .map((log: any) => ({
          ...log,
          timestamp: log.timestamp ? new Date(log.timestamp) : null,
        }))
        .sort(
          (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
        ); // Sortiere von neusten zu ältesten
  
      this.logs = sortedLogs.map((log, index) => ({
        ...log,
        animationDelay: `${index * 150}ms`, // Animation-Delays nach der Sortierung berechnen
      }));
  
      this.cdr.detectChanges(); // Erzwingt Ansichtserneuerung
    });
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
}
