import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DialogAddUserComponent } from './dialog-add-user/dialog-add-user.component';
import { SharedModule } from '../shared/shared.module';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { LoggingService } from '../shared/logging.service';
import { Auth, User as FirebaseUser } from '@angular/fire/auth';

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
  currentUser: FirebaseUser | null = null; // Aktuell angemeldeter Benutzer

  constructor(
    public dialog: MatDialog,
    private firestore: Firestore,
    private loggingService: LoggingService,
    private auth: Auth // Auth-Service für den aktuell angemeldeten Benutzer
  ) {}

  ngOnInit(): void {
    // Aktuell angemeldeten Benutzer abrufen
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
    });

    // Benutzer aus Firestore abrufen
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' })
      .subscribe((changes) => {
        console.log('Received changes from database:', changes);
        this.allUsers = changes as User[];

        // Sortiere alphabetisch nach Vorname
        this.allUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));

        this.filteredUsers = [...this.allUsers];
      });
  }

  openDialog() {
    this.dialog.open(DialogAddUserComponent, {
      autoFocus: false,
    });
  }

  openDeleteDialog(user: User) {
    const dialogRef = this.dialog.open(DialogContent, {
      data: { type: 'user', name: `${user.firstName} ${user.lastName}` },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteUser(user);
      }
    });
  }

  deleteUser(user: User) {
    // Überprüfen, ob der Benutzer sich selbst löschen möchte
    if (this.currentUser && this.currentUser.email === user.email) {
      console.warn("You cannot delete yourself.");
      alert("You cannot delete yourself while logged in.");
      return;
    }

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    deleteDoc(userDocRef)
      .then(() => {
        console.log(`User ${user.firstName} ${user.lastName} deleted successfully from Firestore!`);
        this.logUserDeletion(user);
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
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }

  logUserDeletion(user: User) {
    this.loggingService.log('delete', 'user', {
      id: user.uid,
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
