import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import {MatProgressSpinner, MatProgressSpinnerModule} from '@angular/material/progress-spinner'; 
import { UserService } from '../shared/user.service';


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
  isLoading: boolean = true;
  hidePassword: boolean = true; // Neu: Zustand zum Laden der Seite

  constructor(
    private auth: Auth,
     private firestore: Firestore,
      private router: Router,
      private userService: UserService
    ) {
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
    this.isLoading = true;
    signInWithEmailAndPassword(this.auth, this.email, this.password)
      .then((userCredential) => {
        const user = userCredential.user;
        this.userService.setUserRole(''); 
        this.checkUserRoleAndRedirect(user.uid);
      })
      .catch((error) => {
        this.errorMessage = 'Invalid login credentials.';
        this.isLoading = false;
      });
  }
  

  private checkUserRoleAndRedirect(uid: string) {
    const userCollection = collection(this.firestore, 'users');
    const q = query(userCollection, where('uid', '==', uid));
    getDocs(q)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const userData = docSnap.data();
          const role = userData['role'];
          const name = `${userData['firstName']} ${userData['lastName']}`;

          if (role) {
            this.userService.setUserRole(role);
            this.userService.setUserName(name);
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = 'User role not found.';
            this.auth.signOut();
          }
        } else {
          this.errorMessage = 'User not found in database.';
          this.auth.signOut();
        }
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        this.errorMessage = 'An error occurred while fetching user data.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
  
  

