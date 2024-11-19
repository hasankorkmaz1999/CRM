import { Component, Inject } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-dialog-add-picture',
  standalone: true,
  imports: [SharedModule, FormsModule ],
  templateUrl: './dialog-add-picture.component.html',
  styleUrl: './dialog-add-picture.component.scss'
})
export class DialogAddPictureComponent {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  userId: string = '';
  loading = false;
  selectedFileName: string | null = null;

  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<DialogAddPictureComponent>,
    private firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string }
  ) {
    this.userId = data.userId;
  }
  

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = (e: any) => this.previewUrl = e.target.result;
      reader.readAsDataURL(file);
   
    }
  }

  resetSelection() {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.previewUrl = null;
  }

  uploadPicture() {
    if (this.selectedFile) {
      this.loading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', 'simple-crm');

      this.http.post('https://api.cloudinary.com/v1_1/drzrzowgj/image/upload', formData).subscribe({
        next: (response: any) => {
          console.log('Image uploaded successfully:', response.secure_url);
          this.dialogRef.close(response.secure_url);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.loading = false;
        }
      });
    }
  }


  saveImageUrlToFirestore(imageUrl: string) {
    const userDocRef = doc(this.firestore, `users/${this.userId}`);
    console.log('Saving image URL to Firestore for user:', this.userId);

    updateDoc(userDocRef, { profilePicture: imageUrl })
      .then(() => {
        console.log('Profile picture URL successfully saved in Firestore!');
      })
      .catch((error) => {
        console.error('Error saving profile picture URL in Firestore:', error);
        alert('Failed to save profile picture URL. Please try again.');
      });
  }
}