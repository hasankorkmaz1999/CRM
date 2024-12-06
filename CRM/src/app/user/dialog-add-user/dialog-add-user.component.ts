import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { User } from '../../../models/user.class';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc,  doc, setDoc } from '@angular/fire/firestore';
import { LoggingService } from '../../shared/logging.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [SharedModule, FormsModule, MatOptionModule,FormsModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrl: './dialog-add-user.component.scss',
})
export class DialogAddUserComponent {
  user = new User();
  birthDate: Date = new Date();
  loading = false;
  password: string = ''; // Neues Feld für Passwort

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private loggingService: LoggingService
  ) {}

  saveUser() {
    // Formatieren des Geburtsdatums als MM/DD/YYYY
    const formattedDate = this.birthDate.toLocaleDateString('en-US');
    this.user.birthDate = formattedDate;
    this.loading = true;

    // Benutzer in Firebase Authentication erstellen
    createUserWithEmailAndPassword(this.auth, this.user.email, this.password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;

        // Benutzerprofil im Firestore speichern
        const userRef = doc(this.firestore, `users/${uid}`);
        setDoc(userRef, {
          ...this.user,
          uid, // Verknüpfung mit der Authentication UID
        })
          .then(() => {
            console.log('User added successfully:', this.user);
            this.logUserAction('add', uid); // Logging der Aktion
            this.loading = false;
          })
          .catch((error) => {
            console.error('Error saving user to Firestore:', error);
            this.loading = false;
          });
      })
      .catch((error) => {
        console.error('Error creating user in Firebase Authentication:', error);
        this.loading = false;
      });
  }

  logUserAction(action: string, userId: string) {
    this.loggingService.log(action, 'user', {
      id: userId,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
    });
  }
}
