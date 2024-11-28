import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../../models/user.class';
import {MatMenuModule} from '@angular/material/menu'; 
import { MatDialog } from '@angular/material/dialog';
import { DialogEditUserComponent } from '../dialog-edit-user/dialog-edit-user.component';
import { DialogAddPictureComponent } from '../../dialog-add-picture/dialog-add-picture.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [SharedModule, MatMenuModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {

  userId = '';
  user: User = new User ;

  constructor(private route: ActivatedRoute,
     private firestore: Firestore,
      public dialog: MatDialog) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      this.userId = paramMap.get('id') ?? '';
      console.log('Got ID:', this.userId);
      this.getUser();
    });
  }

  getUser() {
    const userDoc = doc(this.firestore, `users/${this.userId}`);
    docData(userDoc).subscribe((user: any) => {
      this.user = new User (user);
      console.log('Fetched user data:', this.user);
    });
  }

  

 

  editUserDetails() {
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
        console.log('User profile picture updated:', imageUrl);
      }
    });
  }
  

  getProfilePictureButtonLabel(): string {
    return this.user.profilePicture ? 'Edit picture' : 'Add picture';
  }
  

  


}
