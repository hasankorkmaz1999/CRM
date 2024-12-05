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
        this.checkUserRoleAndRedirect(user.uid); // Redirect after login
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
        if (role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else if (role === 'employee') {
          this.router.navigate(['/employee-dashboard']);
        } else if (role === 'guest') {
          this.router.navigate(['/guest-dashboard']);
        }
      } else {
        this.errorMessage = 'User role not found.';
        this.router.navigate(['/login']); // Fallback bei fehlender Rolle
      }
    });
  }
}
