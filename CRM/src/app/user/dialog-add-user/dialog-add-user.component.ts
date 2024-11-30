import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { User } from '../../../models/user.class';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { LoggingService } from '../../shared/logging.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [SharedModule, FormsModule, MatOptionModule,FormsModule, ReactiveFormsModule, MatSelectModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrl: './dialog-add-user.component.scss',
})
export class DialogAddUserComponent {
  user = new User();
  birthDate: Date = new Date();
  loading = false;

  constructor(
    private firestore: Firestore,
    private loggingService: LoggingService
  ) {}

  saveUser() {
    // Formatieren des Geburtsdatums als MM/DD/YYYY
    const formattedDate = this.birthDate.toLocaleDateString('en-US');
    this.user.birthDate = formattedDate;
  
    console.log('user', this.user);
    this.loading = true;
  
    const userCollection = collection(this.firestore, 'users'); // Verweis auf die Collection
    addDoc(userCollection, { ...this.user }) // Dokument hinzufügen
      .then((result) => {
        console.log('User added successfully:', result);
        this.loading = false;
  
        // Logging der Aktion über die separate Funktion
        this.logUserAction('add', result.id);
      })
      .catch((error) => {
        console.error('Error adding user:', error);
        this.loading = false;
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
