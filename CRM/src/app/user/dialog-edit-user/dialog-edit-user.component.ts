import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { User } from '../../../models/user.class';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LoggingService } from '../../shared/logging.service';
import { SnackbarService } from '../../shared/snackbar.service';

@Component({
  selector: 'app-dialog-edit-user',
  standalone: true,
  imports: [SharedModule, FormsModule],
  templateUrl: './dialog-edit-user.component.html',
  styleUrl: './dialog-edit-user.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DialogEditUserComponent implements OnInit {
  userForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DialogEditUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User; userId: string },
    private fb: FormBuilder,
    private firestore: Firestore,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const user = this.data.user;
    let birthDate: Date | null = null;
    if (user.birthDate) {
      birthDate = new Date(user.birthDate);
      if (isNaN(birthDate.getTime())) {
        birthDate = null;
      }}
    this.userForm = this.fb.group({
      firstName: [user.firstName],
      lastName: [user.lastName],
      email: [user.email],
      phone: [user.phone],
      birthDate: [birthDate],
      street: [user.street],
      city: [user.city],
      zipCode: [user.zipCode],
      role: [user.role],
    });
  }

  async saveUser() {
    const updatedUser = this.userForm.value;
    if (updatedUser.birthDate) {
      const birthDate = new Date(updatedUser.birthDate);
      updatedUser.birthDate = birthDate.toLocaleDateString('en-US');
    } else {
      updatedUser.birthDate = '';
    }
    try {
      const userDocRef = doc(this.firestore, `users/${this.data.userId}`);
      await updateDoc(userDocRef, updatedUser);
      this.snackbarService.showActionSnackbar('user', 'update');
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }
}
