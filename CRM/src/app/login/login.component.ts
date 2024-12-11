import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
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
    console.log('Login attempt with email:', this.email); // Debugging: Login-Daten
    this.isLoading = true; // Start des Ladens

    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Login successful. UID:', user.uid); // Debugging: Erfolgreicher Login
        this.checkUserRoleAndRedirect(user.uid); // Weiterleitung nach erfolgreicher Anmeldung
      })
      .catch((error) => {
        console.error('Login error:', error); // Debugging: Fehler bei Login
        this.errorMessage = 'Invalid login credentials.';
        this.isLoading = false; // Laden beenden bei Fehler
      });
  }

  private checkUserRoleAndRedirect(uid: string) {
    console.log('Checking user role for UID:', uid); // Debugging: UID prüfen
    const userCollection = collection(this.firestore, 'users');
    const q = query(userCollection, where('uid', '==', uid));
    
    getDocs(q)
      .then((querySnapshot) => {
        console.log('Query result:', querySnapshot.docs.map(doc => doc.data())); // Debugging: Query-Ergebnisse
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userData = docSnap.data();
          console.log('User data from Firestore:', userData); // Debugging: Benutzer-Daten

          const role = userData['role'];
          const name = `${userData['firstName']} ${userData['lastName']}`;
  
          if (role) {
            console.log('User role:', role); // Debugging: Rolle des Benutzers
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', name);
            this.router.navigate(['/dashboard']);
          } else {
            console.error('User role not found for UID:', uid); // Debugging: Keine Rolle gefunden
            this.errorMessage = 'User role not found.';
            this.auth.signOut(); // Benutzer abmelden
          }
        } else {
          console.error('No user found in Firestore for UID:', uid); // Debugging: Kein Benutzer gefunden
          this.errorMessage = 'User not found in database.';
          this.auth.signOut(); // Benutzer abmelden
        }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error); // Debugging: Fehler bei Firestore-Abfrage
        this.errorMessage = 'An error occurred while fetching user data.';
      })
      .finally(() => {
        this.isLoading = false; // Ladezustand beenden
      });
  }
}
  
  

