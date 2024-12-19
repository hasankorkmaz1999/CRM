import { CommonModule } from '@angular/common';
import { Component, Inject, ViewEncapsulation } from '@angular/core';
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
  imports: [CommonModule, SharedModule, MatButton, MatButtonModule, DialogContent, EditEventDialogComponent],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EventDetailsComponent {
 
  constructor(
    
    @Inject(MAT_DIALOG_DATA) public data: any,
    private firestore: Firestore,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<EventDetailsComponent> ,
    private loggingService: LoggingService
  ) {console.log('Data received in EventDetailsComponent:', this.data);
  }

  editEvent() {
    const eventDate = new Date(this.data.date);

  // Datum und Uhrzeit separat extrahieren
  const formattedDate = eventDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const hours = eventDate.getHours();
  const minutes = eventDate.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedTime = `${formattedHours}:${minutes} ${period}`; // "12:30 PM"

  // Öffne den Dialog mit getrennten Feldern
  const dialogRef = this.dialog.open(EditEventDialogComponent, {
    
    data: { 
      id: this.data.id,            
      type: this.data.type,
      description: this.data.description,
      date: formattedDate,   // Sicherstellen, dass nur das Datum übergeben wird
      time: this.data.time, // Fallback für Zeit, falls undefined
      users: this.data.users
    }
  });
  

  dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const { updatedEvent, changes } = result;
  
        // Uhrzeit aktualisieren
        const eventRef = doc(this.firestore, `events/${updatedEvent.id}`);
  
        updateDoc(eventRef, updatedEvent)
          .then(() => {
            console.log('Event updated successfully in Firestore!');
  
            // Lokale Daten aktualisieren
            this.data.type = updatedEvent.type;
            this.data.description = updatedEvent.description;
            this.data.date = updatedEvent.date;
            this.data.time = updatedEvent.time; // Uhrzeit aktualisieren
            this.data.users = updatedEvent.users;
  
            console.log('Updated event details:', this.data);
  
            this.logEventAction(
              'edit',
              updatedEvent.id,
              updatedEvent.type,
              new Date().toISOString(),
              changes
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
              `${this.data.type} at ${this.data.time}`, // Uhrzeit hinzufügen
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
