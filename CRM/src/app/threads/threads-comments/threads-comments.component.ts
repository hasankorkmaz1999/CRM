import { Component, Inject, OnInit } from '@angular/core';
import { addDoc, collection, collectionData, Firestore } from '@angular/fire/firestore';
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
  styleUrl: './threads-comments.component.scss'
})
export class ThreadsCommentsComponent  implements OnInit {
  comments: Comment[] = [];
  commentForm: FormGroup;

  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ThreadsCommentsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { threadId: string; threadTitle: string }
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
    
    collectionData(commentsCollection, { idField: 'commentId' }).subscribe((data: any[]) => {
      this.comments = data.map((commentData: any) => {
        return new Comment({
          commentId: commentData.commentId || '',
          threadId: this.data.threadId, 
          message: commentData.message || '',
          createdBy: commentData.createdBy || 'Unknown',
          createdAt: commentData.createdAt || new Date().toISOString(),
        });
      });
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
        createdBy: this.authService.getCurrentUserNameSync(), 
        createdAt: new Date().toISOString(),
      };
  
      addDoc(commentsCollection, newComment).then(() => {
        console.log('Comment added successfully!');
        this.commentForm.reset();
      }).catch((error) => {
        console.error('Error adding comment:', error);
      });
    }
  }
  
  

 
  closeDialog(): void {
    this.dialogRef.close();
  }
}