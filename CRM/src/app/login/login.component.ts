import { Component } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import * as bcrypt from 'bcryptjs';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [MatProgressSpinner, SharedModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  hidePassword: boolean = true;

  constructor(
    private firestore: Firestore,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const userCollection = collection(this.firestore, 'users');
      const userQuery = query(userCollection, where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        throw new Error('User not found.');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Überprüfe das Passwort
      const isPasswordValid = bcrypt.compareSync(password, userData['password']);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials.');
      }

      // Speichere die Benutzerdetails in localStorage
      const loggedInUser = {
        uid: userDoc.id,
        name: `${userData['firstName']} ${userData['lastName']}`.trim(),
        role: userData['role'],
        email: userData['email'],
        profilePicture: userData['profilePicture'] || '/assets/img/user.png',
      };

      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      console.log('User logged in successfully:', loggedInUser);

      // Weiterleitung zum Dashboard
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        this.errorMessage = error.message || 'An error occurred during login.';
      } else {
        this.errorMessage = 'An unexpected error occurred during login.';
      }
      
    } finally {
      this.isLoading = false;
    }
  }
}
