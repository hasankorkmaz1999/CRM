import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Optional, Output, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { EditEventDialogComponent } from './edit-event-dialog/edit-event-dialog.component';
import { Firestore, doc, updateDoc, deleteDoc, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { LoggingService } from '../../shared/logging.service';
import { DeleteDialogComponent } from '../../delete-dialog/delete-dialog.component';
import { formatTimeTo12Hour, formatDateToLong } from '../../shared/formattime.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, SharedModule, MatButton, MatButtonModule, DeleteDialogComponent, EditEventDialogComponent],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EventDetailsComponent {
  @Input() data: any; // Für Sidebar-Nutzung
  @Output() closeSidebarEvent = new EventEmitter<void>(); // EventEmitter für Sidebar-Schließen
  isDialog: boolean = false;

  constructor(
    private snackbarService: SnackbarService,
    private loggingService: LoggingService,
    private firestore: Firestore,
    private dialog: MatDialog,
    @Optional() public dialogRef?: MatDialogRef<EventDetailsComponent>, // Optional für Dialog
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: any // Optional für Dialog
  ) {
    if (this.dialogData) {
      this.data = this.dialogData; // Daten aus dem Dialog setzen
      this.isDialog = true; // Bestimmen, ob es als Dialog verwendet wird
    }
  }

  close(): void {
    if (this.isDialog && this.dialogRef) {
      this.dialogRef.close(); // Dialog schließen
    } else {
      this.closeSidebarEvent.emit(); // Sidebar schließen
    }
  }

  editEvent() {
    const buttonElement = document.activeElement as HTMLElement;
    if (buttonElement) {
      buttonElement.blur();
    }

    const formattedDate = formatDateToLong(new Date(this.data.date)); // Datum formatieren
    const formattedTime = formatTimeTo12Hour(this.data.time); // Zeit formatieren

    const dialogRef = this.dialog.open(EditEventDialogComponent, {
      autoFocus: false,
      data: {
        id: this.data.id,
        type: this.data.type,
        description: this.data.description,
        date: formattedDate,
        time: formattedTime,
        users: this.data.users,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedEvent = result;

        const eventRef = doc(this.firestore, `events/${updatedEvent.id}`);
        updateDoc(eventRef, updatedEvent)
          .then(() => {
           

            this.data.type = updatedEvent.type;
            this.data.description = updatedEvent.description;
            this.data.date = updatedEvent.date;
            this.data.time = updatedEvent.time;
            this.data.users = updatedEvent.users;

            this.loadParticipants(updatedEvent.users);
          })
          .catch((error) => console.error('Error updating Firestore:', error));
      }
    });
  }

  loadParticipants(userNames: string[]) {
    const userCollection = collection(this.firestore, 'users');

    collectionData(userCollection, { idField: 'id' }).subscribe((users: any[]) => {
      const defaultProfilePicture = '/assets/img/user.png'; // Standardbild

      this.data.users = userNames.map((name) => {
        const user = users.find((u) => `${u.firstName} ${u.lastName}` === name);

        if (!user) {
          console.warn(`User not found for name: ${name}`);
        }

        return {
          name,
          profilePicture: user?.profilePicture || defaultProfilePicture,
        };
      });
    });
  }

  deleteEvent() {
    const buttonElement = document.activeElement as HTMLElement;
    if (buttonElement) {
      buttonElement.blur();
    }
  
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      autoFocus: false,
      data: { type: 'event', name: this.data.type },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const eventRef = doc(this.firestore, `events/${this.data.id}`);
        deleteDoc(eventRef)
          .then(() => {
            // Log-Eintrag erstellen
            this.loggingService.logEventAction('delete', { id: this.data.id, type: this.data.type });
           


            this.snackbarService.showActionSnackbar('event', 'delete');
  
            if (!this.isDialog) {
              this.closeSidebarEvent.emit();
            } else {
              this.dialogRef?.close();
            }
          })
          .catch((error) => console.error('Error deleting event from Firestore:', error));
      }
    });
  }
  

 

  closeSidebar(): void {
    if (!this.isDialog) {
      this.data = null;
    }
  }
}
