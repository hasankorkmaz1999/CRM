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
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SharedModule,
    MatDialogModule,
    DeleteDialogComponent,
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
})
export class UserComponent implements OnInit {
  allUsers: User[] = [];
  searchQuery: string = '';
  filteredUsers: User[] = [];
  currentUser: { email: string; name: string } | null = null; // Aktuell angemeldeter Benutzer

  constructor(
    public dialog: MatDialog,
    private firestore: Firestore,
    private loggingService: LoggingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Benutzerinformationen aus localStorage laden
    this.loadCurrentUser();

    // Benutzer aus Firestore abrufen
    const userCollection = collection(this.firestore, 'users');
    collectionData(userCollection, { idField: 'id' }).subscribe((changes) => {
      this.allUsers = changes as User[];

      // Sortiere alphabetisch nach Vorname
      this.allUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));

      this.filteredUsers = [...this.allUsers];
    });

    this.route.queryParams.subscribe((params) => {
      if (params['addUser'] === 'true') {
        this.openDialog(); // Dialog öffnen
      }
    });
  }

  loadCurrentUser(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.email) {
      this.currentUser = {
        email: currentUser.email,
        name: currentUser.name || 'Unknown User',
      };
      console.log('Aktueller Benutzer aus localStorage geladen:', this.currentUser);
    } else {
      console.warn('Kein Benutzer in localStorage gefunden.');
      this.currentUser = null;
    }
  }

  navigateToUser(uid: string): void {
    if (uid) {
      this.router.navigate(['/user', uid]); // Navigiert zur Seite mit der Benutzer-ID
    } else {
      console.error('Keine gültige Benutzer-ID übergeben.');
    }
  }

  openDialog() {
    this.dialog.open(DialogAddUserComponent, {
      autoFocus: false,
    });
  }

  openDeleteDialog(event: Event, user: User): void {
    // Verhindere, dass das Ereignis das `click`-Event des übergeordneten Elements auslöst
    event.stopPropagation();
  
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      autoFocus: false,
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
      console.warn('Du kannst dich nicht selbst löschen.');
      alert('Du kannst dich nicht selbst löschen, während du eingeloggt bist.');
      return;
    }

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    deleteDoc(userDocRef)
      .then(() => {
        console.log(
          `Benutzer ${user.firstName} ${user.lastName} erfolgreich aus Firestore gelöscht!`
        );
        this.logUserDeletion(user);
      })
      .catch((error) =>
        console.error('Fehler beim Löschen des Benutzers aus Firestore:', error)
      );
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
