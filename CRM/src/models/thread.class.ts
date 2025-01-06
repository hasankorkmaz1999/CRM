export class Thread {
    threadId: string; 
   
    description: string; 
    createdBy: string;
    createdAt: string;
    commentCount?: number; 
    profilePicture?: string;
    imageUrl?: string;
  
    constructor(obj?: any) {
      this.threadId = obj?.threadId || '';
     
      this.description = obj?.description || '';
      this.createdBy = obj?.createdBy || 'Unknown';
      this.createdAt = obj?.createdAt || new Date().toISOString();
      this.commentCount = obj?.commentCount || 0;
      this.profilePicture = obj?.profilePicture || '/assets/img/user.png';
      this.imageUrl = obj?.imageUrl || '';
    }
  }
  