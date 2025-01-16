import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule, DatePipe } from '@angular/common';
import { Thread } from '../../models/thread.class';
import { addDoc, collection, getDocs, limit, orderBy, query, startAfter, updateDoc } from 'firebase/firestore';
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



  newThreadId: string | null = null; // Speichert die ID des neuen Threads

  threads: Thread[] = [];
  newThread: Partial<Thread> = { description: '' };

  groupedThreads: { [key: string]: Thread[] } = {};

  lastVisible: any = null; 


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
    // Benutzerinformationen direkt aus localStorage laden
    this.loadCurrentUser();
    this.loadThreads();
  }

  loadCurrentUser(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.currentUserName = currentUser.name || 'Unknown User';
      this.currentUserProfilePicture = currentUser.profilePicture || '/assets/img/user.png';
      console.log('Benutzerdetails aus localStorage geladen:', this.currentUserName, this.currentUserProfilePicture);
    } else {
      console.warn('Kein Benutzer in localStorage gefunden.');
    }
  }




  async loadThreads() {
    this.loading = true;
    const threadCollection = collection(this.firestore, 'threads');
    let threadQuery = query(threadCollection, orderBy('createdAt', 'desc'), limit(10));

    // Wenn wir bereits Threads geladen haben, den letzten Thread als Startpunkt verwenden
    if (this.lastVisible) {
      threadQuery = query(threadCollection, orderBy('createdAt', 'desc'), startAfter(this.lastVisible), limit(10));
    }

    const snapshot = await getDocs(threadQuery);

    const threads = snapshot.docs.map((doc) => {
      const data = doc.data();
      return new Thread({
        threadId: doc.id,
        ...data,
        createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : new Date(data['createdAt']),
      });
    });

    // Wenn keine Threads mehr da sind, keinen weiteren "Load More"-Button anzeigen
    if (snapshot.docs.length > 0) {
      this.lastVisible = snapshot.docs[snapshot.docs.length - 1]; // Speichern des letzten geladenen Dokuments
    } else {
      this.lastVisible = null;
    }

    this.threads = [...this.threads, ...threads]; // Neue Threads an die bestehende Liste anhängen
    this.groupedThreads = this.groupThreadsByDate(this.threads); // Threads gruppieren
    this.loading = false;
  }
  
  
  groupThreadsByDate(threads: Thread[]): { [key: string]: Thread[] } {
    const grouped: { [key: string]: Thread[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
  
    const datePipe = new DatePipe('en-US'); // Verwende englisches Datumsformat
  
    threads.forEach((thread) => {
      const threadDate = new Date(thread.createdAt);
      let dateKey: string;
  
      if (threadDate.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (threadDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = datePipe.transform(threadDate, 'MMM d, y') || threadDate.toLocaleDateString();
      }
  
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(thread);
    });
  
    return grouped;
  }
  



  getGroupKeys(): string[] {
    return Object.keys(this.groupedThreads);
  }
  
  
  
  loadMoreThreads() {
    if (this.lastVisible) {
      this.loadThreads(); // Lädt weitere Threads
    }
  }




  
 

  createThread() {
    if (this.newThread.description) {
      this.loading = true; // Progressbar anzeigen
      const threadCollection = collection(this.firestore, 'threads');
  
      if (!this.selectedFile) {
        // Profilbild wird direkt aus `currentUserProfilePicture` genutzt
        this.saveThread(threadCollection, null, this.currentUserProfilePicture); // Geänderte Funktion
        return;
      }
  
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', 'simple-crm');
  
      this.http.post('https://api.cloudinary.com/v1_1/drzrzowgj/image/upload', formData).subscribe({
        next: (response: any) => {
          // Profilbild wird aus `currentUserProfilePicture` genutzt
          this.saveThread(threadCollection, response.secure_url, this.currentUserProfilePicture); // Geänderte Funktion
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
          this.loading = false;
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
      description: this.newThread.description || '',
      createdBy: this.currentUserName,
      createdAt: new Date().toISOString(),
      commentCount: 0,
      profilePicture: profilePicture,
      imageUrl: imageUrl,
    };
  
    addDoc(threadCollection, threadToSave)
      .then((docRef) => {
        console.log('Thread successfully created with ID:', docRef.id);
  
        const newThread: Thread = new Thread({
          threadId: docRef.id,
          ...threadToSave,
          createdAt: new Date(),
        });
  
        this.threads.unshift(newThread);
        this.groupedThreads = this.groupThreadsByDate(this.threads);
  
        // Nur den neuen Thread animieren
        this.newThreadId = docRef.id;
        setTimeout(() => {
          this.newThreadId = null; // Animation zurücksetzen, wenn sie abgeschlossen ist
        }, 1000);
      })
      .catch((error) => {
        console.error('Error creating/updating thread:', error);
      })
      .finally(() => {
        this.loading = false;
        this.newThread = { description: '' };
        this.selectedFile = null;
        this.selectedFilePreview = null;
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
  
    const dialogRef = this.dialog.open(ThreadsCommentsComponent, {
      data: { threadId: thread.threadId, threadDescription: thread.description },
      width: '600px',
      autoFocus: false,
    });
  
    const instance = dialogRef.componentInstance;
    instance.commentAdded.subscribe(() => {
      // Kommentar wurde hinzugefügt, aktualisiere den commentCount
      thread.commentCount = (thread.commentCount || 0) + 1;
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
