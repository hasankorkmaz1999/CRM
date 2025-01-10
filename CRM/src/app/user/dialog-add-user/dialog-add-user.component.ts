import { Component, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { User } from '../../../models/user.class';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Firestore, collection, setDoc, doc } from '@angular/fire/firestore';
import { LoggingService } from '../../shared/logging.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [SharedModule, FormsModule, MatOptionModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrls: ['./dialog-add-user.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogAddUserComponent {
  user = new User();
  userForm: FormGroup;
  hidePassword: boolean = true;
  birthDate: Date = new Date();

  constructor(
    private firestore: Firestore,
    private loggingService: LoggingService,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      birthDate: [''],
      street: [''],
      zipCode: [''],
      city: [''],
    });
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  async saveUser() {
    if (this.userForm.invalid) {
      return;
    }
  
    try {
      const formValue = this.userForm.getRawValue();
      const uid = this.generateUID(); // Generate a unique ID for the user
  
      // Trim all string fields
      const newUser = {
        ...formValue,
        firstName: formValue.firstName.trim(), // Trim first name
        lastName: formValue.lastName.trim(),   // Trim last name
        email: formValue.email.trim(),         // Trim email
        role: formValue.role.trim(),           // Trim role
        password: formValue.password.trim(),   // Trim password
        phone: formValue.phone ? formValue.phone.trim() : '', // Optional field
        street: formValue.street ? formValue.street.trim() : '', // Optional field
        city: formValue.city ? formValue.city.trim() : '',       // Optional field
        zipCode: formValue.zipCode ? formValue.zipCode.trim() : '', // Optional field
        uid,
        birthDate: this.birthDate.toLocaleDateString('en-US'), // Optional: Format birthDate
      };
  
      // Save the new user to Firestore
      const userRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userRef, newUser);
  
      console.log('User added successfully:', newUser);
      this.logUserAction('add', uid);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }
  
  

  logUserAction(action: string, userId: string) {
    this.loggingService.log(action, 'user', {
      id: userId,
      firstName: this.userForm.get('firstName')?.value,
      lastName: this.userForm.get('lastName')?.value,
      email: this.userForm.get('email')?.value,
    });
  }

  generateUID(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
