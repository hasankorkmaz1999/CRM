import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { addDoc, collection, collectionData, doc, Firestore, increment, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { Comment } from '../../../models/comment.class';

@Component({
  selector: 'app-threads-comments',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './threads-comments.component.html',
  styleUrl: './threads-comments.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ThreadsCommentsComponent  implements OnInit {
  comments: Comment[] = [];
  commentForm: FormGroup;

  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ThreadsCommentsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { threadId: string; threadDescription: string }
  ) {
    this.commentForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]],
    });
    if (!data.threadId) {
      console.error('No threadId provided to ThreadsCommentsComponent');
    }
  }

  ngOnInit(): void {
    this.loadComments();
  }

  
  loadComments(): void {
    const commentsCollection = collection(this.firestore, `threads/${this.data.threadId}/comments`);
  
    collectionData(commentsCollection, { idField: 'commentId' }).subscribe(async (data: any[]) => {
      const commentsWithProfilePictures = await Promise.all(
        data.map(async (commentData: any) => {
          const profilePicture = await this.authService.getUserProfilePictureByName(commentData.createdBy);
          return new Comment({
            commentId: commentData.commentId || '',
            threadId: this.data.threadId,
            message: commentData.message || '',
            createdBy: commentData.createdBy || 'Unknown',
            createdAt: commentData.createdAt || new Date().toISOString(),
            profilePicture: profilePicture || '/assets/img/user.png', // Bild laden
          });
        })
      );
      this.comments = commentsWithProfilePictures;
    }, error => {
      console.error('Error loading comments:', error);
    });
  }
  
  
  

 
  addComment(): void {
    if (this.commentForm.valid) {
      const commentsCollection = collection(this.firestore, `threads/${this.data.threadId}/comments`);
      const newComment = {
        threadId: this.data.threadId,
        message: this.commentForm.value.message,
        createdBy: this.authService.getCurrentUserNameSync(), // Aktueller Benutzer
        createdAt: new Date().toISOString(),
      };
  
      addDoc(commentsCollection, newComment).then(() => {
        // Kommentar erfolgreich hinzugefügt, jetzt den commentCount aktualisieren
        const threadDoc = doc(this.firestore, `threads/${this.data.threadId}`);
        updateDoc(threadDoc, {
          commentCount: increment(1), // Erhöhe den commentCount um 1
        }).then(() => {
          console.log('Thread commentCount updated successfully');
        });
        this.commentForm.reset();
      });
    }
  }
  
  
  

 
  closeDialog(): void {
    this.dialogRef.close();
  }
}