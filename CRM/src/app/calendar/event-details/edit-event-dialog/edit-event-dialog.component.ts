import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-edit-event-dialog',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule],
  templateUrl: './edit-event-dialog.component.html',
  styleUrl: './edit-event-dialog.component.scss'
})
export class EditEventDialogComponent {
  editForm: FormGroup;


  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Übergebe die aktuellen Event-Daten
  ) {
    this.editForm = this.fb.group({
      title: [this.data.title, Validators.required],
      date: [new Date(this.data.date), Validators.required],
      time: [
        new Date(this.data.date).toTimeString().slice(0, 5), // Zeit extrahieren
        Validators.required,
      ],
    });
    console.log('Event Details Data:', this.data);}

  prepareUpdatedEvent() {
    const formValue = this.editForm.value;
    const updatedDate = new Date(formValue.date);
    const [hours, minutes] = formValue.time.split(':');
    updatedDate.setHours(+hours, +minutes);

    return {
      title: formValue.title,
      date: updatedDate,
    };
  }
}
