import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef  } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { EditEventDialogComponent } from './edit-event-dialog/edit-event-dialog.component';
import { Firestore, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { DialogContent } from '../../user/user.component';

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
    private dialogRef: MatDialogRef<EventDetailsComponent> 
  ) {}

  editEvent() {
    const dialogRef = this.dialog.open(EditEventDialogComponent, {
      data: this.data,
    });
  
    dialogRef.afterClosed().subscribe((updatedEvent) => {
      if (updatedEvent) {
        const eventRef = doc(this.firestore, `events/${updatedEvent.id}`);
        updateDoc(eventRef, updatedEvent)
          .then(() => {
            console.log('Event updated successfully in Firestore!');
  
            // Aktualisiere die lokalen Daten
            this.data.title = updatedEvent.title;
            this.data.date = updatedEvent.date;
            this.data.users = updatedEvent.users;
  
            console.log('Updated event details:', this.data);
            dialogRef.close('reload'); 
          })
          .catch((error) => console.error('Error updating Firestore:', error));
      }
    });
  }


  deleteEvent() {
    const dialogRef = this.dialog.open(DialogContent, {
      data: { type: 'event', name: this.data.title }, // Dynamische Daten für den Dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const eventRef = doc(this.firestore, `events/${this.data.id}`);
        deleteDoc(eventRef)
          .then(() => {
            console.log('Event deleted successfully from Firestore!');
            this.dialogRef.close('reload'); // Signalisiere die Elternkomponente, dass die Events neu geladen werden sollen
          })
          .catch((error) => console.error('Error deleting event from Firestore:', error));
      }
    });
  }
}
