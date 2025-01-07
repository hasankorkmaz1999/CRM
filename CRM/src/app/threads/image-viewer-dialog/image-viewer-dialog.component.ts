import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-image-viewer-dialog',
  standalone: true,
  imports: [],
  templateUrl: './image-viewer-dialog.component.html',
  styleUrl: './image-viewer-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ImageViewerDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string },
    private dialogRef: MatDialogRef<ImageViewerDialogComponent> // MatDialogRef verwenden
  ) {}

  closeDialog(): void {
    this.dialogRef.close(); // Schließt den Dialog
  }
}
