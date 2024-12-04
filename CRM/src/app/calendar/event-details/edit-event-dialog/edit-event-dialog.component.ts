import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Firestore, doc, updateDoc, collection, collectionData, addDoc } from '@angular/fire/firestore';
import { User } from '../../../../models/user.class';
import { MatListModule, MatListOption } from '@angular/material/list';

@Component({
  selector: 'app-edit-event-dialog',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, MatListOption , MatListModule],
  templateUrl: './edit-event-dialog.component.html',
  styleUrl: './edit-event-dialog.component.scss'
})
export class EditEventDialogComponent implements OnInit {
  editForm: FormGroup;
  users: User[] = []; // Alle Benutzer aus Firestore
  selectedUsers: string[] = [];
  eventTypes: string[] = ['Meeting', 'Webinar', 'Workshop', 'Other']; // Liste der Event-Typen // Benutzer, die bereits im Event ausgewählt sind

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<EditEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Erstelle das Formular und befülle die Werte
    this.editForm = this.fb.group({
      type: [this.data.type || 'Other', Validators.required], // Event-Typ
      description: [this.data.description || '', Validators.maxLength(200)], // Event-Beschreibung
      date: [new Date(this.data.date), Validators.required], // Event-Datum
      time: [
        new Date(this.data.date).toTimeString().slice(0, 5), // Event-Zeit
        Validators.required,
      ],
    });
  
    // Übernehme die bereits ausgewählten Benutzer
    this.selectedUsers = this.data.users || [];
  }
  

  ngOnInit(): void {
    console.log('Original data.users:', this.data.users); // Debugging
    this.selectedUsers = [...(this.data.users || [])];
    console.log('Initialized selectedUsers:', this.selectedUsers);
  
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
      console.log('Loaded users from Firestore:', this.users);
    });
  }
  

  toggleUserSelection(user: string): void {
    console.log('Toggle user:', user); // Debugging: Welcher Benutzer wird bearbeitet?
  
    if (this.selectedUsers.includes(user)) {
      this.selectedUsers = this.selectedUsers.filter((u: string) => u !== user);
      console.log('User removed. Updated selectedUsers:', this.selectedUsers); // Debugging: Benutzer entfernt
    } else {
      this.selectedUsers.push(user);
      console.log('User added. Updated selectedUsers:', this.selectedUsers); // Debugging: Benutzer hinzugefügt
    }
  }
  
  
  isUserSelected(user: string): boolean {
    return this.selectedUsers.includes(user);
  }
  

  saveChanges() {
    const formValue = this.editForm.value;
    const updatedDate = new Date(formValue.date);
    const [hours, minutes] = formValue.time.split(':');
    updatedDate.setHours(+hours, +minutes);
  
    const updatedEvent = {
      id: this.data.id,
      type: formValue.type,
      description: formValue.description,
      date: updatedDate.toISOString(),
      users: [...this.selectedUsers],
    };
  
    console.log('--- Updated Event ---', updatedEvent);
  
    const changes: any = {};
    const originalEvent = this.data;
  
    // Vergleich von Typ, Beschreibung und Datum
    if (originalEvent.type !== updatedEvent.type) {
      changes.type = { old: originalEvent.type, new: updatedEvent.type };
    }
  
    if (originalEvent.description !== updatedEvent.description) {
      changes.description = { old: originalEvent.description, new: updatedEvent.description };
    }
  
    // Vergleiche die Datumswerte als ISO-Strings
    if (new Date(originalEvent.date).toISOString() !== updatedDate.toISOString()) {
      changes.date = { old: new Date(originalEvent.date).toISOString(), new: updatedDate.toISOString() };
    }
  
    // Normalisiere Benutzerlisten
    const normalizedOriginalUsers = [...(originalEvent.users || [])].map((u: string) =>
      u.trim().toLowerCase()
    );
    const normalizedUpdatedUsers = [...(updatedEvent.users || [])].map((u: string) =>
      u.trim().toLowerCase()
    );
  
    // Vergleich der Benutzerlisten
    const removedUsers = normalizedOriginalUsers.filter(
      (user) => !normalizedUpdatedUsers.includes(user)
    );
    const addedUsers = normalizedUpdatedUsers.filter(
      (user) => !normalizedOriginalUsers.includes(user)
    );
  
    console.log('Removed Users:', removedUsers);
    console.log('Added Users:', addedUsers);
  
    if (removedUsers.length > 0 || addedUsers.length > 0) {
      changes.users = {
        old: originalEvent.users || [],
        new: updatedEvent.users || [],
        added: addedUsers,
        removed: removedUsers,
      };
    }
  
    console.log('--- Final Changes ---', changes);
  
    // Dialog schließen und Änderungen übergeben
    this.dialogRef.close({ updatedEvent, changes });
  }
  
  
  
  
  
  

  
  

  logChanges(eventId: string, changes: any) {
    // Formatierung der alten und neuen Datumswerte
    if (changes.date) {
      changes.date.old = new Date(changes.date.old).toISOString();
      changes.date.new = new Date(changes.date.new).toISOString();
    }
  
    const log = {
      timestamp: new Date().toISOString(),
      action: 'edit',
      entityType: 'event',
      details: {
        id: eventId,
        changes: changes,
      },
    };
  
    const logsCollection = collection(this.firestore, 'logs');
    addDoc(logsCollection, log)
      .then(() => {
        console.log('Changes successfully logged:', log);
      })
      .catch((error) => {
        console.error('Error logging changes:', error);
      });
  }
  
  
  
  

  cancel() {
    this.dialogRef.close(); // Dialog schließen ohne Änderungen
  }
}