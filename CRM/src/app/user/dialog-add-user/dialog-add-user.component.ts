import { Component, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { User } from '../../../models/user.class';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
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
  encapsulation: ViewEncapsulation.None,
})
export class DialogAddUserComponent {
  user = new User();
  birthDate: Date = new Date();
  password: string = '';
  userForm: FormGroup;
  hidePassword: boolean = true;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private loggingService: LoggingService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''], // Keine Validatoren
      birthDate: [''], // Keine Validatoren
      street: [''], // Keine Validatoren
      zipCode: [''], // Keine Validatoren
      city: [''], // Keine Validatoren
    });
  }


  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  saveUser() {
    if (this.userForm.invalid) {
      return;
    }

    const formValue = this.userForm.getRawValue();
    const formattedDate = this.birthDate.toLocaleDateString('en-US');

    this.user = {
      ...formValue,
      birthDate: formattedDate,
    };

    createUserWithEmailAndPassword(this.auth, this.user.email, formValue.password)
      .then((userCredential) => {
        const uid = userCredential.user.uid;

        const userRef = doc(this.firestore, `users/${uid}`);
        setDoc(userRef, {
          ...this.user,
          uid,
        })
          .then(() => {
            console.log('User added successfully:', this.user);
            this.logUserAction('add', uid);
          })
          .catch((error) => {
            console.error('Error saving user to Firestore:', error);
          });
      })
      .catch((error) => {
        console.error('Error creating user in Firebase Authentication:', error);
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