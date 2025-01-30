import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule, DatePipe } from '@angular/common';
import { Thread } from '../../models/thread.class';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
} from 'firebase/firestore';
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
  imports: [
    SharedModule,
    CommonModule,
    HttpClientModule,

    CdkTextareaAutosize,
    MatDialogModule,
  ],
  templateUrl: './threads.component.html',
  styleUrl: './threads.component.scss',
  providers: [DatePipe],
})
export class ThreadsComponent implements OnInit {
  newThreadId: string | null = null;
  threads: Thread[] = [];
  newThread: Partial<Thread> = { description: '' };
  groupedThreads: { [key: string]: Thread[] } = {};
  lastVisible: any = null;
  loading = false;
  isNewThread = false;
  currentUserName: string = 'Unknown User';
  currentUserProfilePicture: string = '/assets/img/user.png';
  selectedFile: File | null = null;
  selectedFilePreview: string | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private dialog: MatDialog,
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadThreads();
  }

  loadCurrentUser(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser) {
      this.currentUserName = currentUser.name || 'Unknown User';
      this.currentUserProfilePicture =
        currentUser.profilePicture || '/assets/img/user.png';
    } else {
      console.warn('Kein Benutzer in localStorage gefunden.');
    }
  }

  async loadThreads() {
    this.loading = true;
    const threadQuery = this.createThreadQuery();
    const snapshot = await getDocs(threadQuery);
    const threads = this.mapThreadsFromSnapshot(snapshot);
    this.updateThreadsState(snapshot, threads);
    this.loading = false;
  }

  private createThreadQuery() {
    const threadCollection = collection(this.firestore, 'threads');
    if (this.lastVisible) {
      return query(
        threadCollection,
        orderBy('createdAt', 'desc'),
        startAfter(this.lastVisible),
        limit(10)
      );
    }
    return query(threadCollection, orderBy('createdAt', 'desc'), limit(10));
  }

  private mapThreadsFromSnapshot(snapshot: any) {
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return new Thread({
        threadId: doc.id,
        ...data,
        createdAt: data['createdAt']?.toDate
          ? data['createdAt'].toDate()
          : new Date(data['createdAt']),
      });
    });
  }

  private updateThreadsState(snapshot: any, threads: Thread[]) {
    if (snapshot.docs.length > 0) {
      this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
    } else {
      this.lastVisible = null;
    }
    this.threads = [...this.threads, ...threads];
    this.groupedThreads = this.groupThreadsByDate(this.threads);
  }

  groupThreadsByDate(threads: Thread[]): { [key: string]: Thread[] } {
    const grouped: { [key: string]: Thread[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const datePipe = new DatePipe('en-US');
    threads.forEach((thread) => {
      const dateKey = this.getThreadDateKey(
        thread.createdAt,
        today,
        yesterday,
        datePipe
      );
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(thread);
    });
    return grouped;
  }

  private getThreadDateKey(
    createdAt: Date | string,
    today: Date,
    yesterday: Date,
    datePipe: DatePipe
  ): string {
    const threadDate = new Date(createdAt);
    if (threadDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (threadDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return (
      datePipe.transform(threadDate, 'MMM d, y') ||
      threadDate.toLocaleDateString()
    );
  }

  getGroupKeys(): string[] {
    return Object.keys(this.groupedThreads);
  }

  loadMoreThreads() {
    if (this.lastVisible) {
      this.loadThreads();
    }
  }

  createThread() {
    if (this.newThread.description) {
      this.loading = true;
      const threadCollection = collection(this.firestore, 'threads');
      if (!this.selectedFile) {
        this.saveThread(threadCollection, null, this.currentUserProfilePicture);
        return;
      }
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', 'simple-crm');
      this.http
        .post(
          'https://api.cloudinary.com/v1_1/drzrzowgj/image/upload',
          formData
        )
        .subscribe({
          next: (response: any) => {
            this.saveThread(
              threadCollection,
              response.secure_url,
              this.currentUserProfilePicture
            );
          },
        });
    }
  }

  private saveThread(
    threadCollection: any,
    imageUrl: string | null,
    profilePicture: string | null
  ): void {
    const threadToSave = this.createThreadObject(imageUrl, profilePicture);
    this.addThreadToFirestore(threadCollection, threadToSave);
  }

  private createThreadObject(
    imageUrl: string | null,
    profilePicture: string | null
  ) {
    return {
      description: this.newThread.description || '',
      createdBy: this.currentUserName,
      createdAt: new Date().toISOString(),
      commentCount: 0,
      profilePicture: profilePicture,
      imageUrl: imageUrl,
    };
  }

  private addThreadToFirestore(threadCollection: any, threadToSave: any) {
    addDoc(threadCollection, threadToSave)
      .then((docRef) => {
        this.handleThreadCreationSuccess(docRef.id, threadToSave);
      })
      .catch(() => {})
      .finally(() => this.resetThreadForm());
  }

  private handleThreadCreationSuccess(threadId: string, threadToSave: any) {
    const newThread: Thread = new Thread({
      threadId: threadId,
      ...threadToSave,
      createdAt: new Date(),
    });
    this.threads.unshift(newThread);
    this.groupedThreads = this.groupThreadsByDate(this.threads);
    this.newThreadId = threadId;
    setTimeout(() => {
      this.newThreadId = null;
    }, 1000);
  }

  private resetThreadForm() {
    this.loading = false;
    this.newThread = { description: '' };
    this.selectedFile = null;
    this.selectedFilePreview = null;
  }

  trackByThreadId(index: number, thread: any): string {
    return thread.threadId;
  }

  resetNewThreadFlag(): void {
    setTimeout(() => {
      this.isNewThread = false;
    }, 800);
  }

  openThread(thread: Thread, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const dialogRef = this.dialog.open(ThreadsCommentsComponent, {
      data: {
        threadId: thread.threadId,
        threadDescription: thread.description,
      },
      width: '600px',
      autoFocus: false,
    });
    const instance = dialogRef.componentInstance;
    instance.commentAdded.subscribe(() => {
      thread.commentCount = (thread.commentCount || 0) + 1;
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

  triggerFileInputClick(): void {
    const fileInput =
      document.querySelector<HTMLInputElement>('input[name="file"]');
    if (fileInput) {
      fileInput.click();
    }
  }

  openImageDialog(imageUrl: string): void {
    this.dialog.open(ImageViewerDialogComponent, {
      data: { imageUrl },
      width: '80vw',
      height: '80vh',
      panelClass: 'custom-dialog',
    });
  }
}
