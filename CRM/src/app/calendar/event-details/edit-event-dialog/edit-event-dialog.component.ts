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
  usTimeOptions: string[] = [];
  


  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<EditEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const parsedDate = this.data.date
    ? new Date(this.data.date).toISOString().split('T')[0] // Konvertierung in YYYY-MM-DD
    : '';
  
  this.editForm = this.fb.group({
    type: [this.data.type || 'Other', Validators.required],
    description: [this.data.description || '', Validators.maxLength(200)],
    date: [parsedDate, Validators.required],
    time: [this.data.time || '08:00 AM', Validators.required],
  });
  
  
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
    this.generateUSTimeOptions(); 
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
  
    // Datum und Uhrzeit formatieren wie beim Erstellen
    const updatedDate = new Date(formValue.date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  
    const updatedTime = formValue.time; // Uhrzeit bleibt wie eingegeben
  
    // Aktualisiertes Event-Objekt erstellen
    const updatedEvent = {
      id: this.data.id,
      type: formValue.type,
      description: formValue.description,
      date: updatedDate, // Formatiertes Datum
      time: updatedTime, // Uhrzeit
      users: [...this.selectedUsers],
    };
  
    console.log('--- Updated Event ---', updatedEvent);
  
    // Event in Firestore aktualisieren
    const eventRef = doc(this.firestore, `events/${this.data.id}`);
    updateDoc(eventRef, updatedEvent)
      .then(() => {
        console.log('Event updated successfully:', updatedEvent);
        this.dialogRef.close({ updatedEvent, changes: this.getChanges(updatedEvent) });
      })
      .catch((error) => {
        console.error('Error updating event in Firestore:', error);
      });
  }
  

  getChanges(updatedEvent: any): any {
    const changes: any = {};
    const originalEvent = this.data;
  
    // Hilfsfunktion für präzisen Vergleich
    const normalizeDate = (date: string): string => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };
  
    // Vergleich des Typs
    if (originalEvent.type !== updatedEvent.type) {
      changes.type = { old: originalEvent.type, new: updatedEvent.type };
    }
  
    // Vergleich der Beschreibung
    if (originalEvent.description !== updatedEvent.description) {
      changes.description = { old: originalEvent.description, new: updatedEvent.description };
    }
  
    // Vergleich des Datums (normalisieren vor dem Vergleich)
    if (normalizeDate(originalEvent.date) !== normalizeDate(updatedEvent.date)) {
      changes.date = {
        old: normalizeDate(originalEvent.date),
        new: normalizeDate(updatedEvent.date),
      };
    }
  
    // Vergleich der Uhrzeit
    if (originalEvent.time !== updatedEvent.time) {
      changes.time = { old: originalEvent.time, new: updatedEvent.time };
    }
  
    // Vergleich der Benutzer (Arrays vergleichen)
    const originalUsers = JSON.stringify(originalEvent.users || []);
    const updatedUsers = JSON.stringify(updatedEvent.users || []);
    if (originalUsers !== updatedUsers) {
      changes.users = {
        old: originalEvent.users || [],
        new: updatedEvent.users || [],
      };
    }
  
    return changes;
  }
  
  
  
  
  
  generateUSTimeOptions() {
    const times: string[] = [];
    const startHour = 8; // 08:00 AM
    const endHour = 17; // 05:00 PM (17 Uhr im 24-Stunden-Format)
  
    for (let hour = startHour; hour <= endHour; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour; // 12-Stunden-Format
      const meridiem = hour >= 12 ? 'PM' : 'AM'; // AM/PM bestimmen
  
      ['00', '15', '30', '45'].forEach((minute) => {
        times.push(`${displayHour}:${minute} ${meridiem}`);
      });
    }
  
    this.usTimeOptions = times;
  }
  

  
  

  logChanges(eventId: string, changes: any) {
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