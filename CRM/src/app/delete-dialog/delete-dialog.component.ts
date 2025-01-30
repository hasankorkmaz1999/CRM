import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class DeleteDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { type: string; name: string },
    private dialogRef: MatDialogRef<DeleteDialogComponent> 
  ) {}

  closeDialog(result: boolean) {
    this.dialogRef.close(result); 
  }
}
