import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule, DatePipe } from '@angular/common';
import { Thread } from '../../models/thread.class';
import { addDoc, collection, updateDoc } from 'firebase/firestore';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { AuthService } from '../shared/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ThreadsCommentsComponent } from './threads-comments/threads-comments.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { ImageViewerDialogComponent } from './image-viewer-dialog/image-viewer-dialog.component';

@Component({
  selector: 'app-threads',
  standalone: true,
  imports: [SharedModule,
     CommonModule,
      HttpClientModule,
     
          CdkTextareaAutosize,
          MatDialogModule
        ],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss',
  providers: [DatePipe], // Für Datumshandhabung
})



export class ThreadsComponent implements OnInit {




  threads: Thread[] = [];
  newThread: Partial<Thread> = {description: ''};
  groupedThreads: { [key: string]: Thread[] } = {};




  loading = false;
  isNewThread = false;
  currentUserName: string = 'Unknown User';
  currentUserProfilePicture: string = '/assets/img/user.png';

  selectedFile: File | null = null; // Die ausgewählte Datei
  selectedFilePreview: string | null = null; // Vorschau-URL der Datei

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private dialog: MatDialog,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}






  ngOnInit(): void {
    // Abonniere die aktuellen Benutzerdetails
    this.authService.currentUserDetails$.subscribe((details) => {
      this.currentUserName = details.name || 'Unknown User';
      this.currentUserProfilePicture = details.profilePicture || '/assets/img/user.png';
      console.log('Current User:', this.currentUserName, this.currentUserProfilePicture);
    });

    this.loadThreads();
  }

  loadThreads() {
    const threadCollection = collection(this.firestore, 'threads');
    collectionData(threadCollection, { idField: 'threadId' }).subscribe((data) => {
      this.threads = (data as Thread[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.groupThreadsByDate();
    });
  }


  groupThreadsByDate(): void {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    this.groupedThreads = this.threads.reduce((groups, thread) => {
      const threadDate = new Date(thread.createdAt);
      let groupKey = '';

      if (this.isSameDate(threadDate, today)) {
        groupKey = 'Today';
      } else if (this.isSameDate(threadDate, yesterday)) {
        groupKey = 'Yesterday';
      } else {
        groupKey = this.datePipe.transform(threadDate, 'MMMM d, y') || 'Older';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(thread);

      return groups;
    }, {} as { [key: string]: Thread[] });
  }

  isSameDate(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  createThread() {
    if (this.newThread.description) {
      this.loading = true; // Progressbar anzeigen
      const threadCollection = collection(this.firestore, 'threads');

      // Falls kein Bild ausgewählt wurde, speichere nur den Thread
      if (!this.selectedFile) {
        this.saveThread(threadCollection, null, this.currentUserProfilePicture);
        this.loading = false; // Progressbar ausblenden
        return;
      }

      // Bild bei Cloudinary hochladen
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', 'simple-crm');

      this.http.post('https://api.cloudinary.com/v1_1/drzrzowgj/image/upload', formData).subscribe({
        next: (response: any) => {
          console.log('Image uploaded successfully:', response.secure_url);
          this.saveThread(threadCollection, response.secure_url, this.currentUserProfilePicture);
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        },
        complete: () => {
          this.loading = false; // Progressbar ausblenden
        },
      });
    }
  }

  private saveThread(
    threadCollection: any,
    imageUrl: string | null,
    profilePicture: string | null
  ): void {
    const threadToSave = {
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

        const newThread = {
          ...threadToSave,
          threadId: threadId,
        };

        // Füge den neuen Thread hinzu und setze `isNewThread`
        this.threads = [newThread as Thread, ...this.threads];
        this.isNewThread = true;

        // Aktualisiere die threadId in Firestore
        return updateDoc(docRef, { threadId });
      })
      .then(() => {
        console.log('Thread ID updated successfully.');
        this.newThread = { description: '' };
        this.selectedFile = null;
        this.selectedFilePreview = null;
      })
      .catch((error) => {
        console.error('Error creating/updating thread:', error);
      })
      .finally(() => {
        this.loading = false; // Progressbar ausblenden
      });
  }


  trackByThreadId(index: number, thread: any): string {
    return thread.threadId; // Eindeutige ID des Threads
  }
  



  resetNewThreadFlag(): void {
    setTimeout(() => {
      this.isNewThread = false;
    }, 800); // Warte, bis die Animation abgeschlossen ist
  }
  

  openThread(thread: Thread, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    console.log('Opening thread comments:', thread);

    this.dialog.open(ThreadsCommentsComponent, {
      data: { threadId: thread.threadId, threadDescription: thread.description },
      width: '600px',
      autoFocus: false,
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;

      // Vorschau anzeigen
      const reader = new FileReader();
      reader.onload = (e: any) => (this.selectedFilePreview = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  triggerFileInputClick(): void {
    const fileInput = document.querySelector<HTMLInputElement>('input[name="file"]');
    if (fileInput) {
      fileInput.click();
    }
  }

  openImageDialog(imageUrl: string): void {
    this.dialog.open(ImageViewerDialogComponent, {
      data: { imageUrl },
      width: '80vw',
      height: '80vh',
      panelClass: 'custom-dialog', // Optional: Für individuelles Styling
    });
  }
}
