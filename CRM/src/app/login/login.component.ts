import { Component } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { SharedModule } from '../shared/shared.module';
import { UserService } from '../shared/user.service';
import { SlideshowComponent } from './slideshow/slideshow.component';
import { PrivacyPolicyComponent } from '../privacy-policy/privacy-policy.component';
import { LegalNoticeComponent } from '../legal-notice/legal-notice.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [MatProgressSpinner, SharedModule, SlideshowComponent],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  hidePassword: boolean = true;

  constructor(
    private dialog: MatDialog,
    private firestore: Firestore,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService
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
      const userData = await this.fetchUserData(email);
      if (!userData) {
        throw new Error('User not found.');
      }
      this.validatePassword(password, userData.data['password']);
      const loggedInUser = this.createLoggedInUser(userData);
      this.userService.setCurrentUser(loggedInUser);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.handleLoginError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchUserData(
    email: string
  ): Promise<{ id: string; data: any } | null> {
    const userCollection = collection(this.firestore, 'users');
    const userQuery = query(userCollection, where('email', '==', email));
    const querySnapshot = await getDocs(userQuery);
    if (querySnapshot.empty) {
      return null;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, data: userDoc.data() };
  }

  private validatePassword(
    inputPassword: string,
    storedPassword: string
  ): void {
    if (inputPassword !== storedPassword) {
      throw new Error('Invalid credentials.');
    }
  }

  private createLoggedInUser(userData: { id: string; data: any }): any {
    return {
      uid: userData.id,
      name: `${userData.data['firstName']} ${userData.data['lastName']}`.trim(),
      role: userData.data['role'],
      email: userData.data['email'],
      profilePicture: userData.data['profilePicture'] || '/assets/img/user.png',
    };
  }

  private handleLoginError(error: any): void {
    if (error instanceof Error) {
      this.errorMessage = error.message || 'An error occurred during login.';
    } else {
      this.errorMessage = 'An unexpected error occurred during login.';
    }
  }

  guestLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const guestUser = {
      uid: 'guest-user',
      name: 'Guest User',
      role: 'guest',
      email: 'guest@demo.com',
      profilePicture: '/assets/img/user.png',
    };
    this.userService.setCurrentUser(guestUser);
    setTimeout(() => {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }, 1000);
  }

  openPrivacyPolicy(): void {
    this.dialog.open(PrivacyPolicyComponent, {});
  }

  openLegalNotice(): void {
    this.dialog.open(LegalNoticeComponent, {});
  }
}
