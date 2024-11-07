import { Component, OnInit } from '@angular/core';
import { MatFabButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip'; 
import { MatDialog} from '@angular/material/dialog';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import {User} from '../../models/user.class'
import { SharedModule } from '../shared/shared.module';
import { Firestore, collection, collectionData , addDoc } from '@angular/fire/firestore';


@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatIconModule, MatFabButton, MatTooltipModule , SharedModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit {

  user = new User();
  allUsers: User[] = [];


  constructor(public dialog: MatDialog, private firestore: Firestore) {

  }

  ngOnInit(): void {
    const userCollection = collection(this.firestore, 'users'); // Referenz zur Firestore-Collection
    collectionData(userCollection, { idField: 'id' }) // Daten aus der Collection abrufen
      .subscribe((changes) => {
        console.log('Received changes from database:', changes);
        this.allUsers = changes as User[];
      });
  }
  

  openDialog() {
 this.dialog.open(DialogAddUserComponent);
  }
}
