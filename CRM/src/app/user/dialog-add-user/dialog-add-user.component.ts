import { Component, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { User } from '../../../models/user.class';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Firestore, collection, setDoc, doc } from '@angular/fire/firestore';
import { LoggingService } from '../../shared/logging.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '../../shared/snackbar.service';


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
    private snackbarService: SnackbarService,
    private loggingService: LoggingService,
    private firestore: Firestore,
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
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        email: formValue.email.trim(),
        role: formValue.role.trim(),
        password: formValue.password.trim(),
        phone: formValue.phone ? formValue.phone.trim() : '',
        street: formValue.street ? formValue.street.trim() : '',
        city: formValue.city ? formValue.city.trim() : '',
        zipCode: formValue.zipCode ? formValue.zipCode.trim() : '',
        uid,
        birthDate: this.birthDate.toLocaleDateString('en-US'),
      };
  
      // Save the new user to Firestore
      const userRef = doc(this.firestore, `users/${uid}`);
      await setDoc(userRef, newUser);
  
      // Log-Eintrag erstellen
      this.loggingService.logUserAction('add', {
        id: uid,
        name: `${newUser.firstName} ${newUser.lastName}`,
      });


      this.snackbarService.showActionSnackbar('user', 'add');
     
      console.log('User saved and log created successfully!');
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }
  
  

 

  generateUID(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

 
}
