import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../models/user.class';
import {MatMenuModule} from '@angular/material/menu'; 
import { MatDialog } from '@angular/material/dialog';
import { DialogEditAddressComponent } from '../dialog-edit-address/dialog-edit-address.component';
import { DialogEditUserComponent } from '../dialog-edit-user/dialog-edit-user.component';
import { DialogAddPictureComponent } from '../dialog-add-picture/dialog-add-picture.component';

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

  openAddressDialog() {

  }

  editAddressDetails() {
   const dialog = this.dialog.open(DialogEditAddressComponent);
   dialog.componentInstance.user = new User(this.user);
   dialog.componentInstance.userId =  this.userId;
  }

  editUserDetails() {
    const dialog = this.dialog.open(DialogEditUserComponent);
  
    // Falls birthDate als String gespeichert ist, in ein Date-Objekt umwandeln
    const userForEdit = { ...this.user };
    if (userForEdit.birthDate) {
      userForEdit.birthDate = new Date(userForEdit.birthDate);
    }
  
    dialog.componentInstance.user = new User(userForEdit);
    dialog.componentInstance.userId = this.userId;
  }


  addProfilePicture() {
    const dialog = this.dialog.open(DialogAddPictureComponent);

  }
  

  


}
