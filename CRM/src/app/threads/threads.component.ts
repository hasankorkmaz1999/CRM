import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { Thread } from '../../models/thread.class';
import { addDoc, collection, updateDoc } from 'firebase/firestore';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { AuthService } from '../shared/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ThreadsCommentsComponent } from './threads-comments/threads-comments.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-threads',
  standalone: true,
  imports: [SharedModule, CommonModule,HttpClientModule, ThreadsCommentsComponent],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss'
})

  export class ThreadsComponent implements OnInit {
    threads: Thread[] = [];
    newThread: Partial<Thread> = {
      title: '',
      description: '',
    };
    currentUserName: string = 'Unknown User'; 

    selectedFile: File | null = null; 
selectedFilePreview: string | null = null; 

  
    constructor( 
      private firestore: Firestore,
       private authService: AuthService,
       private dialog: MatDialog,
       private http: HttpClient
      ) {}
  
    ngOnInit(): void {
      this.authService.currentUserName$.subscribe((name) => {
        this.currentUserName = name;
        console.log('Current User:', this.currentUserName);
      });
      
      this.loadThreads();
    }
  

  
    
    loadThreads() {
      const threadCollection = collection(this.firestore, 'threads');
      collectionData(threadCollection, { idField: 'threadId' }).subscribe((data) => {
        this.threads = data as Thread[];
      });
    }



  
   createThread() {
  if (this.newThread.title && this.newThread.description) {
    const threadCollection = collection(this.firestore, 'threads');

    
    if (!this.selectedFile) {
      this.authService.getUserProfilePictureByName(this.currentUserName).then((profilePicture) => {
        this.saveThread(threadCollection, null, profilePicture); 
      });
      return;
    }

   
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('upload_preset', 'simple-crm'); 

    this.authService.getUserProfilePictureByName(this.currentUserName).then((profilePicture) => {
      this.http.post('https://api.cloudinary.com/v1_1/drzrzowgj/image/upload', formData).subscribe({
        next: (response: any) => {
          console.log('Image uploaded successfully:', response.secure_url);
          this.saveThread(threadCollection, response.secure_url, profilePicture); 
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        },
      });
    });
  }
}

    
    private saveThread(
      threadCollection: any,
      imageUrl: string | null,
      profilePicture: string | null
    ): void {
      const threadToSave = {
        title: this.newThread.title,
        description: this.newThread.description,
        createdBy: this.currentUserName,
        createdAt: new Date().toISOString(),
        commentCount: 0,
        profilePicture: profilePicture, 
        imageUrl: imageUrl, 
      };
    
      addDoc(threadCollection, threadToSave)
        .then((docRef) => {
          console.log('Thread successfully created with ID:', docRef.id);
          const threadId = docRef.id;
          return updateDoc(docRef, { threadId });
        })
        .then(() => {
          console.log('Thread ID updated successfully.');
          this.newThread = { title: '', description: '' };
          this.selectedFile = null;
          this.selectedFilePreview = null; 
        })
        .catch((error) => {
          console.error('Error creating/updating thread:', error);
        });
    }
    
    
    
    
  
   
    openThread(thread: Thread, event?: Event): void {
      if (event) {
        event.stopPropagation();
      }
      console.log('Opening thread comments:', thread);
      
      this.dialog.open(ThreadsCommentsComponent, {
        data: { threadId: thread.threadId, threadTitle: thread.title },
        width: '600px',
        autoFocus: false,
      });
    }


    onFileSelected(event: Event): void {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.selectedFile = file;
    
       
        const reader = new FileReader();
        reader.onload = (e: any) => (this.selectedFilePreview = e.target.result);
        reader.readAsDataURL(file);
      }
    }
    
    
    
  }