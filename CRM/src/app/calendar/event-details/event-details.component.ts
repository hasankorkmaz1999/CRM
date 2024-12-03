import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef  } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { EditEventDialogComponent } from './edit-event-dialog/edit-event-dialog.component';
import { Firestore, doc, updateDoc, deleteDoc, collection, addDoc } from '@angular/fire/firestore';
import { DialogContent } from '../../user/user.component';
import { LoggingService } from '../../shared/logging.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, SharedModule, MatButton, MatButtonModule, DialogContent],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss',
})
export class EventDetailsComponent {
 
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private firestore: Firestore,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<EventDetailsComponent> ,
    private loggingService: LoggingService
  ) {}

  editEvent() {
    const dialogRef = this.dialog.open(EditEventDialogComponent, {
      data: this.data,
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const { updatedEvent, changes } = result; // Änderungen und Event-Daten
        const eventRef = doc(this.firestore, `events/${updatedEvent.id}`);
  
        updateDoc(eventRef, updatedEvent)
          .then(() => {
            console.log('Event updated successfully in Firestore!');
  
            // Aktualisiere die lokalen Daten
            this.data.type = updatedEvent.type;
            this.data.description = updatedEvent.description;
            this.data.date = updatedEvent.date;
            this.data.users = updatedEvent.users;
  
            console.log('Updated event details:', this.data);
  
            // Logge die Aktion mit den Änderungen
            this.logEventAction(
              'edit',
              updatedEvent.id,
              updatedEvent.type,
              new Date().toISOString(),
              changes // Übergib die Änderungen an die Log-Funktion
            );
  
            dialogRef.close('reload');
          })
          .catch((error) => console.error('Error updating Firestore:', error));
      }
    });
  }
  
  
  
  


  deleteEvent() {
    const dialogRef = this.dialog.open(DialogContent, {
      data: { type: 'event', name: this.data.type }, // Verwende `type` anstelle von `title`
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const eventRef = doc(this.firestore, `events/${this.data.id}`);
        deleteDoc(eventRef)
          .then(() => {
            console.log('Event deleted successfully from Firestore!');
  
            // Logge die Aktion
            this.logEventAction(
              'delete',
              this.data.id,
              this.data.type, // Type anstelle von title loggen
              new Date().toISOString()
            );
  
            this.dialogRef.close('reload'); // Signalisiere die Elternkomponente, dass die Events neu geladen werden sollen
          })
          .catch((error) => console.error('Error deleting event from Firestore:', error));
      }
    });
  }
  
  


  logEventAction(action: string, eventId: string, type: string, timestamp: string, changes?: any) {
    const log = {
      action,
      entityType: 'event',
      timestamp,
      details: {
        id: eventId,
        type,
        changes: changes || {}, // Zusätzliche Änderungen
      },
    };
  
    const logsCollection = collection(this.firestore, 'logs');
    addDoc(logsCollection, log)
      .then(() => console.log('Log saved successfully:', log))
      .catch((error) => console.error('Error saving log:', error));
  }
  
  
  
}
