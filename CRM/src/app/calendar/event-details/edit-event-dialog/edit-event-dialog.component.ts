import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Firestore, doc, updateDoc, collection, collectionData } from '@angular/fire/firestore';
import { User } from '../../../../models/user.class';
import { MatListModule, MatListOption } from '@angular/material/list';
import { formatTimeTo12Hour, formatDateToLong } from '../../../shared/formattime.service';
import { SnackbarService } from '../../../shared/snackbar.service';

@Component({
  selector: 'app-edit-event-dialog',
  standalone: true,
  imports: [SharedModule, ReactiveFormsModule, MatListOption, MatListModule],
  templateUrl: './edit-event-dialog.component.html',
  styleUrl: './edit-event-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EditEventDialogComponent implements OnInit {
  editForm: FormGroup;
  users: User[] = []; 
  selectedUsers: string[] = [];
  eventTypes: string[] = ['Meeting', 'Webinar', 'Workshop', 'Other']; 
  usTimeOptions: string[] = [];

  constructor(
    private snackbarService: SnackbarService,
    private fb: FormBuilder,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<EditEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const localDate = this.data.date
      ? new Date(this.data.date).toLocaleDateString('en-CA') 
      : null;
    this.editForm = this.fb.group({
      type: [this.data.type || 'Other', Validators.required],
      description: [this.data.description || '', Validators.maxLength(200)],
      date: [localDate, Validators.required],
      time: [this.data.time , Validators.required], 
    });
    this.selectedUsers = this.data.users || [];
  }

  ngOnInit(): void {
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((data) => {
      this.users = data as User[];
      this.selectedUsers = this.data.users.map((user: any) => user.name);
    });

    this.generateUSTimeOptions();
  }

  onSelectionChange(event: any): void {
    event.options.forEach((option: any) => {
      const user: User = option.value;
      const fullName = `${user.firstName} ${user.lastName}`;
      if (option.selected) {
        if (!this.selectedUsers.includes(fullName)) {
          this.selectedUsers.push(fullName);
        }
      } else {
        this.selectedUsers = this.selectedUsers.filter((name) => name !== fullName);
      }
    });
  }

  isUserSelected(user: User): boolean {
    const fullName = `${user.firstName} ${user.lastName}`;
    return this.selectedUsers.includes(fullName);
  }

  toggleUserSelection(user: User, isSelected: boolean): void {
    const fullName = `${user.firstName} ${user.lastName}`;
    if (isSelected) {
      if (!this.selectedUsers.includes(fullName)) {
        this.selectedUsers.push(fullName);
      }
    } else {
      this.selectedUsers = this.selectedUsers.filter((name) => name !== fullName);
    }
  }

  saveChanges() {
    if (!this.data?.id) {
      console.error('Event ID is undefined or missing!');
      return;}
    const formValue = this.editForm.value;
    const updatedDate = formatDateToLong(new Date(formValue.date)); 
    const updatedTime = formValue.time; 
    const updatedEvent = {
      id: this.data.id,
      type: formValue.type,
      description: formValue.description,
      date: updatedDate, 
      time: updatedTime, 
      users: [...this.selectedUsers],};
    const eventRef = doc(this.firestore, `events/${this.data.id}`);
    updateDoc(eventRef, updatedEvent)
      .then(() => {
        this.dialogRef.close(updatedEvent);
        this.snackbarService.showActionSnackbar('event', 'update');
      })
      .catch((error) => {
        console.error('Error updating event in Firestore:', error);
      });
  }
  

  generateUSTimeOptions() {
    const times: string[] = [];
    const startHour = 8;
    const endHour = 17;
    for (let hour = startHour; hour <= endHour; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const meridiem = hour >= 12 ? 'PM' : 'AM';
      ['00', '15', '30', '45'].forEach((minute) => {
        times.push(`${displayHour}:${minute} ${meridiem}`);
      });
    }
    this.usTimeOptions = times;
  }
  cancel() {
    this.dialogRef.close(); 
  }
}