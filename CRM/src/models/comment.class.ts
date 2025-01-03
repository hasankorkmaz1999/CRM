export class Comment {
    commentId: string; 
    threadId: string;
    message: string; 
    createdBy: string; 
    createdAt: string;
  
    constructor(obj?: any) {
      this.commentId = obj?.commentId || '';
      this.threadId = obj?.threadId || '';
      this.message = obj?.message || '';
      this.createdBy = obj?.createdBy || 'Unknown';
      this.createdAt = obj?.createdAt || new Date().toISOString();
    }
  }
  