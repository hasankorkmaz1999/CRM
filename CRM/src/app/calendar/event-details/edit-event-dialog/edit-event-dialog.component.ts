import { Component, Inject, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Firestore, doc, updateDoc, collection, collectionData } from '@angular/fire/firestore';
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
  selectedUsers: string[] = []; // Benutzer, die bereits im Event ausgewählt sind

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<EditEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Erstelle das Formular und befülle die Werte
    this.editForm = this.fb.group({
      title: [this.data.title, Validators.required],
      date: [new Date(this.data.date), Validators.required],
      time: [
        new Date(this.data.date).toTimeString().slice(0, 5), // Zeit extrahieren
        Validators.required,
      ],
    });

    // Übernehme die bereits ausgewählten Benutzer
    this.selectedUsers = this.data.users || [];
  }

  ngOnInit(): void {
    // Lade Benutzer aus Firestore
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
    });
  }

  toggleUserSelection(user: string): void {
    if (this.selectedUsers.includes(user)) {
      this.selectedUsers = this.selectedUsers.filter((u) => u !== user);
    } else {
      this.selectedUsers.push(user);
    }
    console.log('Updated selectedUsers:', this.selectedUsers);
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
      id: this.data.id, // Behalte die ID
      title: formValue.title,
      date: updatedDate.toISOString(),
      users: this.selectedUsers, // Hier wird die aktualisierte Liste der Benutzer verwendet
    };
  
    this.dialogRef.close(updatedEvent); // Rückgabe der aktualisierten Daten
  }
  

  cancel() {
    this.dialogRef.close(); // Dialog schließen ohne Änderungen
  }
}