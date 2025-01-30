import { Component, EventEmitter, Inject, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { addDoc, collection, collectionData, doc, Firestore, increment, updateDoc } from '@angular/fire/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { Comment } from '../../../models/comment.class';

@Component({
  selector: 'app-threads-comments',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './threads-comments.component.html',
  styleUrl: './threads-comments.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ThreadsCommentsComponent implements OnInit {
  @Output() commentAdded = new EventEmitter<void>(); 

  comments: Comment[] = [];
  commentForm: FormGroup;
  currentUserName: string = 'Unknown User';
  currentUserProfilePicture: string = '/assets/img/user.png';

  constructor(
    private firestore: Firestore,
    private fb: FormBuilder,
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
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.currentUserName = currentUser.name || 'Unknown User';
    this.currentUserProfilePicture = currentUser.profilePicture || '/assets/img/user.png';
    this.loadComments();
  }

  loadComments(): void {
    const commentsCollection = collection(this.firestore, `threads/${this.data.threadId}/comments`);
    collectionData(commentsCollection, { idField: 'commentId' }).subscribe(
      (data: any[]) => {
        this.comments = this.mapComments(data);
      }
    );
  }
  
  private mapComments(data: any[]): Comment[] {
    return data
      .map((commentData: any) => {
        return new Comment({
          commentId: commentData.commentId || '',
          threadId: this.data.threadId,
          message: commentData.message || '',
          createdBy: commentData.createdBy || 'Unknown',
          createdAt: commentData.createdAt ? new Date(commentData.createdAt) : new Date(),
          profilePicture: commentData.profilePicture || '/assets/img/user.png',
        });
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }
  
  addComment(): void {
    if (this.commentForm.valid) {
      const commentsCollection = collection(this.firestore, `threads/${this.data.threadId}/comments`);
      const newComment = this.createNewComment();
      this.saveComment(commentsCollection, newComment);
    }
  }
  
  private createNewComment() {
    return {
      threadId: this.data.threadId,
      message: this.commentForm.value.message,
      createdBy: this.currentUserName,
      createdAt: new Date().toISOString(),
      profilePicture: this.currentUserProfilePicture,
    };
  }
  
  private saveComment(commentsCollection: any, newComment: any): void {
    addDoc(commentsCollection, newComment).then(() => {
      this.updateThreadCommentCount();
      this.commentForm.reset();
    });
  }
  
  private updateThreadCommentCount(): void {
    const threadDoc = doc(this.firestore, `threads/${this.data.threadId}`);
    updateDoc(threadDoc, { commentCount: increment(1) }).then(() => {
      this.commentAdded.emit();
    });
  }
  
}
