import { Component } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [SharedModule],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) {
    // Redirect logged-in users
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.checkUserRoleAndRedirect(user.uid);
      }
    });
  }

  onLogin() {
    signInWithEmailAndPassword(this.auth, this.email, this.password)
    .then((userCredential) => {
      const user = userCredential.user;
      this.checkUserRoleAndRedirect(user.uid); // Weiterleitung nach erfolgreicher Anmeldung
    })
    .catch((error) => {
      this.errorMessage = 'Invalid login credentials.';
    });
  
  }



  private checkUserRoleAndRedirect(uid: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const role = docSnap.data()['role'];
        localStorage.setItem('userRole', role); // Rolle speichern
  
        this.router.navigate(['/dashboard']); // Leite immer zum Haupt-Dashboard
      } else {
        this.errorMessage = 'User role not found.';
        this.router.navigate(['/login']); // Fallback bei fehlender Rolle
      }
    });
  }
  
}
