import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button'; // Für den FAB Button
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { SharedModule } from '../shared/shared.module';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { User } from '../../models/user.class';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, SharedModule, MatDialogModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
})
export class UserComponent implements OnInit {
  user = new User();
  allUsers: User[] = [];

  constructor(public dialog: MatDialog, private firestore: Firestore) {}

  ngOnInit(): void {
    const userCollection = collection(this.firestore, 'users'); // Firestore-Collection
    collectionData(userCollection, { idField: 'id' }) // Abonnieren der Daten
      .subscribe((changes) => {
        console.log('Received changes from database:', changes);
        this.allUsers = changes as User[];
      });
  }

  openDialog() {
    this.dialog.open(DialogAddUserComponent);
  }

  openDeleteDialog(user: User) {
    const dialogRef = this.dialog.open(DialogContent, {
      data: { user }, // Übergabe des Nutzers
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteUser(user.id);
      }
    });
  }

  deleteUser(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    deleteDoc(userDocRef)
      .then(() => console.log(`User ${userId} deleted successfully`))
      .catch((error) => console.error('Error deleting user:', error));
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
        <p>Are you sure you want to delete this user?</p>
        <p><strong>{{ data.user.firstName }} {{ data.user.lastName }}</strong></p>
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
  `]
})
export class DialogContent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: User }) {}
}

