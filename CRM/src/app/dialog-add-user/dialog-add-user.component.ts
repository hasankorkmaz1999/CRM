import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { User } from '../../models/user.class';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrl: './dialog-add-user.component.scss',
})
export class DialogAddUserComponent {
  user = new User();
  birthDate: Date = new Date();
  loading = false;

  constructor(private firestore: Firestore) {}

  saveUser() {
    // Formatieren des Geburtsdatums als MM/DD/YYYY
    const formattedDate = this.birthDate.toLocaleDateString('en-US');
    this.user.birthDate = formattedDate;

    console.log('user', this.user);
    this.loading = true;

    const userCollection = collection(this.firestore, 'users'); // Verweis auf die Collection
    addDoc(userCollection, { ...this.user }) // Dokument hinzufügen
      .then((result) => {
        console.log('User added successfully:', result);
        this.loading = false;
      })
      .catch((error) => {
        console.error('Error adding user:', error);
        this.loading = false;
      });
  }
}
