import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatListModule} from '@angular/material/list'; 
import { User } from '../../../models/user.class';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';


@Component({
  selector: 'app-select-user',
  standalone: true,
  imports: [SharedModule, MatListModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatNativeDateModule ],
  templateUrl: './select-user.component.html',
  styleUrl: './select-user.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SelectUserComponent implements OnInit {
  users: User[] = [];
  selectedUsers: User[] = [];
  step2 = false;
  eventForm: FormGroup;
  eventTypes: string[] = ['Meeting', 'Webinar', 'Workshop', 'Other'];


  constructor(
    private firestore: Firestore,
    private dialogRef: MatDialogRef<SelectUserComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.eventForm = this.fb.group({
      type: ['', Validators.required], // Event Type
      description: [''], // Event Description
      date: ['', Validators.required], // Event Date
      time: ['', Validators.required], // Event Time
    });
  }

  ngOnInit(): void {
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
    });
  }

  proceedToEventForm() {
    this.step2 = true;
  }

  goBack() {
    this.step2 = false;
  }

  prepareEventData() {
    const formValue = this.eventForm.value;
    const eventDateTime = new Date(formValue.date);
    const [hours, minutes] = formValue.time.split(':');
    eventDateTime.setHours(+hours, +minutes);
  
    return {
      type: formValue.type || 'Other', // Standardwert, falls nichts ausgewählt wurde
      description: formValue.description || '',
      date: eventDateTime,
      users: this.selectedUsers,
    };
  }
  
  
}