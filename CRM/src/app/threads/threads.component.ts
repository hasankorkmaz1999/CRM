import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { Thread } from '../../models/thread.class';
import { addDoc, collection, updateDoc } from 'firebase/firestore';
import { collectionData, Firestore } from '@angular/fire/firestore';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-threads',
  standalone: true,
  imports: [SharedModule, CommonModule],
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
  
    constructor(private firestore: Firestore, private authService: AuthService) {}
  
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
        
        const threadToSave = {
          title: this.newThread.title,
          description: this.newThread.description,
          createdBy: this.currentUserName,
          createdAt: new Date().toISOString(),
          commentCount: 0,
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
          })
          .catch((error) => {
            console.error('Error creating/updating thread:', error);
          });
      }
    }
    
    
  
   
    openThread(thread: Thread) {
      console.log('Opening thread:', thread);
      
    }
  }