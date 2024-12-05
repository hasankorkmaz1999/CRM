import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button'; // Für den FAB Button
import { DialogAddUserComponent } from './dialog-add-user/dialog-add-user.component';
import { SharedModule } from '../shared/shared.module';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { LoggingService } from '../shared/logging.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, SharedModule, MatDialogModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
})
export class UserComponent implements OnInit {
  allUsers: User[] = [];
  searchQuery: string = '';
  filteredUsers: User[] = [];

  constructor(
    public dialog: MatDialog, 
    private firestore: Firestore,
    private loggingService: LoggingService // Logging-Service hinzufügen
  ) {}

  ngOnInit(): void {
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' })
      .subscribe((changes) => {
        console.log('Received changes from database:', changes);
        this.allUsers = changes as User[];
  
        // Sortiere alphabetisch nach Vorname
        this.allUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));
  
        // Alternativ: Sortiere nach Nachname
        // this.allUsers.sort((a, b) => a.lastName.localeCompare(b.lastName));
  
        this.filteredUsers = [...this.allUsers];
      });
  }
  
  openDialog() {
    this.dialog.open(DialogAddUserComponent);
  }

  openDeleteDialog(user: User) {
    const dialogRef = this.dialog.open(DialogContent, {
      data: { type: 'user', name: `${user.firstName} ${user.lastName}` }, // Übergabe von Namen und Typ
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteUser(user); // Benutzer-Objekt an deleteUser übergeben
      }
    });
  }

  deleteUser(user: User) {
    const userDocRef = doc(this.firestore, `users/${user.id}`);
    deleteDoc(userDocRef)
      .then(() => {
        console.log(`User ${user.firstName} ${user.lastName} deleted successfully from Firestore!`);
        this.logUserDeletion(user); // Log der Löschaktion
      })
      .catch((error) => console.error('Error deleting user from Firestore:', error));
  }

  filterUsers() {
    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.allUsers
      .filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query)
      )
      .sort((a, b) => a.firstName.localeCompare(b.firstName)); // Alphabetische Sortierung
  }
  

  logUserDeletion(user: User) {
    // Logging der Löschaktion
    this.loggingService.log('delete', 'user', {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  }
}

@Component({
  selector: 'dialog-content',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
  <div class="delete-dialog">
    <h2 mat-dialog-title>Confirm Deletion</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete this {{ data.type }}?</p>
      <p><strong>{{ data.name }}</strong></p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>No</button>
      <button mat-button [mat-dialog-close]="true" color="warn">Yes</button>
    </mat-dialog-actions>
  </div>
`,
styles: [`
  .delete-dialog {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
  }
`],
})
export class DialogContent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { type: string; name: string }) {}
}
