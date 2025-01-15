import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Firestore, addDoc, collection, collectionData, updateDoc } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {MatListModule} from '@angular/material/list'; 
import { User } from '../../../models/user.class';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { LoggingService } from '../../shared/logging.service';
import { formatTimeTo12Hour, formatDateToLong } from '../../shared/formattime.service';


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
    // Benutzerinformationen aus localStorage laden
    this.loadCurrentUser();

    // Benutzerliste laden
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
    });

    // Generiere Zeitoptionen
    this.generateUSTimeOptions();
  }

  loadCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.name) {
      this.currentUserName = currentUser.name;
      console.log('Aktueller Benutzername aus localStorage:', this.currentUserName);
    } else {
      console.warn('Kein aktueller Benutzer in localStorage gefunden.');
    }
  }
  


  generateUSTimeOptions() {
    const times: string[] = [];
    const startHour = 8; // 08:00 AM
    const endHour = 17; // 05:00 PM (17 Uhr im 24-Stunden-Format)
  
    for (let hour = startHour; hour <= endHour; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour; // 12-Stunden-Format
      const meridiem = hour >= 12 ? 'PM' : 'AM'; // AM oder PM festlegen
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
      console.log('Prepared Event Data:', formValue);
      this.saveEventToFirestore(formValue); // Event speichern
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
  
    const formattedTime = formatTimeTo12Hour(formValue.time);
    if (formattedTime === 'Invalid time') {
      console.error('Invalid time detected during event preparation:', formValue.time);
      return null;
    }
  
    return {
      type: formValue.type || 'Other',
      description: formValue.description || '',
      date: formatDateToLong(new Date(formValue.date)),
      time: formattedTime,
      users: this.selectedUsers,
    };
  }
  
  
  
  
  saveEventToFirestore(eventData: any) {
    const eventCollection = collection(this.firestore, 'events');
    const currentDate = new Date();
  
    const eventToSave = {
      type: eventData.type || 'Other',
      description: eventData.description || '',
      date: formatDateToLong(new Date(eventData.date)), // Formatiere Datum in das gewünschte Format
      time: formatTimeTo12Hour(eventData.time), // Formatiere Zeit in das 12-Stunden-Format
      users: eventData.users.map((user: any) => `${user.firstName} ${user.lastName}`),
      createdAt: formatDateToLong(currentDate), // Formatiere das Erstellungsdatum
      createdBy: this.currentUserName || 'Unknown',
    };
  
    addDoc(eventCollection, eventToSave)
      .then((docRef) => {
        console.log('Event saved successfully with ID:', docRef.id);
        this.dialogRef.close('reload');
      })
      .catch((error) => {
        console.error('Error saving event:', error);
      });
  }
  
  
  
  logEventAction(action: string, eventId: string, eventData: any) {
    this.loggingService.log(action, 'event', {
        id: eventId,
        type: eventData.type,
        createdBy: eventData.createdBy,
        date: eventData.date,
        time: eventData.time,
        users: eventData.users || [],
        description: eventData.description || 'No description ' // Beschreibung hinzufügen
    });
}



}

