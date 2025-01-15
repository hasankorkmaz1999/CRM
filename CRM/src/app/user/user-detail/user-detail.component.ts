import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.class';
import {MatMenuModule} from '@angular/material/menu'; 
import { MatDialog } from '@angular/material/dialog';
import { DialogEditUserComponent } from '../dialog-edit-user/dialog-edit-user.component';
import { DialogAddPictureComponent } from '../../dialog-add-picture/dialog-add-picture.component';
import { Location } from '@angular/common';



@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [SharedModule, MatMenuModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class UserDetailComponent implements OnInit {

  userId = '';
  user: User = new User ;
  userEvents: any[] = []; // Liste aller Events des aktuellen Benutzers


  constructor(private route: ActivatedRoute,
     private firestore: Firestore,
      public dialog: MatDialog,
      private location: Location
    ) {}

    ngOnInit(): void {
      this.route.paramMap.subscribe((paramMap) => {
        this.userId = paramMap.get('id') ?? '';
       
        this.getUser();
        this.loadUserEvents(); // Events laden
      });
    }
    

  getUser() {
    const userDoc = doc(this.firestore, `users/${this.userId}`);
    docData(userDoc).subscribe((user: any) => {
      this.user = new User (user);
     
    });
  }


  loadUserEvents(): void {
    const eventsCollection = collection(this.firestore, 'events');
    const now = new Date(); // Aktuelles Datum und Uhrzeit
  
    collectionData(eventsCollection, { idField: 'id' }).subscribe((events: any[]) => {
      // Filtere Events, bei denen der Benutzer ein Teilnehmer ist und die noch in der Zukunft liegen
      const filteredEvents = events.filter((event) => {
        const eventDateTime = this.parseAndCombineDateTime(event.date, event.time);
        return (
          event.users.some(
            (participant: string) =>
              participant === `${this.user.firstName} ${this.user.lastName}`
          ) && eventDateTime > now
        );
      });
  
      // Sortiere die Events nach Datum und Uhrzeit
      this.userEvents = filteredEvents.sort((a, b) => {
        const dateA = this.parseAndCombineDateTime(a.date, a.time).getTime();
        const dateB = this.parseAndCombineDateTime(b.date, b.time).getTime();
        return dateA - dateB; // Aufsteigende Reihenfolge (früheste Events zuerst)
      });
  
     
    });
  }
  
  parseAndCombineDateTime(dateString: string, timeString: string): Date {
    try {
      const [time, meridiem] = timeString.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const isPM = meridiem === 'PM';
  
      const parsedDate = new Date(dateString);
      parsedDate.setHours(isPM && hours !== 12 ? hours + 12 : hours === 12 ? 0 : hours);
      parsedDate.setMinutes(minutes || 0);
      parsedDate.setSeconds(0);
      parsedDate.setMilliseconds(0);
  
      return parsedDate;
    } catch (error) {
      console.error('Error parsing and combining date and time:', error);
      return new Date(NaN);
    }
  }
  

  

 

  editUserDetails() {
    const buttonElement = document.activeElement as HTMLElement; // Get the currently focused element
    if (buttonElement) {
      buttonElement.blur(); // Remove focus from the button
    }
  
    const dialog = this.dialog.open(DialogEditUserComponent, {
      data: {
        user: { ...this.user }, // Kopiere die Benutzerdaten
        userId: this.userId, // Benutzer-ID
      },
    });
  
    dialog.afterClosed().subscribe((updated) => {
      if (updated) {
        // Daten neu laden, wenn Änderungen vorgenommen wurden
        this.getUser();
      }
    });
  }
  
  


  addOrEditProfilePicture() {
    const dialogRef = this.dialog.open(DialogAddPictureComponent, {
      data: { id: this.userId, type: 'user' } // Typ ist 'user'
    });
  
    dialogRef.afterClosed().subscribe((imageUrl: string) => {
      if (imageUrl) {
        this.user.profilePicture = imageUrl; // Aktualisiere das lokale Benutzerobjekt
        
      }
    });
  }
  

  getProfilePictureButtonLabel(): string {
    return this.user.profilePicture ? 'Edit picture' : 'Add picture';
  }
  


  goBack() {
    this.location.back();
  }

  


}




