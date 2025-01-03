export class Thread {
    threadId: string; 
    title: string; 
    description: string; 
    createdBy: string;
    createdAt: string;
    commentCount?: number; 
  
    constructor(obj?: any) {
      this.threadId = obj?.threadId || '';
      this.title = obj?.title || '';
      this.description = obj?.description || '';
      this.createdBy = obj?.createdBy || 'Unknown';
      this.createdAt = obj?.createdAt || new Date().toISOString();
      this.commentCount = obj?.commentCount || 0;
    }
  }
  