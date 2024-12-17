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

  constructor(
    private firestore: Firestore,
    private dialogRef: MatDialogRef<SelectUserComponent>,
    private fb: FormBuilder,
    private authService: AuthService,
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
    const eventCollection = collection(this.firestore, 'events'); // Firestore-Referenz
  
    const currentDate = new Date();
  
    // Aktuellen Benutzer über AuthService holen
    this.authService.getCurrentUserDisplayName().then((currentUser) => {
      // Event-Daten vorbereiten (im lesbaren Format)
      const eventToSave = {
        type: eventData.type || 'Other',                // Event-Typ
        description: eventData.description || '',      // Beschreibung
        date: new Date(eventData.date).toLocaleString('en-US', {  
          year: 'numeric', month: 'long', day: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: true 
        }),                                            // Lesbares Datum
        time: eventData.time || '',                    // Uhrzeit
        users: eventData.users.map((user: any) => `${user.firstName} ${user.lastName}`), // Benutzer als Namen
        createdAt: currentDate.toLocaleString('en-US', {  
          year: 'numeric', month: 'long', day: 'numeric', 
          hour: '2-digit', minute: '2-digit', hour12: true 
        }),                                            // Lesbares Erstellungsdatum
        createdBy: currentUser || 'Unknown',           // Name des eingeloggten Benutzers
      };
  
      // Firestore speichern
      addDoc(eventCollection, eventToSave)
        .then((docRef) => {
          console.log('Event saved successfully with ID:', docRef.id);
  
          // Aktualisiere die ID im gespeicherten Dokument
          updateDoc(docRef, { id: docRef.id })
            .then(() => {
              console.log('Document updated with ID:', docRef.id);
              this.dialogRef.close('reload'); // Dialog schließen und reload signalisieren
            })
            .catch((error) => console.error('Error updating document ID:', error));
        })
        .catch((error) => {
          console.error('Error saving event:', error);
        });
    }).catch((error) => {
      console.error('Error fetching current user:', error);
    });
  }
  



}