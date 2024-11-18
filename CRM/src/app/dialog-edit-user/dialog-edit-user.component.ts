import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { User } from '../../models/user.class';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog-edit-user',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './dialog-edit-user.component.html',
  styleUrl: './dialog-edit-user.component.scss'
})
export class DialogEditUserComponent {
loading = false;
user: User = new User();
birthDate: Date = new Date();
userId: string = '';

constructor(private firestore: Firestore) { }

saveUser() {
  this.loading = true;

  // Konvertiere birthDate zu einem String (z.B. MM/DD/YYYY)
  if (this.user.birthDate instanceof Date) {
    this.user.birthDate = this.user.birthDate.toLocaleDateString('en-US'); // Beispiel: 11/15/2024
  }

  const userDocRef = doc(this.firestore, `users/${this.userId}`);
  updateDoc(userDocRef, { ...this.user }) // Das User-Objekt wird mit String-Wert für birthDate gespeichert
    .then(() => {
      console.log('User successfully updated!');
      this.loading = false;
    })
    .catch((error) => {
      console.error('Error updating user:', error);
      this.loading = false;
    });
}



}
