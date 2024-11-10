import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { User } from '../../models/user.class';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-dialog-edit-user',
  standalone: true,
  imports: [SharedModule],
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
  const userDocRef = doc(this.firestore, `users/${this.userId}`); // Referenz zum spezifischen Dokument
  updateDoc(userDocRef, { ...this.user }) // Aktualisiert das Dokument mit den Werten des User-Objekts
    .then(() => {
      console.log('User successfully updated!');
      this.loading = false;
    })
    .catch((error) => {
      console.error('Error updating user:', error);
    });
}


}
