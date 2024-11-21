import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { EditEventDialogComponent } from './edit-event-dialog/edit-event-dialog.component';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, SharedModule, MatButton, MatButtonModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss',
})
export class EventDetailsComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private firestore: Firestore,
    private dialog: MatDialog
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
  
}
