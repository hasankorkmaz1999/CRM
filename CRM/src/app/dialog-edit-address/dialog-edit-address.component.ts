import { Component } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { User } from '../../models/user.class';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-dialog-edit-address',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './dialog-edit-address.component.html',
  styleUrl: './dialog-edit-address.component.scss'
})
export class DialogEditAddressComponent {
loading = false;
user: User = new User();
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
