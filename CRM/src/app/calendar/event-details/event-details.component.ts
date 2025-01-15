import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Input, Optional, Output, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef  } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { EditEventDialogComponent } from './edit-event-dialog/edit-event-dialog.component';
import { Firestore, doc, updateDoc, deleteDoc, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { LoggingService } from '../../shared/logging.service';
import { DeleteDialogComponent } from '../../delete-dialog/delete-dialog.component';

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
  
    const formattedDate = this.data.date; // Datum direkt aus Firestore übernehmen
    const formattedTime = this.data.time; // Zeit direkt aus Firestore übernehmen
  
    // Prüfe den ursprünglichen Zustand der Teilnehmer
    console.log('Original participants:', this.data.users);
  
    // Lade die Teilnehmerdetails
    this.loadParticipants(this.data.users?.map((user: any) => user.name) || []);
  
    const dialogRef = this.dialog.open(EditEventDialogComponent, {
      autoFocus: false,
      data: {
        id: this.data.id,
        type: this.data.type,
        description: this.data.description,
        date: formattedDate, // Datum unverändert übernehmen
        time: formattedTime, // Zeit unverändert übernehmen
        users: this.data.users, // Bereits aktualisierte Benutzer übergeben
      },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedEvent = result;
  
        console.log('Updated event from dialog:', updatedEvent); // Logge das aktualisierte Event
  
        const eventRef = doc(this.firestore, `events/${updatedEvent.id}`);
        updateDoc(eventRef, updatedEvent)
          .then(() => {
            console.log('Event updated successfully in Firestore!');
  
            // Lokale Daten aktualisieren
            this.data.type = updatedEvent.type;
            this.data.description = updatedEvent.description;
            this.data.date = updatedEvent.date;
            this.data.time = updatedEvent.time;
            this.data.users = updatedEvent.users;
  
            console.log('Updated event details after save:', this.data);
            this.loadParticipants(updatedEvent.users); // Logge aktualisierte Event-Daten
          })
          .catch((error) => console.error('Error updating Firestore:', error));
          
      }
    });
  }
  
  

   loadParticipants(userNames: string[]) {
    const userCollection = collection(this.firestore, 'users');
  
    collectionData(userCollection, { idField: 'id' }).subscribe((users: any[]) => {
      console.log('Fetched users from Firestore:', users); // Logge alle Benutzer aus Firestore
  
      const defaultProfilePicture = '/assets/img/user.png'; // Pfad zum Standardbild
  
      // Aktualisiere `this.data.users`
      this.data.users = userNames.map((name) => {
        const user = users.find(
          (u) => `${u.firstName} ${u.lastName}` === name
        );
  
        if (!user) {
          console.warn(`User not found for name: ${name}`); // Warnung für fehlende Benutzer
        }
  
        return {
          name,
          profilePicture: user?.profilePicture || defaultProfilePicture, // Füge Standardprofilbild hinzu, falls keines vorhanden ist
        };
      });
  
      console.log('Updated participants with full data:', this.data.users); // Logge aktualisierte Benutzer
    });
  }
  

  deleteEvent() {
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      autoFocus: false,
      data: { type: 'event', name: this.data.type },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const eventRef = doc(this.firestore, `events/${this.data.id}`);
        deleteDoc(eventRef)
          .then(() => {
            console.log('Event deleted successfully from Firestore!');

            // Emit the closeSidebarEvent if this is not a dialog
            if (!this.isDialog) {
              this.closeSidebarEvent.emit(); // Inform parent to close the sidebar
            } else {
              this.dialogRef?.close(); // Close the dialog
            }
          })
          .catch((error) => console.error('Error deleting event from Firestore:', error));
      }
    });
  }

  closeSidebar(): void {
    if (!this.isDialog) {
      // Nur für Sidebar-Modus
      this.data = null;
    }
  }
}
