import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  updateDoc,
} from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { User } from '../../../models/user.class';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { LoggingService } from '../../shared/logging.service';
import {
  formatTimeTo12Hour,
  formatDateToLong,
} from '../../shared/formattime.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-select-user',
  standalone: true,
  imports: [
    SharedModule,
    MatListModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    NgxMaterialTimepickerModule,
  ],
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
  usTimeOptions: string[] = [];
  currentUserName: string = 'Unknown User';

  constructor(
    private snackbarService: SnackbarService,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<SelectUserComponent>,
    private fb: FormBuilder,
    private loggingService: LoggingService,

    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.eventForm = this.fb.group({
      type: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
    });
    this.generateUSTimeOptions();
  }

  loadCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.name) {
      this.currentUserName = currentUser.name;
      console.log(
        'Aktueller Benutzername aus localStorage:',
        this.currentUserName
      );
    } else {
      console.warn('Kein aktueller Benutzer in localStorage gefunden.');
    }
  }

  generateUSTimeOptions() {
    const times: string[] = [];
    const startHour = 8;
    const endHour = 17; 
    for (let hour = startHour; hour <= endHour; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour; 
      const meridiem = hour >= 12 ? 'PM' : 'AM'; 
      ['00', '15', '30', '45'].forEach((minute) => {
        times.push(`${displayHour}:${minute} ${meridiem}`);
      });
    }
    this.usTimeOptions = times;
  }

  proceedToEventForm() {
    this.step2 = true;
  }

  goBack() {
    this.step2 = false;
  }

  handleEventCreation() {
    const formValue = this.prepareEventData();

    if (formValue) {
      this.saveEventToFirestore(formValue); 
    } else {
      console.error('Invalid event data. Cannot save event.');
    }
  }

  prepareEventData() {
    const formValue = this.eventForm.value;
    if (!formValue.date || !formValue.time) {
      console.error('Date or time is missing:', formValue);
      return null;
    }
    const selectedTime = formValue.time;

    return {
      type: formValue.type || 'Other',
      description: formValue.description || '',
      date: formatDateToLong(new Date(formValue.date)),
      time: selectedTime, 
      users: this.selectedUsers,
    };
  }

  saveEventToFirestore(eventData: any) {
    const eventCollection = collection(this.firestore, 'events');
    const currentDate = new Date();
    const eventToSave = {
      type: eventData.type || 'Other',
      description: eventData.description || '',
      date: formatDateToLong(new Date(eventData.date)), 
      time: eventData.time, 
      users: eventData.users.map(
        (user: any) => `${user.firstName} ${user.lastName}`
      ),
      createdAt: formatDateToLong(currentDate), 
      createdBy: this.currentUserName || 'Unknown',
    };

    addDoc(eventCollection, eventToSave)
      .then((docRef) => {
        this.loggingService.logEventAction('add', {
          id: docRef.id,
          type: eventToSave.type,
        });
        this.snackbarService.showActionSnackbar('event', 'add');
        this.dialogRef.close('reload');
      })
      .catch((error) => {
        console.error('Error saving event:', error);
      });
  }
}
