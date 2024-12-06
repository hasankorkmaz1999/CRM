import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import {MatProgressSpinner, MatProgressSpinnerModule} from '@angular/material/progress-spinner'; 


@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [SharedModule, MatProgressSpinner],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = true; // Neu: Zustand zum Laden der Seite

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // Benutzer ist authentifiziert
        this.checkUserRoleAndRedirect(user.uid);
      } else {
        // Kein Benutzer eingeloggt -> Ladezustand beenden
        this.isLoading = false;
        console.log('No user is currently logged in.');
      }
    });
  }
  

  onLogin() {
    this.isLoading = true; // Start des Ladens
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        const user = userCredential.user;
        this.checkUserRoleAndRedirect(user.uid); // Weiterleitung nach erfolgreicher Anmeldung
      })
      .catch((error) => {
        this.errorMessage = 'Invalid login credentials.';
        this.isLoading = false; // Laden beenden bei Fehler
      });
  }

  private checkUserRoleAndRedirect(uid: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    getDoc(userRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const role = userData['role'];
          const name = `${userData['firstName']} ${userData['lastName']}`;
  
          if (role) {
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', name); // Speichere den Namen
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = 'User role not found.';
            this.auth.signOut(); // Benutzer abmelden
          }
        } else {
          this.errorMessage = 'User not found in database.';
          this.auth.signOut(); // Benutzer abmelden
        }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        this.errorMessage = 'An error occurred while fetching user data.';
      })
      .finally(() => {
        this.isLoading = false; // Beende den Ladezustand
      });
  }
  
}
  
  

