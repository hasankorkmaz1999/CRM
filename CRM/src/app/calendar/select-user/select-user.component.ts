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
import { AuthService } from '../../shared/auth.service';
import { LoggingService } from '../../shared/logging.service';


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
    private authService: AuthService,
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
    // Abonniere den aktuellen Benutzer
    this.authService.currentUserName$.subscribe((name) => {
      this.currentUserName = name;
      console.log('Current User Name:', this.currentUserName);
    });

    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
    });

    this.generateUSTimeOptions();
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
  
    // Validierung: Stelle sicher, dass Datum und Zeit vorhanden sind
    if (!formValue.date || !formValue.time) return null;
  
    return {
      type: formValue.type || 'Other',           // Event-Typ
      description: formValue.description || '',  // Beschreibung
      date: formValue.date,                      // Nur das Datum (im 'YYYY-MM-DD'-Format)
      time: formValue.time,                      // Nur die Uhrzeit (im 'HH:MM AM/PM'-Format)
      users: this.selectedUsers,                 // Ausgewählte Benutzer
    };
  }
  
  
  
  saveEventToFirestore(eventData: any) {
    const eventCollection = collection(this.firestore, 'events');
    const currentDate = new Date();
  
    const eventToSave = {
      type: eventData.type || 'Other',
      description: eventData.description || '',
      date: new Date(eventData.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: eventData.time || '',
      users: eventData.users.map((user: any) => `${user.firstName} ${user.lastName}`),
      createdAt: currentDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      createdBy: this.currentUserName || 'Unknown',
    };

    addDoc(eventCollection, eventToSave)
      .then((docRef) => {
        console.log('Event saved successfully with ID:', docRef.id);
        this.logEventAction('add', docRef.id, eventToSave);
        updateDoc(docRef, { id: docRef.id })
          .then(() => {
            console.log('Document updated with ID:', docRef.id);
            this.dialogRef.close('reload');
          })
          .catch((error) => console.error('Error updating document ID:', error));
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

